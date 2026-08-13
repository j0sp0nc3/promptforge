// ============================================================================
// Promptometer — Domain Intelligence & Context Gap Analyzer
// Classifies prompt into 8 Domain Archetypes, identifies domain-specific
// context gaps (e.g. missing tech stack, error handling, target persona,
// RAG anti-hallucination rules), and provides a zero-latency client-side
// DomainSynthesizer fallback engine.
// ============================================================================

const DomainAnalyzer = (() => {

  // ── 8 Canonical Domain Archetypes ─────────────────────────────────────────
  const ARCHETYPES = {
    SOFTWARE_ENGINEERING: 'software_engineering',
    DATA_EXTRACTION: 'data_extraction',
    MARKETING_COPY: 'marketing_copy',
    RHETORIC_CREATIVE: 'rhetoric_creative',
    RAG_KNOWLEDGE: 'rag_knowledge',
    AGENTIC_TOOL_USE: 'agentic_tool_use',
    FINANCIAL_LEGAL: 'financial_legal',
    GENERAL_TASK: 'general_task'
  };

  /**
   * Infer the Domain Archetype of a prompt based on signal keywords and intent cues.
   * @param {string} prompt Raw prompt text.
   * @returns {string} One of ARCHETYPES values.
   */
  function inferArchetype(prompt) {
    if (!prompt || typeof prompt !== 'string') return ARCHETYPES.GENERAL_TASK;
    const lower = prompt.toLowerCase();

    // 1. Agentic / Tool Use
    if (/\b(tool_use|function_call|agent|multi.?agent|tool_choice|<tools?>|available functions|funciones disponibles|@tool|function calling|agente autónomo|reproducir pasos|tool response)\b/i.test(lower)) {
      return ARCHETYPES.AGENTIC_TOOL_USE;
    }

    // 2. Data Extraction / Structured Output
    if (/\b(extract|extrae|parse|parsear|json schema|esquema json|csv|regex|unstructured to structured|extraer datos|extrae el texto|devolver json|retorna json|convertir a json|extraer información|expresión regular)\b/i.test(lower)) {
      return ARCHETYPES.DATA_EXTRACTION;
    }

    // 3. Software Engineering
    if (/\b(code|código|api|endpoint|backend|frontend|function|función|class|clase|database|base de datos|sql|bug|fix|refactor|script|node\.?js|python|react|typescript|javascript|rest api|html|css|github|git|algoritmo|función lambda|función async)\b/i.test(lower)) {
      return ARCHETYPES.SOFTWARE_ENGINEERING;
    }

    // 4. RAG / Document Knowledge
    if (/\b(retrieved document|documentos recuperados|<context>|<documents?>|based on the text|basado en el texto|knowledge base|base de conocimiento|según el documento|de acuerdo al texto|pdf|fuente adjunta|contexto adjunto)\b/i.test(lower)) {
      return ARCHETYPES.RAG_KNOWLEDGE;
    }

    // 5. Financial / Legal
    if (/\b(contract|contrato|clause|cláusula|legal|compliance|cumplimiento|financial|financiero|audit|auditoría|tax|impuestos|revenue|balance|patrimonio|riesgo legal|riesgo financiero|estatus regulatorio)\b/i.test(lower)) {
      return ARCHETYPES.FINANCIAL_LEGAL;
    }

    // 6. Marketing / Sales Copy
    if (/\b(marketing|email campaign|campaña|sales copy|copywriting|landing page|cta|call to action|anuncio|ad copy|social media|post|headline|titular|audiencia|buyer persona|convertir clientes|embudo|ventas|correo|b2b|promocionar|saas|lead|publicidad)\b/i.test(lower)) {
      return ARCHETYPES.MARKETING_COPY;
    }

    // 7. Rhetoric / Creative Writing
    if (/\b(write a story|escribe una historia|poem|poema|haiku|novel|novela|creative writing|redacción creativa|guion|scriptwriter|personaje|fiction|ficción|fantasma|canción)\b/i.test(lower)) {
      return ARCHETYPES.RHETORIC_CREATIVE;
    }

    return ARCHETYPES.GENERAL_TASK;
  }

  /**
   * Evaluate Domain-Specific Context Gaps for a given prompt and archetype.
   * @param {string} prompt Raw prompt text.
   * @param {string} archetype Derived domain archetype.
   * @returns {Array<Object>} List of missing domain context gap objects.
   */
  function evaluateContextGaps(prompt, archetype) {
    if (!prompt || typeof prompt !== 'string') return [];
    const lower = prompt.toLowerCase();
    const gaps = [];

    switch (archetype) {
      case ARCHETYPES.SOFTWARE_ENGINEERING:
        if (!/\b(node|python|typescript|javascript|react|vue|express|django|fastapi|java|c#|go|rust|sql|postgres|mongo)\b/i.test(lower)) {
          gaps.push({
            id: 'missing_tech_stack',
            key: 'contextGaps.software.techStack',
            actionChipKey: 'contextGaps.chips.addTechStack',
            snippetToInject: '\n<stack_tecnico>\nLenguaje: Node.js (TypeScript)\nFramework: Express / Fastify\nBase de Datos: PostgreSQL\n</stack_tecnico>'
          });
        }
        if (!/\b(4\d{2}|5\d{2}|error|exception|excepción|status code|código de estado|try.?catch|fallback|manejo de errores)\b/i.test(lower)) {
          gaps.push({
            id: 'missing_error_strategy',
            key: 'contextGaps.software.errorStrategy',
            actionChipKey: 'contextGaps.chips.addErrorStrategy',
            snippetToInject: '\n<manejo_errores>\n- HTTP 400 Bad Request: si los datos de entrada no cumplen el esquema.\n- HTTP 401 Unauthorized: si falta el token de autenticación.\n- HTTP 500 Internal Error: respuesta JSON estandarizada con código de error interno.\n</manejo_errores>'
          });
        }
        if (!/\b(jwt|auth|bearer|api.?key|password|hash|bcrypt|security|seguridad|sanitiz)\b/i.test(lower)) {
          gaps.push({
            id: 'missing_security_spec',
            key: 'contextGaps.software.securitySpec',
            actionChipKey: 'contextGaps.chips.addSecuritySpec',
            snippetToInject: '\n<seguridad_y_sanitizacion>\n- Validar y sanitizar todo input antes de procesarlo.\n- Autenticación requerida mediante Bearer Token JWT.\n- Nunca exponer credenciales o llaves en texto plano.\n</seguridad_y_sanitizacion>'
          });
        }
        break;

      case ARCHETYPES.DATA_EXTRACTION:
        if (!/\b(json|schema|esquema|keys|claves|campos|properties|propiedades|table|tabla|columns)\b/i.test(lower)) {
          gaps.push({
            id: 'missing_target_schema',
            key: 'contextGaps.extraction.targetSchema',
            actionChipKey: 'contextGaps.chips.addTargetSchema',
            snippetToInject: '\n<esquema_salida>\nDevuelve únicamente un objeto JSON con la siguiente estructura:\n{\n  "nombre": "string",\n  "fecha": "YYYY-MM-DD",\n  "monto": "number",\n  "estado": "string"\n}\n</esquema_salida>'
          });
        }
        if (!/\b(null|empty|vacio|vacío|missing|faltante|desconocido|n\/a|not found)\b/i.test(lower)) {
          gaps.push({
            id: 'missing_null_fallback',
            key: 'contextGaps.extraction.nullFallback',
            actionChipKey: 'contextGaps.chips.addNullFallback',
            snippetToInject: '\n<regla_datos_faltantes>\nSi un dato no se encuentra en el texto original, asigna exactamente null o "N/A". No inventes información.\n</regla_datos_faltantes>'
          });
        }
        break;

      case ARCHETYPES.MARKETING_COPY:
        if (!/\b(audience|audiencia|target|público|persona|cliente ideal|comprador|b2b|b2c)\b/i.test(lower)) {
          gaps.push({
            id: 'missing_target_audience',
            key: 'contextGaps.marketing.targetAudience',
            actionChipKey: 'contextGaps.chips.addTargetAudience',
            snippetToInject: '\n<audiencia_objetivo>\nLíderes de tecnología y directores de producto B2B que buscan automatizar procesos sin aumentar presupuesto.\n</audiencia_objetivo>'
          });
        }
        if (!/\b(tone|tono|voice|voz|formal|persuasivo|emocional|profesional|cercano|urgencia)\b/i.test(lower)) {
          gaps.push({
            id: 'missing_brand_tone',
            key: 'contextGaps.marketing.brandTone',
            actionChipKey: 'contextGaps.chips.addBrandTone',
            snippetToInject: '\n<tono_de_marca>\nTono profesional, empático, directo y orientado a la acción sin caer en sensacionalismo.\n</tono_de_marca>'
          });
        }
        break;

      case ARCHETYPES.RAG_KNOWLEDGE:
        if (!/\b(don'?t make up|no inventes|fuentes|cite|cita|cita únicamente|solo del texto|if not present|si no está en el texto)\b/i.test(lower)) {
          gaps.push({
            id: 'missing_rag_anti_hallucination',
            key: 'contextGaps.rag.antiHallucination',
            actionChipKey: 'contextGaps.chips.addRagAntiHallucination',
            snippetToInject: '\n<proteccion_anti_alucinacion>\nUsa ÚNICAMENTE los documentos proporcionados. Si la respuesta no está contenida en el texto, responde estrictamente: "Información no disponible en el contexto proporcionado". No uses conocimientos externos.\n</proteccion_anti_alucinacion>'
          });
        }
        break;

      case ARCHETYPES.AGENTIC_TOOL_USE:
        if (!/\b(thought|pensamiento|plan|pasos|step.by.step|paso a paso|reasoning)\b/i.test(lower)) {
          gaps.push({
            id: 'missing_agent_reasoning',
            key: 'contextGaps.agentic.agentReasoning',
            actionChipKey: 'contextGaps.chips.addAgentReasoning',
            snippetToInject: '\n<patron_ejecucion>\nAntes de invocar cualquier herramienta, escribe tu razonamiento interno en la sección <pensamiento>. Luego ejecuta la acción <accion> y analiza la <observacion>.\n</patron_ejecucion>'
          });
        }
        break;
    }

    return gaps;
  }

  /**
   * Helper: Cleanly extract core user task, stripping nested XML tags and prior metadata blocks.
   */
  function extractCoreTask(prompt) {
    if (!prompt || typeof prompt !== 'string') return '';
    let text = prompt.trim();

    // 1. If <tarea>...</tarea> or <task>...</task> exists, extract content inside
    const taskMatch = text.match(/<(?:task|tarea)>([\s\S]*?)<\/(?:task|tarea)>/i);
    if (taskMatch) {
      text = taskMatch[1].trim();
    }

    // 2. Strip full blocks of previous metadata tags (<role>...</role>, <rol>...</rol>, etc.)
    text = text.replace(/<(?:role|rol)>[\s\S]*?<\/(?:role|rol)>/gi, '');
    text = text.replace(/<(?:output_format|formato_salida)>[\s\S]*?<\/(?:output_format|formato_salida)>/gi, '');
    text = text.replace(/<(?:constraints|restricciones)>[\s\S]*?<\/(?:constraints|restricciones)>/gi, '');
    text = text.replace(/<(?:examples|ejemplos)>[\s\S]*?<\/(?:examples|ejemplos)>/gi, '');
    text = text.replace(/<(?:error_handling|manejo_errores)>[\s\S]*?<\/(?:error_handling|manejo_errores)>/gi, '');
    text = text.replace(/<(?:context|contexto)>[\s\S]*?<\/(?:context|contexto)>/gi, '');
    text = text.replace(/<(?:stack_tecnico|tech_stack)>[\s\S]*?<\/(?:stack_tecnico|tech_stack)>/gi, '');

    // 3. Strip lingering orphan opening/closing tags
    text = text.replace(/<\/?(?:role|rol|task|tarea|context|contexto|constraints|restricciones|output_format|formato_salida|examples|ejemplos|error_handling|manejo_errores|stack_tecnico|audiencia_objetivo)>/gi, '');

    // 4. Strip prepended/appended template instructions if present
    text = text.replace(/Before giving your final answer, think step by step:[\s\S]*?meets all the requested requirements\./gi, '');
    text = text.replace(/Structure your response clearly:[\s\S]*?unsolicited information\./gi, '');
    text = text.replace(/Example input:[\s\S]*?expected in the response\./gi, '');

    // 5. Clean up extra blank lines
    text = text.replace(/\n{3,}/g, '\n\n').trim();

    return text || prompt.trim();
  }

  /**
   * Helper: Infer topic-aligned expert role based on content keywords and domain archetype.
   */
  function inferDynamicRole(prompt, archetype) {
    const lower = (prompt || '').toLowerCase();

    // 1. Geology / Earth Science / Earth System / Volcanoes / Magma
    if (/\b(magma|volcán|volcan|geología|geologia|tierra|placas tectónicas|rocas|minerales|terremoto|sismo|corteza|manto|núcleo|litosfera|astenosfera)\b/i.test(lower)) {
      return 'Geólogo y Vulcanólogo Senior especializado en Dinámica del Manto y Ciencias de la Tierra';
    }

    // 2. Health / Medicine / Biology
    if (/\b(salud|medicina|síntomas|enfermedad|paciente|tratamiento|célula|genética|biología|nutrición|médico|virus|bacterias)\b/i.test(lower)) {
      return 'Especialista Senior en Ciencias Biomédicas y Salud';
    }

    // 3. History / Humanities / Social Sciences
    if (/\b(historia|filosofía|literatura|siglo|imperio|guerra|arte|cultura|sociedad|sociología|política)\b/i.test(lower)) {
      return 'Investigador Senior en Humanidades, Historia y Ciencias Sociales';
    }

    // 4. Physics / Chemistry / Astronomy
    if (/\b(física|química|astronomía|espacio|planeta|estrella|átomo|energía|cuántica|gravedad|universo)\b/i.test(lower)) {
      return 'Científico de Investigación en Ciencias Exactas, Física y Astrofísica';
    }

    // 5. Archetype-based Roles
    switch (archetype) {
      case ARCHETYPES.SOFTWARE_ENGINEERING:
        return 'Arquitecto Senior de Software y Especialista en Desarrollo Backend/Frontend';
      case ARCHETYPES.DATA_EXTRACTION:
        return 'Especialista en Extracción de Datos, Parsing y Estructuración de Información';
      case ARCHETYPES.MARKETING_COPY:
        return 'Director de Copywriting Persuasivo y Estrategia de Marketing Digital';
      case ARCHETYPES.RAG_KNOWLEDGE:
        return 'Especialista en Sistemas RAG (Retrieval-Augmented Generation) y Bases de Conocimiento';
      case ARCHETYPES.AGENTIC_TOOL_USE:
        return 'Ingeniero de Agentes Autónomos y Orquestación de Herramientas LLM';
      case ARCHETYPES.FINANCIAL_LEGAL:
        return 'Consultor Senior de Análisis Legal, Financiero y Cumplimiento Regulatorio';
      case ARCHETYPES.RHETORIC_CREATIVE:
        return 'Redactor Creativo Senior y Especialista en Narrativa';
      default:
        return 'Especialista de Investigación e Inteligencia Analítica en la Materia';
    }
  }

  /**
   * Client-side DomainSynthesizer: Zero-latency, zero-cost semantic context enrichment fallback.
   * Synthesizes an expert-level domain prompt by weaving identified context gaps and domain rules.
   * @param {string} prompt Raw user prompt.
   * @param {string} archetype Derived domain archetype.
   * @param {Array<Object>} gaps List of context gaps.
   * @returns {Object} Synthesized prompt result object.
   */
  function synthesizeLocal(prompt, archetype, gaps) {
    if (!prompt || typeof prompt !== 'string') return { improvedPrompt: '', explanation: '' };

    const cleanUserPrompt = extractCoreTask(prompt);
    const derivedArchetype = archetype || inferArchetype(cleanUserPrompt);
    const gapsToFix = gaps && gaps.length > 0 ? gaps : evaluateContextGaps(cleanUserPrompt, derivedArchetype);
    let injectedSnippets = gapsToFix.map(g => g.snippetToInject).join('\n');

    const domainRole = inferDynamicRole(cleanUserPrompt, derivedArchetype);

    const improvedPrompt = `<rol>\nActúa como un ${domainRole}.\nTu objetivo es ejecutar la siguiente tarea con precisión técnica impecable, cero alucinaciones y estricto apego a los requerimientos de dominio.\n</rol>\n\n<tarea>\n${cleanUserPrompt}\n</tarea>${injectedSnippets ? '\n\n' + injectedSnippets : ''}\n\n<restricciones>\n- Cumple rigurosamente con todas las especificaciones indicadas.\n- Si la información proporcionada es insuficiente o ambigua, indícalo expresamente antes de asumir datos.\n</restricciones>`;

    return {
      improvedPrompt,
      archetype: derivedArchetype,
      inferredGoal: cleanUserPrompt.substring(0, 120) + (cleanUserPrompt.length > 120 ? '...' : ''),
      gapsFixedCount: gapsToFix.length,
      source: 'local_synthesizer'
    };
  }

  return {
    ARCHETYPES,
    inferArchetype,
    evaluateContextGaps,
    synthesizeLocal
  };

})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = DomainAnalyzer;
}
