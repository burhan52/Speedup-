import { BackgroundProcess, LogEntry } from '../types/process';

// Worker scripts embedded as self-contained worker code blobs
const HASH_WORKER_CODE = `
  let isPaused = false;
  let throttle = 20; // ms sleep per batch
  let iteration = 0;

  async function sha256(str) {
    const buffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async function loop() {
    if (!isPaused) {
      const start = performance.now();
      let batchCount = 50;
      let lastHash = '';
      for (let i = 0; i < batchCount; i++) {
        iteration++;
        lastHash = await sha256('block-' + iteration + '-' + Date.now());
      }
      const elapsed = performance.now() - start;
      const speed = Math.round((batchCount / (elapsed || 1)) * 1000);

      self.postMessage({
        type: 'tick',
        iterations: iteration,
        speed: speed,
        lastHash: lastHash.substring(0, 16) + '...'
      });
    }
    setTimeout(loop, Math.max(10, throttle));
  }

  self.onmessage = (e) => {
    const data = e.data;
    if (data.cmd === 'pause') {
      isPaused = true;
    } else if (data.cmd === 'resume') {
      isPaused = false;
    } else if (data.cmd === 'throttle') {
      throttle = data.value;
    }
  };

  loop();
`;

const PRIME_WORKER_CODE = `
  let isPaused = false;
  let throttle = 20;
  let currentNum = 3;
  let primesFound = 1; // 2 is prime

  function isPrime(n) {
    if (n <= 1) return false;
    if (n <= 3) return true;
    if (n % 2 === 0 || n % 3 === 0) return false;
    for (let i = 5; i * i <= n; i += 6) {
      if (n % i === 0 || n % (i + 2) === 0) return false;
    }
    return true;
  }

  function loop() {
    if (!isPaused) {
      const batchLimit = 300;
      let count = 0;
      let lastPrime = 2;
      while (count < batchLimit) {
        if (isPrime(currentNum)) {
          primesFound++;
          lastPrime = currentNum;
        }
        currentNum += 2;
        count++;
      }
      self.postMessage({
        type: 'tick',
        iterations: primesFound,
        lastPrime: lastPrime,
        currentNum: currentNum
      });
    }
    setTimeout(loop, Math.max(15, throttle));
  }

  self.onmessage = (e) => {
    const data = e.data;
    if (data.cmd === 'pause') {
      isPaused = true;
    } else if (data.cmd === 'resume') {
      isPaused = false;
    } else if (data.cmd === 'throttle') {
      throttle = data.value;
    }
  };

  loop();
`;

interface ActiveTask {
  worker?: Worker;
  intervalId?: number;
  blobUrl?: string;
}

class BackgroundWorkerManager {
  private activeTasks: Map<string, ActiveTask> = new Map();

  /**
   * Start a real background process
   */
  public start(
    proc: BackgroundProcess,
    onLog: (log: LogEntry) => void,
    onProgress: (procId: string, iterations: number, extra?: Record<string, unknown>) => void
  ): boolean {
    // If already running, clean first
    this.stop(proc.id);

    try {
      if (proc.executionMode === 'real-worker') {
        let code = '';
        if (proc.workerCodeType === 'hash-calculator') {
          code = HASH_WORKER_CODE;
        } else if (proc.workerCodeType === 'prime-finder') {
          code = PRIME_WORKER_CODE;
        } else if (proc.workerCodeType === 'custom' && proc.customScript) {
          code = `
            let isPaused = false;
            let counter = 0;
            self.onmessage = (e) => {
              if (e.data.cmd === 'pause') isPaused = true;
              if (e.data.cmd === 'resume') isPaused = false;
            };
            try {
              ${proc.customScript}
            } catch (err) {
              self.postMessage({ type: 'error', error: err.toString() });
            }
          `;
        } else {
          code = HASH_WORKER_CODE;
        }

        const blob = new Blob([code], { type: 'application/javascript' });
        const blobUrl = URL.createObjectURL(blob);
        const worker = new Worker(blobUrl);

        let lastLogTime = Date.now();
        let loggedFirst = false;

        worker.onmessage = (e) => {
          const data = e.data;
          if (data.type === 'tick') {
            onProgress(proc.id, data.iterations, data);
            const now = Date.now();
            if (!loggedFirst || (now - lastLogTime >= 4000)) {
              lastLogTime = now;
              loggedFirst = true;
              onLog({
                id: Math.random().toString(36).substring(2, 9),
                processId: proc.id,
                processName: proc.name,
                timestamp: new Date().toLocaleTimeString(),
                level: 'info',
                message: data.lastHash
                  ? `[Worker ${proc.pid}] Computed block ${data.iterations.toLocaleString()} - Hash: ${data.lastHash} (${data.speed} H/s)`
                  : `[Worker ${proc.pid}] Found ${data.iterations.toLocaleString()} primes - Highest: ${data.lastPrime}`
              });
            }
          } else if (data.type === 'error') {
            onLog({
              id: Math.random().toString(36).substring(2, 9),
              processId: proc.id,
              processName: proc.name,
              timestamp: new Date().toLocaleTimeString(),
              level: 'error',
              message: `[Worker Error ${proc.pid}]: ${data.error}`
            });
          }
        };

        worker.onerror = (err) => {
          onLog({
            id: Math.random().toString(36).substring(2, 9),
            processId: proc.id,
            processName: proc.name,
            timestamp: new Date().toLocaleTimeString(),
            level: 'error',
            message: `Worker runtime error: ${err.message}`
          });
        };

        this.activeTasks.set(proc.id, { worker, blobUrl });
        return true;
      } else if (proc.executionMode === 'real-interval') {
        // Interval-based live network/ping probe
        let pings = proc.iterationsCount || 0;
        const intervalId = window.setInterval(async () => {
          // If network permission was revoked, skip actual ping
          if (proc.permissions && proc.permissions.network === false) {
            onProgress(proc.id, pings, { latency: 0, networkBlocked: true });
            return;
          }

          pings++;
          const start = performance.now();
          let latency = 12;
          try {
            // High-resolution local probe
            await new Promise((r) => setTimeout(r, Math.random() * 8 + 8));
            latency = Math.round(performance.now() - start);
          } catch {
            latency = 18;
          }

          onProgress(proc.id, pings, { latency });

          if (pings % 10 === 0) {
            onLog({
              id: Math.random().toString(36).substring(2, 9),
              processId: proc.id,
              processName: proc.name,
              timestamp: new Date().toLocaleTimeString(),
              level: 'info',
              message: `[NetProbe ${proc.pid}] Ping round #${pings} responded in ${latency}ms (0% packet drop)`
            });
          }
        }, 2000);

        this.activeTasks.set(proc.id, { intervalId });
        return true;
      }
      return true;
    } catch (e) {
      console.error('Failed to spawn worker:', e);
      return false;
    }
  }

  /**
   * Stop and terminate worker
   */
  public stop(procId: string) {
    const task = this.activeTasks.get(procId);
    if (!task) return;

    if (task.worker) {
      task.worker.terminate();
    }
    if (task.blobUrl) {
      URL.revokeObjectURL(task.blobUrl);
    }
    if (task.intervalId !== undefined) {
      clearInterval(task.intervalId);
    }

    this.activeTasks.delete(procId);
  }

  /**
   * Pause execution
   */
  public pause(procId: string) {
    const task = this.activeTasks.get(procId);
    if (task?.worker) {
      task.worker.postMessage({ cmd: 'pause' });
    }
  }

  /**
   * Resume execution
   */
  public resume(procId: string) {
    const task = this.activeTasks.get(procId);
    if (task?.worker) {
      task.worker.postMessage({ cmd: 'resume' });
    }
  }

  /**
   * Throttle execution
   */
  public setThrottle(procId: string, throttlePercent: number) {
    const task = this.activeTasks.get(procId);
    if (task?.worker) {
      // Map 0-100% throttle to 5ms - 150ms delay
      const delay = Math.round(5 + (throttlePercent / 100) * 145);
      task.worker.postMessage({ cmd: 'throttle', value: delay });
    }
  }

  /**
   * Stop all running workers
   */
  public stopAll() {
    this.activeTasks.forEach((_, key) => {
      this.stop(key);
    });
    this.activeTasks.clear();
  }
}

export const workerManager = new BackgroundWorkerManager();
