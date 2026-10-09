import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  startMeasurement,
  TimingRingBuffer,
  analysisTimingBuffer,
  type AnalysisTiming,
} from '../utils/perfMonitor';

describe('startMeasurement', () => {
  it('returns an AnalysisTiming with non-negative durationMs', () => {
    const stop = startMeasurement('test.label');
    const timing = stop(10);

    expect(timing.label).toBe('test.label');
    expect(timing.durationMs).toBeGreaterThanOrEqual(0);
    expect(timing.messageCount).toBe(10);
    expect(typeof timing.completedAt).toBe('string');
  });

  it('calculates msPerMessage correctly', () => {
    const stop = startMeasurement('test.mpm');
    // Simulate elapsed time by a tiny busy-wait (not reliable in all envs,
    // so we just verify the formula, not the absolute value).
    const timing = stop(5);
    const expected = timing.messageCount > 0 ? timing.durationMs / timing.messageCount : 0;
    expect(timing.msPerMessage).toBeCloseTo(expected, 6);
  });

  it('returns msPerMessage of 0 when messageCount is 0', () => {
    const stop = startMeasurement('test.zero');
    const timing = stop(0);
    expect(timing.msPerMessage).toBe(0);
  });

  it('completedAt is a valid ISO string', () => {
    const stop = startMeasurement('test.iso');
    const timing = stop(1);
    expect(() => new Date(timing.completedAt)).not.toThrow();
    expect(new Date(timing.completedAt).getTime()).not.toBeNaN();
  });
});

describe('TimingRingBuffer', () => {
  function makeTiming(label: string, durationMs: number, messageCount = 10): AnalysisTiming {
    return {
      label,
      durationMs,
      messageCount,
      completedAt: new Date().toISOString(),
      msPerMessage: messageCount > 0 ? durationMs / messageCount : 0,
    };
  }

  it('stores items up to its capacity', () => {
    const buf = new TimingRingBuffer(3);
    buf.push(makeTiming('a', 10));
    buf.push(makeTiming('b', 20));
    buf.push(makeTiming('c', 30));
    expect(buf.size).toBe(3);
    expect(buf.all().map(t => t.label)).toEqual(['a', 'b', 'c']);
  });

  it('evicts the oldest entry when capacity is exceeded', () => {
    const buf = new TimingRingBuffer(3);
    buf.push(makeTiming('a', 10));
    buf.push(makeTiming('b', 20));
    buf.push(makeTiming('c', 30));
    buf.push(makeTiming('d', 40));
    expect(buf.size).toBe(3);
    expect(buf.all().map(t => t.label)).toEqual(['b', 'c', 'd']);
  });

  it('returns the latest timing via latest()', () => {
    const buf = new TimingRingBuffer(5);
    buf.push(makeTiming('first', 5));
    buf.push(makeTiming('last', 50));
    expect(buf.latest()?.label).toBe('last');
  });

  it('returns null from latest() when empty', () => {
    expect(new TimingRingBuffer().latest()).toBeNull();
  });

  it('calculates averageDurationMs correctly', () => {
    const buf = new TimingRingBuffer(10);
    buf.push(makeTiming('a', 100));
    buf.push(makeTiming('b', 200));
    buf.push(makeTiming('c', 300));
    expect(buf.averageDurationMs()).toBe(200);
  });

  it('returns 0 averageDurationMs when empty', () => {
    expect(new TimingRingBuffer().averageDurationMs()).toBe(0);
  });

  it('clears all entries', () => {
    const buf = new TimingRingBuffer(5);
    buf.push(makeTiming('x', 10));
    buf.clear();
    expect(buf.size).toBe(0);
    expect(buf.all()).toEqual([]);
  });

  it('all() returns a shallow copy — mutating the returned array does not affect the buffer', () => {
    const buf = new TimingRingBuffer(5);
    buf.push(makeTiming('x', 10));
    const copy = buf.all();
    copy.pop();
    expect(buf.size).toBe(1);
  });

  it('minimum capacity of 1 is enforced', () => {
    const buf = new TimingRingBuffer(0);
    buf.push(makeTiming('a', 10));
    buf.push(makeTiming('b', 20));
    expect(buf.size).toBe(1);
    expect(buf.latest()?.label).toBe('b');
  });
});

describe('analysisTimingBuffer (shared singleton)', () => {
  beforeEach(() => {
    analysisTimingBuffer.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('is initially empty after clear()', () => {
    expect(analysisTimingBuffer.all()).toHaveLength(0);
  });

  it('accepts pushed entries and reflects them in latest()', () => {
    const stop = startMeasurement('pipeline');
    const timing = stop(20);
    analysisTimingBuffer.push(timing);
    expect(analysisTimingBuffer.latest()).toEqual(timing);
  });
});
