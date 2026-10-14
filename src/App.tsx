/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  BackgroundProcess, 
  PresetProfile, 
  LogEntry, 
  ProcessCategory,
  AppPermissionKey,
  APP_PERMISSIONS_CONFIG,
  SystemMetrics
} from './types/process';
import { INITIAL_PROCESSES } from './data/defaultProcesses';
import { workerManager } from './services/workerManager';
import { sound } from './utils/audio';

import { Header } from './components/Header';
import { SystemStatsCards } from './components/SystemStatsCards';
import { CpuMemoryGraph, TelemetryPoint } from './components/CpuMemoryGraph';
import { ProcessFilterBar, FilterStatus, SortOption } from './components/ProcessFilterBar';
import { ProcessRow } from './components/ProcessRow';
import { ProcessInspectorModal } from './components/ProcessInspectorModal';
import { NewProcessModal } from './components/NewProcessModal';
import { LiveConsoleDrawer } from './components/LiveConsoleDrawer';
import { BatterySavingsWidget } from './components/BatterySavingsWidget';
import { AppPermissionsManager } from './components/AppPermissionsManager';

export default function App() {
  const [processes, setProcesses] = useState<BackgroundProcess[]>(() => {
    try {
      const saved = localStorage.getItem('process_daemon_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Ensure all saved processes have valid permissions object
          return parsed.map((p: BackgroundProcess) => {
            if (!p.permissions) {
              const defaultPerms: Record<AppPermissionKey, boolean> = {
                location: false,
                network: p.category === 'Network',
                notifications: true,
                storage: true,
                bluetooth: false,
                battery_unrestricted: true,
                camera: false,
                microphone: false,
              };
              return { ...p, permissions: defaultPerms };
            }
            return p;
          });
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_PROCESSES;
  });

  const [activeProfile, setActiveProfile] = useState<PresetProfile>('balanced');
  const [isMuted, setIsMuted] = useState<boolean>(() => sound.getMuted());
  const [activeNavTab, setActiveNavTab] = useState<'processes' | 'permissions'>('processes');
  
  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<FilterStatus>('all');
  const [categoryFilter, setCategoryFilter] = useState<ProcessCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<SortOption>('cpu');

  // Modals & Inspection
  const [inspectorProcess, setInspectorProcess] = useState<BackgroundProcess | null>(null);
  const [inspectorInitialTab, setInspectorInitialTab] = useState<'config' | 'permissions' | 'logs' | 'env'>('config');
  const [isNewProcessModalOpen, setIsNewProcessModalOpen] = useState(false);

  // Telemetry rolling buffer (30 seconds)
  const [telemetryHistory, setTelemetryHistory] = useState<TelemetryPoint[]>(() => {
    const initial: TelemetryPoint[] = [];
    const now = Date.now();
    for (let i = 29; i >= 0; i--) {
      const timeStr = new Date(now - i * 1000).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
      initial.push({ time: timeStr, cpu: 14 + Math.random() * 4, memory: 520 + Math.random() * 10 });
    }
    return initial;
  });

  // Logs stream
  const [logs, setLogs] = useState<LogEntry[]>([
    {
      id: 'log-boot-1',
      processId: 'sys-kernel',
      processName: 'System Supervisor',
      timestamp: new Date().toLocaleTimeString(),
      level: 'sys',
      message: 'Daemon subsystem initialized. Process tree and permission sandbox active.'
    },
    {
      id: 'log-boot-2',
      processId: 'proc-webworker-hasher',
      processName: 'WebWorker Crypto & Hash Cruncher',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Worker thread spawned successfully. Subscribed to telemetry bus.'
    }
  ]);

  const addLog = useCallback((entry: LogEntry) => {
    setLogs((prev) => [entry, ...prev.slice(0, 199)]); // keep up to 200 logs
  }, []);

  const addLogRef = useRef(addLog);
  addLogRef.current = addLog;

  // Persist state
  useEffect(() => {
    try {
      localStorage.setItem('process_daemon_state', JSON.stringify(processes));
    } catch {
      // ignore
    }
  }, [processes]);

  // Handle worker message updates
  const handleWorkerProgress = useCallback((procId: string, iterations: number) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id === procId) {
          return {
            ...p,
            iterationsCount: iterations,
            lastRunTimestamp: Date.now()
          };
        }
        return p;
      })
    );
  }, []);

  // Spin up real workers for active processes on start
  useEffect(() => {
    processes.forEach((proc) => {
      if (proc.isEnabled && (proc.executionMode === 'real-worker' || proc.executionMode === 'real-interval')) {
        workerManager.start(
          proc,
          (log) => addLogRef.current(log),
          (id, it) => handleWorkerProgress(id, it)
        );
      }
    });

    return () => {
      workerManager.stopAll();
    };
    // run only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Real-time telemetry tick loop (every 1.5 seconds)
  useEffect(() => {
    const timer = setInterval(() => {
      setProcesses((prev) => {
        let currentTotalCpu = 0;
        let currentTotalMem = 0;

        const updated = prev.map((p) => {
          if (p.status === 'running') {
            // Apply slight organic jitter around targetCpu
            const jitter = (Math.random() - 0.5) * 1.5;
            const throttleMultiplier = Math.max(0.1, 1 - (p.throttlePercent || 0) / 100);
            
            // If background unrestricted permission is off, OS applies background sleep penalty
            const sleepMultiplier = p.permissions?.battery_unrestricted ? 1.0 : 0.6;
            const cpu = Math.max(0.1, (p.targetCpuPercent + jitter) * throttleMultiplier * sleepMultiplier);
            const memJitter = (Math.random() - 0.5) * 2;
            const mem = Math.max(5, p.targetMemoryMb + memJitter);

            currentTotalCpu += cpu;
            currentTotalMem += mem;

            return {
              ...p,
              cpuPercent: Number(cpu.toFixed(1)),
              memoryMb: Number(mem.toFixed(1)),
              uptimeSeconds: p.uptimeSeconds + 1.5,
              // If network permission was revoked, zero out network throughput
              networkKbps: p.permissions?.network ? p.networkKbps : 0,
            };
          } else if (p.status === 'paused') {
            currentTotalCpu += 0.2;
            currentTotalMem += p.targetMemoryMb * 0.4;
            return {
              ...p,
              cpuPercent: 0.2,
              memoryMb: Number((p.targetMemoryMb * 0.4).toFixed(1)),
            };
          } else {
            // Stopped: 0 CPU, 0 RAM
            return {
              ...p,
              cpuPercent: 0,
              memoryMb: 0,
            };
          }
        });

        // Push new telemetry history point
        const timeStr = new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setTelemetryHistory((hist) => [
          ...hist.slice(1),
          { time: timeStr, cpu: currentTotalCpu, memory: currentTotalMem }
        ]);

        return updated;
      });
    }, 1500);

    return () => clearInterval(timer);
  }, []);

  // Process On / Off toggle handler
  const handleToggle = useCallback((id: string, enable: boolean) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          const updated: BackgroundProcess = {
            ...p,
            isEnabled: enable,
            status: enable ? 'running' : 'stopped',
            cpuPercent: enable ? p.targetCpuPercent : 0,
            memoryMb: enable ? p.targetMemoryMb : 0,
            uptimeSeconds: enable ? p.uptimeSeconds : 0,
          };

          if (enable) {
            // Start real worker if applicable
            if (p.executionMode === 'real-worker' || p.executionMode === 'real-interval') {
              workerManager.start(
                updated,
                (log) => addLogRef.current(log),
                (procId, it) => handleWorkerProgress(procId, it)
              );
            }
            addLogRef.current({
              id: Math.random().toString(36).substring(2, 9),
              processId: p.id,
              processName: p.name,
              timestamp: new Date().toLocaleTimeString(),
              level: 'info',
              message: `[SIGCONT] Process PID ${p.pid} (${p.name}) turned ON. Background daemon spawned.`
            });
          } else {
            // Stop real worker
            workerManager.stop(p.id);
            addLogRef.current({
              id: Math.random().toString(36).substring(2, 9),
              processId: p.id,
              processName: p.name,
              timestamp: new Date().toLocaleTimeString(),
              level: 'sys',
              message: `[SIGTERM] Process PID ${p.pid} (${p.name}) turned OFF. Memory released and worker terminated.`
            });
          }

          return updated;
        }
        return p;
      })
    );
  }, [handleWorkerProgress]);

  // Pause process
  const handlePause = useCallback((id: string) => {
    sound.playToggleOff();
    workerManager.pause(id);
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          addLogRef.current({
            id: Math.random().toString(36).substring(2, 9),
            processId: p.id,
            processName: p.name,
            timestamp: new Date().toLocaleTimeString(),
            level: 'warn',
            message: `[SIGSTOP] Process PID ${p.pid} suspended. Execution paused.`
          });
          return { ...p, status: 'paused' };
        }
        return p;
      })
    );
  }, []);

  // Resume process
  const handleResume = useCallback((id: string) => {
    sound.playToggleOn();
    workerManager.resume(id);
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          addLogRef.current({
            id: Math.random().toString(36).substring(2, 9),
            processId: p.id,
            processName: p.name,
            timestamp: new Date().toLocaleTimeString(),
            level: 'info',
            message: `[SIGCONT] Process PID ${p.pid} resumed.`
          });
          return { ...p, status: 'running' };
        }
        return p;
      })
    );
  }, []);

  // Force Kill (SIGKILL)
  const handleKill = useCallback((id: string) => {
    workerManager.stop(id);
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id === id) {
          addLogRef.current({
            id: Math.random().toString(36).substring(2, 9),
            processId: p.id,
            processName: p.name,
            timestamp: new Date().toLocaleTimeString(),
            level: 'error',
            message: `[SIGKILL] Force killed PID ${p.pid} (${p.name}). Instant process termination.`
          });
          return {
            ...p,
            isEnabled: false,
            status: 'stopped',
            cpuPercent: 0,
            memoryMb: 0
          };
        }
        return p;
      })
    );
  }, []);

  // Master Toggle All Processes
  const handleMasterToggle = useCallback((enable: boolean) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (enable) {
          if (p.executionMode === 'real-worker' || p.executionMode === 'real-interval') {
            workerManager.start(
              p,
              (log) => addLogRef.current(log),
              (procId, it) => handleWorkerProgress(procId, it)
            );
          }
          return {
            ...p,
            isEnabled: true,
            status: 'running',
            cpuPercent: p.targetCpuPercent,
            memoryMb: p.targetMemoryMb
          };
        } else {
          workerManager.stop(p.id);
          return {
            ...p,
            isEnabled: false,
            status: 'stopped',
            cpuPercent: 0,
            memoryMb: 0
          };
        }
      })
    );

    addLogRef.current({
      id: Math.random().toString(36).substring(2, 9),
      processId: 'sys-master',
      processName: 'Master Supervisor',
      timestamp: new Date().toLocaleTimeString(),
      level: enable ? 'info' : 'warn',
      message: enable 
        ? '[SUPERVISOR] Master Switch: All background apps and workers toggled ON.'
        : '[SUPERVISOR] Master Switch: All background processes suspended.'
    });
  }, [handleWorkerProgress]);

  // ================= PERMISSION HANDLERS =================

  // 1. Toggle Single Permission for One App
  const handleToggleAppPermission = useCallback((processId: string, permission: AppPermissionKey, granted: boolean) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id === processId) {
          const nextPerms = { ...p.permissions, [permission]: granted };
          
          addLogRef.current({
            id: Math.random().toString(36).substring(2, 9),
            processId: p.id,
            processName: p.name,
            timestamp: new Date().toLocaleTimeString(),
            level: granted ? 'info' : 'warn',
            message: granted 
              ? `[SECURITY] Granted permission '${permission.toUpperCase()}' to PID ${p.pid} (${p.name}).`
              : `[SECURITY] Revoked permission '${permission.toUpperCase()}' from PID ${p.pid} (${p.name}). Access blocked.`
          });

          return {
            ...p,
            permissions: nextPerms,
            networkKbps: permission === 'network' && !granted ? 0 : p.networkKbps
          };
        }
        return p;
      })
    );
  }, []);

  // 2. Toggle ALL Permissions for One App (On / Off)
  const handleToggleAllPermissionsForApp = useCallback((processId: string, grantAll: boolean) => {
    setProcesses((prev) =>
      prev.map((p) => {
        if (p.id === processId) {
          const nextPerms: Record<AppPermissionKey, boolean> = { ...p.permissions };
          APP_PERMISSIONS_CONFIG.forEach((cfg) => {
            nextPerms[cfg.key] = grantAll;
          });

          addLogRef.current({
            id: Math.random().toString(36).substring(2, 9),
            processId: p.id,
            processName: p.name,
            timestamp: new Date().toLocaleTimeString(),
            level: grantAll ? 'info' : 'warn',
            message: grantAll 
              ? `[SECURITY] Granted ALL permissions to PID ${p.pid} (${p.name}). Full sandbox access opened.`
              : `[SECURITY] Revoked ALL permissions from PID ${p.pid} (${p.name}). Application placed in zero-trust isolation.`
          });

          return {
            ...p,
            permissions: nextPerms,
            networkKbps: grantAll ? p.networkKbps : 0
          };
        }
        return p;
      })
    );
  }, []);

  // 3. Toggle a Specific Permission across ALL Apps (e.g. All Apps Location ON/OFF)
  const handleToggleGlobalPermission = useCallback((permission: AppPermissionKey, grantAll: boolean) => {
    setProcesses((prev) =>
      prev.map((p) => ({
        ...p,
        permissions: {
          ...p.permissions,
          [permission]: grantAll,
        },
        networkKbps: permission === 'network' && !grantAll ? 0 : p.networkKbps
      }))
    );

    addLogRef.current({
      id: Math.random().toString(36).substring(2, 9),
      processId: 'sys-permissions',
      processName: 'Permission Broker',
      timestamp: new Date().toLocaleTimeString(),
      level: grantAll ? 'info' : 'warn',
      message: `[SECURITY POLICY] Global switch: Permission '${permission.toUpperCase()}' set to ${grantAll ? 'ALL ON' : 'ALL OFF'} across all apps.`
    });
  }, []);

  // 4. Toggle ALL Permissions across ALL Apps (Master All Permissions ON / OFF)
  const handleToggleMasterAllPermissions = useCallback((grantAll: boolean) => {
    setProcesses((prev) =>
      prev.map((p) => {
        const nextPerms: Record<AppPermissionKey, boolean> = { ...p.permissions };
        APP_PERMISSIONS_CONFIG.forEach((cfg) => {
          nextPerms[cfg.key] = grantAll;
        });
        return {
          ...p,
          permissions: nextPerms,
          networkKbps: grantAll ? p.networkKbps : 0
        };
      })
    );

    addLogRef.current({
      id: Math.random().toString(36).substring(2, 9),
      processId: 'sys-master-perm',
      processName: 'Permission Supervisor',
      timestamp: new Date().toLocaleTimeString(),
      level: grantAll ? 'info' : 'error',
      message: grantAll
        ? '[SECURITY POLICY] Master Action: Granted ALL permissions across ALL registered applications.'
        : '[SECURITY POLICY] Master Action: Revoked ALL permissions across ALL applications. Total system lockdown.'
    });
  }, []);

  // 5. Revoke All Sensitive Permissions (1-click Privacy Shield)
  const handleRevokeAllSensitivePermissions = useCallback(() => {
    setProcesses((prev) =>
      prev.map((p) => ({
        ...p,
        permissions: {
          ...p.permissions,
          location: false,
          camera: false,
          microphone: false,
          bluetooth: false,
        }
      }))
    );

    addLogRef.current({
      id: Math.random().toString(36).substring(2, 9),
      processId: 'sys-privacy-shield',
      processName: 'Privacy Shield',
      timestamp: new Date().toLocaleTimeString(),
      level: 'sys',
      message: '[PRIVACY LOCK] Instant Privacy Shield engaged: Revoked Location, Camera, Microphone, and Bluetooth from ALL background apps.'
    });
  }, []);

  // Preset Profiles
  const handleSelectProfile = useCallback((profile: PresetProfile) => {
    setActiveProfile(profile);

    setProcesses((prev) =>
      prev.map((p) => {
        let enable = true;
        let perms = { ...p.permissions };

        if (profile === 'battery-saver') {
          // Keep only low-impact system services
          enable = p.batteryImpact === 'minimal' || (p.batteryImpact === 'low' && p.category === 'System');
          // Revoke unrestricted background run
          perms.battery_unrestricted = p.category === 'System';
        } else if (profile === 'gaming') {
          // Keep only System processes, kill user apps, heavy workers & telemetry
          enable = p.category === 'System';
        } else if (profile === 'privacy') {
          // Kill telemetry, diagnostics, Bluetooth beacons, location
          const isPrivacyLeak = p.tags.includes('telemetry') || p.tags.includes('analytics') || p.tags.includes('gps') || p.tags.includes('bluetooth');
          enable = !isPrivacyLeak;
          // Revoke sensitive permissions
          perms.location = false;
          perms.bluetooth = false;
          perms.camera = false;
          perms.microphone = false;
        } else {
          // Balanced: initial configuration
          const initP = INITIAL_PROCESSES.find((i) => i.id === p.id);
          enable = initP ? initP.isEnabled : true;
          if (initP) perms = { ...initP.permissions };
        }

        if (enable && !p.isEnabled) {
          if (p.executionMode === 'real-worker' || p.executionMode === 'real-interval') {
            workerManager.start(
              p,
              (log) => addLogRef.current(log),
              (procId, it) => handleWorkerProgress(procId, it)
            );
          }
        } else if (!enable && p.isEnabled) {
          workerManager.stop(p.id);
        }

        return {
          ...p,
          isEnabled: enable,
          status: enable ? 'running' : 'stopped',
          cpuPercent: enable ? p.targetCpuPercent : 0,
          memoryMb: enable ? p.targetMemoryMb : 0,
          permissions: perms,
        };
      })
    );

    addLogRef.current({
      id: Math.random().toString(36).substring(2, 9),
      processId: 'sys-profile',
      processName: 'Profile Controller',
      timestamp: new Date().toLocaleTimeString(),
      level: 'sys',
      message: `[PROFILE] Switched system profile to: "${profile.toUpperCase()}". Background processes & sandbox rules updated.`
    });
  }, [handleWorkerProgress]);

  // Reset to defaults
  const handleResetDefaults = useCallback(() => {
    workerManager.stopAll();
    setProcesses(INITIAL_PROCESSES);
    setActiveProfile('balanced');
    INITIAL_PROCESSES.forEach((proc) => {
      if (proc.isEnabled && (proc.executionMode === 'real-worker' || proc.executionMode === 'real-interval')) {
        workerManager.start(
          proc,
          (log) => addLogRef.current(log),
          (id, it) => handleWorkerProgress(id, it)
        );
      }
    });
    addLogRef.current({
      id: Math.random().toString(36).substring(2, 9),
      processId: 'sys-reset',
      processName: 'Supervisor',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Reset all background processes and permissions to system baseline.'
    });
  }, [handleWorkerProgress]);

  // Update process from Inspector
  const handleUpdateProcess = useCallback((updated: BackgroundProcess) => {
    workerManager.setThrottle(updated.id, updated.throttlePercent);
    setProcesses((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    addLogRef.current({
      id: Math.random().toString(36).substring(2, 9),
      processId: updated.id,
      processName: updated.name,
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: `[CONFIG] Updated PID ${updated.pid}: priority=${updated.priority}, throttle=${updated.throttlePercent}%`
    });
  }, []);

  // Create new custom process
  const handleCreateProcess = useCallback((newProcess: BackgroundProcess) => {
    setProcesses((prev) => [newProcess, ...prev]);
    if (newProcess.isEnabled) {
      if (newProcess.executionMode === 'real-worker' || newProcess.executionMode === 'real-interval') {
        workerManager.start(
          newProcess,
          (log) => addLogRef.current(log),
          (id, it) => handleWorkerProgress(id, it)
        );
      }
    }
    addLogRef.current({
      id: Math.random().toString(36).substring(2, 9),
      processId: newProcess.id,
      processName: newProcess.name,
      timestamp: new Date().toLocaleTimeString(),
      level: 'sys',
      message: `[SPAWN] New background process PID ${newProcess.pid} initialized (${newProcess.executionMode}).`
    });
  }, [handleWorkerProgress]);

  // Export report with permissions audit
  const handleExportReport = () => {
    const report = {
      exportTimestamp: new Date().toISOString(),
      activeProfile,
      totalProcesses: processes.length,
      runningProcesses: processes.filter((p) => p.status === 'running').length,
      permissionsAudit: {
        totalGranted: metrics.totalGrantedPermissions,
        totalRevoked: metrics.totalRevokedPermissions,
        sensitiveGranted: metrics.sensitiveGrantedCount,
      },
      processes: processes.map((p) => ({
        pid: p.pid,
        name: p.name,
        category: p.category,
        isEnabled: p.isEnabled,
        status: p.status,
        cpuPercent: p.cpuPercent,
        memoryMb: p.memoryMb,
        batteryImpact: p.batteryImpact,
        uptimeSeconds: p.uptimeSeconds,
        iterationsCount: p.iterationsCount,
        permissions: p.permissions,
      })),
      recentLogs: logs.slice(0, 50)
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `processdaemon-report-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Toggle Mute
  const handleToggleMute = () => {
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    sound.setMuted(nextMuted);
  };

  // System calculations
  const metrics: SystemMetrics = useMemo(() => {
    const running = processes.filter((p) => p.status === 'running');
    const stopped = processes.filter((p) => p.status === 'stopped' || p.status === 'paused');
    const totalCpu = running.reduce((sum, p) => sum + (p.cpuPercent || 0), 0);
    const totalMemoryMb = running.reduce((sum, p) => sum + (p.memoryMb || 0), 0);
    const networkThroughputKbps = running.reduce((sum, p) => sum + (p.permissions?.network ? (p.networkKbps || 0) : 0), 0);

    // Watts calculation: base 4W + proportional background draw
    const batteryDrainWatts = 4.2 + (totalCpu / 100) * 14.5;

    // Minutes saved by currently disabled processes
    const savedMinutes = stopped.reduce((acc, p) => {
      return acc + (p.targetCpuPercent > 15 ? 18 : p.targetCpuPercent > 5 ? 8 : 3);
    }, 0);

    // Permissions counters
    let totalGranted = 0;
    let sensitiveGranted = 0;
    const totalPossible = processes.length * APP_PERMISSIONS_CONFIG.length;

    processes.forEach((p) => {
      APP_PERMISSIONS_CONFIG.forEach((cfg) => {
        if (p.permissions?.[cfg.key]) {
          totalGranted++;
          if (cfg.isSensitive) sensitiveGranted++;
        }
      });
    });

    return {
      totalCpu,
      totalMemoryMb,
      maxMemoryMb: 2048,
      runningCount: running.length,
      stoppedCount: stopped.length,
      totalCount: processes.length,
      networkThroughputKbps,
      batteryDrainWatts,
      estimatedBatterySavedMinutes: savedMinutes,
      totalGrantedPermissions: totalGranted,
      totalRevokedPermissions: totalPossible - totalGranted,
      sensitiveGrantedCount: sensitiveGranted,
    };
  }, [processes]);

  // Counts for filter bar
  const counts = useMemo(() => {
    return {
      all: processes.length,
      running: processes.filter((p) => p.status === 'running').length,
      stopped: processes.filter((p) => p.status === 'stopped' || p.status === 'paused').length,
      workers: processes.filter((p) => p.executionMode === 'real-worker').length,
      highImpact: processes.filter((p) => p.batteryImpact === 'high' || p.targetCpuPercent > 10).length,
    };
  }, [processes]);

  // Filtered & sorted process list
  const filteredProcesses = useMemo(() => {
    return processes
      .filter((p) => {
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = p.name.toLowerCase().includes(q);
          const matchesDesc = p.description.toLowerCase().includes(q);
          const matchesPid = p.pid.toString().includes(q);
          const matchesTag = p.tags.some((t) => t.toLowerCase().includes(q));
          if (!matchesName && !matchesDesc && !matchesPid && !matchesTag) return false;
        }

        // Category filter
        if (categoryFilter !== 'All' && p.category !== categoryFilter) {
          return false;
        }

        // Status filter
        if (statusFilter === 'running' && p.status !== 'running') return false;
        if (statusFilter === 'stopped' && p.status === 'running') return false;
        if (statusFilter === 'workers' && p.executionMode !== 'real-worker') return false;
        if (statusFilter === 'high-impact' && p.batteryImpact !== 'high' && p.targetCpuPercent <= 10) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'cpu') return b.cpuPercent - a.cpuPercent;
        if (sortBy === 'memory') return b.memoryMb - a.memoryMb;
        if (sortBy === 'pid') return a.pid - b.pid;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        if (sortBy === 'battery') {
          const order = { high: 4, moderate: 3, low: 2, minimal: 1 };
          return order[b.batteryImpact] - order[a.batteryImpact];
        }
        return 0;
      });
  }, [processes, searchQuery, categoryFilter, statusFilter, sortBy]);

  const allRunning = processes.every((p) => p.isEnabled);

  const handleOpenInspector = (proc: BackgroundProcess, tab: 'config' | 'permissions' | 'logs' | 'env' = 'config') => {
    setInspectorProcess(proc);
    setInspectorInitialTab(tab);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200 pb-20">
      
      {/* Top Navigation & Profile Bar */}
      <Header
        allRunning={allRunning}
        onMasterToggle={handleMasterToggle}
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        isMuted={isMuted}
        onToggleMute={handleToggleMute}
        onResetDefaults={handleResetDefaults}
        onExportReport={handleExportReport}
        runningCount={metrics.runningCount}
        totalCount={metrics.totalCount}
        activeNavTab={activeNavTab}
        onSelectNavTab={setActiveNavTab}
        grantedPermissionsCount={metrics.totalGrantedPermissions}
        totalPossiblePermissions={processes.length * APP_PERMISSIONS_CONFIG.length}
        sensitiveGrantedCount={metrics.sensitiveGrantedCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 space-y-6">
        
        {/* System Overview Metrics Cards */}
        <SystemStatsCards metrics={metrics} />

        {/* Tab 1: Background Processes View */}
        {activeNavTab === 'processes' && (
          <div className="space-y-6">
            
            {/* Live Rolling CPU/RAM Telemetry Graph */}
            <CpuMemoryGraph history={telemetryHistory} />

            {/* Energy Optimization Banner */}
            <BatterySavingsWidget 
              processes={processes} 
              onToggle={handleToggle} 
            />

            {/* Filter, Search & Action Bar */}
            <ProcessFilterBar
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              categoryFilter={categoryFilter}
              onCategoryFilterChange={setCategoryFilter}
              sortBy={sortBy}
              onSortByChange={setSortBy}
              onOpenNewProcessModal={() => setIsNewProcessModalOpen(true)}
              counts={counts}
            />

            {/* Background Processes List */}
            <div className="space-y-2.5">
              {filteredProcesses.length === 0 ? (
                <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-xl p-12 text-center space-y-2">
                  <p className="text-zinc-400 text-sm font-medium">
                    No background processes match the current filter criteria.
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setStatusFilter('all');
                      setCategoryFilter('All');
                    }}
                    className="text-xs text-emerald-400 hover:underline font-mono"
                  >
                    Clear all active search and category filters
                  </button>
                </div>
              ) : (
                filteredProcesses.map((proc) => (
                  <ProcessRow
                    key={proc.id}
                    process={proc}
                    onToggle={handleToggle}
                    onPause={handlePause}
                    onResume={handleResume}
                    onKill={handleKill}
                    onInspect={(p, tab) => handleOpenInspector(p, tab)}
                  />
                ))
              )}
            </div>

          </div>
        )}

        {/* Tab 2: App Permissions Manager (All ON / OFF) View */}
        {activeNavTab === 'permissions' && (
          <AppPermissionsManager
            processes={processes}
            onToggleAppPermission={handleToggleAppPermission}
            onToggleAllPermissionsForApp={handleToggleAllPermissionsForApp}
            onToggleGlobalPermission={handleToggleGlobalPermission}
            onToggleMasterAllPermissions={handleToggleMasterAllPermissions}
            onRevokeAllSensitivePermissions={handleRevokeAllSensitivePermissions}
          />
        )}

      </main>

      {/* Inspector / Configuration Modal */}
      <ProcessInspectorModal
        process={inspectorProcess}
        initialTab={inspectorInitialTab}
        onClose={() => setInspectorProcess(null)}
        onUpdateProcess={handleUpdateProcess}
        onToggle={handleToggle}
        onKill={handleKill}
        logs={logs}
      />

      {/* New Process Creator Modal */}
      <NewProcessModal
        isOpen={isNewProcessModalOpen}
        onClose={() => setIsNewProcessModalOpen(false)}
        onCreate={handleCreateProcess}
      />

      {/* Floating / Collapsible Console Signal Drawer */}
      <LiveConsoleDrawer
        logs={logs}
        onClearLogs={() => setLogs([])}
      />

    </div>
  );
}
