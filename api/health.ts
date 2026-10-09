import type { IncomingMessage, ServerResponse } from 'node:http';
import { analysisService } from '../server/services/analysisService.ts';
import { sendJson } from '../server/middleware/errorHandler.ts';
import { applySecurityHeaders } from '../server/middleware/security.ts';
import { randomUUID } from 'node:crypto';

export default async function handler(req: IncomingMessage, res: ServerResponse): Promise<void> {
  const requestId = (req.headers['x-request-id'] as string) || randomUUID();
  applySecurityHeaders(res);

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'GET') {
    res.statusCode = 405;
    res.end('Method Not Allowed');
    return;
  }

  const health = analysisService.getHealth();
  sendJson(res, 200, {
    success: true,
    data: health,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
  });
}
