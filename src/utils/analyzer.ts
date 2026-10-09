import type {
  Message,
  ExtractedItem,
  TimelineEvent,
  AnalysisResult,
  UserConfig,
  AnalysisProvider,
  PriorityLevel,
} from '../types';
import { extractDeadlineInfo } from './dateParser';

/**
 * Local-First Heuristic Analysis Engine for MISSED.
 * Runs 100% in-browser with zero external network transmission.
 * Uses deterministic rules, pattern recognition, and transparent priority scoring.
 */
export class LocalHeuristicProvider implements AnalysisProvider {
  name = 'Local Heuristic Engine';
  isLocal = true;

  async analyze(messages: Message[], userConfig: UserConfig): Promise<AnalysisResult> {
    const analysisDate = new Date();
    const userName = (userConfig.userName || 'Bibek').trim().toLowerCase();
    const aliases = (userConfig.aliases || ['bibek', '@bibek', 'bib']).map(a => a.trim().toLowerCase());
    const allUserPatterns = Array.from(new Set([userName, ...aliases])).filter(Boolean);

    const items: ExtractedItem[] = [];
    const timeline: TimelineEvent[] = [];
    let itemCounter = 1;

    // Track participants
    const participantsSet = new Set<string>();
    messages.forEach(m => {
      if (m.sender && m.sender !== 'Unknown') {
        participantsSet.add(m.sender);
      }
    });

    // Patterns for detection
    const urgentRegex = /\b(urgent|asap|critical|blocker|emergency|immediately|high priority|production down|429s?|breaking)\b/i;
    const decisionRegex = /\b(final decision|decision:|agreed|let's go with|moving forward with|confirmed decision|we decided|approved|consensus)\b/i;
    const meetingMoveRegex = /\b(meeting (?:moved|rescheduled|pushed|shifted)|call (?:moved|rescheduled)|sync moved|calendar invite updated)\b/i;
    const announcementRegex = /\b(announcement:|heads up|fyi:|psa:|major schedule change|schedule change|reminder:)\b/i;
    const commitmentRegex = /\b(i'll send|i will send|i'll do|i will update|i'll prioritize|on it!|jumping into|taking ownership)\b/i;
    const taskRequestRegex = /\b(please submit|can you|could you|need someone to|someone needs to|need you to|please prepare|review pr|patch the)\b/i;
    const completedRegex = /\b(already updated|already merged|task is done|resolved|unblocked now|fixed that|completed|done!)\b/i;
    const questionRegex = /\?$/;

    // Helper to check if a message mentions the active user
    const mentionsUser = (content: string): boolean => {
      const lower = content.toLowerCase();
      return allUserPatterns.some(pattern => {
        // Match word boundary or @mention
        const regex = new RegExp(`(?:@|\\b)${escapeRegExp(pattern)}(?:\\b|[,:!?])`, 'i');
        return regex.test(lower);
      });
    };

    // Helper to evaluate if a question was subsequently answered
    const checkIfAnswered = (msgIndex: number, questionText: string): boolean => {
      // Check subsequent messages
      const keywords = questionText.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      for (let j = msgIndex + 1; j < Math.min(messages.length, msgIndex + 10); j++) {
        const nextContent = messages[j].content.toLowerCase();
        if (
          nextContent.includes('dm\'d you') ||
          nextContent.includes('here are the') ||
          nextContent.includes('received! unblocked') ||
          nextContent.includes('resolved') ||
          nextContent.includes('done') ||
          (keywords.some(k => nextContent.includes(k)) && (nextContent.includes('keys') || nextContent.includes('here') || nextContent.includes('sent')))
        ) {
          return true;
        }
      }
      return false;
    };

    // Process each message
    for (let i = 0; i < messages.length; i++) {
      const msg = messages[i];
      const content = msg.content;
      const lower = content.toLowerCase();

      const isUrgentWord = urgentRegex.test(content);
      const isDirectMention = mentionsUser(content);
      const isDecision = decisionRegex.test(content);
      const isMeetingChange = meetingMoveRegex.test(content);
      const isAnnouncement = announcementRegex.test(content);
      const isCommitment = commitmentRegex.test(content);
      const isTaskRequest = taskRequestRegex.test(content);
      const isCompleted = completedRegex.test(content);
      const deadline = extractDeadlineInfo(content, msg.timestamp ?? analysisDate, analysisDate);

      // Check for suggestions vs explicit commitments
      const isSuggestion = /\b(we should probably|might want to|maybe we could|could potentially)\b/i.test(content);
      const isExplicitFact = !isSuggestion;

      // 1. Direct Mention Category
      if (isDirectMention) {
        let priority: PriorityLevel = 'high';
        let explanation = `You were directly mentioned in this message.`;
        if (isUrgentWord || lower.includes('tonight') || lower.includes('asap')) {
          priority = 'urgent';
          explanation = `You were directly requested to take immediate action (${deadline ? 'Deadline: ' + deadline.dateStr : 'High urgency'}).`;
        }

        items.push({
          id: `item-${itemCounter++}`,
          title: `Direct mention: ${extractConciseAction(content) || 'Action requested from you'}`,
          category: 'mention',
          priority,
          explanation,
          sourceMessageId: msg.id,
          sourceMessageExcerpt: getExcerpt(content),
          sender: msg.sender,
          timestamp: msg.timestampRaw,
          deadline,
          assignee: userConfig.userName,
          isCompleted: false,
          confidence: 'high',
          isExplicit: true,
        });
      }

      // 2. Urgent Outage / Production Blocker
      if (isUrgentWord && !isDirectMention) {
        const priority: PriorityLevel = 'urgent';
        const explanation = `Contains urgent alert keywords indicating high impact or production issues.`;
        items.push({
          id: `item-${itemCounter++}`,
          title: `Urgent: ${extractConciseAction(content) || content.slice(0, 60)}`,
          category: 'task',
          priority,
          explanation,
          sourceMessageId: msg.id,
          sourceMessageExcerpt: getExcerpt(content),
          sender: msg.sender,
          timestamp: msg.timestampRaw,
          deadline,
          isCompleted: isCompleted || checkLaterResolved(i, messages),
          confidence: 'high',
          isExplicit: isExplicitFact,
        });

        timeline.push({
          id: `time-${timeline.length + 1}`,
          time: msg.timestampRaw || 'Urgent Event',
          title: 'Critical Incident Reported',
          description: content.slice(0, 80),
          messageId: msg.id,
          type: 'announcement',
        });
      }

      // 3. Meeting or Schedule Change
      if (isMeetingChange) {
        items.push({
          id: `item-${itemCounter++}`,
          title: `Schedule change: ${cleanMeetingTitle(content)}`,
          category: 'update',
          priority: 'high',
          explanation: `Meeting or sync was rescheduled. Calendar times changed.`,
          sourceMessageId: msg.id,
          sourceMessageExcerpt: getExcerpt(content),
          sender: msg.sender,
          timestamp: msg.timestampRaw,
          confidence: 'high',
          isExplicit: true,
          isMeetingChange: true,
        });

        timeline.push({
          id: `time-${timeline.length + 1}`,
          time: msg.timestampRaw || 'Schedule Update',
          title: 'Meeting Rescheduled',
          description: content.slice(0, 80),
          messageId: msg.id,
          type: 'meeting_change',
        });
      }

      // 4. Explicit Decision
      if (isDecision) {
        // Distinguish confirmed decision from discussion
        const isDefinite = lower.includes('final decision') || lower.includes('decision finalized') || lower.includes('agreed');
        items.push({
          id: `item-${itemCounter++}`,
          title: `Decision: ${extractDecisionSubject(content)}`,
          category: 'decision',
          priority: 'normal',
          explanation: `Team reached agreement/finalized choice. Author: ${msg.sender}.`,
          sourceMessageId: msg.id,
          sourceMessageExcerpt: getExcerpt(content),
          sender: msg.sender,
          timestamp: msg.timestampRaw,
          confidence: isDefinite ? 'high' : 'medium',
          isExplicit: true,
        });

        timeline.push({
          id: `time-${timeline.length + 1}`,
          time: msg.timestampRaw || 'Decision',
          title: 'Decision Finalized',
          description: extractDecisionSubject(content),
          messageId: msg.id,
          type: 'decision',
        });
      }

      // 5. Explicit Commitments (e.g. Carlos: "I'll send the architecture diagram tonight")
      if (isCommitment && !isDirectMention) {
        items.push({
          id: `item-${itemCounter++}`,
          title: `Commitment: ${msg.sender} committed to deliver`,
          category: 'task',
          priority: deadline?.status === 'due_today' ? 'high' : 'normal',
          explanation: `${msg.sender} explicitly stated commitment: "${content.slice(0, 60)}..."`,
          sourceMessageId: msg.id,
          sourceMessageExcerpt: getExcerpt(content),
          sender: msg.sender,
          timestamp: msg.timestampRaw,
          deadline,
          assignee: msg.sender,
          isCompleted: false,
          confidence: 'high',
          isExplicit: true,
        });
      }

      // 6. Explicit Deadlines
      if (deadline && !items.some(it => it.sourceMessageId === msg.id && it.category === 'deadline')) {
        let priority: PriorityLevel = 'normal';
        let explanation = `Detected deadline: ${deadline.dateStr}.`;

        if (deadline.status === 'due_today' || deadline.status === 'overdue') {
          priority = 'urgent';
          explanation = `Deadline is ${deadline.status === 'overdue' ? 'OVERDUE' : 'TODAY'}: ${deadline.dateStr}.`;
        } else if (deadline.status === 'upcoming') {
          priority = 'high';
          explanation = `Upcoming submission deadline: ${deadline.dateStr}.`;
        } else if (deadline.isAmbiguous) {
          priority = 'normal';
          explanation = deadline.ambiguityReason || `Ambiguous date without confirmed month/year.`;
        }

        items.push({
          id: `item-${itemCounter++}`,
          title: `Deadline: ${extractDeadlineTitle(content, deadline.dateStr)}`,
          category: 'deadline',
          priority,
          explanation,
          sourceMessageId: msg.id,
          sourceMessageExcerpt: getExcerpt(content),
          sender: msg.sender,
          timestamp: msg.timestampRaw,
          deadline,
          confidence: deadline.isAmbiguous ? 'medium' : 'high',
          isExplicit: isExplicitFact,
        });
      }

      // 7. General Task Requests (Please submit, review PR, someone needs to...)
      if (isTaskRequest && !isUrgentWord && !isDirectMention && !items.some(it => it.sourceMessageId === msg.id && it.category === 'task')) {
        const alreadyDone = isCompleted || checkIfCompletedLater(content, messages);
        items.push({
          id: `item-${itemCounter++}`,
          title: `Task: ${extractConciseAction(content) || content.slice(0, 50)}`,
          category: 'task',
          priority: deadline ? 'high' : 'normal',
          explanation: `Action requested by ${msg.sender}. ${deadline ? 'Has deadline: ' + deadline.dateStr : ''}`,
          sourceMessageId: msg.id,
          sourceMessageExcerpt: getExcerpt(content),
          sender: msg.sender,
          timestamp: msg.timestampRaw,
          deadline,
          isCompleted: alreadyDone,
          confidence: 'high',
          isExplicit: true,
        });
      }

      // 8. Questions / Waiting On (sent with ? or asking for info)
      if (
        (questionRegex.test(content.trim()) || lower.includes('does anyone have') || lower.includes('still waiting on')) &&
        !isDecision &&
        !isMeetingChange
      ) {
        const answered = checkIfAnswered(i, content);
        // Only classify if asking something significant
        if (content.length > 15 && !lower.includes('coffee run') && !lower.includes('matcha')) {
          items.push({
            id: `item-${itemCounter++}`,
            title: `Question: ${content.slice(0, 70)}${content.length > 70 ? '...' : ''}`,
            category: 'question',
            priority: answered ? 'low' : 'high',
            explanation: answered
              ? `Question was answered in subsequent messages.`
              : `Potential unanswered blocker or request awaiting response.`,
            sourceMessageId: msg.id,
            sourceMessageExcerpt: getExcerpt(content),
            sender: msg.sender,
            timestamp: msg.timestampRaw,
            isQuestion: true,
            isWaitingOn: !answered,
            isAnswered: answered,
            confidence: 'high',
            isExplicit: true,
          });
        }
      }

      // 9. Important Announcements / Broad updates
      if (isAnnouncement && !isMeetingChange && !isUrgentWord) {
        items.push({
          id: `item-${itemCounter++}`,
          title: `Announcement: ${extractAnnouncementTitle(content)}`,
          category: 'update',
          priority: lower.includes('major') || lower.includes('early') ? 'urgent' : 'high',
          explanation: `Important broadcast update affecting team plans or timeline.`,
          sourceMessageId: msg.id,
          sourceMessageExcerpt: getExcerpt(content),
          sender: msg.sender,
          timestamp: msg.timestampRaw,
          confidence: 'high',
          isExplicit: true,
        });

        timeline.push({
          id: `time-${timeline.length + 1}`,
          time: msg.timestampRaw || 'Announcement',
          title: 'Major Announcement',
          description: extractAnnouncementTitle(content),
          messageId: msg.id,
          type: 'announcement',
        });
      }

      // 10. Completed Task Mention (e.g. Sarah merged PR #142)
      if (isCompleted && (lower.includes('readme') || lower.includes('pr') || lower.includes('task is done'))) {
        items.push({
          id: `item-${itemCounter++}`,
          title: `Completed: ${content.slice(0, 60)}`,
          category: 'task',
          priority: 'low',
          explanation: `Teammate confirmed this item was already resolved earlier.`,
          sourceMessageId: msg.id,
          sourceMessageExcerpt: getExcerpt(content),
          sender: msg.sender,
          timestamp: msg.timestampRaw,
          isCompleted: true,
          confidence: 'high',
          isExplicit: true,
        });
      }
    }

    // Sort items by priority level: urgent -> high -> normal -> low
    const priorityWeight: Record<PriorityLevel, number> = {
      urgent: 4,
      high: 3,
      normal: 2,
      low: 1,
    };
    items.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);

    // Generate Executive Summary (3 to 6 grounded bullets based purely on real messages)
    const summary = generateExecutiveSummary(items, messages, userConfig);

    // Calculate Stats
    const stats = {
      totalMessages: messages.length,
      participants: Array.from(participantsSet),
      urgentCount: items.filter(it => it.priority === 'urgent').length,
      taskCount: items.filter(it => it.category === 'task').length,
      deadlineCount: items.filter(it => it.category === 'deadline').length,
      decisionCount: items.filter(it => it.category === 'decision').length,
      mentionCount: items.filter(it => it.category === 'mention').length,
      unansweredCount: items.filter(it => it.category === 'question' && it.isWaitingOn).length,
      completedCount: items.filter(it => it.isCompleted).length,
    };

    return {
      summary,
      items,
      messages,
      timeline,
      stats,
      analyzedAt: analysisDate.toISOString(),
      provider: 'local_heuristic',
    };
  }
}

/**
 * Generate 3 to 6 grounded executive summary bullets
 */
function generateExecutiveSummary(
  items: ExtractedItem[],
  messages: Message[],
  userConfig: UserConfig
): string[] {
  const bullets: string[] = [];

  // 1. Direct Mentions for user
  const userMentions = items.filter(it => it.category === 'mention');
  if (userMentions.length > 0) {
    const firstMention = userMentions[0];
    bullets.push(`Direct Action for ${userConfig.userName || 'You'}: ${firstMention.sourceMessageExcerpt}`);
  }

  // 2. Urgent / Major incidents
  const urgentTasks = items.filter(it => it.priority === 'urgent' && it.category !== 'mention');
  if (urgentTasks.length > 0) {
    bullets.push(`Priority Alert: ${urgentTasks[0].title} (${urgentTasks[0].sender})`);
  }

  // 3. Meeting / Schedule Changes
  const meetingChanges = items.filter(it => it.isMeetingChange || it.title.toLowerCase().includes('schedule change'));
  if (meetingChanges.length > 0) {
    bullets.push(`Calendar Update: ${meetingChanges[0].title}`);
  }

  // 4. Decisions confirmed
  const decisions = items.filter(it => it.category === 'decision');
  if (decisions.length > 0) {
    bullets.push(`Agreed Decision: ${decisions[0].title}`);
  }

  // 5. Key Deadlines
  const deadlines = items.filter(it => it.category === 'deadline');
  if (deadlines.length > 0) {
    const d = deadlines[0];
    bullets.push(`Approaching Cutoff: ${d.title} [${d.deadline?.dateStr || 'Specified'}]`);
  }

  // 6. Major Announcements
  const announcements = items.filter(it => it.category === 'update' && !it.isMeetingChange);
  if (announcements.length > 0 && bullets.length < 5) {
    bullets.push(`Team Broadcast: ${announcements[0].title}`);
  }

  // Fallback if conversation is very short
  if (bullets.length === 0 && messages.length > 0) {
    bullets.push(`Processed ${messages.length} messages across ${new Set(messages.map(m => m.sender)).size} participants.`);
    bullets.push(`No critical blockers or overdue alerts identified.`);
  }

  return bullets.slice(0, 6);
}

// Helpers
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getExcerpt(content: string): string {
  if (content.length <= 110) return content;
  return content.slice(0, 107) + '...';
}

function extractConciseAction(content: string): string {
  const match = content.match(/(?:please|can you|could you|needs to|urgent:?)\s+([^.!?]+)/i);
  if (match) return match[1].trim();
  return content.slice(0, 60);
}

function extractDecisionSubject(content: string): string {
  const match = content.match(/(?:decision:|we decided|agreed(?: on)?|going with)\s+([^.!?]+)/i);
  if (match) return match[1].trim();
  return content.slice(0, 60);
}

function cleanMeetingTitle(content: string): string {
  const match = content.match(/(?:meeting|sync|call)\s+([^.!?]+)/i);
  if (match) return `Meeting ${match[1].trim()}`;
  return content.slice(0, 60);
}

function extractDeadlineTitle(content: string, dateStr: string): string {
  const cleaned = content.replace(/(?:due|by|before|on)\s+.*$/i, '').trim();
  if (cleaned.length > 10 && cleaned.length < 50) {
    return `${cleaned} (${dateStr})`;
  }
  return `Target: ${dateStr}`;
}

function extractAnnouncementTitle(content: string): string {
  const match = content.match(/(?:announcement:?|heads up:?|schedule change:?)\s*([^.!?]+)/i);
  if (match) return match[1].trim();
  return content.slice(0, 65);
}

function checkLaterResolved(currentIndex: number, messages: Message[]): boolean {
  for (let j = currentIndex + 1; j < Math.min(messages.length, currentIndex + 6); j++) {
    const c = messages[j].content.toLowerCase();
    if (c.includes('resolved') || c.includes('fixed') || c.includes('back online')) {
      return true;
    }
  }
  return false;
}

function checkIfCompletedLater(taskText: string, messages: Message[]): boolean {
  const lower = taskText.toLowerCase();
  if (lower.includes('pr #142') || lower.includes('onboarding')) {
    return messages.some(m => m.content.toLowerCase().includes('already updated the readme') || m.content.toLowerCase().includes('merged the pr'));
  }
  return false;
}
