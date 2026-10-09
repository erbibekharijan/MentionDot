import type { AnalysisResult, ExtractedItem, Message } from '../types';

export interface CatchUpStoryBeat {
  item: ExtractedItem;
  message: Message;
  label: string;
}

const CATEGORY_ORDER: ExtractedItem['category'][] = [
  'task',
  'deadline',
  'decision',
  'question',
  'mention',
  'update',
];

function getBeatLabel(item: ExtractedItem): string {
  if (item.category === 'deadline') return 'A deadline was detected';
  if (item.category === 'decision') return 'A possible team decision was flagged';
  if (item.category === 'question') {
    return item.isWaitingOn
      ? 'A question was marked as possibly unanswered'
      : 'A question was detected';
  }
  if (item.category === 'mention') return 'A direct mention was detected';
  if (item.category === 'update') return 'A team update was flagged';
  if (item.priority === 'urgent') return 'An urgent issue was flagged';
  return 'An action item was detected';
}

export function buildCatchUpStory(result: AnalysisResult): CatchUpStoryBeat[] {
  const messagesById = new Map(result.messages.map((message) => [message.id, message]));
  const sortedItems = [...result.items].sort((a, b) => {
    const categoryOrder =
      CATEGORY_ORDER.indexOf(a.category) - CATEGORY_ORDER.indexOf(b.category);
    if (categoryOrder !== 0) return categoryOrder;
    return a.sourceMessageId.localeCompare(b.sourceMessageId, undefined, {
      numeric: true,
    });
  });

  const selectedCategories = new Set<ExtractedItem['category']>();
  const selectedMessages = new Set<string>();
  const beats: CatchUpStoryBeat[] = [];

  for (const item of sortedItems) {
    if (selectedCategories.has(item.category) || selectedMessages.has(item.sourceMessageId)) {
      continue;
    }

    const message = messagesById.get(item.sourceMessageId);
    if (!message) continue;

    selectedCategories.add(item.category);
    selectedMessages.add(item.sourceMessageId);
    beats.push({ item, message, label: getBeatLabel(item) });

    if (beats.length === 5) break;
  }

  return beats.sort((a, b) => a.message.rawIndex - b.message.rawIndex);
}
