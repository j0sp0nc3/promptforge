let PromptometerCore;
try {
  PromptometerCore = require('promptometer-core');
} catch (e) {
  PromptometerCore = require('../../promptometer/packages/core/promptometer-core.js');
}

module.exports = (req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Route GET /api
  if (req.method === 'GET') {
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

  // Handle POST requests
  if (req.method === 'POST') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', () => {
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
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
};
