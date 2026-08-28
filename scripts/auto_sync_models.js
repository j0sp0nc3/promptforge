/**
 * Promptometer — Automated Zero-Touch LLM Models & Benchmarks Synchronizer
 *
 * Runs via GitHub Actions cron (weekly) or manually.
 * Fetches live pricing & context-window telemetry from the public OpenRouter
 * API and regenerates js/models.js WHOLE (the single source of truth shared
 * by the web UI and GET /api/models). Never touches knowledge.js or any
 * other hand-curated file.
 *
 * The regenerated file preserves the curated fields verbatim (rank, name,
 * desc, promptingTips...) and only updates pricing/context telemetry.
 */

const fs = require('fs');
const path = require('path');

const modelsPath = path.join(__dirname, '..', 'js', 'models.js');

// Static require of the UMD catalog (browser+Node dual export). No eval.
const Models = require('../js/models.js');

function normalize(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Generic matcher: significant-token overlap between our catalog name and
// the OpenRouter id/name. Scales to new models without editing mappings.
function findLiveMatch(catalogModel, liveModels) {
  const normName = normalize(catalogModel.name);
  const normProvider = normalize(catalogModel.provider.split(' ')[0]);
  if (normName.length < 4) return null;
  return liveModels.find(lm => {
    const idN = normalize(lm.id);
    const nameN = normalize(lm.name);
    // Direct containment either way (e.g. "kimi k3" ⊂ "moonshotai/kimi-k3")
    if (idN.includes(normName) || normName.includes(idN) && idN.length >= 4) return true;
    if (nameN.includes(normName) || normName.includes(nameN) && nameN.length >= 4) return true;
    // Provider-qualified: provider token appears in the OR id AND the name matches loosely
    if (normProvider && idN.includes(normProvider) && idN.includes(normName.slice(0, 6))) return true;
    return false;
  }) || null;
}

// Regenerates the whole file deterministically from the catalog object.
function renderCatalogFile(catalog) {
  const header = `/**
 * Promptometer — LLM Models & Benchmarks Observatory (SINGLE SOURCE OF TRUTH)
 *
 * This file is the only catalog of models consumed by:
 *   - The web UI (script tag → window.Models)
 *   - The serverless API GET /api/models (static require → bundled by Vercel)
 *   - scripts/auto_sync_models.js & scripts/sync_models.js (CLI regenerators)
 *
 * IMPORTANT: this file is REGENERATED WHOLE by the sync tooling. Never mix
 * hand-curated unrelated content here; every field is either curated catalog
 * data or auto-synced telemetry (pricing / contextWindow from OpenRouter).
 *
 * Snapshot: ${catalog.updated}. Sources: benchlm.ai, lmarena.ai, llm-stats.com.
 * Benchmark values are only included where published by those sources;
 * null means "not verified — check the sources bar".
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.Models = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  return {
`;
  const footer = `,

    // ── Helpers (preserved by the sync regenerator) ──────────────────────
    top(filter) {
      const list = [...this.list].sort((a, b) => a.rank - b.rank);
      if (!filter || filter === 'all') return list;
      return list.filter(m => m.type === filter);
    },

    countBy(type) {
      return this.list.filter(m => m.type === type).length;
    },
  };
}));
`;
  const body =
    `    updated: ${JSON.stringify(catalog.updated)},\n\n` +
    `    sources: ${JSON.stringify(catalog.sources, null, 4).replace(/\n/g, '\n  ').replace(/^ {2}/, '  ')},\n\n` +
    `    list: ${JSON.stringify(catalog.list, null, 4).replace(/\n/g, '\n  ').replace(/^ {2}/, '  ')}`;
  return header + body + footer;
}

async function syncModelsFromLiveSources() {
  console.log('📡 [1/3] Consultando telemetría pública de modelos (OpenRouter API)...');

  try {
    const res = await fetch('https://openrouter.ai/api/v1/models');
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    const json = await res.json();
    const liveModels = json.data || [];
    console.log(`✅ ${liveModels.length} modelos en vivo recibidos.`);

    const catalog = {
      updated: Models.updated,
      sources: Models.sources,
      list: Models.list.map(m => ({ ...m })),
    };

    let updatedCount = 0;
    for (const m of catalog.list) {
      const match = findLiveMatch(m, liveModels);
      if (!match) continue;

      if (match.pricing) {
        const inputPerM = (parseFloat(match.pricing.prompt) * 1e6).toFixed(2);
        const outputPerM = (parseFloat(match.pricing.completion) * 1e6).toFixed(2);
        if (!isNaN(inputPerM) && parseFloat(inputPerM) > 0) {
          m.pricing.input = `$${inputPerM} / 1M`;
          m.pricing.output = `$${outputPerM} / 1M`;
        }
      }
      if (match.context_length && match.context_length > 0) {
        m.contextNum = match.context_length;
        m.contextWindow = match.context_length >= 1e6
          ? `${(match.context_length / 1e6).toFixed(2).replace(/\.?0+$/, '')}M tokens`
          : `${Math.round(match.context_length / 1e3)}K tokens`;
      }
      updatedCount++;
    }

    console.log(`🔄 [2/3] Sincronizados ${updatedCount} modelos con precios y contextos en tiempo real.`);
    console.log('💾 [3/3] Regenerando js/models.js (fuente única)...');
    fs.writeFileSync(modelsPath, renderCatalogFile(catalog), 'utf8');
    console.log('✨ Sincronización automática completada con éxito.');
    return true;
  } catch (err) {
    console.error('⚠️ Error en sincronización en vivo (se conservan los datos actuales):', err.message);
    return false;
  }
}

if (require.main === module) {
  syncModelsFromLiveSources().then(success => {
    if (!success) process.exit(0); // non-blocking fallback
  });
}

module.exports = { syncModelsFromLiveSources, renderCatalogFile };
