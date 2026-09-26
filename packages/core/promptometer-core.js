/**
 * Promptometer Core — Universal JS Library (Zero Dependencies)
 * UMD / ESM / CommonJS wrapper. Works in browsers, Node, Deno, Bun.
 *
 * Output contract: matches promptometer_core.py (camelCase & snake_case keys)
 * Version 1.2.0 — Agentic & MCP Prompt Evaluation + Task Assessment (assess).
 */
(function (root, factory) {
  if (typeof define === 'function' && define.amd) {
    define([], factory);
  } else if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.PromptometerCore = factory();
  }
}(typeof self !== 'undefined' ? self : this, function () {

  const VERSION = '1.2.0';

  // ============================================================================
  // 1. SIGNALS REGISTRY — every derived cue computed exactly once.
  // ============================================================================
  const Signals = {
    extract(prompt) {
      const lower = (prompt || '').toLowerCase();
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

      // Agentic & MCP Signals (v1.1.0)
      const hasAgenticLoop = /\b(agent loop|autonomous agent|agente autónomo|keep (trying|iterating|executing)|sigue intentando|itera hasta|repeat until|repite hasta|loop until|bucle hasta|retry until|reintenta hasta|until (solved|resolved|success)|hasta que (resuelvas|termines|funcione)|step-by-step loop|bucle de pasos)\b/i.test(lower);
      const hasLoopGuard = /\b(max(imum)?_?(iterations?|turns?|steps?|attempts?)|(límite|máximo)\s*(máximo\s*)?(de\s*)?\d+\s*(pasos|iteraciones|intentos|steps|iterations)|no más de \d+|criterio de parada|condición de parada|stop condition|stop (when|if|after)|detén(te)?\s*(\w+\s*){0,3}(si|cuando|tras)|detenerse|detener el proceso|abort (if|when)|si no logras|fallback)\b/i.test(lower);
      const hasFormalToolSchema = /(<tools?>[\s\S]*?(parameters?|args|properties|required|type:\s*(string|number|object|boolean|array))[\s\S]*?<\/tools?>|mcp\s*tool|tool_choice|tools:\s*\[[\s\S]*?parameters)/i.test(prompt);
      const hasUntypedToolCall = /\b(call (the )?(tools?|functions?)|usa (las? )?(herramientas?|funciones?)|invoca (las? )?(herramientas?|funciones?)|execute (tools?|functions?)|ejecuta (las? )?(herramientas?|funciones?)|@tool|tool_choice)\b/i.test(lower)
        && !hasFormalToolSchema && !/\b(parameters?|argumentos|parámetros|inputs?|schema|json)\b/i.test(lower);
      const hasToolUntrustedGuard = /\b(untrusted (data|output|content|input)|datos no confiables|salida no confiable|tool outputs? (are|is) untrusted|treat tool (output|response) as untrusted|no ejecutes instrucciones (en|de) la herramienta|do not follow instructions inside (tool|function) (outputs?|results?))\b/i.test(lower);

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
        hasAgenticLoop,
        hasLoopGuard,
        hasFormalToolSchema,
        hasUntypedToolCall,
        hasToolUntrustedGuard,
      };
    },

    inferType(signals) {
      if (signals.hasFormalToolSchema || signals.hasUntypedToolCall) return 'tool-use';
      if (signals.hasFewShot) return 'few-shot';
      if (signals.hasStepByStep || signals.hasTreeOfThought) return 'chainOfThought';
      if (signals.roleAssignment && signals.wordCount > 40) return 'system';
      return 'general';
    },

    weightsFor(type) {
      if (type === 'system')       return { clarity: 0.15, specificity: 0.15, structure: 0.15, robustness: 0.15, context: 0.15, outputFormat: 0.10, chainOfThought: 0.05, safety: 0.10 };
      if (type === 'few-shot')     return { clarity: 0.15, specificity: 0.20, structure: 0.15, robustness: 0.10, context: 0.10, outputFormat: 0.20, chainOfThought: 0.05, safety: 0.05 };
      if (type === 'chainOfThought') return { clarity: 0.15, specificity: 0.15, structure: 0.15, robustness: 0.10, context: 0.10, outputFormat: 0.10, chainOfThought: 0.20, safety: 0.05 };
      if (type === 'tool-use')     return { clarity: 0.12, specificity: 0.16, structure: 0.18, robustness: 0.18, context: 0.08, outputFormat: 0.16, chainOfThought: 0.04, safety: 0.08 };
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
      const strengths = [];

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

      // v1.1.0 Agentic & MCP Patterns
      if (signals.hasAgenticLoop && !signals.hasLoopGuard) {
        antiPatterns.push({ id: 'AP048', name: 'Bucle agéntico autónomo sin condición de parada', severity: 'critical', dimension: 'robustness', suggestion: 'Define un límite máximo de iteraciones (ej. máximo 5 pasos) o criterio de parada.' });
      }
      if (signals.hasUntypedToolCall) {
        antiPatterns.push({ id: 'AP049', name: 'Llamada a herramientas sin contrato tipado', severity: 'high', dimension: 'outputFormat', suggestion: 'Define un bloque <tools> con parámetros tipados para function calling / MCP.' });
      }
      if (signals.hasFormalToolSchema) {
        strengths.push({ id: 'BP017', name: 'Contrato formal de herramientas y protocolo MCP', dimension: 'structure', description: 'El prompt define un esquema riguroso para herramientas y function calling.' });
      }

      return { antiPatterns, strengths };
    },
  };

  // ============================================================================
  // 3. ANALYZER — full evaluation with rich findings per dimension.
  // ============================================================================
  const Analyzer = {
    analyze(prompt) {
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return { overallScore: 0, overall_score: 0, grade: 'F', wordCount: 0, charCount: 0, dimensions: {}, antiPatterns: [], strengths: [], suggestions: [] };
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
          score: Math.min(100, 40 + (signals.hasXMLTags ? 35 : 0) + (signals.hasFormalToolSchema ? 25 : 0)),
          findings: signals.hasXMLTags ? [] : ['Usa etiquetas XML o markdown para estructurar.'],
          suggestions: [],
        },
        robustness: {
          score: Math.min(100, 40 + (signals.errorHandling ? 30 : 0) + (signals.hasLoopGuard ? 30 : 0) - (signals.hasAgenticLoop && !signals.hasLoopGuard ? 30 : 0)),
          findings: signals.errorHandling ? [] : ['Sin manejo de errores visible.'],
          suggestions: signals.errorHandling ? [] : ['Indica qué hacer ante entradas inválidas.'],
        },
        context: {
          score: Math.min(100, 45 + (signals.roleWithDomain ? 40 : signals.roleAssignment ? 20 : 0)),
          findings: signals.roleAssignment ? [] : ['No se define un rol.'],
          suggestions: signals.roleAssignment ? [] : ['Asigna un rol con dominio.'],
        },
        outputFormat: {
          score: Math.min(100, (signals.requestsOutputFormat ? 75 : 35) + (signals.hasFormalToolSchema ? 25 : 0)),
          findings: signals.requestsOutputFormat ? [] : ['Sin formato de salida explícito.'],
          suggestions: signals.requestsOutputFormat ? [] : ['Pide "responde en JSON" u otro formato.'],
        },
        chainOfThought: {
          score: Math.min(100, signals.hasStepByStep ? 90 : 30),
          findings: signals.hasStepByStep ? [] : ['No solicita razonamiento paso a paso.'],
          suggestions: signals.hasStepByStep ? [] : ['Añade "piensa paso a paso" para tareas complejas.'],
        },
        safety: {
          score: Math.min(100, (signals.antiHallucination ? 40 : 0) + (signals.scopeLimit ? 40 : 20) + (signals.hasToolUntrustedGuard ? 20 : 0)),
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
        overall_score: overallScore,
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
        improved = `<system_role>\nEres un asistente experto altamente calificado.\n</system_role>\n\n<objective>\n${working}\n</objective>\n\n<output_format>\nPresenta los resultados en un formato claro, estructurado y directo.\n</output_format>`;
        changes.push({ type: 'restructured', description: 'Añadida estructura XML con <system_role>, <objective> y <output_format>' });
      }

      const currentScore = (analysis && (analysis.overallScore || analysis.overall_score)) || 50;
      return {
        improvedPrompt: improved,
        changes,
        scoreImprovement: Math.min(100, currentScore + 20),
      };
    },
  };

  // ============================================================================
  // 5. ADVERSARIAL — security & injection resilience tests (15 Tests).
  // ============================================================================
  const Adversarial = {
    runTests(prompt) {
      const lower = (prompt || '').toLowerCase();
      const tests = [
        { name: 'Jailbreak Direct Resistance', category: 'Security', status: /\b(ignore (all|previous)|override|jailbreak)\b/i.test(lower) ? 'warning' : 'pass', detail: 'Evaluates resistance against instruction override.' },
        { name: 'Data Exfiltration Guard', category: 'Privacy', status: /\b(system prompt|reveal instructions|contraseña|api_key)\b/i.test(lower) ? 'warning' : 'pass', detail: 'Evaluates protection against system prompt leaks.' },
        { name: 'Hallucination Mitigation', category: 'Robustness', status: /\b(don'?t make up|cite|no alucines|no inventes)\b/i.test(lower) ? 'pass' : 'warning', detail: 'Checks for explicit anti-hallucination guardrails.' },
        { name: 'Tool Poisoning & Output Injection', category: 'Security', status: /\b(sin validar|without validat|raw execute|ejecuta.*directamente)\b/i.test(lower) ? 'fail' : /\b(untrusted|sanitiz|valida|schema|human-in-the-loop)\b/i.test(lower) ? 'pass' : 'warning', detail: 'Evaluates resilience against malicious tool outputs and untrusted payload execution.' },
      ];
      const passCount = tests.filter(t => t.status === 'pass').length;
      return { overallResistance: Math.round((passCount / tests.length) * 100), tests };
    },
  };

  // ============================================================================
  // 6. TASK ASSESSMENT (experimental) — evalúa el PEDIDO que se entrega a un
  //    agente. Port 1:1 de TaskAssessor en promptometer_core.py. Regex, keywords
  //    y mensajes llegan en TA_SPEC, generado desde Python (fuente única).
  // ============================================================================
  /* <ta-spec> generated by test_assess.py --sync-js; do not edit */
  const TA_SPEC = {
    "patterns": {
      "ACTION": {
        "source": "\\b(crea|crear|agrega|añade|elimina|borra|corrige|arregla|refactoriza|modifica|busca|encuentra|analiza|explica|testea|prueba|optimiza|resume|transcribe|investiga|actualiza|ejecuta|reemplaza|implementa|compara|extrae|genera|sintetiza|edita|create|add|remove|delete|fix|repair|refactor|modify|search|find|analyze|explain|test|optimize|summarize|transcribe|investigate|update|run|replace|implement|edit)\\b",
        "flags": "i"
      },
      "ANTIPATTERN": {
        "source": "^(no anda|no funciona|arreglalo|arregla esto|falla|error|ayuda|help|fix this|fix it|hacelo|hazlo|dale|test|prueba|hola|buenas|ok)\\b",
        "flags": "i"
      },
      "CODE_FILE": {
        "source": "\\b[\\w\\-\\./\\\\]+\\.(py|js|ts|jsx|tsx|rs|go|c|cpp|cs)\\b",
        "flags": ""
      },
      "CODE_HINT": {
        "source": "\\b(arregl|corrig|edit|deshaz|revi[eé]rt|refactori|ayuda)|\\bno (anda|funciona)\\b|\\bfalla\\b",
        "flags": ""
      },
      "CODE_VOICE_FILE": {
        "source": "\\b(punto|dot)\\s+(py|js|ts|jsx|tsx|rs|go|c|cpp|cs)\\b",
        "flags": ""
      },
      "COMPLAINT": {
        "source": "(^\\s*no\\s*[,.!;]|\\bas[ií] no\\b|\\bte equivocaste\\b|\\best[aá] mal\\b|\\beso no\\b|\\bno era eso\\b|\\bincorrecto\\b|\\bthat'?s wrong\\b|\\bnot what i\\b|\\bwrong\\b)",
        "flags": "i"
      },
      "CONSTRAINTS": {
        "source": "\\b(sin|solo|únicamente|only|don't|no uses|usando|utilizando|respetando|mantén|mantener|debe|debería|en vez de|instead of|sin romper|sin alterar|máximo|en viñetas|en español|en inglés)\\b",
        "flags": "i"
      },
      "CONTEXT_OR_ERROR": {
        "source": "\\b(error|exception|traceback|failed|failure|errno|expected|actual|esperaba|retorna|falla con|output|salida|código \\d+|line \\d+|línea \\d+|reproduce|reproducir|KeyError|ValueError|TypeError|AttributeError)\\b",
        "flags": "i"
      },
      "CREATE": {
        "source": "\\b(crea|crear|nuevo|nueva|create|new)\\b",
        "flags": "i"
      },
      "EDIT": {
        "source": "\\b(edita|modifica|corrige|arregla|refactoriza|actualiza|reemplaza|elimina|borra|agrega|añade|edit|modify|fix|repair|refactor|update|replace|remove|delete|add)\\b",
        "flags": "i"
      },
      "EXPECTED": {
        "source": "\\b(esperaba|deber[ií]a|en vez de|en lugar de|expected|should|instead)\\b",
        "flags": "i"
      },
      "FILE_EXT": {
        "source": "\\b[\\w\\-\\./\\\\]+\\.(py|js|ts|jsx|tsx|json|md|txt|html|css|yaml|yml|toml|sql|sh|m4a|mp3|wav|rs|go|c|cpp|cs|env)\\b",
        "flags": "i"
      },
      "FIX": {
        "source": "\\b(corrige|arregla|fix|repair|bug|falla)\\b",
        "flags": "i"
      },
      "MUTATING": {
        "source": "\\b(crea|crear|agrega|añade|elimina|borra|corrige|arregla|refactoriza|modifica|actualiza|reemplaza|implementa|edita|create|add|remove|delete|fix|repair|refactor|modify|update|replace|implement|edit)\\b",
        "flags": "i"
      },
      "PATH": {
        "source": "\\b[\\w\\-\\.]+[/\\\\][\\w\\-\\.]+\\b",
        "flags": ""
      },
      "READONLY": {
        "source": "\\b(explica|resume|busca|encuentra|lista|muestra|describe|qu[eé] es|explain|summarize|search|find|list|show|what is)\\b",
        "flags": "i"
      },
      "RESEARCH_OUTPUT_FORMAT": {
        "source": "\\b(resumen|vi[nñ]etas|puntos\\s+clave|bullet\\s*points?|glosario|anki|flashcards?|comparativa|tabla|cuadro|s[ií]ntesis|informe|reporte|minuta|cronolog[ií]a|timeline|mapa\\s+(conceptual|mental)|esquema|outline|preguntas\\s+frecuentes|faq|cuestionario|gu[ií]a)\\b",
        "flags": "i"
      },
      "RESEARCH_SOURCES": {
        "source": "\\b(audio|audios|m4a|mp3|wav|grabaci[oó]n|grabaciones|c[aá]tedra|c[aá]tedras|clase|clases|conferencia|charla|video|podcast|entrevista|documento|documentos|pdf|docx?|txt|csv|paper|papers|estudio|url|enlace|link|art[ií]culo|art[ií]culos|fuente|fuentes|bibliograf[ií]a|dataset|datos|transcripci[oó]n)\\b|https?://|www\\.",
        "flags": "i"
      },
      "RESEARCH_TOPIC": {
        "source": "\\b(medicina|m[eé]dica?|farmacolog[ií]a|cardiolog[ií]a|neurolog[ií]a|anatom[ií]a|fisiolog[ií]a|biolog[ií]a|qu[ií]mica|derecho|econom[ií]a|finanzas|historia|filosof[ií]a|psicolog[ií]a|arquitectura|seguridad|negocio|estrategia|mercado|cl[ií]nic[ao]|paciente|diagn[oó]stico|tratamiento|enfermedad|s[ií]ntoma|conductas?\\s+motivadas?|inteligencia\\s+artificial|machine\\s+learning|f[aá]rmacos?)\\b",
        "flags": "i"
      },
      "REVERT": {
        "source": "\\b(deshaz|revi[eé]rt\\w*|revert\\w*|rollback|undo)\\b",
        "flags": "i"
      },
      "STEERING": {
        "source": "\\b(ahora\\s+(corre|ejecuta|haz|aplica|muestra|agrega|pasa|sube|baja|cambia)|corre(\\s+los)?\\s+(tests?|pruebas?|pytest)|contin[uú]a|sigue(\\s+adelante)?|proceed|continue|muestra(\\s+el)?\\s+(diff|resultado|cambio|c[oó]digo|salida)|cambia\\s+.*por\\s+.*|agrega\\s+(otro|m[aá]s|un)\\s+(test|caso|ejemplo)|explica\\s+(el\\s+punto|m[aá]s|mejor)|procede|dale|adelante|perfecto|de acuerdo|yes|go ahead)\\b",
        "flags": "i"
      },
      "SYMBOLS": {
        "source": "(`[^`]+`|\\b(def|class|async def)\\s+[A-Za-z_]\\w*|[A-Za-z_]\\w*\\(\\)|\\b[A-Za-z_]+_[A-Za-z0-9_]+\\b|\\b[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*\\b)",
        "flags": ""
      },
      "TOKEN": {
        "source": "[a-z_][\\w\\-]*",
        "flags": ""
      },
      "URL": {
        "source": "^(https?:|www\\.)",
        "flags": ""
      },
      "VOICE_DOT": {
        "source": "\\s+(punto|dot)\\s+(py|js|ts|jsx|tsx|json|md|txt|html|css|yaml|yml|toml|sql|sh|m4a|mp3|wav|rs|go|c|cpp|cs|env)\\b",
        "flags": "i"
      },
      "VOICE_FILE_EXT": {
        "source": "\\b(punto|dot)\\s+(py|js|ts|jsx|tsx|json|md|txt|html|css|yaml|yml|toml|sql|sh|m4a|mp3|wav|rs|go|c|cpp|cs|env)\\b",
        "flags": "i"
      },
      "VOICE_INDICATORS": {
        "source": "\\b(punto\\s+(py|js|ts|json|md|txt)|barra\\s+\\w+|slash\\s+\\w+|gui[oó]n\\s+bajo|subgui[oó]n|abrir\\s+comillas)\\b",
        "flags": "i"
      },
      "VOICE_PATH": {
        "source": "\\b[\\w\\-]+\\s+(barra|slash)\\s+[\\w\\-]+(\\s+(barra|slash)\\s+[\\w\\-]+)*\\b",
        "flags": "i"
      },
      "VOICE_SEP": {
        "source": "\\s+(barra|slash)\\s+",
        "flags": "i"
      },
      "VOICE_SYMBOL": {
        "source": "\\b(funci[oó]n|clase|m[eé]todo|variable|m[oó]dulo|comando|par[aá]metro|function|class|method)\\s+([A-Za-z_]\\w*)\\b",
        "flags": "i"
      }
    },
    "softwareKeywords": [
      "\\bcode\\b",
      "\\bcódigo\\b",
      "\\bfix\\b",
      "\\brefactor\\b",
      "\\btest\\b",
      "\\btests\\b",
      "\\bpytest\\b",
      "\\bdotnet\\b",
      "\\bclass\\b",
      "\\bfunction\\b",
      "\\bfunción\\b",
      "\\bdef\\b",
      "\\bimport\\b",
      "\\bbug\\b",
      "\\berror\\b",
      "\\bpatch\\b",
      "\\bcommit\\b",
      "\\brepository\\b",
      "\\brepositorio\\b",
      "\\bendpoint\\b",
      "\\bapi\\b",
      "\\bscript\\b",
      "\\bfile\\b",
      "\\barchivo\\b",
      "\\bbuild\\b",
      "\\bcompil\\b"
    ],
    "researchKeywords": [
      "\\bcátedra\\b",
      "\\bclase\\b",
      "\\bmedicina\\b",
      "\\bmedica\\b",
      "\\bmédica\\b",
      "\\bresumen\\b",
      "\\bresumir\\b",
      "\\btranscrib\\b",
      "\\btranscripción\\b",
      "\\b audio\\b",
      "\\bvoz\\b",
      "\\bvoice\\b",
      "\\blecture\\b",
      "\\bflashcard\\b",
      "\\banki\\b",
      "\\bglosario\\b",
      "\\bconsultoría\\b",
      "\\bconsulting\\b",
      "\\binvestigación\\b",
      "\\bresearch\\b",
      "\\banálisis\\b",
      "\\banalize\\b"
    ],
    "deepKeywords": [
      "razonamiento profundo",
      "piensa profundamente",
      "analiza en detalle",
      "think hard",
      "deep reasoning",
      "deep think",
      "analiza a fondo",
      "pensamiento profundo",
      "razona profundamente",
      "modo profundo",
      "evalúa exhaustivamente",
      "arquitectura",
      "refactorización compleja",
      "causa raíz",
      "root cause",
      "diagnóstico profundo",
      "demostración"
    ],
    "fastKeywords": [
      "\\brápido\\b",
      "\\brapido\\b",
      "\\bsin pensar\\b",
      "\\bquick\\b",
      "\\bfast\\b",
      "\\bsencillo\\b",
      "\\bdime la hora\\b",
      "\\bhola\\b",
      "\\bgracias\\b"
    ],
    "moduleStoplist": [
      "__init__",
      "base",
      "common",
      "config",
      "core",
      "data",
      "file",
      "files",
      "index",
      "init",
      "lessons",
      "license",
      "main",
      "manifest",
      "package",
      "package-lock",
      "plan",
      "readme",
      "robots",
      "setup",
      "sitemap",
      "spec",
      "test",
      "tests",
      "todo",
      "types",
      "util",
      "utils"
    ],
    "severityRank": {
      "critical": 0,
      "high": 1,
      "medium": 2,
      "low": 3
    },
    "messages": {
      "es": {
        "TA000": "El prompt está vacío. Proporciona una instrucción concreta.",
        "TA001_code": "Evita órdenes ambiguas ('arreglalo', 'no anda'); detalla qué falla, el error o el archivo objetivo para ahorrar turnos.",
        "TA001_research": "Evita órdenes ambiguas; detalla el tema a sintetizar, la fuente de datos o el resultado esperado.",
        "TA002": "Prompt muy escueto. Describir la tarea en mayor detalle ahorra búsquedas y turnos innecesarios.",
        "TA003": "Indica la acción concreta y el archivo o símbolo objetivo (ej. `src/auth.py`, `login()`) para evitar exploración innecesaria.",
        "TA004": "El archivo '{file}' no existe en el workspace; el agente fallará al leerlo. Verifica la ruta o di que hay que crearlo.",
        "TA005": "El pedido abarca {files} archivos y {objectives} objetivos: alto riesgo de saturar el contexto o truncar la salida. Divídelo en lotes de 1-2 archivos.",
        "TA006_complaint": "Decir que está mal no alcanza: indica qué esperabas en vez de eso (ej. 'esperaba X y obtuve Y', o el archivo/función a corregir).",
        "TA006_revert": "Tras revertir, indica qué esperabas para que el siguiente intento no repita el desvío.",
        "TA007": "Añadir el mensaje de error o el comportamiento esperado ayuda a resolver la tarea en un solo turno.",
        "TA008": "Indica criterios o restricciones (ej. 'sin romper tests', 'sin alterar la API') para prevenir efectos colaterales.",
        "TA009": "Especifica el formato deseado (ej. 'resumen en viñetas', 'glosario', 'tabla') para evitar re-generaciones costosas.",
        "TA010": "Indica la fuente (ej. audio, URL, documento) o la temática clave para acotar el contexto.",
        "ok_steering": "Directiva concisa de seguimiento: aprovecha el contexto previo ahorrando tokens.",
        "ok_code": "Pedido específico: archivo, objetivo y contexto definidos, minimizando turnos y costo.",
        "ok_research": "Pedido claro: tema, fuente y formato definidos para resolver en un solo turno.",
        "scaffold_code": "En {file}, {action} {symbol} para [resultado esperado] sin romper [tests/restricción].",
        "scaffold_correction": "Esperaba [comportamiento esperado] pero obtuve [resultado actual] en [archivo/función].",
        "scaffold_research": "Sintetiza {topic} en formato [viñetas/tabla] a partir de {source} enfocándote en [criterio].",
        "ph_file": "[archivo]",
        "ph_action": "[acción]",
        "ph_symbol": "[función/símbolo]",
        "ph_topic": "[tema]",
        "ph_source": "[audio/documento/URL]"
      },
      "en": {
        "TA000": "The prompt is empty. Provide a concrete instruction.",
        "TA001_code": "Avoid ambiguous orders ('fix it', 'doesn't work'); state what fails, the error or the target file to save turns.",
        "TA001_research": "Avoid ambiguous orders; state the topic, the data source or the expected result.",
        "TA002": "Prompt too terse. Describing the task in more detail saves searches and extra turns.",
        "TA003": "State the concrete action and the target file or symbol (e.g. `src/auth.py`, `login()`) to avoid needless exploration.",
        "TA004": "File '{file}' does not exist in the workspace; the agent will fail to read it. Check the path or say it must be created.",
        "TA005": "The request spans {files} files and {objectives} goals: high risk of context saturation or truncated output. Split it into batches of 1-2 files.",
        "TA006_complaint": "Saying it's wrong is not enough: state what you expected instead (e.g. 'expected X, got Y', or the file/function to fix).",
        "TA006_revert": "After reverting, state what you expected so the next attempt doesn't repeat the drift.",
        "TA007": "Adding the error message or the expected behavior helps solve the task in a single turn.",
        "TA008": "State criteria or constraints (e.g. 'without breaking tests', 'keep the API') to prevent side effects.",
        "TA009": "Specify the desired format (e.g. 'bullet summary', 'glossary', 'table') to avoid costly regenerations.",
        "TA010": "State the source (e.g. audio, URL, document) or key topic to narrow the context.",
        "ok_steering": "Concise follow-up directive: reuses prior context and saves tokens.",
        "ok_code": "Specific request: file, target and context defined, minimizing turns and cost.",
        "ok_research": "Clear request: topic, source and format defined to solve it in a single turn.",
        "scaffold_code": "In {file}, {action} {symbol} so that [expected result] without breaking [tests/constraint].",
        "scaffold_correction": "I expected [expected behavior] but got [actual result] in [file/function].",
        "scaffold_research": "Synthesize {topic} as [bullets/table] from {source} focusing on [criterion].",
        "ph_file": "[file]",
        "ph_action": "[action]",
        "ph_symbol": "[function/symbol]",
        "ph_topic": "[topic]",
        "ph_source": "[audio/document/URL]"
      }
    }
  };
  /* </ta-spec> */

  // Python `re` trata \b y \w como Unicode; JS solo ASCII. Se traducen a clases
  // Unicode (flag `u`) para que ambos motores devuelvan exactamente lo mismo.
  const W = '\\p{L}\\p{N}_';
  const BOUND = `(?:(?<=[${W}])(?![${W}])|(?<![${W}])(?=[${W}]))`;
  const SYNTAX = '^$\\.*+?()[]{}|/';
  function pyRegex(source, flags, global) {
    let out = '';
    let inClass = false;
    for (let i = 0; i < source.length; i++) {
      const ch = source[i];
      if (ch === '\\' && i + 1 < source.length) {
        const nx = source[++i];
        if (nx === 'b' && !inClass) out += BOUND;
        else if (nx === 'w') out += inClass ? W : `[${W}]`;
        else if (inClass || /[sSdDWBntr]/.test(nx) || SYNTAX.includes(nx) || /\d/.test(nx)) out += '\\' + nx;
        else out += nx; // identity escape (p. ej. \- fuera de clase): inválido con flag u
        continue;
      }
      if (ch === '[' && !inClass) inClass = true;
      else if (ch === ']' && inClass) inClass = false;
      out += ch;
    }
    return new RegExp(out, 'u' + (flags || '') + (global ? 'g' : ''));
  }

  let _ta = null;
  function taCompiled() {
    if (_ta) return _ta;
    const re = {};
    const reG = {};
    const reFull = {};
    for (const [name, p] of Object.entries(TA_SPEC.patterns)) {
      re[name] = pyRegex(p.source, p.flags, false);
      reG[name] = pyRegex(p.source, p.flags, true);
      reFull[name] = pyRegex(`^(?:${p.source})$`, p.flags, false);
    }
    const kw = (list) => list.map((k) => pyRegex(k, '', false));
    _ta = {
      re, reG, reFull,
      software: kw(TA_SPEC.softwareKeywords),
      research: kw(TA_SPEC.researchKeywords),
      deep: kw(TA_SPEC.deepKeywords),
      fast: kw(TA_SPEC.fastKeywords),
      stoplist: new Set(TA_SPEC.moduleStoplist),
    };
    return _ta;
  }

  const taFormat = (tpl, vals) => tpl.replace(/\{(\w+)\}/g, (_, k) => (k in vals ? String(vals[k]) : `{${k}}`));
  const taLen = (s) => Array.from(s).length; // len() de Python cuenta code points
  const taSplit = (s) => s.split(/\s+/u).filter(Boolean);
  const STRIP_CHARS = "`'\".,;:()[]{}";

  function taNormPath(p) {
    let s = p.trim();
    let a = 0;
    let b = s.length;
    while (a < b && STRIP_CHARS.includes(s[a])) a++;
    while (b > a && STRIP_CHARS.includes(s[b - 1])) b--;
    s = s.slice(a, b).replace(/\\/g, '/');
    while (s.startsWith('./')) s = s.slice(2);
    return s.toLowerCase();
  }

  const TaskAssessor = {
    classify(prompt) {
      if (!prompt || !String(prompt).trim()) return 'code';
      const t = taCompiled();
      const lower = prompt.toLowerCase();
      const research = t.research.filter((r) => r.test(lower)).length;
      let software = t.software.filter((r) => r.test(lower)).length;
      if (t.re.CODE_FILE.test(lower) || t.re.CODE_VOICE_FILE.test(lower)) software += 2;
      if (t.re.CODE_HINT.test(lower)) software += 1;
      if (t.re.SYMBOLS.test(prompt)) software += 1;
      if (research > software) return 'research';
      if (software > 0) return 'code';
      return 'research';
    },

    _parseContext(context) {
      const ctx = context && typeof context === 'object' && !Array.isArray(context) ? context : {};
      let known = 'known_files' in ctx ? ctx.known_files : ctx.knownFiles;
      if (Array.isArray(known) || known instanceof Set) {
        known = Array.from(known).filter((f) => typeof f === 'string' && f.trim()).map(taNormPath);
      } else {
        known = [];
      }
      const turn = Number.isInteger(ctx.turn) && ctx.turn >= 1 ? ctx.turn : 1;
      const isVoice = ('is_voice' in ctx ? ctx.is_voice : ctx.isVoice) === true;
      const lang = Object.prototype.hasOwnProperty.call(TA_SPEC.messages, ctx.lang) ? ctx.lang : 'es';
      return { knownFiles: known, turn, isVoice, lang };
    },

    _voiceNormalize(text) {
      const t = taCompiled();
      return text.replace(t.reG.VOICE_SEP, '/').replace(t.reG.VOICE_DOT, (m, _g1, ext) => '.' + ext);
    },

    _ground(text, intent, known) {
      const t = taCompiled();
      const mentioned = [];
      const found = [...text.matchAll(t.reG.FILE_EXT), ...text.matchAll(t.reG.PATH)];
      for (const m of found) {
        const p = taNormPath(m[0]);
        if (p && !mentioned.includes(p) && !t.re.URL.test(p)) mentioned.push(p);
      }
      const verified = [];
      const missing = [];
      const modules = [];
      if (known.length) {
        for (const p of mentioned) {
          const isFile = t.reFull.FILE_EXT.test(p);
          const hit = known.some((f) => f === p || f.endsWith('/' + p));
          const isDir = !isFile && known.some((f) => f.startsWith(p + '/') || f.includes('/' + p + '/'));
          if (hit || isDir) verified.push(p);
          else if (isFile) missing.push(p);
        }
        if (intent === 'code') {
          const stemOf = (path) => {
            const base = path.slice(path.lastIndexOf('/') + 1);
            const dot = base.lastIndexOf('.');
            return dot >= 0 ? base.slice(0, dot) : base;
          };
          const stems = new Set();
          for (const f of known) {
            const stem = stemOf(f);
            if (taLen(stem) >= 4 && !t.stoplist.has(stem)) stems.add(stem);
          }
          const covered = new Set();
          for (const p of mentioned) {
            covered.add(stemOf(p));
            for (const part of p.split('/')) covered.add(part);
          }
          for (const m of text.toLowerCase().matchAll(t.reG.TOKEN)) {
            const tok = m[0];
            if (stems.has(tok) && !covered.has(tok) && !modules.includes(tok)) modules.push(tok);
          }
        }
      }
      return { mentioned, verified, missing, modules };
    },

    assess(prompt, context) {
      const t = taCompiled();
      const R = t.re;
      const ctx = TaskAssessor._parseContext(context);
      const { turn, lang } = ctx;
      const known = ctx.knownFiles;
      const msg = TA_SPEC.messages[lang];
      const grounded = known.length > 0;
      const text = typeof prompt === 'string' ? prompt.trim() : '';

      if (!text) {
        return TaskAssessor._result({
          score: 0, intent: 'code', targets: { mentioned: [], verified: [], missing: [], modules: [] },
          grounded, risk: 'high', files: 0, objectives: 0, split: false, tier: 'standard',
          steering: false, correction: false, signals: [],
          issues: [{ id: 'TA000', severity: 'critical', message: msg.TA000 }],
          tip: msg.TA000,
          scaffold: taFormat(msg.scaffold_code, { file: msg.ph_file, action: msg.ph_action, symbol: msg.ph_symbol }),
          turn, lang,
        });
      }

      const lower = text.toLowerCase();
      const words = taSplit(text);
      const charCount = taLen(text);
      const intent = TaskAssessor.classify(text);
      const signals = [];
      const issues = [];

      const hasVoice = ctx.isVoice || R.VOICE_FILE_EXT.test(text) || R.VOICE_PATH.test(text)
        || R.VOICE_INDICATORS.test(text) || R.VOICE_SYMBOL.test(text);
      if (hasVoice) signals.push('expresión técnica fonética (modo voz)');
      const groundText = hasVoice ? TaskAssessor._voiceNormalize(text) : text;
      const targets = TaskAssessor._ground(groundText, intent, known);

      const hasAction = R.ACTION.test(text);
      const hasStdFile = R.FILE_EXT.test(text) || R.PATH.test(text);
      const hasVoiceFile = R.VOICE_FILE_EXT.test(text) || R.VOICE_PATH.test(text);
      const hasStdSym = R.SYMBOLS.test(text);
      const hasVoiceSym = R.VOICE_SYMBOL.test(text);
      const hasContextErr = R.CONTEXT_OR_ERROR.test(text);
      const hasConstraints = R.CONSTRAINTS.test(text);
      const hasSource = R.RESEARCH_SOURCES.test(text) || R.FILE_EXT.test(text);
      const hasOutputFormat = R.RESEARCH_OUTPUT_FORMAT.test(text);
      const hasTopic = R.RESEARCH_TOPIC.test(text);
      const hasSymbol = hasStdSym || hasVoiceSym;
      const creating = R.CREATE.test(text);
      const hasTarget = grounded
        ? Boolean(targets.verified.length || targets.modules.length || (creating && targets.missing.length))
        : hasStdFile || hasVoiceFile;

      const isRevert = turn > 1 && R.REVERT.test(text);
      const isComplaint = turn > 1 && R.COMPLAINT.test(text);
      const hasCounterexample = Boolean(hasTarget || hasSymbol || hasContextErr || R.EXPECTED.test(text)
        || targets.mentioned.length);
      const correction = isRevert || isComplaint;
      const steering = turn > 1 && (isRevert || (R.STEERING.test(text) && !isComplaint));

      const actions = [];
      for (const m of text.matchAll(t.reG.ACTION)) {
        const verb = m[0].toLowerCase();
        if (!actions.includes(verb)) actions.push(verb);
      }
      const files = grounded
        ? targets.verified.length + targets.missing.length + targets.modules.length
        : targets.mentioned.length;
      const objectives = actions.length;
      const split = files >= 3 || (objectives >= 3 && files >= 2);

      let score;
      if (steering) {
        score = 80;
        signals.push('dirección concisa de seguimiento (steering)');
        if (hasAction) score += 5;
        if (hasConstraints || hasContextErr) score += 5;
        score = Math.min(100, Math.max(50, score));
        if (isRevert && !hasCounterexample) issues.push({ id: 'TA006', severity: 'low', message: msg.TA006_revert });
      } else {
        score = 20;
        if (turn === 1) {
          if (words.length <= 3 || charCount < 15) {
            score -= 20;
          } else if (charCount >= 20 && charCount <= 800) {
            score += 15;
            signals.push('longitud adecuada');
          }
        } else if (charCount >= 20 && charCount <= 800) {
          score += 15;
          signals.push('longitud adecuada');
        } else if (words.length <= 5) {
          score += 10;
          signals.push('concisión en seguimiento ahorra tokens');
        }

        if (hasAction) {
          score += 20;
          signals.push('acción clara');
        }

        const antipattern = turn === 1 && R.ANTIPATTERN.test(text);

        if (intent === 'code') {
          if (grounded) {
            if (targets.verified.length) {
              score += 30;
              signals.push('archivo verificado en workspace');
            } else if (targets.modules.length) {
              score += 20;
              signals.push('módulo del workspace reconocido');
            } else if (creating && targets.missing.length) {
              score += 25;
              signals.push('archivo nuevo a crear');
            }
          } else if (hasVoiceFile) {
            score += 25;
            signals.push('archivo o ruta objetivo (fonético)');
          } else if (hasStdFile) {
            score += 25;
            signals.push('archivo o ruta objetivo');
          }

          if (targets.missing.length && R.EDIT.test(text) && !creating) {
            score -= 15;
            signals.push('archivo inexistente en workspace');
            issues.push({ id: 'TA004', severity: 'high', message: taFormat(msg.TA004, { file: targets.missing[0] }) });
          }

          if (hasVoiceSym) {
            score += 15;
            signals.push('símbolo o identificador técnico (fonético)');
          } else if (hasStdSym) {
            score += 15;
            signals.push('símbolo o identificador técnico');
          }
          if (hasContextErr) {
            score += 15;
            signals.push('contexto de error o diagnóstico');
          }
          if (hasConstraints) {
            score += 10;
            signals.push('criterios o restricciones');
          }
          if (turn > 1 && !(hasStdFile || hasVoiceFile)) {
            score += 15;
            signals.push('contexto heredado de turno previo');
          }
        } else {
          if (hasSource) {
            score += 20;
            signals.push('fuente o insumo de datos');
          }
          if (hasOutputFormat) {
            score += 15;
            signals.push('formato de salida definido');
          }
          if (hasTopic) {
            score += 10;
            signals.push('claridad temática o dominio');
          }
          if (hasConstraints) {
            score += 10;
            signals.push('criterios o restricciones');
          }
          if (turn > 1) {
            score += 15;
            signals.push('contexto heredado de turno previo');
          }
        }

        if (antipattern) {
          score -= 25;
          signals.push('antipatrón ambiguo detectado');
          issues.push({ id: 'TA001', severity: 'high', message: msg['TA001_' + intent] });
        } else if (turn === 1 && (words.length <= 3 || charCount < 15)) {
          issues.push({ id: 'TA002', severity: 'high', message: msg.TA002 });
        }

        if (isComplaint && !hasCounterexample) {
          score = Math.min(score, 45);
          signals.push('corrección sin contra-ejemplo');
          issues.push({ id: 'TA006', severity: 'high', message: msg.TA006_complaint });
        }

        if (intent === 'code') {
          if (turn === 1 && !hasTarget && !hasSymbol && !targets.missing.length) {
            issues.push({ id: 'TA003', severity: 'medium', message: msg.TA003 });
          }
          if (R.FIX.test(text) && !hasContextErr) issues.push({ id: 'TA007', severity: 'low', message: msg.TA007 });
          if (turn === 1 && !hasConstraints && R.MUTATING.test(text)) {
            issues.push({ id: 'TA008', severity: 'low', message: msg.TA008 });
          }
        } else {
          if (!hasOutputFormat && turn === 1) issues.push({ id: 'TA009', severity: 'medium', message: msg.TA009 });
          if (!hasSource && turn === 1) issues.push({ id: 'TA010', severity: 'medium', message: msg.TA010 });
        }
      }

      if (split) {
        score = Math.min(score, 75);
        signals.push('pedido multi-archivo / multi-objetivo');
        issues.push({ id: 'TA005', severity: 'medium', message: taFormat(msg.TA005, { files, objectives }) });
      }

      score = Math.max(5, Math.min(100, score));

      let risk;
      if (steering) {
        risk = 'low';
      } else if (intent === 'code') {
        if (targets.missing.length && !hasTarget) risk = 'high';
        else if (hasTarget && (hasSymbol || hasContextErr)) risk = 'low';
        else if (hasTarget || hasSymbol || turn > 1) risk = 'medium';
        else risk = 'high';
      } else if (hasSource && hasOutputFormat) {
        risk = 'low';
      } else if (hasSource || hasOutputFormat || turn > 1) {
        risk = 'medium';
      } else {
        risk = 'high';
      }

      let tier;
      if (split || t.deep.some((r) => r.test(lower))) {
        tier = 'deep';
      } else if (steering || t.fast.some((r) => r.test(lower))
        || (R.READONLY.test(text) && words.length <= 40 && !R.MUTATING.test(text))) {
        tier = 'cheap';
      } else {
        tier = 'standard';
      }

      let tip;
      if (issues.length) {
        const rank = TA_SPEC.severityRank;
        tip = issues.slice().sort((a, b) => rank[a.severity] - rank[b.severity])[0].message;
      } else if (steering) {
        tip = msg.ok_steering;
      } else {
        tip = msg['ok_' + intent];
      }

      let scaffold = '';
      if (score < 50) {
        if (correction) {
          scaffold = msg.scaffold_correction;
        } else if (intent === 'code') {
          const pool = targets.verified.length ? targets.verified
            : targets.modules.length ? targets.modules : targets.mentioned;
          const sym = text.match(R.SYMBOLS);
          scaffold = taFormat(msg.scaffold_code, {
            file: pool[0] || msg.ph_file,
            action: actions.length ? actions[0] : msg.ph_action,
            symbol: sym ? sym[0] : msg.ph_symbol,
          });
        } else {
          const topic = text.match(R.RESEARCH_TOPIC);
          const source = text.match(R.RESEARCH_SOURCES);
          scaffold = taFormat(msg.scaffold_research, {
            topic: topic ? topic[0] : msg.ph_topic,
            source: source ? source[0] : msg.ph_source,
          });
        }
      }

      return TaskAssessor._result({
        score, intent, targets, grounded, risk, files, objectives, split, tier, steering,
        correction, signals, issues, tip, scaffold, turn, lang,
      });
    },

    _result(r) {
      let quality;
      if (r.score >= 90) quality = 'exemplary';
      else if (r.score >= 70) quality = 'specific';
      else if (r.score >= 50) quality = 'moderate';
      else quality = 'vague';
      return {
        version: VERSION,
        score: r.score,
        quality,
        intent: r.intent,
        targets: r.targets,
        grounded: r.grounded,
        exploration_risk: r.risk,
        explorationRisk: r.risk,
        scope: { files: r.files, objectives: r.objectives, suggest_split: r.split, suggestSplit: r.split },
        recommended_tier: r.tier,
        recommendedTier: r.tier,
        steering: r.steering,
        correction: r.correction,
        signals: r.signals,
        issues: r.issues,
        tip: r.tip,
        scaffold: r.scaffold,
        turn: r.turn,
        lang: r.lang,
      };
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
    assess: (prompt, context) => TaskAssessor.assess(prompt, context),
    classifyTask: (prompt) => TaskAssessor.classify(prompt),
    Signals,
    Patterns,
    Analyzer,
    Adversarial,
    Rewriter,
    TaskAssessor,
  };
}));

// ── CLI (solo Node): `node promptometer-core.js assess "texto" [--files-from git|<archivo>] [--turn N] [--voice] [--lang en] [--compact]`
if (typeof require !== 'undefined' && typeof module === 'object' && require.main === module) {
  (function cli(core, argv) {
    const fs = require('fs');
    const [command, ...rest] = argv;
    const opts = { turn: 1, voice: false, lang: 'es', compact: false, filesFrom: null };
    const positional = [];
    for (let i = 0; i < rest.length; i++) {
      const a = rest[i];
      if (a === '--turn') opts.turn = parseInt(rest[++i], 10);
      else if (a === '--lang') opts.lang = rest[++i];
      else if (a === '--files-from') opts.filesFrom = rest[++i];
      else if (a === '--voice') opts.voice = true;
      else if (a === '--compact') opts.compact = true;
      else positional.push(a);
    }
    if (command !== 'assess' && command !== 'analyze') {
      process.stderr.write('uso: promptometer-core.js assess|analyze "texto" [--files-from git|<archivo>] [--turn N] [--voice] [--lang es|en] [--compact]\n');
      process.exit(2);
    }
    const text = positional.length ? positional.join(' ') : fs.readFileSync(0, 'utf8');
    if (command === 'analyze') {
      process.stdout.write(JSON.stringify(core.analyze(text), null, 2) + '\n');
      return;
    }
    let known = [];
    if (opts.filesFrom === 'git') {
      try {
        known = require('child_process').execFileSync('git', ['ls-files'], { encoding: 'utf8' }).split(/\r?\n/).filter((l) => l.trim());
      } catch (e) {
        process.stderr.write(`promptometer: no se pudo ejecutar 'git ls-files': ${e.message}\n`);
        process.exit(1);
      }
    } else if (opts.filesFrom) {
      known = fs.readFileSync(opts.filesFrom, 'utf8').split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    }
    const result = core.assess(text, { known_files: known, turn: opts.turn, is_voice: opts.voice, lang: opts.lang });
    process.stdout.write(JSON.stringify(result, null, opts.compact ? 0 : 2) + '\n');
  }(module.exports, process.argv.slice(2)));
}
