import { describe, it, expect } from 'vitest';
import {
  validateRawInput,
  validateUserConfig,
  validateAnalysisInputs,
} from '../utils/inputValidator';

// ---------------------------------------------------------------------------
// validateRawInput
// ---------------------------------------------------------------------------

describe('validateRawInput', () => {
  it('accepts a valid chat export', () => {
    const result = validateRawInput('Alex: Hello!\nPriya: Hey there!');
    expect(result.ok).toBe(true);
  });

  it('rejects empty string', () => {
    const result = validateRawInput('');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('empty');
  });

  it('rejects whitespace-only string', () => {
    const result = validateRawInput('   \n  ');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('empty');
  });

  it('rejects text exceeding 1 MiB', () => {
    // 2 MiB of ASCII characters
    const large = 'A'.repeat(2 * 1_048_576);
    const result = validateRawInput(large);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain('too large');
      expect(result.reason).toContain('MiB');
    }
  });

  it('rejects text without a colon (not a recognizable chat format)', () => {
    const result = validateRawInput('This has no colon at all and is very long with lots of words here');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('chat export');
  });

  it('accepts text with exactly one colon', () => {
    expect(validateRawInput('Bob: done').ok).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateUserConfig
// ---------------------------------------------------------------------------

describe('validateUserConfig', () => {
  const valid = { userName: 'Alice', aliases: ['alice', '@alice'] };

  it('accepts a valid config', () => {
    expect(validateUserConfig(valid).ok).toBe(true);
  });

  it('rejects empty userName', () => {
    const result = validateUserConfig({ userName: '', aliases: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('name');
  });

  it('rejects whitespace-only userName', () => {
    const result = validateUserConfig({ userName: '   ', aliases: [] });
    expect(result.ok).toBe(false);
  });

  it('rejects userName exceeding MAX_NAME_LENGTH', () => {
    const result = validateUserConfig({ userName: 'A'.repeat(81), aliases: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('long');
  });

  it('rejects more than MAX_ALIAS_COUNT aliases', () => {
    const manyAliases = Array.from({ length: 21 }, (_, i) => `alias${i}`);
    const result = validateUserConfig({ userName: 'Alice', aliases: manyAliases });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('aliases');
  });

  it('rejects a non-string alias value', () => {
    // Cast to bypass TypeScript so we can test the runtime guard.
    const result = validateUserConfig({ userName: 'Bob', aliases: [42 as unknown as string] });
    expect(result.ok).toBe(false);
  });

  it('rejects an alias exceeding MAX_NAME_LENGTH', () => {
    const result = validateUserConfig({ userName: 'Bob', aliases: ['B'.repeat(81)] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('long');
  });
});

// ---------------------------------------------------------------------------
// validateAnalysisInputs
// ---------------------------------------------------------------------------

describe('validateAnalysisInputs', () => {
  it('returns ok when both text and config are valid', () => {
    const result = validateAnalysisInputs(
      'Alex: Hey!\nPriya: Hello!',
      { userName: 'Alice', aliases: ['alice'] }
    );
    expect(result.ok).toBe(true);
  });

  it('fails on invalid text before checking config', () => {
    const result = validateAnalysisInputs('', { userName: 'Alice', aliases: [] });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('empty');
  });

  it('fails on invalid config when text is valid', () => {
    const result = validateAnalysisInputs(
      'Alex: Hey!\nPriya: Hello!',
      { userName: '', aliases: [] }
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toContain('name');
  });
});
