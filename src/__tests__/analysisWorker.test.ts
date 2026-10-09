import { describe, expect, it } from 'vitest';
import { SAMPLE_CONVERSATION_RAW } from '../data/sampleConversation';
import {
  LocalAnalysisWorkerClient,
  type AnalysisWorkerPort,
} from '../workers/analysisClient';
import { isAnalysisRequest } from '../workers/analysisProtocol';
import { runAnalysisRequest } from '../workers/analysis.worker';

describe('local analysis worker boundary', () => {
  const userConfig = { userName: 'Bibek', aliases: ['bibek', '@bibek', 'bib'] };

  it('analyzes a chat payload and returns source-linked findings', async () => {
    const response = await runAnalysisRequest({
      id: 7,
      rawText: SAMPLE_CONVERSATION_RAW,
      userConfig,
    });

    expect(response.ok).toBe(true);
    if (!response.ok) return;
    expect(response.id).toBe(7);
    expect(response.result.stats.totalMessages).toBeGreaterThan(35);
    const messageIds = new Set(response.result.messages.map((message) => message.id));
    expect(response.result.items.length).toBeGreaterThan(0);
    expect(response.result.items.every((item) => messageIds.has(item.sourceMessageId))).toBe(true);
  });

  it('rejects malformed worker input and produces a serializable error', async () => {
    expect(isAnalysisRequest({ id: 4, rawText: 42, userConfig })).toBe(false);
    await expect(runAnalysisRequest({ id: 9, rawText: null, userConfig })).resolves.toEqual({
      id: 9,
      ok: false,
      error: 'The analysis request was invalid.',
    });
  });
});

function createFakeWorker() {
  interface FakeAnalysisWorker extends AnalysisWorkerPort {
    terminated: boolean;
  }
  let postedRequest: { id: number } | null = null;
  const worker: FakeAnalysisWorker = {
    onmessage: null,
    onerror: null,
    onmessageerror: null,
    postMessage: (request) => {
      postedRequest = request;
    },
    terminate() {
      worker.terminated = true;
    },
    terminated: false,
  };
  return {
    worker,
    get requestId() {
      return postedRequest?.id;
    },
  };
}

describe('LocalAnalysisWorkerClient', () => {
  const userConfig = { userName: 'Bibek', aliases: ['bibek'] };

  it('resolves a valid response and terminates the completed worker', async () => {
    const fake = createFakeWorker();
    const client = new LocalAnalysisWorkerClient(() => fake.worker);
    const resultPromise = client.analyze(SAMPLE_CONVERSATION_RAW, userConfig);
    const requestId = fake.requestId;
    if (requestId === undefined) throw new Error('Worker request was not posted.');
    const response = await runAnalysisRequest({
      id: requestId,
      rawText: SAMPLE_CONVERSATION_RAW,
      userConfig,
    });
    fake.worker.onmessage?.(new MessageEvent('message', { data: response }));

    await expect(resultPromise).resolves.toMatchObject({
      provider: 'local_heuristic',
      stats: { totalMessages: expect.any(Number) },
    });
    expect(fake.worker.terminated).toBe(true);
  });

  it('rejects malformed responses, worker errors, and postMessage failures', async () => {
    const malformed = createFakeWorker();
    const malformedClient = new LocalAnalysisWorkerClient(() => malformed.worker);
    const malformedPromise = malformedClient.analyze('chat', userConfig);
    malformed.worker.onmessage?.(
      new MessageEvent('message', {
        data: { id: malformed.requestId, ok: true },
      })
    );
    await expect(malformedPromise).rejects.toThrow('invalid response');

    const crashed = createFakeWorker();
    const crashedClient = new LocalAnalysisWorkerClient(() => crashed.worker);
    const crashedPromise = crashedClient.analyze('chat', userConfig);
    crashed.worker.onerror?.({} as ErrorEvent);
    await expect(crashedPromise).rejects.toThrow('stopped unexpectedly');

    const unreadable = createFakeWorker();
    const unreadableClient = new LocalAnalysisWorkerClient(() => unreadable.worker);
    const unreadablePromise = unreadableClient.analyze('chat', userConfig);
    unreadable.worker.onmessageerror?.(new MessageEvent('messageerror'));
    await expect(unreadablePromise).rejects.toThrow('unreadable response');

    const broken = createFakeWorker();
    broken.worker.postMessage = () => {
      throw new Error('structured clone failed');
    };
    const brokenClient = new LocalAnalysisWorkerClient(() => broken.worker);
    await expect(brokenClient.analyze('chat', userConfig)).rejects.toThrow('structured clone failed');
  });

  it('rejects worker startup failures and worker error responses', async () => {
    const startupClient = new LocalAnalysisWorkerClient(() => {
      throw new Error('worker blocked by browser');
    });
    await expect(startupClient.analyze('chat', userConfig)).rejects.toThrow(
      'worker blocked by browser'
    );

    const fake = createFakeWorker();
    const client = new LocalAnalysisWorkerClient(() => fake.worker);
    const result = client.analyze('chat', userConfig);
    fake.worker.onmessage?.(
      new MessageEvent('message', {
        data: {
          id: fake.requestId,
          ok: false,
          error: 'invalid request',
        },
      })
    );
    await expect(result).rejects.toThrow('invalid request');
  });

  it('aborts superseded work and ignores late responses from a terminated worker', async () => {
    const first = createFakeWorker();
    const second = createFakeWorker();
    const queue = [first, second];
    const queuedClient = new LocalAnalysisWorkerClient(() => queue.shift()!.worker);
    const firstPromise = queuedClient.analyze('old chat', userConfig);
    const secondPromise = queuedClient.analyze('new chat', userConfig);

    await expect(firstPromise).rejects.toMatchObject({ name: 'AbortError' });
    expect(first.worker.terminated).toBe(true);
    first.worker.onmessage?.(
      new MessageEvent('message', {
        data: { id: 1, ok: false, error: 'late' },
      })
    );
    expect(second.worker.terminated).toBe(false);

    queuedClient.cancel();
    await expect(secondPromise).rejects.toMatchObject({ name: 'AbortError' });
  });
});
