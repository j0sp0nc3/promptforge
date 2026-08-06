/**
 * Promptometer — Universal REST API Microservice & Static Web Server
 * Run: node server.js
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

let PromptometerCore;
try {
  PromptometerCore = require('promptometer-core');
} catch (e) {
  PromptometerCore = require('../promptometer/packages/core/promptometer-core.js');
}

const PORT = process.env.PORT || 3000;

const ALLOWED_ORIGINS = [
  'https://promptforge-beta-ten.vercel.app',
  'https://promptometer.is-a.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
];

const MAX_PAYLOAD_BYTES = 100 * 1024; // 100 KB
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 30;

const ipRequestMap = new Map();

function isOriginAllowed(origin) {
  if (!origin) return true;
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

function checkRateLimit(ip) {
  const now = Date.now();
  const clientRecord = ipRequestMap.get(ip) || { count: 0, resetTime: now + RATE_LIMIT_WINDOW_MS };

  if (now > clientRecord.resetTime) {
    clientRecord.count = 1;
    clientRecord.resetTime = now + RATE_LIMIT_WINDOW_MS;
  } else {
    clientRecord.count += 1;
  }

  ipRequestMap.set(ip, clientRecord);
  return clientRecord.count <= MAX_REQUESTS_PER_WINDOW;
}

const MIME_TYPES = {
  '.html': 'text/html; charset=UTF-8',
  '.css': 'text/css; charset=UTF-8',
  '.js': 'text/javascript; charset=UTF-8',
  '.json': 'application/json; charset=UTF-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  const origin = req.headers.origin || '';
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // CORS Headers
  if (origin && !isOriginAllowed(origin)) {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Acceso denegado: Origen no permitido por la política CORS del dominio.' }));
  }

  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://promptforge-beta-ten.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Rate Limit check for API calls
  if (req.url.startsWith('/api') && !checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Límite de peticiones excedido (máximo 30 por minuto). Por favor intenta más tarde.' }));
  }

  // Route GET /api (API Status)
  if (req.method === 'GET' && (req.url === '/api' || req.url === '/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      service: 'Promptometer Core API (Secured)',
      version: PromptometerCore.version,
      status: 'online',
      security: {
        cors: 'Restricted',
        rateLimit: '30 req/min',
        maxPayload: '100 KB'
      },
      endpoints: {
        analyze: 'POST /api/analyze',
        improve: 'POST /api/improve',
        adversarial: 'POST /api/adversarial'
      }
    }));
  }

  // Handle POST API requests
  if (req.method === 'POST' && req.url.startsWith('/api')) {
    let body = '';
    let bodySize = 0;
    let overflow = false;

    req.on('data', chunk => {
      bodySize += chunk.length;
      if (bodySize > MAX_PAYLOAD_BYTES) {
        overflow = true;
        req.destroy();
      } else {
        body += chunk.toString();
      }
    });

    req.on('end', () => {
      if (overflow) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'El tamaño de la solicitud excede el límite máximo permitido de 100KB.' }));
      }

      try {
        const payload = JSON.parse(body || '{}');
        const prompt = payload.prompt || '';

        if (!prompt.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "El parámetro 'prompt' es requerido." }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });

        if (req.url === '/api/improve') {
          const analysis = PromptometerCore.analyze(prompt);
          const improved = PromptometerCore.improve(prompt, analysis);
          return res.end(JSON.stringify(improved));
        }

        if (req.url === '/api/adversarial') {
          const adversarial = PromptometerCore.runAdversarial(prompt);
          return res.end(JSON.stringify(adversarial));
        }

        // /api/analyze or fallback
        const analysis = PromptometerCore.analyze(prompt);
        return res.end(JSON.stringify(analysis));

      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Error procesando solicitud JSON: ' + err.message }));
      }
    });

    req.on('error', () => {
      if (overflow) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'El tamaño de la solicitud excede el límite máximo permitido de 100KB.' }));
      }
    });

    return;
  }

  // Serve static files for GET requests
  if (req.method === 'GET') {
    let safeUrl = req.url.split('?')[0];
    if (safeUrl === '/') safeUrl = '/index.html';

    const filePath = path.join(__dirname, safeUrl);

    // Prevent Directory Traversal Attack
    if (!filePath.startsWith(__dirname)) {
      res.writeHead(403, { 'Content-Type': 'text/plain' });
      return res.end('Access Denied');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (err, content) => {
      if (err) {
        if (err.code === 'ENOENT') {
          res.writeHead(404, { 'Content-Type': 'text/html' });
          res.end('<h1>404 Not Found</h1>');
        } else {
          res.writeHead(500);
          res.end(`Server Error: ${err.code}`);
        }
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content, 'utf-8');
      }
    });
    return;
  }

  res.writeHead(405, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Método HTTP no permitido' }));
});

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`🚀 Promptometer Server running on http://localhost:${PORT}`);
    console.log(`🔒 Security active: CORS restricted, Max 100KB Payload, Rate limit 30 req/min`);
  });
}

module.exports = server;
