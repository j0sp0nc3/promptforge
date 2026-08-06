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
  PromptometerCore = require('../promptometer/packages/core/  // local dev fallback (clone promptometer repo alongside)promptometer-core.js');
}

const PORT = process.env.PORT || 3000;

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
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Route GET /api (API Status)
  if (req.method === 'GET' && (req.url === '/api' || req.url === '/api/')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      service: 'Promptometer Core API',
      version: PromptometerCore.version,
      status: 'online',
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
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
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
    return;
  }

  // Serve static files for GET requests
  if (req.method === 'GET') {
    let safeUrl = req.url.split('?')[0];
    if (safeUrl === '/') safeUrl = '/index.html';

    const filePath = path.join(__dirname, safeUrl);

    if (filePath.startsWith(__dirname) && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': mimeType });
      return fs.createReadStream(filePath).pipe(res);
    }
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

server.listen(PORT, () => {
  console.log(`\n🚀 Promptometer Server listo en: http://localhost:${PORT}`);
  console.log(`   Web App UI: http://localhost:${PORT}/`);
  console.log(`   POST API  : http://localhost:${PORT}/api/analyze\n`);
});
