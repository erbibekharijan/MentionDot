import { describe, it, expect } from 'vitest';
import { extractDeadlineInfo } from '../utils/dateParser';
import { LocalHeuristicProvider } from '../utils/analyzer';
import { parseConversation } from '../utils/parser';
import { SAMPLE_CONVERSATION_RAW } from '../data/sampleConversation';

describe('Date & Deadline Parser', () => {
  const refDate = new Date('2026-10-09T10:00:00Z'); // Friday

  it('detects relative "today" / "tonight"', () => {
    const info = extractDeadlineInfo('Please send this before 5 pm today', refDate);
    expect(info).not.toBeNull();
    expect(info?.status).toBe('due_today');
    expect(info?.isAmbiguous).toBe(false);
  });

  it('resolves relative dates from the message timestamp, not the analysis day', () => {
    const yesterday = new Date(2026, 9, 8, 10, 30);
    const today = new Date(2026, 9, 9, 10, 30);
    const info = extractDeadlineInfo('Please send this today', yesterday, today);

    expect(info?.dateStr).toBe('Yesterday');
    expect(info?.status).toBe('overdue');
    expect(info?.parsedDate).toBe('2026-10-08');
  });

  it('detects relative "tomorrow"', () => {
    const info = extractDeadlineInfo("I'll have it ready tomorrow morning", refDate);
    expect(info).not.toBeNull();
    expect(info?.status).toBe('upcoming');
    expect(info?.dateStr).toContain('Tomorrow');
  });

  it('detects day of week deadlines (e.g. by Friday 5 PM)', () => {
    const info = extractDeadlineInfo('Please submit the financial deck by Friday 5 PM', refDate);
    expect(info).not.toBeNull();
    expect(info?.dateStr).toContain('Friday');
  });

  it('flags ambiguous day without month/year as uncertain with documented rule', () => {
    const info = extractDeadlineInfo('Don\'t forget the vendor audit is due on the 14th', refDate);
    expect(info).not.toBeNull();
    expect(info?.status).toBe('uncertain');
    expect(info?.isAmbiguous).toBe(true);
    expect(info?.ambiguityReason).toContain('Do not assume year without explicit confirmation');
  });
});

describe('Local Heuristic Analyzer', () => {
  const analyzer = new LocalHeuristicProvider();
  const userConfig = {
    userName: 'Bibek',
    aliases: ['bibek', '@bibek', 'bib'],
  };

  it('classifies urgent language accurately with high priority', async () => {
    const text = 'Alex: URGENT: Production API rate limit is throwing 429s, someone needs to bump Redis buffer ASAP!';
    const msgs = parseConversation(text);
    const result = await analyzer.analyze(msgs, userConfig);

    expect(result.items.length).toBeGreaterThan(0);
    const urgentItem = result.items.find(i => i.priority === 'urgent');
    expect(urgentItem).toBeDefined();
    expect(urgentItem?.sourceMessageId).toBe('msg-1');
    expect(urgentItem?.explanation).toContain('urgent alert keywords');
  });

  it('detects direct mentions for configured user and aliases', async () => {
    const text = 'Alex: Bibek, can you patch the auth handler before the staging deploy tonight?';
    const msgs = parseConversation(text);
    const result = await analyzer.analyze(msgs, userConfig);

    const mention = result.items.find(i => i.category === 'mention');
    expect(mention).toBeDefined();
    expect(mention?.assignee).toBe('Bibek');
    expect(mention?.sourceMessageId).toBe('msg-1');
  });

  it('uses a timestamped message date when resolving "today"', async () => {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const date = [
      yesterday.getFullYear(),
      String(yesterday.getMonth() + 1).padStart(2, '0'),
      String(yesterday.getDate()).padStart(2, '0'),
    ].join('-');
    const messages = parseConversation(
      `${date} 10:30 - Alex: Please send the report today.`
    );

    expect(messages[0].timestamp).not.toBeNull();
    const result = await analyzer.analyze(messages, userConfig);
    const deadline = result.items.find((item) => item.category === 'deadline');

    expect(deadline?.deadline?.dateStr).toBe('Yesterday');
    expect(deadline?.deadline?.status).toBe('overdue');
  });

  it('distinguishes confirmed decisions from mere suggestions', async () => {
    const text = `Carlos: We should probably look at different styling options.
Sarah: Final decision: We're going with Tailwind v4 for the ProtocolX frontend.`;
    const msgs = parseConversation(text);
    const result = await analyzer.analyze(msgs, userConfig);

    const decision = result.items.find(i => i.category === 'decision');
    expect(decision).toBeDefined();
    expect(decision?.isExplicit).toBe(true);
    expect(decision?.sender).toBe('Sarah');
  });

  it('detects meeting schedule changes and timeline milestones', async () => {
    const text = 'Alex: Meeting update: Our 2:00 PM Sprint Review meeting moved to 3:30 PM due to client scheduling conflict.';
    const msgs = parseConversation(text);
    const result = await analyzer.analyze(msgs, userConfig);

    const update = result.items.find(i => i.isMeetingChange);
    expect(update).toBeDefined();
    expect(result.timeline.some(t => t.type === 'meeting_change')).toBe(true);
  });

  it('successfully analyzes the complete 40+ message Hackathon demo dataset', async () => {
    const msgs = parseConversation(SAMPLE_CONVERSATION_RAW);
    expect(msgs.length).toBeGreaterThanOrEqual(35);

    const result = await analyzer.analyze(msgs, userConfig);

    // Verify summary is 3-6 bullets
    expect(result.summary.length).toBeGreaterThanOrEqual(3);
    expect(result.summary.length).toBeLessThanOrEqual(6);

    // Verify all key sections have extracted items
    expect(result.stats.urgentCount).toBeGreaterThan(0);
    expect(result.stats.taskCount).toBeGreaterThan(0);
    expect(result.stats.deadlineCount).toBeGreaterThan(0);
    expect(result.stats.decisionCount).toBeGreaterThan(0);
    expect(result.stats.mentionCount).toBeGreaterThan(0);

    // Check evidence integrity: EVERY extracted item must point to a real existing message!
    const msgIdSet = new Set(msgs.map(m => m.id));
    for (const item of result.items) {
      expect(msgIdSet.has(item.sourceMessageId)).toBe(true);
      expect(item.explanation).toBeTruthy();
    }
  });
});
