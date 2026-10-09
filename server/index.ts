import { createServer } from 'node:http';
import { handleRequest } from './router.ts';

const PORT = Number(process.env.PORT) || 3001;
const HOST = process.env.HOST || '0.0.0.0';

export const server = createServer(async (req, res) => {
  try {
    await handleRequest(req, res);
  } catch (err) {
    console.error('Unhandled server exception:', err);
    if (!res.headersSent) {
      res.statusCode = 500;
      res.end('Internal Server Error');
    }
  }
});

// Configure server timeouts
server.keepAliveTimeout = 65000;
server.headersTimeout = 66000;

if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, HOST, () => {
    console.log(`[MISSED. Server] 🚀 Server running at http://${HOST}:${PORT}`);
    console.log(`[MISSED. Server] 📡 Endpoints active:`);
    console.log(`  - GET  /api/v1/health`);
    console.log(`  - POST /api/v1/analyze`);
    console.log(`  - POST /api/v1/parse`);
    console.log(`  - POST /api/v1/export`);
    console.log(`  - GET  /api/v1/metrics`);
  });

  const shutdown = (signal: string) => {
    console.log(`[MISSED. Server] Received ${signal}. Initiating graceful shutdown...`);
    server.close(() => {
      console.log('[MISSED. Server] HTTP connections closed. Process terminating.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[MISSED. Server] Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}
