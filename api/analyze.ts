import type { IncomingMessage, ServerResponse } from 'node:http';
import { analysisService } from '../server/services/analysisService.ts';
import { readJsonBody } from '../server/controllers/analysisController.ts';
import { handleHttpError, sendJson } from '../server/middleware/errorHandler.ts';
import { applySecurityHeaders, defaultRateLimiter, getClientIp } from '../server/middleware/security.ts';
import { randomUUID } from 'node:crypto';
import type { AnalyzeRequestBody } from '../server/types.ts';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const clientIp = getClientIp(req);
  const rateLimit = defaultRateLimiter.check(clientIp);
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  if (!rateLimit.allowed) {
    res.statusCode = 429;
    res.setHeader('Retry-After', String(Math.ceil(rateLimit.resetMs / 1000)));
    res.end(JSON.stringify({ success: false, error: { code: 'RATE_LIMIT_EXCEEDED', message: 'Too many requests.' } }));
    return;
  }

  try {
    const body = await readJsonBody<AnalyzeRequestBody>(req);
    const { result, cached, durationMs } = await analysisService.analyze(body);

    sendJson(res, 200, {
      success: true,
      data: result,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        durationMs,
        cached,
      },
    });
  } catch (error) {
    handleHttpError(res, error, requestId);
  }
}
