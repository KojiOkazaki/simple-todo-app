// Minimal HTTP server providing health check + readiness (spec Task 7).
// The WebSocket gateway attaches to this same server instance.

import http from 'node:http';

export function createHttpServer({ status }) {
  return http.createServer((req, res) => {
    if (req.url === '/healthz' || req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...status() }));
      return;
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'not found' }));
  });
}
