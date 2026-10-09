import { describe, expect, it } from 'vitest';
import { SAMPLE_CONVERSATION_RAW } from '../data/sampleConversation';
import { runAnalysisRequest } from '../workers/analysis.worker';

describe('local analysis worker boundary', () => {
  it('analyzes a chat payload and returns source-linked findings', async () => {
    const response = await runAnalysisRequest({
      id: 7,
      rawText: SAMPLE_CONVERSATION_RAW,
      userConfig: { userName: 'Bibek', aliases: ['bibek', '@bibek', 'bib'] },
    });

    expect(response.ok).toBe(true);
    if (!response.ok) return;
    expect(response.id).toBe(7);
    expect(response.result.stats.totalMessages).toBeGreaterThan(35);
    const messageIds = new Set(response.result.messages.map((message) => message.id));
    expect(response.result.items.length).toBeGreaterThan(0);
    expect(response.result.items.every((item) => messageIds.has(item.sourceMessageId))).toBe(true);
  });
});
