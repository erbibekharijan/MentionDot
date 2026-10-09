import { describe, expect, it } from 'vitest';
import { SAMPLE_CONVERSATION_RAW } from '../data/sampleConversation';
import { LocalHeuristicProvider } from '../utils/analyzer';
import { buildCatchUpStory } from '../utils/catchUpStory';
import { parseConversation } from '../utils/parser';

describe('Catch-up story', () => {
  it('shows a short, chronological selection with original source messages', async () => {
    const messages = parseConversation(SAMPLE_CONVERSATION_RAW);
    const result = await new LocalHeuristicProvider().analyze(messages, {
      userName: 'Bibek',
      aliases: ['bibek', '@bibek', 'bib'],
    });

    const beats = buildCatchUpStory(result);

    expect(beats.length).toBeGreaterThan(0);
    expect(beats.length).toBeLessThanOrEqual(5);
    expect(new Set(beats.map((beat) => beat.item.category)).size).toBe(beats.length);
    expect(beats.map((beat) => beat.message.rawIndex)).toEqual(
      [...beats].map((beat) => beat.message.rawIndex).sort((a, b) => a - b)
    );
    for (const beat of beats) {
      expect(beat.message.id).toBe(beat.item.sourceMessageId);
      expect(beat.message.content).toBeTruthy();
    }
    expect(beats.find((beat) => beat.item.category === 'deadline')?.label)
      .toBe('A deadline was detected');
  });

  it('does not invent a story beat when its source message is missing', async () => {
    const result = await new LocalHeuristicProvider().analyze(
      parseConversation('Alex: Please submit the report by Friday.'),
      { userName: 'Bibek', aliases: ['bibek'] }
    );

    expect(buildCatchUpStory({ ...result, messages: [] })).toEqual([]);
  });
});
