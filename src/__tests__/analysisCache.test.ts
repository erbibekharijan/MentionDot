import { describe, it, expect, beforeEach } from 'vitest';
import { AnalysisLRUCache, deriveCacheKey, analysisCache } from '../utils/analysisCache';
import type { AnalysisResult } from '../types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResult(tag: string): AnalysisResult {
  return {
    summary: [`Summary for ${tag}`],
    items: [],
    messages: [
      {
        id: 'msg-1',
        rawIndex: 0,
        rawText: `${tag}: hello`,
        sender: tag,
        timestamp: null,
        timestampRaw: null,
        content: 'hello',
      },
    ],
    timeline: [],
    stats: {
      totalMessages: 1,
      participants: [tag],
      urgentCount: 0,
      taskCount: 0,
      deadlineCount: 0,
      decisionCount: 0,
      mentionCount: 0,
      unansweredCount: 0,
      completedCount: 0,
    },
    analyzedAt: new Date().toISOString(),
    provider: 'local_heuristic',
  };
}

const userConfig = { userName: 'Alice', aliases: ['alice'] };

// ---------------------------------------------------------------------------
// deriveCacheKey
// ---------------------------------------------------------------------------

describe('deriveCacheKey', () => {
  it('returns a non-empty string', () => {
    const key = deriveCacheKey('hello world', userConfig);
    expect(typeof key).toBe('string');
    expect(key.length).toBeGreaterThan(0);
  });

  it('produces the same key for identical inputs', () => {
    const a = deriveCacheKey('same text', userConfig);
    const b = deriveCacheKey('same text', userConfig);
    expect(a).toBe(b);
  });

  it('produces different keys for different raw texts', () => {
    const a = deriveCacheKey('text A', userConfig);
    const b = deriveCacheKey('text B', userConfig);
    expect(a).not.toBe(b);
  });

  it('produces different keys for different user configs', () => {
    const config1 = { userName: 'Alice', aliases: ['alice'] };
    const config2 = { userName: 'Bob', aliases: ['bob'] };
    const a = deriveCacheKey('same', config1);
    const b = deriveCacheKey('same', config2);
    expect(a).not.toBe(b);
  });

  it('alias order does not affect the key', () => {
    const c1 = { userName: 'A', aliases: ['x', 'y'] };
    const c2 = { userName: 'A', aliases: ['y', 'x'] };
    expect(deriveCacheKey('txt', c1)).toBe(deriveCacheKey('txt', c2));
  });
});

// ---------------------------------------------------------------------------
// AnalysisLRUCache
// ---------------------------------------------------------------------------

describe('AnalysisLRUCache', () => {
  let cache: AnalysisLRUCache;

  beforeEach(() => {
    cache = new AnalysisLRUCache(3, 60_000);
  });

  it('returns null for unknown keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  it('stores and retrieves a result', () => {
    const result = makeResult('A');
    cache.set('key1', result);
    expect(cache.get('key1')).toBe(result);
  });

  it('has() returns true for cached keys and false otherwise', () => {
    cache.set('k', makeResult('B'));
    expect(cache.has('k')).toBe(true);
    expect(cache.has('missing')).toBe(false);
  });

  it('evicts the LRU entry when capacity is reached', () => {
    cache.set('a', makeResult('A'));
    cache.set('b', makeResult('B'));
    cache.set('c', makeResult('C'));
    // 'a' is now LRU — adding 'd' should evict 'a'
    cache.set('d', makeResult('D'));
    expect(cache.get('a')).toBeNull();
    expect(cache.get('b')).not.toBeNull();
    expect(cache.get('d')).not.toBeNull();
    expect(cache.size).toBe(3);
  });

  it('promotes accessed entry to MRU position, protecting it from eviction', () => {
    cache.set('a', makeResult('A'));
    cache.set('b', makeResult('B'));
    cache.set('c', makeResult('C'));
    // Access 'a' to promote it.
    cache.get('a');
    // Now 'b' is LRU — 'd' should evict 'b'.
    cache.set('d', makeResult('D'));
    expect(cache.get('b')).toBeNull();
    expect(cache.get('a')).not.toBeNull();
  });

  it('updating an existing key does not grow the cache beyond capacity', () => {
    cache.set('a', makeResult('A'));
    cache.set('b', makeResult('B'));
    cache.set('c', makeResult('C'));
    cache.set('a', makeResult('A-updated'));
    expect(cache.size).toBe(3);
    expect(cache.get('a')?.summary[0]).toBe('Summary for A-updated');
  });

  it('delete() removes a specific entry', () => {
    cache.set('x', makeResult('X'));
    cache.delete('x');
    expect(cache.get('x')).toBeNull();
  });

  it('clear() empties the cache', () => {
    cache.set('a', makeResult('A'));
    cache.set('b', makeResult('B'));
    cache.clear();
    expect(cache.size).toBe(0);
    expect(cache.get('a')).toBeNull();
  });

  it('diagnostics() returns metadata without exposing conversation content', () => {
    cache.set('alpha', makeResult('Alpha'));
    const diag = cache.diagnostics();
    expect(diag.size).toBe(1);
    expect(diag.maxSize).toBe(3);
    expect(diag.ttlMs).toBe(60_000);
    expect(diag.entries[0].key).toBe('alpha');
    expect(typeof diag.entries[0].hits).toBe('number');
    expect(typeof diag.entries[0].ageMs).toBe('number');
    // Confirm entries do not include the actual result data.
    expect('result' in diag.entries[0]).toBe(false);
  });

  it('expired entries are treated as misses and lazily evicted', async () => {
    // Create a cache with a very short TTL (1 ms).
    const shortTtlCache = new AnalysisLRUCache(5, 1);
    shortTtlCache.set('stale', makeResult('Stale'));
    // Wait long enough for the TTL to elapse.
    await new Promise(resolve => setTimeout(resolve, 10));
    expect(shortTtlCache.get('stale')).toBeNull();
  });

  it('enforces minimum capacity of 1', () => {
    const tiny = new AnalysisLRUCache(0, 60_000);
    tiny.set('a', makeResult('A'));
    tiny.set('b', makeResult('B'));
    expect(tiny.size).toBe(1);
    expect(tiny.get('b')).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Shared singleton
// ---------------------------------------------------------------------------

describe('analysisCache (shared singleton)', () => {
  beforeEach(() => {
    analysisCache.clear();
  });

  it('is initially empty after clear()', () => {
    expect(analysisCache.size).toBe(0);
  });

  it('integrates correctly with deriveCacheKey for a round-trip store/retrieve', () => {
    const key = deriveCacheKey('round trip text', userConfig);
    const result = makeResult('RT');
    analysisCache.set(key, result);
    expect(analysisCache.get(key)).toBe(result);
  });
});
