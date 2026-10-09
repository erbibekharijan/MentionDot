import { useCallback, useEffect, useRef } from 'react';
import type { AnalysisResult, UserConfig } from '../types';
import type { AnalysisRequest, AnalysisResponse } from '../workers/analysisProtocol';

interface PendingRequest {
  resolve: (result: AnalysisResult) => void;
  reject: (error: Error) => void;
}

function createAbortError() {
  return new DOMException('Analysis was superseded or cancelled.', 'AbortError');
}

export function useLocalAnalysisWorker() {
  const workerRef = useRef<Worker | null>(null);
  const pendingRef = useRef(new Map<number, PendingRequest>());
  const requestIdRef = useRef(0);

  const cancel = useCallback(() => {
    workerRef.current?.terminate();
    workerRef.current = null;
    for (const request of pendingRef.current.values()) {
      request.reject(createAbortError());
    }
    pendingRef.current.clear();
  }, []);

  const analyze = useCallback(
    (rawText: string, userConfig: UserConfig): Promise<AnalysisResult> => {
      cancel();
      if (typeof Worker === 'undefined') {
        return Promise.reject(new Error('This browser does not support Web Workers.'));
      }

      const worker = new Worker(
        new URL('../workers/analysis.worker.ts', import.meta.url),
        { type: 'module' }
      );
      workerRef.current = worker;
      worker.onmessage = (event: MessageEvent<AnalysisResponse>) => {
        const response = event.data;
        const pending = pendingRef.current.get(response.id);
        if (!pending) return;
        pendingRef.current.delete(response.id);
        if (response.ok) pending.resolve(response.result);
        else pending.reject(new Error(response.error));
      };
      worker.onerror = () => {
        const error = new Error('The local analysis worker stopped unexpectedly.');
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        for (const pending of pendingRef.current.values()) pending.reject(error);
        pendingRef.current.clear();
      };
      worker.onmessageerror = () => {
        const error = new Error('The analysis worker returned an unreadable response.');
        worker.terminate();
        if (workerRef.current === worker) workerRef.current = null;
        for (const pending of pendingRef.current.values()) pending.reject(error);
        pendingRef.current.clear();
      };

      const id = ++requestIdRef.current;
      const request: AnalysisRequest = { id, rawText, userConfig };
      return new Promise((resolve, reject) => {
        pendingRef.current.set(id, { resolve, reject });
        worker.postMessage(request);
      });
    },
    [cancel]
  );

  useEffect(() => cancel, [cancel]);

  return { analyze, cancel };
}
