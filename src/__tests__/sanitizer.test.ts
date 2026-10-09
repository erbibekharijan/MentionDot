import { describe, it, expect } from 'vitest';
import {
  stripControlChars,
  normaliseLineEndings,
  normaliseBlankLines,
  sanitizeRawText,
  sanitizeName,
  sanitizeAliases,
  escapeHtml,
  safeExcerpt,
  MAX_INPUT_BYTES,
  MAX_NAME_LENGTH,
  MAX_ALIAS_COUNT,
} from '../utils/sanitizer';

// ---------------------------------------------------------------------------
// stripControlChars
// ---------------------------------------------------------------------------

describe('stripControlChars', () => {
  it('removes NUL (0x00) and other C0 controls', () => {
    expect(stripControlChars('\x00hello\x01world\x02')).toBe('helloworld');
  });

  it('preserves tabs, newlines, and carriage returns', () => {
    const input = 'line1\tindented\nline2\r\nline3\r';
    expect(stripControlChars(input)).toBe(input);
  });

  it('removes DEL character (0x7F)', () => {
    expect(stripControlChars('abc\x7Fdef')).toBe('abcdef');
  });

  it('removes vertical tab (0x0B) and form feed (0x0C)', () => {
    expect(stripControlChars('a\x0Bb\x0Cc')).toBe('abc');
  });

  it('returns empty string unchanged', () => {
    expect(stripControlChars('')).toBe('');
  });

  it('does not affect normal Unicode text', () => {
    const text = 'Hello 🌍 — कैच अप on what matters.';
    expect(stripControlChars(text)).toBe(text);
  });
});

// ---------------------------------------------------------------------------
// normaliseLineEndings
// ---------------------------------------------------------------------------

describe('normaliseLineEndings', () => {
  it('converts CRLF to LF', () => {
    expect(normaliseLineEndings('a\r\nb\r\nc')).toBe('a\nb\nc');
  });

  it('converts bare CR to LF', () => {
    expect(normaliseLineEndings('a\rb\rc')).toBe('a\nb\nc');
  });

  it('preserves existing LF', () => {
    expect(normaliseLineEndings('a\nb\nc')).toBe('a\nb\nc');
  });

  it('handles mixed line endings', () => {
    expect(normaliseLineEndings('a\r\nb\rc\nd')).toBe('a\nb\nc\nd');
  });
});

// ---------------------------------------------------------------------------
// normaliseBlankLines
// ---------------------------------------------------------------------------

describe('normaliseBlankLines', () => {
  it('collapses 3+ consecutive blank lines to 2', () => {
    expect(normaliseBlankLines('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('leaves 2 consecutive blank lines unchanged', () => {
    expect(normaliseBlankLines('a\n\nb')).toBe('a\n\nb');
  });

  it('leaves single blank lines unchanged', () => {
    expect(normaliseBlankLines('a\nb\nc')).toBe('a\nb\nc');
  });

  it('handles multiple separate runs', () => {
    const input = 'a\n\n\n\nb\n\n\n\nc';
    expect(normaliseBlankLines(input)).toBe('a\n\nb\n\nc');
  });
});

// ---------------------------------------------------------------------------
// sanitizeRawText (pipeline)
// ---------------------------------------------------------------------------

describe('sanitizeRawText', () => {
  it('applies all three normalisation steps', () => {
    const input = 'a\x00b\r\nc\n\n\n\nd';
    const result = sanitizeRawText(input);
    expect(result).not.toContain('\x00');
    expect(result).not.toContain('\r\n');
    expect(result).not.toMatch(/\n{3,}/);
  });

  it('preserves normal chat export content', () => {
    const chat = '[10:30] Alex: Can you check the PR?\n[10:31] Priya: On it!';
    expect(sanitizeRawText(chat)).toBe(chat);
  });

  it('returns empty string for empty input', () => {
    expect(sanitizeRawText('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeName
// ---------------------------------------------------------------------------

describe('sanitizeName', () => {
  it('trims whitespace', () => {
    expect(sanitizeName('  Alice  ')).toBe('Alice');
  });

  it('truncates to MAX_NAME_LENGTH', () => {
    const long = 'A'.repeat(MAX_NAME_LENGTH + 10);
    expect(sanitizeName(long)).toHaveLength(MAX_NAME_LENGTH);
  });

  it('preserves @ prefix and Unicode names', () => {
    expect(sanitizeName('@bibek')).toBe('@bibek');
    expect(sanitizeName('Priya S.')).toBe('Priya S.');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(sanitizeName('   ')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// sanitizeAliases
// ---------------------------------------------------------------------------

describe('sanitizeAliases', () => {
  it('removes empty aliases', () => {
    expect(sanitizeAliases(['alice', '', '  ', 'al'])).toEqual(['alice', 'al']);
  });

  it('trims whitespace from each alias', () => {
    expect(sanitizeAliases(['  bob  '])).toEqual(['bob']);
  });

  it('enforces MAX_ALIAS_COUNT', () => {
    const many = Array.from({ length: MAX_ALIAS_COUNT + 5 }, (_, i) => `alias${i}`);
    expect(sanitizeAliases(many)).toHaveLength(MAX_ALIAS_COUNT);
  });

  it('returns empty array for all-empty input', () => {
    expect(sanitizeAliases(['', '  ', ''])).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// escapeHtml
// ---------------------------------------------------------------------------

describe('escapeHtml', () => {
  it('escapes &', () => expect(escapeHtml('a & b')).toBe('a &amp; b'));
  it('escapes <', () => expect(escapeHtml('<script>')).toBe('&lt;script&gt;'));
  it('escapes >', () => expect(escapeHtml('a > b')).toBe('a &gt; b'));
  it('escapes "', () => expect(escapeHtml('"hello"')).toBe('&quot;hello&quot;'));
  it("escapes '", () => expect(escapeHtml("it's")).toBe("it&#x27;s"));

  it('handles a combined XSS payload', () => {
    const payload = '<img src=x onerror="alert(\'XSS\')">';
    const escaped = escapeHtml(payload);
    expect(escaped).not.toContain('<img');
    expect(escaped).not.toContain('"alert');
  });

  it('returns empty string for empty input', () => {
    expect(escapeHtml('')).toBe('');
  });
});

// ---------------------------------------------------------------------------
// safeExcerpt
// ---------------------------------------------------------------------------

describe('safeExcerpt', () => {
  it('returns the full string when within maxLength', () => {
    expect(safeExcerpt('Hello', 10)).toBe('Hello');
  });

  it('truncates and appends ellipsis when over maxLength', () => {
    const result = safeExcerpt('A'.repeat(200), 50);
    expect(result).toHaveLength(50);
    expect(result.endsWith('…')).toBe(true);
  });

  it('returns empty string for null and undefined', () => {
    expect(safeExcerpt(null)).toBe('');
    expect(safeExcerpt(undefined)).toBe('');
  });

  it('trims surrounding whitespace before measuring', () => {
    expect(safeExcerpt('  hello  ', 10)).toBe('hello');
  });

  it('uses a default maxLength of 120', () => {
    const long = 'A'.repeat(130);
    const result = safeExcerpt(long);
    expect(result).toHaveLength(120);
  });
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

describe('Sanitizer constants', () => {
  it('MAX_INPUT_BYTES is 1 MiB', () => expect(MAX_INPUT_BYTES).toBe(1_048_576));
  it('MAX_NAME_LENGTH is 80', () => expect(MAX_NAME_LENGTH).toBe(80));
  it('MAX_ALIAS_COUNT is 20', () => expect(MAX_ALIAS_COUNT).toBe(20));
});
