import { useEffect, useState } from 'react';
import type { UserConfig } from '../types';
import { LocalAnalysisWorkerClient } from '../workers/analysisClient';
import { analysisCache, deriveCacheKey } from '../utils/analysisCache';
import { analysisTimingBuffer } from '../utils/perfMonitor';

/**
 * React hook that exposes a cached, cancellable analysis pipeline.
 *
 * Architecture:
 *   1. On each analyze() call the cache is consulted first using a content
 *      hash derived from rawText + userConfig. Cache hits return instantly
 *      without spawning a Web Worker.
 *   2. On a cache miss, a new Web Worker is started, the analysis runs
 *      off the main thread, and the result is stored in the cache before
 *      resolving.
 *   3. The worker is automatically cancelled and terminated on unmount.
 */
export function useLocalAnalysisWorker() {
  const [client] = useState(
    () =>
      new LocalAnalysisWorkerClient(() => {
        if (typeof Worker === 'undefined') {
          throw new Error('This browser does not support Web Workers.');
        }
        return new Worker(
          new URL('../workers/analysis.worker.ts', import.meta.url),
          { type: 'module' }
        );
      })
  );

  useEffect(() => () => client.cancel(), [client]);

  return {
    analyze: async (rawText: string, userConfig: UserConfig) => {
      const key = deriveCacheKey(rawText, userConfig);
      const cached = analysisCache.get(key);

      if (cached !== null) {
        // Record a cache-hit entry so timing diagnostics reflect the shortcut.
        analysisTimingBuffer.push({
          label: 'worker.analysis.cache_hit',
          durationMs: 0,
          messageCount: cached.messages.length,
          completedAt: new Date().toISOString(),
          msPerMessage: 0,
        });
        return cached;
      }

      const result = await client.analyze(rawText, userConfig);
      analysisCache.set(key, result);
      return result;
    },
    cancel: () => client.cancel(),
  };
}

