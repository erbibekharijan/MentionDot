import { describe, it, expect, beforeEach } from 'vitest';
import { analysisService } from '../../server/services/analysisService.ts';
import { RateLimiter, applySecurityHeaders } from '../../server/middleware/security.ts';
import { HttpError } from '../../server/middleware/errorHandler.ts';
import type { ServerResponse } from 'node:http';

const SAMPLE_CHAT = `
[09:00] Alice: Team, urgent issue: production DB connection pool exhausted!
[09:05] Bob: @bibek Can you check the connection pool config ASAP?
[09:10] Bibek: On it, restarting the pool now.
[09:15] Alice: Confirmed resolved. Next deadline is Friday for the migration.
`;

describe('AnalysisService Backend API', () => {
  beforeEach(() => {
    // Reset or ensure baseline state
  });

  it('provides comprehensive health diagnostics', () => {
    const health = analysisService.getHealth();
    expect(health.status).toBe('healthy');
    expect(health.version).toBe('1.2.0');
    expect(health.engines.ruleEngine).toBe('active');
    expect(health.engines.cacheEngine).toBe('active');
    expect(health.engines.metricsEngine).toBe('active');
    expect(health.memoryUsage.heapUsedMB).toBeGreaterThan(0);
    expect(health.cacheStats).toBeDefined();
    expect(health.cacheStats.capacity).toBeGreaterThan(0);
  });

  it('analyzes chat conversation with timing and metadata', async () => {
    const { result, cached, durationMs } = await analysisService.analyze({
      text: SAMPLE_CHAT,
      config: { userName: 'Bibek', aliases: ['bibek', '@bibek'] },
    });

    expect(result).toBeDefined();
    expect(result.summary.length).toBeGreaterThan(0);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.messages.length).toBeGreaterThanOrEqual(4);
    expect(result.stats.totalMessages).toBeGreaterThanOrEqual(4);
    expect(cached).toBe(false);
    expect(durationMs).toBeGreaterThanOrEqual(0);
  });

  it('serves cached results on identical re-analysis', async () => {
    const chat = `[10:00] Charlie: Urgent meeting today at 2pm!
[10:05] Dave: Noted, will attend.`;
    const first = await analysisService.analyze({ text: chat });
    expect(first.cached).toBe(false);

    const second = await analysisService.analyze({ text: chat });
    expect(second.cached).toBe(true);
    expect(second.result.summary).toEqual(first.result.summary);
  });

  it('rejects missing or invalid text with HttpError 400', async () => {
    await expect(
      analysisService.analyze({} as unknown as Parameters<typeof analysisService.analyze>[0])
    ).rejects.toThrow(HttpError);
    await expect(
      analysisService.analyze({ text: null } as unknown as Parameters<typeof analysisService.analyze>[0])
    ).rejects.toThrow(HttpError);
  });

  it('rejects input that cannot be parsed into messages with 422', async () => {
    await expect(
      analysisService.analyze({ text: 'No message structure here whatsoever.' })
    ).rejects.toThrow(HttpError);
  });

  it('parses raw chat conversation into structured message objects', () => {
    const parsed = analysisService.parse({ text: SAMPLE_CHAT });
    expect(parsed.totalCount).toBeGreaterThanOrEqual(4);
    expect(parsed.messages.length).toBeGreaterThanOrEqual(4);
    expect(parsed.participants).toContain('Alice');
    expect(parsed.participants).toContain('Bob');
    expect(parsed.participants).toContain('Bibek');
  });

  it('exports analysis result to Markdown format', async () => {
    const { result } = await analysisService.analyze({ text: SAMPLE_CHAT });
    const exported = analysisService.export({ result, format: 'markdown' });

    expect(exported.format).toBe('markdown');
    expect(exported.filename).toMatch(/\.md$/);
    expect(exported.content).toContain('# MISSED.');
    expect(exported.content).toContain('Executive Summary');
  });

  it('exports analysis result to Plain Text format', async () => {
    const { result } = await analysisService.analyze({ text: SAMPLE_CHAT });
    const exported = analysisService.export({ result, format: 'text' });

    expect(exported.format).toBe('text');
    expect(exported.filename).toMatch(/\.txt$/);
    expect(exported.content).toContain('EXECUTIVE SUMMARY:');
  });

  it('exports analysis result to JSON format', async () => {
    const { result } = await analysisService.analyze({ text: SAMPLE_CHAT });
    const exported = analysisService.export({ result, format: 'json' });

    expect(exported.format).toBe('json');
    expect(exported.filename).toMatch(/\.json$/);
    const parsed = JSON.parse(exported.content);
    expect(parsed.summary).toBeDefined();
    expect(parsed.items).toBeDefined();
  });

  it('rejects unsupported export format with 400', async () => {
    const { result } = await analysisService.analyze({ text: SAMPLE_CHAT });
    expect(() =>
      analysisService.export({ result, format: 'pdf' } as unknown as Parameters<typeof analysisService.export>[0])
    ).toThrow(HttpError);
  });

  it('provides telemetry metrics and timing history', () => {
    const metrics = analysisService.getMetrics();
    expect(metrics.totalAnalyzed).toBeGreaterThanOrEqual(1);
    expect(metrics.averageDurationMs).toBeGreaterThanOrEqual(0);
    expect(metrics.cacheStats).toBeDefined();
    expect(Array.isArray(metrics.recentMeasurements)).toBe(true);
  });
});

describe('Security and Rate Limiter Middleware', () => {
  it('applies standard security headers to response', () => {
    const headers = new Map<string, string>();
    const mockRes = {
      setHeader: (k: string, v: string) => headers.set(k, v),
    } as unknown as ServerResponse;

    applySecurityHeaders(mockRes);

    expect(headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(headers.get('X-Frame-Options')).toBe('DENY');
    expect(headers.get('Content-Security-Policy')).toContain("default-src 'self'");
    expect(headers.get('Access-Control-Allow-Origin')).toBe('*');
  });

  it('enforces token bucket rate limits per client IP', () => {
    const limiter = new RateLimiter(5, 1, 10_000);
    const client = '192.168.1.100';

    // First 5 requests must be allowed
    for (let i = 0; i < 5; i++) {
      const check = limiter.check(client);
      expect(check.allowed).toBe(true);
    }

    // 6th request must be denied
    const denied = limiter.check(client);
    expect(denied.allowed).toBe(false);
    expect(denied.remaining).toBe(0);
    expect(denied.resetMs).toBeGreaterThan(0);

    // Different client must still be allowed
    const otherClient = limiter.check('192.168.1.101');
    expect(otherClient.allowed).toBe(true);

    // Resetting clears the limit
    limiter.reset(client);
    const retry = limiter.check(client);
    expect(retry.allowed).toBe(true);
  });
});
