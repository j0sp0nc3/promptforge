/**
 * Promptometer — LLM Models Ingestion & Benchmark Sync Utility
 *
 * Uso:
 *   node scripts/sync_models.js --list                # Lista todos los modelos y telemetría actual
 *   node scripts/sync_models.js --validate            # Valida integridad del catálogo (js/models.js)
 *   node scripts/sync_models.js --sync                # Sincroniza telemetría live (OpenRouter)
 *   node scripts/sync_models.js --add <json_file>     # Inserta un nuevo modelo validado a js/models.js
 *
 * El catálogo vive ÚNICAMENTE en js/models.js (fuente única compartida con
 * la UI y /api/models). Este CLI lo regenera completo — jamás toca knowledge.js.
 */

const fs = require('fs');
const path = require('path');

const modelsPath = path.join(__dirname, '..', 'js', 'models.js');
const Models = require('../js/models.js');
const { syncModelsFromLiveSources, renderCatalogFile } = require('./auto_sync_models.js');

const args = process.argv.slice(2);
const command = args[0] || '--list';

function requireCatalogIntegrity(list) {
  const errors = [];
  if (!Array.isArray(list) || list.length < 1) errors.push('El catálogo está vacío.');
  const seen = new Set();
  for (const m of list) {
    if (!m.id || seen.has(m.id)) errors.push(`id duplicado/ausente: ${m.id}`);
    seen.add(m.id);
    if (typeof m.rank !== 'number') errors.push(`${m.id}: rank debe ser número`);
    if (!m.name || !m.provider) errors.push(`${m.id}: faltan name/provider`);
    if (!['frontier', 'open_weights'].includes(m.type)) errors.push(`${m.id}: type inválido (${m.type})`);
    if (!m.desc || !m.desc.es || !m.desc.en) errors.push(`${m.id}: desc ES/EN incompleta`);
    if (!m.promptingTips || !m.promptingTips.samplePrompt) errors.push(`${m.id}: falta promptingTips.samplePrompt`);
    if (!m.license) errors.push(`${m.id}: falta license`);
    if (!m.benchmarks || typeof m.benchmarks.arenaElo !== 'number' && m.benchmarks.arenaElo !== null) {
      errors.push(`${m.id}: benchmarks.arenaElo debe ser número o null`);
    }
  }
  return errors;
}

if (command === '--list') {
  console.log('============================================================');
  console.log('📊 PROMPTOMETER — OBSERVATORIO & DIRECTORIO DE MODELOS LLM');
  console.log(`Snapshot: ${Models.updated} · Fuente única: js/models.js`);
  console.log('============================================================');
  console.log(`Total modelos en catálogo: ${Models.list.length}`);
  console.log('------------------------------------------------------------');
  for (const m of Models.list) {
    console.log(`#${m.rank} ${m.name} (${m.provider}) [${m.type}]`);
    console.log(`   Contexto: ${m.contextWindow} · Precio in/out: ${m.pricing.input} / ${m.pricing.output}`);
  }
  process.exit(0);
}

if (command === '--validate') {
  const errors = requireCatalogIntegrity(Models.list);
  if (errors.length) {
    console.error(`❌ ${errors.length} problemas de integridad:`);
    errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }
  console.log(`✅ Catálogo válido: ${Models.list.length} modelos, sin duplicados, ES/EN completo.`);
  process.exit(0);
}

if (command === '--sync') {
  syncModelsFromLiveSources().then(() => process.exit(0));
}

if (command === '--add') {
  const filePath = args[1];
  if (!filePath) {
    console.error('Uso: node scripts/sync_models.js --add <json_file>');
    process.exit(1);
  }
  let entry;
  try {
    entry = JSON.parse(fs.readFileSync(path.resolve(filePath), 'utf8'));
  } catch (e) {
    console.error('❌ No se pudo leer el JSON:', e.message);
    process.exit(1);
  }

  const candidate = [entry];
  const errors = requireCatalogIntegrity(candidate);
  if (errors.length) {
    console.error('❌ La entrada no supera la validación:');
    errors.forEach(e => console.error('  - ' + e));
    process.exit(1);
  }

  const catalog = {
    updated: Models.updated,
    sources: Models.sources,
    list: [...Models.list.map(m => ({ ...m })), entry].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)),
  };
  fs.writeFileSync(modelsPath, renderCatalogFile(catalog), 'utf8');
  console.log(`✅ Modelo "${entry.name}" añadido y catálogo reordenado (${catalog.list.length} modelos).`);
  process.exit(0);
}
