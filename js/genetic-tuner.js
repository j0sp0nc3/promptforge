// ============================================================================
// Promptometer - Genetic Tuner Engine
// Deterministic 3-strategy prompt mutation & champion selection in <15ms ($0 cost)
// ============================================================================

const GeneticTuner = {

  /**
   * Mutate a prompt using 3 distinct heuristic strategies.
   * @param {string} promptText - Original prompt text
   * @param {Object} [options] - Options like domainArchetype and objective
   * @returns {Array<{ id: string, nameKey: string, prompt: string, strategy: string }>}
   */
  mutate(promptText, options = {}) {
    const raw = (promptText || '').trim();
    if (!raw) {
      return [];
    }

    const archetype = options.domainArchetype || 'general_task';

    // Strategy A: Canonical XML Anatomy (Strict Structure)
    const strategyA = this._mutateXmlAnatomy(raw, archetype);

    // Strategy B: Reasoning & Few-Shot Chain-of-Thought
    const strategyB = this._mutateChainOfThought(raw, archetype);

    // Strategy C: Guarded Safety & MCP Protocol Contract
    const strategyC = this._mutateGuardedMcp(raw, archetype);

    return [
      {
        id: 'gen-xml-anatomy',
        nameKey: 'genetic.strategyA',
        strategy: 'XML Strict Anatomy',
        prompt: strategyA
      },
      {
        id: 'gen-cot-reasoning',
        nameKey: 'genetic.strategyB',
        strategy: 'Few-Shot Chain of Thought',
        prompt: strategyB
      },
      {
        id: 'gen-guarded-mcp',
        nameKey: 'genetic.strategyC',
        strategy: 'Guarded Safety & MCP',
        prompt: strategyC
      }
    ];
  },

  /**
   * Evaluate all mutated variants using the 8D Analyzer.
   * @param {Array<{ id: string, nameKey: string, prompt: string, strategy: string }>} mutations
   * @param {Object} [options] - Analysis options (objective, etc.)
   * @returns {Array<Object>} Evaluated mutations with analysis results
   */
  evaluateVariants(mutations, options = {}) {
    if (!Array.isArray(mutations)) return [];

    return mutations.map(mut => {
      const analysis = typeof Analyzer !== 'undefined'
        ? Analyzer.analyze(mut.prompt, options)
        : { overallScore: 50, overallGrade: 'C' };

      return {
        ...mut,
        analysis,
        score: analysis.overallScore || 0,
        grade: analysis.overallGrade || 'F'
      };
    });
  },

  /**
   * Select the champion variant with highest 8D score and calculate delta over original score.
   * @param {string} originalPrompt
   * @param {Object} originalAnalysis
   * @param {Object} [options]
   * @returns {Object} Champion result object
   */
  evolve(originalPrompt, originalAnalysis, options = {}) {
    const mutations = this.mutate(originalPrompt, options);
    const evaluated = this.evaluateVariants(mutations, options);

    if (evaluated.length === 0) {
      return null;
    }

    // Sort by score descending
    const sorted = [...evaluated].sort((a, b) => b.score - a.score);
    const champion = sorted[0];
    const originalScore = originalAnalysis?.overallScore || 0;
    const delta = Math.max(0, champion.score - originalScore);

    return {
      originalPrompt,
      originalScore,
      champion,
      runnerUp: sorted[1] || null,
      variants: sorted,
      deltaGain: delta
    };
  },

  // ════════════════════════════════════════════════════════════════════════
  // Mutation Heuristics
  // ════════════════════════════════════════════════════════════════════════

  _mutateXmlAnatomy(promptText, archetype) {
    let result = promptText;
    if (typeof Rewriter !== 'undefined' && Rewriter.improve) {
      const res = Rewriter.improve(promptText, { domainArchetype: archetype });
      result = (typeof res === 'string' ? res : res?.improvedPrompt) || promptText;
    }

    if (!result.includes('<system_role>')) {
      result = `<system_role>\nActúa como un experto en ${archetype.replace('_', ' ')} de nivel sénior.\n</system_role>\n\n<objective>\n${result}\n</objective>`;
    }
    if (!result.includes('<output_format>')) {
      result += `\n\n<output_format>\nProporciona una respuesta clara, estructurada y accionable.\n</output_format>`;
    }
    return result;
  },

  _mutateChainOfThought(promptText, archetype) {
    let result = promptText;
    if (typeof Rewriter !== 'undefined' && Rewriter.improve) {
      const res = Rewriter.improve(promptText, { domainArchetype: archetype });
      result = (typeof res === 'string' ? res : res?.improvedPrompt) || promptText;
    }

    if (!result.includes('<pensamiento>')) {
      result += `\n\n<pensamiento>\nAnaliza la solicitud paso a paso antes de emitir la respuesta final:\n1. Identifica el objetivo principal y el contexto.\n2. Revisa restricciones y criterios de calidad.\n3. Formula la solución estructurada.\nThought: [Razonamiento analítico]\nAction: [Respuesta final al usuario]\n</pensamiento>`;
    }

    if (!result.includes('<ejemplos>')) {
      result += `\n\n<ejemplos>\n<ejemplo>\n<entrada>Caso de prueba estándar</entrada>\n<salida_esperada>Respuesta bien formateada y precisa</salida_esperada>\n</ejemplo>\n</ejemplos>`;
    }

    return result;
  },

  _mutateGuardedMcp(promptText, archetype) {
    let result = promptText;
    if (typeof Rewriter !== 'undefined' && Rewriter.improve) {
      const res = Rewriter.improve(promptText, { domainArchetype: archetype });
      result = (typeof res === 'string' ? res : res?.improvedPrompt) || promptText;
    }

    if (!result.includes('<restricciones>')) {
      result += `\n\n<restricciones>\n- Fundamenta tus respuestas estrictamente en los datos provistos.\n- Si falta información crítica, responde explícitamente "No dispongo de datos suficientes".\n- Prohibido alucinar o asumir hechos no verificables.\n</restricciones>`;
    }

    if (!result.includes('<tools>') && !result.includes('<herramientas>')) {
      result += `\n\n<tools>\n  <!-- Contrato Formal MCP / Tool Execution -->\n  <tool name="query_data">\n    <description>Consulta información estructurada del dominio.</description>\n    <parameters>\n      <param name="query" type="string" required="true">Filtro de búsqueda</param>\n    </parameters>\n  </tool>\n</tools>`;
    }

    if (!result.includes('<loop_guard>')) {
      result += `\n\n<loop_guard>\n  - Límite de 5 iteraciones autónomas.\n  - Requiere confirmación humana previa para acciones destructivas.\n</loop_guard>`;
    }

    return result;
  }
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeneticTuner;
}
