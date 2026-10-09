import { useState, useEffect, useRef } from 'react';
import { debounce } from '../utils/debounce';

/**
 * Returns a debounced copy of `value` that only updates after `delayMs`
 * milliseconds of inactivity. The latest value is always returned immediately
 * on mount (no initial delay).
 *
 * Used for the live message-count preview in the input section: debouncing
 * prevents `parseConversation` from running on every single keystroke, which
 * keeps the main thread responsive for long pastes.
 *
 * @param value   The value to debounce.
 * @param delayMs Debounce delay in milliseconds. Default: 250 ms.
 */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  // Keep a stable reference to the debounced setter so it is only created once.
  const debouncedSet = useRef(
    debounce((v: T) => setDebouncedValue(v), delayMs)
  );

  useEffect(() => {
    debouncedSet.current(value);
    // Capture the ref value for the cleanup closure.
    const fn = debouncedSet.current;
    return () => fn.cancel();
  }, [value]);

  return debouncedValue;
}
