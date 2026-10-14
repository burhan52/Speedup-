import React, { useState } from 'react';
import { Terminal, ChevronUp, ChevronDown, Trash2, Copy, Check } from 'lucide-react';
import { LogEntry } from '../types/process';

interface LiveConsoleDrawerProps {
  logs: LogEntry[];
  onClearLogs: () => void;
}

export const LiveConsoleDrawer: React.FC<LiveConsoleDrawerProps> = ({
  logs,
  onClearLogs,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [filterLevel, setFilterLevel] = useState<'all' | 'info' | 'warn' | 'error' | 'sys'>('all');

  const filteredLogs = logs.filter(
    (l) => filterLevel === 'all' || l.level === filterLevel
  );

  const handleCopy = () => {
    const text = filteredLogs
      .map((l) => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`)
      .join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800 shadow-2xl transition-all duration-300">
      
      {/* Drawer Bar Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 sm:px-6 py-2.5 flex items-center justify-between cursor-pointer hover:bg-zinc-900/80 transition-colors select-none"
      >
        <div className="flex items-center gap-2.5 text-xs">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-zinc-200 font-mono">
            Daemon Event Console
          </span>
          <span className="text-zinc-500 font-mono text-[11px]">
            ({logs.length} signals logged)
          </span>
          {logs.length > 0 && !isOpen && (
            <span className="text-zinc-400 font-mono text-[11px] truncate max-w-xs sm:max-w-md hidden md:inline">
              Latest: {logs[0]?.message}
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[11px] font-mono text-zinc-500 hidden sm:inline">
            {isOpen ? 'Click to collapse' : 'Click to expand live console'}
          </span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          )}
        </div>
      </div>

      {/* Expanded Console Window */}
      {isOpen && (
        <div className="border-t border-zinc-900 bg-zinc-950 px-4 sm:px-6 py-3 space-y-3">
          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Level Filter Buttons */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 rounded-lg p-0.5 text-[11px] font-mono">
              {(['all', 'info', 'warn', 'error', 'sys'] as const).map((lvl) => (
                <button
                  key={lvl}
                  onClick={() => setFilterLevel(lvl)}
                  className={`px-2 py-0.5 rounded capitalize transition-colors ${
                    filterLevel === lvl
                      ? 'bg-zinc-800 text-zinc-100 font-semibold shadow-sm'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>

            {/* Utility actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 border border-zinc-800 transition-colors"
              >
                {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                <span>{copied ? 'Copied' : 'Copy Logs'}</span>
              </button>

              <button
                onClick={onClearLogs}
                className="flex items-center gap-1 text-[11px] font-mono px-2.5 py-1 rounded bg-zinc-900 hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 border border-zinc-800 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Clear</span>
              </button>
            </div>
          </div>

          {/* Logs View Area */}
          <div className="h-44 overflow-y-auto bg-black/60 border border-zinc-900 rounded-lg p-3 font-mono text-xs space-y-1">
            {filteredLogs.length === 0 ? (
              <div className="text-zinc-600 text-center py-10 text-[11px]">
                No signal events recorded in buffer.
              </div>
            ) : (
              filteredLogs.map((log) => {
                const levelColor =
                  log.level === 'error'
                    ? 'text-rose-400'
                    : log.level === 'warn'
                    ? 'text-amber-400'
                    : log.level === 'sys'
                    ? 'text-sky-400'
                    : 'text-emerald-400';

                return (
                  <div key={log.id} className="leading-relaxed flex items-start gap-2">
                    <span className="text-zinc-600 shrink-0 text-[11px]">[{log.timestamp}]</span>
                    <span className={`shrink-0 font-semibold text-[11px] ${levelColor}`}>
                      [{log.level.toUpperCase()}]
                    </span>
                    <span className="text-zinc-300 break-all text-[11px]">{log.message}</span>
                  </div>
                );
              })
            )}
          </div>

        </div>
      )}

    </div>
  );
};
