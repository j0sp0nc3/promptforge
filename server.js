/**
 * PromptQuill — Universal REST API Microservice (Zero External Dependencies)
 * Run: node server.js
 * Works with ANY programming language (Python, C#, Java, Go, Rust, PHP, Ruby, etc.)
 */

const http = require('http');
const PromptQuillCore = require('./lib/promptquill-core.js');

const PORT = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Route GET /
  if (req.method === 'GET' && req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      service: 'PromptQuill Core API',
      version: PromptQuillCore.version,
      status: 'online',
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

        if (req.url === '/api/analyze') {
          const analysis = PromptQuillCore.analyze(prompt);
          return res.end(JSON.stringify(analysis));
        }

        if (req.url === '/api/improve') {
          const analysis = PromptQuillCore.analyze(prompt);
          const improved = PromptQuillCore.improve(prompt, analysis);
          return res.end(JSON.stringify(improved));
        }

        if (req.url === '/api/adversarial') {
          const adversarial = PromptQuillCore.runAdversarial(prompt);
          return res.end(JSON.stringify(adversarial));
        }

        res.writeHead(404, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Endpoint no encontrado' }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        return res.end(JSON.stringify({ error: 'Error procesando solicitud JSON: ' + err.message }));
      }
    });
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
});

server.listen(PORT, () => {
  console.log(`\n🚀 PromptQuill REST API Microservice listo en: http://localhost:${PORT}`);
  console.log(`   POST http://localhost:${PORT}/api/analyze`);
  console.log(`   POST http://localhost:${PORT}/api/improve\n`);
});
