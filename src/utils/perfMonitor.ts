/**
 * MISSED. — High-precision performance monitoring utility.
 *
 * Measures analysis pipeline timing using the Performance API (sub-millisecond
 * resolution) and provides structured telemetry for in-browser diagnostics.
 * No telemetry data is transmitted to any external service.
 */

export interface AnalysisTiming {
  /** Unique label identifying this measurement. */
  label: string;
  /** Wall-clock duration in milliseconds (float, high-precision). */
  durationMs: number;
  /** Number of messages processed in this analysis. */
  messageCount: number;
  /** ISO timestamp of when the analysis completed. */
  completedAt: string;
  /** Average processing time per message (ms). */
  msPerMessage: number;
}

export interface PerfSample {
  label: string;
  startMark: string;
  endMark: string;
}

/**
 * Starts a named performance measurement.
 * Returns a stop function that finalises the measurement and returns the
 * structured AnalysisTiming object.
 */
export function startMeasurement(label: string): (messageCount: number) => AnalysisTiming {
  const startMark = `missed.${label}.start.${Date.now()}`;
  const endMark = `missed.${label}.end.${Date.now()}`;

  // Use Performance API if available; fall back to Date.now() for environments
  // that do not expose it (e.g., some test runners).
  const usePerf = typeof performance !== 'undefined' && typeof performance.mark === 'function';

  const startTime = usePerf ? performance.now() : Date.now();
  if (usePerf) {
    try {
      performance.mark(startMark);
    } catch {
      // Non-fatal — fall back to Date.now() timing already captured above.
    }
  }

  return function stop(messageCount: number): AnalysisTiming {
    const endTime = usePerf ? performance.now() : Date.now();
    if (usePerf) {
      try {
        performance.mark(endMark);
        performance.measure(`missed.${label}`, startMark, endMark);
      } catch {
        // Non-fatal.
      }
    }

    const durationMs = Math.max(0, endTime - startTime);
    return {
      label,
      durationMs,
      messageCount,
      completedAt: new Date().toISOString(),
      msPerMessage: messageCount > 0 ? durationMs / messageCount : 0,
    };
  };
}

/**
 * Lightweight in-memory ring buffer that retains the last N timing samples.
 * Useful for tracking analysis performance across multiple runs without
 * growing memory unboundedly.
 */
export class TimingRingBuffer {
  private readonly capacity: number;
  private buffer: AnalysisTiming[] = [];

  constructor(capacity = 20) {
    this.capacity = Math.max(1, capacity);
  }

  push(timing: AnalysisTiming): void {
    if (this.buffer.length >= this.capacity) {
      this.buffer.shift();
    }
    this.buffer.push(timing);
  }

  /** Returns a shallow copy of all stored samples, oldest first. */
  all(): AnalysisTiming[] {
    return [...this.buffer];
  }

  /** Returns the most recent timing sample, or null if empty. */
  latest(): AnalysisTiming | null {
    return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null;
  }

  /** Returns the average durationMs across all stored samples. */
  averageDurationMs(): number {
    if (this.buffer.length === 0) return 0;
    return this.buffer.reduce((sum, t) => sum + t.durationMs, 0) / this.buffer.length;
  }

  clear(): void {
    this.buffer = [];
  }

  /** Returns the number of entries currently stored in the buffer. */
  get size(): number {
    return this.buffer.length;
  }
}

/** Shared singleton ring buffer for the analysis pipeline. */
export const analysisTimingBuffer = new TimingRingBuffer(20);
