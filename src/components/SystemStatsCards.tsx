import React from 'react';
import { Cpu, HardDrive, Layers, BatteryCharging, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { SystemMetrics } from '../types/process';

interface SystemStatsCardsProps {
  metrics: SystemMetrics;
  onFilterRunningOnly?: () => void;
  onFilterStoppedOnly?: () => void;
}

export const SystemStatsCards: React.FC<SystemStatsCardsProps> = ({
  metrics,
}) => {
  // Determine color status for CPU
  const cpuColor = 
    metrics.totalCpu > 40 ? 'text-rose-400' :
    metrics.totalCpu > 20 ? 'text-amber-400' : 'text-emerald-400';

  const cpuBarColor = 
    metrics.totalCpu > 40 ? 'bg-rose-500' :
    metrics.totalCpu > 20 ? 'bg-amber-500' : 'bg-emerald-500';

  const memoryPercent = Math.min(100, Math.round((metrics.totalMemoryMb / metrics.maxMemoryMb) * 100));

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
      
      {/* Background CPU Draw */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-zinc-400" />
            Background CPU Load
          </span>
          <span className="font-mono text-zinc-500">8 Cores active</span>
        </div>
        
        <div className="my-2.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className={`text-2xl font-bold font-mono tracking-tight ${cpuColor}`}>
              {metrics.totalCpu.toFixed(1)}%
            </span>
            <span className="text-xs text-zinc-500">usage</span>
          </div>
          <span className="text-xs text-zinc-400 flex items-center">
            {metrics.totalCpu > 25 ? (
              <ArrowUpRight className="w-3 h-3 text-rose-400 inline mr-0.5" />
            ) : (
              <ArrowDownRight className="w-3 h-3 text-emerald-400 inline mr-0.5" />
            )}
            {metrics.totalCpu > 25 ? 'High drain' : 'Optimal'}
          </span>
        </div>

        <div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${cpuBarColor}`} 
              style={{ width: `${Math.min(100, metrics.totalCpu)}%` }} 
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1 font-mono">
            <span>0%</span>
            <span>Target &lt; 15%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Background RAM Allocation */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-zinc-400" />
            Memory Allocation
          </span>
          <span className="font-mono text-zinc-500">{memoryPercent}% budget</span>
        </div>

        <div className="my-2.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono tracking-tight text-zinc-100">
              {metrics.totalMemoryMb.toFixed(0)}
            </span>
            <span className="text-xs text-zinc-400 font-mono">MB / {metrics.maxMemoryMb} MB</span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            V8 Heap: ~{(metrics.totalMemoryMb * 0.45).toFixed(0)} MB
          </span>
        </div>

        <div>
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 transition-all duration-500" 
              style={{ width: `${memoryPercent}%` }} 
            />
          </div>
          <div className="flex justify-between items-center text-[10px] text-zinc-500 mt-1 font-mono">
            <span>0 MB</span>
            <span>Buffered: {(metrics.totalMemoryMb * 0.2).toFixed(0)} MB</span>
            <span>{metrics.maxMemoryMb} MB</span>
          </div>
        </div>
      </div>

      {/* Active Daemons / Processes Count */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-zinc-400" />
            Process State
          </span>
          <span className="text-xs text-zinc-500">{metrics.totalCount} registered</span>
        </div>

        <div className="my-2.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-400">
              {metrics.runningCount}
            </span>
            <span className="text-xs text-zinc-400">running</span>
            <span className="text-zinc-600">·</span>
            <span className="text-lg font-bold font-mono tracking-tight text-zinc-400">
              {metrics.stoppedCount}
            </span>
            <span className="text-xs text-zinc-500">off</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>Active threads: {metrics.runningCount * 2 + 3}</span>
          <span className="text-zinc-600">·</span>
          <span>{metrics.totalGrantedPermissions} perms on</span>
        </div>
      </div>

      {/* Battery Savings & Thermal Profile */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-4 flex flex-col justify-between hover:border-zinc-700 transition-colors">
        <div className="flex items-center justify-between text-zinc-400 text-xs font-medium">
          <span className="flex items-center gap-1.5">
            <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
            Energy Impact
          </span>
          <span className="font-mono text-emerald-400">
            {metrics.batteryDrainWatts.toFixed(1)} W drain
          </span>
        </div>

        <div className="my-2.5 flex items-baseline justify-between">
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono tracking-tight text-emerald-300">
              +{metrics.estimatedBatterySavedMinutes}
            </span>
            <span className="text-xs text-emerald-400/90 font-medium">min battery gained</span>
          </div>
          <span className="text-xs text-zinc-500 font-mono">
            {metrics.stoppedCount} apps paused
          </span>
        </div>

        <div className="text-[11px] text-zinc-400 flex items-center justify-between">
          <span>Thermal dissipation</span>
          <span className="font-mono text-zinc-300">
            {metrics.totalCpu < 15 ? '38°C (Silent fan)' : metrics.totalCpu < 35 ? '49°C (Low fan)' : '64°C (Active cooling)'}
          </span>
        </div>
      </div>

    </div>
  );
};
