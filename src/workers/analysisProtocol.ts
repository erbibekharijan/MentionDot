import type { AnalysisResult, UserConfig } from '../types';

export interface AnalysisRequest {
  id: number;
  rawText: string;
  userConfig: UserConfig;
}

export type AnalysisResponse =
  | { id: number; ok: true; result: AnalysisResult; durationMs: number }
  | { id: number; ok: false; error: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

export function isAnalysisRequest(value: unknown): value is AnalysisRequest {
  if (!isRecord(value)) return false;
  const request = value;
  if (
    typeof request.id !== 'number' ||
    !Number.isSafeInteger(request.id) ||
    request.id < 1
  ) return false;
  if (typeof request.rawText !== 'string') return false;
  if (!isRecord(request.userConfig)) return false;

  const config = request.userConfig;
  return (
    typeof config.userName === 'string' &&
    Array.isArray(config.aliases) &&
    config.aliases.every((alias) => typeof alias === 'string')
  );
}

export function isAnalysisResponse(value: unknown): value is AnalysisResponse {
  if (!isRecord(value)) return false;
  const response = value;
  if (
    typeof response.id !== 'number' ||
    !Number.isSafeInteger(response.id) ||
    response.id < 1
  ) return false;
  if (response.ok === false) return typeof response.error === 'string';
  if (
    response.ok !== true ||
    !isRecord(response.result) ||
    typeof response.durationMs !== 'number'
  ) {
    return false;
  }

  const result = response.result;
  const stats = result.stats;
  return (
    Array.isArray(result.summary) &&
    result.summary.every((line) => typeof line === 'string') &&
    Array.isArray(result.items) &&
    result.items.every(
      (item) =>
        isRecord(item) && typeof item.sourceMessageId === 'string'
    ) &&
    Array.isArray(result.messages) &&
    result.messages.every(
      (message) =>
        isRecord(message) &&
        typeof message.id === 'string' &&
        typeof message.sender === 'string' &&
        typeof message.content === 'string'
    ) &&
    Array.isArray(result.timeline) &&
    isRecord(stats) &&
    typeof stats.totalMessages === 'number' &&
    Array.isArray(stats.participants) &&
    stats.participants.every((participant) => typeof participant === 'string') &&
    typeof stats.urgentCount === 'number' &&
    typeof stats.taskCount === 'number' &&
    typeof stats.deadlineCount === 'number' &&
    typeof stats.decisionCount === 'number' &&
    typeof stats.mentionCount === 'number' &&
    typeof stats.unansweredCount === 'number' &&
    typeof stats.completedCount === 'number' &&
    typeof result.analyzedAt === 'string' &&
    (result.provider === 'local_heuristic' || result.provider === 'remote_ai')
  );
}
