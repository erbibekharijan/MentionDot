import type { Message } from '../types';

/**
 * Message Parser for MISSED.
 * Handles diverse conversation formats:
 * - [09/10/2026, 10:30] Alex: Meeting moved to 3 PM.
 * - 09/10/2026, 10:30 - Priya: Please submit the form by Friday.
 * - 09:30 - Priya: Please submit the form by Friday.
 * - Alex: I'll send the slides tonight.
 * - Multi-line continuations
 * - Malformed lines preserved gracefully without silent loss
 */
export function parseConversation(rawText: string): Message[] {
  if (!rawText || !rawText.trim()) {
    return [];
  }

  const lines = rawText.split(/\r?\n/);
  const messages: Message[] = [];
  let msgCounter = 1;

  // Regex patterns for various chat exports
  // 1. Bracket format: [09/10/2026, 10:30:15] Name: Message or [10:30] Name: Message
  const bracketRegex = /^\[([^\]]+)\]\s+([^:]+?):\s*(.*)$/;

  // 2. Dash format: 09/10/2026, 10:30 - Name: Message or 10:30 - Name: Message
  const dashRegex = /^(\d{1,4}[-/.]\d{1,2}[-/.]\d{1,4}(?:,\s*|\s+)\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?|\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?)\s*-\s*([^:]+?):\s*(.*)$/;

  // 3. Simple Colon format: Name: Message (allowing spaces, unicode names)
  const simpleColonRegex = /^([A-Za-z0-9_@.\s]{2,30}):\s+(.+)$/;

  // 4. Slack/Discord timestamp format: Name [10:30 AM]: Message
  const slackRegex = /^([A-Za-z0-9_@.\s]{2,30})\s+\[([^\]]+)\]:\s*(.*)$/;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (!trimmed) {
      // Empty line - if inside a message, keep newline in multiline content
      if (messages.length > 0) {
        messages[messages.length - 1].content += '\n';
        messages[messages.length - 1].rawText += '\n';
      }
      continue;
    }

    let matched = false;

    // Try bracket format
    const bracketMatch = trimmed.match(bracketRegex);
    if (bracketMatch) {
      const [, timestampStr, sender, content] = bracketMatch;
      messages.push({
        id: `msg-${msgCounter++}`,
        rawIndex: i,
        rawText: rawLine,
        sender: sender.trim(),
        timestamp: parseDateString(timestampStr.trim()),
        timestampRaw: timestampStr.trim(),
        content: content.trim(),
      });
      matched = true;
      continue;
    }

    // Try dash format
    const dashMatch = trimmed.match(dashRegex);
    if (dashMatch) {
      const [, timestampStr, sender, content] = dashMatch;
      messages.push({
        id: `msg-${msgCounter++}`,
        rawIndex: i,
        rawText: rawLine,
        sender: sender.trim(),
        timestamp: parseDateString(timestampStr.trim()),
        timestampRaw: timestampStr.trim(),
        content: content.trim(),
      });
      matched = true;
      continue;
    }

    // Try slack/discord format: Name [timestamp]: message
    const slackMatch = trimmed.match(slackRegex);
    if (slackMatch) {
      const [, sender, timestampStr, content] = slackMatch;
      messages.push({
        id: `msg-${msgCounter++}`,
        rawIndex: i,
        rawText: rawLine,
        sender: sender.trim(),
        timestamp: parseDateString(timestampStr.trim()),
        timestampRaw: timestampStr.trim(),
        content: content.trim(),
      });
      matched = true;
      continue;
    }

    // Try simple colon format (Alex: message)
    // Make sure it doesn't look like a URL or time prefix
    if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://')) {
      const colonMatch = trimmed.match(simpleColonRegex);
      if (colonMatch) {
        const [, sender, content] = colonMatch;
        // Avoid matching words like "Note:" or "PS:" if single word without context, but treat as sender if standard name
        messages.push({
          id: `msg-${msgCounter++}`,
          rawIndex: i,
          rawText: rawLine,
          sender: sender.trim(),
          timestamp: null,
          timestampRaw: null,
          content: content.trim(),
        });
        matched = true;
        continue;
      }
    }

    // If not matched, it's either a multiline continuation or a malformed message
    if (!matched) {
      if (messages.length > 0) {
        // Append as multiline continuation of previous message
        const prev = messages[messages.length - 1];
        prev.content += (prev.content ? '\n' : '') + trimmed;
        prev.rawText += '\n' + rawLine;
      } else {
        // Leading line without sender - do NOT silently discard!
        messages.push({
          id: `msg-${msgCounter++}`,
          rawIndex: i,
          rawText: rawLine,
          sender: 'Unknown',
          timestamp: null,
          timestampRaw: null,
          content: trimmed,
        });
      }
    }
  }

  return messages;
}

/**
 * Attempts to parse date strings into Date objects
 * Supports formats like:
 * - 09/10/2026, 10:30
 * - 2026-10-09 10:30
 * - 10:30 AM
 */
function parseDateString(str: string): Date | null {
  try {
    const localizedDateMatch = str.match(
      /^(\d{1,2})[/. -](\d{1,2})[/. -](\d{2,4})(?:,?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([APap][Mm])?)?$/
    );
    if (localizedDateMatch) {
      const first = Number(localizedDateMatch[1]);
      const second = Number(localizedDateMatch[2]);
      const yearValue = Number(localizedDateMatch[3]);
      const year = yearValue < 100 ? yearValue + (yearValue < 50 ? 2000 : 1900) : yearValue;
      // WhatsApp-style ambiguous dates default to day/month; values above 12 disambiguate.
      const dayFirst = first > 12 || second <= 12;
      const day = dayFirst ? first : second;
      const month = dayFirst ? second : first;
      let hours = Number(localizedDateMatch[4] || 0);
      const minutes = Number(localizedDateMatch[5] || 0);
      const seconds = Number(localizedDateMatch[6] || 0);
      const meridiem = localizedDateMatch[7];

      if (meridiem && /pm/i.test(meridiem) && hours < 12) hours += 12;
      if (meridiem && /am/i.test(meridiem) && hours === 12) hours = 0;

      const parsed = new Date(year, month - 1, day, hours, minutes, seconds);
      if (
        parsed.getFullYear() === year &&
        parsed.getMonth() === month - 1 &&
        parsed.getDate() === day
      ) {
        return parsed;
      }
      return null;
    }

    // If it's just a time like "10:30" or "10:30 AM"
    if (/^\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap][Mm])?$/.test(str)) {
      const now = new Date();
      const parts = str.split(/[:\s]/);
      let hours = parseInt(parts[0], 10);
      const minutes = parseInt(parts[1], 10);
      const isPm = /pm/i.test(str);
      const isAm = /am/i.test(str);
      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;
      const d = new Date(now);
      d.setHours(hours, minutes, 0, 0);
      return d;
    }

    // Try standard Date parsing
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  } catch {
    // Return null if parsing fails
  }
  return null;
}
