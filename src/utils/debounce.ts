/**
 * MISSED. — Generic debounce utility.
 *
 * Returns a debounced version of `fn` that delays invocation until `delayMs`
 * milliseconds have elapsed since the last call. The debounced function
 * exposes a `cancel()` method to clear any pending invocation.
 *
 * Used by `useDebouncedValue` to prevent the live message-count preview from
 * firing on every keystroke in the textarea.
 */

export interface DebouncedFn<T extends unknown[]> {
  (...args: T): void;
  /** Cancels any pending delayed invocation without calling the original function. */
  cancel(): void;
}

/**
 * Creates a debounced version of the provided function.
 *
 * @param fn      The function to debounce.
 * @param delayMs Delay in milliseconds. Must be a non-negative finite number.
 *                Values less than 0 are clamped to 0 (immediate execution
 *                on the next microtask).
 */
export function debounce<T extends unknown[]>(
  fn: (...args: T) => void,
  delayMs: number
): DebouncedFn<T> {
  const delay = Math.max(0, Number.isFinite(delayMs) ? delayMs : 0);
  let timerId: ReturnType<typeof setTimeout> | null = null;

  function debounced(...args: T): void {
    if (timerId !== null) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      timerId = null;
      fn(...args);
    }, delay);
  }

  debounced.cancel = function cancel(): void {
    if (timerId !== null) {
      clearTimeout(timerId);
      timerId = null;
    }
  };

  return debounced;
}
