/* ============================================================
   Promptometer — Knowledge Hub Module
   ------------------------------------------------------------
   A navigation + expansion layer over existing content. This module
   holds NEW knowledge (glossary terms, modern techniques, canonical
   frameworks) that does NOT duplicate what already lives in
   templates.js / patterns.js / adversarial.js / rewriter.js.

   Convention: body text lives here as { es, en } fields per entry,
   not in the i18n dictionary (which only holds UI chrome labels).
   Cross-references (crossRefs) point to existing items by their IDs
   (e.g. "AP014", "tpl-rag-prompt", "rewriter._addChainOfThought").

   Populated progressively across phases 1-3.
   ============================================================ */

const Knowledge = {

  /* ── 1. Glosario: pure definitions not found elsewhere ──────── */
  glossary: [
    // Fase 1 — populated below
  ],

  /* ── 2. Técnicas: modern patterns (new + cross-linked) ──────── */
  techniques: [
    // Fase 2 — populated below
  ],

  /* ── 3. Frameworks: canonical structural schemas ────────────── */
  frameworks: [
    // Fase 3 — populated below
  ],

  /* ── Helpers ────────────────────────────────────────────────── */
  getById(section, id) {
    const list = this[section] || [];
    return list.find(item => item.id === id);
  },

  getByCategory(section, category) {
    const list = this[section] || [];
    return list.filter(item => item.category === category);
  },
};
