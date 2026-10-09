import type { IncomingMessage, ServerResponse } from 'node:http';
import { analysisService } from '../services/analysisService.ts';
import { HttpError, sendJson } from '../middleware/errorHandler.ts';
import type { ApiResponse } from '../types.ts';

/**
 * Helper to safely parse incoming JSON stream with size protection
 */
export async function readJsonBody<T = unknown>(req: IncomingMessage, maxBytes = 2_000_000): Promise<T> {
  return new Promise((resolve, reject) => {
    let raw = '';
    let bytesRead = 0;

    req.on('data', (chunk: Buffer) => {
      bytesRead += chunk.length;
      if (bytesRead > maxBytes) {
        req.destroy();
        reject(new HttpError(413, 'PAYLOAD_TOO_LARGE', `Request body exceeds size limit of ${maxBytes} bytes.`));
        return;
      }
      raw += chunk.toString('utf8');
    });

    req.on('end', () => {
      if (!raw.trim()) {
        resolve({} as T);
        return;
      }
      try {
        const parsed = JSON.parse(raw);
        resolve(parsed);
      } catch {
        reject(new HttpError(400, 'MALFORMED_JSON', 'Request payload could not be parsed as valid JSON.'));
      }
    });

    req.on('error', (err) => {
      reject(new HttpError(500, 'STREAM_READ_ERROR', err.message));
    });
  });
}

export class AnalysisController {
  public async handleHealth(_req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const health = analysisService.getHealth();
    const response: ApiResponse = {
      success: true,
      data: health,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
    sendJson(res, 200, response);
  }

  public async handleAnalyze(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const body = await readJsonBody(req);
    const { result, cached, durationMs } = await analysisService.analyze(body as Parameters<typeof analysisService.analyze>[0]);

    const response: ApiResponse = {
      success: true,
      data: result,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
        durationMs,
        cached,
      },
    };
    sendJson(res, 200, response);
  }

  public async handleParse(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const body = await readJsonBody(req);
    const data = analysisService.parse(body as Parameters<typeof analysisService.parse>[0]);

    const response: ApiResponse = {
      success: true,
      data,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
    sendJson(res, 200, response);
  }

  public async handleExport(req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const body = await readJsonBody(req);
    const data = analysisService.export(body as Parameters<typeof analysisService.export>[0]);

    const response: ApiResponse = {
      success: true,
      data,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
    sendJson(res, 200, response);
  }

  public async handleMetrics(_req: IncomingMessage, res: ServerResponse, requestId: string): Promise<void> {
    const data = analysisService.getMetrics();
    const response: ApiResponse = {
      success: true,
      data,
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    };
    sendJson(res, 200, response);
  }
}

export const analysisController = new AnalysisController();
