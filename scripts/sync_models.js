/**
 * Promptometer — LLM Models Ingestion & Benchmark Sync Utility
 * 
 * Uso:
 *   node scripts/sync_models.js --list                # Lista todos los modelos y telemetría actual
 *   node scripts/sync_models.js --validate            # Valida integridad del catálogo
 *   node scripts/sync_models.js --add <json_file>     # Inserta un nuevo modelo validado a js/knowledge.js
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
const args = process.argv.slice(2);
const command = args[0] || '--list';

if (command === '--list') {
  console.log('============================================================');
  console.log('📊 PROMPTOMETER — OBSERVATORIO & DIRECTORIO DE MODELOS LLM');
  console.log('============================================================');
  console.log(`Total modelos en catálogo: ${models.length}`);
  console.log('------------------------------------------------------------');

  models.forEach(m => {
    console.log(`[#${String(m.rank).padEnd(2)}] ${m.name.padEnd(26)} | ${m.provider.padEnd(16)} | Arena: ${String(m.benchmarks.arenaElo).padEnd(5)} | Context: ${m.contextWindow.padEnd(10)} | Type: ${m.type}`);
  });

  console.log('------------------------------------------------------------');
  console.log('Fuentes oficiales para cotejar nuevas subidas de modelos:');
  console.log('1. LMSYS Chatbot Arena:     https://lmarena.ai/');
  console.log('2. BenchLM Leaderboard:     https://benchlm.ai/');
  console.log('3. Artificial Analysis:     https://artificialanalysis.ai/');
  console.log('4. Hugging Face Open LLM:   https://huggingface.co/spaces/open-llm-leaderboard/open_llm_leaderboard');
  console.log('============================================================\n');
} else if (command === '--validate') {
  console.log('🔍 Validando integridad del catálogo de modelos...');
  let errors = 0;
  models.forEach((m, idx) => {
    if (!m.id) { console.error(`❌ Modelo #${idx + 1} no tiene id`); errors++; }
    if (!m.name) { console.error(`❌ Modelo #${idx + 1} no tiene name`); errors++; }
    if (!m.benchmarks || typeof m.benchmarks.arenaElo !== 'number') { console.error(`❌ Modelo ${m.name} tiene benchmarks incompletos`); errors++; }
    if (!m.promptingTips || !m.promptingTips.samplePrompt) { console.error(`❌ Modelo ${m.name} no tiene prompt canónico de ejemplo`); errors++; }
  });
  if (errors === 0) {
    console.log(`✅ Catálogo 100% válido (${models.length} modelos listos para producción).`);
  } else {
    console.error(`❌ Se encontraron ${errors} errores en el catálogo.`);
    process.exit(1);
  }
} else if (command === '--add') {
  const jsonPath = args[1];
  if (!jsonPath || !fs.existsSync(jsonPath)) {
    console.error('Uso: node scripts/sync_models.js --add <path_to_model.json>');
    process.exit(1);
  }
  const newModel = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  console.log(`Incorporando modelo "${newModel.name}" al catálogo de Promptometer...`);
  
  const modelsArrayRegex = /(models:\s*\[[\s\S]*?)(\s*\]\s*,\s*\/\*\s*──\s*Helpers)/;
  const match = knowledgeCode.match(modelsArrayRegex);
  if (match) {
    const formattedModel = ',\n    ' + JSON.stringify(newModel, null, 4).replace(/\n/g, '\n    ');
    const updated = knowledgeCode.replace(modelsArrayRegex, `$1${formattedModel}\n  ]$2`);
    fs.writeFileSync(knowledgePath, updated, 'utf8');
    console.log(`✅ Modelo "${newModel.name}" agregado con éxito a js/knowledge.js`);
  } else {
    console.error('❌ No se pudo localizar el bloque Knowledge.models en js/knowledge.js');
  }
}
