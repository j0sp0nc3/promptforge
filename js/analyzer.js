// ============================================================================
// PromptForge — Core Analysis Engine
// Scores prompts across 8 dimensions with bilingual (EN/ES) support
// ============================================================================

const Analyzer = {

  // Dimension weights for overall score
  _weights: {
    clarity:        0.18,
    specificity:    0.15,
    structure:      0.13,
    robustness:     0.12,
    context:        0.12,
    outputFormat:   0.12,
    chainOfThought: 0.10,
    safety:         0.08,
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

    // Score each dimension
    const dimensions = {
      clarity:        this._scoreClarity(trimmed, lang),
      specificity:    this._scoreSpecificity(trimmed, lang),
      structure:      this._scoreStructure(trimmed, lang),
      robustness:     this._scoreRobustness(trimmed, lang),
      context:        this._scoreContext(trimmed, lang),
      outputFormat:   this._scoreOutputFormat(trimmed, lang),
      chainOfThought: this._scoreChainOfThought(trimmed, lang),
      safety:         this._scoreSafety(trimmed, lang),
    };

    // Weighted average
    let overallScore = 0;
    for (const [dim, weight] of Object.entries(this._weights)) {
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
      // ── Legacy-compatible shim (derived from the data above) ───────────
      // Consumers like Rewriter and ExportUtil expect a "flat" shape. These
      // fields are derived so a single source of truth stays in dimensions.
      prompt: trimmed,
      scores: this._buildScores(dimensions, overallScore),
      detected: this._buildDetected(trimmed, patternResults),
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

  _scoreClarity(prompt, lang) {
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
      score += 10;
      findings.push(k('useActionVerbs'));
    }
    if (verbMatches.length >= 3) {
      score += 5;
    }

    // Clear sentence structure (not just fragments)
    const sentences = prompt.split(/[.!?]+/).filter(s => s.trim().length > 5);
    if (sentences.length >= 2) {
      score += 8;
      findings.push(k('multipleSentences'));
    }

    // No ambiguous pronouns without antecedents
    const ambiguousPronouns = /\b(it|this|that|they|them|these|those|eso|esto|ello|ellos|aquello)\b/gi;
    const pronounMatches = lower.match(ambiguousPronouns) || [];
    if (pronounMatches.length === 0 && words.length > 10) {
      score += 5;
      findings.push(k('avoidsPronouns'));
    }

    // --- Negative signals ---

    // Vague qualifiers
    const vagueQualifiers = /\b(somehow|de alguna manera|kind of|tipo de|sort of|más o menos|maybe|quizás|tal vez|probably|probablemente|possibly|posiblemente|somewhat|algo así|a bit|un poco|rather|bastante|pretty much|pretty)\b/gi;
    const vagueCount = (lower.match(vagueQualifiers) || []).length;
    if (vagueCount >= 2) {
      score -= 12;
      findings.push(I18n.t('analyzer.clarity.vagueCount', { n: vagueCount }));
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

    // Contradictory instructions (from AP004 logic)
    const contradictions = [
      [/\b(brief|breve|concis[eo]|short)\b/i, /\b(detailed|detallad|elaborate|exhaustiv)\b/i],
      [/\b(creativ|imaginat)\b/i, /\b(strict|exactamente|precisely|preciso)\b/i],
      [/\b(formal|profesional)\b/i, /\b(casual|informal|coloquial)\b/i],
    ];
    if (contradictions.some(([a, b]) => a.test(lower) && b.test(lower))) {
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

  _scoreSpecificity(prompt, lang) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.specificity.${id}`);

    // --- Positive signals ---

    // Numbers and quantitative constraints
    const numbers = prompt.match(/\b\d+\b/g) || [];
    if (numbers.length >= 2) {
      score += 12;
      findings.push(k('numeric'));
    } else if (numbers.length === 1) {
      score += 5;
    }

    // Specific entities (proper nouns, technical terms)
    const properNouns = prompt.match(/\b[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(?:\s[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+)*\b/g) || [];
    if (properNouns.length >= 3) {
      score += 8;
      findings.push(k('entities'));
    }

    // Success criteria
    if (/\b(criteria|criterio|must include|debe incluir|should contain|debe contener|requirement|requisito|expected|esperad|quality|calidad)\b/i.test(lower)) {
      score += 10;
      findings.push(k('criteria'));
    }

    // Examples provided
    if (/\b(example|ejemplo|e\.g\.|for instance|por ejemplo|sample|muestra)\b/i.test(lower) || /```/.test(prompt) || /→|->|=>/.test(prompt)) {
      score += 12;
      findings.push(k('examples'));
    }

    // Measurable criteria
    if (/\b(at least|al menos|no more than|no más de|between|entre|maximum|máximo|minimum|mínimo|exactly|exactamente|up to|hasta|at most|como máximo|como mínimo)\b/i.test(lower)) {
      score += 8;
      findings.push(k('measurable'));
    }

    // --- Negative signals ---

    // Vague adjectives
    const vagueAdj = lower.match(/\b(good|bueno|nice|bonito|better|mejor|appropriate|adecuado|interesting|interesante|great|genial|amazing|increíble|cool|relevant|relevante)\b/gi) || [];
    if (vagueAdj.length >= 2) {
      score -= 10;
      findings.push(I18n.t('analyzer.specificity.vagueAdj', { n: vagueAdj.length }));
      suggestions.push(k('vagueAdjSugg'));
    }

    // "etc." and open-ended
    if (/\b(etc\.?|etcétera|and so on|y demás|y así sucesivamente|among others|entre otros)\b/i.test(lower)) {
      score -= 8;
      findings.push(k('etc'));
      suggestions.push(k('etcSugg'));
    }

    // No constraints at all in a long prompt
    if (words.length > 30 && numbers.length === 0 && !/\b(must|should|need|require|debe|necesita|requiere)\b/i.test(lower)) {
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

  _scoreStructure(prompt, lang) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const words = prompt.split(/\s+/).filter(Boolean);
    const lines = prompt.split('\n');
    const k = (id) => I18n.t(`analyzer.structure.${id}`);

    // --- Positive signals ---

    // XML tags
    const xmlOpen = (prompt.match(/<[a-z_]+>/gi) || []).length;
    const xmlClose = (prompt.match(/<\/[a-z_]+>/gi) || []).length;
    if (xmlOpen >= 2 && xmlClose >= 1) {
      score += 15;
      findings.push(k('xmlTags'));
    }

    // Markdown headers
    const headers = (prompt.match(/^#{1,6}\s/gm) || []).length;
    if (headers >= 2) {
      score += 12;
      findings.push(k('headers'));
    }

    // Numbered lists
    const numbered = (prompt.match(/^\s*\d+[\.\)]\s/gm) || []).length;
    if (numbered >= 3) {
      score += 12;
      findings.push(k('numbered'));
    } else if (numbered >= 1) {
      score += 5;
    }

    // Bullet points
    const bullets = (prompt.match(/^\s*[-*•]\s/gm) || []).length;
    if (bullets >= 3) {
      score += 10;
      findings.push(k('bullets'));
    }

    // Separators
    const separators = (prompt.match(/^(---+|\*{3,}|={3,})$/gm) || []).length;
    if (separators >= 1) {
      score += 5;
      findings.push(k('separators'));
    }

    // Code blocks
    const codeBlocks = (prompt.match(/```/g) || []).length;
    if (codeBlocks >= 2) {
      score += 8;
      findings.push(k('codeBlocks'));
    }

    // Line breaks for readability
    if (lines.length >= 5 && words.length > 30) {
      score += 5;
      findings.push(k('lineBreaks'));
    }

    // --- Negative signals ---

    // Long prompt without any structure
    if (words.length > 60 && xmlOpen === 0 && headers === 0 && numbered === 0 && bullets === 0 && separators === 0) {
      score -= 20;
      findings.push(k('noStructure'));
      suggestions.push(k('noStructureSugg'));
    }

    // Single block of text
    if (words.length > 40 && lines.length <= 2) {
      score -= 15;
      findings.push(k('singleBlock'));
      suggestions.push(k('singleBlockSugg'));
    }

    // Multiple tasks without structure
    const taskSwitchers = (prompt.toLowerCase().match(/\b(also|además|then|luego|after|después|and also|y también|next|plus|additionally|adicionalmente)\b/gi) || []).length;
    if (taskSwitchers >= 3 && numbered === 0 && bullets === 0) {
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

  _scoreRobustness(prompt, lang) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.robustness.${id}`);

    // --- Positive signals ---

    // Error handling
    if (/\b(if.*invalid|si.*inválid|if.*error|si.*error|when.*fail|cuando.*fall|fallback|por defecto|default|handle|manejar|otherwise|de lo contrario|if.*not|si.*no )\b/i.test(lower)) {
      score += 12;
      findings.push(k('errorHandling'));
    }

    // Edge cases
    if (/\b(edge case|caso borde|caso límite|special case|caso especial|what if|qué pasa si|corner case|unusual|inusual|unexpected|inesperado|empty|vacío|null|missing|faltante)\b/i.test(lower)) {
      score += 12;
      findings.push(k('edgeCases'));
    }

    // Negative examples
    if (/\b(bad example|mal ejemplo|incorrect|incorrecto|wrong|erróneo|what not to|lo que no|avoid.*like|evita.*como|negative example|ejemplo negativo|counterexample|contraejemplo)\b/i.test(lower)) {
      score += 10;
      findings.push(k('negativeExamples'));
    }

    // Conditional branching
    const conditionals = (lower.match(/\b(if|si|when|cuando|in case|en caso|unless|a menos que|depending|dependiendo|provided|siempre que)\b/gi) || []).length;
    if (conditionals >= 2) {
      score += 8;
      findings.push(k('conditionals'));
    }

    // Validation instructions
    if (/\b(validate|valida|verify|verifica|check|comprueba|ensure|asegúrate|confirm|confirma|double.check|revisa)\b/i.test(lower)) {
      score += 8;
      findings.push(k('validation'));
    }

    // --- Negative signals ---

    // No error handling in a complex prompt
    if (words.length > 30 && !/\b(if|si|when|cuando|error|invalid|inválid|otherwise|contrario|handle|manejar|fallback|default)\b/i.test(lower)) {
      score -= 15;
      findings.push(k('noErrorHandling'));
      suggestions.push(k('noErrorHandlingSugg'));
    }

    // No edge cases in a task-oriented prompt
    if (words.length > 25 && !/\b(edge|borde|límite|special|especial|unusual|inusual|empty|vacío|null|missing|falt)\b/i.test(lower)) {
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

  _scoreContext(prompt, lang) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.context.${id}`);

    // --- Positive signals ---

    // Role defined
    if (/\b(you are|act as|eres|actúa como|role|rol|persona|behave as|compórtate como)\b/i.test(lower)) {
      score += 12;
      findings.push(k('role'));
    }

    // Role + domain
    if (/\b(you are|eres|act as|actúa como)\b/i.test(lower) && /\b(in |en |of |de |specialized|especializado|expert.*in|experto.*en|with.*experience|con.*experiencia)\b/i.test(lower)) {
      score += 8;
      findings.push(k('roleDomain'));
    }

    // Audience defined
    if (/\b(audience|audiencia|público|reader|lector|user|usuario|student|estudiante|developer|desarrollador|manager|gerente|client|cliente|beginner|principiante|for a|para un[oa]?|aimed at|dirigido a|intended for|destinado a|written for|escrito para)\b/i.test(lower)) {
      score += 12;
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
    if (words.length > 25 && !/\b(you are|act as|eres|actúa como|role|rol|persona)\b/i.test(lower)) {
      score -= 10;
      findings.push(k('noRole'));
      suggestions.push(k('noRoleSugg'));
    }

    // No audience
    if (words.length > 20 && !/\b(audience|audiencia|público|reader|lector|for a|para un|user|usuario|client|cliente|student|estudiante|aimed|dirigido|intended|destinado)\b/i.test(lower)) {
      score -= 8;
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
      score -= 10;
      findings.push(k('noTone'));
      suggestions.push(k('noToneSugg'));
    }

    return { score: this._clamp(score), findings, suggestions };
  },

  _scoreOutputFormat(prompt, lang) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.outputFormat.${id}`);

    // --- Positive signals ---

    // Explicit format
    if (/\b(json|xml|csv|yaml|html|markdown|table|tabla)\b/i.test(lower)) {
      score += 15;
      findings.push(k('explicitFormat'));
    }

    // General format specification
    if (/\b(format|formato|structure|estructura|template|plantilla|schema|esquema|layout|disposición)\b/i.test(lower)) {
      score += 10;
      findings.push(k('generalFormat'));
    }

    // Output length specified
    if (/\b(\d+\s*(words|palabras|sentences|oraciones|paragraphs|párrafos|lines|líneas|characters|caracteres))\b/i.test(lower) ||
        /\b(brief|breve|concis[eo]|short|cort[oa]|detailed|detallad[oa]|comprehensive|exhaustiv[oa])\b/i.test(lower)) {
      score += 10;
      findings.push(k('length'));
    }

    // List/bullet format
    if (/\b(list|lista|bullet|viñeta|numbered|numerad|enumerate|enumera|itemize)\b/i.test(lower)) {
      score += 8;
      findings.push(k('listFormat'));
    }

    // Output language specified
    if (/\b(in english|en inglés|in spanish|en español|respond in|responde en|answer in|contesta en|write in|escribe en)\b/i.test(lower)) {
      score += 8;
      findings.push(k('language'));
    }

    // Example output provided
    if (/\b(example output|ejemplo de salida|expected output|salida esperada|sample response|respuesta ejemplo|like this|como esto|here'?s.*format|aquí.*formato)\b/i.test(lower) || /```/.test(prompt)) {
      score += 10;
      findings.push(k('exampleOutput'));
    }

    // Schema or structure definition
    if (/\{[\s\S]*"[^"]+"\s*:[\s\S]*\}/.test(prompt) || /<[a-z_]+>[\s\S]*<\/[a-z_]+>/i.test(prompt)) {
      score += 8;
      findings.push(k('schema'));
    }

    // --- Negative signals ---

    // No format in a complex prompt
    if (words.length > 25 && !/\b(format|formato|json|xml|csv|list|lista|table|tabla|markdown|bullet|template|plantilla|schema|structure|estructura)\b/i.test(lower)) {
      score -= 15;
      findings.push(k('noFormat'));
      suggestions.push(k('noFormatSugg'));
    }

    // No length indication
    if (words.length > 15 && !/\b(\d+\s*(words|palabras)|brief|breve|concis|short|cort|detailed|detallad|comprehensive|exhaustiv|one.liner|at most|como máximo|no more|no más|máximo|minimum|mínimo)\b/i.test(lower)) {
      score -= 8;
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

  _scoreChainOfThought(prompt, lang) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.chainOfThought.${id}`);

    // --- Positive signals ---

    // Explicit CoT request
    if (/\b(step.by.step|paso a paso|think.*through|piensa.*detenidamente|chain of thought|cadena de pensamiento|let'?s think|pensemos|think carefully|piensa cuidadosamente)\b/i.test(lower)) {
      score += 20;
      findings.push(k('explicitCoT'));
    }

    // Reasoning request
    if (/\b(explain.*reasoning|explica.*razonamiento|show.*work|muestra.*proceso|explain.*why|explica.*por qué|justify|justifica|walk.*through|guíame|reason through|razona)\b/i.test(lower)) {
      score += 12;
      findings.push(k('reasoning'));
    }

    // Sequential instructions
    if (/\b(first|primero|second|segundo|third|tercero|then|luego|next|siguiente|finally|finalmente|lastly|por último|after|después|before|antes)\b/i.test(lower)) {
      score += 8;
      findings.push(k('sequence'));
    }

    // Decomposition instruction
    if (/\b(break.*down|descompón|decompose|descomponer|divide.*into|divide.*en|sub.?tasks|sub.?tareas|components|componentes|parts|partes)\b/i.test(lower)) {
      score += 10;
      findings.push(k('decomposition'));
    }

    // Analysis framework
    if (/\b(pros.*cons|ventajas.*desventajas|compare.*contrast|compara.*contrasta|trade-?off|criteria|criterio|framework|marco|methodology|metodología|approach|enfoque)\b/i.test(lower)) {
      score += 8;
      findings.push(k('framework'));
    }

    // --- Negative signals ---

    // Complex reasoning without CoT
    const complexReasoning = /\b(analyz|analiza|evaluat|evalúa|compar|decide|decid|reason|razon|why|por qué|cause|causa|impact|impacto|consequence|consecuencia|implication|implicación|debate|argue|argumenta)\b/i.test(lower);
    if (complexReasoning && !/\b(step|paso|think|piensa|reason|razón|explain|explica|break|descompón)\b/i.test(lower)) {
      score -= 15;
      findings.push(k('noCoT'));
      suggestions.push(k('noCoTSugg'));
    }

    // Multi-step task without sequence
    const multiStepIndicators = (lower.match(/\b(and then|y luego|after that|después de eso|followed by|seguido de|finally|finalmente|then|entonces)\b/gi) || []).length;
    if (multiStepIndicators >= 2 && !/\b(step|paso|1\.|2\.|first|primero|second|segundo)\b/i.test(lower)) {
      score -= 10;
      findings.push(k('noSequence'));
      suggestions.push(k('noSequenceSugg'));
    }

    // Simple prompt (bonus: doesn't need CoT)
    if (words.length < 20 && !complexReasoning) {
      score += 10;
      findings.push(k('simpleBonus'));
    }

    return { score: this._clamp(score), findings, suggestions };
  },

  _scoreSafety(prompt, lang) {
    let score = 50;
    const findings = [];
    const suggestions = [];
    const lower = prompt.toLowerCase();
    const words = lower.split(/\s+/).filter(Boolean);
    const k = (id) => I18n.t(`analyzer.safety.${id}`);

    // --- Positive signals ---

    // Anti-hallucination guardrails
    if (/\b(don'?t make up|no inventes|don'?t fabricate|no fabriques|cite.*source|cita.*fuente|if.*unsure|si.*segur|verify|verifica|factual|evidence|evidencia|stick to facts|apégate a los hechos|do not hallucinate|no speculate|no especules|only.*verified|solo.*verificad)\b/i.test(lower)) {
      score += 15;
      findings.push(k('antiHallucination'));
    }

    // Scope limitations
    if (/\b(scope|alcance|only.*about|solo.*sobre|limited to|limitado a|restricted|restringido|focus.*on|enfócate.*en|stay.*within|mantente.*dentro|do not go beyond|no vayas más allá|boundaries|límites)\b/i.test(lower)) {
      score += 12;
      findings.push(k('scope'));
    }

    // Injection guardrails
    if (/\b(ignore.*previous|ignora.*anterior|do not follow|no sigas|guardrail|protección|system prompt|prompt del sistema|do not reveal|no reveles|maintain.*role|mantén.*rol|stay in character|mantén.*personaje)\b/i.test(lower)) {
      score += 15;
      findings.push(k('injection'));
    }

    // Uncertainty acknowledgment
    if (/\b(if.*uncertain|si.*inciert|if.*don'?t know|si.*no sabes|acknowledge|reconoce|clarify|clarifica|ask.*clarification|pide.*aclaración|confidence|confianza|certainty|certeza)\b/i.test(lower)) {
      score += 10;
      findings.push(k('uncertainty'));
    }

    // Content restrictions
    if (/\b(do not include|no incluyas|avoid.*mention|evita.*mencionar|never.*share|nunca.*compartas|sensitive|sensible|confidential|confidencial|privacy|privacidad|appropriate|apropiado)\b/i.test(lower)) {
      score += 8;
      findings.push(k('contentRestrictions'));
    }

    // --- Negative signals ---

    // System-prompt-like without guardrails
    if (words.length > 30 && /\b(you are|eres|act as|actúa como|role|rol|system|sistema)\b/i.test(lower) &&
        !/\b(guardrail|protección|scope|alcance|boundary|límite|restrict|restrin|ignore.*previous|do not reveal|no reveles)\b/i.test(lower)) {
      score -= 15;
      findings.push(k('noGuardrails'));
      suggestions.push(k('noGuardrailsSugg'));
    }

    // Factual request without grounding
    if (/\b(fact|hecho|statistic|estadística|data|dato|research|investigación|number|número|date|fecha|year|año|who|quién|when|cuándo|history|historia|scientific|científic)\b/i.test(lower) &&
        !/\b(cite|cita|source|fuente|reference|referencia|verify|verifica|based on|basado en|evidence|evidencia|if.*unsure|si.*segur)\b/i.test(lower)) {
      score -= 12;
      findings.push(k('noGrounding'));
      suggestions.push(k('noGroundingSugg'));
    }

    // No scope limits in a long prompt
    if (words.length > 40 && !/\b(scope|alcance|only|solo|limited|limitado|focus|enfoca|restrict|restrin|within|dentro|boundary|límite)\b/i.test(lower)) {
      score -= 8;
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
  _buildDetected(prompt, patternResults) {
    const strengthIds = new Set((patternResults?.strengths || []).map(s => s.id));
    const lower = prompt.toLowerCase();

    return {
      hasRole:           strengthIds.has('BP004') || /\b(you are|act as|eres|actúa como)\b/i.test(lower),
      hasContext:        strengthIds.has('BP010'),
      hasExamples:       strengthIds.has('BP002'),
      hasOutputFormat:   strengthIds.has('BP003'),
      hasGuardrails:     strengthIds.has('BP009'),
      hasXMLTags:        strengthIds.has('BP001'),
      hasChainOfThought: strengthIds.has('BP005'),
      hasErrorHandling:  strengthIds.has('BP006'),
      hasVariables:      /\{\{[^}]+\}\}/.test(prompt),
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
