import type { IncomingMessage, ServerResponse } from 'node:http';

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

export class RateLimiter {
  private readonly clients = new Map<string, RateLimitEntry>();
  private readonly maxTokens: number;
  private readonly refillRatePerSecond: number;
  private readonly windowMs: number;

  constructor(maxTokens = 60, refillRatePerSecond = 10, windowMs = 60_000) {
    this.maxTokens = maxTokens;
    this.refillRatePerSecond = refillRatePerSecond;
    this.windowMs = windowMs;

    // Periodic cleanup of stale entries every 5 minutes
    const timer = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.clients.entries()) {
        if (now - entry.lastRefill > this.windowMs) {
          this.clients.delete(key);
        }
      }
    }, 300_000);
    if (typeof timer === 'object' && timer !== null && 'unref' in timer) {
      (timer as unknown as { unref: () => void }).unref();
    }
  }

  public check(clientIp: string): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let entry = this.clients.get(clientIp);

    if (!entry) {
      entry = { tokens: this.maxTokens, lastRefill: now };
      this.clients.set(clientIp, entry);
    }

    // Refill tokens based on elapsed time
    const elapsedSeconds = (now - entry.lastRefill) / 1000;
    const tokensToAdd = elapsedSeconds * this.refillRatePerSecond;
    entry.tokens = Math.min(this.maxTokens, entry.tokens + tokensToAdd);
    entry.lastRefill = now;

    if (entry.tokens >= 1) {
      entry.tokens -= 1;
      return {
        allowed: true,
        remaining: Math.floor(entry.tokens),
        resetMs: Math.ceil(((this.maxTokens - entry.tokens) / this.refillRatePerSecond) * 1000),
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.ceil((1 / this.refillRatePerSecond) * 1000),
    };
  }

  public reset(clientIp?: string): void {
    if (clientIp) {
      this.clients.delete(clientIp);
    } else {
      this.clients.clear();
    }
  }
}

export const defaultRateLimiter = new RateLimiter(100, 20, 60_000);

export function applySecurityHeaders(res: ServerResponse): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none';"
  );
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Request-ID');
}

export function getClientIp(req: IncomingMessage): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (Array.isArray(forwarded) && forwarded[0]) {
    return forwarded[0].split(',')[0].trim();
  }
  return req.socket.remoteAddress || '127.0.0.1';
}
