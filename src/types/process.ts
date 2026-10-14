export type ProcessCategory = 'System' | 'Application' | 'Network' | 'Worker' | 'Maintenance';

export type ProcessStatus = 'running' | 'stopped' | 'paused' | 'starting' | 'error';

export type ProcessPriority = 'low' | 'normal' | 'high' | 'critical';

export type BatteryImpact = 'minimal' | 'low' | 'moderate' | 'high';

export type ExecutionMode = 'real-worker' | 'real-interval' | 'simulated-daemon';

export type AppPermissionKey = 
  | 'location'
  | 'network'
  | 'notifications'
  | 'storage'
  | 'bluetooth'
  | 'battery_unrestricted'
  | 'camera'
  | 'microphone';

export interface AppPermissionDefinition {
  key: AppPermissionKey;
  label: string;
  shortLabel: string;
  category: 'Privacy' | 'Network' | 'Hardware' | 'System';
  isSensitive: boolean;
  description: string;
}

export const APP_PERMISSIONS_CONFIG: AppPermissionDefinition[] = [
  {
    key: 'location',
    label: 'Location & Geofence',
    shortLabel: 'Location',
    category: 'Privacy',
    isSensitive: true,
    description: 'Access precise GPS, Wi-Fi trilateration, and passive geofencing in background.'
  },
  {
    key: 'network',
    label: 'Background Network & Data',
    shortLabel: 'Network',
    category: 'Network',
    isSensitive: false,
    description: 'Send and receive TCP/UDP sockets, API syncs, and telemetry payloads.'
  },
  {
    key: 'notifications',
    label: 'Push & Status Alerts',
    shortLabel: 'Notify',
    category: 'System',
    isSensitive: false,
    description: 'Post foreground alerts, badge numbers, and sound alerts.'
  },
  {
    key: 'storage',
    label: 'Disk & File System',
    shortLabel: 'Storage',
    category: 'Hardware',
    isSensitive: false,
    description: 'Read and write local cache, document replicas, and persistent database files.'
  },
  {
    key: 'bluetooth',
    label: 'Bluetooth & Nearby Radio',
    shortLabel: 'Bluetooth',
    category: 'Hardware',
    isSensitive: true,
    description: 'Scan and maintain low-energy beacon connections to wireless accessories.'
  },
  {
    key: 'battery_unrestricted',
    label: 'Unrestricted Background Run',
    shortLabel: 'No Sleep',
    category: 'System',
    isSensitive: false,
    description: 'Prevent OS scheduler from putting process into sleep / deep hibernation.'
  },
  {
    key: 'camera',
    label: 'Camera & Optical Sensor',
    shortLabel: 'Camera',
    category: 'Privacy',
    isSensitive: true,
    description: 'Access visual video feed and frame capture interfaces in background.'
  },
  {
    key: 'microphone',
    label: 'Microphone & Audio Stream',
    shortLabel: 'Mic',
    category: 'Privacy',
    isSensitive: true,
    description: 'Listen to ambient audio hardware and record voice input stream.'
  }
];

export interface LogEntry {
  id: string;
  processId: string;
  processName: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'sys';
  message: string;
}

export interface BackgroundProcess {
  id: string;
  pid: number;
  name: string;
  description: string;
  category: ProcessCategory;
  status: ProcessStatus;
  isEnabled: boolean; // Main toggle switch state
  priority: ProcessPriority;
  executionMode: ExecutionMode;
  cpuPercent: number; // 0 - 100
  targetCpuPercent: number; // base CPU draw when running
  memoryMb: number; // in MB
  targetMemoryMb: number;
  networkKbps: number;
  batteryImpact: BatteryImpact;
  threads: number;
  uptimeSeconds: number;
  autoRestart: boolean;
  throttlePercent: number; // 0 - 100% throttle
  impactWarning?: string;
  tags: string[];
  // App Permissions map (All permissions on / off)
  permissions: Record<AppPermissionKey, boolean>;
  // Execution metadata for real workers
  workerCodeType?: 'hash-calculator' | 'prime-finder' | 'ping-monitor' | 'matrix-math' | 'custom';
  customScript?: string;
  iterationsCount?: number;
  lastRunTimestamp?: number;
}

export interface SystemMetrics {
  totalCpu: number;
  totalMemoryMb: number;
  maxMemoryMb: number;
  runningCount: number;
  stoppedCount: number;
  totalCount: number;
  networkThroughputKbps: number;
  batteryDrainWatts: number;
  estimatedBatterySavedMinutes: number;
  // Permissions stats
  totalGrantedPermissions: number;
  totalRevokedPermissions: number;
  sensitiveGrantedCount: number;
}

export type PresetProfile = 'balanced' | 'performance' | 'battery-saver' | 'gaming' | 'privacy';
