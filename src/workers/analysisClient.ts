import type { AnalysisResult } from '../types';
import {
  isAnalysisResponse,
  type AnalysisRequest,
  type AnalysisResponse,
} from './analysisProtocol';

export interface AnalysisWorkerPort {
  onmessage: ((event: MessageEvent<unknown>) => void) | null;
  onerror: ((event: ErrorEvent) => void) | null;
  onmessageerror: ((event: MessageEvent<unknown>) => void) | null;
  postMessage(message: AnalysisRequest): void;
  terminate(): void;
}

type WorkerFactory = () => AnalysisWorkerPort;

interface PendingRequest {
  id: number;
  resolve: (result: AnalysisResult) => void;
  reject: (error: Error) => void;
}

function abortError() {
  return new DOMException('Analysis was superseded or cancelled.', 'AbortError');
}

export class LocalAnalysisWorkerClient {
  private worker: AnalysisWorkerPort | null = null;
  private pending: PendingRequest | null = null;
  private nextId = 0;
  private readonly createWorker: WorkerFactory;

  constructor(createWorker: WorkerFactory) {
    this.createWorker = createWorker;
  }

  analyze(rawText: string, userConfig: AnalysisRequest['userConfig']) {
    this.cancel();

    let worker: AnalysisWorkerPort;
    try {
      worker = this.createWorker();
    } catch (error) {
      return Promise.reject(
        error instanceof Error ? error : new Error('Could not start the analysis worker.')
      );
    }

    this.worker = worker;
    const id = ++this.nextId;
    const request: AnalysisRequest = { id, rawText, userConfig };

    return new Promise<AnalysisResult>((resolve, reject) => {
      this.pending = { id, resolve, reject };
      worker.onmessage = (event) => {
        if (!isAnalysisResponse(event.data) || event.data.id !== id) {
          this.finish(worker, new Error('The analysis worker returned an invalid response.'));
          return;
        }
        const response: AnalysisResponse = event.data;
        if (response.ok) this.finish(worker, undefined, response.result);
        else this.finish(worker, new Error(response.error));
      };
      worker.onerror = () => {
        this.finish(worker, new Error('The local analysis worker stopped unexpectedly.'));
      };
      worker.onmessageerror = () => {
        this.finish(worker, new Error('The analysis worker returned an unreadable response.'));
      };

      try {
        worker.postMessage(request);
      } catch (error) {
        this.finish(
          worker,
          error instanceof Error ? error : new Error('Could not send data to the analysis worker.')
        );
      }
    });
  }

  cancel() {
    const worker = this.worker;
    const pending = this.pending;
    this.worker = null;
    this.pending = null;
    if (worker) worker.terminate();
    pending?.reject(abortError());
  }

  private finish(
    worker: AnalysisWorkerPort,
    error?: Error,
    result?: AnalysisResult
  ) {
    if (this.worker !== worker) return;
    const pending = this.pending;
    this.worker = null;
    this.pending = null;
    worker.terminate();
    if (!pending) return;
    if (error) pending.reject(error);
    else if (result) pending.resolve(result);
    else pending.reject(new Error('The analysis worker returned no result.'));
  }
}
