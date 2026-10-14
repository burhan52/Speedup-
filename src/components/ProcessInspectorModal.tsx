import React, { useState } from 'react';
import { 
  X, 
  Sliders, 
  Cpu, 
  HardDrive, 
  ShieldAlert, 
  ShieldCheck,
  Terminal, 
  Power, 
  RotateCw,
  Skull,
  Lock,
  Unlock,
  MapPin,
  Wifi,
  Bell,
  Bluetooth,
  BatteryCharging,
  Camera,
  Mic,
  Shield
} from 'lucide-react';
import { 
  BackgroundProcess, 
  ProcessPriority, 
  LogEntry, 
  AppPermissionKey, 
  APP_PERMISSIONS_CONFIG 
} from '../types/process';
import { sound } from '../utils/audio';

interface ProcessInspectorModalProps {
  process: BackgroundProcess | null;
  onClose: () => void;
  onUpdateProcess: (updated: BackgroundProcess) => void;
  onToggle: (id: string, enable: boolean) => void;
  onKill: (id: string) => void;
  logs: LogEntry[];
  initialTab?: 'config' | 'permissions' | 'logs' | 'env';
}

export const ProcessInspectorModal: React.FC<ProcessInspectorModalProps> = ({
  process,
  onClose,
  onUpdateProcess,
  onToggle,
  onKill,
  logs,
  initialTab = 'config'
}) => {
  if (!process) return null;

  const [throttle, setThrottle] = useState(process.throttlePercent);
  const [priority, setPriority] = useState<ProcessPriority>(process.priority);
  const [autoRestart, setAutoRestart] = useState(process.autoRestart);
  const [permissions, setPermissions] = useState<Record<AppPermissionKey, boolean>>(() => {
    return { ...process.permissions };
  });
  const [activeTab, setActiveTab] = useState<'config' | 'permissions' | 'logs' | 'env'>(initialTab);

  const filteredLogs = logs.filter(l => l.processId === process.id);

  const handleSave = () => {
    onUpdateProcess({
      ...process,
      throttlePercent: throttle,
      priority: priority,
      autoRestart: autoRestart,
      permissions: permissions,
    });
    onClose();
  };

  const handleToggleSinglePermission = (key: AppPermissionKey) => {
    const nextVal = !permissions[key];
    sound.playPermissionToggle(nextVal);
    setPermissions(prev => ({
      ...prev,
      [key]: nextVal
    }));
  };

  const handleToggleAllAppPermissions = (grantAll: boolean) => {
    sound.playPermissionToggle(grantAll);
    const updated: Record<AppPermissionKey, boolean> = { ...permissions };
    APP_PERMISSIONS_CONFIG.forEach(cfg => {
      updated[cfg.key] = grantAll;
    });
    setPermissions(updated);
  };

  const getPermissionIcon = (key: AppPermissionKey) => {
    switch (key) {
      case 'location': return <MapPin className="w-4 h-4 text-amber-400" />;
      case 'network': return <Wifi className="w-4 h-4 text-emerald-400" />;
      case 'notifications': return <Bell className="w-4 h-4 text-sky-400" />;
      case 'storage': return <HardDrive className="w-4 h-4 text-indigo-400" />;
      case 'bluetooth': return <Bluetooth className="w-4 h-4 text-blue-400" />;
      case 'battery_unrestricted': return <BatteryCharging className="w-4 h-4 text-emerald-400" />;
      case 'camera': return <Camera className="w-4 h-4 text-rose-400" />;
      case 'microphone': return <Mic className="w-4 h-4 text-rose-400" />;
    }
  };

  const isRunning = process.status === 'running';
  const grantedCount = APP_PERMISSIONS_CONFIG.filter(cfg => permissions[cfg.key]).length;
  const allGranted = grantedCount === APP_PERMISSIONS_CONFIG.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-900/60">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${isRunning ? 'bg-emerald-400' : 'bg-zinc-600'}`} />
              <h2 className="text-base font-bold text-zinc-100">
                {process.name}
              </h2>
              <span className="text-xs font-mono text-zinc-500">PID {process.pid}</span>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">{process.description}</p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-zinc-800 px-6 bg-zinc-900/30 gap-6 text-xs">
          <button
            onClick={() => setActiveTab('config')}
            className={`py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'config'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Throttle & Controls
          </button>

          <button
            onClick={() => setActiveTab('permissions')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'permissions'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Permissions ({grantedCount}/8)</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`py-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'logs'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Process Logs ({filteredLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('env')}
            className={`py-3 font-medium border-b-2 transition-colors ${
              activeTab === 'env'
                ? 'border-emerald-500 text-emerald-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            Environment & Threading
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          
          {/* TAB 1: Configuration & Throttling */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              
              {/* Primary State Switch Banner */}
              <div className="p-4 rounded-xl bg-zinc-900/80 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-zinc-200 block">
                    Background Execution State
                  </span>
                  <span className="text-xs text-zinc-400">
                    {process.isEnabled 
                      ? 'Process is currently active in the background and allocating system memory.' 
                      : 'Process is currently paused and released from active scheduler.'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      if (process.isEnabled) {
                        sound.playToggleOff();
                        onToggle(process.id, false);
                      } else {
                        sound.playToggleOn();
                        onToggle(process.id, true);
                      }
                    }}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                      process.isEnabled
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    <span>{process.isEnabled ? 'TOGGLE OFF' : 'TOGGLE ON'}</span>
                  </button>
                </div>
              </div>

              {/* CPU Throttle Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <label className="font-semibold text-zinc-200 flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-zinc-400" />
                    CPU Throttle Limiter
                  </label>
                  <span className="font-mono text-emerald-400 font-bold">{throttle}% delay throttle</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={throttle}
                  onChange={(e) => setThrottle(Number(e.target.value))}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <p className="text-[11px] text-zinc-500">
                  Throttling inserts micro-yield intervals between execution batches, reducing thermal heat and battery consumption.
                </p>
              </div>

              {/* Priority Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-zinc-200 block">
                  Process Scheduling Priority
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {(['low', 'normal', 'high', 'critical'] as ProcessPriority[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`py-2 px-3 rounded-lg text-xs font-medium capitalize border transition-all ${
                        priority === p
                          ? 'bg-zinc-800 text-emerald-400 border-emerald-500/50'
                          : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {/* Auto Restart Toggle */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-zinc-900 border border-zinc-800">
                <div>
                  <span className="text-xs font-semibold text-zinc-200 block">Auto-Restart Daemon Policy</span>
                  <span className="text-[11px] text-zinc-500">Automatically revive process if terminated unexpectedly</span>
                </div>
                <button
                  onClick={() => setAutoRestart(!autoRestart)}
                  className={`w-10 h-6 rounded-full p-1 transition-colors ${
                    autoRestart ? 'bg-emerald-600' : 'bg-zinc-800'
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                    autoRestart ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Danger Zone: Force Kill & Restart */}
              <div className="border border-rose-900/40 bg-rose-950/20 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-rose-300 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 text-rose-400" />
                  <span>Signal Dispatcher & Process Kill Switch</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => {
                      sound.playKill();
                      onKill(process.id);
                      onClose();
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-900/60 hover:bg-rose-800 text-rose-200 text-xs font-semibold transition-colors"
                  >
                    <Skull className="w-3.5 h-3.5" />
                    <span>Send SIGKILL (Force Terminate)</span>
                  </button>

                  <button
                    onClick={() => {
                      sound.playToggleOn();
                      onToggle(process.id, false);
                      setTimeout(() => onToggle(process.id, true), 300);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-colors"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                    <span>Restart Process Instance</span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: App Permissions Manager (All ON / OFF) */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              
              {/* App Master Permissions Switch Bar */}
              <div className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-zinc-100 block">
                    All Permissions for {process.name}
                  </span>
                  <span className="text-xs text-zinc-400 font-mono">
                    {grantedCount} of {APP_PERMISSIONS_CONFIG.length} permissions currently granted
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAllAppPermissions(true)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-emerald-300 border border-emerald-500/40 transition-colors"
                  >
                    All Permissions ON
                  </button>

                  <button
                    onClick={() => handleToggleAllAppPermissions(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-rose-300 border border-rose-500/40 transition-colors"
                  >
                    All Permissions OFF
                  </button>
                </div>
              </div>

              {/* Individual Permission Toggles List */}
              <div className="space-y-2">
                {APP_PERMISSIONS_CONFIG.map((cfg) => {
                  const isGranted = Boolean(permissions[cfg.key]);

                  return (
                    <div
                      key={cfg.key}
                      onClick={() => handleToggleSinglePermission(cfg.key)}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-colors cursor-pointer ${
                        isGranted
                          ? 'bg-zinc-900/80 border-zinc-700/80 hover:border-emerald-500/50'
                          : 'bg-zinc-950/60 border-zinc-800/80 opacity-60 hover:opacity-100 hover:border-zinc-700'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 rounded-lg bg-zinc-800 shrink-0">
                          {getPermissionIcon(cfg.key)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-zinc-200">
                              {cfg.label}
                            </span>
                            {cfg.isSensitive && (
                              <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.2 rounded border border-amber-400/20">
                                Sensitive
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {cfg.description}
                          </p>
                        </div>
                      </div>

                      {/* Switch */}
                      <button
                        type="button"
                        role="switch"
                        aria-checked={isGranted}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleSinglePermission(cfg.key);
                        }}
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out ${
                          isGranted ? 'bg-emerald-600 border-emerald-500' : 'bg-zinc-800 border-zinc-700'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                            isGranted ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  );
                })}
              </div>

            </div>
          )}

          {/* TAB 3: Process Logs */}
          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="bg-zinc-950 border border-zinc-900 rounded-xl p-3 font-mono text-xs max-h-72 overflow-y-auto space-y-1.5">
                {filteredLogs.length === 0 ? (
                  <div className="text-zinc-600 text-center py-8">
                    No stdout/stderr records logged yet for PID {process.pid}.
                  </div>
                ) : (
                  filteredLogs.map((log) => (
                    <div key={log.id} className="leading-relaxed flex items-start gap-2">
                      <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                      <span className={`shrink-0 ${
                        log.level === 'error' ? 'text-rose-400' :
                        log.level === 'warn' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        [{log.level.toUpperCase()}]
                      </span>
                      <span className="text-zinc-300 break-all">{log.message}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: Environment */}
          {activeTab === 'env' && (
            <div className="space-y-4 font-mono text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <span className="text-zinc-500 block text-[10px]">EXECUTION RUNTIME</span>
                  <span className="text-zinc-200 font-semibold">{process.executionMode}</span>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <span className="text-zinc-500 block text-[10px]">THREAD ALLOCATION</span>
                  <span className="text-zinc-200 font-semibold">{process.threads} Worker Thread(s)</span>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <span className="text-zinc-500 block text-[10px]">BASE MEMORY FOOTPRINT</span>
                  <span className="text-zinc-200 font-semibold">{process.targetMemoryMb} MB RAM</span>
                </div>
                <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                  <span className="text-zinc-500 block text-[10px]">SYSTEM SUBSYSTEM</span>
                  <span className="text-zinc-200 font-semibold">{process.category}</span>
                </div>
              </div>

              <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-1">
                <span className="text-zinc-500 block text-[10px]">TAGS & CAPABILITIES</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {process.tags.map(t => (
                    <span key={t} className="text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded text-[11px]">
                      #{t}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-900/60">
          <div className="text-xs text-zinc-500 font-mono">
            Process Status: <span className={isRunning ? 'text-emerald-400 font-bold' : 'text-zinc-500 font-bold'}>{process.status.toUpperCase()}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              Save Configuration
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
