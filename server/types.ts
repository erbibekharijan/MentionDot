import type { AnalysisResult, Message, UserConfig } from '../src/types/index.ts';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    requestId: string;
    timestamp: string;
    durationMs?: number;
    cached?: boolean;
  };
}

export interface HealthCheckData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  uptimeSeconds: number;
  environment: string;
  engines: {
    ruleEngine: 'active';
    cacheEngine: 'active';
    metricsEngine: 'active';
  };
  memoryUsage: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
  cacheStats: {
    size: number;
    capacity: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
}

export interface AnalyzeRequestBody {
  text: string;
  config?: Partial<UserConfig>;
  options?: {
    bypassCache?: boolean;
    format?: 'full' | 'summary_only';
  };
}

export interface ParseRequestBody {
  text: string;
}

export interface ParseResponseData {
  messages: Message[];
  totalCount: number;
  participants: string[];
}

export interface ExportRequestBody {
  result: AnalysisResult;
  format: 'markdown' | 'text' | 'json';
}

export interface ExportResponseData {
  content: string;
  format: 'markdown' | 'text' | 'json';
  filename: string;
}

export interface MetricsResponseData {
  totalAnalyzed: number;
  averageDurationMs: number;
  recentMeasurements: Array<{
    durationMs: number;
    messageCount: number;
    msPerMessage: number;
    completedAt: string;
  }>;
  cacheStats: {
    size: number;
    capacity: number;
    hits: number;
    misses: number;
    hitRate: number;
  };
}
