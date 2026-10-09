import { sanitizeRawText } from '../../src/utils/sanitizer.ts';
import { validateAnalysisInputs } from '../../src/utils/inputValidator.ts';
import { parseConversation } from '../../src/utils/parser.ts';
import { LocalHeuristicProvider } from '../../src/utils/analyzer.ts';
import { analysisCache, deriveCacheKey } from '../../src/utils/analysisCache.ts';
import { analysisTimingBuffer, startMeasurement } from '../../src/utils/perfMonitor.ts';
import { formatAsMarkdown, formatAsPlainText } from '../../src/utils/exporter.ts';
import type { AnalysisResult, Message, UserConfig } from '../../src/types/index.ts';
import type {
  AnalyzeRequestBody,
  ExportRequestBody,
  ExportResponseData,
  HealthCheckData,
  MetricsResponseData,
  ParseRequestBody,
  ParseResponseData,
} from '../types.ts';
import { HttpError } from '../middleware/errorHandler.ts';

export class AnalysisService {
  private readonly provider = new LocalHeuristicProvider();
  private readonly startTime = Date.now();
  private totalAnalyzed = 0;

  /**
   * Health check diagnostics
   */
  public getHealth(): HealthCheckData {
    const memory = process.memoryUsage();
    const cacheDiag = analysisCache.diagnostics();
    const totalRequests = cacheDiag.entries.reduce((sum, e) => sum + e.hits, 0);

    return {
      status: 'healthy',
      version: '1.2.0',
      uptimeSeconds: Math.floor((Date.now() - this.startTime) / 1000),
      environment: process.env.NODE_ENV || 'production',
      engines: {
        ruleEngine: 'active',
        cacheEngine: 'active',
        metricsEngine: 'active',
      },
      memoryUsage: {
        heapUsedMB: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
        heapTotalMB: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
        rssMB: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
      },
      cacheStats: {
        size: cacheDiag.size,
        capacity: cacheDiag.maxSize,
        hits: totalRequests,
        misses: Math.max(0, this.totalAnalyzed - totalRequests),
        hitRate: this.totalAnalyzed > 0 ? Math.round((totalRequests / this.totalAnalyzed) * 100) / 100 : 0,
      },
    };
  }

  /**
   * Analyze conversation text
   */
  public async analyze(body: AnalyzeRequestBody): Promise<{ result: AnalysisResult; cached: boolean; durationMs: number }> {
    if (!body || typeof body.text !== 'string') {
      throw new HttpError(400, 'INVALID_BODY', 'Request body must include a valid "text" string.');
    }

    const sanitized = sanitizeRawText(body.text);
    const userConfig: UserConfig = {
      userName: body.config?.userName || 'Bibek',
      aliases: Array.isArray(body.config?.aliases) ? body.config.aliases : ['bibek', '@bibek', 'bib'],
    };

    const validation = validateAnalysisInputs(sanitized, userConfig);
    if (!validation.ok) {
      throw new HttpError(400, 'VALIDATION_FAILED', validation.reason);
    }

    const cacheKey = deriveCacheKey(sanitized, userConfig);
    if (!body.options?.bypassCache) {
      const cached = analysisCache.get(cacheKey);
      if (cached) {
        return { result: cached, cached: true, durationMs: 0 };
      }
    }

    const stopMeasure = startMeasurement('api.analyze');
    const messages = parseConversation(sanitized);

    if (messages.length === 0) {
      throw new HttpError(422, 'UNPROCESSABLE_CONTENT', 'No valid chat messages could be parsed from the provided input.');
    }

    const result = await this.provider.analyze(messages, userConfig);
    const timing = stopMeasure(messages.length);
    analysisTimingBuffer.push(timing);

    this.totalAnalyzed += 1;
    analysisCache.set(cacheKey, result);

    return {
      result,
      cached: false,
      durationMs: timing.durationMs,
    };
  }

  /**
   * Parse conversation messages only
   */
  public parse(body: ParseRequestBody): ParseResponseData {
    if (!body || typeof body.text !== 'string') {
      throw new HttpError(400, 'INVALID_BODY', 'Request body must include a valid "text" string.');
    }

    const sanitized = sanitizeRawText(body.text);
    const messages: Message[] = parseConversation(sanitized);
    const participants = Array.from(
      new Set(messages.map(m => m.sender).filter(s => s && s !== 'Unknown'))
    );

    return {
      messages,
      totalCount: messages.length,
      participants,
    };
  }

  /**
   * Export briefing
   */
  public export(body: ExportRequestBody): ExportResponseData {
    if (!body || !body.result || !body.format) {
      throw new HttpError(400, 'INVALID_BODY', 'Request body must specify "result" and "format" (markdown | text | json).');
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let content: string;
    let filename: string;

    switch (body.format) {
      case 'markdown':
        content = formatAsMarkdown(body.result);
        filename = `missed-briefing-${timestamp}.md`;
        break;
      case 'text':
        content = formatAsPlainText(body.result);
        filename = `missed-briefing-${timestamp}.txt`;
        break;
      case 'json':
        content = JSON.stringify(body.result, null, 2);
        filename = `missed-briefing-${timestamp}.json`;
        break;
      default:
        throw new HttpError(400, 'UNSUPPORTED_FORMAT', `Unsupported format "${body.format}". Use "markdown", "text", or "json".`);
    }

    return {
      content,
      format: body.format,
      filename,
    };
  }

  /**
   * Get telemetry metrics
   */
  public getMetrics(): MetricsResponseData {
    const cacheDiag = analysisCache.diagnostics();
    const totalRequests = cacheDiag.entries.reduce((sum, e) => sum + e.hits, 0);

    return {
      totalAnalyzed: this.totalAnalyzed,
      averageDurationMs: analysisTimingBuffer.averageDurationMs(),
      recentMeasurements: analysisTimingBuffer.all().map(m => ({
        durationMs: m.durationMs,
        messageCount: m.messageCount,
        msPerMessage: m.msPerMessage,
        completedAt: m.completedAt,
      })),
      cacheStats: {
        size: cacheDiag.size,
        capacity: cacheDiag.maxSize,
        hits: totalRequests,
        misses: Math.max(0, this.totalAnalyzed - totalRequests),
        hitRate: this.totalAnalyzed > 0 ? Math.round((totalRequests / this.totalAnalyzed) * 100) / 100 : 0,
      },
    };
  }
}

export const analysisService = new AnalysisService();
