import React from 'react';
import { BatteryCharging, ZapOff, Sparkles } from 'lucide-react';
import { BackgroundProcess } from '../types/process';
import { sound } from '../utils/audio';

interface BatterySavingsWidgetProps {
  processes: BackgroundProcess[];
  onToggle: (id: string, enable: boolean) => void;
}

export const BatterySavingsWidget: React.FC<BatterySavingsWidgetProps> = ({
  processes,
  onToggle,
}) => {
  const runningProcesses = processes.filter((p) => p.status === 'running');
  const heavyProcesses = runningProcesses.filter((p) => p.batteryImpact === 'high' || p.cpuPercent > 10);
  const disabledProcesses = processes.filter((p) => !p.isEnabled);

  const estimatedMinutesSaved = disabledProcesses.reduce((acc, p) => {
    return acc + (p.targetCpuPercent > 15 ? 18 : p.targetCpuPercent > 5 ? 8 : 3);
  }, 0);

  const handleOptimizeHeavy = () => {
    sound.playKill();
    heavyProcesses.forEach((p) => {
      onToggle(p.id, false);
    });
  };

  if (heavyProcesses.length === 0 && disabledProcesses.length > 0) {
    return (
      <div className="bg-emerald-950/20 border border-emerald-900/40 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <BatteryCharging className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-emerald-300">
              Background Eco Optimization Active
            </div>
            <p className="text-zinc-400 text-[11px] font-mono">
              All heavy background daemons are suspended. Estimated +{estimatedMinutesSaved} minutes battery lifespan preserved.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (heavyProcesses.length === 0) return null;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <div className="font-semibold text-zinc-200 flex items-center gap-2">
            <span>Energy Optimization Opportunity</span>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
              {heavyProcesses.length} high-drain apps running
            </span>
          </div>
          <p className="text-zinc-400 text-[11px]">
            {heavyProcesses.map((p) => p.name).join(', ')} {heavyProcesses.length > 1 ? 'are' : 'is'} consuming active CPU cycles in background.
          </p>
        </div>
      </div>

      <button
        onClick={handleOptimizeHeavy}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-600/90 hover:bg-amber-500 text-white font-semibold transition-colors shrink-0 text-xs cursor-pointer shadow-sm"
      >
        <ZapOff className="w-3.5 h-3.5" />
        <span>Suspend High-Drain Apps</span>
      </button>
    </div>
  );
};
