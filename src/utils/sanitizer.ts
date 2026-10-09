/**
 * MISSED. — Text sanitization utilities.
 *
 * Conversation text is always kept in JavaScript memory and is never injected
 * into `innerHTML`. These helpers enforce that guarantee at the boundary where
 * raw conversation text is processed, preventing any form of XSS or injection
 * even if future UI code accidentally uses a dangerous pattern.
 *
 * All sanitization is purely in-browser; no text is sent to an external
 * sanitization service.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Maximum accepted raw conversation size in bytes.
 * A hard 1 MB ceiling prevents pathological inputs from causing OOM or
 * UI-hang conditions on low-powered devices.
 */
export const MAX_INPUT_BYTES = 1_048_576; // 1 MiB

/** Maximum number of characters in a user name or alias. */
export const MAX_NAME_LENGTH = 80;

/** Maximum number of aliases a user may configure. */
export const MAX_ALIAS_COUNT = 20;

// ---------------------------------------------------------------------------
// String-level helpers
// ---------------------------------------------------------------------------

/**
 * Strips ASCII control characters (except standard whitespace) from a string.
 * Control characters can silently alter rendering or trigger parser edge-cases
 * in downstream libraries.
 *
 * Preserved: \t (0x09), \n (0x0A), \r (0x0D) — all normal in chat exports.
 * Removed: all other C0 controls (0x00–0x08, 0x0B–0x0C, 0x0E–0x1F) and
 *          the DEL character (0x7F).
 */
export function stripControlChars(input: string): string {
  // eslint-disable-next-line no-control-regex
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

/**
 * Normalises line endings to `\n` only (LF).
 * Consistent line endings avoid subtle off-by-one bugs in the parser's
 * line-splitting logic on Windows exports.
 */
export function normaliseLineEndings(input: string): string {
  return input.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
}

/**
 * Trims leading and trailing whitespace from each line and collapses runs of
 * blank lines (3 or more consecutive blank lines) to a single blank line.
 * This avoids inflating the parser's message count with empty-line artefacts.
 */
export function normaliseBlankLines(input: string): string {
  return input.replace(/\n{3,}/g, '\n\n');
}

/**
 * Applies all text-level normalisation steps in a safe, composable pipeline:
 * 1. Strip C0 / DEL control characters.
 * 2. Normalise line endings to LF.
 * 3. Collapse excessive blank lines.
 *
 * Does NOT truncate the input — the caller is responsible for length checks
 * (see `validateRawInput`).
 */
export function sanitizeRawText(input: string): string {
  return normaliseBlankLines(normaliseLineEndings(stripControlChars(input)));
}

// ---------------------------------------------------------------------------
// Name / alias sanitization
// ---------------------------------------------------------------------------

/**
 * Sanitizes a user name or alias for safe use in regex construction and
 * display. Trims whitespace and enforces the maximum length.
 *
 * Does NOT strip special characters — names like "@bibek" or "Priya S."
 * are legitimate and must be preserved for mention detection.
 */
export function sanitizeName(input: string): string {
  return input.trim().slice(0, MAX_NAME_LENGTH);
}

/**
 * Sanitizes an array of alias strings, removing empty entries and enforcing
 * per-alias length and total count limits.
 */
export function sanitizeAliases(aliases: string[]): string[] {
  return aliases
    .map(a => sanitizeName(a))
    .filter(a => a.length > 0)
    .slice(0, MAX_ALIAS_COUNT);
}

// ---------------------------------------------------------------------------
// Excerpt / display helpers
// ---------------------------------------------------------------------------

/**
 * Escapes HTML special characters in a string for safe interpolation into
 * HTML attribute values or text content via `innerHTML`.
 *
 * Prefer React's JSX text interpolation (which escapes automatically) over
 * this function. Use this only in contexts where you must construct an HTML
 * string directly (e.g., clipboard HTML, server-side rendering, or a
 * `dangerouslySetInnerHTML` call that you cannot avoid).
 */
export function escapeHtml(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

/**
 * Returns a safe display excerpt of at most `maxLength` characters.
 * Appends an ellipsis if the input was truncated.
 * Falls back to an empty string for null / undefined inputs.
 */
export function safeExcerpt(input: string | null | undefined, maxLength = 120): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return trimmed.slice(0, maxLength - 1) + '…';
}
