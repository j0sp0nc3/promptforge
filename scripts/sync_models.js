/**
 * Promptometer — LLM Models Ingestion & Benchmark Sync Utility
 * Run: node scripts/sync_models.js [--list | --validate | --add]
 */

const fs = require('fs');
const path = require('path');

const knowledgePath = path.join(__dirname, '..', 'js', 'knowledge.js');
let knowledgeCode = fs.readFileSync(knowledgePath, 'utf8');

// Evaluate Knowledge into sandbox
const sandbox = { globalThis: {}, console };
sandbox.window = sandbox;
(0, eval)(knowledgeCode.replace('const Knowledge =', 'globalThis.Knowledge ='));

const models = globalThis.Knowledge.models || [];

console.log('============================================================');
console.log('📊 PROMPTOMETER — OBSERVATORIO & DIRECTORIO DE MODELOS LLM');
console.log('============================================================');
console.log(`Total modelos en catálogo: ${models.length}`);
console.log('------------------------------------------------------------');

models.forEach(m => {
  console.log(`[#${m.rank}] ${m.name.padEnd(28)} | ${m.provider.padEnd(16)} | Arena: ${String(m.benchmarks.arenaElo).padEnd(5)} | Context: ${m.contextWindow.padEnd(10)} | Type: ${m.type}`);
});

console.log('------------------------------------------------------------');
console.log('Fuentes oficiales de sincronización de benchmarks:');
console.log('1. LMSYS Chatbot Arena Leaderboard: https://lmarena.ai/');
console.log('2. BenchLM Monthly Leaderboard:     https://benchlm.ai/');
console.log('3. Artificial Analysis:             https://artificialanalysis.ai/');
console.log('4. Hugging Face Open LLM v2:        https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard');
console.log('============================================================\n');
