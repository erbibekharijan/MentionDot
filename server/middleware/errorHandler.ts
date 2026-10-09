import type { ServerResponse } from 'node:http';
import type { ApiResponse } from '../types.ts';

export class HttpError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(statusCode: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'HttpError';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

export function sendJson(
  res: ServerResponse,
  statusCode: number,
  payload: ApiResponse,
  headers: Record<string, string> = {}
): void {
  for (const [key, value] of Object.entries(headers)) {
    res.setHeader(key, value);
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.statusCode = statusCode;
  res.end(JSON.stringify(payload, null, 2));
}

export function handleHttpError(
  res: ServerResponse,
  error: unknown,
  requestId: string
): void {
  if (error instanceof HttpError) {
    sendJson(
      res,
      error.statusCode,
      {
        success: false,
        error: {
          code: error.code,
          message: error.message,
          details: error.details,
        },
        meta: {
          requestId,
          timestamp: new Date().toISOString(),
        },
      }
    );
    return;
  }

  const errMessage = error instanceof Error ? error.message : 'Internal Server Error';
  sendJson(
    res,
    500,
    {
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: errMessage,
      },
      meta: {
        requestId,
        timestamp: new Date().toISOString(),
      },
    }
  );
}
