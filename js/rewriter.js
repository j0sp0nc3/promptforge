// ============================================================================
// PromptForge - Prompt Rewriter / Improver
// Intelligent prompt restructuring with targeted improvements
// ============================================================================

const Rewriter = {

  /**
   * Main entry: takes original prompt + analysis, returns improved version.
   * @param {string} prompt - Original prompt text
   * @param {Object} analysis - Analysis result from the analyzer (scores, detected features, etc.)
   * @returns {{ improvedPrompt: string, changes: Array, scoreImprovement: number }}
   */
  improve(prompt, analysis) {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return {
        improvedPrompt: prompt || '',
        changes: [],
        scoreImprovement: 0
      };
    }

    const changes = [];
    let working = prompt.trim();
    const scores = analysis?.scores || {};
    const detected = analysis?.detected || {};
    const overallScore = analysis?.overallScore ?? this._estimateBaseScore(working);

    // ── Step 1: Add XML structure if missing ────────────────────────────
    if (!detected.hasXMLTags && !this._hasXMLStructure(working)) {
      working = this._addMissingStructure(working, analysis);
      changes.push({
        type: 'restructured',
        description: I18n.t('rewriterChanges.structure')
      });
    }

    // ── Step 2: Add role if missing ─────────────────────────────────────
    if (!this._hasSection(working, 'rol') && !detected.hasRole) {
      working = this._addRole(working, analysis);
      changes.push({
        type: 'added',
        description: I18n.t('rewriterChanges.role')
      });
    }

    // ── Step 3: Add output format if missing ────────────────────────────
    if (!this._hasSection(working, 'formato_salida') && !detected.hasOutputFormat) {
      working = this._addOutputFormat(working, analysis);
      changes.push({
        type: 'added',
        description: I18n.t('rewriterChanges.outputFormat')
      });
    }

    // ── Step 4: Add guardrails if missing ───────────────────────────────
    if (!this._hasSection(working, 'restricciones') && !detected.hasGuardrails) {
      working = this._addMissingGuardrails(working, analysis);
      changes.push({
        type: 'added',
        description: I18n.t('rewriterChanges.guardrails')
      });
    }

    // ── Step 5: Add examples if missing ─────────────────────────────────
    if (!this._hasSection(working, 'ejemplos') && !detected.hasExamples) {
      working = this._addExamples(working, analysis);
      changes.push({
        type: 'added',
        description: I18n.t('rewriterChanges.examples')
      });
    }

    // ── Step 6: Add chain-of-thought if appropriate ─────────────────────
    if (this._needsChainOfThought(working, analysis)) {
      working = this._addChainOfThought(working, analysis);
      changes.push({
        type: 'added',
        description: I18n.t('rewriterChanges.cot')
      });
    }

    // ── Step 7: Add error handling if missing ───────────────────────────
    if (!this._hasSection(working, 'manejo_errores') && !detected.hasErrorHandling) {
      working = this._addErrorHandling(working, analysis);
      changes.push({
        type: 'added',
        description: I18n.t('rewriterChanges.errors')
      });
    }

    // ── Step 8: Final restructure for logical ordering ──────────────────
    const reordered = this._restructure(working);
    if (reordered !== working) {
      working = reordered;
      changes.push({
        type: 'restructured',
        description: I18n.t('rewriterChanges.restructure')
      });
    }

    // ── Calculate score improvement ─────────────────────────────────────
    // _estimateScoreImprovement returns a delta (improvement points), already
    // capped by the available headroom. We expose the delta directly so the
    // UI can show "+N pts" instead of the projected final score.
    const scoreImprovement = this._estimateScoreImprovement(changes, overallScore);

    return {
      improvedPrompt: working,
      changes,
      scoreImprovement: Math.max(0, Math.round(scoreImprovement))
    };
  },

  // ════════════════════════════════════════════════════════════════════════
  // Structural transformation methods
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Wraps an unstructured prompt in XML tag sections by analysing content.
   * @private
   */
  _addMissingStructure(prompt, analysis) {
    const parts = this._decomposePrompt(prompt);

    let structured = '';

    if (parts.role) {
      structured += `<rol>\n${parts.role.trim()}\n</rol>\n\n`;
    }

    if (parts.context) {
      structured += `<contexto>\n${parts.context.trim()}\n</contexto>\n\n`;
    }

    structured += `<tarea>\n${parts.task.trim()}\n</tarea>`;

    if (parts.format) {
      structured += `\n\n<formato_salida>\n${parts.format.trim()}\n</formato_salida>`;
    }

    if (parts.constraints) {
      structured += `\n\n<restricciones>\n${parts.constraints.trim()}\n</restricciones>`;
    }

    if (parts.examples) {
      structured += `\n\n<ejemplos>\n${parts.examples.trim()}\n</ejemplos>`;
    }

    return structured;
  },

  /**
   * Decomposes unstructured text into probable sections by heuristic analysis.
   * @private
   */
  _decomposePrompt(prompt) {
    const lines = prompt.split('\n');
    const parts = { role: '', context: '', task: '', format: '', constraints: '', examples: '' };

    // Heuristic patterns for section detection
    const rolePatterns = /^(eres|actúa como|tu rol|eres un|you are|act as|tu eres|serás)/i;
    const contextPatterns = /^(contexto|context|background|dado que|teniendo en cuenta|se te proporciona)/i;
    const formatPatterns = /^(responde en|formato|output|devuelve|responde con|genera un|el resultado|la salida)/i;
    const constraintPatterns = /^(no |nunca|evita|restricci|importante|regla|asegúrate|siempre|solo |sólo |limitación|prohibido|debe[s]? )/i;
    const examplePatterns = /^(ejemplo|por ejemplo|e\.g\.|input:|output:|entrada:|salida:)/i;

    let currentSection = 'task'; // default bucket

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      // Detect role sentences
      if (rolePatterns.test(trimmed)) {
        currentSection = 'role';
      } else if (contextPatterns.test(trimmed)) {
        currentSection = 'context';
      } else if (formatPatterns.test(trimmed)) {
        currentSection = 'format';
      } else if (constraintPatterns.test(trimmed) && parts.task.trim()) {
        // Only route to constraints once we have captured a task line,
        // otherwise leading restrictions would be misclassified.
        currentSection = 'constraints';
      } else if (examplePatterns.test(trimmed)) {
        currentSection = 'examples';
      }

      parts[currentSection] += trimmed + '\n';
    }

    // If nothing ended up in role or context, at least task should have content
    if (!parts.task.trim()) {
      parts.task = prompt;
    }

    return parts;
  },

  /**
   * Add a contextual role definition based on detected domain.
   * @private
   */
  _addRole(prompt, analysis) {
    const domain = analysis?.detectedDomain || this._inferDomain(prompt);
    // Domain keys are stable ('code','data','writing','analysis','education','business','general').
    const role = I18n.t(`rewriter.roles.${domain}`) || I18n.t('rewriter.roles.general');

    // Insert role at the beginning. Whether or not XML structure is already
    // present, prepending <rol> keeps it as the first section (canonical order).
    return `<rol>\n${role}\n</rol>\n\n${prompt}`;
  },

  /**
   * Add output format specification tailored to the prompt's intent.
   * @private
   */
  _addOutputFormat(prompt, analysis) {
    const intent = this._inferIntent(prompt);
    // Map inferred intent (Spanish legacy keys) to i18n formatSpec keys.
    const intentKey = {
      'clasificación': 'classification',
      'extracción': 'extraction',
      'generación': 'generation',
      'análisis': 'analysis',
      'código': 'code',
    }[intent] || 'default';
    const formatSpec = I18n.t(`rewriter.formatSpec.${intentKey}`);

    return this._insertSection(prompt, 'formato_salida', formatSpec);
  },

  /**
   * Add guardrails and safety constraints specific to the prompt.
   * @private
   */
  _addMissingGuardrails(prompt, analysis) {
    const guardrails = [];

    // Universal guardrails
    guardrails.push(I18n.t('rewriter.guardrails.universal1'));
    guardrails.push(I18n.t('rewriter.guardrails.universal2'));

    // Domain-specific guardrails
    const intent = this._inferIntent(prompt);
    switch (intent) {
      case 'extracción':
        guardrails.push(I18n.t('rewriter.guardrails.extraction1'));
        guardrails.push(I18n.t('rewriter.guardrails.extraction2'));
        break;
      case 'generación':
        guardrails.push(I18n.t('rewriter.guardrails.generation1'));
        guardrails.push(I18n.t('rewriter.guardrails.generation2'));
        break;
      case 'clasificación':
        guardrails.push(I18n.t('rewriter.guardrails.classification1'));
        guardrails.push(I18n.t('rewriter.guardrails.classification2'));
        break;
      case 'código':
        guardrails.push(I18n.t('rewriter.guardrails.code1'));
        guardrails.push(I18n.t('rewriter.guardrails.code2'));
        guardrails.push(I18n.t('rewriter.guardrails.code3'));
        break;
      case 'análisis':
        guardrails.push(I18n.t('rewriter.guardrails.analysis1'));
        guardrails.push(I18n.t('rewriter.guardrails.analysis2'));
        break;
    }

    const guardrailText = guardrails.map(g => `- ${g}`).join('\n');
    return this._insertSection(prompt, 'restricciones', guardrailText);
  },

  /**
   * Add chain-of-thought instructions when the task requires reasoning.
   * @private
   */
  _addChainOfThought(prompt, analysis) {
    const cotInstruction = [
      I18n.t('rewriter.cot.intro'),
      I18n.t('rewriter.cot.step1'),
      I18n.t('rewriter.cot.step2'),
      I18n.t('rewriter.cot.step3'),
      I18n.t('rewriter.cot.step4'),
      I18n.t('rewriter.cot.step5'),
    ].join('\n');

    // Insert CoT within the <tarea> section or append before output format
    if (this._hasSection(prompt, 'tarea')) {
      return prompt.replace('</tarea>', `${cotInstruction}\n</tarea>`);
    }

    // If no tarea section, insert before formato_salida or at the end
    if (this._hasSection(prompt, 'formato_salida')) {
      return prompt.replace('<formato_salida>', `${cotInstruction}\n\n<formato_salida>`);
    }

    return prompt + '\n' + cotInstruction;
  },

  /**
   * Add examples section with a representative case.
   * @private
   */
  _addExamples(prompt, analysis) {
    const intent = this._inferIntent(prompt);
    const intentKey = {
      'clasificación': 'classification',
      'extracción': 'extraction',
      'código': 'code',
    }[intent] || 'default';
    const example = I18n.t(`rewriter.examples.${intentKey}`);

    return this._insertSection(prompt, 'ejemplos', example);
  },

  /**
   * Add error handling section.
   * @private
   */
  _addErrorHandling(prompt, analysis) {
    const errorHandling = [
      I18n.t('rewriter.errorHandling.e1'),
      I18n.t('rewriter.errorHandling.e2'),
      I18n.t('rewriter.errorHandling.e3'),
      I18n.t('rewriter.errorHandling.e4'),
    ].join('\n');

    return this._insertSection(prompt, 'manejo_errores', errorHandling);
  },

  /**
   * Reorder XML sections into canonical order.
   * @private
   */
  _restructure(prompt) {
    const sectionOrder = ['rol', 'contexto', 'tarea', 'formato_salida', 'restricciones', 'ejemplos', 'manejo_errores'];
    const sections = {};
    const sectionRegex = /<(\w+)>([\s\S]*?)<\/\1>/g;
    let match;
    let nonSectionContent = prompt;

    // Extract all XML sections
    while ((match = sectionRegex.exec(prompt)) !== null) {
      sections[match[1]] = match[2].trim();
      nonSectionContent = nonSectionContent.replace(match[0], '');
    }

    // If no sections found, return unchanged
    if (Object.keys(sections).length === 0) return prompt;

    // Check if already in correct order
    const existingOrder = Object.keys(sections);
    const correctOrder = sectionOrder.filter(s => sections[s] !== undefined);
    const lastIndex = correctOrder.length - 1;
    const isCorrectOrder = correctOrder.every((s, i) => {
      // Last section has no successor to compare against
      if (i === lastIndex) return true;
      return existingOrder.indexOf(s) <= existingOrder.indexOf(correctOrder[i + 1]);
    });

    if (isCorrectOrder && !nonSectionContent.trim()) return prompt;

    // Rebuild in canonical order
    let result = '';
    for (const section of sectionOrder) {
      if (sections[section]) {
        result += `<${section}>\n${sections[section]}\n</${section}>\n\n`;
      }
    }

    // Append any sections not in our canonical order
    for (const [key, value] of Object.entries(sections)) {
      if (!sectionOrder.includes(key)) {
        result += `<${key}>\n${value}\n</${key}>\n\n`;
      }
    }

    // Append any remaining non-section content
    const remaining = nonSectionContent.trim();
    if (remaining) {
      result += remaining + '\n';
    }

    return result.trim();
  },

  // ════════════════════════════════════════════════════════════════════════
  // Helper / detection utilities
  // ════════════════════════════════════════════════════════════════════════

  /** @private */
  _hasXMLStructure(prompt) {
    return /<\w+>[\s\S]*?<\/\w+>/i.test(prompt);
  },

  /** @private */
  _hasSection(prompt, sectionName) {
    const re = new RegExp(`<${sectionName}>[\\s\\S]*?<\\/${sectionName}>`, 'i');
    return re.test(prompt);
  },

  /** @private – Insert a new XML section at the appropriate position. */
  _insertSection(prompt, sectionName, content) {
    const newSection = `\n\n<${sectionName}>\n${content}\n</${sectionName}>`;

    // Insertion priority map
    const insertAfter = {
      'rol': null,               // goes at start
      'contexto': 'rol',
      'tarea': 'contexto',
      'formato_salida': 'tarea',
      'restricciones': 'formato_salida',
      'ejemplos': 'restricciones',
      'manejo_errores': 'ejemplos'
    };

    // Find the best anchor to insert after
    const targetAnchor = insertAfter[sectionName];

    if (targetAnchor && this._hasSection(prompt, targetAnchor)) {
      const anchorRegex = new RegExp(`(<\\/${targetAnchor}>)`);
      // Use a function replacement so `$` characters in `newSection` are not
      // interpreted as special replacement patterns ($1, $&, $$, etc.).
      return prompt.replace(anchorRegex, (m, g1) => `${g1}${newSection}`);
    }

    // Try inserting before the next section in order
    const sectionOrder = ['rol', 'contexto', 'tarea', 'formato_salida', 'restricciones', 'ejemplos', 'manejo_errores'];
    const myIndex = sectionOrder.indexOf(sectionName);

    for (let i = myIndex + 1; i < sectionOrder.length; i++) {
      if (this._hasSection(prompt, sectionOrder[i])) {
        const beforeRegex = new RegExp(`(<${sectionOrder[i]}>)`);
        const wrapped = `<${sectionName}>\n${content}\n</${sectionName}>\n\n`;
        return prompt.replace(beforeRegex, (m, g1) => `${wrapped}${g1}`);
      }
    }

    // Fallback: append at end
    return prompt + newSection;
  },

  /**
   * Infer the domain of the prompt.
   * @private
   */
  _inferDomain(prompt) {
    const lower = prompt.toLowerCase();
    const domainKeywords = {
      'código': ['código', 'code', 'programar', 'función', 'function', 'api', 'class', 'implementa', 'debug', 'bug', 'script', 'variable'],
      'datos': ['datos', 'data', 'csv', 'sql', 'base de datos', 'análisis de datos', 'dashboard', 'dataset', 'estadístic'],
      'redacción': ['escribe', 'redacta', 'artículo', 'blog', 'contenido', 'email', 'carta', 'resumen', 'texto'],
      'análisis': ['analiza', 'evalúa', 'compara', 'investiga', 'revisa', 'sentimiento', 'clasifica'],
      'educación': ['explica', 'enseña', 'estudiante', 'curso', 'lección', 'aprend'],
      'negocio': ['negocio', 'empresa', 'ventas', 'marketing', 'cliente', 'estrategia', 'ROI', 'KPI']
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
   * Infer the main intent of the prompt.
   * @private
   */
  _inferIntent(prompt) {
    const lower = prompt.toLowerCase();
    const intents = {
      'clasificación': ['clasifica', 'categoriza', 'categoría', 'clasificar', 'etiqueta', 'tipo de'],
      'extracción': ['extrae', 'extraer', 'entidades', 'datos de', 'obtén', 'identifica', 'encuentra en el texto'],
      'generación': ['genera', 'crea', 'escribe', 'redacta', 'produce', 'elabora', 'compón'],
      'análisis': ['analiza', 'evalúa', 'revisa', 'examina', 'sentimiento', 'compara'],
      'código': ['código', 'función', 'programa', 'implementa', 'script', 'code', 'debug']
    };

    let bestIntent = 'general';
    let bestScore = 0;

    for (const [intent, keywords] of Object.entries(intents)) {
      const score = keywords.reduce((sum, kw) => sum + (lower.includes(kw) ? 1 : 0), 0);
      if (score > bestScore) {
        bestScore = score;
        bestIntent = intent;
      }
    }

    return bestIntent;
  },

  /**
   * Determine if the prompt would benefit from chain-of-thought.
   * @private
   */
  _needsChainOfThought(prompt, analysis) {
    const lower = prompt.toLowerCase();
    const cotTriggers = [
      'razona', 'explica por qué', 'justifica', 'compara',
      'pros y contras', 'ventajas', 'desventajas', 'evalúa',
      'qué opción', 'mejor enfoque', 'decide', 'analiza',
      'diagnóstico', 'problema', 'solución'
    ];

    // Already has CoT?
    if (lower.includes('paso a paso') || lower.includes('step by step') || lower.includes('piensa') || lower.includes('razona')) {
      return false;
    }

    // Task complexity suggests CoT
    const hasTrigger = cotTriggers.some(t => lower.includes(t));
    const isLongPrompt = prompt.length > 300;
    const hasMultipleQuestions = (prompt.match(/\?/g) || []).length >= 2;

    return hasTrigger || (isLongPrompt && hasMultipleQuestions);
  },

  /**
   * Estimate a base score for prompts without prior analysis.
   * @private
   */
  _estimateBaseScore(prompt) {
    let score = 30; // baseline
    if (prompt.length > 100) score += 5;
    if (prompt.length > 300) score += 5;
    if (this._hasXMLStructure(prompt)) score += 15;
    if (/ejemplo|example/i.test(prompt)) score += 5;
    if (/formato|format|json|markdown/i.test(prompt)) score += 5;
    if (/no |nunca|evita|restricci/i.test(prompt)) score += 5;
    return Math.min(score, 70);
  },

  /**
   * Estimate how many points the changes would improve the score.
   * @private
   */
  _estimateScoreImprovement(changes, currentScore) {
    const weights = {
      'restructured': 12,
      'added': 8,
      'modified': 5
    };

    let improvement = 0;
    for (const change of changes) {
      improvement += weights[change.type] || 5;

      // Bonus for key sections
      if (change.description.includes('rol')) improvement += 3;
      if (change.description.includes('formato')) improvement += 4;
      if (change.description.includes('restricciones') || change.description.includes('guardrails')) improvement += 3;
      if (change.description.includes('ejemplos')) improvement += 3;
      if (change.description.includes('Chain-of-Thought')) improvement += 2;
    }

    // Diminishing returns as score gets higher
    const headroom = 100 - currentScore;
    return Math.min(improvement, headroom * 0.85);
  }
};
