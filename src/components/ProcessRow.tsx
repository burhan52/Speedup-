import React from 'react';
import { 
  Play, 
  Pause, 
  Skull, 
  Settings2, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Battery, 
  AlertTriangle,
  RotateCw,
  Shield,
  MapPin,
  Lock
} from 'lucide-react';
import { BackgroundProcess, APP_PERMISSIONS_CONFIG } from '../types/process';
import { sound } from '../utils/audio';

interface ProcessRowProps {
  process: BackgroundProcess;
  onToggle: (id: string, enable: boolean) => void;
  onPause: (id: string) => void;
  onResume: (id: string) => void;
  onKill: (id: string) => void;
  onInspect: (process: BackgroundProcess, initialTab?: 'config' | 'permissions' | 'logs' | 'env') => void;
}

export const ProcessRow: React.FC<ProcessRowProps> = ({
  process,
  onToggle,
  onPause,
  onResume,
  onKill,
  onInspect,
}) => {
  const isRunning = process.status === 'running';
  const isPaused = process.status === 'paused';
  const isStopped = process.status === 'stopped';

  const handleToggleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    const nextState = !process.isEnabled;
    if (nextState) {
      sound.playToggleOn();
    } else {
      sound.playToggleOff();
    }
    onToggle(process.id, nextState);
  };

  const handleKillClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playKill();
    onKill(process.id);
  };

  // Battery rating visual color
  const batteryColor = 
    process.batteryImpact === 'high' ? 'text-rose-400' :
    process.batteryImpact === 'moderate' ? 'text-amber-400' :
    process.batteryImpact === 'low' ? 'text-blue-400' : 'text-emerald-400';

  // Format runtime
  const formatUptime = (seconds: number) => {
    if (seconds <= 0) return '0s';
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    if (mins > 0) return `${mins}m ${secs}s`;
    return `${secs}s`;
  };

  // Permission summary
  const grantedPermsCount = APP_PERMISSIONS_CONFIG.filter(
    (cfg) => process.permissions?.[cfg.key]
  ).length;

  const hasLocation = Boolean(process.permissions?.location);
  const hasNetwork = Boolean(process.permissions?.network);
  const isNetworkRestricted = !hasNetwork && (process.category === 'Network' || process.tags.includes('cloud') || process.tags.includes('telemetry'));
  const isAllPermsRevoked = grantedPermsCount === 0;

  return (
    <div 
      className={`border rounded-xl p-4 transition-all duration-200 ${
        isRunning
          ? 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
          : isPaused
          ? 'bg-amber-950/10 border-amber-900/30'
          : 'bg-zinc-950/60 border-zinc-900/90 opacity-75 hover:opacity-95'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Left Side: Process Identity & Unboxed Metadata */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2.5 mb-1 flex-wrap">
            {/* Status glyph */}
            <span 
              className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
                isRunning 
                  ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]' 
                  : isPaused
                  ? 'bg-amber-400'
                  : 'bg-zinc-600'
              }`} 
            />

            <h3 className="text-sm font-semibold text-zinc-100 truncate tracking-tight">
              {process.name}
            </h3>

            {/* Execution mode badge or worker note */}
            {process.executionMode === 'real-worker' && (
              <span className="text-[10px] font-mono font-medium text-indigo-400 bg-indigo-500/10 border border-indigo-500/30 rounded px-1.5 py-0.2 shrink-0">
                WebWorker
              </span>
            )}

            {/* Permissions summary badge */}
            <button
              onClick={() => onInspect(process, 'permissions')}
              title={`Click to manage ${grantedPermsCount} granted permissions`}
              className="text-[10px] font-mono text-zinc-400 hover:text-zinc-200 bg-zinc-800/80 hover:bg-zinc-800 border border-zinc-700/60 rounded px-1.5 py-0.2 flex items-center gap-1 transition-colors shrink-0"
            >
              <Shield className="w-2.5 h-2.5 text-zinc-400" />
              <span>{grantedPermsCount}/8 Perms</span>
            </button>

            {/* Privacy indicator if GPS is active */}
            {hasLocation && (
              <span title="GPS / Geofence permission active" className="text-[10px] font-mono text-amber-400 flex items-center gap-0.5">
                <MapPin className="w-2.5 h-2.5" />
                <span>GPS</span>
              </span>
            )}

            {/* Sandboxed / Restricted warning */}
            {isNetworkRestricted && (
              <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 border border-rose-500/30 rounded px-1.5 py-0.2 flex items-center gap-1">
                <Lock className="w-2.5 h-2.5" />
                <span>Net Revoked</span>
              </span>
            )}

            {isAllPermsRevoked && (
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-800/60 border border-zinc-700/40 rounded px-1.5 py-0.2">
                Sandboxed
              </span>
            )}
          </div>

          {/* Description */}
          <p className="text-xs text-zinc-400 line-clamp-1 mb-2">
            {process.description}
          </p>

          {/* Clean unboxed metadata with typographic separators */}
          <div className="flex flex-wrap items-center gap-2 text-[11px] text-zinc-500 font-mono">
            <span>PID {process.pid}</span>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span>{process.category}</span>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span>{process.threads} {process.threads > 1 ? 'threads' : 'thread'}</span>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span>Priority: {process.priority}</span>
            <span aria-hidden="true" className="text-zinc-700">·</span>
            <span>Uptime: {formatUptime(process.uptimeSeconds)}</span>

            {/* Real Worker Iteration Count */}
            {process.iterationsCount !== undefined && process.iterationsCount > 0 && (
              <>
                <span aria-hidden="true" className="text-zinc-700">·</span>
                <span className="text-indigo-400">
                  {process.iterationsCount.toLocaleString()} {process.workerCodeType === 'hash-calculator' ? 'hashes' : 'cycles'}
                </span>
              </>
            )}
          </div>

          {/* Impact note warning when toggled off */}
          {!isRunning && process.impactWarning && (
            <div className="mt-2 text-[11px] text-amber-400/90 flex items-center gap-1.5 font-mono">
              <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
              <span>{process.impactWarning}</span>
            </div>
          )}
        </div>

        {/* Right Side: Live Metrics Gauges & Tactile Controls */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-4 lg:gap-6 self-start md:self-center shrink-0">
          
          {/* CPU Gauge */}
          <div className="w-20">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-0.5">
              <span className="flex items-center gap-1">
                <Cpu className="w-3 h-3 text-zinc-500" />
                CPU
              </span>
              <span className={isRunning ? 'text-emerald-400 font-semibold' : 'text-zinc-600'}>
                {isRunning ? `${process.cpuPercent.toFixed(1)}%` : '0.0%'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isRunning ? 'bg-emerald-500' : 'bg-transparent'
                }`}
                style={{ width: isRunning ? `${Math.min(100, process.cpuPercent * 2)}%` : '0%' }}
              />
            </div>
          </div>

          {/* Memory Gauge */}
          <div className="w-20">
            <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-0.5">
              <span className="flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-zinc-500" />
                RAM
              </span>
              <span className={isRunning ? 'text-indigo-300 font-semibold' : 'text-zinc-600'}>
                {isRunning ? `${process.memoryMb.toFixed(0)}M` : '0M'}
              </span>
            </div>
            <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-300 ${
                  isRunning ? 'bg-indigo-500' : 'bg-transparent'
                }`}
                style={{ width: isRunning ? `${Math.min(100, (process.memoryMb / 350) * 100)}%` : '0%' }}
              />
            </div>
          </div>

          {/* Battery Drain Tag */}
          <div className="hidden lg:flex flex-col items-center justify-center text-[11px] font-mono w-16 text-center">
            <span className="text-zinc-500 text-[10px] flex items-center gap-0.5">
              <Battery className="w-2.5 h-2.5" />
              Drain
            </span>
            <span className={`capitalize font-semibold ${isRunning ? batteryColor : 'text-zinc-600'}`}>
              {isRunning ? process.batteryImpact : 'idle'}
            </span>
          </div>

          {/* Network I/O */}
          {process.networkKbps > 0 && isRunning && (
            <div className="hidden xl:flex items-center gap-1 text-[11px] font-mono text-zinc-400">
              <Wifi className="w-3 h-3 text-sky-400" />
              <span>{process.networkKbps.toFixed(0)} KB/s</span>
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1 border-l border-zinc-800 pl-3">
            
            {/* Pause / Resume */}
            {isRunning && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onPause(process.id);
                }}
                title="Pause background execution"
                className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 transition-colors"
              >
                <Pause className="w-3.5 h-3.5" />
              </button>
            )}

            {isPaused && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onResume(process.id);
                }}
                title="Resume execution"
                className="p-1.5 rounded-lg text-amber-300 hover:text-emerald-300 hover:bg-zinc-800 transition-colors"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Kill button */}
            {!isStopped && (
              <button
                onClick={handleKillClick}
                title="Force terminate process (SIGKILL)"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
              >
                <Skull className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Restart button for stopped processes */}
            {isStopped && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playToggleOn();
                  onToggle(process.id, true);
                }}
                title="Restart process"
                className="p-1.5 rounded-lg text-zinc-500 hover:text-emerald-400 hover:bg-zinc-800 transition-colors"
              >
                <RotateCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Inspect / Settings modal */}
            <button
              onClick={() => onInspect(process, 'config')}
              title="Inspect process telemetry & configure throttle"
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* TACTILE PROCESS ON / OFF TOGGLE SWITCH */}
          <div className="flex items-center gap-2 pl-2">
            <button
              type="button"
              role="switch"
              aria-checked={process.isEnabled}
              onClick={handleToggleClick}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${
                process.isEnabled
                  ? 'bg-emerald-600 border-emerald-500'
                  : 'bg-zinc-800 border-zinc-700'
              }`}
            >
              <span className="sr-only">Toggle {process.name} background execution</span>
              <span
                aria-hidden="true"
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                  process.isEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>

            <span className={`text-[11px] font-mono font-bold uppercase w-7 ${
              process.isEnabled ? 'text-emerald-400' : 'text-zinc-600'
            }`}>
              {process.isEnabled ? 'ON' : 'OFF'}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
