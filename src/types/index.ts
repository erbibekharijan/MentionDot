export type PriorityLevel = 'urgent' | 'high' | 'normal' | 'low';

export type ItemCategory = 
  | 'task' 
  | 'deadline' 
  | 'decision' 
  | 'mention' 
  | 'question' 
  | 'update';

export type DeadlineStatus = 'overdue' | 'due_today' | 'upcoming' | 'uncertain';

export interface DeadlineInfo {
  dateStr: string;
  status: DeadlineStatus;
  parsedDate?: string;
  isAmbiguous?: boolean;
  ambiguityReason?: string;
}

export interface Message {
  id: string; // Stable ID, e.g., 'msg-1'
  rawIndex: number;
  rawText: string;
  sender: string;
  timestamp: Date | null;
  timestampRaw: string | null;
  content: string;
}

export interface ExtractedItem {
  id: string; // Stable ID, e.g., 'item-1'
  title: string;
  category: ItemCategory;
  priority: PriorityLevel;
  explanation: string; // "Why this matters"
  sourceMessageId: string; // Stable message reference
  sourceMessageExcerpt: string;
  sender: string;
  timestamp: string | null;
  deadline?: DeadlineInfo | null;
  assignee?: string | null;
  isCompleted?: boolean;
  confidence: 'high' | 'medium' | 'low';
  isExplicit: boolean; // Distinguishes explicit facts from suggestions/inferences
  isQuestion?: boolean;
  isWaitingOn?: boolean;
  isAnswered?: boolean;
  isMeetingChange?: boolean;
}

export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  description: string;
  messageId: string;
  type: 'meeting_change' | 'decision' | 'task_created' | 'announcement';
}

export interface AnalysisStats {
  totalMessages: number;
  participants: string[];
  urgentCount: number;
  taskCount: number;
  deadlineCount: number;
  decisionCount: number;
  mentionCount: number;
  unansweredCount: number;
  completedCount: number;
}

export interface AnalysisResult {
  summary: string[];
  items: ExtractedItem[];
  messages: Message[];
  timeline: TimelineEvent[];
  stats: AnalysisStats;
  analyzedAt: string;
  provider: 'local_heuristic' | 'remote_ai';
}

export interface UserConfig {
  userName: string;
  aliases: string[];
}

export interface AnalysisProvider {
  name: string;
  isLocal: boolean;
  analyze(messages: Message[], userConfig: UserConfig): Promise<AnalysisResult>;
}
