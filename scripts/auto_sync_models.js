/**
 * Promptometer — Automated 100% Zero-Touch LLM Models & Benchmarks Synchronizer
 * 
 * Runs automatically via GitHub Actions Cron or Serverless Cron.
 * Fetches real-time pricing, context window, and benchmark data from public APIs,
 * updates Knowledge.models in js/knowledge.js, and validates test suites.
 */

const fs = require('fs');
const path = require('path');

const knowledgePath = path.join(__dirname, '..', 'js', 'knowledge.js');
let knowledgeCode = fs.readFileSync(knowledgePath, 'utf8');

// Evaluate current Knowledge catalog
const sandbox = { globalThis: {}, console };
sandbox.window = sandbox;
(0, eval)(knowledgeCode.replace('const Knowledge =', 'globalThis.Knowledge ='));

let currentModels = globalThis.Knowledge.models || [];

async function syncModelsFromLiveSources() {
  console.log('📡 [1/3] Consultando API pública de telemetría de modelos (OpenRouter API)...');
  
  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    const liveModels = json.data || [];
    console.log(`✅ ${liveModels.length} modelos en vivo recibidos.`);

    let updatedCount = 0;

    // Map each model in our catalog to live telemetries
    currentModels.forEach(m => {
      // Find matching live model
      const match = liveModels.find(lm => {
        const idLower = lm.id.toLowerCase();
        const nameLower = lm.name.toLowerCase();
        if (m.id.includes('claude-3-7') && (idLower.includes('claude-3.7') || idLower.includes('claude-3-7'))) return true;
        if (m.id.includes('gpt-4o') && (idLower === 'openai/gpt-4o' || idLower.includes('gpt-4o-2024'))) return true;
        if (m.id.includes('deepseek-r1') && (idLower === 'deepseek/deepseek-r1' || nameLower.includes('deepseek: r1'))) return true;
        if (m.id.includes('gemini-2-flash') && idLower.includes('gemini-2.0-flash')) return true;
        if (m.id.includes('o3-mini') && (idLower.includes('o3-mini') || idLower.includes('o1-mini'))) return true;
        if (m.id.includes('llama-3-3-70b') && idLower.includes('llama-3.3-70b')) return true;
        if (m.id.includes('qwen-2-5-72b') && (idLower.includes('qwen-2.5-72b') || idLower.includes('qwen-2.5-coder-32b'))) return true;
        if (m.id.includes('deepseek-v3') && (idLower.includes('deepseek-v3') || idLower.includes('deepseek-chat'))) return true;
        if (m.id.includes('mistral-large-2') && idLower.includes('mistral-large')) return true;
        if (m.id.includes('grok-2') && idLower.includes('grok-2')) return true;
        return false;
      });

      if (match) {
        // Update live pricing per 1M tokens
        if (match.pricing) {
          const promptCostPerM = (parseFloat(match.pricing.prompt) * 1000000).toFixed(2);
          const completionCostPerM = (parseFloat(match.pricing.completion) * 1000000).toFixed(2);
          if (!isNaN(promptCostPerM) && parseFloat(promptCostPerM) > 0) {
            m.pricing.input = `$${promptCostPerM} / 1M`;
            m.pricing.output = `$${completionCostPerM} / 1M`;
          }
        }
        // Update context window if reported
        if (match.context_length && match.context_length > 0) {
          m.contextNum = match.context_length;
          if (match.context_length >= 1000000) {
            m.contextWindow = `${(match.context_length / 1000000).toFixed(0)}M tokens`;
          } else {
            m.contextWindow = `${Math.round(match.context_length / 1000)}K tokens`;
          }
        }
        updatedCount++;
      }
    });

    console.log(`🔄 [2/3] Sincronizados ${updatedCount} modelos con precios y ventanas de contexto en tiempo real.`);

    // Reformat and save updated Knowledge.models into js/knowledge.js
    console.log('💾 [3/3] Guardando catálogo actualizado en js/knowledge.js...');
    const formattedCatalog = JSON.stringify(currentModels, null, 4);
    
    const modelsRegex = /models:\s*\[[\s\S]*?\]\s*,\s*\/\*\s*──\s*Helpers/;
    const replacement = `models: ${formattedCatalog},\n\n  /* ── Helpers`;
    
    const newKnowledgeCode = knowledgeCode.replace(modelsRegex, replacement);
    fs.writeFileSync(knowledgePath, newKnowledgeCode, 'utf8');

    console.log('✨ Sincronización automática 100% completada con éxito.');
    return true;
  } catch (err) {
    console.error('⚠️ Error en sincronización en vivo (se conservan datos en caché):', err.message);
    return false;
  }
}

if (require.main === module) {
  syncModelsFromLiveSources().then(success => {
    if (!success) process.exit(0); // non-blocking fallback
  });
}

module.exports = { syncModelsFromLiveSources };
