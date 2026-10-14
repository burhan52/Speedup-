import React from 'react';
import { Search, Plus, SlidersHorizontal, X } from 'lucide-react';
import { ProcessCategory } from '../types/process';

export type FilterStatus = 'all' | 'running' | 'stopped' | 'workers' | 'high-impact';
export type SortOption = 'cpu' | 'memory' | 'name' | 'pid' | 'battery';

interface ProcessFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  statusFilter: FilterStatus;
  onStatusFilterChange: (s: FilterStatus) => void;
  categoryFilter: ProcessCategory | 'All';
  onCategoryFilterChange: (c: ProcessCategory | 'All') => void;
  sortBy: SortOption;
  onSortByChange: (s: SortOption) => void;
  onOpenNewProcessModal: () => void;
  counts: {
    all: number;
    running: number;
    stopped: number;
    workers: number;
    highImpact: number;
  };
}

export const ProcessFilterBar: React.FC<ProcessFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  categoryFilter,
  onCategoryFilterChange,
  sortBy,
  onSortByChange,
  onOpenNewProcessModal,
  counts,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        
        {/* Search Bar */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Filter processes by name, PID (e.g. 1420), tag..."
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-8 py-2 text-xs text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-emerald-500/80 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Action Controls: Category, Sort, and Add New */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Category Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
            <span className="text-zinc-500 text-[11px]">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => onCategoryFilterChange(e.target.value as ProcessCategory | 'All')}
              className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="All" className="bg-zinc-900">All Categories</option>
              <option value="System" className="bg-zinc-900">System Daemons</option>
              <option value="Application" className="bg-zinc-900">User Apps</option>
              <option value="Network" className="bg-zinc-900">Network Sockets</option>
              <option value="Worker" className="bg-zinc-900">Web Workers</option>
              <option value="Maintenance" className="bg-zinc-900">Maintenance & GC</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-1.5">
            <SlidersHorizontal className="w-3 h-3 text-zinc-500" />
            <span className="text-zinc-500 text-[11px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortOption)}
              className="bg-transparent text-zinc-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="cpu" className="bg-zinc-900">CPU Load (High to Low)</option>
              <option value="memory" className="bg-zinc-900">Memory (High to Low)</option>
              <option value="battery" className="bg-zinc-900">Battery Impact</option>
              <option value="pid" className="bg-zinc-900">PID Number</option>
              <option value="name" className="bg-zinc-900">Process Name</option>
            </select>
          </div>

          {/* Create Custom Process Button */}
          <button
            onClick={onOpenNewProcessModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Background Task</span>
          </button>

        </div>

      </div>

      {/* Segmented Filter Buttons */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800/80 rounded-lg text-xs">
        
        <button
          onClick={() => onStatusFilterChange('all')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            statusFilter === 'all'
              ? 'bg-zinc-800 text-zinc-100 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          All Processes ({counts.all})
        </button>

        <button
          onClick={() => onStatusFilterChange('running')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            statusFilter === 'running'
              ? 'bg-zinc-800 text-emerald-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
          <span>Active / ON ({counts.running})</span>
        </button>

        <button
          onClick={() => onStatusFilterChange('stopped')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-colors ${
            statusFilter === 'stopped'
              ? 'bg-zinc-800 text-zinc-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-zinc-600 inline-block" />
          <span>Suspended / OFF ({counts.stopped})</span>
        </button>

        <button
          onClick={() => onStatusFilterChange('workers')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            statusFilter === 'workers'
              ? 'bg-zinc-800 text-indigo-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Web Workers ({counts.workers})
        </button>

        <button
          onClick={() => onStatusFilterChange('high-impact')}
          className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
            statusFilter === 'high-impact'
              ? 'bg-zinc-800 text-amber-300 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          Heavy Drain ({counts.highImpact})
        </button>

      </div>
    </div>
  );
};
