import React, { useState } from 'react';
import { Pause, Play } from 'lucide-react';

export interface TelemetryPoint {
  time: string;
  cpu: number;
  memory: number;
}

interface CpuMemoryGraphProps {
  history: TelemetryPoint[];
}

export const CpuMemoryGraph: React.FC<CpuMemoryGraphProps> = ({ history }) => {
  const [isPaused, setIsPaused] = useState(false);

  // SVG dimensions
  const width = 800;
  const height = 110;
  const paddingBottom = 18;
  const paddingTop = 10;
  const graphHeight = height - paddingBottom - paddingTop;

  if (history.length === 0) return null;

  // Max scale values
  const maxCpu = 100;
  const maxMemory = 1200; // 1200 MB max display scale

  const pointsCount = history.length;
  const stepX = width / Math.max(1, pointsCount - 1);

  // Build SVG path points for CPU
  const cpuPoints = history.map((pt, i) => {
    const x = i * stepX;
    const y = paddingTop + graphHeight - (Math.min(maxCpu, pt.cpu) / maxCpu) * graphHeight;
    return `${x},${y}`;
  });

  const cpuPathD = cpuPoints.length > 0 
    ? `M ${cpuPoints[0]} ` + cpuPoints.slice(1).map(p => `L ${p}`).join(' ')
    : '';

  const cpuAreaD = cpuPoints.length > 0
    ? `${cpuPathD} L ${width},${height - paddingBottom} L 0,${height - paddingBottom} Z`
    : '';

  // Build SVG path points for Memory
  const memPoints = history.map((pt, i) => {
    const x = i * stepX;
    const y = paddingTop + graphHeight - (Math.min(maxMemory, pt.memory) / maxMemory) * graphHeight;
    return `${x},${y}`;
  });

  const memPathD = memPoints.length > 0 
    ? `M ${memPoints[0]} ` + memPoints.slice(1).map(p => `L ${p}`).join(' ')
    : '';

  const latest = history[history.length - 1] || { cpu: 0, memory: 0, time: '' };

  return (
    <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-4">
      
      {/* Header with Title and Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider font-mono">
            Live Telemetry Timeline
          </span>
          <span className="text-zinc-500 text-xs font-mono">
            30s Rolling Buffer
          </span>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-emerald-400 rounded-full" />
            <span className="text-zinc-400">CPU:</span>
            <span className="text-emerald-400 font-bold">{latest.cpu.toFixed(1)}%</span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-indigo-400 rounded-full" />
            <span className="text-zinc-400">RAM:</span>
            <span className="text-indigo-400 font-bold">{latest.memory.toFixed(0)} MB</span>
          </div>

          <button
            onClick={() => setIsPaused(!isPaused)}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
            title={isPaused ? 'Resume live graphing' : 'Freeze timeline'}
          >
            {isPaused ? <Play className="w-3.5 h-3.5 text-amber-400" /> : <Pause className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* SVG Timeline */}
      <div className="w-full overflow-hidden relative">
        <svg 
          viewBox={`0 0 ${width} ${height}`} 
          className="w-full h-24 sm:h-28 overflow-visible"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          <line x1="0" y1={paddingTop} x2={width} y2={paddingTop} stroke="#27272a" strokeDasharray="3 3" />
          <line x1="0" y1={paddingTop + graphHeight * 0.5} x2={width} y2={paddingTop + graphHeight * 0.5} stroke="#27272a" strokeDasharray="3 3" />
          <line x1="0" y1={height - paddingBottom} x2={width} y2={height - paddingBottom} stroke="#3f3f46" />

          {/* Area under curves */}
          {cpuAreaD && <path d={cpuAreaD} fill="url(#cpuGradient)" />}
          
          {/* Paths */}
          {memPathD && (
            <path
              d={memPathD}
              fill="none"
              stroke="#818cf8"
              strokeWidth="1.5"
              strokeDasharray="2 2"
              className="transition-all duration-300"
            />
          )}

          {cpuPathD && (
            <path
              d={cpuPathD}
              fill="none"
              stroke="#34d399"
              strokeWidth="2"
              className="transition-all duration-300"
            />
          )}

          {/* Latest Point Pulsing Dot */}
          {cpuPoints.length > 0 && (
            <circle
              cx={width}
              cy={parseFloat(cpuPoints[cpuPoints.length - 1].split(',')[1])}
              r="3.5"
              fill="#10b981"
              className="animate-pulse"
            />
          )}
        </svg>

        {/* Axis Labels */}
        <div className="flex justify-between items-center text-[10px] text-zinc-500 font-mono mt-1 px-1">
          <span>-30s</span>
          <span>-20s</span>
          <span>-10s</span>
          <span className="text-emerald-400 font-semibold">Live (NOW)</span>
        </div>
      </div>

    </div>
  );
};
