import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from '../utils/debounce';

describe('debounce', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not call the function before the delay elapses', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced('a');
    expect(fn).not.toHaveBeenCalled();
  });

  it('calls the function once after the delay', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced('a');
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('a');
  });

  it('resets the timer on each call — only fires once after the final call', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced('a');
    vi.advanceTimersByTime(100);
    debounced('b');
    vi.advanceTimersByTime(100);
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('b');
  });

  it('passes multiple arguments correctly', () => {
    const fn = vi.fn<(a: string, b: number) => void>();
    const debounced = debounce(fn, 100);
    debounced('hello', 42);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledWith('hello', 42);
  });

  it('cancel() prevents a pending call from firing', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    debounced('a');
    debounced.cancel();
    vi.advanceTimersByTime(300);
    expect(fn).not.toHaveBeenCalled();
  });

  it('cancel() is safe to call when no call is pending', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 200);
    expect(() => debounced.cancel()).not.toThrow();
  });

  it('clamps negative delay to 0 (fires on next timer tick)', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, -500);
    debounced();
    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('clamps non-finite delay to 0', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, NaN);
    debounced();
    vi.advanceTimersByTime(0);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('can be called again normally after cancel()', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('first');
    debounced.cancel();
    debounced('second');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith('second');
  });

  it('fires multiple independent calls after their respective delays', () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 100);
    debounced('a');
    vi.advanceTimersByTime(100);
    debounced('b');
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    expect(fn).toHaveBeenNthCalledWith(1, 'a');
    expect(fn).toHaveBeenNthCalledWith(2, 'b');
  });
});
