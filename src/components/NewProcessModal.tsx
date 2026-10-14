import React, { useState } from 'react';
import { X, Plus, Cpu, HardDrive } from 'lucide-react';
import { BackgroundProcess, ProcessCategory, ProcessPriority, ExecutionMode } from '../types/process';
import { sound } from '../utils/audio';

interface NewProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (process: BackgroundProcess) => void;
}

export const NewProcessModal: React.FC<NewProcessModalProps> = ({
  isOpen,
  onClose,
  onCreate,
}) => {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProcessCategory>('Worker');
  const [executionMode, setExecutionMode] = useState<ExecutionMode>('real-worker');
  const [workerType, setWorkerType] = useState<'hash-calculator' | 'prime-finder' | 'custom'>('hash-calculator');
  const [customScript, setCustomScript] = useState('let c = 0;\nsetInterval(() => {\n  c++;\n  self.postMessage({ type: "tick", iterations: c });\n}, 100);');
  const [priority, setPriority] = useState<ProcessPriority>('normal');
  const [targetCpu, setTargetCpu] = useState(12);
  const [targetRam, setTargetRam] = useState(48);
  const [startImmediately, setStartImmediately] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPid = Math.floor(4000 + Math.random() * 5000);
    const newProcess: BackgroundProcess = {
      id: `proc-custom-${Date.now()}`,
      pid: newPid,
      name: name.trim(),
      description: description.trim() || 'Custom user background worker process.',
      category,
      status: startImmediately ? 'running' : 'stopped',
      isEnabled: startImmediately,
      priority,
      executionMode,
      workerCodeType: executionMode === 'real-worker' ? workerType : undefined,
      customScript: executionMode === 'real-worker' && workerType === 'custom' ? customScript : undefined,
      cpuPercent: startImmediately ? targetCpu : 0,
      targetCpuPercent: targetCpu,
      memoryMb: startImmediately ? targetRam : 0,
      targetMemoryMb: targetRam,
      networkKbps: category === 'Network' ? 14.2 : 0,
      batteryImpact: targetCpu > 20 ? 'high' : targetCpu > 10 ? 'moderate' : 'low',
      threads: 2,
      uptimeSeconds: 0,
      autoRestart: false,
      throttlePercent: 0,
      iterationsCount: 0,
      tags: ['user-process', category.toLowerCase(), executionMode],
      permissions: {
        location: false,
        network: category === 'Network',
        notifications: true,
        storage: true,
        bluetooth: false,
        battery_unrestricted: true,
        camera: false,
        microphone: false,
      }
    };

    sound.playToggleOn();
    onCreate(newProcess);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div 
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b border-zinc-800 px-6 py-4 flex items-center justify-between bg-zinc-900/60">
          <div>
            <h2 className="text-base font-bold text-zinc-100">
              Spawn New Background Process
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Launch a real browser Web Worker or background service daemon
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto max-h-[75vh]">
          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1">
              Process Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Distributed Raymarch Worker or Sync Streamer"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-1">
              Description & Task Purpose
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Computes matrix transformations in isolated Web Worker"
              className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Category & Runtime */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-200 block mb-1">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProcessCategory)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Worker">Worker</option>
                <option value="Application">Application</option>
                <option value="Network">Network</option>
                <option value="System">System</option>
                <option value="Maintenance">Maintenance</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-200 block mb-1">
                Execution Model
              </label>
              <select
                value={executionMode}
                onChange={(e) => setExecutionMode(e.target.value as ExecutionMode)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="real-worker">Real Web Worker (In-Browser)</option>
                <option value="real-interval">Real Interval Probe</option>
                <option value="simulated-daemon">Managed System Daemon</option>
              </select>
            </div>
          </div>

          {/* Web Worker Script Preset */}
          {executionMode === 'real-worker' && (
            <div className="space-y-2 p-3 bg-zinc-900 border border-zinc-800 rounded-xl">
              <label className="text-xs font-semibold text-zinc-200 block">
                Worker Computation Algorithm
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setWorkerType('hash-calculator')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    workerType === 'hash-calculator'
                      ? 'bg-zinc-800 text-indigo-300 border-indigo-500/50'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  SHA-256 Hasher
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerType('prime-finder')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    workerType === 'prime-finder'
                      ? 'bg-zinc-800 text-indigo-300 border-indigo-500/50'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Prime Sieve
                </button>
                <button
                  type="button"
                  onClick={() => setWorkerType('custom')}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                    workerType === 'custom'
                      ? 'bg-zinc-800 text-indigo-300 border-indigo-500/50'
                      : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                  }`}
                >
                  Custom JS
                </button>
              </div>

              {workerType === 'custom' && (
                <div className="pt-2">
                  <span className="text-[11px] text-zinc-400 block mb-1 font-mono">Worker JavaScript Body:</span>
                  <textarea
                    rows={4}
                    value={customScript}
                    onChange={(e) => setCustomScript(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 font-mono text-[11px] text-zinc-300 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* Load estimates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-200 block mb-1 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-zinc-400" />
                Target CPU Draw: {targetCpu}%
              </label>
              <input
                type="range"
                min="1"
                max="60"
                value={targetCpu}
                onChange={(e) => setTargetCpu(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-200 block mb-1 flex items-center gap-1">
                <HardDrive className="w-3 h-3 text-zinc-400" />
                Target RAM: {targetRam} MB
              </label>
              <input
                type="range"
                min="10"
                max="256"
                step="2"
                value={targetRam}
                onChange={(e) => setTargetRam(Number(e.target.value))}
                className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
              />
            </div>
          </div>

          {/* Initial State Toggle */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800">
            <div>
              <span className="text-xs font-semibold text-zinc-200 block">Spawn State</span>
              <span className="text-[11px] text-zinc-500">Launch in background immediately upon creation</span>
            </div>
            <button
              type="button"
              onClick={() => setStartImmediately(!startImmediately)}
              className={`w-10 h-6 rounded-full p-1 transition-colors ${
                startImmediately ? 'bg-emerald-600' : 'bg-zinc-800'
              }`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform ${
                startImmediately ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Spawn Background Process</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
