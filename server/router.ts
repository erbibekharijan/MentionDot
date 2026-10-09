import type { IncomingMessage, ServerResponse } from 'node:http';
import { randomUUID } from 'node:crypto';
import { analysisController } from './controllers/analysisController.ts';
import {
  applySecurityHeaders,
  defaultRateLimiter,
  getClientIp,
} from './middleware/security.ts';
import { handleHttpError, HttpError } from './middleware/errorHandler.ts';

export async function handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  const startTime = Date.now();

  // Apply baseline security headers
  applySecurityHeaders(res);
  res.setHeader('X-Request-ID', requestId);

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // Rate Limiter Guard
  const clientIp = getClientIp(req);
  const rateLimit = defaultRateLimiter.check(clientIp);
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));

  if (!rateLimit.allowed) {
    res.setHeader('Retry-After', String(Math.ceil(rateLimit.resetMs / 1000)));
    handleHttpError(
      res,
      new HttpError(429, 'RATE_LIMIT_EXCEEDED', 'Too many requests. Please slow down and try again.'),
      requestId
    );
    return;
  }

  const rawUrl = req.url || '/';
  const parsedUrl = new URL(rawUrl, 'http://localhost');
  const path = parsedUrl.pathname.replace(/\/$/, '') || '/';
  const method = req.method?.toUpperCase() || 'GET';

  try {
    // Route mapping supporting both /api/v1/* and /api/*
    if (method === 'GET' && (path === '/api/health' || path === '/api/v1/health')) {
      await analysisController.handleHealth(req, res, requestId);
      return;
    }

    if (method === 'POST' && (path === '/api/analyze' || path === '/api/v1/analyze')) {
      await analysisController.handleAnalyze(req, res, requestId);
      return;
    }

    if (method === 'POST' && (path === '/api/parse' || path === '/api/v1/parse')) {
      await analysisController.handleParse(req, res, requestId);
      return;
    }

    if (method === 'POST' && (path === '/api/export' || path === '/api/v1/export')) {
      await analysisController.handleExport(req, res, requestId);
      return;
    }

    if (method === 'GET' && (path === '/api/metrics' || path === '/api/v1/metrics')) {
      await analysisController.handleMetrics(req, res, requestId);
      return;
    }

    // 404 Route Not Found
    throw new HttpError(404, 'NOT_FOUND', `Cannot ${method} ${path}`);
  } catch (error) {
    handleHttpError(res, error, requestId);
  } finally {
    const elapsed = Date.now() - startTime;
    res.setHeader('X-Response-Time', `${elapsed}ms`);
  }
}
