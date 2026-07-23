// ============================================================================
// PromptForge — Signals Registry
// Single source of truth for every derived signal used by the scoring
// engine. Avoids double counting (the same signal feeding multiple
// dimensions independently) and makes co-occurrence-based detection
// trivial — closing the "keyword stuffing" gaming vector.
//
// API:
//   Signals.extract(prompt, lang)  → object with boolean/number signals
//   Signals.inferType(prompt, signals, wordCount)  → 'system' | 'few-shot' | ...
//   Signals.weightsFor(type)      → { clarity, specificity, ... } summing to 1
// ============================================================================

const Signals = {

  /**
   * Extract every signal the scoring engine needs. Each signal is computed
   * exactly once here; dimension scorers then READ signals instead of
   * re-running their own regex.
   *
   * @param {string} prompt  Raw prompt text.
   * @param {string} lang    'es' | 'en' | 'mixed' (from Analyzer._detectLanguage).
   * @returns {Object} Signal map.
   */
  extract(prompt, lang) {
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const wordCount = words.length;

    // ── Structure signals (counted ONCE) ────────────────────────────────
    const xmlPairs = (prompt.match(/<[a-z_]+>[\s\S]*?<\/[a-z_]+>/gi) || []).length;
    const xmlOpen = (prompt.match(/<[a-z_]+>/gi) || []).length;
    const markdownHeaders = (prompt.match(/^#{1,6}\s/gm) || []).length;
    const numberedItems = (prompt.match(/^\s*\d+[\.\)]\s/gm) || []).length;
    const bulletItems = (prompt.match(/^\s*[-*•]\s/gm) || []).length;
    const codeBlockMarkers = (prompt.match(/```/g) || []).length;
    const separators = (prompt.match(/^(---+|\*{3,}|={3,})$/gm) || []).length;

    // ── Co-occurrence signals (kill keyword stuffing) ───────────────────
    // outputFormat: only counts if a "request" verb co-occurs with a format name.
    const requestVerb = /\b(respond|reply|return|output|answer|devuelve|responde|format|formatea|entrega|presenta)\b/i.test(lower);
    const formatName = /\b(json|xml|csv|yaml|html|markdown|table|tabla|bullet\s?list|numbered\s?list|lista)\b/i.test(lower);
    const requestsOutputFormat = requestVerb && formatName;

    // few-shot: example cue + structural delimiter (code block pairs or arrows).
    const exampleCue = /\b(example|ejemplo|e\.g\.|for instance|por ejemplo|sample|muestra)\b/i.test(lower);
    const blockDelim = codeBlockMarkers >= 2 || /→|->|-->/.test(prompt);
    const inputOutputLabels = /\b(input|entrada)\b/i.test(lower) && /\b(output|salida)\b/i.test(lower);
    const hasFewShot = (exampleCue && blockDelim) || inputOutputLabels;

    // numeric constraint: digits tied to a unit, not stray numbers.
    const hasNumericConstraint = /\b\d+\s*(words|palabras|items|elementos|sentences|oraciones|paragraphs|párrafos|points|puntos|lines|líneas|minutos|minutes|seconds|segundos|%|percent|por ciento|tokens?)\b/i.test(lower);

    // ── Modern prompting techniques (2024-2026) ────────────────────────
    const hasStepByStep = /\b(step.?by.?step|paso a paso|think.{0,12}through|piensa.{0,12}detenidamente|chain of thought|cadena de pensamiento|let'?s think|pensemos|think carefully|piensa cuidadosamente)\b/i.test(lower);
    const hasTreeOfThought = /\b(tree of thoughts?|\btot\b|explore.{0,15}branch|múltiples caminos|multiple reasoning paths|ramas de razonamiento)\b/i.test(lower);
    const hasReAct = /\b(thought:\s|action:\s|observation:\s|pensamiento:\s|acción:\s|observación:\s|react prompt|reason.?and.?act)\b/i.test(lower);
    const hasToolUse = /\b(tool_use|function_call|tool_call|tool_choice|<tools?>|available functions|funciones disponibles|@tool|function calling)\b/i.test(lower);
    const hasSelfConsistency = /\b(self.?consistency|majority vote|votación mayoritaria|generate.{0,15}multiple.{0,15}answers|genera.{0,15}varias respuestas)\b/i.test(lower);
    const hasReflexion = /\b(review your (answer|response)|critique your (answer|response)|revisa tu respuesta|critica tu respuesta|self.?refine|reflexion|reflexión)\b/i.test(lower);
    const hasRagContext = /\b(retrieved documents?|documentos recuperados|<context>|<documents?>|based on the following documents?|basado en los siguientes documentos|knowledge base|base de conocimiento)\b/i.test(lower);

    // ── Role / context (stricter than before) ──────────────────────────
    // Excludes "if you are", "where you are", "user persona".
    const roleAssignment = /\b(you are (an?|the)|act as (an?|the)|eres un[ao]?|actúa como un[oa]?|your role is|tu rol es|behave as|compórtate como)\b/i.test(lower);
    const roleWithDomain = roleAssignment && /\b(expert in|specialist in|specialized in|with experience in|experto en|especialista en|especializado en|con experiencia en)\b/i.test(lower);
    const audienceDefined = /\b(audience|audiencia|público|reader|lector|for (developers?|students?|beginners?|managers?|clients?|customers?)|para (desarrolladores|estudiantes|principiantes|gerentes|clientes))\b/i.test(lower);

    // ── Robustness signals (each counted once) ─────────────────────────
    const errorHandling = /\b(if.{0,20}(invalid|missing|malformed|empty|incorrect)|si.{0,20}(inválid|faltante|malformad|vacío|incorrecto)|when.{0,12}(fail|error)|cuando.{0,12}(fall|error)|fallback|por defecto|default value|handle.{0,8}error|manejo de error|otherwise|de lo contrario)\b/i.test(lower);
    const edgeCases = /\b(edge case|caso borde|caso límite|corner case|boundary|frontera|null|undefined|NaN|empty input|entrada vacía|missing data|dato faltante)\b/i.test(lower);
    const validation = /\b(validate|valida|verify|verifica|check|comprueba|ensure|asegúrate|confirm|confirma|double.?check)\b/i.test(lower);

    // ── Safety signals (stricter than before) ──────────────────────────
    // Anti-hallucination requires explicit anti-fabrication language, not just "verify".
    const antiHallucination = /\b(don'?t make up|no inventes|don'?t fabricate|no fabriques|do not hallucinate|no alucines|cite your sources?|cita tus fuentes|if you'?re unsure|si no estás seguro|say "?i don'?t know"?|di "?no sé"?|not enough (info|information)|sin suficiente (info|información))\b/i.test(lower);
    const scopeLimit = /\b(scope|alcance|only (respond|answer|about)|solo (responde|contest|sobre)|limited to|limitado a|restricted to|restringido a|stay within|mantente dentro|do not (go|discuss) beyond|no (vayas|discutes) más allá)\b/i.test(lower);
    const injectionGuard = /\b(ignore (any|previous|user).{0,20}instruction|ignora (cualquier|anterior|del usuario).{0,20}instrucción|do not reveal|no reveles|never share these instructions|nunca compartas estas instrucciones|disregard (external|user) commands|ignora comandos externos)\b/i.test(lower);
    const untrustedDelim = /\b(treat.{0,15}(content|text|input) as (data|untrusted)|trata.{0,15}(contenido|texto|entrada) como (dato|no confiable)|<untrusted>|<user_input>|contenido no confiable)\b/i.test(lower);

    // ── Signals for type inference ─────────────────────────────────────
    const systemPromptCue = /\b(you are (an?|the) .{3,40}(assistant|agent|expert|system|chatbot|representative|advisor)|eres un[oa]? .{3,40}(asistente|agente|experto|sistema|chatbot)|system prompt|prompt del sistema|<system>)\b/i.test(lower);
    const creativeTask = /\b(write (a |an )?(poem|haiku|story|song|script|joke|tweet|caption)|escribe (un[ao] )?(poema|haiku|canción|cuento|guion|chiste|tweet|pie))\b/i.test(lower);
    const factualRequest = /\b(statistic|estadística|who invented|quién inventó|when (was|did)|cuándo (fue|sucedió)|scientific study|estudio científico|citation needed| according to research|según investigaciones)\b/i.test(lower);
    const postCutoffYear = (() => {
      const currentYear = new Date().getFullYear();
      const years = [...prompt.matchAll(/\b(20\d{2})\b/g)].map(m => parseInt(m[1], 10));
      return years.some(y => y >= currentYear - 1);
    })();
    const assumesCapability = /\b(calculate exactly|calcula exact|live (url|data|price|news)|datos en vivo|precio actual|today'?s|de hoy|browse the web|navega internet|run (this|the) code|ejecuta este código|real.?time data|tiempo real)\b/i.test(lower);
    const hasPII = (lower.match(/[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/gi) || []).length > 0
                || /\b(sk-[a-za-z0-9]{20,}|AKIA[0-9A-Z]{16}|ghp_[a-za-z0-9]{36}|xox[baprs]-[0-9a-z-]+)\b/i.test(prompt)
                || /\b\d{3}-\d{2}-\d{4}\b/.test(prompt)
                || /\b(?:\d[ -]*?){13,16}\b/.test(prompt);

    // ── Negative signals ───────────────────────────────────────────────
    const vagueQualifiers = (lower.match(/\b(somehow|de alguna manera|kind of|tipo de|más o menos|maybe|quizás|tal vez|probably|probablemente|somewhat|algo así|un poco|rather|bastante)\b/gi) || []).length;
    const vagueAdjectives = (lower.match(/\b(good|bueno|nice|bonito|better|mejor|appropriate|adecuado|interesting|interesante|great|genial|amazing|increíble|cool|relevant|relevante)\b/gi) || []).length;
    const contradictions = [
      [/\b(be brief|sé breve|be concise|sé conciso|short answer|respuesta corta)\b/i, /\b(be detailed|sé detallado|in detail|en detalle|elaborate|elabora|comprehensive|exhaustiv[oa])\b/i],
      [/\b(be creative|sé creativ[oa]|imaginat)\b/i, /\b(follow strictly|sigue estrictamente|exactly as|exactamente como|don'?t deviate|no te desvíes)\b/i],
      [/\b(formal|profesional|professional)\b/i, /\b(casual|informal|coloquial|colloquial)\b/i],
    ].some(([a, b]) => a.test(lower) && b.test(lower));

    return {
      wordCount,
      // Structure
      hasXMLTags: xmlPairs >= 1,
      xmlPairs,
      xmlOpenCount: xmlOpen,
      hasMarkdownHeaders: markdownHeaders >= 2,
      markdownHeadersCount: markdownHeaders,
      hasNumberedList: numberedItems >= 3,
      numberedItemsCount: numberedItems,
      hasBullets: bulletItems >= 3,
      bulletItemsCount: bulletItems,
      hasCodeBlocks: codeBlockMarkers >= 2,
      codeBlockMarkersCount: codeBlockMarkers,
      hasSeparators: separators >= 1,
      lineCount: prompt.split('\n').length,
      // Co-occurrence (kills gaming)
      requestsOutputFormat,
      hasFewShot,
      hasNumericConstraint,
      // Modern techniques
      hasStepByStep,
      hasTreeOfThought,
      hasReAct,
      hasToolUse,
      hasSelfConsistency,
      hasReflexion,
      hasRagContext,
      // Role / context (strict)
      roleAssignment,
      roleWithDomain,
      audienceDefined,
      // Robustness
      errorHandling,
      edgeCases,
      validation,
      // Safety (strict)
      antiHallucination,
      scopeLimit,
      injectionGuard,
      untrustedDelim,
      // Type inference helpers
      systemPromptCue,
      creativeTask,
      factualRequest,
      postCutoffYear,
      assumesCapability,
      hasPII,
      // Negatives
      vagueQualifiers,
      vagueAdjectives,
      contradictions,
    };
  },

  /**
   * Infer the prompt type to drive dynamic weights.
   * @returns {'system'|'few-shot'|'task'|'creative'|'rag'|'tool-use'|'general'}
   */
  inferType(prompt, signals, wordCount) {
    if (signals.hasToolUse) return 'tool-use';
    if (signals.hasRagContext) return 'rag';
    if (signals.systemPromptCue && wordCount > 40) return 'system';
    if (signals.hasFewShot) return 'few-shot';
    if (signals.creativeTask) return 'creative';
    if (signals.hasStepByStep || signals.hasReAct || wordCount > 80) return 'task';
    return 'general';
  },

  /**
   * Per-type weight tables. Each row sums to 1.0. Dimensions that don't
   * matter for a type are de-weighted; the ones that matter most are bumped.
   */
  _weightsTable: {
    // Default — balanced, but safety bumped and clarity reduced vs the old 0.18/0.08.
    general:   { clarity: 0.14, specificity: 0.16, structure: 0.13, robustness: 0.13, context: 0.12, outputFormat: 0.13, chainOfThought: 0.09, safety: 0.10 },
    // System prompt: safety is critical; robustness and scope matter.
    system:    { clarity: 0.12, specificity: 0.12, structure: 0.12, robustness: 0.16, context: 0.10, outputFormat: 0.08, chainOfThought: 0.07, safety: 0.23 },
    // Few-shot: specificity (the examples themselves) is the dominant axis.
    'few-shot': { clarity: 0.10, specificity: 0.28, structure: 0.14, robustness: 0.10, context: 0.08, outputFormat: 0.16, chainOfThought: 0.06, safety: 0.08 },
    // Task: balanced reasoning + format; safety stays meaningful.
    task:      { clarity: 0.15, specificity: 0.17, structure: 0.13, robustness: 0.12, context: 0.10, outputFormat: 0.16, chainOfThought: 0.11, safety: 0.06 },
    // Creative: structure/CoT don't apply; de-emphasize.
    creative:  { clarity: 0.20, specificity: 0.10, structure: 0.08, robustness: 0.08, context: 0.24, outputFormat: 0.10, chainOfThought: 0.05, safety: 0.15 },
    // RAG: grounding is everything.
    rag:       { clarity: 0.10, specificity: 0.14, structure: 0.10, robustness: 0.14, context: 0.12, outputFormat: 0.14, chainOfThought: 0.06, safety: 0.20 },
    // Tool use: validation/schema matter most.
    'tool-use': { clarity: 0.12, specificity: 0.16, structure: 0.18, robustness: 0.18, context: 0.08, outputFormat: 0.16, chainOfThought: 0.04, safety: 0.08 },
  },

  weightsFor(type) {
    return this._weightsTable[type] || this._weightsTable.general;
  },

  /**
   * Default weights (kept for backwards compatibility / fallback).
   */
  get _defaultWeights() { return this._weightsTable.general; },
};
