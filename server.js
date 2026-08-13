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

// Load .env file automatically if present
if (fs.existsSync(path.join(__dirname, '.env'))) {
  const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...vals] = trimmed.split('=');
      const val = vals.join('=').trim().replace(/^["']|["']$/g, '');
      if (key.trim()) process.env[key.trim()] = val;
    }
  });
}

const API_KEY = process.env.PROMPTOMETER_API_KEY || process.env.API_KEY || '';

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
  if (!origin) return false;
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

function validateApiKey(req) {
  if (!API_KEY) return false; // Requires explicit environment variable configuration
  const apiKeyHeader = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  
  let bearerToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }

  const providedKey = apiKeyHeader || bearerToken;
  return Boolean(providedKey && providedKey === API_KEY);
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
  if (origin && isOriginAllowed(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', 'https://promptforge-beta-ten.vercel.app');
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-api-key, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Handle API Requests Authentication & Protection
  if (req.url.startsWith('/api')) {
    const referer = req.headers.referer || '';
    const host = req.headers.host || '';
    const url = req.url || '';

    const isLeaderboard = url.includes('leaderboard');
    const isSameOriginHost = host && (host.includes('promptforge-beta-ten.vercel.app') || host.includes('promptometer.is-a.dev') || host.includes('localhost') || host.includes('127.0.0.1'));
    const isAllowedReferer = referer && ALLOWED_ORIGINS.some(allowed => referer.startsWith(allowed));
    const isAllowedOrigin = origin && isOriginAllowed(origin);

    const isWebUI = isAllowedOrigin || isAllowedReferer || isSameOriginHost || isLeaderboard;
    const hasValidApiKey = validateApiKey(req);

    if (!isWebUI && !hasValidApiKey) {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        error: 'Autenticación requerida. Proporciona el header x-api-key o Authorization: Bearer <key>.',
        documentation: 'https://github.com/j0sp0nc3/promptforge'
      }));
    }

    if (!checkRateLimit(clientIp)) {
      res.writeHead(429, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Límite de peticiones excedido (máximo 30 por minuto). Por favor intenta más tarde.' }));
    }
  }

  // Delegate API endpoints to api/index.js for complete feature parity (including /api/analyze-intent)
  if (req.url.startsWith('/api')) {
    const apiHandler = require('./api/index.js');
    return apiHandler(req, res);
  }

  // Serve static files for GET requests
  if (req.method === 'GET') {
    let safeUrl = req.url.split('?')[0];
    if (safeUrl === '/') safeUrl = '/index.html';
    if (safeUrl === '/favicon.ico') safeUrl = '/favicon.svg';

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
    console.log(`🔒 Security active: API Key Authentication + CORS + Rate Limit 30 req/min`);
  });
}

module.exports = server;
