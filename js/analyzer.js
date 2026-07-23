// ============================================================================
// PromptForge — Core Analysis Engine
// Scores prompts across 8 dimensions with bilingual (EN/ES) support
// ============================================================================

const Analyzer = {

  // Dimension weights for overall score (DEFAULT — overridden per prompt
  // type by Signals.weightsFor(type) in analyze()).
  _weights: {
    clarity:        0.14,
    specificity:    0.16,
    structure:      0.13,
    robustness:     0.13,
    context:        0.12,
    outputFormat:   0.13,
    chainOfThought: 0.09,
    safety:         0.10,
  },

  // =========================================================================
  // MAIN ANALYSIS METHOD
  // =========================================================================

  /**
   * Perform a full analysis of the given prompt.
   * @param {string} prompt - The prompt text to analyze.
   * @returns {object} Full analysis result.
   */
  analyze(prompt) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return this._emptyResult();
    }

    const trimmed = prompt.trim();
    const lang = this._detectLanguage(trimmed);
    const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
    const charCount = trimmed.length;
    const tokenEstimate = this._estimateTokens(trimmed);

    // Extract every signal ONCE so dimension scorers don't re-detect
    // (and don't double-count) the same cue.
    const signals = Signals.extract(trimmed, lang);
    const promptType = Signals.inferType(trimmed, signals, wordCount);
    const weights = Signals.weightsFor(promptType);

    // Score each dimension using the shared signal map.
    const dimensions = {
      clarity:        this._scoreClarity(trimmed, lang, signals),
      specificity:    this._scoreSpecificity(trimmed, lang, signals),
      structure:      this._scoreStructure(trimmed, lang, signals),
      robustness:     this._scoreRobustness(trimmed, lang, signals),
      context:        this._scoreContext(trimmed, lang, signals),
      outputFormat:   this._scoreOutputFormat(trimmed, lang, signals),
      chainOfThought: this._scoreChainOfThought(trimmed, lang, signals),
      safety:         this._scoreSafety(trimmed, lang, signals),
    };

    // Weighted average using the type-specific weights.
    let overallScore = 0;
    for (const [dim, weight] of Object.entries(weights)) {
      overallScore += dimensions[dim].score * weight;
    }
    overallScore = Math.round(Math.max(0, Math.min(100, overallScore)));

    // Detect patterns
    const patternResults = Patterns.detect(trimmed);

    // Determine complexity
    const complexity = this._classifyComplexity(trimmed, wordCount, dimensions);

    return {
      overallScore,
      grade: this._gradeFromScore(overallScore),
      complexity,
      tokenEstimate,
      wordCount,
      charCount,
      dimensions,
      antiPatterns: patternResults.antiPatterns,
      strengths: patternResults.strengths,
      language: lang,
      // ── New: prompt type & weights used (transparency) ────────────────
      promptType,
      promptTypeLabel: I18n.t(`promptType.${promptType}`) || promptType,
      weightsUsed: { ...weights },
      // ── Legacy-compatible shim (derived from the data above) ───────────
      // Consumers like Rewriter and ExportUtil expect a "flat" shape. These
      // fields are derived so a single source of truth stays in dimensions.
      prompt: trimmed,
      scores: this._buildScores(dimensions, overallScore),
      detected: this._buildDetected(trimmed, patternResults, signals),
      detectedDomain: this._inferDomain(trimmed),
      metrics: this._buildMetrics(trimmed),
      tokens: {
        estimated: tokenEstimate,
        model: I18n.getLang() === 'en' ? '~GPT tokenizer (words × 1.3)' : '~GPT tokenizer (palabras × 1.3)',
        cost: null,
      },
      suggestions: this._flattenSuggestions(dimensions, patternResults),
    };
  },

  // =========================================================================
  // DIMENSION SCORERS
  // =========================================================================

  _scoreClarity(prompt, lang, signals) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.clarity.${id}`);

    // --- Positive signals ---

    // Clear action verbs
    const actionVerbs = /\b(write|escribe|create|crea|explain|explica|list|enumera|describe|describir|analyze|analiza|compare|compara|summarize|resume|generate|genera|translate|traduce|design|diseña|implement|implementa|define|definir|evaluate|evalúa|calculate|calcula)\b/gi;
    const verbMatches = lower.match(actionVerbs) || [];
    if (verbMatches.length >= 1) {
      score += 8; // reduced from +10: verbs alone are not strong signal
      findings.push(k('useActionVerbs'));
    }
    if (verbMatches.length >= 3) {
      score += 4;
    }

    // Clear sentence structure (not just fragments)
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (sentences.length >= 2) {
      score += 6;
      findings.push(k('multipleSentences'));
    }

    // No ambiguous pronouns without antecedents
    const ambiguousPronouns = /\b(it|this|that|they|them|these|those|eso|esto|ello|ellos|aquello)\b/gi;
    const pronounMatches = lower.match(ambiguousPronouns) || [];
    if (pronounMatches.length === 0 && words.length > 10) {
      score += 4;
      findings.push(k('avoidsPronouns'));
    }

    // --- Negative signals ---

    // Vague qualifiers (from shared signal map)
    if (signals.vagueQualifiers >= 2) {
      score -= 12;
      findings.push(I18n.t('analyzer.clarity.vagueCount', { n: signals.vagueQualifiers }));
      suggestions.push(k('vagueSugg'));
    }

    // Ambiguous pronouns
    if (pronounMatches.length >= 3) {
      score -= 10;
      findings.push(k('tooManyPronouns'));
      suggestions.push(k('pronounsSugg'));
    }

    // Very short prompt (but >10 chars)
    if (words.length >= 3 && words.length < 10) {
      score -= 15;
      findings.push(k('tooShort'));
      suggestions.push(k('expandSugg'));
    }

    // Run-on single sentence (long prompt, no periods)
    if (words.length > 40 && sentences.length <= 1) {
      score -= 12;
      findings.push(k('runOn'));
      suggestions.push(k('splitSugg'));
    }

    // Contradictory instructions (now uses shared signal)
    if (signals.contradictions) {
      score -= 15;
      findings.push(k('contradictions'));
      suggestions.push(k('contradictionsSugg'));
    }

    // Mixed languages without structure
    if (lang === 'mixed') {
      score -= 8;
      findings.push(k('mixedLangs'));
      suggestions.push(k('mixedLangsSugg'));
    }

    return { score: this._clamp(score), findings, suggestions };
  },

  _scoreSpecificity(prompt, lang, signals) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.specificity.${id}`);

    // --- Positive signals (all use shared signals to avoid keyword gaming) ---

    // Numeric constraint: digits tied to a unit (NOT stray numbers).
    if (signals.hasNumericConstraint) {
      score += 12;
      findings.push(k('numeric'));
    }

    // Specific entities (proper nouns, technical terms)
    const properNouns = prompt.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*\b/g) || [];
    if (properNouns.length >= 3) {
      score += 6;
      findings.push(k('entities'));
    }

    // Success criteria
    if (/\b(criteria|criterio|must include|debe incluir|should contain|debe contener|requirement|requisito|expected|esperad|quality|calidad)\b/i.test(lower)) {
      score += 10;
      findings.push(k('criteria'));
    }

    // Few-shot examples (co-occurrence required, not stray `=>` or code blocks)
    if (signals.hasFewShot) {
      score += 12;
      findings.push(k('examples'));
    }

    // Measurable criteria
    if (/\b(at least|al menos|no more than|no más de|between|entre|maximum|máximo|minimum|mínimo|exactly|exactamente|up to|hasta|at most|como máximo|como mínimo)\b/i.test(lower)) {
      score += 8;
      findings.push(k('measurable'));
    }

    // --- Negative signals ---

    // Vague adjectives (from shared signal)
    if (signals.vagueAdjectives >= 2) {
      score -= 10;
      findings.push(I18n.t('analyzer.specificity.vagueAdj', { n: signals.vagueAdjectives }));
      suggestions.push(k('vagueAdjSugg'));
    }

    // "etc." and open-ended
    if (/\b(etc\.?|etcétera|and so on|y demás|y así sucesivamente|among others|entre otros)\b/i.test(lower)) {
      score -= 8;
      findings.push(k('etc'));
      suggestions.push(k('etcSugg'));
    }

    // No constraints at all in a long prompt
    if (words.length > 30 && !signals.hasNumericConstraint && !/\b(must|should|need|require|debe|necesita|requiere)\b/i.test(lower)) {
      score -= 12;
      findings.push(k('noConstraints'));
      suggestions.push(k('noConstraintsSugg'));
    }

    // "Be creative" without bounds
    if (/\b(be creative|sé creativ|creative|creativ)\b/i.test(lower) && !/\b(but|pero|within|dentro|limit|límite|constraint|restricción)\b/i.test(lower)) {
      score -= 8;
      findings.push(k('creativeUnbounded'));
      suggestions.push(k('creativeSugg'));
    }

    return { score: this._clamp(score), findings, suggestions };
  },

  _scoreStructure(prompt, lang, signals) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const words = prompt.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.structure.${id}`);

    // --- Positive signals (all from shared signal map; each counted ONCE) ---

    // XML tags (capped at +8 unless they're named semantic sections)
    if (signals.hasXMLTags) {
      const hasNamedSections = /<(contexto|context|instrucciones|instructions|tarea|task|formato|format|restricciones|constraints|ejemplos|examples)>/i.test(prompt);
      score += hasNamedSections ? 12 : 8;
      findings.push(k('xmlTags'));
    }

    // Markdown headers
    if (signals.hasMarkdownHeaders) {
      score += 10;
      findings.push(k('headers'));
    }

    // Numbered lists
    if (signals.hasNumberedList) {
      score += 10;
      findings.push(k('numbered'));
    } else if (signals.numberedItemsCount >= 1) {
      score += 4;
    }

    // Bullet points
    if (signals.hasBullets) {
      score += 8;
      findings.push(k('bullets'));
    }

    // Separators
    if (signals.hasSeparators) {
      score += 4;
      findings.push(k('separators'));
    }

    // Code blocks
    if (signals.hasCodeBlocks) {
      score += 6;
      findings.push(k('codeBlocks'));
    }

    // Line breaks for readability
    if (signals.lineCount >= 5 && words.length > 30) {
      score += 4;
      findings.push(k('lineBreaks'));
    }

    // --- Negative signals ---

    // Long prompt without any structure (threshold raised to 100 to avoid
    // penalising valid prose instructions in the 60–100 word range).
    const anyStructure = signals.hasXMLTags || signals.hasMarkdownHeaders || signals.hasNumberedList || signals.hasBullets || signals.hasSeparators;
    if (words.length > 100 && !anyStructure) {
      score -= 15; // was -20
      findings.push(k('noStructure'));
      suggestions.push(k('noStructureSugg'));
    }

    // Single block of text
    if (words.length > 40 && signals.lineCount <= 2) {
      score -= 12;
      findings.push(k('singleBlock'));
      suggestions.push(k('singleBlockSugg'));
    }

    // Multiple tasks without structure
    const taskSwitchers = (prompt.toLowerCase().match(/\b(also|además|then|luego|after|después|and also|y también|next|plus|additionally|adicionalmente)\b/gi) || []).length;
    if (taskSwitchers >= 3 && !signals.hasNumberedList && !signals.hasBullets) {
      score -= 12;
      findings.push(k('multiTaskNoStructure'));
      suggestions.push(k('multiTaskSugg'));
    }

    // ALL CAPS emphasis
    const capsWords = (prompt.match(/\b[A-ZÁÉÍÓÚÑ]{4,}\b/g) || []).filter(w => !/^(JSON|XML|HTML|CSS|API|URL|HTTP|HTTPS|SQL|REST|YAML|CSV|PDF|SDK|IDE|CLI|GPT|LLM|TODO|NOTE)$/.test(w));
    if (capsWords.length >= 3) {
      score -= 8;
      findings.push(k('capsEmphasis'));
      suggestions.push(k('capsSugg'));
    }

    return { score: this._clamp(score), findings, suggestions };
  },

  _scoreRobustness(prompt, lang, signals) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.robustness.${id}`);

    // --- Positive signals (from shared signal map — no double counting) ---

    if (signals.errorHandling) {
      score += 12;
      findings.push(k('errorHandling'));
    }

    if (signals.edgeCases) {
      score += 12;
      findings.push(k('edgeCases'));
    }

    // Negative examples (counter-examples)
    if (/\b(bad example|mal ejemplo|incorrect|incorrecto|wrong|erróneo|what not to|lo que no|avoid.*like|evita.*como|negative example|ejemplo negativo|counterexample|contraejemplo)\b/i.test(lower)) {
      score += 8;
      findings.push(k('negativeExamples'));
    }

    // Conditional branching
    const conditionals = (lower.match(/\b(if|si|when|cuando|in case|en caso|unless|a menos que|depending|dependiendo|provided|siempre que)\b/gi) || []).length;
    if (conditionals >= 2) {
      score += 6;
      findings.push(k('conditionals'));
    }

    // Validation instructions (shared signal; no longer stacks with safety's verify)
    if (signals.validation) {
      score += 6;
      findings.push(k('validation'));
    }

    // --- Negative signals ---

    // No error handling in a long, complex prompt (threshold raised to 60)
    if (words.length > 60 && !signals.errorHandling) {
      score -= 12;
      findings.push(k('noErrorHandling'));
      suggestions.push(k('noErrorHandlingSugg'));
    }

    // No edge cases in a task-oriented prompt
    if (words.length > 25 && !signals.edgeCases) {
      score -= 10;
      findings.push(k('noEdgeCases'));
      suggestions.push(k('noEdgeCasesSugg'));
    }

    // Excessive negations (fragile prompt)
    const negations = (lower.match(/\b(don'?t|do not|never|avoid|no hagas|nunca|evita|jamás|prohibido|must not|should not|cannot)\b/gi) || []).length;
    if (negations >= 5) {
      score -= 8;
      findings.push(k('tooManyNegations'));
      suggestions.push(k('negationsSugg'));
    }

    return { score: this._clamp(score), findings, suggestions };
  },

  _scoreContext(prompt, lang, signals) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.context.${id}`);

    // --- Positive signals (strict role detection — no more "user persona" / "if you are") ---

    // Role defined
    if (signals.roleAssignment) {
      score += 12;
      findings.push(k('role'));
    }

    // Role + domain
    if (signals.roleWithDomain) {
      score += 8;
      findings.push(k('roleDomain'));
    }

    // Audience defined (strict: real audience markers, not "for a" / "user")
    if (signals.audienceDefined) {
      score += 10;
      findings.push(k('audience'));
    }

    // Tone specified
    if (/\b(tone|tono|formal|informal|casual|professional|profesional|friendly|amigable|serious|seri[oa]|humorous|humor|academic|académic|style|estilo|voice|voz|register|registro)\b/i.test(lower)) {
      score += 8;
      findings.push(k('tone'));
    }

    // Background context provided
    if (/\b(context|contexto|background|antecedentes|scenario|escenario|situation|situación|given that|dado que|considering|considerando|based on|basado en)\b/i.test(lower)) {
      score += 10;
      findings.push(k('background'));
    }

    // Domain expertise
    if (/\b(domain|dominio|field|campo|area|área|industry|industria|sector|discipline|disciplina|specialty|especialidad)\b/i.test(lower)) {
      score += 5;
      findings.push(k('domainExpertise'));
    }

    // --- Negative signals ---

    // No role in a long prompt
    if (words.length > 25 && !signals.roleAssignment) {
      score -= 10;
      findings.push(k('noRole'));
      suggestions.push(k('noRoleSugg'));
    }

    // No audience
    if (words.length > 20 && !signals.audienceDefined) {
      score -= 6;
      findings.push(k('noAudience'));
      suggestions.push(k('noAudienceSugg'));
    }

    // Assumes model knowledge
    if (/\b(as you know|como sabes|you already know|ya sabes|obviously|obviamente|as we discussed|como discutimos|remember|recuerda que)\b/i.test(lower)) {
      score -= 12;
      findings.push(k('assumesKnowledge'));
      suggestions.push(k('assumesKnowledgeSugg'));
    }

    // No tone for a writing task
    const writingTask = /\b(write|escribe|draft|redacta|compose|compón|create.*text|crea.*texto|article|artículo|blog|email|correo|letter|carta|report|informe|essay|ensayo)\b/i.test(lower);
    if (writingTask && !/\b(tone|tono|style|estilo|formal|informal|voice|voz)\b/i.test(lower)) {
      score -= 8;
      findings.push(k('noTone'));
      suggestions.push(k('noToneSugg'));
    }

    return { score: this._clamp(score), findings, suggestions };
  },

  _scoreOutputFormat(prompt, lang, signals) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.outputFormat.${id}`);

    // --- Positive signals (co-occurrence required to kill keyword gaming) ---

    // Explicit format request: only counts if a request verb + a format name co-occur.
    if (signals.requestsOutputFormat) {
      score += 15;
      findings.push(k('explicitFormat'));
    }

    // General format specification
    if (/\b(format|formato|structure|estructura|template|plantilla|schema|esquema|layout|disposición)\b/i.test(lower)) {
      score += 8;
      findings.push(k('generalFormat'));
    }

    // Output length specified (number + unit, shared signal)
    if (signals.hasNumericConstraint || /\b(brief|breve|concis[eo]|short|cort[oa]|detailed|detallad[oa]|comprehensive|exhaustiv[oa])\b/i.test(lower)) {
      score += 8;
      findings.push(k('length'));
    }

    // List/bullet format
    if (/\b(list|lista|bullet|viñeta|numbered|numerad|enumerate|enumera|itemize)\b/i.test(lower)) {
      score += 6;
      findings.push(k('listFormat'));
    }

    // Output language specified
    if (/\b(in english|en inglés|in spanish|en español|respond in|responde en|answer in|contesta en|write in|escribe en)\b/i.test(lower)) {
      score += 8;
      findings.push(k('language'));
    }

    // Example output provided (few-shot co-occurrence, not stray code blocks)
    if (signals.hasFewShot) {
      score += 8;
      findings.push(k('exampleOutput'));
    }

    // Schema or structure definition (real JSON object or XML pair, not just mentioning "json")
    if (/\{[\s\S]*"[^"]+"\s*:[\s\S]*\}/.test(prompt) || /<[a-z_]+>[\s\S]*<\/[a-z_]+>/i.test(prompt)) {
      score += 8;
      findings.push(k('schema'));
    }

    // --- Negative signals ---

    // No format in a complex prompt
    if (words.length > 25 && !signals.requestsOutputFormat && !/\b(format|formato|list|lista|table|tabla|markdown|template|plantilla|schema|structure|estructura)\b/i.test(lower)) {
      score -= 12;
      findings.push(k('noFormat'));
      suggestions.push(k('noFormatSugg'));
    }

    // No length indication
    if (words.length > 15 && !signals.hasNumericConstraint && !/\b(brief|breve|concis|short|cort|detailed|detallad|comprehensive|exhaustiv|one.liner|at most|como máximo|no more|no más|máximo|minimum|mínimo)\b/i.test(lower)) {
      score -= 6;
      findings.push(k('noLength'));
      suggestions.push(k('noLengthSugg'));
    }

    // No language specification in mixed-language prompt
    if (lang === 'mixed' && !/\b(respond in|responde en|answer in|contesta en|write in|escribe en|in english|en español)\b/i.test(lower)) {
      score -= 8;
      findings.push(k('noLangSpec'));
      suggestions.push(k('noLangSpecSugg'));
    }

    return { score: this._clamp(score), findings, suggestions };
  },

  _scoreChainOfThought(prompt, lang, signals) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.chainOfThought.${id}`);

    // --- Positive signals (capped to kill keyword-stuffing) ---

    // Explicit CoT request (shared signal; bonus reduced from +20 to +12).
    if (signals.hasStepByStep) {
      score += 12;
      findings.push(k('explicitCoT'));
    }

    // Modern techniques: ToT, ReAct, self-consistency, reflexion.
    if (signals.hasTreeOfThought) { score += 8; findings.push(I18n.t('analyzer.chainOfThought.treeOfThought')); }
    if (signals.hasReAct) { score += 8; findings.push(I18n.t('analyzer.chainOfThought.reactTechnique')); }
    if (signals.hasSelfConsistency) { score += 8; findings.push(I18n.t('analyzer.chainOfThought.selfConsistency')); }
    if (signals.hasReflexion) { score += 8; findings.push(I18n.t('analyzer.chainOfThought.reflexion')); }

    // Reasoning request
    if (/\b(explain.{0,15}reasoning|explica.{0,15}razonamiento|show.{0,10}work|muestra.{0,10}proceso|explain.{0,10}why|explica.{0,10}por qué|justify|justifica|walk.{0,10}through|guíame|reason through|razona)\b/i.test(lower)) {
      score += 10;
      findings.push(k('reasoning'));
    }

    // Sequential instructions (only count if there are 2+ markers, not lone "then")
    const seqMatches = (lower.match(/\b(first|primero|second|segundo|third|tercero|then|luego|next|siguiente|finally|finalmente|lastly|por último)\b/gi) || []).length;
    if (seqMatches >= 2) {
      score += 6;
      findings.push(k('sequence'));
    }

    // Decomposition instruction (stricter: must be a task instruction, not "list of components")
    if (/\b(break.{0,8}down|descompón|decompose|descomponer|divide.{0,8}(into|en|the (problem|task|issue)))\b/i.test(lower)) {
      score += 8;
      findings.push(k('decomposition'));
    }

    // Analysis framework
    if (/\b(pros.{0,8}cons|ventajas.{0,8}desventajas|compare.{0,8}contrast|compara.{0,8}contrasta|trade-?off|framework|marco|methodology|metodología)\b/i.test(lower)) {
      score += 6;
      findings.push(k('framework'));
    }

    // --- Negative signals ---

    // Complex reasoning without CoT (strict trigger terms, not "because"/"why")
    const complexReasoning = /\b(analyz|analiza|evaluat|evalúa|compar|decide|decid|reason|razon|por qué|impact|impacto|consequence|consecuencia|implication|implicación|debate|argue|argumenta)\b/i.test(lower);
    const anyCoTSignal = signals.hasStepByStep || signals.hasTreeOfThought || signals.hasReAct || signals.hasSelfConsistency || signals.hasReflexion;
    if (complexReasoning && !anyCoTSignal && !/\b(step|paso|think|piensa|explain|explica|break|descompón)\b/i.test(lower)) {
      score -= 12;
      findings.push(k('noCoT'));
      suggestions.push(k('noCoTSugg'));
    }

    // Multi-step task without sequence
    const multiStepIndicators = (lower.match(/\b(and then|y luego|after that|después de eso|followed by|seguido de|finally|finalmente)\b/gi) || []).length;
    if (multiStepIndicators >= 2 && !/\b(step|paso|1\.|2\.|first|primero|second|segundo)\b/i.test(lower) && !anyCoTSignal) {
      score -= 8;
      findings.push(k('noSequence'));
      suggestions.push(k('noSequenceSugg'));
    }

    // NOTE: the old "+10 simpleBonus" for short prompts was REMOVED — it
    // inflated scores of short prompts in a dimension that doesn't apply.

    return { score: this._clamp(score), findings, suggestions };
  },

  _scoreSafety(prompt, lang, signals) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.safety.${id}`);

    // --- Positive signals (strict anti-hallucination: requires explicit
    // anti-fabrication language, NOT just "verify" which is generic) ---

    // Anti-hallucination guardrails
    if (signals.antiHallucination) {
      score += 15;
      findings.push(k('antiHallucination'));
    }

    // Scope limitations (shared signal)
    if (signals.scopeLimit) {
      score += 10;
      findings.push(k('scope'));
    }

    // Injection guardrails (shared signal — real defensive negations, not "system prompt")
    if (signals.injectionGuard || signals.untrustedDelim) {
      score += 15;
      findings.push(k('injection'));
    }

    // Uncertainty acknowledgment
    if (/\b(if.{0,15}uncertain|si.{0,15}inciert|if.{0,15}don'?t know|si.{0,15}no sabes|acknowledge|reconoce|ask.{0,10}clarification|pide.{0,10}aclaración|low confidence|baja confianza)\b/i.test(lower)) {
      score += 8;
      findings.push(k('uncertainty'));
    }

    // Content restrictions
    if (/\b(do not include|no incluyas|avoid.{0,10}mention|evita.{0,10}mencionar|never.{0,10}share|nunca.{0,10}compartas|sensitive data|datos sensibles|confidential|confidencial|privacy|privacidad|PII|GDPR|HIPAA)\b/i.test(lower)) {
      score += 8;
      findings.push(k('contentRestrictions'));
    }

    // --- Negative signals ---

    // PII / secrets present in the prompt (critical privacy risk)
    if (signals.hasPII) {
      score -= 20;
      findings.push(I18n.t('analyzer.safety.piiLeak'));
      suggestions.push(I18n.t('analyzer.safety.piiLeakSugg'));
    }

    // Assumes capabilities the model doesn't have (live URLs, exact math, code exec)
    if (signals.assumesCapability) {
      score -= 12;
      findings.push(I18n.t('analyzer.safety.assumesCapability'));
      suggestions.push(I18n.t('analyzer.safety.assumesCapabilitySugg'));
    }

    // Post-cutoff knowledge required without grounding
    if (signals.postCutoffYear && !signals.hasRagContext) {
      score -= 10;
      findings.push(I18n.t('analyzer.safety.postCutoff'));
      suggestions.push(I18n.t('analyzer.safety.postCutoffSugg'));
    }

    // System-prompt-like without guardrails (uses shared signals)
    const isSystemLike = signals.systemPromptCue && words.length > 30;
    if (isSystemLike && !signals.injectionGuard && !signals.scopeLimit && !signals.untrustedDelim) {
      score -= 15;
      findings.push(k('noGuardrails'));
      suggestions.push(k('noGuardrailsSugg'));
    }

    // Factual request without grounding (strict: real factual terms only)
    if (signals.factualRequest && !signals.antiHallucination) {
      score -= 10;
      findings.push(k('noGrounding'));
      suggestions.push(k('noGroundingSugg'));
    }

    // No scope limits in a long prompt
    if (words.length > 40 && !signals.scopeLimit) {
      score -= 6;
      findings.push(k('noScope'));
      suggestions.push(k('noScopeSugg'));
    }

    return { score: this._clamp(score), findings, suggestions };
  },

  // =========================================================================
  // LEGACY SHIM HELPERS
  // Derive the flat shape (scores/detected/metrics/etc.) from the rich
  // dimension-based analysis, so Rewriter and ExportUtil keep working.
  // =========================================================================

  /**
   * Build a flat scores map { clarity, specificity, ..., overall }.
   * @private
   */
  _buildScores(dimensions, overall) {
    const scores = {};
    for (const [key, dim] of Object.entries(dimensions || {})) {
      scores[key] = dim?.score ?? 0;
    }
    scores.overall = overall;
    return scores;
  },

  /**
   * Build a boolean map of detected features, using best-practice IDs as
   * the source of truth plus a couple of direct regex checks.
   * @private
   */
  _buildDetected(prompt, patternResults, signals) {
    const strengthIds = new Set((patternResults?.strengths || []).map(s => s.id));
    const sig = signals || Signals.extract(prompt, 'en');

    return {
      hasRole:           strengthIds.has('BP004') || sig.roleAssignment,
      hasContext:        strengthIds.has('BP010'),
      hasExamples:       strengthIds.has('BP002') || sig.hasFewShot,
      hasOutputFormat:   strengthIds.has('BP003') || sig.requestsOutputFormat,
      hasGuardrails:     strengthIds.has('BP009') || sig.antiHallucination,
      hasXMLTags:        strengthIds.has('BP001') || sig.hasXMLTags,
      hasChainOfThought: strengthIds.has('BP005') || sig.hasStepByStep,
      hasErrorHandling:  strengthIds.has('BP006') || sig.errorHandling,
      hasVariables:      /\{\{[^}]+\}\}/.test(prompt),
      // New: modern techniques surfaced to consumers (Rewriter, exports).
      hasTreeOfThought:   sig.hasTreeOfThought,
      hasReAct:           sig.hasReAct,
      hasToolUse:         sig.hasToolUse,
      hasSelfConsistency: sig.hasSelfConsistency,
      hasReflexion:       sig.hasReflexion,
      hasRagContext:      sig.hasRagContext,
      hasInjectionGuard:  sig.injectionGuard,
      hasUntrustedDelim:  sig.untrustedDelim,
    };
  },

  /**
   * Infer the prompt's domain by keyword scoring (mirrors Rewriter logic).
   * @private
   */
  _inferDomain(prompt) {
    const lower = prompt.toLowerCase();
    const domainKeywords = {
      code:    ['código', 'code', 'programar', 'función', 'function', 'api', 'class', 'implementa', 'debug', 'bug', 'script', 'variable'],
      data:     ['datos', 'data', 'csv', 'sql', 'base de datos', 'análisis de datos', 'dashboard', 'dataset', 'estadístic'],
      writing: ['escribe', 'redacta', 'artículo', 'blog', 'contenido', 'email', 'carta', 'resumen', 'texto'],
      analysis:  ['analiza', 'evalúa', 'compara', 'investiga', 'revisa', 'sentimiento', 'clasifica'],
      education: ['explica', 'enseña', 'estudiante', 'curso', 'lección', 'aprend'],
      business:   ['negocio', 'empresa', 'ventas', 'marketing', 'cliente', 'estrategia', 'roi', 'kpi'],
    };

    let bestDomain = 'general';
    let bestScore = 0;
    for (const [domain, keywords] of Object.entries(domainKeywords)) {
      const score = keywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0);
      if (score > bestScore) {
        bestScore = score;
        bestDomain = domain;
      }
    }
    return bestDomain;
  },

  /**
   * Build a metrics snapshot from the raw prompt text.
   * @private
   */
  _buildMetrics(prompt) {
    const words = prompt.split(/\s+/).filter(Boolean);
    const lines = prompt.split('\n');
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const xmlSections = (prompt.match(/<[a-z_]+>[\s\S]*?<\/[a-z_]+>/gi) || []).length;
    const variables = (prompt.match(/\{\{[^}]+\}\}/g) || []).length;

    return {
      wordCount: words.length,
      charCount: prompt.length,
      lineCount: lines.length,
      sentenceCount: sentences.length,
      avgWordsPerSentence: sentences.length > 0 ? Math.round((words.length / sentences.length) * 10) / 10 : 0,
      readabilityLevel: this._readabilityLevel(words.length, sentences.length),
      xmlSections,
      variableCount: variables,
    };
  },

  /**
   * Rough readability band based on average words per sentence.
   * @private
   */
  _readabilityLevel(wordCount, sentenceCount) {
    if (sentenceCount === 0) return I18n.t('readability.empty');
    const avg = wordCount / sentenceCount;
    if (avg <= 12) return I18n.t('readability.easy');
    if (avg <= 20) return I18n.t('readability.medium');
    return I18n.t('readability.dense');
  },

  /**
   * Flatten per-dimension suggestions and anti-pattern suggestions into a
   * single prioritised list for the export reports.
   * @private
   */
  _flattenSuggestions(dimensions, patternResults) {
    const out = [];
    const seen = new Set();

    const push = (priority, title, description) => {
      const key = title + '|' + description;
      if (seen.has(key)) return;
      seen.add(key);
      out.push({ priority, title, description });
    };

    // Anti-patterns → high/medium priority by severity
    const sevToPriority = { critical: 'high', high: 'high', medium: 'medium', low: 'low' };
    for (const ap of patternResults?.antiPatterns || []) {
      push(sevToPriority[ap.severity] || 'medium', ap.name, ap.suggestion);
    }

    // Per-dimension suggestions → medium priority
    const dimKeys = ['clarity', 'specificity', 'structure', 'robustness', 'context', 'outputFormat', 'chainOfThought', 'safety'];
    for (const key of dimKeys) {
      const dim = dimensions?.[key];
      const label = I18n.t(`dimensions.${key}`);
      for (const s of dim?.suggestions || []) {
        push('medium', label, s);
      }
    }

    return out;
  },

  // =========================================================================
  // HELPER METHODS
  // =========================================================================

  /**
   * Detect the primary language of the prompt.
   */
  _detectLanguage(prompt) {
    const lower = prompt.toLowerCase();
    // Note: "no", "si", "son", "hay" excluded from ES set — they are common in EN too
    // ("no more", "yes/no", "son of", "hay" surname/word) and cause false positives.
    const esIndicators = (lower.match(/\b(el|la|los|las|un|una|que|por|para|con|como|pero|este|esta|del|más|también|puede|tiene|hace|donde|cuando|porque|todos|entre|sobre|desde|ser|estar|haber|muy|sus|otro|otra|cada|esto|eso|fue|sido|sin|antes|después|aquí|ahí|así|ya|ni|sólo|se)\b/g) || []).length;
    const enIndicators = (lower.match(/\b(the|is|are|was|were|have|has|had|with|this|that|from|they|been|which|would|their|will|each|about|how|when|where|what|could|should|these|those|into|than|its|only|other|some|such|just|also|after|before|being|both|between|because|under|over|must|may|can|our|your)\b/g) || []).length;

    const total = esIndicators + enIndicators;
    if (total === 0) return 'en'; // default

    const esRatio = esIndicators / total;
    if (esRatio > 0.65) return 'es';
    if (esRatio < 0.35) return 'en';
    return 'mixed';
  },

  /**
   * Rough token estimate (words × 1.3).
   */
  _estimateTokens(prompt) {
    const wordCount = prompt.split(/\s+/).filter(Boolean).length;
    return Math.round(wordCount * 1.3);
  },

  /**
   * Map a numeric score to a letter grade.
   */
  _gradeFromScore(score) {
    if (score >= 95) return 'A+';
    if (score >= 90) return 'A';
    if (score >= 85) return 'A-';
    if (score >= 80) return 'B+';
    if (score >= 75) return 'B';
    if (score >= 70) return 'B-';
    if (score >= 65) return 'C+';
    if (score >= 60) return 'C';
    if (score >= 55) return 'C-';
    if (score >= 50) return 'D+';
    if (score >= 45) return 'D';
    if (score >= 40) return 'D-';
    return 'F';
  },

  /**
   * Classify prompt complexity.
   */
  _classifyComplexity(prompt, wordCount, dimensions) {
    let complexityScore = 0;

    // Word count factor
    if (wordCount > 200) complexityScore += 3;
    else if (wordCount > 80) complexityScore += 2;
    else if (wordCount > 30) complexityScore += 1;

    // Structure usage
    if (dimensions.structure.score > 70) complexityScore += 1;

    // Multiple dimensions engaged
    const highDimensions = Object.values(dimensions).filter(d => d.findings.length >= 2).length;
    if (highDimensions >= 5) complexityScore += 2;
    else if (highDimensions >= 3) complexityScore += 1;

    // Technical patterns
    if (/```|<[a-z_]+>|json|xml|api|function|class|def |const |let |var /i.test(prompt)) {
      complexityScore += 1;
    }

    if (complexityScore >= 5) return 'advanced';
    if (complexityScore >= 2) return 'intermediate';
    return 'basic';
  },

  /**
   * Clamp a value between 0 and 100.
   */
  _clamp(value) {
    return Math.max(0, Math.min(100, Math.round(value)));
  },

  /**
   * Return an empty/default result for invalid input.
   */
  _emptyResult() {
    const emptyFinding = I18n.t('analyzer.empty.finding');
    const emptySuggestion = I18n.t('analyzer.empty.sugg');
    const emptyDim = { score: 0, findings: [emptyFinding], suggestions: [emptySuggestion] };
    const dimensions = {
      clarity: { ...emptyDim },
      specificity: { ...emptyDim },
      structure: { ...emptyDim },
      robustness: { ...emptyDim },
      context: { ...emptyDim },
      outputFormat: { ...emptyDim },
      chainOfThought: { ...emptyDim },
      safety: { ...emptyDim },
    };
    const patternResults = { antiPatterns: [], strengths: [] };
    return {
      overallScore: 0,
      grade: 'F',
      complexity: 'basic',
      tokenEstimate: 0,
      wordCount: 0,
      charCount: 0,
      dimensions,
      antiPatterns: [],
      strengths: [],
      language: 'en',
      // New
      promptType: 'general',
      promptTypeLabel: I18n.t('promptType.general') || 'general',
      weightsUsed: { ...Signals.weightsFor('general') },
      // Legacy shim
      prompt: '',
      scores: this._buildScores(dimensions, 0),
      detected: this._buildDetected('', patternResults),
      detectedDomain: 'general',
      metrics: this._buildMetrics(''),
      tokens: { estimated: 0, model: '~GPT tokenizer', cost: null },
      suggestions: this._flattenSuggestions(dimensions, patternResults),
    };
  },
};
