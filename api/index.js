let PromptometerCore;
try {
  PromptometerCore = require('promptometer-core');
} catch (e) {
  PromptometerCore = require('../../promptometer/packages/core/promptometer-core.js');
}

// Security Configuration
const ALLOWED_ORIGINS = [
  'https://promptforge-beta-ten.vercel.app',
  'https://promptometer.is-a.dev',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:8000',
  'http://127.0.0.1:8000'
];

const MAX_PAYLOAD_BYTES = 100 * 1024; // 100 KB limit
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 30; // 30 req/min per IP

const ipRequestMap = new Map();

function isOriginAllowed(origin) {
  if (!origin) return true; // Allow same-origin / server-to-server / curl if desired, or restrict
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

  // Periodic cleanup of stale IPs
  if (ipRequestMap.size > 1000) {
    for (const [key, record] of ipRequestMap.entries()) {
      if (now > record.resetTime) ipRequestMap.delete(key);
    }
  }

  return clientRecord.count <= MAX_REQUESTS_PER_WINDOW;
}

module.exports = (req, res) => {
  const origin = req.headers.origin || '';
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // 1. Security Headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');

  // 2. Strict CORS Check
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

  // 3. Rate Limiting Check
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Límite de peticiones excedido (máximo 30 por minuto). Por favor intenta más tarde.' }));
  }

  // Route GET /api
  if (req.method === 'GET') {
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

  // Handle POST requests
  if (req.method === 'POST') {
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
        let payload = {};
        if (req.body && typeof req.body === 'object') {
          payload = req.body;
        } else if (body) {
          payload = JSON.parse(body);
        }

        const prompt = payload.prompt || '';

        if (!prompt.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "El parámetro 'prompt' es requerido." }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });

        const url = req.url || '';
        if (url.includes('improve')) {
          const analysis = PromptometerCore.analyze(prompt);
          const improved = PromptometerCore.improve(prompt, analysis);
          return res.end(JSON.stringify(improved));
        }

        if (url.includes('adversarial')) {
          const adversarial = PromptometerCore.runAdversarial(prompt);
          return res.end(JSON.stringify(adversarial));
        }

        // Default or /api/analyze
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

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
};
