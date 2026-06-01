// Minimal HTTP server: health check + brand assets + a splash/status page
// (spec Task 7; logo usage per spec 6.3). The WebSocket gateway attaches to
// this same server instance.

import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
// careerbot/backend/src/server -> careerbot/assets/logo
const LOGO_DIR = path.resolve(here, '../../../assets/logo');

// Preference order: the original raster export wins over the vector fallback.
// Drop careerbot.png into assets/logo/ and it is served automatically.
const LOGO_CANDIDATES = [
  { file: 'careerbot.png', type: 'image/png' },
  { file: 'careerbot.svg', type: 'image/svg+xml' },
];

async function readLogo() {
  for (const c of LOGO_CANDIDATES) {
    try {
      const body = await readFile(path.join(LOGO_DIR, c.file));
      return { body, type: c.type };
    } catch {
      // try next candidate
    }
  }
  return null;
}

function splashHtml(status) {
  return `<!doctype html>
<html lang="ja">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1"/>
<title>CareerBot</title>
<style>
  :root { color-scheme: light dark; }
  body { margin:0; min-height:100vh; display:flex; flex-direction:column;
    align-items:center; justify-content:center; gap:20px; font-family:system-ui, sans-serif;
    background:#0f1830; color:#eef2ff; }
  img { width:220px; height:auto; }
  h1 { margin:0; font-size:28px; letter-spacing:1px; }
  .tag { color:#9fb3d8; }
  .badges { display:flex; gap:10px; }
  .badge { background:#1b2a4e; padding:6px 12px; border-radius:999px; font-size:13px; }
</style>
</head>
<body>
  <img src="/logo" alt="CareerBot logo"/>
  <h1>CareerBot</h1>
  <div class="tag">就職相談向け音声AIアシスタント</div>
  <div class="badges">
    <span class="badge">provider: ${status.provider}</span>
    <span class="badge">storage: ${status.storage}</span>
    <span class="badge">ws: /ws</span>
  </div>
</body>
</html>`;
}

export function createHttpServer({ status }) {
  return http.createServer(async (req, res) => {
    if (req.url === '/healthz' || req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true, ...status() }));
      return;
    }

    // Serve the brand logo (prefers careerbot.png, falls back to careerbot.svg).
    if (req.url === '/logo' || req.url === '/logo.svg' || req.url === '/logo.png') {
      const logo = await readLogo();
      if (logo == null) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: false, error: 'logo not found' }));
        return;
      }
      res.writeHead(200, {
        'Content-Type': logo.type,
        // Revalidate each load so a swapped-in logo shows up immediately.
        'Cache-Control': 'no-cache',
      });
      res.end(logo.body);
      return;
    }

    if (req.url === '/' || req.url === '/index.html') {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(splashHtml(status()));
      return;
    }

    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: false, error: 'not found' }));
  });
}
