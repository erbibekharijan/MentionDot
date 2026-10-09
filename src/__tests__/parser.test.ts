import { describe, it, expect } from 'vitest';
import { parseConversation } from '../utils/parser';

describe('Message Parser', () => {
  it('parses bracket timestamped messages', () => {
    const raw = '[09/10/2026, 10:30] Alex: Meeting moved to 3 PM.';
    const msgs = parseConversation(raw);

    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe('msg-1');
    expect(msgs[0].sender).toBe('Alex');
    expect(msgs[0].content).toBe('Meeting moved to 3 PM.');
    expect(msgs[0].timestampRaw).toBe('09/10/2026, 10:30');
    expect(msgs[0].timestamp).not.toBeNull();
  });

  it('parses dash timestamped messages with date and time', () => {
    const raw = '09/10/2026, 10:30 - Priya: Please submit the form by Friday.';
    const msgs = parseConversation(raw);

    expect(msgs).toHaveLength(1);
    expect(msgs[0].id).toBe('msg-1');
    expect(msgs[0].sender).toBe('Priya');
    expect(msgs[0].content).toBe('Please submit the form by Friday.');
    expect(msgs[0].timestampRaw).toBe('09/10/2026, 10:30');
  });

  it('interprets ambiguous slash dates in day/month order for chat exports', () => {
    const messages = parseConversation('[09/10/2026, 10:30] Alex: Hello');
    const timestamp = messages[0].timestamp;

    expect(timestamp?.getFullYear()).toBe(2026);
    expect(timestamp?.getMonth()).toBe(9);
    expect(timestamp?.getDate()).toBe(9);
    expect(timestamp?.getHours()).toBe(10);
    expect(timestamp?.getMinutes()).toBe(30);
  });

  it('parses short time dash format', () => {
    const raw = '09:30 - Priya: Please submit the form by Friday.';
    const msgs = parseConversation(raw);

    expect(msgs).toHaveLength(1);
    expect(msgs[0].sender).toBe('Priya');
    expect(msgs[0].content).toBe('Please submit the form by Friday.');
    expect(msgs[0].timestampRaw).toBe('09:30');
  });

  it('parses messages without timestamps', () => {
    const raw = "Alex: I'll send the slides tonight.";
    const msgs = parseConversation(raw);

    expect(msgs).toHaveLength(1);
    expect(msgs[0].sender).toBe('Alex');
    expect(msgs[0].content).toBe("I'll send the slides tonight.");
    expect(msgs[0].timestamp).toBeNull();
  });

  it('handles empty input gracefully', () => {
    expect(parseConversation('')).toEqual([]);
    expect(parseConversation('   \n\n  ')).toEqual([]);
  });

  it('handles multiline continuation messages without losing content', () => {
    const raw = `[10:00] Sarah: Here is the proposed schedule:
- Phase 1: Planning
- Phase 2: Execution`;
    const msgs = parseConversation(raw);

    expect(msgs).toHaveLength(1);
    expect(msgs[0].sender).toBe('Sarah');
    expect(msgs[0].content).toContain('Phase 1: Planning');
    expect(msgs[0].content).toContain('Phase 2: Execution');
  });

  it('handles malformed leading lines without silent discard', () => {
    const raw = `This is a random unformatted note at the start.
[10:05] Carlos: On it now.`;
    const msgs = parseConversation(raw);

    expect(msgs).toHaveLength(2);
    expect(msgs[0].sender).toBe('Unknown');
    expect(msgs[0].content).toBe('This is a random unformatted note at the start.');
    expect(msgs[1].sender).toBe('Carlos');
  });

  it('preserves stable sequential message IDs', () => {
    const raw = `Alex: First
Carlos: Second
Sarah: Third`;
    const msgs = parseConversation(raw);

    expect(msgs[0].id).toBe('msg-1');
    expect(msgs[1].id).toBe('msg-2');
    expect(msgs[2].id).toBe('msg-3');
  });
});
