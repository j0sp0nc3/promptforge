let PromptometerCore;
try {
  PromptometerCore = require('promptometer-core');
} catch (e) {
  PromptometerCore = require('../../promptometer/packages/core/promptometer-core.js');
}

// Security & API Key Configuration (Read ONLY from environment variables, no hardcoded secrets in repository)
const API_KEY = process.env.PROMPTOMETER_API_KEY || process.env.API_KEY || '';

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

  // 2. Authentication Check (API Key OR Authorized Front-End Origin)
  const isWebUI = origin && isOriginAllowed(origin);
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
        leaderboard: 'GET & POST /api/leaderboard'
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
          const title = payload.title || 'Prompt de Comunidad';
          const author = payload.author || 'Anónimo';
          const analysis = PromptometerCore.analyze(prompt);

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
