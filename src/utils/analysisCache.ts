/**
 * MISSED. — In-memory LRU analysis result cache.
 *
 * Caches analysis results keyed by a lightweight content hash of the raw
 * conversation text and the serialized user configuration. Cache entries
 * expire after a configurable TTL (default: 10 minutes) to avoid serving
 * stale results when chat exports are updated in the same session.
 *
 * Privacy note: the cache lives exclusively in JavaScript heap memory.
 * Nothing is written to localStorage, IndexedDB, or any external storage.
 * The cache is automatically discarded when the page is closed or refreshed.
 */

import type { AnalysisResult, UserConfig } from '../types';

// ---------------------------------------------------------------------------
// Content hashing
// ---------------------------------------------------------------------------

/**
 * Produces a fast, non-cryptographic string hash of arbitrary content.
 * Uses the djb2 algorithm which is well-suited for short-to-medium strings.
 * Collisions are acceptable here because the cache falls back to re-analysis
 * on a miss, never returning an incorrect result.
 */
function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    // Equivalent to: hash * 33 ^ charCode, kept in 32-bit integer range.
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i);
    hash = hash >>> 0; // Convert to unsigned 32-bit integer.
  }
  return hash.toString(36);
}

/**
 * Derives a cache key from the raw conversation text and user config.
 * The key captures everything that affects analysis output.
 */
export function deriveCacheKey(rawText: string, userConfig: UserConfig): string {
  const configStr = `${userConfig.userName}|${userConfig.aliases.slice().sort().join(',')}`;
  const textHash = djb2Hash(rawText);
  const configHash = djb2Hash(configStr);
  return `${textHash}.${configHash}`;
}

// ---------------------------------------------------------------------------
// Cache entry type
// ---------------------------------------------------------------------------

interface CacheEntry {
  result: AnalysisResult;
  /** High-precision timestamp (performance.now() ms) when the entry was inserted. */
  insertedAt: number;
  /** Number of times this entry was returned from cache. */
  hits: number;
}

// ---------------------------------------------------------------------------
// LRU cache implementation
// ---------------------------------------------------------------------------

/**
 * Bounded, TTL-aware LRU cache for AnalysisResult objects.
 *
 * The cache enforces:
 * - A maximum number of entries (evicts the least-recently-used entry first).
 * - A per-entry TTL; expired entries are treated as misses and are lazily
 *   evicted on the next access to that key.
 */
export class AnalysisLRUCache {
  private readonly maxSize: number;
  private readonly ttlMs: number;
  private readonly store: Map<string, CacheEntry>;

  /**
   * @param maxSize Maximum number of entries. Default: 10.
   * @param ttlMs   Time-to-live per entry in milliseconds. Default: 10 minutes.
   */
  constructor(maxSize = 10, ttlMs = 10 * 60 * 1000) {
    this.maxSize = Math.max(1, maxSize);
    this.ttlMs = ttlMs;
    // Map preserves insertion order, which we use for LRU eviction.
    this.store = new Map();
  }

  /**
   * Returns the cached AnalysisResult for the given key, or null on a miss.
   * A hit promotes the entry to the most-recently-used position.
   */
  get(key: string): AnalysisResult | null {
    const entry = this.store.get(key);
    if (!entry) return null;

    // Evict expired entries lazily.
    const now = this.now();
    if (now - entry.insertedAt > this.ttlMs) {
      this.store.delete(key);
      return null;
    }

    // Promote to MRU by re-inserting.
    this.store.delete(key);
    entry.hits++;
    this.store.set(key, entry);
    return entry.result;
  }

  /**
   * Stores a result in the cache. If the cache is at capacity, the
   * least-recently-used entry is evicted first.
   */
  set(key: string, result: AnalysisResult): void {
    // Remove existing entry before re-inserting (handles key updates).
    if (this.store.has(key)) {
      this.store.delete(key);
    }

    // Evict LRU entry if the cache is full.
    if (this.store.size >= this.maxSize) {
      const lruKey = this.store.keys().next().value;
      if (lruKey !== undefined) {
        this.store.delete(lruKey);
      }
    }

    this.store.set(key, {
      result,
      insertedAt: this.now(),
      hits: 0,
    });
  }

  /** Returns true if a non-expired entry exists for the given key. */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /** Removes a specific entry from the cache. */
  delete(key: string): void {
    this.store.delete(key);
  }

  /** Removes all entries from the cache. */
  clear(): void {
    this.store.clear();
  }

  /** Returns the number of entries currently in the cache (including expired). */
  get size(): number {
    return this.store.size;
  }

  /**
   * Returns diagnostic metadata for the cache, suitable for developer tooling.
   * Does not expose cached conversation content.
   */
  diagnostics(): {
    size: number;
    maxSize: number;
    ttlMs: number;
    entries: Array<{ key: string; hits: number; ageMs: number }>;
  } {
    const now = this.now();
    return {
      size: this.store.size,
      maxSize: this.maxSize,
      ttlMs: this.ttlMs,
      entries: Array.from(this.store.entries()).map(([key, entry]) => ({
        key,
        hits: entry.hits,
        ageMs: Math.round(now - entry.insertedAt),
      })),
    };
  }

  private now(): number {
    return typeof performance !== 'undefined' ? performance.now() : Date.now();
  }
}

/** Shared singleton cache instance for the analysis pipeline. */
export const analysisCache = new AnalysisLRUCache(10, 10 * 60 * 1000);
