import React, { useState, useMemo } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  MapPin, 
  Wifi, 
  Bell, 
  HardDrive, 
  Bluetooth, 
  BatteryCharging, 
  Camera, 
  Mic, 
  Search, 
  CheckCheck, 
  XSquare,
  AlertTriangle,
  SlidersHorizontal,
  Table,
  LayoutGrid
} from 'lucide-react';
import { 
  BackgroundProcess, 
  AppPermissionKey, 
  APP_PERMISSIONS_CONFIG, 
  ProcessCategory 
} from '../types/process';
import { sound } from '../utils/audio';

interface AppPermissionsManagerProps {
  processes: BackgroundProcess[];
  onToggleAppPermission: (processId: string, permission: AppPermissionKey, granted: boolean) => void;
  onToggleAllPermissionsForApp: (processId: string, grantAll: boolean) => void;
  onToggleGlobalPermission: (permission: AppPermissionKey, grantAll: boolean) => void;
  onToggleMasterAllPermissions: (grantAll: boolean) => void;
  onRevokeAllSensitivePermissions: () => void;
}

export const AppPermissionsManager: React.FC<AppPermissionsManagerProps> = ({
  processes,
  onToggleAppPermission,
  onToggleAllPermissionsForApp,
  onToggleGlobalPermission,
  onToggleMasterAllPermissions,
  onRevokeAllSensitivePermissions,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<ProcessCategory | 'All'>('All');
  const [permissionFilter, setPermissionFilter] = useState<AppPermissionKey | 'all' | 'sensitive'>('all');
  const [viewMode, setViewMode] = useState<'cards' | 'matrix'>('cards');

  // Icons map for each permission
  const getPermissionIcon = (key: AppPermissionKey, className = "w-3.5 h-3.5") => {
    switch (key) {
      case 'location': return <MapPin className={className} />;
      case 'network': return <Wifi className={className} />;
      case 'notifications': return <Bell className={className} />;
      case 'storage': return <HardDrive className={className} />;
      case 'bluetooth': return <Bluetooth className={className} />;
      case 'battery_unrestricted': return <BatteryCharging className={className} />;
      case 'camera': return <Camera className={className} />;
      case 'microphone': return <Mic className={className} />;
    }
  };

  // Stats calculation
  const stats = useMemo(() => {
    let totalGranted = 0;
    let totalPossible = processes.length * APP_PERMISSIONS_CONFIG.length;
    let sensitiveGranted = 0;

    const globalCounts: Record<AppPermissionKey, number> = {
      location: 0,
      network: 0,
      notifications: 0,
      storage: 0,
      bluetooth: 0,
      battery_unrestricted: 0,
      camera: 0,
      microphone: 0,
    };

    processes.forEach((p) => {
      APP_PERMISSIONS_CONFIG.forEach((cfg) => {
        if (p.permissions?.[cfg.key]) {
          totalGranted++;
          globalCounts[cfg.key]++;
          if (cfg.isSensitive) sensitiveGranted++;
        }
      });
    });

    return {
      totalGranted,
      totalPossible,
      sensitiveGranted,
      globalCounts,
      allGranted: totalGranted === totalPossible,
      allRevoked: totalGranted === 0,
    };
  }, [processes]);

  // Filtered processes
  const filteredProcesses = useMemo(() => {
    return processes.filter((p) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesPid = p.pid.toString().includes(q);
        if (!matchesName && !matchesPid) return false;
      }
      if (categoryFilter !== 'All' && p.category !== categoryFilter) {
        return false;
      }
      if (permissionFilter === 'sensitive') {
        const hasSensitive = p.permissions?.location || p.permissions?.bluetooth || p.permissions?.camera || p.permissions?.microphone;
        if (!hasSensitive) return false;
      } else if (permissionFilter !== 'all') {
        if (!p.permissions?.[permissionFilter]) return false;
      }
      return true;
    });
  }, [processes, searchQuery, categoryFilter, permissionFilter]);

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Master "ALL PERMISSIONS ON / OFF" & Security Posture */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          <div className="flex items-start sm:items-center gap-3">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
              stats.sensitiveGranted > 0 
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
            }`}>
              {stats.sensitiveGranted > 0 ? (
                <ShieldAlert className="w-6 h-6" />
              ) : (
                <ShieldCheck className="w-6 h-6" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-zinc-100 tracking-tight">
                  Background Apps Permissions Control
                </h2>
                <span className="text-[11px] font-mono text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700/50">
                  {stats.totalGranted} / {stats.totalPossible} Permissions Granted
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Toggle all permissions globally, enforce per-app sandbox boundaries, or isolate hardware radio access.
              </p>
            </div>
          </div>

          {/* Master "All Permissions ON / OFF" Big Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Global Master All ON */}
            <button
              onClick={() => {
                sound.playPermissionToggle(true);
                onToggleMasterAllPermissions(true);
              }}
              title="Grant all permissions across all background applications"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 transition-all hover:text-white"
            >
              <CheckCheck className="w-4 h-4 text-emerald-400" />
              <span>All Permissions ON</span>
            </button>

            {/* Global Master All OFF */}
            <button
              onClick={() => {
                sound.playPermissionShield();
                onToggleMasterAllPermissions(false);
              }}
              title="Revoke all permissions from all background apps (Maximum Strict Sandbox)"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700/80 transition-all hover:text-white"
            >
              <XSquare className="w-4 h-4 text-rose-400" />
              <span>All Permissions OFF</span>
            </button>

            {/* Revoke All Sensitive Permissions (1-click privacy shield) */}
            <button
              onClick={() => {
                sound.playPermissionShield();
                onRevokeAllSensitivePermissions();
              }}
              title="Instantly revoke Location, Camera, Microphone & Bluetooth for all apps"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/60 transition-all"
            >
              <Lock className="w-4 h-4" />
              <span>Revoke Sensitive (Cam/Mic/GPS)</span>
            </button>

          </div>

        </div>

        {/* Global Permission Switches (Quick Toggle by Category) */}
        <div className="pt-3 border-t border-zinc-800/80">
          <div className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
            <span>Global Category Toggles (Applies to all registered apps)</span>
            <span className="text-zinc-500 font-sans text-xs">Click to toggle permission ON/OFF for all apps</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {APP_PERMISSIONS_CONFIG.map((cfg) => {
              const activeCount = stats.globalCounts[cfg.key] || 0;
              const allHaveIt = activeCount === processes.length;
              const someHaveIt = activeCount > 0;

              return (
                <button
                  key={cfg.key}
                  onClick={() => {
                    sound.playPermissionToggle(!allHaveIt);
                    onToggleGlobalPermission(cfg.key, !allHaveIt);
                  }}
                  className={`p-2 rounded-xl border text-left flex flex-col justify-between transition-all ${
                    allHaveIt
                      ? 'bg-zinc-800/90 border-emerald-500/50 text-zinc-100'
                      : someHaveIt
                      ? 'bg-zinc-900/90 border-zinc-700 text-zinc-300'
                      : 'bg-zinc-950/60 border-zinc-800/70 text-zinc-500'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className={allHaveIt ? 'text-emerald-400' : someHaveIt ? 'text-amber-400' : 'text-zinc-600'}>
                      {getPermissionIcon(cfg.key, "w-4 h-4")}
                    </span>
                    <span className={`text-[10px] font-mono font-bold ${
                      allHaveIt ? 'text-emerald-400' : someHaveIt ? 'text-amber-400' : 'text-zinc-600'
                    }`}>
                      {activeCount}/{processes.length}
                    </span>
                  </div>

                  <div>
                    <span className="text-xs font-semibold block truncate leading-tight">
                      {cfg.shortLabel}
                    </span>
                    <span className="text-[10px] text-zinc-500 block truncate">
                      {allHaveIt ? 'ALL ON' : activeCount === 0 ? 'ALL OFF' : 'PARTIAL'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

      </div>

      {/* Filter and View Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        
        {/* Search */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search apps by name, PID..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        {/* Filters & View Switcher */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Permission Filter Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
            <span className="text-zinc-500 text-[11px]">Permission:</span>
            <select
              value={permissionFilter}
              onChange={(e) => setPermissionFilter(e.target.value as AppPermissionKey | 'all' | 'sensitive')}
              className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="all" className="bg-zinc-900">All Permissions</option>
              <option value="sensitive" className="bg-zinc-900">Sensitive Only (GPS/Mic/Cam)</option>
              {APP_PERMISSIONS_CONFIG.map((cfg) => (
                <option key={cfg.key} value={cfg.key} className="bg-zinc-900">
                  {cfg.label}
                </option>
              ))}
            </select>
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
            <span className="text-zinc-500 text-[11px]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value as ProcessCategory | 'All')}
              className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer text-xs"
            >
              <option value="All" className="bg-zinc-900">All Categories</option>
              <option value="System" className="bg-zinc-900">System</option>
              <option value="Application" className="bg-zinc-900">Application</option>
              <option value="Network" className="bg-zinc-900">Network</option>
              <option value="Worker" className="bg-zinc-900">Worker</option>
              <option value="Maintenance" className="bg-zinc-900">Maintenance</option>
            </select>
          </div>

          {/* View Mode Toggle: Cards vs Matrix */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('cards')}
              title="Card view with individual toggles"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'cards' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('matrix')}
              title="Compact Matrix Table view"
              className={`p-1.5 rounded transition-colors ${
                viewMode === 'matrix' ? 'bg-zinc-800 text-zinc-100' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

      </div>

      {/* Process Permissions List */}
      {viewMode === 'cards' ? (
        <div className="space-y-3">
          {filteredProcesses.map((proc) => {
            const grantedCount = APP_PERMISSIONS_CONFIG.filter((cfg) => proc.permissions?.[cfg.key]).length;
            const allGrantedForThisApp = grantedCount === APP_PERMISSIONS_CONFIG.length;
            const noneGrantedForThisApp = grantedCount === 0;

            return (
              <div
                key={proc.id}
                className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 transition-colors hover:border-zinc-700"
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-3 border-b border-zinc-800/60">
                  
                  {/* App Identity */}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        proc.status === 'running' ? 'bg-emerald-400' : 'bg-zinc-600'
                      }`} />
                      <h3 className="text-sm font-bold text-zinc-100">
                        {proc.name}
                      </h3>
                      <span className="text-[11px] font-mono text-zinc-500">
                        PID {proc.pid} · {proc.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {proc.description}
                    </p>
                  </div>

                  {/* App-Level "All Permissions ON / OFF" Switch */}
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-xs font-mono text-zinc-400">
                      {grantedCount} of {APP_PERMISSIONS_CONFIG.length} permissions active
                    </span>

                    <button
                      onClick={() => {
                        const nextState = !allGrantedForThisApp;
                        sound.playPermissionToggle(nextState);
                        onToggleAllPermissionsForApp(proc.id, nextState);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        allGrantedForThisApp
                          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                          : noneGrantedForThisApp
                          ? 'bg-rose-950/40 text-rose-300 border-rose-800/70 hover:bg-rose-900/60'
                          : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border-zinc-700'
                      }`}
                    >
                      {allGrantedForThisApp ? (
                        <>
                          <Unlock className="w-3.5 h-3.5 text-emerald-400" />
                          <span>ALL PERMISSIONS ON</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-3.5 h-3.5 text-zinc-400" />
                          <span>ALL ON / OFF</span>
                        </>
                      )}
                    </button>
                  </div>

                </div>

                {/* Individual Permission Toggles Grid for this App */}
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 pt-3">
                  {APP_PERMISSIONS_CONFIG.map((cfg) => {
                    const isGranted = Boolean(proc.permissions?.[cfg.key]);

                    return (
                      <button
                        key={cfg.key}
                        onClick={() => {
                          const nextGranted = !isGranted;
                          sound.playPermissionToggle(nextGranted);
                          onToggleAppPermission(proc.id, cfg.key, nextGranted);
                        }}
                        title={`${cfg.label}: ${cfg.description}`}
                        className={`p-2.5 rounded-lg border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          isGranted
                            ? 'bg-zinc-800/80 border-emerald-500/40 hover:border-emerald-500'
                            : 'bg-zinc-950/60 border-zinc-800/80 opacity-60 hover:opacity-100 hover:border-zinc-700'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className={isGranted ? (cfg.isSensitive ? 'text-amber-400' : 'text-emerald-400') : 'text-zinc-600'}>
                            {getPermissionIcon(cfg.key, "w-4 h-4")}
                          </span>
                          
                          {/* Mini Toggle Switch Indicator */}
                          <span className={`w-2 h-2 rounded-full ${
                            isGranted ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]' : 'bg-zinc-700'
                          }`} />
                        </div>

                        <div>
                          <span className={`text-[11px] font-semibold block leading-tight truncate ${
                            isGranted ? 'text-zinc-200' : 'text-zinc-500'
                          }`}>
                            {cfg.shortLabel}
                          </span>
                          <span className={`text-[9px] font-mono font-bold uppercase tracking-wider block ${
                            isGranted ? 'text-emerald-400' : 'text-zinc-600'
                          }`}>
                            {isGranted ? 'ON' : 'OFF'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Matrix Table View */
        <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl overflow-x-auto shadow-sm">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950/80 font-mono text-[11px] text-zinc-400">
                <th className="py-3 px-4 font-semibold">Application / Process</th>
                <th className="py-3 px-3 font-semibold text-center">All Perms</th>
                {APP_PERMISSIONS_CONFIG.map((cfg) => (
                  <th key={cfg.key} className="py-3 px-2 font-semibold text-center">
                    <div className="flex flex-col items-center gap-0.5">
                      {getPermissionIcon(cfg.key, "w-3.5 h-3.5 text-zinc-400")}
                      <span className="text-[10px]">{cfg.shortLabel}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-sans">
              {filteredProcesses.map((proc) => {
                const grantedCount = APP_PERMISSIONS_CONFIG.filter((cfg) => proc.permissions?.[cfg.key]).length;
                const allGranted = grantedCount === APP_PERMISSIONS_CONFIG.length;

                return (
                  <tr key={proc.id} className="hover:bg-zinc-800/40 transition-colors">
                    {/* Process info */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${
                          proc.status === 'running' ? 'bg-emerald-400' : 'bg-zinc-600'
                        }`} />
                        <div>
                          <span className="font-semibold text-zinc-200 block truncate max-w-xs sm:max-w-md">
                            {proc.name}
                          </span>
                          <span className="text-[10px] font-mono text-zinc-500">
                            PID {proc.pid} · {proc.category}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* All Permissions toggle button */}
                    <td className="py-3 px-3 text-center">
                      <button
                        onClick={() => {
                          const nextState = !allGranted;
                          sound.playPermissionToggle(nextState);
                          onToggleAllPermissionsForApp(proc.id, nextState);
                        }}
                        className={`text-[10px] font-mono font-bold px-2 py-1 rounded border transition-colors ${
                          allGranted
                            ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                            : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:text-zinc-200'
                        }`}
                      >
                        {allGranted ? 'ALL ON' : `${grantedCount}/8`}
                      </button>
                    </td>

                    {/* Columns for each permission */}
                    {APP_PERMISSIONS_CONFIG.map((cfg) => {
                      const isGranted = Boolean(proc.permissions?.[cfg.key]);

                      return (
                        <td key={cfg.key} className="py-3 px-2 text-center">
                          <button
                            onClick={() => {
                              const nextState = !isGranted;
                              sound.playPermissionToggle(nextState);
                              onToggleAppPermission(proc.id, cfg.key, nextState);
                            }}
                            title={`Toggle ${cfg.label} for ${proc.name}`}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              isGranted
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/40 hover:bg-emerald-500/20'
                                : 'bg-zinc-950 text-zinc-700 border border-zinc-800 hover:text-zinc-400'
                            }`}
                          >
                            {isGranted ? (
                              <CheckCheck className="w-3.5 h-3.5" />
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-zinc-700" />
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
