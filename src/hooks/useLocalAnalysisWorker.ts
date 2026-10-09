import { useEffect, useState } from 'react';
import type { UserConfig } from '../types';
import { LocalAnalysisWorkerClient } from '../workers/analysisClient';

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
    analyze: (rawText: string, userConfig: UserConfig) =>
      client.analyze(rawText, userConfig),
    cancel: () => client.cancel(),
  };
}
