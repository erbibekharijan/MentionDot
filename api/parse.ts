import type { IncomingMessage, ServerResponse } from 'node:http';
import { analysisService } from '../server/services/analysisService.ts';
import { readJsonBody } from '../server/controllers/analysisController.ts';
import { handleHttpError, sendJson } from '../server/middleware/errorHandler.ts';
import { applySecurityHeaders } from '../server/middleware/security.ts';
import { randomUUID } from 'node:crypto';
import type { ParseRequestBody } from '../server/types.ts';

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

  try {
    const body = await readJsonBody<ParseRequestBody>(req);
    const data = analysisService.parse(body);

    sendJson(res, 200, {
      success: true,
      data,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    handleHttpError(res, error, requestId);
  }
}
