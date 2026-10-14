import React from 'react';
import { 
  Activity, 
  Volume2, 
  VolumeX, 
  Battery, 
  Zap, 
  ShieldCheck, 
  ShieldAlert,
  Shield,
  Gamepad2, 
  Power,
  RotateCcw,
  Download,
  Layers
} from 'lucide-react';
import { PresetProfile } from '../types/process';
import { sound } from '../utils/audio';

interface HeaderProps {
  allRunning: boolean;
  onMasterToggle: (enable: boolean) => void;
  activeProfile: PresetProfile;
  onSelectProfile: (profile: PresetProfile) => void;
  isMuted: boolean;
  onToggleMute: () => void;
  onResetDefaults: () => void;
  onExportReport: () => void;
  runningCount: number;
  totalCount: number;
  activeNavTab: 'processes' | 'permissions';
  onSelectNavTab: (tab: 'processes' | 'permissions') => void;
  grantedPermissionsCount: number;
  totalPossiblePermissions: number;
  sensitiveGrantedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  allRunning,
  onMasterToggle,
  activeProfile,
  onSelectProfile,
  isMuted,
  onToggleMute,
  onResetDefaults,
  onExportReport,
  runningCount,
  totalCount,
  activeNavTab,
  onSelectNavTab,
  grantedPermissionsCount,
  totalPossiblePermissions,
  sensitiveGrantedCount,
}) => {
  return (
    <header className="border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-30 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Brand & Navigation Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Activity className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-100 tracking-tight">
                  ProcessDaemon
                </h1>
                <span className="text-zinc-500 font-mono text-xs">v2.5.0</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-ping opacity-75" />
              </div>
              <p className="text-xs text-zinc-400">
                Background App Process & Permissions Controller
              </p>
            </div>
          </div>

          {/* Primary View Navigation: Processes vs App Permissions */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => onSelectNavTab('processes')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeNavTab === 'processes'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-emerald-400" />
              <span>Background Processes ({runningCount})</span>
            </button>

            <button
              onClick={() => onSelectNavTab('permissions')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                activeNavTab === 'permissions'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {sensitiveGrantedCount > 0 ? (
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span>App Permissions (All ON/OFF)</span>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-950 px-1.5 py-0.2 rounded border border-zinc-800">
                {grantedPermissionsCount}
              </span>
            </button>
          </div>
        </div>

        {/* Preset Profiles & Master Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Preset Profiles Segmented Buttons */}
          <div className="hidden lg:flex items-center bg-zinc-900 border border-zinc-800 rounded-lg p-1 text-xs">
            <button
              onClick={() => {
                sound.playProfileSwitch();
                onSelectProfile('balanced');
              }}
              title="Default balanced configuration"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                activeProfile === 'balanced'
                  ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Balanced</span>
            </button>

            <button
              onClick={() => {
                sound.playProfileSwitch();
                onSelectProfile('battery-saver');
              }}
              title="Disables resource-heavy background tasks to maximize battery"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                activeProfile === 'battery-saver'
                  ? 'bg-zinc-800 text-emerald-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span>Eco / Battery</span>
            </button>

            <button
              onClick={() => {
                sound.playProfileSwitch();
                onSelectProfile('gaming');
              }}
              title="Kills background daemons to free maximum CPU/RAM for foreground apps"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                activeProfile === 'gaming'
                  ? 'bg-zinc-800 text-violet-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Gamepad2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Gaming / Focus</span>
            </button>

            <button
              onClick={() => {
                sound.playProfileSwitch();
                onSelectProfile('privacy');
              }}
              title="Shuts down telemetry, diagnostics, and background beacon scanners"
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                activeProfile === 'privacy'
                  ? 'bg-zinc-800 text-sky-300 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-sky-400" />
              <span>Privacy</span>
            </button>
          </div>

          {/* Master Kill / Toggle All Switch */}
          <button
            onClick={() => {
              if (allRunning) {
                sound.playKill();
                onMasterToggle(false);
              } else {
                sound.playToggleOn();
                onMasterToggle(true);
              }
            }}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              allRunning
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
                : 'bg-rose-950/30 text-rose-300 border-rose-800/70 hover:bg-rose-900/40'
            }`}
          >
            <Power className="w-3.5 h-3.5" />
            <span>{allRunning ? 'All Daemons ON' : 'Suspend All'}</span>
          </button>

          {/* Utility Tools */}
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-2">
            <button
              onClick={onToggleMute}
              title={isMuted ? 'Unmute UI sounds' : 'Mute UI sounds'}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
            </button>

            <button
              onClick={onExportReport}
              title="Export diagnostic and permissions report"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>

            <button
              onClick={onResetDefaults}
              title="Reset all process states and permissions to default"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

        </div>

      </div>
    </header>
  );
};
