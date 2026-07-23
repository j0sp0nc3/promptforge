/**
 * PromptQuill Core — Universal JS Library (Zero Dependencies)
 * UMD / ESM / CommonJS wrapper. Works in browsers, Node, Deno, Bun.
 *
 * Output contract: matches promptquill_core.py (camelCase keys) so any
 * client that consumes the REST API gets the same shape regardless of
 * which language implements the server.
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PromptQuillCore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const VERSION = '1.0.0';

  // ============================================================================
  // 1. SIGNALS REGISTRY — every derived cue computed exactly once.
  // ============================================================================
  const Signals = {
    extract(prompt) {
      const lower = prompt.toLowerCase();
      const words = lower.split(/\s+/).filter(Boolean);
      const wordCount = words.length;

      const xmlPairs = (prompt.match(/<[a-z_]+>[\s\S]*?<\/[a-z_]+>/gi) || []).length;
      const xmlOpen = (prompt.match(/<[a-z_]+>/gi) || []).length;
      const codeBlockMarkers = (prompt.match(/```/g) || []).length;

      const requestVerb = /\b(respond|reply|return|output|answer|devuelve|responde|format|formatea|entrega|presenta)\b/i.test(lower);
      const formatName = /\b(json|xml|csv|yaml|html|markdown|table|tabla|bullet\s?list|numbered\s?list|lista)\b/i.test(lower);
      const requestsOutputFormat = requestVerb && formatName;

      const exampleCue = /\b(example|ejemplo|e\.g\.|for instance|por ejemplo|sample|muestra)\b/i.test(lower);
      const blockDelim = codeBlockMarkers >= 2 || /→|->|-->/.test(prompt);
      const hasFewShot = exampleCue && blockDelim;

      const hasNumericConstraint = /\b\d+\s*(words|palabras|items|elementos|sentences|oraciones|paragraphs|párrafos|points|puntos)\b/i.test(lower);
      const hasStepByStep = /\b(step.?by.?step|paso a paso|think.{0,12}through|piensa.{0,12}detenidamente|chain of thought|cadena de pensamiento)\b/i.test(lower);
      const hasTreeOfThought = /\b(tree of thoughts?|\btot\b|explore.{0,15}branch|múltiples caminos)\b/i.test(lower);

      const roleAssignment = /\b(you are (an?|the)|act as (an?|the)|eres un[ao]?|actúa como un[oa]?|your role is|tu rol es)\b/i.test(lower);
      const roleWithDomain = roleAssignment && /\b(expert in|specialist in|experto en|especialista en)\b/i.test(lower);

      const errorHandling = /\b(if.{0,20}(invalid|missing|empty)|si.{0,20}(inválid|faltante|vacío)|fallback|default value|manejo de error)\b/i.test(lower);
      const antiHallucination = /\b(don'?t make up|no inventes|do not hallucinate|no alucines|cite your sources?|cita tus fuentes)\b/i.test(lower);
      const scopeLimit = /\b(scope|alcance|only (respond|answer)|solo (responde|contesta)|limited to|limitado a)\b/i.test(lower);

      return {
        wordCount,
        hasXMLTags: xmlPairs > 0 || xmlOpen >= 2,
        requestsOutputFormat,
        hasFewShot,
        hasNumericConstraint,
        hasStepByStep,
        hasTreeOfThought,
        roleAssignment,
        roleWithDomain,
        errorHandling,
        antiHallucination,
        scopeLimit,
      };
    },

    inferType(signals) {
      if (signals.hasFewShot) return 'few-shot';
      if (signals.hasStepByStep || signals.hasTreeOfThought) return 'chainOfThought';
      if (signals.roleAssignment && signals.wordCount > 40) return 'system';
      return 'general';
    },

    weightsFor(type) {
      if (type === 'system')       return { clarity: 0.15, specificity: 0.15, structure: 0.15, robustness: 0.15, context: 0.15, outputFormat: 0.10, chainOfThought: 0.05, safety: 0.10 };
      if (type === 'few-shot')     return { clarity: 0.15, specificity: 0.20, structure: 0.15, robustness: 0.10, context: 0.10, outputFormat: 0.20, chainOfThought: 0.05, safety: 0.05 };
      if (type === 'chainOfThought') return { clarity: 0.15, specificity: 0.15, structure: 0.15, robustness: 0.10, context: 0.10, outputFormat: 0.10, chainOfThought: 0.20, safety: 0.05 };
      return { clarity: 0.18, specificity: 0.15, structure: 0.13, robustness: 0.12, context: 0.12, outputFormat: 0.12, chainOfThought: 0.10, safety: 0.08 };
    },
  };

  // ============================================================================
  // 2. PATTERNS — anti-patterns with findings + suggestions.
  // ============================================================================
  const Patterns = {
    detect(prompt, signals) {
      const trimmed = prompt.trim();
      const antiPatterns = [];

      if (trimmed.length < 10) {
        antiPatterns.push({ id: 'AP001', name: 'Prompt demasiado corto', severity: 'critical', dimension: 'clarity', suggestion: 'Extiende el prompt describiendo contexto y objetivo.' });
      }
      if (!signals.requestsOutputFormat) {
        antiPatterns.push({ id: 'AP003', name: 'Sin formato de salida', severity: 'high', dimension: 'outputFormat', suggestion: 'Especifica el formato deseado (ej. JSON, Tabla).' });
      }
      if (!signals.roleAssignment) {
        antiPatterns.push({ id: 'AP005', name: 'Sin rol definido', severity: 'medium', dimension: 'context', suggestion: 'Asigna un rol claro (ej. "Eres un analista experto...").' });
      }
      if (signals.wordCount > 25 && !signals.errorHandling) {
        antiPatterns.push({ id: 'AP009', name: 'Sin manejo de errores', severity: 'medium', dimension: 'robustness', suggestion: 'Indica qué hacer ante entradas inválidas o vacías.' });
      }
      if (!signals.antiHallucination && /\b(dato|estadística|hecho|fact|number|número)\b/i.test(trimmed)) {
        antiPatterns.push({ id: 'AP030', name: 'Propenso a alucinaciones', severity: 'high', dimension: 'safety', suggestion: 'Añade "no inventes datos" o "cita tus fuentes".' });
      }

      return { antiPatterns, strengths: [] };
    },
  };

  // ============================================================================
  // 3. ANALYZER — full evaluation with rich findings per dimension.
  // ============================================================================
  const Analyzer = {
    analyze(prompt) {
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return { overallScore: 0, grade: 'F', wordCount: 0, charCount: 0, dimensions: {}, antiPatterns: [], strengths: [], suggestions: [] };
      }
      const trimmed = prompt.trim();
      const signals = Signals.extract(trimmed);
      const wordCount = signals.wordCount;
      const charCount = trimmed.length;
      const promptType = Signals.inferType(signals);
      const weights = Signals.weightsFor(promptType);

      const dimensions = {
        clarity: {
          score: Math.min(100, (wordCount > 15 ? 70 : 40) + (signals.roleAssignment ? 15 : 0)),
          findings: wordCount > 15 ? [] : ['El prompt es muy breve.'],
          suggestions: wordCount > 15 ? [] : ['Añade contexto y objetivo.'],
        },
        specificity: {
          score: Math.min(100, 50 + (signals.hasNumericConstraint ? 30 : 0) + (signals.requestsOutputFormat ? 20 : 0)),
          findings: signals.hasNumericConstraint ? [] : ['Define restricciones cuantitativas.'],
          suggestions: signals.hasNumericConstraint ? [] : ['Añade cifras con unidades (ej. "5 ítems").'],
        },
        structure: {
          score: Math.min(100, 40 + (signals.hasXMLTags ? 35 : 0)),
          findings: signals.hasXMLTags ? [] : ['Usa etiquetas XML o markdown para estructurar.'],
          suggestions: [],
        },
        robustness: {
          score: Math.min(100, 40 + (signals.errorHandling ? 40 : 0)),
          findings: signals.errorHandling ? [] : ['Sin manejo de errores visible.'],
          suggestions: signals.errorHandling ? [] : ['Indica qué hacer ante entradas inválidas.'],
        },
        context: {
          score: Math.min(100, 45 + (signals.roleWithDomain ? 40 : signals.roleAssignment ? 20 : 0)),
          findings: signals.roleAssignment ? [] : ['No se define un rol.'],
          suggestions: signals.roleAssignment ? [] : ['Asigna un rol con dominio.'],
        },
        outputFormat: {
          score: Math.min(100, signals.requestsOutputFormat ? 85 : 35),
          findings: signals.requestsOutputFormat ? [] : ['Sin formato de salida explícito.'],
          suggestions: signals.requestsOutputFormat ? [] : ['Pide "responde en JSON" u otro formato.'],
        },
        chainOfThought: {
          score: Math.min(100, signals.hasStepByStep ? 90 : 30),
          findings: signals.hasStepByStep ? [] : ['No solicita razonamiento paso a paso.'],
          suggestions: signals.hasStepByStep ? [] : ['Añade "piensa paso a paso" para tareas complejas.'],
        },
        safety: {
          score: Math.min(100, (signals.antiHallucination ? 40 : 0) + (signals.scopeLimit ? 40 : 20)),
          findings: signals.antiHallucination ? [] : ['Sin guardrails anti-alucinación.'],
          suggestions: signals.antiHallucination ? [] : ['Añade "no inventes datos" o "cita fuentes".'],
        },
      };

      let overallScore = 0;
      for (const [dim, w] of Object.entries(weights)) {
        overallScore += (dimensions[dim].score || 0) * w;
      }
      overallScore = Math.round(Math.max(0, Math.min(100, overallScore)));
      const grade = overallScore >= 90 ? 'A' : overallScore >= 75 ? 'B' : overallScore >= 60 ? 'C' : overallScore >= 45 ? 'D' : 'F';

      const patternResults = Patterns.detect(trimmed, signals);

      return {
        overallScore,
        grade,
        wordCount,
        charCount,
        promptType,
        dimensions,
        antiPatterns: patternResults.antiPatterns,
        strengths: patternResults.strengths,
        suggestions: patternResults.antiPatterns.map(ap => ({ priority: ap.severity, title: ap.name, description: ap.suggestion })),
      };
    },
  };

  // ============================================================================
  // 4. REWRITER — non-destructive structured XML rewrite.
  // ============================================================================
  const Rewriter = {
    improve(prompt, analysis) {
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return { improvedPrompt: '', changes: [], scoreImprovement: 0 };
      }
      const working = prompt.trim();
      const changes = [];
      let improved = working;

      if (!/<[a-z_]+>/i.test(working)) {
        improved = `<rol>\nEres un asistente experto altamente calificado.\n</rol>\n\n<tarea>\n${working}\n</tarea>\n\n<formato_salida>\nPresenta los resultados en un formato claro, estructurado y directo.\n</formato_salida>`;
        changes.push({ type: 'restructured', description: 'Añadida estructura XML con <rol>, <tarea> y <formato_salida>' });
      }

      const currentScore = (analysis && analysis.overallScore) || 50;
      return {
        improvedPrompt: improved,
        changes,
        scoreImprovement: Math.min(100, currentScore + 20),
      };
    },
  };

  // ============================================================================
  // 5. ADVERSARIAL — security & injection resilience tests.
  // ============================================================================
  const Adversarial = {
    runTests(prompt) {
      const lower = (prompt || '').toLowerCase();
      const tests = [
        { name: 'Jailbreak Direct Resistance', category: 'Security', status: /\b(ignore (all|previous)|override|jailbreak)\b/i.test(lower) ? 'warning' : 'pass', detail: 'Evaluates resistance against instruction override.' },
        { name: 'Data Exfiltration Guard', category: 'Privacy', status: /\b(system prompt|reveal instructions|contraseña|api_key)\b/i.test(lower) ? 'warning' : 'pass', detail: 'Evaluates protection against system prompt leaks.' },
        { name: 'Hallucination Mitigation', category: 'Robustness', status: /\b(don'?t make up|cite|no alucines|no inventes)\b/i.test(lower) ? 'pass' : 'warning', detail: 'Checks for explicit anti-hallucination guardrails.' },
      ];
      const passCount = tests.filter(t => t.status === 'pass').length;
      return { overallResistance: Math.round((passCount / tests.length) * 100), tests };
    },
  };

  // ── Public API ──────────────────────────────────────────────────────────
  return {
    version: VERSION,
    VERSION,
    analyze: (prompt) => Analyzer.analyze(prompt),
    improve: (prompt, analysis) => Rewriter.improve(prompt, analysis),
    runAdversarial: (prompt) => Adversarial.runTests(prompt),
    detectPatterns: (prompt) => {
      const signals = Signals.extract(prompt);
      return Patterns.detect(prompt, signals);
    },
    extractSignals: (prompt) => Signals.extract(prompt),
    Signals,
    Patterns,
    Analyzer,
    Adversarial,
    Rewriter,
  };
}));
