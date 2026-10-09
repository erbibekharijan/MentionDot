/**
 * MISSED. — Input validation utilities.
 *
 * Validates raw conversation text and user configuration before dispatching
 * them to the analysis pipeline. All validation is performed synchronously
 * in the calling context; no data leaves the browser.
 *
 * Validation is intentionally separate from sanitization:
 * - Sanitization (sanitizer.ts) cleans the input.
 * - Validation (this file) decides whether the cleaned input is acceptable.
 */

import { MAX_INPUT_BYTES, MAX_NAME_LENGTH, MAX_ALIAS_COUNT } from './sanitizer';
import type { UserConfig } from '../types';

// ---------------------------------------------------------------------------
// Result type
// ---------------------------------------------------------------------------

export type ValidationResult =
  | { ok: true; reason?: undefined }
  | { ok: false; reason: string };

// ---------------------------------------------------------------------------
// Raw conversation text validation
// ---------------------------------------------------------------------------

/**
 * Validates raw conversation text before analysis.
 *
 * Checks:
 * 1. Non-empty after trimming.
 * 2. Does not exceed the 1 MiB size ceiling.
 * 3. Contains at least one colon (heuristic: any parseable chat format needs
 *    at least one `Sender: message` pair).
 */
export function validateRawInput(rawText: string): ValidationResult {
  if (!rawText || !rawText.trim()) {
    return { ok: false, reason: 'Conversation text is empty. Paste or upload a chat export to continue.' };
  }

  const byteLength = new TextEncoder().encode(rawText).length;
  if (byteLength > MAX_INPUT_BYTES) {
    const sizeMiB = (byteLength / 1_048_576).toFixed(2);
    return {
      ok: false,
      reason: `The pasted text is too large (${sizeMiB} MiB). The maximum accepted size is 1 MiB. Consider splitting the export into smaller sections.`,
    };
  }

  if (!rawText.includes(':')) {
    return {
      ok: false,
      reason: 'The text does not look like a chat export. Expected at least one "Sender: message" line.',
    };
  }

  return { ok: true };
}

// ---------------------------------------------------------------------------
// User configuration validation
// ---------------------------------------------------------------------------

/**
 * Validates the user configuration object.
 *
 * Checks:
 * 1. userName is a non-empty string within the length limit.
 * 2. aliases is an array with at most MAX_ALIAS_COUNT entries.
 * 3. Each alias is a string within the length limit (empty aliases are
 *    silently skipped rather than rejected so the UI can handle blank inputs).
 */
export function validateUserConfig(config: UserConfig): ValidationResult {
  if (!config.userName || !config.userName.trim()) {
    return { ok: false, reason: 'Your name cannot be empty. Enter your display name to enable mention detection.' };
  }

  if (config.userName.trim().length > MAX_NAME_LENGTH) {
    return {
      ok: false,
      reason: `Your name is too long (maximum ${MAX_NAME_LENGTH} characters).`,
    };
  }

  if (!Array.isArray(config.aliases)) {
    return { ok: false, reason: 'Alias configuration is invalid.' };
  }

  if (config.aliases.length > MAX_ALIAS_COUNT) {
    return {
      ok: false,
      reason: `Too many aliases (${config.aliases.length}). The maximum is ${MAX_ALIAS_COUNT}.`,
    };
  }

  for (const alias of config.aliases) {
    if (typeof alias !== 'string') {
      return { ok: false, reason: 'One or more aliases contain invalid values.' };
    }
    if (alias.length > MAX_NAME_LENGTH) {
      return {
        ok: false,
        reason: `Alias "${alias.slice(0, 20)}…" is too long (maximum ${MAX_NAME_LENGTH} characters).`,
      };
    }
  }

  return { ok: true };
}

/**
 * Validates both raw text and user config in a single call.
 * Returns the first failure encountered, or `{ ok: true }` if both pass.
 */
export function validateAnalysisInputs(rawText: string, config: UserConfig): ValidationResult {
  const textResult = validateRawInput(rawText);
  if (!textResult.ok) return textResult;
  return validateUserConfig(config);
}
