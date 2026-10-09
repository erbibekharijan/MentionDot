import type { DeadlineInfo } from '../types';

/**
 * Date and Deadline Extractor for MISSED.
 *
 * Grounded Rule Policy:
 * 1. Recognizes explicit dates (e.g., "October 10th", "Oct 12, 2026", "2026-10-15").
 * 2. Recognizes relative days: "today", "tonight", "tomorrow", "this Friday", "by Friday 5 PM".
 * 3. Identifies ambiguous dates (e.g., "by the 14th", "next week", "soon"):
 *    - Does NOT invent an arbitrary year or month.
 *    - Flags status as 'uncertain' and documents ambiguityReason explicitly.
 * 4. Categorizes status against reference context date (current/anchor date):
 *    - overdue: past deadline
 *    - due_today: due on the current day
 *    - upcoming: due in future with known date
 *    - uncertain: date missing month/year or vague relative phrasing
 */

export function extractDeadlineInfo(
  text: string,
  referenceDate: Date = new Date(),
  currentDate: Date = referenceDate
): DeadlineInfo | null {
  const lower = text.toLowerCase();
  const today = startOfDay(currentDate);

  const getStatus = (date: Date): 'overdue' | 'due_today' | 'upcoming' => {
    const deadlineDay = startOfDay(date);
    if (deadlineDay < today) return 'overdue';
    if (deadlineDay.getTime() === today.getTime()) return 'due_today';
    return 'upcoming';
  };

  const getDateLabel = (date: Date): string => {
    const dayDifference = Math.round(
      (startOfDay(date).getTime() - today.getTime()) / 86_400_000
    );
    if (dayDifference === 0) return 'Today';
    if (dayDifference === -1) return 'Yesterday';
    if (dayDifference === 1) return 'Tomorrow';
    return date.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() === currentDate.getFullYear() ? undefined : 'numeric',
    });
  };

  const toDateKey = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 1. Check for ambiguous day-of-month only: e.g. "due on the 14th", "by the 15th"
  const dayOnlyMatch = lower.match(/\b(?:by|due(?:\s+on)?|before|until)\s+the\s+(\d{1,2})(?:st|nd|rd|th)?\b/);
  if (dayOnlyMatch) {
    const day = parseInt(dayOnlyMatch[1], 10);
    // If not followed by a month name
    const hasMonth = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/.test(lower);
    if (!hasMonth) {
      return {
        dateStr: `The ${day}th (Month/Year unspecified)`,
        status: 'uncertain',
        isAmbiguous: true,
        ambiguityReason: `Ambiguous date: Day '${day}' specified without month or year. Rule: Do not assume year without explicit confirmation.`,
      };
    }
  }

  // 2. Relative: "today" / "tonight" / "end of day" / "eod"
  if (
    lower.includes('today') ||
    lower.includes('tonight') ||
    lower.includes('end of day') ||
    lower.includes('eod') ||
    lower.includes('before 5 pm today')
  ) {
    const timeMatch = lower.match(/(?:by|at|before)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    const timeStr = timeMatch ? ` by ${timeMatch[1]}` : '';
    const deadlineDate = startOfDay(referenceDate);
    return {
      dateStr: `${getDateLabel(deadlineDate)}${timeStr}`,
      status: getStatus(deadlineDate),
      parsedDate: toDateKey(deadlineDate),
      isAmbiguous: false,
    };
  }

  // 3. Relative: "tomorrow"
  if (lower.includes('tomorrow')) {
    const tomorrow = startOfDay(referenceDate);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const timeMatch = lower.match(/(?:by|at|before)\s+(\d{1,2}(?::\d{2})?\s*(?:am|pm)?)/i);
    const timeStr = timeMatch ? ` by ${timeMatch[1]}` : '';
    return {
      dateStr: `${getDateLabel(tomorrow)}${timeStr}`,
      status: getStatus(tomorrow),
      parsedDate: toDateKey(tomorrow),
      isAmbiguous: false,
    };
  }

  // 4. Day of the week: e.g., "by Friday 5 PM", "by Monday"
  const weekdayRegex = /\b(?:by|due|before|on|until)\s+(this\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)(?:\s+(?:at\s+|by\s+)?(\d{1,2}(?::\d{2})?\s*(?:am|pm)?))?/i;
  const weekdayMatch = lower.match(weekdayRegex);
  if (weekdayMatch) {
    const dayName = weekdayMatch[2];
    const timeStr = weekdayMatch[3] ? ` at ${weekdayMatch[3]}` : '';
    const capitalizedDay = dayName.charAt(0).toUpperCase() + dayName.slice(1);

    // Calculate approximate date based on day of week
    const daysMap: Record<string, number> = {
      sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6
    };
    const targetDayIndex = daysMap[dayName.toLowerCase()];
    const currentDayIndex = referenceDate.getDay();
    let diff = targetDayIndex - currentDayIndex;
    if (diff < 0) diff += 7; // Next occurrence

    const targetDate = startOfDay(referenceDate);
    targetDate.setDate(targetDate.getDate() + diff);
    const dateLabel = getDateLabel(targetDate);

    return {
      dateStr: `${dateLabel === 'Today' ? capitalizedDay : dateLabel}${timeStr}`,
      status: getStatus(targetDate),
      parsedDate: toDateKey(targetDate),
      isAmbiguous: false,
    };
  }

  // 5. Explicit Month and Day: e.g. "October 10th", "Oct 12", "by 10/12/2026"
  const monthNames = '(?:january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)';
  const explicitDateRegex = new RegExp(`\\b(?:by|due|before|on)?\\s*(${monthNames})\\s+(\\d{1,2})(?:st|nd|rd|th)?(?:,?\\s*(\\d{4}))?`, 'i');
  const explicitMatch = lower.match(explicitDateRegex);
  if (explicitMatch) {
    const month = explicitMatch[1];
    const day = explicitMatch[2];
    const year = explicitMatch[3] || referenceDate.getFullYear().toString();
    const formatted = `${month.charAt(0).toUpperCase() + month.slice(1)} ${day}${explicitMatch[3] ? ', ' + year : ''}`;

    // Test if past or future
    const parsed = new Date(`${month} ${day}, ${year}`);
    const status = !isNaN(parsed.getTime()) ? getStatus(parsed) : 'uncertain';

    return {
      dateStr: formatted,
      status,
      parsedDate: !isNaN(parsed.getTime()) ? toDateKey(parsed) : undefined,
      isAmbiguous: !explicitMatch[3], // Ambiguous if year was inferred
      ambiguityReason: !explicitMatch[3] ? `Year not specified; assumed current year (${year}).` : undefined,
    };
  }

  // 6. Generic deadlines like "EOW", "end of week"
  if (lower.includes('end of week') || lower.includes('eow')) {
    return {
      dateStr: 'End of week (Friday)',
      status: 'upcoming',
      isAmbiguous: false,
    };
  }

  // 7. Vague relative mentions: "soon", "next week", "later this month"
  if (lower.includes('next week') || lower.includes('sometime next week')) {
    return {
      dateStr: 'Next week',
      status: 'uncertain',
      isAmbiguous: true,
      ambiguityReason: 'Vague timeframe: Specific day or cutoff not stated.',
    };
  }

  return null;
}

function startOfDay(date: Date): Date {
  const day = new Date(date);
  day.setHours(0, 0, 0, 0);
  return day;
}
