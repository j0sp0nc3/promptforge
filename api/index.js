let PromptometerCore;
try {
  PromptometerCore = require('promptometer-core');
} catch (e) {
  PromptometerCore = require('../../promptometer/packages/core/promptometer-core.js');
}

// Content moderation for the public leaderboard (profanity, injection, spam).
const Moderation = require('./moderation');

// ── Upstash Redis client (optional, graceful fallback to in-memory) ──
// If UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN are set in the
// Vercel environment, the leaderboard persists globally across users and
// cold starts. Without them, it falls back to the in-memory array below
// (same behavior as before — local per-instance, NOT shared between users).
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.VERCEL_KV_REST_API_URL || process.env.STORAGE_KV_REST_API_URL || process.env.STORAGE_REST_API_URL || process.env.STORAGE_URL || '';
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.VERCEL_KV_REST_API_TOKEN || process.env.STORAGE_KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN || process.env.STORAGE_TOKEN || '';
const HAS_UPSTASH = !!(UPSTASH_URL && UPSTASH_TOKEN);

// Minimal Upstash REST client (zero dependencies). Each call is a single
// HTTPS fetch. Format: https://<url>/<command>/<arg1>/<arg2>/...
async function upstash(command, ...args) {
  const url = UPSTASH_URL.replace(/\/$/, '') + '/' + command + '/' + args.map(a => encodeURIComponent(String(a))).join('/');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` } });
  if (!res.ok) throw new Error(`Upstash ${command} HTTP ${res.status}`);
  const body = await res.json();
  return body.result;
}

// redis shim: provides {get, set} to Moderation + leaderboard handlers.
// When Upstash is configured, these hit Redis; otherwise they no-op so
// the moderation anti-spam layer degrades gracefully (rate limit + dedup
// are skipped, profanity/injection filters still run).
const redis = HAS_UPSTASH ? {
  async get(key) { try { return await upstash('GET', key); } catch (e) { return null; } },
  async set(key, value, ttlSeconds) {
    try {
      if (ttlSeconds) await upstash('SETEX', key, ttlSeconds, value);
      else await upstash('SET', key, value);
    } catch (e) { /* non-fatal */ }
  },
  // Sorted set ops for leaderboard ranking
  async zadd(key, score, member) { try { return await upstash('ZADD', key, score, member); } catch (e) { return null; } },
  async zrevrange(key, start, stop) { try { return await upstash('ZRANGE', key, start, stop, 'REV'); } catch (e) { return []; } },
  async hset(key, ...fields) { try { return await upstash('HSET', key, ...fields); } catch (e) { return null; } },
  async hgetall(key) { try { return await upstash('HGETALL', key); } catch (e) { return null; } },
} : null;

// Security & API Key Configuration (Read ONLY from environment variables, no hardcoded secrets in repository)
const API_KEY = process.env.PROMPTOMETER_API_KEY || process.env.API_KEY || '';

const ALLOWED_ORIGINS = [
  'https://promptforge-beta-ten.vercel.app',
  'https://promptometer.vercel.app',
  'https://promptometer.tech',
  'https://www.promptometer.tech',
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

  // Periodic cleanup
  if (ipRequestMap.size > 1000) {
    for (const [key, record] of ipRequestMap.entries()) {
      if (now > record.resetTime) ipRequestMap.delete(key);
    }
  }

  return clientRecord.count <= MAX_REQUESTS_PER_WINDOW;
}

function validateApiKey(req) {
  if (!API_KEY) return false; // Require explicit environment variable configuration
  const apiKeyHeader = req.headers['x-api-key'];
  const authHeader = req.headers['authorization'];
  
  let bearerToken = '';
  if (authHeader && authHeader.startsWith('Bearer ')) {
    bearerToken = authHeader.substring(7).trim();
  }

  const providedKey = apiKeyHeader || bearerToken;
  return Boolean(providedKey && providedKey === API_KEY);
}

// ── Leaderboard entry (de)serialization for Redis hashes ─────
// Redis HSET stores flat string fields; we serialize complex fields as JSON.

// Strip HTML tags and limit length from user-supplied text fields (title,
// author, name, handle) to prevent stored XSS. The client also escapes via
// escapeHtml, but defense-in-depth: never trust input, sanitize at storage.
function _sanitizeText(raw, maxLen) {
  if (!raw) return '';
  return String(raw)
    .replace(/<[^>]*>/g, '')        // strip all HTML tags
    .replace(/"/g, '&quot;')        // neutralize attribute breakout
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, maxLen || 200);
}
function _serializeEntry(entry) {
  return [
    'id', String(entry.id),
    'title', JSON.stringify(entry.title || {}),
    'author', String(entry.author || 'Anónimo'),
    'overallScore', String(entry.overallScore || 0),
    'grade', String(entry.grade || ''),
    'complexity', String(entry.complexity || 'intermediate'),
    'category', String(entry.category || 'general'),
    'date', String(entry.date || ''),
    'prompt', String(entry.prompt || ''),
  ];
}

function _deserializeEntry(data) {
  if (!data || typeof data !== 'object') return null;
  let title = {};
  try { title = JSON.parse(data.title || '{}'); } catch (e) {}
  return {
    id: data.id,
    title,
    author: data.author || 'Anónimo',
    overallScore: Number(data.overallScore) || 0,
    grade: data.grade || '',
    complexity: data.complexity || 'intermediate',
    category: data.category || 'general',
    date: data.date || '',
    prompt: data.prompt || '',
  };
}

// Global Serverless Top 10 Leaderboard (No login required)
let globalLeaderboard = [
  {
    id: 'global-1',
    title: { es: 'Extractor de Datos Estructurados JSON con Esquema Estricto', en: 'Strict Schema JSON Structured Data Extractor' },
    author: 'Jose Ponce (@j0sp0nc3)',
    overallScore: 99,
    grade: 'A+',
    complexity: 'advanced',
    category: 'extracción',
    date: '2026-08-01',
    prompt: `<rol>\nEres un sistema automatizado de extracción de datos estructurados especializado en procesar textos corporativos e informes de inteligencia de negocios.\n</rol>\n\n<contexto>\nSe te proporcionará un texto no estructurado que contiene información sobre empresas, fusiones, adquisiciones, montos financieros y fechas clave.\n</contexto>\n\n<tarea>\nAnaliza el texto de entrada, identifica todas las entidades comerciales mencionadas y extrae la estructura de datos completa siguiendo estrictamente el esquema JSON indicado.\n</tarea>\n\n<formato_salida>\nResponde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:\n{\n  "transaccion": {\n    "empresa_compradora": string | null,\n    "empresa_adquirida": string | null,\n    "monto_usd": number | null,\n    "fecha_cierre": string | null,\n    "sector": string\n  },\n  "confianza_extraccion": number,\n  "justificacion": string\n}\n</formato_salida>\n\n<restricciones>\n- No incluyas explicaciones, saludos ni marcas de formato fuera del bloque JSON.\n- Si falta algún dato, asigna valor null explícito en la propiedad correspondiente.\n- Cita únicamente datos presentes en el texto original; no asumas montos ni fechas no especificadas.\n</restricciones>\n\n<ejemplos>\nEntrada: "TechCorp adquirió SoftInc por 450 millones de dólares el 15 de marzo de 2025."\nSalida:\n{\n  "transaccion": {\n    "empresa_compradora": "TechCorp",\n    "empresa_adquirida": "SoftInc",\n    "monto_usd": 450000000,\n    "fecha_cierre": "2025-03-15",\n    "sector": "Tecnología"\n  },\n  "confianza_extraccion": 0.98,\n  "justificacion": "Mención directa de compra, empresas y fecha en el texto."\n}\n</ejemplos>\n\n<manejo_errores>\nSi el texto de entrada no contiene ninguna transacción comercial válida, responde exactamente con:\n{ "transaccion": null, "confianza_extraccion": 0.0, "justificacion": "No se detectaron transacciones en el texto de entrada." }\n</manejo_errores>`
  },
  {
    id: 'global-2',
    title: { es: 'Sistema Agente ReAct para Diagnóstico Financiero', en: 'ReAct Agent System for Financial Diagnostics' },
    author: 'Promptometer Lab',
    overallScore: 98,
    grade: 'A+',
    complexity: 'advanced',
    category: 'agentes',
    date: '2026-08-02',
    prompt: `<rol>\nEres un agente consultor financiero senior especializado en evaluar la salud crediticia y liquidez de pequeñas y medianas empresas.\n</rol>\n\n<contexto>\nEl usuario necesita un informe de viabilidad financiera basado en estados de resultados y flujos de caja. Tienes acceso a herramientas de cálculo y consulta de datos.\n</contexto>\n\n<tarea>\nAnaliza los datos financieros proporcionados utilizando la metodología ReAct (Thought, Action, Action Input, Observation) para desglosar el razonamiento paso a paso antes de emitir tu dictamen final.\n</tarea>\n\n<formato_salida>\nSigue el formato de ciclo iterativo:\nThought: [Razonamiento sobre el paso actual]\nAction: [buscar_ratio | calcular_flujo | verificar_deuda | finalizar]\nAction Input: [Parámetros de la herramienta]\nObservation: [Resultado devuelto]\n...\nFinal Answer: [Dictamen final en formato Markdown estructurado con recomendaciones numeradas]\n</formato_salida>\n\n<restricciones>\n- Mantiene el límite de apalancamiento máximo en 3.0x de deuda/EBITDA.\n- Si la información contable está incompleta, solicita los documentos faltantes en el paso inicial.\n- No emitas una recomendación favorable sin verificar primero la liquidez corriente (ratio corriente >= 1.5).\n</restricciones>\n\n<ejemplos>\nThought: Necesito calcular el ratio corriente para verificar la liquidez inmediata.\nAction: calcular_flujo\nAction Input: {"activo_corriente": 150000, "pasivo_corriente": 80000}\nObservation: Ratio corriente = 1.875 (Aceptable)\n</ejemplos>\n\n<manejo_errores>\nSi detectas inconsistencias graves en los libros contables, detén el ciclo ReAct y marca la auditoría como "RECHAZADA POR INCONSISTENCIA".\n</manejo_errores>`
  }
];

module.exports = (req, res) => {
  const origin = req.headers.origin || '';
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // 1. Security Headers
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

  // 2. Authentication Check (API Key OR Authorized Front-End Origin / Same-Origin / Public Leaderboard)
  const referer = req.headers.referer || '';
  const host = req.headers.host || '';
  const url = req.url || '';

  const isLeaderboard = url.includes('leaderboard');
  const isSameOriginHost = host && (host.includes('promptforge-beta-ten.vercel.app') || host.includes('promptometer.is-a.dev') || host.includes('promptometer.tech') || host.includes('localhost') || host.includes('127.0.0.1'));
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

  // 3. Rate Limiting Check
  if (!checkRateLimit(clientIp)) {
    res.writeHead(429, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Límite de peticiones excedido (máximo 30 por minuto). Por favor intenta más tarde.' }));
  }

  // Route GET /api & /api/leaderboard
  if (req.method === 'GET') {
    const url = req.url || '';
    if (url.includes('leaderboard')) {
      // If Upstash is configured, fetch from Redis (global, persistent).
      // Otherwise fall back to the in-memory array.
      if (HAS_UPSTASH) {
        (async () => {
          try {
            const ids = await redis.zrevrange('lb:global', 0, 9);
            const entries = [];
            for (const id of (ids || [])) {
              const data = await redis.hgetall('lb:entry:' + id);
              if (data) entries.push(_deserializeEntry(data));
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(entries.length ? entries : globalLeaderboard));
          } catch (e) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(globalLeaderboard));
          }
        })();
        return;
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify(globalLeaderboard));
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      service: 'Promptometer Core API (Secured & Authenticated)',
      version: PromptometerCore.version,
      status: 'online',
      security: {
        authentication: 'API Key Required (x-api-key or Authorization: Bearer)',
        cors: 'Restricted to Official Web UI',
        rateLimit: '30 req/min',
        maxPayload: '100 KB'
      },
      endpoints: {
        analyze: 'POST /api/analyze',
        improve: 'POST /api/improve',
        adversarial: 'POST /api/adversarial',
        leaderboard: 'GET & POST /api/leaderboard',
        suggestCreator: 'POST /api/suggest-creator'
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
        const url = req.url || '';

        if (url.includes('leaderboard')) {
          if (!prompt.trim()) {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            return res.end(JSON.stringify({ error: "El parámetro 'prompt' es requerido." }));
          }
          // Defer to async handler (moderation + optional Upstash persistence)
          _handleLeaderboardSubmit(req, res, payload, prompt);
          return;
        }

        // ── POST /api/suggest-creator ──────────────────────────
        if (url.includes('suggest-creator')) {
          _handleSuggestCreator(req, res, payload);
          return;
        }

        if (!prompt.trim()) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          return res.end(JSON.stringify({ error: "El parámetro 'prompt' es requerido." }));
        }

        res.writeHead(200, { 'Content-Type': 'application/json' });

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

async function _handleLeaderboardSubmit(req, res, payload, prompt) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';
  // Sanitize user-supplied fields (defense-in-depth against stored XSS)
  const title = _sanitizeText(payload.title, 200) || 'Prompt de Comunidad';
  const author = _sanitizeText(payload.author, 100) || 'Anónimo';
  const analysis = PromptometerCore.analyze(prompt);

  // 1. Run Content Moderation (Profanity, Injection, Malicious Code, Anti-spam)
  const modResult = await Moderation.check({
    text: prompt,
    score: analysis.overallScore,
    ip: clientIp,
    redis
  });

  if (!modResult.allowed) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: modResult.detail || 'El prompt fue rechazado por la moderación de contenido.',
      reason: modResult.reason
    }));
  }

  const newEntry = {
    id: 'global-' + Date.now(),
    title: { es: title, en: title },
    author: author,
    overallScore: analysis.overallScore,
    grade: analysis.grade || 'A',
    complexity: analysis.complexity || 'intermediate',
    category: analysis.promptType || 'general',
    date: new Date().toISOString().split('T')[0],
    prompt: prompt,
  };

  // 2. Persistent Storage (Upstash Redis if configured, fallback to in-memory)
  if (HAS_UPSTASH) {
    try {
      await redis.hset('lb:entry:' + newEntry.id, ..._serializeEntry(newEntry));
      await redis.zadd('lb:global', newEntry.overallScore, newEntry.id);
      await Moderation.markSubmitted({ text: prompt, ip: clientIp, redis });

      const ids = await redis.zrevrange('lb:global', 0, 9);
      const entries = [];
      for (const id of (ids || [])) {
        const data = await redis.hgetall('lb:entry:' + id);
        if (data) entries.push(_deserializeEntry(data));
      }
      const rank = entries.findIndex(x => x.id === newEntry.id) + 1;
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({
        success: true,
        isRanked: rank > 0,
        rank,
        entry: newEntry,
        top10: entries
      }));
    } catch (e) {
      // Fallback to in-memory if Redis error occurs
    }
  }

  // Fallback in-memory
  globalLeaderboard = [...globalLeaderboard, newEntry]
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, 10);

  const rank = globalLeaderboard.findIndex(x => x.id === newEntry.id) + 1;
  const isRanked = rank > 0;

  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({
    success: true,
    isRanked,
    rank,
    entry: newEntry,
    top10: globalLeaderboard
  }));
}

// ────────────────────────────────────────────────────────────────────────────
// SUGGEST CREATOR HANDLER
// Stores community creator suggestions in Upstash Redis.
// Each IP is limited to 5 suggestions per 24 h (Redis TTL key).
// Suggestions are stored as hashes under suggest:entry:{id}
// and the IDs are pushed to the list suggest:list (capped at 500).
// Falls back to a local in-memory log when Upstash is absent.
// ────────────────────────────────────────────────────────────────────────────

const SUGGEST_RATE_LIMIT   = 5;    // max suggestions per IP per day
const SUGGEST_MAX_STORED   = 500;  // cap total suggestions in Redis list
const _inMemorySuggestions = [];   // fallback when no Upstash

async function _handleSuggestCreator(req, res, payload) {
  const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // ── Validate required fields ────────────────────────────────────────
  const name   = _sanitizeText(payload.name,   100);
  const handle = _sanitizeText(payload.handle, 200);
  const reason = _sanitizeText(payload.reason, 500);

  if (!name || !handle) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'El nombre y el handle son obligatorios.' }));
  }

  // ── Basic content moderation (profanity / injection only) ───────────
  const modResult = await Moderation.check({
    text: `${name} ${handle} ${reason}`,
    score: 100,  // dummy — we only care about profanity/injection
    ip: clientIp,
    redis: null, // skip Redis anti-spam; we have our own rate limit below
  });
  if (!modResult.allowed) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      error: modResult.detail || 'La sugerencia fue rechazada por la moderación de contenido.',
      reason: modResult.reason,
    }));
  }

  const id    = 'sug-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
  const entry = { id, name, handle, reason, ip: clientIp, date: new Date().toISOString() };

  // ── Upstash path ────────────────────────────────────────────────────
  if (HAS_UPSTASH) {
    try {
      // Per-IP daily rate limit (key expires after 24 h)
      const rateLimitKey   = `suggest:rate:${clientIp}`;
      const currentCount   = parseInt(await upstash('GET', rateLimitKey) || '0', 10);
      if (currentCount >= SUGGEST_RATE_LIMIT) {
        res.writeHead(429, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({
          error: 'Has alcanzado el límite de 5 sugerencias por día. Intenta mañana.',
        }));
      }

      // Increment or initialise counter with TTL
      if (currentCount === 0) {
        await upstash('SETEX', rateLimitKey, 86400, '1');
      } else {
        await upstash('INCR', rateLimitKey);
      }

      // Store suggestion as a Redis hash
      await upstash('HSET', 'suggest:entry:' + id,
        'id',     id,
        'name',   name,
        'handle', handle,
        'reason', reason,
        'date',   entry.date,
      );

      // Push ID to list and cap at SUGGEST_MAX_STORED
      await upstash('LPUSH', 'suggest:list', id);
      await upstash('LTRIM', 'suggest:list', 0, SUGGEST_MAX_STORED - 1);

      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ success: true, id }));
    } catch (e) {
      // Fall through to in-memory fallback on Redis error
    }
  }

  // ── In-memory fallback (no Upstash / Redis error) ───────────────────
  _inMemorySuggestions.unshift(entry);
  if (_inMemorySuggestions.length > SUGGEST_MAX_STORED) {
    _inMemorySuggestions.length = SUGGEST_MAX_STORED;
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  return res.end(JSON.stringify({ success: true, id, stored: 'memory' }));
}
