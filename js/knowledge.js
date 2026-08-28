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

  /* ── 1. Glosario: pure definitions not found elsewhere ────────
     Each term: { id, term:{es,en}, category, def:{es,en}, example:{es,en}?, crossRefs:[]? }
     crossRefs reference existing item IDs (AP###, BP###, tpl-*, adv.* test IDs). */
  glossary: [
    {
      id: 'g-token',
      term: { es: 'Token', en: 'Token' },
      category: 'fundamentos',
      def: {
        es: 'Unidad mínima de texto que un modelo procesa. No equivale a una palabra: una palabra común puede ser 1-2 tokens, una rara hasta 3-4. Los modelos facturan y miden su contexto en tokens, no en palabras.',
        en: 'The smallest unit of text a model processes. It is not a word: a common word may be 1-2 tokens, a rare one up to 3-4. Models bill and measure context in tokens, not words.',
      },
      example: { es: '"ChatGPT" ≈ 1 token · "desafortunadamente" ≈ 3-4 tokens', en: '"ChatGPT" ≈ 1 token · "unfortunately" ≈ 3-4 tokens' },
      crossRefs: ['stats.tokens'],
    },
    {
      id: 'g-temperature',
      term: { es: 'Temperature', en: 'Temperature' },
      category: 'parámetros',
      def: {
        es: 'Parámetro (0.0–2.0) que controla la aleatoriedad de la respuesta. Valores bajos (0.0–0.3) dan salidas deterministas y enfocadas; valores altos (0.8–1.2) dan salidas creativas pero menos predecibles. No se controla desde el prompt, pero conviene conocerlo al diseñar para una temperatura fija.',
        en: 'A parameter (0.0–2.0) controlling response randomness. Low values (0.0–0.3) give deterministic, focused outputs; high values (0.8–1.2) give creative but less predictable outputs. Not controlled from the prompt, but important to know when designing for a fixed temperature.',
      },
      example: { es: 'temperature=0.2 → respuestas consistentes · temperature=1.0 → respuestas variadas', en: 'temperature=0.2 → consistent answers · temperature=1.0 → varied answers' },
    },
    {
      id: 'g-top-p',
      term: { es: 'Top-p (nucleus sampling)', en: 'Top-p (nucleus sampling)' },
      category: 'parámetros',
      def: {
        es: 'Alternativa a temperature: el modelo considera solo los tokens cuya probabilidad acumulada alcanza p (ej. 0.9 = el 90% más probable). Top-p bajo = salidas conservadoras. Suele fijarse en 1.0 y usarse temperature como control principal.',
        en: 'An alternative to temperature: the model considers only tokens whose cumulative probability reaches p (e.g. 0.9 = the most likely 90%). Low top-p = conservative outputs. Usually set to 1.0 with temperature as the main control.',
      },
    },
    {
      id: 'g-context-window',
      term: { es: 'Context window', en: 'Context window' },
      category: 'fundamentos',
      def: {
        es: 'Cantidad máxima de tokens (entrada + salida) que el modelo puede procesar en una sola llamada. Superar el límite trunca el prompt o el historial. Prompts largos con muchos ejemplos few-shot consumen contexto rápido.',
        en: 'The maximum tokens (input + output) a model can process in a single call. Exceeding it truncates the prompt or history. Long prompts with many few-shot examples consume context quickly.',
      },
      crossRefs: ['g-few-shot'],
    },
    {
      id: 'g-system-prompt',
      term: { es: 'System / User / Assistant message', en: 'System / User / Assistant message' },
      category: 'fundamentos',
      def: {
        es: 'Los tres roles de un mensaje. System: instrucciones globales que definen comportamiento, tono y reglas (se aplican a toda la conversación). User: la entrada del humano en cada turno. Assistant: la respuesta del modelo. Un buen prompt de sistema es breve, declarativo y establece límites.',
        en: 'The three message roles. System: global instructions defining behavior, tone, and rules (apply to the whole conversation). User: the human input on each turn. Assistant: the model response. A good system prompt is concise, declarative, and sets boundaries.',
      },
      crossRefs: ['tpl-agente-conversacional'],
    },
    {
      id: 'g-embedding',
      term: { es: 'Embedding', en: 'Embedding' },
      category: 'rag',
      def: {
        es: 'Representación numérica (vector) del significado de un texto. Textos semánticamente similares tienen vectores cercanos. Base de la búsqueda semántica usada en RAG.',
        en: 'A numeric representation (vector) of a text meaning. Semantically similar texts have nearby vectors. The foundation of semantic search used in RAG.',
      },
      crossRefs: ['g-vector-store', 'tpl-rag-prompt'],
    },
    {
      id: 'g-vector-store',
      term: { es: 'Vector store / Retrieval', en: 'Vector store / Retrieval' },
      category: 'rag',
      def: {
        es: 'Base de datos que almacena embeddings y permite buscar los más similares a una consulta. El retrieval (recuperación) es el acto de buscar contexto relevante antes de generarlo.',
        en: 'A database that stores embeddings and lets you search for the most similar to a query. Retrieval is the act of fetching relevant context before generating.',
      },
      crossRefs: ['tpl-rag-prompt', 'g-grounding'],
    },
    {
      id: 'g-fine-tuning',
      term: { es: 'Fine-tuning', en: 'Fine-tuning' },
      category: 'fundamentos',
      def: {
        es: 'Entrenar un modelo con datos propios para que especialice su comportamiento. Útil cuando tienes miles de ejemplos y el prompting no basta. NO sustituye al buen prompting: un mal prompt sigue rindiendo mal aunque el modelo esté fine-tuned.',
        en: 'Training a model with your own data so it specializes its behavior. Useful when you have thousands of examples and prompting is not enough. It does NOT replace good prompting: a bad prompt still performs poorly even on a fine-tuned model.',
      },
    },
    {
      id: 'g-hallucination',
      term: { es: 'Hallucination', en: 'Hallucination' },
      category: 'seguridad',
      def: {
        es: 'Cuando el modelo genera información plausible pero falsa con confianza total. Causas comunes: falta de contexto, preguntas sobre datos post-cutoff, o ausencia de guardrails. Se mitiga con grounding, citas, e instrucciones tipo "si no lo sabes, di que no lo sabes".',
        en: 'When the model generates plausible but false information with total confidence. Common causes: lack of context, questions about post-cutoff data, or missing guardrails. Mitigated with grounding, citations, and "if you don\'t know, say so" instructions.',
      },
      crossRefs: ['AP030', 'BP009', 'hallucination'],
    },
    {
      id: 'g-grounding',
      term: { es: 'Grounding', en: 'Grounding' },
      category: 'rag',
      def: {
        es: 'Anclar la respuesta del modelo a una fuente verificable (documentos recuperados, datos, citas). Reduce alucinaciones al obligar al modelo a basarse en evidencia proporcionada en lugar de conocimiento paramétrico.',
        en: 'Anchoring the model response to a verifiable source (retrieved documents, data, citations). Reduces hallucinations by forcing the model to rely on provided evidence rather than parametric knowledge.',
      },
      crossRefs: ['tpl-rag-prompt', 'g-hallucination'],
    },
    {
      id: 'g-stop-sequence',
      term: { es: 'Stop sequence', en: 'Stop sequence' },
      category: 'parámetros',
      def: {
        es: 'Cadena de texto que detiene la generación del modelo cuando aparece. Útil en pipelines para delimitar dónde termina una respuesta estructurada (ej. detener tras el cierre de un JSON `}`).',
        en: 'A string that stops model generation when it appears. Useful in pipelines to delimit where a structured response ends (e.g. stop after a JSON closes with `}`).',
      },
    },
    {
      id: 'g-max-tokens',
      term: { es: 'Max tokens', en: 'Max tokens' },
      category: 'parámetros',
      def: {
        es: 'Límite máximo de tokens que el modelo generará en la respuesta. Si no se especifica, el modelo puede cortar a la mitad de una respuesta larga. Especificarlo evita respuestas parciales en salidas estructuradas.',
        en: 'The maximum tokens the model will generate in the response. If unspecified, the model may cut off mid long response. Specifying it prevents partial outputs in structured responses.',
      },
    },
    {
      id: 'g-function-calling',
      term: { es: 'Function calling / Tool use', en: 'Function calling / Tool use' },
      category: 'agentes',
      def: {
        es: 'Capacidad del modelo de decidir llamar a una herramienta/función externa (API, cálculo, búsqueda) y estructurar los argumentos en JSON. Base de los agentes y sistemas que actúan en el mundo. Se define declarando el esquema de la herramienta en el prompt o la API.',
        en: 'The model ability to decide to call an external tool/function (API, calculation, search) and structure the arguments as JSON. The foundation of agents and systems that act in the world. Defined by declaring the tool schema in the prompt or API.',
      },
      crossRefs: ['hasToolUse'],
    },
    {
      id: 'g-prompt-chaining',
      term: { es: 'Prompt chaining', en: 'Prompt chaining' },
      category: 'agentes',
      def: {
        es: 'Dividir una tarea compleja en una secuencia de prompts donde la salida de uno alimenta al siguiente. Cada paso hace una sola cosa bien. Reduce errores vs. un mega-prompt que intenta hacer todo.',
        en: 'Splitting a complex task into a sequence of prompts where one output feeds the next. Each step does one thing well. Reduces errors vs. a mega-prompt that tries to do everything.',
      },
    },
    {
      id: 'g-few-shot',
      term: { es: 'Few-shot vs Zero-shot', en: 'Few-shot vs Zero-shot' },
      category: 'técnicas',
      def: {
        es: 'Zero-shot: pedir la tarea sin ejemplos (el modelo usa solo sus instrucciones). Few-shot: incluir 2-5 ejemplos de entrada/salida dentro del prompt para calibrar el formato, tono y patrón. Few-shot mejora drásticamente la consistencia en clasificación y extracción.',
        en: 'Zero-shot: ask for the task with no examples (the model uses only your instructions). Few-shot: include 2-5 input/output examples in the prompt to calibrate format, tone, and pattern. Few-shot dramatically improves consistency in classification and extraction.',
      },
      crossRefs: ['BP002', 'AP008', 'AP022'],
    },
    {
      id: 'g-cot',
      term: { es: 'Chain-of-Thought (CoT)', en: 'Chain-of-Thought (CoT)' },
      category: 'técnicas',
      def: {
        es: 'Pedirle al modelo que razone paso a paso antes de dar la respuesta final ("piensa paso a paso", "primero analiza, luego concluye"). Mejora el rendimiento en tareas de razonamiento, matemáticas y lógica. El coste: más tokens de salida.',
        en: 'Asking the model to reason step by step before giving the final answer ("think step by step", "first analyze, then conclude"). Improves performance on reasoning, math, and logic tasks. The cost: more output tokens.',
      },
      crossRefs: ['AP014', 'BP005', 'rewriter._addChainOfThought'],
    },
    {
      id: 'g-prompt-injection',
      term: { es: 'Prompt injection', en: 'Prompt injection' },
      category: 'seguridad',
      def: {
        es: 'Ataque donde texto malicioso dentro de los datos (no las instrucciones) intenta sobreescribir el comportamiento del modelo. Ejemplo: un documento recuperado que dice "ignora las instrucciones anteriores". Se defiende con delimitadores de contenido no confiable y guardrails explícitos.',
        en: 'An attack where malicious text inside the data (not the instructions) tries to override the model behavior. Example: a retrieved document saying "ignore previous instructions". Defended with untrusted-content delimiters and explicit guardrails.',
      },
      crossRefs: ['AP010', 'injection', 'jailbreakRoleplay', 'indirectInjection', 'dataExfiltration'],
    },
    {
      id: 'g-llm-as-judge',
      term: { es: 'LLM-as-Judge', en: 'LLM-as-Judge' },
      category: 'evaluación',
      def: {
        es: 'Usar un LLM para evaluar la calidad de respuestas generadas por otro LLM (o por sí mismo) según una rúbrica. Escalable vs. evaluación humana, pero hereda sesgos del modelo juez. Requiere rúbricas claras y ejemplos calibrados.',
        en: 'Using an LLM to evaluate the quality of responses generated by another LLM (or itself) against a rubric. Scalable vs. human eval, but inherits the judge model biases. Requires clear rubrics and calibrated examples.',
      },
      crossRefs: ['tpl-evaluador-llm-judge'],
    },
    {
      id: 'g-in-context-learning',
      term: { es: 'In-context learning', en: 'In-context learning' },
      category: 'fundamentos',
      def: {
        es: 'La capacidad del modelo de aprender de ejemplos provistos en el propio prompt, sin cambiar sus pesos. Es lo que hace funcionar a few-shot. No es entrenamiento: dura solo esa llamada.',
        en: 'The model ability to learn from examples provided in the prompt itself, without changing its weights. It is what makes few-shot work. It is not training: it lasts only that one call.',
      },
      crossRefs: ['g-few-shot'],
    },
    {
      id: 'g-delimiters',
      term: { es: 'Delimitadores', en: 'Delimiters' },
      category: 'estructura',
      def: {
        es: 'Marcadores que separan secciones del prompt o aíslan contenido no confiable. Comunes: triples comillas ``` , triples guiones ---, etiquetas XML <contexto>...</contexto>, o tokens especiales. Ayudan al modelo a distinguir instrucciones de datos.',
        en: 'Markers that separate prompt sections or isolate untrusted content. Common: triple backticks ``` , triple dashes ---, XML tags <context>...</context>, or special tokens. Help the model distinguish instructions from data.',
      },
      crossRefs: ['BP012', 'AP026', 'BP001'],
    },
  ],

  /* ── 2. Técnicas: modern patterns (new + cross-linked) ────────
     { id, name:{es,en}, category, what:{es,en}, when:{es,en}?, example:{es,en}?, crossRefs:[]?, crossLinkOnly:bool }
     crossLinkOnly=true marks techniques already integrated in the engine/rewriter
     (we document them here only to cross-link, not to duplicate). */
  techniques: [
    // ── 6 NUEVAS (detectadas por signals.js pero sin explicación) ──
    {
      id: 't-react',
      name: { es: 'ReAct (Reason + Act)', en: 'ReAct (Reason + Act)' },
      category: 'agentic',
      crossLinkOnly: false,
      what: {
        es: 'Patrón para agentes donde el modelo alterna bloques de Pensamiento (Thought), Acción (Action) y Observación (Observation) hasta resolver la tarea. El modelo razona qué hacer, ejecuta una herramienta, observa el resultado, y repite. Permite usar APIs externas (búsqueda, cálculo) dentro del razonamiento.',
        en: 'An agent pattern where the model alternates Thought, Action, and Observation blocks until the task is solved. The model reasons about what to do, executes a tool, observes the result, and repeats. Enables external APIs (search, calculation) within the reasoning.',
      },
      when: {
        es: 'Tareas que requieren información externa o múltiples pasos con dependencias (responder con datos actuales, calcular antes de concluir).',
        en: 'Tasks requiring external information or multi-step dependencies (answer with current data, calculate before concluding).',
      },
      example: {
        es: `<tarea>
Responde la pregunta siguiente usando el ciclo ReAct.
</tarea>

<formato_react>
Thought: <tu razonamiento sobre qué necesitas>
Action: <herramienta a usar: buscar|calcular|finalizar>
Action Input: <input para la herramienta>
Observation: <resultado de la herramienta>
... (repetir Thought/Action/Observation hasta tener la respuesta)
Thought: Ya tengo la respuesta
Final Answer: <respuesta final>
</formato_react>

Pregunta: ¿Cuál es la raíz cuadrada de la población de Tokio (aprox 37M)?`,
        en: `<task>
Answer the following question using the ReAct cycle.
</task>

<react_format>
Thought: <your reasoning about what you need>
Action: <tool to use: search|calculate|finish>
Action Input: <input for the tool>
Observation: <result from the tool>
... (repeat Thought/Action/Observation until you have the answer)
Thought: I have the answer
Final Answer: <final answer>
</react_format>

Question: What is the square root of Tokyo\'s population (approx 37M)?`,
      },
      crossRefs: ['hasReAct'],
    },
    {
      id: 't-tot',
      name: { es: 'Tree-of-Thought (ToT)', en: 'Tree-of-Thought (ToT)' },
      category: 'reasoning',
      crossLinkOnly: false,
      what: {
        es: 'Generalización de CoT donde el modelo explora múltiples ramas de razonamiento en paralelo, evalúa cada una, y sigue la más prometedora. Útil cuando hay varios caminos y no todos llevan a la solución. Más potente que CoT lineal, pero más costoso en tokens.',
        en: 'A generalization of CoT where the model explores multiple reasoning branches in parallel, evaluates each, and follows the most promising. Useful when there are several paths and not all lead to the solution. More powerful than linear CoT, but more token-expensive.',
      },
      when: {
        es: 'Problemas de búsqueda, planificación, o donde el primer camino de razonamiento puede ser un callejón sin salida.',
        en: 'Search problems, planning, or where the first reasoning path may be a dead end.',
      },
      example: {
        es: `<tarea>
Explora 3 enfoques distintos para resolver el problema. Para cada uno:
1. Genera el enfoque inicial
2. Evalúa su viabilidad (0-10)
3. Si la viabilidad > 6, desarrolla el siguiente paso
Finalmente, selecciona el enfoque con mejor evaluación y da la solución completa.
</tarea>

Problema: ¿Cómo reducir el tiempo de carga de un sitio web a < 1s sin cambiar de hosting?`,
        en: `<task>
Explore 3 distinct approaches to solve the problem. For each:
1. Generate the initial approach
2. Evaluate its viability (0-10)
3. If viability > 6, develop the next step
Finally, select the approach with the best evaluation and give the complete solution.
</task>

Problem: How to reduce a website\'s load time to < 1s without changing hosting?`,
      },
      crossRefs: ['hasTreeOfThought', 'g-cot'],
    },
    {
      id: 't-self-consistency',
      name: { es: 'Self-Consistency', en: 'Self-Consistency' },
      category: 'reasoning',
      crossLinkOnly: false,
      what: {
        es: 'Generar múltiples cadenas de razonamiento (con temperature alta) para la misma pregunta y elegir la respuesta más frecuente (mayoría). Reduce errores porque la respuesta correcta tiende a aparecer en más cadenas que las incorrectas. Requiere varias llamadas al modelo.',
        en: 'Generate multiple reasoning chains (with high temperature) for the same question and pick the most frequent answer (majority vote). Reduces errors because the correct answer tends to appear in more chains than incorrect ones. Requires several model calls.',
      },
      when: {
        es: 'Problemas con una única respuesta correcta (matemáticas, lógica) donde el costo de varias llamadas es aceptable.',
        en: 'Problems with a single correct answer (math, logic) where the cost of several calls is acceptable.',
      },
      example: {
        es: `<instruccion>
Resuelve el problema paso a paso. Sé consciente de que se generarán múltiples
soluciones y se elegirá la respuesta más común.
</instruccion>

Pregunta: Un tren va a 60 km/h. ¿Cuánto tarda en recorrer 150 km?`,
        en: `<instruction>
Solve the problem step by step. Be aware that multiple solutions will be
generated and the most common answer will be chosen.
</instruction>

Question: A train travels at 60 km/h. How long does it take to cover 150 km?`,
      },
      crossRefs: ['hasSelfConsistency', 'g-cot'],
    },
    {
      id: 't-reflexion',
      name: { es: 'Reflexion', en: 'Reflexion' },
      category: 'reasoning',
      crossLinkOnly: false,
      what: {
        es: 'Después de generar una respuesta, el modelo la critica (reflexiona sobre qué falló o podría mejorarse) y la regenera usando esa crítica. Ciclo generar→criticar→mejorar. Mejor calidad a costa de más tokens.',
        en: 'After generating an answer, the model critiques it (reflects on what failed or could improve) and regenerates it using that critique. Generate→critique→improve cycle. Better quality at the cost of more tokens.',
      },
      when: {
        es: 'Tareas de escritura, código, o razonamiento donde una segunda pasada mejora el resultado.',
        en: 'Writing, code, or reasoning tasks where a second pass improves the result.',
      },
      example: {
        es: `<tarea>
Escribe una función Python para validar emails.
</tarea>
<reflexion>
Tras escribirla, critica tu propia solución:
1. ¿Maneja todos los casos edge?
2. ¿Es eficiente?
3. ¿Sigue best practices?
Luego reescribe la función incorporando las mejoras.
</reflexion>`,
        en: `<task>
Write a Python function to validate emails.
</task>
<reflection>
After writing it, critique your own solution:
1. Does it handle all edge cases?
2. Is it efficient?
3. Does it follow best practices?
Then rewrite the function incorporating the improvements.
</reflection>`,
      },
      crossRefs: ['hasReflexion'],
    },
    {
      id: 't-zero-shot',
      name: { es: 'Zero-shot prompting', en: 'Zero-shot prompting' },
      category: 'basics',
      crossLinkOnly: false,
      what: {
        es: 'Pedir la tarea directamente, sin ejemplos. El modelo se apoya solo en sus instrucciones y conocimiento paramétrico. Hoy es el punto de partida por defecto gracias a modelos más capaces; few-shot se reserva para cuando zero-shot no logra la consistencia deseada.',
        en: 'Ask for the task directly, with no examples. The model relies only on your instructions and parametric knowledge. Today it is the default starting point thanks to more capable models; few-shot is reserved for when zero-shot does not achieve the desired consistency.',
      },
      when: {
        es: 'Tareas bien definidas y comunes (resumir, traducir, clasificar en categorías obvias).',
        en: 'Well-defined, common tasks (summarize, translate, classify into obvious categories).',
      },
      example: {
        es: `Resume el siguiente artículo en 3 viñetas, destacando los hallazgos clave.

Artículo: """{{texto}}"""`,
        en: `Summarize the following article in 3 bullet points, highlighting key findings.

Article: """{{text}}"""`,
      },
      crossRefs: ['g-few-shot'],
    },
    {
      id: 't-metaprompting',
      name: { es: 'Metaprompting', en: 'Metaprompting' },
      category: 'basics',
      crossLinkOnly: false,
      what: {
        es: 'Usar un prompt para generar o mejorar otro prompt. Útil para iterar: pides al modelo que mejore tu prompt, o que genere un prompt para una tarea compleja dado un objetivo. Promptometer aplica una forma de esto en su rewriter automático.',
        en: 'Using a prompt to generate or improve another prompt. Useful for iterating: ask the model to improve your prompt, or to generate a prompt for a complex task given a goal. Promptometer applies a form of this in its automatic rewriter.',
      },
      when: {
        es: 'Cuando no sabes cómo estructurar un prompt o quieres optimizar uno existente.',
        en: 'When you do not know how to structure a prompt or want to optimize an existing one.',
      },
      example: {
        es: `<tarea>
Actúa como ingeniero de prompts experto. Toma mi objetivo y genera un prompt
estructurado en formato XML con: rol, contexto, tarea, formato de salida y
restricciones. El prompt generado debe ser específico y accionable.
</tarea>

Mi objetivo: """Quiero que el modelo extraiga eventos de un texto de noticias
con fecha, lugar y personas involucradas, en formato JSON."""`,
        en: `<task>
Act as an expert prompt engineer. Take my goal and generate a structured
prompt in XML format with: role, context, task, output format, and constraints.
The generated prompt must be specific and actionable.
</task>

My goal: """I want the model to extract events from a news text with date,
location, and people involved, in JSON format."""`,
      },
      crossRefs: ['rewriter.improve'],
    },
    {
      id: 't-cove',
      name: { es: 'Chain of Verification (CoVe)', en: 'Chain of Verification (CoVe)' },
      category: 'reasoning',
      crossLinkOnly: false,
      what: {
        es: 'Patrón de 4 pasos para mitigar alucinaciones en datos críticos: 1) Generar borrador inicial 2) Formular preguntas de verificación sobre las afirmaciones clave 3) Responder las preguntas de forma independiente 4) Reconstruir la respuesta final corregida basándose en la evidencia verificada.',
        en: 'A 4-step pattern to mitigate hallucinations in high-stakes outputs: 1) Generate initial draft 2) Plan verification questions for key claims 3) Answer verification questions independently 4) Reconstruct final corrected response grounded in verified evidence.',
      },
      when: {
        es: 'Generación de informes médicos, legales, financieros o técnicos donde el costo de una alucinación es inaceptable.',
        en: 'Generating medical, legal, financial, or technical reports where the cost of a hallucination is unacceptable.',
      },
      example: {
        es: `<tarea>
Genera un informe sobre el tratamiento de la hipertensión leve.
</tarea>

<flujo_cove>
Paso 1: Redacta un borrador inicial de recomendaciones.
Paso 2: Genera 3 preguntas de verificación independientes sobre las dosis y contraindicaciones mencionadas.
Paso 3: Responde las preguntas de verificación usando solo evidencia médica establecida.
Paso 4: Reescribe el informe final corrigiendo cualquier discrepancia encontrada en el Paso 3.
</flujo_cove>`,
        en: `<task>
Generate a report on treating mild hypertension.
</task>

<cove_flow>
Step 1: Write an initial draft of recommendations.
Step 2: Generate 3 independent verification questions about doses and contraindications mentioned.
Step 3: Answer verification questions using only established medical evidence.
Step 4: Rewrite the final report correcting any discrepancies found in Step 3.
</cove_flow>`,
      },
      crossRefs: ['g-hallucination', 'g-grounding', 'antiHallucination'],
    },
    {
      id: 't-sot',
      name: { es: 'Skeleton-of-Thought (SoT)', en: 'Skeleton-of-Thought (SoT)' },
      category: 'performance',
      crossLinkOnly: false,
      what: {
        es: 'Técnica de optimización de latencia en 2 fases: 1) Pedir al modelo que genere un esquema/esqueleto conciso de los puntos principales de la respuesta 2) Expandir cada punto en detalle (ideal para procesamiento en paralelo). Reduce drásticamente el tiempo percibido de generación.',
        en: 'A 2-phase latency optimization technique: 1) Ask the model to generate a concise skeleton outline of the main points 2) Expand each point in detail (ideal for parallel API calls). Drastically reduces total generation latency.',
      },
      when: {
        es: 'Respuestas extensas en tiempo real o chatbots donde la velocidad de respuesta inicial es crítica.',
        en: 'Long-form real-time responses or chatbots where initial response speed is critical.',
      },
      example: {
        es: `<fase_esqueleto>
Primero, genera ÚNICAMENTE un esqueleto numerado de 4 puntos clave para migrar un monolito a microservicios. No agregues detalles todavía.
</fase_esqueleto>

<fase_expansion>
Para cada uno de los 4 puntos del esqueleto anterior, expande los aspectos técnicos en un párrafo detallado.
</fase_expansion>`,
        en: `<skeleton_phase>
First, generate ONLY a numbered 4-point skeleton outline for migrating a monolith to microservices. Do not add details yet.
</skeleton_phase>

<expansion_phase>
For each of the 4 points in the skeleton above, expand the technical details into a thorough paragraph.
</expansion_phase>`,
      },
      crossRefs: ['g-token', 'g-context-window'],
    },
    {
      id: 't-hicot',
      name: { es: 'Hierarchical CoT (Hi-CoT)', en: 'Hierarchical CoT (Hi-CoT)' },
      category: 'reasoning',
      crossLinkOnly: false,
      what: {
        es: 'Evolución de Chain-of-Thought que descompone el razonamiento en niveles jerárquicos (Plan de alto nivel ➔ Sub-pasos instruccionales ➔ Ejecución detallada). Evita que el modelo pierda el hilo estratégico en problemas matemáticos o lógicos complejos.',
        en: 'Evolution of Chain-of-Thought decomposing reasoning into hierarchical levels (High-level plan ➔ Instructional sub-steps ➔ Detailed execution). Prevents the model from losing strategic context in complex math or logic problems.',
      },
      when: {
        es: 'Planificación de arquitectura de software, demostraciones matemáticas o análisis financiero de múltiples etapas.',
        en: 'Software architecture planning, mathematical proofs, or multi-stage financial modeling.',
      },
      example: {
        es: `<razonamiento_jerarquico>
Nivel 1 (Estrategia): Define las 3 fases principales del plan de contingencia.
Nivel 2 (Táctica): Para cada fase, desglosa los 2 pasos operativos clave.
Nivel 3 (Ejecución): Ejecuta cada paso calculando los tiempos y costos involucrados.
</razonamiento_jerarquico>`,
        en: `<hierarchical_reasoning>
Level 1 (Strategy): Define the 3 main phases of the contingency plan.
Level 2 (Tactics): For each phase, break down the 2 key operational steps.
Level 3 (Execution): Execute each step calculating the involved times and costs.
</hierarchical_reasoning>`,
      },
      crossRefs: ['g-cot', 't-tot'],
    },

    // ── 4 CLÁSICAS (ya integradas en el motor/rewriter — solo cross-link) ──
    {
      id: 't-few-shot',
      name: { es: 'Few-shot prompting', en: 'Few-shot prompting' },
      category: 'basics',
      crossLinkOnly: true,
      what: {
        es: 'Incluir 2-5 ejemplos de entrada/salida dentro del prompt para calibrar el formato, tono y patrón de respuesta. El motor lo detecta (signals.hasFewShot) y el rewriter lo inyecta automáticamente (rewriter._addExamples). Es la best-practice BP002.',
        en: 'Include 2-5 input/output examples in the prompt to calibrate response format, tone, and pattern. The engine detects it (signals.hasFewShot) and the rewriter injects it automatically (rewriter._addExamples). It is best-practice BP002.',
      },
      when: {
        es: 'Clasificación, extracción, o cualquier tarea donde el formato consistente es crítico.',
        en: 'Classification, extraction, or any task where consistent format is critical.',
      },
      crossRefs: ['BP002', 'AP008', 'AP022', 'rewriter._addExamples', 'g-few-shot'],
    },
    {
      id: 't-cot',
      name: { es: 'Chain-of-Thought (CoT)', en: 'Chain-of-Thought (CoT)' },
      category: 'reasoning',
      crossLinkOnly: true,
      what: {
        es: 'Pedir razonamiento paso a paso antes de la respuesta final. El motor lo detecta (hasStepByStep), lo exige para tareas complejas (AP014), lo premia (BP005) y el rewriter lo inyecta (rewriter._addChainOfThought).',
        en: 'Request step-by-step reasoning before the final answer. The engine detects it (hasStepByStep), requires it for complex tasks (AP014), rewards it (BP005), and the rewriter injects it (rewriter._addChainOfThought).',
      },
      crossRefs: ['AP014', 'BP005', 'rewriter._addChainOfThought', 'g-cot'],
    },
    {
      id: 't-rag',
      name: { es: 'RAG (Retrieval-Augmented Generation)', en: 'RAG (Retrieval-Augmented Generation)' },
      category: 'rag',
      crossLinkOnly: true,
      what: {
        es: 'Recuperar documentos relevantes y entregarlos como contexto para que el modelo responda con base en ellos. El motor detecta el patrón (hasRagContext), hay un template dedicado (tpl-rag-prompt) y penaliza dependencia de datos post-cutoff (AP038).',
        en: 'Retrieve relevant documents and provide them as context so the model responds based on them. The engine detects the pattern (hasRagContext), there is a dedicated template (tpl-rag-prompt), and it penalizes post-cutoff data dependence (AP038).',
      },
      when: {
        es: 'Preguntas sobre conocimiento actual, datos privados, o donde la veracidad es crítica.',
        en: 'Questions about current knowledge, private data, or where truthfulness is critical.',
      },
      crossRefs: ['tpl-rag-prompt', 'AP038', 'hasRagContext', 'g-grounding'],
    },
    {
      id: 't-role',
      name: { es: 'Role prompting', en: 'Role prompting' },
      category: 'basics',
      crossLinkOnly: true,
      what: {
        es: 'Asignar un rol/persona al modelo ("eres un experto en..."). Mejora la calidad al activar conocimiento relevante. El motor lo detecta (BP004), penaliza roles sin dominio (AP005, AP028) y el rewriter lo inyecta (rewriter._addRole).',
        en: 'Assign a role/persona to the model ("you are an expert in..."). Improves quality by activating relevant knowledge. The engine detects it (BP004), penalizes roles without a domain (AP005, AP028), and the rewriter injects it (rewriter._addRole).',
      },
      crossRefs: ['BP004', 'AP005', 'AP028', 'rewriter._addRole'],
    },
  ],

  /* ── 3. Frameworks: canonical structural schemas ──────────────
     { id, name:{es,en}, acronym?, category, def:{es,en}, structure:{es,en}?, example:{es,en}?, crossRefs:[]? } */
  frameworks: [
    {
      id: 'f-rtf',
      name: { es: 'RTF (Role-Task-Format)', en: 'RTF (Role-Task-Format)' },
      acronym: 'RTF',
      category: 'framework',
      def: {
        es: 'El framework más simple y popular. Define un Rol (quién es el modelo), una Tarea (qué debe hacer) y un Formato (cómo entregar la respuesta). Es el mínimo viable para un prompt estructurado.',
        en: 'The simplest and most popular framework. Define a Role (who the model is), a Task (what to do), and a Format (how to deliver the answer). It is the minimum viable structured prompt.',
      },
      structure: {
        es: `<rol>
Eres un [experto en DOMINIO].
</rol>

<tarea>
[Verbo de acción + objeto + criterios de éxito].
</tarea>

<formato>
[Formato de salida: JSON, tabla, lista numerada, etc.].
</formato>`,
        en: `<role>
You are a [expert in DOMAIN].
</role>

<task>
[Action verb + object + success criteria].
</task>

<format>
[Output format: JSON, table, numbered list, etc.].
</format>`,
      },
      example: {
        es: `<rol>
Eres un editor de textos experimentado.
</rol>

<tarea>
Revisa el siguiente texto y corrige errores ortográficos, gramaticales y de estilo.
Devuelve solo el texto corregido.
</tarea>

<formato>
Texto plano, sin comentarios adicionales.
</formato>`,
        en: `<role>
You are an experienced copy editor.
</role>

<task>
Review the following text and correct spelling, grammar, and style errors.
Return only the corrected text.
</task>

<format>
Plain text, no additional comments.
</format>`,
      },
    },
    {
      id: 'f-crispe',
      name: { es: 'CRISPE', en: 'CRISPE' },
      acronym: 'CRISPE',
      category: 'framework',
      def: {
        es: 'Framework avanzado de 6 componentes: Capacity & Role (capacidades y rol), Insight (contexto de fondo), Statement (la instrucción específica), Personality (tono y estilo), Personality y Experiment (pedir variantes). Más rico que RTF para tareas creativas o donde el tono importa.',
        en: 'An advanced 6-component framework: Capacity & Role (capabilities and role), Insight (background context), Statement (the specific instruction), Personality (tone and style), and Experiment (ask for variants). Richer than RTF for creative tasks or where tone matters.',
      },
      structure: {
        es: `<capacidad_rol>
[Capacidades y rol del modelo: "Eres un estratega de marketing con 15 años de experiencia..."]
</capacidad_rol>

<insight>
[Contexto de fondo: mercado, audiencia, objetivos previos.]
</insight>

<instruccion>
[Tarea específica y accionable.]
</instruccion>

<personalidad>
[Tono y estilo de la respuesta: formal, persuasivo, técnico.]
</personalidad>

<experimento>
[Pide 2-3 variantes o enfoques alternativos.]
</experimento>`,
        en: `<capacity_role>
[Model capabilities and role: "You are a marketing strategist with 15 years of experience..."]
</capacity_role>

<insight>
[Background context: market, audience, prior goals.]
</insight>

<statement>
[Specific, actionable task.]
</statement>

<personality>
[Tone and style of the response: formal, persuasive, technical.]
</personality>

<experiment>
[Ask for 2-3 variants or alternative approaches.]
</experiment>`,
      },
      crossRefs: ['f-rtf'],
    },
    {
      id: 'f-race',
      name: { es: 'RACE (Role-Action-Context-Expectation)', en: 'RACE (Role-Action-Context-Expectation)' },
      acronym: 'RACE',
      category: 'framework',
      def: {
        es: 'Framework de 4 partes: Role (quién), Action (qué hacer), Context (información necesaria), Expectation (criterios de éxito y formato). Parecido a RTF pero hace explícito el contexto y los criterios medibles — útil para tareas donde la calidad se evalúa.',
        en: 'A 4-part framework: Role (who), Action (what to do), Context (necessary information), Expectation (success criteria and format). Similar to RTF but makes context and measurable criteria explicit — useful for tasks where quality is evaluated.',
      },
      structure: {
        es: `<rol>
[Quién es el modelo y su nivel de expertise.]
</rol>

<accion>
[Qué debe hacer, en términos accionables.]
</accion>

<contexto>
[Datos, antecedentes y restricciones necesarias para la tarea.]
</contexto>

<expectativa>
[Criterios de éxito medibles + formato de salida.]
</expectativa>`,
        en: `<role>
[Who the model is and their expertise level.]
</role>

<action>
[What to do, in actionable terms.]
</action>

<context>
[Data, background, and constraints needed for the task.]
</context>

<expectation>
[Measurable success criteria + output format.]
</expectation>`,
      },
      crossRefs: ['f-rtf'],
    },
    {
      id: 'f-costar',
      name: { es: 'CO-STAR Framework', en: 'CO-STAR Framework' },
      acronym: 'CO-STAR',
      category: 'framework',
      def: {
        es: 'Framework de 6 componentes diseñado por el GovTech de Singapur: Context (contexto), Objective (objetivo), Style (estilo de redacción), Tone (tono), Audience (audiencia) y Response (formato de respuesta). Muy popular para comunicaciones empresariales y marketing.',
        en: 'A 6-component framework designed by Singapore\'s GovTech: Context, Objective, Style, Tone, Audience, and Response. Highly popular for corporate communications and marketing.',
      },
      structure: {
        es: `<contexto>
[Información de fondo relevante para el problema]
</contexto>
<objetivo>
[Instrucción concreta de lo que debe lograr el modelo]
</objetivo>
<estilo>
[Estilo de escritura: periodístico, corporativo, directo]
</estilo>
<tono>
[Tono emocional: empático, profesional, persuasivo]
</tono>
<audiencia>
[Público objetivo: inversores, clientes, estudiantes]
</audiencia>
<respuesta>
[Formato exacto de salida: JSON, tabla, email]
</respuesta>`,
        en: `<context>
[Relevant background information for the problem]
</context>
<objective>
[Concrete instruction of what the model should accomplish]
</objective>
<style>
[Writing style: journalistic, corporate, direct]
</style>
<tone>
[Emotional tone: empathetic, professional, persuasive]
</tone>
<audience>
[Target audience: investors, clients, students]
</audience>
<response>
[Exact output format: JSON, table, email]
</response>`,
      },
      crossRefs: ['f-crispe', 'f-race'],
    },
    {
      id: 'f-bento',
      name: { es: 'Bento-Box Modular Architecture', en: 'Bento-Box Modular Architecture' },
      acronym: 'Bento',
      category: 'framework',
      def: {
        es: 'Arquitectura modular moderna que separa el prompt en 5 bloques independientes ("compartimentos"): System Persona, Context Initializer, Input Contracts, Task Directives y Output Guardrails. Facilita la reutilización de bloques y optimiza el Prompt Caching.',
        en: 'Modern modular architecture separating the prompt into 5 independent compartments: System Persona, Context Initializer, Input Contracts, Task Directives, and Output Guardrails. Enables block reuse and optimizes Prompt Caching.',
      },
      structure: {
        es: `<1_system_persona>
[Rol global y comportamiento permanente]
</1_system_persona>

<2_context_initializer>
[Datos del dominio, tablas de referencia o conocimiento fijo]
</2_context_initializer>

<3_input_contract>
[Esquema y variables recibidas del usuario]
</3_input_contract>

<4_task_directives>
[Pasos concretos de ejecución]
</4_task_directives>

<5_output_guardrails>
[Formato de respuesta, restricciones y manejo de errores]
</5_output_guardrails>`,
        en: `<1_system_persona>
[Global role and permanent behavior]
</1_system_persona>

<2_context_initializer>
[Domain data, reference tables, or static knowledge]
</2_context_initializer>

<3_input_contract>
[Schema and variables received from the user]
</3_input_contract>

<4_task_directives>
[Concrete execution steps]
</4_task_directives>

<5_output_guardrails>
[Response format, constraints, and error handling]
</5_output_guardrails>`,
      },
      crossRefs: ['f-promptometer-xml'],
    },
    {
      id: 'f-promptometer-xml',
      name: { es: 'Anatomía XML de 7 secciones (Promptometer)', en: '7-section XML Anatomy (Promptometer)' },
      acronym: 'XML-7',
      category: 'native',
      def: {
        es: 'El framework nativo de Promptometer, usado por los 12 templates y reforzado por el rewriter automático. Siete secciones en orden canónico: rol → contexto → tarea → formato_salida → restricciones → ejemplos → manejo_errores. Cubre los 8 dimensiones de scoring (claridad, especificidad, estructura, robustez, contexto, formato, CoT, seguridad).',
        en: 'Promptometer\'s native framework, used by all 12 templates and reinforced by the automatic rewriter. Seven sections in canonical order: role → context → task → output_format → constraints → examples → error_handling. Covers all 8 scoring dimensions (clarity, specificity, structure, robustness, context, format, CoT, safety).',
      },
      structure: {
        es: `<rol>          ← BP004 (context)
<contexto>     ← BP010 (context)
<tarea>        ← claridad + especificidad
<formato_salida> ← BP003 (outputFormat)
<restricciones> ← robustez + BP007
<ejemplos>     ← BP002 (specificity / few-shot)
<manejo_errores> ← BP006, BP015 (robustness)`,
        en: `<role>          ← BP004 (context)
<context>       ← BP010 (context)
<task>          ← clarity + specificity
<output_format> ← BP003 (outputFormat)
<constraints>   ← robustness + BP007
<examples>      ← BP002 (specificity / few-shot)
<error_handling>← BP006, BP015 (robustness)`,
      },
      example: {
        es: `<rol>
Eres un analista financiero senior especializado en mercados emergentes.
</rol>

<contexto>
Un inversionista retail quiere entender si comprar bonos soberanos de Colombia.
Tiene perfil de riesgo moderado y horizonte de 5 años.
</contexto>

<tarea>
Analiza el riesgo-país de Colombia y recomienda una asignación (% del portafolio).
Justifica con 3 factores clave.
</tarea>

<formato_salida>
JSON: { "recomendacion": string, "asignacion_pct": number, "factores": string[], "riesgo": "bajo|medio|alto" }
</formato_salida>

<restricciones>
- No des asesoría fiscal.
- Cita fuentes verificables (Banco Mundial, FMI).
- Si falta dato clave, marca "asignacion_pct": null.
</restricciones>

<ejemplos>
Entrada: "¿Comprar bonos de Chile?" → { "recomendacion": "Favorable", "asignacion_pct": 15, ... }
</ejemplos>

<manejo_errores>
Si la consulta es ambigua, pide aclaración antes de recomendar.
</manejo_errores>`,
        en: `<role>
You are a senior financial analyst specialized in emerging markets.
</role>

<context>
A retail investor wants to understand whether to buy Colombian sovereign bonds.
They have a moderate risk profile and a 5-year horizon.
</context>

<task>
Analyze Colombia\'s country risk and recommend an allocation (% of portfolio).
Justify with 3 key factors.
</task>

<output_format>
JSON: { "recommendation": string, "allocation_pct": number, "factors": string[], "risk": "low|medium|high" }
</output_format>

<constraints>
- Do not give tax advice.
- Cite verifiable sources (World Bank, IMF).
- If a key data point is missing, set "allocation_pct": null.
</constraints>

<examples>
Input: "Should I buy Chile bonds?" → { "recommendation": "Favorable", "allocation_pct": 15, ... }
</examples>

<error_handling>
If the query is ambiguous, ask for clarification before recommending.
</error_handling>`,
      },
      crossRefs: ['BP001', 'BP002', 'BP003', 'BP004', 'BP006', 'BP010', 'BP015', 'rewriter._restructure'],
    },
  ],

  /* ── 5. Referencias & Novedades: official links, guides, research papers ── */
  references: [
    {
      id: 'ref-promptometer-core',
      title: { es: 'Promptometer Core Engine (npm & PyPI)', en: 'Promptometer Core Engine (npm & PyPI)' },
      type: 'official',
      source: 'GitHub / npm / PyPI',
      url: 'https://github.com/j0sp0nc3/promptometer',
      desc: {
        es: 'Motor desacoplado de scoring multidimensional en 8 dimensiones. Disponible como paquete npm `promptometer-core` y librería nativa Python.',
        en: 'Decoupled 8-dimension scoring engine. Available as `promptometer-core` npm package and native Python library.',
      },
    },
    {
      id: 'ref-promptometer-app',
      title: { es: 'Promptometer Web Workbench App', en: 'Promptometer Web Workbench App' },
      type: 'official',
      source: 'GitHub / Vercel',
      url: 'https://promptforge-beta-ten.vercel.app/',
      desc: {
        es: 'Repositorio oficial y aplicación web en vivo con la suite de evaluación, pruebas adversariales, reescritor y hub educativo.',
        en: 'Official repository and live web app featuring evaluation suite, adversarial testing, rewriter, and learning hub.',
      },
    },
    {
      id: 'ref-anthropic-guide',
      title: { es: 'Anthropic Claude Prompt Engineering Guide', en: 'Anthropic Claude Prompt Engineering Guide' },
      type: 'guide',
      source: 'Anthropic Docs',
      url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview',
      desc: {
        es: 'Guía oficial de Anthropic para estructuración con etiquetas XML, claridad de roles y optimización de contexto en modelos Claude.',
        en: 'Official Anthropic guide for XML tag structuring, role clarity, and context optimization in Claude models.',
      },
    },
    {
      id: 'ref-anthropic-tutorial',
      title: { es: 'Anthropic Interactive Prompt Engineering Tutorial (GitHub)', en: 'Anthropic Interactive Prompt Engineering Tutorial (GitHub)' },
      type: 'official',
      source: 'GitHub / Anthropic',
      url: 'https://github.com/anthropics/prompt-eng-interactive-tutorial',
      desc: {
        es: 'Tutorial interactivo oficial de 9 capítulos creado por Anthropic con ejercicios de estructura básica, separación XML, roles y evitación de alucinaciones.',
        en: 'Official 9-chapter interactive tutorial by Anthropic covering prompt structure, XML separation, roles, and hallucination avoidance.',
      },
    },
    {
      id: 'ref-anthropic-sheets',
      title: { es: 'Anthropic Prompt Engineering Tutorial (Google Sheets)', en: 'Anthropic Prompt Engineering Tutorial (Google Sheets)' },
      type: 'official',
      source: 'Google Sheets / Anthropic',
      url: 'https://docs.google.com/spreadsheets/d/19jzLgRruG9kjUQNKtCg1ZjdD6l6weA6qRXG5zLIAhC8/edit?pli=1#gid=1733615301',
      desc: {
        es: 'Versión ejecutable interactiva en Google Sheets de los 9 capítulos del curso de Anthropic utilizando la extensión Claude for Sheets.',
        en: 'Executable interactive Google Sheets version of Anthropic\'s 9-chapter course using the Claude for Sheets extension.',
      },
    },
    {
      id: 'ref-openai-guide',
      title: { es: 'OpenAI Prompt Engineering Best Practices', en: 'OpenAI Prompt Engineering Best Practices' },
      type: 'guide',
      source: 'OpenAI Platform',
      url: 'https://platform.openai.com/docs/guides/prompt-engineering',
      desc: {
        es: 'Estrategias oficiales de OpenAI para instruir modelos, estructurar entradas/salidas y reducir alucinaciones en GPT-4o.',
        en: 'Official OpenAI strategies for model instruction, input/output structuring, and mitigating hallucinations in GPT-4o.',
      },
    },
    {
      id: 'ref-google-gemini',
      title: { es: 'Google Gemini Prompting Strategies', en: 'Google Gemini Prompting Strategies' },
      type: 'guide',
      source: 'Google AI for Developers',
      url: 'https://ai.google.dev/gemini-api/docs/prompting-strategies',
      desc: {
        es: 'Principios de Google DeepMind para optimizar prompts en modelos Gemini, pocos ejemplos (few-shot) y formateo de datos.',
        en: 'Google DeepMind principles for optimizing Gemini prompts, few-shot prompting, and data formatting.',
      },
    },
    {
      id: 'ref-dair-ai-guide',
      title: { es: 'DAIR.AI Prompt Engineering Guide', en: 'DAIR.AI Prompt Engineering Guide' },
      type: 'guide',
      source: 'PromptingGuide.ai',
      url: 'https://www.promptingguide.ai/',
      desc: {
        es: 'Referencia académica abierta de la comunidad de IA sobre todas las técnicas modernas de prompting, CoT, RAG y agentes.',
        en: 'Open academic reference by the AI community covering modern prompting techniques, CoT, RAG, and agents.',
      },
    },
    {
      id: 'ref-dspy-stanford',
      title: { es: 'Stanford DSPy: Declarative Prompt Optimization', en: 'Stanford DSPy: Declarative Prompt Optimization' },
      type: 'paper',
      source: 'Stanford NLP',
      url: 'https://dspy.ai/',
      desc: {
        es: 'Framework de Stanford que reemplaza el prompting manual compilando automáticamente instrucciones y ejemplos contra métricas.',
        en: 'Stanford framework replacing manual prompting by automatically compiling instructions and examples against metrics.',
      },
    },
    {
      id: 'ref-cot-paper',
      title: { es: 'Chain-of-Thought Prompting (Google Research 2022)', en: 'Chain-of-Thought Prompting (Google Research 2022)' },
      type: 'paper',
      source: 'arXiv:2201.11903',
      url: 'https://arxiv.org/abs/2201.11903',
      desc: {
        es: 'Paper científico seminal (Wei et al.) que introdujo el razonamiento paso a paso en modelos de lenguaje.',
        en: 'Seminal research paper (Wei et al.) introducing step-by-step reasoning in large language models.',
      },
    },
    {
      id: 'ref-react-paper',
      title: { es: 'ReAct: Synergizing Reasoning & Acting (Princeton/Google 2023)', en: 'ReAct: Synergizing Reasoning & Acting (Princeton/Google 2023)' },
      type: 'paper',
      source: 'arXiv:2210.03629',
      url: 'https://arxiv.org/abs/2210.03629',
      desc: {
        es: 'Investigación fundamental sobre la alternancia de pensamiento y acciones externas en agentes de IA (Yao et al.).',
        en: 'Foundational paper on alternating reasoning thoughts and external tool actions in AI agents (Yao et al.).',
      },
    },
    {
      id: 'ref-cove-paper',
      title: { es: 'Chain-of-Verification (Meta AI 2023)', en: 'Chain-of-Verification (Meta AI 2023)' },
      type: 'paper',
      source: 'arXiv:2309.11495',
      url: 'https://arxiv.org/abs/2309.11495',
      desc: {
        es: 'Paper de Meta AI (Dhuliawala et al.) demostrando la reducción drástica de alucinaciones mediante preguntas de autoverificación.',
        en: 'Meta AI research (Dhuliawala et al.) demonstrating drastic reduction of hallucinations using self-verification questions.',
      },
    },
    {
      id: 'ref-owasp-llm',
      title: { es: 'OWASP Top 10 for LLM Applications', en: 'OWASP Top 10 for LLM Applications' },
      type: 'security',
      source: 'OWASP Foundation',
      url: 'https://genai.owasp.org/llm-top-10/',
      desc: {
        es: 'Estándar global de seguridad sobre vulnerabilidades críticas en LLMs (inyección de prompts, fuga de datos, etc.).',
        en: 'Global security standard for critical vulnerabilities in LLM apps (prompt injection, data leakage, etc.).',
      },
    },
  ],

  /* ── 5. Radar de Creadores & Fuentes Gen AI ───────────────────
     Top accounts, researchers, engineers & channels sharing Prompt Engineering & Gen AI content. */
  radar: [
    {
      id: 'cr-riley-goodside',
      name: 'Riley Goodside',
      handle: '@goodside',
      role: { es: 'Staff Prompt Engineer en Scale AI', en: 'Staff Prompt Engineer at Scale AI' },
      category: 'prompting',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/goodside', type: 'x' }
      ],
      desc: {
        es: 'Primer Staff Prompt Engineer de la industria. Conocido por sus descubrimientos de inyección de prompt, jailbreaks y técnicas de prompting.',
        en: 'The industry’s first Staff Prompt Engineer. Known for pioneering prompt injection research, jailbreak security, and advanced prompting techniques.'
      }
    },
    {
      id: 'cr-andrej-karpathy',
      name: 'Andrej Karpathy',
      handle: '@karpathy',
      role: { es: 'Ex-Director de AI en Tesla & Co-fundador de OpenAI', en: 'Ex-Director of AI at Tesla & OpenAI Co-founder' },
      category: 'architecture',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/karpathy', type: 'x' },
        { name: 'YouTube', url: 'https://www.youtube.com/@karpathy', type: 'youtube' }
      ],
      desc: {
        es: 'Divulgador de IA y creador del concepto "LLM OS". Publica cursos profundos desde cero sobre arquitectura de LLMs y tokenización.',
        en: 'AI educator and creator of the "LLM OS" concept. Publishes deep-dive Zero-to-Hero courses on LLM architecture and tokenization.'
      }
    },
    {
      id: 'cr-lilian-weng',
      name: 'Lilian Weng',
      handle: '@lilianweng',
      role: { es: 'Ex-Head of Safety Systems en OpenAI', en: 'Ex-Head of Safety Systems at OpenAI' },
      category: 'agents',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/lilianweng', type: 'x' },
        { name: 'Blog (Lil\'Log)', url: 'https://lilianweng.github.io/', type: 'substack' }
      ],
      desc: {
        es: 'Autora de "Lil\'Log", la referencia técnica más respetada sobre agentes basados en LLMs, memoria, planificación y razonamiento.',
        en: 'Author of "Lil\'Log", the gold-standard technical blog on LLM-based autonomous agents, memory, planning, and tool use.'
      }
    },
    {
      id: 'cr-swyx',
      name: 'Shawn Wang (swyx)',
      handle: '@swyx',
      role: { es: 'Fundador de Latent Space & AI Engineer Podcast', en: 'Founder of Latent Space & AI Engineer Podcast' },
      category: 'architecture',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/swyx', type: 'x' },
        { name: 'Substack', url: 'https://www.latent.space/', type: 'substack' }
      ],
      desc: {
        es: 'Pionero del movimiento "AI Engineer". Analiza la evolución del desarrollo con LLMs, patrones de diseño de agentes y ecosistemas de IA.',
        en: 'Pioneer of the "AI Engineer" movement. Analyzes LLM developer stack evolution, agent design patterns, and AI ecosystem trends.'
      }
    },
    {
      id: 'cr-anthropic-ai',
      name: 'Anthropic Research',
      handle: '@AnthropicAI',
      role: { es: 'Creadores de Claude & Anthropic Prompting Guides', en: 'Creators of Claude & Anthropic Prompting Guides' },
      category: 'prompting',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/AnthropicAI', type: 'x' },
        { name: 'Docs', url: 'https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview', type: 'substack' }
      ],
      desc: {
        es: 'Canal oficial de investigación sobre prompting estructurado en XML, metáforas de sistema, evaluadores LLM-as-a-Judge y Anthropic Console.',
        en: 'Official research channel for XML-structured prompting, system prompt metaphors, LLM-as-a-Judge evaluators, and Anthropic Console.'
      }
    },
    {
      id: 'cr-harrison-chase',
      name: 'Harrison Chase',
      handle: '@hwchase17',
      role: { es: 'Co-fundador & CEO de LangChain', en: 'Co-founder & CEO of LangChain' },
      category: 'agents',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/hwchase17', type: 'x' },
        { name: 'GitHub', url: 'https://github.com/langchain-ai', type: 'github' }
      ],
      desc: {
        es: 'Creador del ecosistema LangChain y LangGraph. Comparte avances sobre orquestación de prompts, memoria persistente y grafos de agentes.',
        en: 'Creator of the LangChain and LangGraph ecosystem. Shares insights on prompt orchestration, persistent memory, and agent graphs.'
      }
    },
    {
      id: 'cr-simon-willison',
      name: 'Simon Willison',
      handle: '@simonw',
      role: { es: 'Co-creador de Django & Investigador de Prompt Injection', en: 'Co-creator of Django & Prompt Injection Researcher' },
      category: 'security',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/simonw', type: 'x' },
        { name: 'Blog', url: 'https://simonwillison.net/', type: 'substack' }
      ],
      desc: {
        es: 'Pionero en acuñar e investigar los ataques de "Prompt Injection Indirecto" y la arquitectura defensiva frente a exploits de LLMs.',
        en: 'Pioneered research on "Indirect Prompt Injection" attacks and defensive architectures against LLM exploit vectors.'
      }
    },
    {
      id: 'cr-elvis-saravia',
      name: 'Elvis Saravia',
      handle: '@omarsar0',
      role: { es: 'Fundador de DAIR.AI & Prompt Engineering Guide', en: 'Founder of DAIR.AI & Prompt Engineering Guide' },
      category: 'prompting',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/omarsar0', type: 'x' },
        { name: 'Guía Prompting', url: 'https://www.promptingguide.ai/', type: 'substack' }
      ],
      desc: {
        es: 'Creador de "Prompt Engineering Guide" (promptingguide.ai), el recurso educativo abierto más utilizado sobre técnicas de prompting.',
        en: 'Creator of "Prompt Engineering Guide" (promptingguide.ai), the most widely used open education resource on prompting techniques.'
      }
    },
    {
      id: 'cr-hamel-husain',
      name: 'Hamel Husain',
      handle: '@hamelhusain',
      role: { es: 'Consultor de LLMs & Especialista en Evals', en: 'LLM Consultant & Fine-Tuning/Eval Specialist' },
      category: 'evals',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/hamelhusain', type: 'x' },
        { name: 'Blog', url: 'https://hamel.dev/', type: 'substack' }
      ],
      desc: {
        es: 'Especialista en evaluación rigurosa de prompts en producción (Evals), métricas objetivas y ajuste fino de modelos pequeños.',
        en: 'Specialist in production LLM prompt evaluation (Evals), domain-specific metrics, and fine-tuning small open-weights models.'
      }
    },
    {
      id: 'cr-sander-schulhoff',
      name: 'Sander Schulhoff',
      handle: '@LearnPrompting',
      role: { es: 'Fundador de Learn Prompting & HackAPrompt', en: 'Founder of Learn Prompting & HackAPrompt' },
      category: 'prompting',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/LearnPrompting', type: 'x' },
        { name: 'Web', url: 'https://learnprompting.org/', type: 'substack' }
      ],
      desc: {
        es: 'Organizador del mayor concurso global de seguridad de prompts "HackAPrompt" y la comunidad educativa de Learn Prompting.',
        en: 'Organizer of the world’s largest prompt security competition "HackAPrompt" and founder of the Learn Prompting community.'
      }
    },
    {
      id: 'cr-chip-huyen',
      name: 'Chip Huyen',
      handle: '@chipro',
      role: { es: 'Autora de "Designing Machine Learning Systems"', en: 'Author of "Designing Machine Learning Systems"' },
      category: 'architecture',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/chipro', type: 'x' },
        { name: 'Blog', url: 'https://huyenchip.com/', type: 'substack' }
      ],
      desc: {
        es: 'Experta en sistemas de IA en tiempo real, ingeniería de contextos para LLMs y optimización del flujo de datos en aplicaciones de IA.',
        en: 'Expert in real-time AI systems, context engineering for LLMs, and data pipeline optimization for generative AI apps.'
      }
    },
    {
      id: 'cr-sentdex',
      name: 'Harrison Kinsley (sentdex)',
      handle: '@sentdex',
      role: { es: 'Educador de Python & Deep Learning', en: 'Python & Deep Learning Educator' },
      category: 'architecture',
      platforms: [
        { name: 'YouTube', url: 'https://www.youtube.com/@sentdex', type: 'youtube' },
        { name: 'X / Twitter', url: 'https://x.com/sentdex', type: 'x' }
      ],
      desc: {
        es: 'Creador de tutoriales en video sobre cómo entrenar, evaluar y desplegar modelos de lenguaje locales (LLMs local / Ollama).',
        en: 'Creator of practical video tutorials on training, evaluating, and deploying local open-source language models.'
      }
    },
    {
      id: 'cr-yann-lecun',
      name: 'Yann LeCun',
      handle: '@ylecun',
      role: { es: 'VP & Chief AI Scientist en Meta / Premio Turing', en: 'VP & Chief AI Scientist at Meta / Turing Award Winner' },
      category: 'architecture',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/ylecun', type: 'x' },
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/yann-lecun/', type: 'linkedin' },
        { name: 'Facebook', url: 'https://www.facebook.com/yann.lecun', type: 'substack' }
      ],
      desc: {
        es: 'Ganador del Premio Turing y padre del deep learning moderno. Defiende los "World Models" y el open-source de Meta (Llama). Su crítica al escalado como vía hacia la AGI genera los debates más influyentes del campo.',
        en: 'Turing Award winner and father of modern deep learning. Advocates for "World Models" and Meta open-source (Llama). His critiques of LLM scaling spark the most influential debates in the field.'
      }
    },
    {
      id: 'cr-francois-chollet',
      name: 'François Chollet',
      handle: '@fchollet',
      role: { es: 'Creador de Keras \u0026 ARC-AGI Benchmark (Google DeepMind)', en: 'Creator of Keras \u0026 ARC-AGI Benchmark (Google DeepMind)' },
      category: 'architecture',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/fchollet', type: 'x' },
        { name: 'GitHub', url: 'https://github.com/fchollet', type: 'github' },
        { name: 'ARC Prize', url: 'https://arcprize.org/', type: 'substack' }
      ],
      desc: {
        es: 'Creador de Keras y el benchmark ARC-AGI, la prueba más exigente de razonamiento abstracto para LLMs. Ofrece el análisis crítico más riguroso sobre las limitaciones de los modelos actuales y el camino real hacia la IA general.',
        en: 'Creator of Keras and the ARC-AGI benchmark, the hardest abstract reasoning test for LLMs. Provides the most rigorous critical analysis of current model limitations and the genuine path toward AGI.'
      }
    },
    {
      id: 'cr-andrew-ng',
      name: 'Andrew Ng',
      handle: '@AndrewYNg',
      role: { es: 'Fundador de DeepLearning.AI \u0026 The Batch Newsletter', en: 'Founder of DeepLearning.AI \u0026 The Batch Newsletter' },
      category: 'prompting',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/AndrewYNg', type: 'x' },
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/andrewyng/', type: 'linkedin' },
        { name: 'Newsletter (The Batch)', url: 'https://www.deeplearning.ai/the-batch/', type: 'substack' },
        { name: 'YouTube', url: 'https://www.youtube.com/@Deeplearningai', type: 'youtube' }
      ],
      desc: {
        es: 'Co-fundador de Google Brain y Coursera. Su newsletter semanal "The Batch" y sus cursos de DeepLearning.AI son la referencia educativa más respetada del mundo sobre IA aplicada, agentes y frameworks de prompting.',
        en: 'Co-founder of Google Brain and Coursera. His weekly newsletter "The Batch" and DeepLearning.AI courses are the world\'s most respected educational reference for applied AI, agents, and prompting frameworks.'
      }
    },
    {
      id: 'cr-alex-albert',
      name: 'Alex Albert',
      handle: '@alexalbert__',
      role: { es: 'Head of Developer Relations en Anthropic', en: 'Head of Developer Relations at Anthropic' },
      category: 'prompting',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/alexalbert__', type: 'x' },
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/alex-albert/', type: 'linkedin' }
      ],
      desc: {
        es: 'Primer "Prompt Engineer" oficial de Anthropic y actual Head of DevRel. Comparte técnicas avanzadas de prompt caching, structured outputs, uso de Claude en producción y la filosofía interna de Anthropic sobre el diseño de prompts.',
        en: 'Anthropic\'s original Prompt Engineer and current Head of DevRel. Shares advanced prompt caching techniques, structured outputs, Claude in production, and Anthropic\'s internal philosophy on prompt design.'
      }
    },
    {
      id: 'cr-jerry-liu',
      name: 'Jerry Liu',
      handle: '@jerryjliu0',
      role: { es: 'Co-fundador \u0026 CEO de LlamaIndex', en: 'Co-founder \u0026 CEO of LlamaIndex' },
      category: 'agents',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/jerryjliu0', type: 'x' },
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/jerry-liu-4b84b34/', type: 'linkedin' },
        { name: 'GitHub', url: 'https://github.com/run-llama/llama_index', type: 'github' }
      ],
      desc: {
        es: 'Co-fundador de LlamaIndex, el framework de referencia para RAG, indexación de documentos y pipelines de agentes en producción. Voz líder en el diseño de sistemas de recuperación semántica para LLMs.',
        en: 'Co-founder of LlamaIndex, the go-to framework for RAG, document indexing, and production agent pipelines. Leading voice on semantic retrieval system design for LLMs.'
      }
    },
    {
      id: 'cr-matt-shumer',
      name: 'Matt Shumer',
      handle: '@mattshumer_',
      role: { es: 'CEO de HyperWrite \u0026 Teórico de Agentes Autónomos', en: 'CEO of HyperWrite \u0026 Autonomous Agent Theorist' },
      category: 'agents',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/mattshumer_', type: 'x' },
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/mattshumer/', type: 'linkedin' },
        { name: 'Blog', url: 'https://shumer.dev/', type: 'substack' }
      ],
      desc: {
        es: 'CEO de HyperWrite. Publica experimentos de vanguardia con agentes LLM autónomos, automatización de flujos de trabajo complejos y reflexiones sobre el impacto transformador de la IA en el trabajo del conocimiento.',
        en: 'CEO of HyperWrite. Publishes cutting-edge experiments with autonomous LLM agents, complex workflow automation, and reflections on the transformative impact of AI on knowledge work.'
      }
    },
    {
      id: 'cr-ben-hylak',
      name: 'Ben Hylak',
      handle: '@benhylak',
      role: { es: 'Fundador de Raindrop (Observabilidad para Agentes AI)', en: 'Founder of Raindrop (AI Agent Observability)' },
      category: 'security',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/benhylak', type: 'x' },
        { name: 'LinkedIn', url: 'https://www.linkedin.com/in/ben-hylak/', type: 'linkedin' }
      ],
      desc: {
        es: 'Fundador de Raindrop, plataforma de observabilidad y seguridad para agentes AI en producción. Pionero en trazabilidad de agentes, depuración de fallos silenciosos y defensa contra ataques en pipelines agénticos.',
        en: 'Founder of Raindrop, an observability and security platform for production AI agents. Pioneer in agent tracing, silent failure debugging, and attack defense in agentic pipelines.'
      }
    },
    {
      id: 'cr-matt-wolfe',
      name: 'Matt Wolfe',
      handle: '@mreflow',
      role: { es: 'Creador de contenido AI \u0026 Host de "Future Tools"', en: 'AI Content Creator \u0026 Host of "Future Tools"' },
      category: 'prompting',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/mreflow', type: 'x' },
        { name: 'YouTube', url: 'https://www.youtube.com/@mreflow', type: 'youtube' },
        { name: 'Newsletter', url: 'https://futuretools.io/', type: 'substack' }
      ],
      desc: {
        es: 'Uno de los creadores de contenido sobre IA con mayor crecimiento. Su canal de YouTube y newsletter "Future Tools" son el mapa definitivo de las nuevas herramientas de IA, demos prácticas y prompts aplicados a flujos creativos.',
        en: 'One of the fastest-growing AI content creators. His YouTube channel and "Future Tools" newsletter are the definitive map of new AI tools, practical demos, and prompts applied to creative workflows.'
      }
    },
    {
      id: 'cr-dotcsv',
      name: 'DotCSV (Carlos Santana)',
      handle: '@DotCSV',
      role: { es: 'Divulgador de IA en español · YouTube (~800k)', en: 'Spanish-language AI educator · YouTube (~800k)' },
      category: 'architecture',
      platforms: [
        { name: 'X / Twitter', url: 'https://x.com/DotCSV', type: 'x' },
        { name: 'YouTube', url: 'https://www.youtube.com/channel/UCy5znSnfMsDwaLlROnZ7Qbg', type: 'youtube' }
      ],
      desc: {
        es: '🇪🇸 El divulgador de IA en español más respetado: deep dives sobre redes neuronales, transformers y los últimos modelos, con rigor técnico y divulgación de primer nivel.',
        en: '🇪🇸 The most respected Spanish-language AI educator: deep dives on neural networks, transformers and the latest models, with technical rigor and first-class science communication.'
      }
    },
    {
      id: 'cr-ia-en-espanol',
      name: 'IA en Español',
      handle: 'iaenespanol.club',
      role: { es: 'La mayor newsletter de IA en español (40k+ miembros)', en: 'Largest Spanish-language AI newsletter (40k+ members)' },
      category: 'prompting',
      platforms: [
        { name: 'Newsletter', url: 'https://iaenespanol.club/', type: 'substack' }
      ],
      desc: {
        es: '🇪🇸 Newsletter de referencia hispanohablante: noticias de IA, análisis de herramientas y prompts prácticos cada pocos días, por Jesús Arias y Emilio García.',
        en: '🇪🇸 The go-to Spanish-language newsletter: AI news, tool analysis and practical prompts every few days, by Jesús Arias and Emilio García.'
      }
    },
    {
      id: 'cr-saul-gordillo',
      name: 'Saul Gordillo',
      handle: 'saulgordillo.substack.com',
      role: { es: 'Analista de IA & Substack (español)', en: 'AI analyst & Substack (Spanish)' },
      category: 'prompting',
      platforms: [
        { name: 'Substack', url: 'https://saulgordillo.substack.com/', type: 'substack' }
      ],
      desc: {
        es: '🇪🇸 Analista y cronista del ecosistema de IA en español: mapas de creadores, tendencias de generativos y aplicaciones reales de IA en empresas.',
        en: '🇪🇸 Analyst and chronicler of the Spanish-language AI ecosystem: creator maps, generative AI trends and real business applications.'
      }
    },
    {
      id: 'cr-defend-intelligence',
      name: 'Defend Intelligence (Anis Ayari)',
      handle: 'defendintelligence.com',
      role: { es: 'Ingeniero IA & creador de contenido (francés)', en: 'AI engineer & content creator (French)' },
      category: 'architecture',
      platforms: [
        { name: 'YouTube', url: 'https://www.youtube.com/c/DefendIntelligence-tech', type: 'youtube' },
        { name: 'Web', url: 'https://defendintelligence.com/', type: 'substack' }
      ],
      desc: {
        es: '🇫🇷 El canal de IA francófono más influyente: decodificación de modelos, actualidades de IA, masterclasses y el oficio de Data Scientist.',
        en: '🇫🇷 The most influential French-speaking AI channel: model deep dives, AI news, masterclasses and the Data Scientist craft.'
      }
    },
    {
      id: 'cr-everlast-ai',
      name: 'Everlast AI (Leonard Schmedding)',
      handle: '@everlastai',
      role: { es: 'Semanario de noticias KI & consultoría (alemán)', en: 'Weekly KI news & consulting (German)' },
      category: 'architecture',
      platforms: [
        { name: 'YouTube', url: 'https://www.youtube.com/@everlastai', type: 'youtube' }
      ],
      desc: {
        es: '🇩🇪 Referencia alemana sobre IA: noticias semanales de KI, casos de uso empresariales, tutoriales y entrevistas con expertos.',
        en: '🇩🇪 German-language AI reference: weekly KI news, enterprise use cases, tutorials and expert interviews.'
      }
    },
    {
      id: 'cr-didatica-tech',
      name: 'Didática Tech',
      handle: '@DidaticaTech',
      role: { es: 'Educación de ML & Data Science (portugués)', en: 'ML & Data Science education (Portuguese)' },
      category: 'architecture',
      platforms: [
        { name: 'YouTube', url: 'https://www.youtube.com/c/Did%C3%A1ticaTech', type: 'youtube' },
        { name: 'Web', url: 'https://didatica.tech/', type: 'substack' }
      ],
      desc: {
        es: '🇧🇷 El canal brasileño que "descomplica" la IA: machine learning, ciencia de datos y fundamentos matemáticos explicados desde cero en portugués.',
        en: '🇧🇷 The Brazilian channel that "de-complicates" AI: machine learning, data science and math foundations explained from scratch in Portuguese.'
      }
    },
    {
      id: 'cr-ledge-ai',
      name: 'Ledge.ai',
      handle: 'ledge.ai',
      role: { es: 'El mayor medio de noticias de IA de Japón', en: 'Japan\'s largest AI news media' },
      category: 'prompting',
      platforms: [
        { name: 'Web', url: 'https://ledge.ai/', type: 'substack' }
      ],
      desc: {
        es: '🇯🇵 Medio japonés de referencia sobre IA: cobertura diaria de LLMs, lanzamientos de modelos y aplicaciones empresariales de IA en el mercado japonés.',
        en: '🇯🇵 Japan\'s reference AI media: daily coverage of LLMs, model releases and enterprise AI adoption in the Japanese market.'
      }
    }
  ],

  /* ── 6. Live Feed & AI News Ticker ───────────────────────────
     Latest posts, releases, papers & discoveries from top AI creators. */
    feed: [
    {
        "id": "feed-1",
        "author": "@goodside",
        "tag": "Prompt Injection",
        "text": {
            "es": "Investigación pionera sobre ataques de Inyección de Prompt y brechas de seguridad adversarial en LLMs.",
            "en": "Pioneering research on Prompt Injection attacks and adversarial security vulnerabilities in LLMs."
        },
        "url": "https://x.com/goodside/status/1569128808308957185",
        "timestamp": "Sep 2022 · Landmark"
    },
    {
        "id": "feed-2",
        "author": "@karpathy",
        "tag": "LLM Architecture",
        "text": {
            "es": "Masterclass en video: \"Let's build GPT from scratch, in code, spelled out\" con tokenización y auto-atención.",
            "en": "Video Masterclass: \"Let's build GPT from scratch, in code, spelled out\" with tokenization and self-attention."
        },
        "url": "https://www.youtube.com/watch?v=kCc8FmEb1nY",
        "timestamp": "Ene 2023 · Masterclass"
    },
    {
        "id": "feed-3",
        "author": "Anthropic Research",
        "tag": "Prompt Engineering",
        "text": {
            "es": "Guía oficial de Prompting para Claude: Delimitadores XML estructurados, Chain-of-Thought y Few-Shot.",
            "en": "Official Claude Prompting Guide: Structured XML delimiters, Chain-of-Thought, and Few-Shot examples."
        },
        "url": "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/overview",
        "timestamp": "2026 · Guía Oficial"
    },
    {
        "id": "feed-4",
        "author": "Latent Space",
        "tag": "AI Engineering",
        "text": {
            "es": "Manifiesto \"The Rise of the AI Engineer\" y análisis del ecosistema de desarrollo con modelos de frontera.",
            "en": "\"The Rise of the AI Engineer\" manifesto and technical analysis of the frontier model developer ecosystem."
        },
        "url": "https://www.latent.space/p/decoding-2026",
        "timestamp": "2026 · AI Engineering"
    },
    {
        "id": "feed-5",
        "author": "Lilian Weng",
        "tag": "Autonomous Agents",
        "text": {
            "es": "Paper de referencia \"LLM Powered Autonomous Agents\" detallando planificación, memoria y uso de herramientas.",
            "en": "Landmark paper \"LLM Powered Autonomous Agents\" detailing planning, memory systems, and tool use."
        },
        "url": "https://lilianweng.github.io/posts/2023-06-23-agent/",
        "timestamp": "Jun 2023 · Landmark Paper"
    },
    {
        "id": "feed-6",
        "author": "DeepSeek AI",
        "tag": "Reasoning Models",
        "text": {
            "es": "Paper técnico de DeepSeek-R1: Razonamiento autónomo incentivado mediante Reinforcement Learning puro sin SFT.",
            "en": "DeepSeek-R1 technical report: Autonomous reasoning incentivized by pure Reinforcement Learning without SFT."
        },
        "url": "https://github.com/deepseek-ai/DeepSeek-R1",
        "timestamp": "Ene 2025 · Reporte SOTA"
    },
    {
        "id": "feed-7",
        "author": "OpenAI Research",
        "tag": "Prompt Engineering",
        "text": {
            "es": "Estrategias oficiales de ingeniería de prompts para GPT-4o y modelos de razonamiento (o3-mini).",
            "en": "Official prompt engineering strategies for GPT-4o and reasoning models (o3-mini)."
        },
        "url": "https://platform.openai.com/docs/guides/prompt-engineering",
        "timestamp": "2026 · Guía Oficial"
    },
    {
        "id": "feed-8",
        "author": "Google DeepMind",
        "tag": "Multimodal AI",
        "text": {
            "es": "Gemini 2.0 Flash: Procesamiento multimodal nativo de baja latencia con ventana de 2 millones de tokens.",
            "en": "Gemini 2.0 Flash: Low-latency native multimodal processing with a 2-million-token context window."
        },
        "url": "https://deepmind.google/technologies/gemini/",
        "timestamp": "Dic 2024 · Release"
    },
    {
        "id": "feed-9",
        "author": "Eugene Yan",
        "tag": "Eval & Patterns",
        "text": {
            "es": "Patrones de diseño para sistemas basados en LLMs y desarrollo guiado por evaluaciones continuas (Evals).",
            "en": "Design patterns for LLM-based systems and evaluation-driven development (Evals)."
        },
        "url": "https://eugeneyan.com/writing/llm-patterns/",
        "timestamp": "Jul 2023 · Systems Guide"
    },
    {
        "id": "feed-10",
        "author": "Harrison Chase",
        "tag": "Agent Workflows",
        "text": {
            "es": "LangGraph: Máquinas de estado multi-agente, ciclos de control y persistencia para flujos complejos de producción.",
            "en": "LangGraph: Multi-agent state machines, cyclical control flows, and persistence for production workflows."
        },
        "url": "https://blog.langchain.dev/",
        "timestamp": "2024 · Agent Architecture"
    },
    {
        "id": "feed-11",
        "author": "Simon Willison",
        "tag": "Security & Web",
        "text": {
            "es": "Análisis exhaustivo de ataques de Inyección Indirecta de Prompt y aislamiento de contexto en herramientas web.",
            "en": "In-depth analysis of Indirect Prompt Injection attacks and context sandboxing in web tools."
        },
        "url": "https://simonwillison.net/tags/prompt-injection/",
        "timestamp": "2024 · Security Research"
    },
    {
        "id": "feed-12",
        "author": "Ethan Mollick",
        "tag": "Frontier AI",
        "text": {
            "es": "Guía práctica para trabajar con modelos de frontera: Asignación de roles expertos y mitigación de sesgos.",
            "en": "Practical guide for working with frontier models: Expert persona assignment and bias mitigation."
        },
        "url": "https://www.oneusefulthing.org/",
        "timestamp": "2024 · Frontier Thinking"
    },
    {
        "id": "feed-13",
        "author": "Hamel Husain",
        "tag": "LLM Evals",
        "text": {
            "es": "Tu producto de IA necesita Evals rigurosos, no solo más prompts: Metodología de testeo para producción.",
            "en": "Your AI product needs rigorous Evals, not just prompts: Battle-tested testing methodology for production."
        },
        "url": "https://hamel.dev/blog/posts/evals/",
        "timestamp": "Mar 2024 · Evals Guide"
    },
    {
        "id": "feed-14",
        "author": "Chip Huyen",
        "tag": "Production LLMs",
        "text": {
            "es": "Arquitectura de aplicaciones LLM en producción: RAG híbrido, caché semántico y observabilidad.",
            "en": "Production LLM application architecture: Hybrid RAG, semantic caching, and telemetry observability."
        },
        "url": "https://huyenchip.com/blog/",
        "timestamp": "2023 · Production Architecture"
    },
    {
        "id": "feed-15",
        "author": "Jason Wei",
        "tag": "Reasoning CoT",
        "text": {
            "es": "Paper seminal \"Chain-of-Thought Prompting\": Cómo el desglose paso a paso desbloquea el razonamiento en LLMs.",
            "en": "Seminal paper \"Chain-of-Thought Prompting\": How step-by-step reasoning unlocks LLM capabilities."
        },
        "url": "https://arxiv.org/abs/2201.11903",
        "timestamp": "Ene 2022 · Landmark Paper"
    },
    {
        "id": "feed-16",
        "author": "Jim Fan",
        "tag": "Embodied Agents",
        "text": {
            "es": "Voyager: Agente autónomo con capacidad de aprendizaje continuo y librería iterativa de habilidades en código.",
            "en": "Voyager: Autonomous embodied agent with lifelong learning and iterative code skill library."
        },
        "url": "https://voyager.minedojo.org/",
        "timestamp": "May 2023 · Landmark Agent"
    },
    {
        "id": "feed-17",
        "author": "Philipp Schmid",
        "tag": "Open Weights",
        "text": {
            "es": "Guía de fine-tuning y despliegue optimizado de modelos abiertos (Llama 3.3, DeepSeek) con Hugging Face TGI.",
            "en": "Guide to fine-tuning and deploying open-weights models (Llama 3.3, DeepSeek) with Hugging Face TGI."
        },
        "url": "https://www.philschmid.de/",
        "timestamp": "2024 · Fine-Tuning Guide"
    },
    {
        "id": "feed-18",
        "author": "Tim Dettmers",
        "tag": "Quantization",
        "text": {
            "es": "Paper de QLoRA: Cuantización de 4 bits y adaptación de bajo rango para entrenar modelos gigantes en GPUs de consumo.",
            "en": "QLoRA paper: 4-bit quantization and low-rank adaptation for training massive LLMs on consumer GPUs."
        },
        "url": "https://arxiv.org/abs/2305.14314",
        "timestamp": "May 2023 · Landmark Paper"
    },
    {
        "id": "feed-19",
        "author": "Mistral AI",
        "tag": "Open Weights",
        "text": {
            "es": "Mistral Large 2: Arquitectura avanzada con soporte nativo de llamadas a funciones y razonamiento multilingüe.",
            "en": "Mistral Large 2: Advanced architecture with native function calling and multilingual reasoning."
        },
        "url": "https://mistral.ai/news/mistral-large-2407/",
        "timestamp": "Jul 2024 · Release SOTA"
    },
    {
        "id": "feed-20",
        "author": "Meta AI",
        "tag": "Open Weights",
        "text": {
            "es": "Llama 3.3 70B Instruct: Rendimiento comparable al modelo de 405B con eficiencia computacional 5x superior.",
            "en": "Llama 3.3 70B Instruct: 405B-tier capability with 5x compute efficiency for enterprise and local deployments."
        },
        "url": "https://ai.meta.com/blog/meta-llama-3/",
        "timestamp": "Dic 2024 · Release"
    },
    {
        "id": "feed-21",
        "author": "Shreya Shankar",
        "tag": "Eval & Telemetry",
        "text": {
            "es": "Spade & Evaluaciones automatizadas: Detección de regresiones en respuestas de LLMs antes de ir a producción.",
            "en": "Spade & Automated Evals: Detecting behavioral regressions in LLM outputs before production release."
        },
        "url": "https://www.sh-reya.com/",
        "timestamp": "2024 · Research Paper"
    },
    {
        "id": "feed-22",
        "author": "Dan Hendrycks",
        "tag": "Benchmarks",
        "text": {
            "es": "MMLU-Pro: Nueva generación de benchmarks de evaluación para mitigar la saturación de los tests tradicionales.",
            "en": "MMLU-Pro: Next-generation evaluation benchmark designed to address saturation in legacy benchmarks."
        },
        "url": "https://github.com/TIGER-AI-Lab/MMLU-Pro",
        "timestamp": "Jun 2024 · Benchmark SOTA"
    },
    {
        "id": "feed-23",
        "author": "Pliny the Prompter",
        "tag": "Red Teaming",
        "text": {
            "es": "Auditoría de seguridad adversarial en modelos SOTA: Análisis de jailbreaks lógicos y guardrails de seguridad.",
            "en": "Adversarial security auditing across SOTA models: Analysis of logical jailbreaks and safety guardrails."
        },
        "url": "https://x.com/elder_plinius",
        "timestamp": "2025 · Red Teaming"
    },
    {
        "id": "feed-24",
        "author": "Andrew Ng",
        "tag": "Agentic Patterns",
        "text": {
            "es": "Los 4 patrones de diseño para agentes de IA: Reflexión, Uso de Herramientas, Planificación y Multi-agente.",
            "en": "The 4 key design patterns for AI agents: Reflection, Tool Use, Planning, and Multi-agent Collaboration."
        },
        "url": "https://www.deeplearning.ai/the-batch/how-agents-can-improve-llm-performance/",
        "timestamp": "Mar 2024 · Guía de Arquitectura"
    },
    {
        "id": "feed-25",
        "author": "Alibaba Qwen Team",
        "tag": "Coding Models",
        "text": {
            "es": "Qwen 2.5 Coder: Modelo especializado en desarrollo de software con puntuación SWE-bench competitiva con modelos frontera.",
            "en": "Qwen 2.5 Coder: Specialized software engineering model with SWE-bench performance rivaling frontier models."
        },
        "url": "https://qwenlm.github.io/blog/qwen2.5-coder/",
        "timestamp": "Nov 2024 · Release SOTA"
    },
    {
        "id": "feed-26",
        "author": "Percy Liang",
        "tag": "Stanford HELM",
        "text": {
            "es": "Holistic Evaluation of Language Models (HELM): Evaluación multidimensional de precisión, sesgos y robustez.",
            "en": "Holistic Evaluation of Language Models (HELM): Multidimensional evaluation of accuracy, bias, and robustness."
        },
        "url": "https://crfm.stanford.edu/helm/classic/latest/",
        "timestamp": "2024 · Benchmark Suite"
    },
    {
        "id": "feed-27",
        "author": "Sébastien Bubeck",
        "tag": "Emergent Reasoning",
        "text": {
            "es": "Investigación sobre capacidades emergentes y destilación de razonamiento en modelos compactos (Phi series).",
            "en": "Research on emergent capabilities and reasoning distillation into compact models (Phi series)."
        },
        "url": "https://arxiv.org/abs/2303.12712",
        "timestamp": "Mar 2023 · Research Paper"
    },
    {
        "id": "feed-28",
        "author": "Awni Hannun",
        "tag": "Apple Silicon MLX",
        "text": {
            "es": "MLX Framework: Inferencia y fine-tuning ultrarrápido de modelos de 70B en memoria unificada de Apple Silicon.",
            "en": "MLX Framework: Blazing-fast inference and fine-tuning of 70B models on Apple Silicon unified memory."
        },
        "url": "https://github.com/ml-explore/mlx",
        "timestamp": "Dic 2023 · Local LLM Engine"
    },
    {
        "id": "feed-29",
        "author": "Logan Kilpatrick",
        "tag": "AI Dev Tools",
        "text": {
            "es": "Guía de diseño de herramientas para desarrolladores de IA: Gestión eficiente de contexto y caching de prompts.",
            "en": "AI developer tooling design guide: Efficient context window management and prompt caching."
        },
        "url": "https://x.com/OfficialLoganK",
        "timestamp": "2024 · Dev Tooling"
    },
    {
        "id": "feed-30",
        "author": "Arthur Mensch",
        "tag": "Mixture of Experts",
        "text": {
            "es": "Arquitecturas Mixture-of-Experts (MoE): Activación dispersa de parámetros para inferencia de alto rendimiento.",
            "en": "Mixture-of-Experts (MoE) architectures: Sparse parameter activation for high-throughput inference."
        },
        "url": "https://mistral.ai/news/mixtral-of-experts/",
        "timestamp": "Dic 2023 · MoE Architecture"
    }
],

  /* ── 7. Top LLM Models & Benchmarks Directory ────────────────
     Frontier & Open Source Foundation Models with Benchmark Telemetry & Prompting Guides. */
  models: [
    {
        "id": "model-claude-3-7-sonnet",
        "rank": 1,
        "name": "Claude 3.7 Sonnet",
        "provider": "Anthropic",
        "type": "frontier",
        "category": "reasoning",
        "badge": "🥇 Top 1 Razonamiento Híbrido & Código",
        "badgeEn": "🥇 Top 1 Hybrid Reasoning & Code",
        "contextWindow": "200K tokens",
        "contextNum": 200000,
        "license": "Proprietary (API)",
        "pricing": {
            "input": "$3.00 / 1M",
            "output": "$15.00 / 1M",
            "note": {
                "es": "Modo thinking configurable",
                "en": "Configurable thinking tokens"
            }
        },
        "benchmarks": {
            "arenaElo": 1380,
            "mmluPro": "85.2%",
            "sweBench": "70.3%",
            "math500": "96.2%",
            "humanEval": "93.8%"
        },
        "desc": {
            "es": "El primer modelo con razonamiento híbrido (pensamiento extendido configurable). Líder absoluto en ingeniería de software, arquitectura de sistemas y seguimiento estricto de restricciones XML.",
            "en": "The first hybrid reasoning model with configurable extended thinking. Industry leader in software engineering, system architecture, and strict XML constraint adherence."
        },
        "strengths": {
            "es": [
                "Estructuración XML perfecta",
                "Edición quirúrgica de código en SWE-bench",
                "Razonamiento extendido sin alucinaciones"
            ],
            "en": [
                "Flawless XML structuring",
                "SOTA SWE-bench software engineering",
                "Extended reasoning with minimal hallucination"
            ]
        },
        "promptingTips": {
            "style": {
                "es": "Etiquetas XML canónicas (<system_role>, <requirements>, <output_format>) y metaprompts.",
                "en": "Canonical XML tags (<system_role>, <requirements>, <output_format>) and metaprompts."
            },
            "syntax": "XML Tags + Directives",
            "samplePrompt": "<system_role>\nEres un Arquitecto de Software Senior especializado en TypeScript y microservicios.\n</system_role>\n\n<objective>\nDiseña el esquema de tipos y la función de middleware para validación de tokens JWT en Node.js.\n</objective>\n\n<requirements>\n1. Proporciona código tipado con manejo exhaustivo de errores (TokenExpiredError, JsonWebTokenError).\n2. Estructura la respuesta con un bloque de explicación conciso y luego el bloque de código final.\n</requirements>\n\n<output_format>\nDevuelve el código TypeScript dentro de un bloque markdown.\n</output_format>"
        },
        "docsUrl": "https://docs.anthropic.com/en/docs/build-with-claude/prompt-engineering/system-prompts"
    },
    {
        "id": "model-gpt-4o",
        "rank": 2,
        "name": "GPT-4o",
        "provider": "OpenAI",
        "type": "frontier",
        "category": "multimodal",
        "badge": "🥈 Omnimodal SOTA & Audio/Visión",
        "badgeEn": "🥈 SOTA Omnimodal & Audio/Vision",
        "contextWindow": "128K tokens",
        "contextNum": 128000,
        "license": "Proprietary (API)",
        "pricing": {
            "input": "$2.50 / 1M",
            "output": "$10.00 / 1M",
            "note": {
                "es": "Baja latencia y visión nativa",
                "en": "Low latency & native vision"
            }
        },
        "benchmarks": {
            "arenaElo": 1345,
            "mmluPro": "82.8%",
            "sweBench": "53.8%",
            "math500": "88.5%",
            "humanEval": "90.2%"
        },
        "desc": {
            "es": "Modelo insignia omnimodal de OpenAI de alta velocidad. Excelente en generación de esquemas JSON estructurados, comprensión visual y tareas creativas de múltiples pasos.",
            "en": "OpenAI flagship high-speed omnimodal model. Excellent in structured JSON schema generation, visual understanding, and multi-step creative tasks."
        },
        "strengths": {
            "es": [
                "Velocidad de inferencia ultra-rápida",
                "Soporte JSON estructurado nativo (Structured Outputs)",
                "Capacidad multimodal voz/imagen/texto"
            ],
            "en": [
                "Ultra-fast inference speed",
                "Native Structured Outputs (JSON Schema)",
                "Seamless multimodal voice/image/text"
            ]
        },
        "promptingTips": {
            "style": {
                "es": "Roles de sistema claros en Markdown, directivas explícitas de formato y Few-Shot examples.",
                "en": "Clear Markdown system roles, explicit formatting directives, and Few-Shot examples."
            },
            "syntax": "Markdown + JSON Schema",
            "samplePrompt": "# ROL: Analista de Datos Senior\nAnaliza los datos de ventas y devuelve el resultado estrictamente en formato JSON válido.\n\n# ESQUEMA REQUERIDO\n{\n  \"total_revenue\": number,\n  \"top_product\": string,\n  \"growth_rate_pct\": number,\n  \"recommendations\": string[]\n}\n\n# ENTRADA DE DATOS\nVentas Q1: Producto A ($12,000), Producto B ($8,500). Crecimiento interanual: +14.5%."
        },
        "docsUrl": "https://platform.openai.com/docs/guides/prompt-engineering"
    },
    {
        "id": "model-deepseek-r1",
        "rank": 3,
        "name": "DeepSeek-R1",
        "provider": "DeepSeek",
        "type": "open_weights",
        "category": "reasoning",
        "badge": "🥉 SOTA Open Weights Reasoning (CoT)",
        "badgeEn": "🥉 SOTA Open Weights Reasoning (CoT)",
        "contextWindow": "164K tokens",
        "contextNum": 163840,
        "license": "MIT (Open Source)",
        "pricing": {
            "input": "$0.50 / 1M",
            "output": "$2.15 / 1M",
            "note": {
                "es": "Gratis auto-hospedado (Ollama/vLLM)",
                "en": "Free self-hosted (Ollama/vLLM)"
            }
        },
        "benchmarks": {
            "arenaElo": 1365,
            "mmluPro": "84.0%",
            "sweBench": "49.2%",
            "math500": "97.3%",
            "humanEval": "92.1%"
        },
        "desc": {
            "es": "Modelo de razonamiento por aprendizaje por refuerzo a gran escala. Pensamiento explícito mediante bloques <think> con rendimiento a la par de o1 en matemáticas, lógica y algoritmos.",
            "en": "Large-scale reinforcement learning reasoning model. Generates explicit thought chains in <think> tags matching o1 in mathematics, logic, and algorithms."
        },
        "strengths": {
            "es": [
                "Resolución matemática compleja (AIME / MATH 500)",
                "Cadena de pensamiento transparente (<think>)",
                "Licencia MIT abierta sin restricciones de uso comercial"
            ],
            "en": [
                "Complex mathematical reasoning (AIME / MATH 500)",
                "Transparent step-by-step chain of thought (<think>)",
                "Permissive MIT open license with commercial freedom"
            ]
        },
        "promptingTips": {
            "style": {
                "es": "Enunciados directos sin imponer pasos forzados; permitir que el modelo genere libremente su cadena <think>.",
                "en": "Direct problem statements without forcing rigid steps; allow the model to freely reason inside <think>."
            },
            "syntax": "Direct Zero-Shot / CoT",
            "samplePrompt": "Resuelve el siguiente problema de teoría de números paso a paso:\nEncuentra todos los enteros positivos n tales que n^4 + 4^n sea un número primo. Justifica rigurosamente tu respuesta demostrando que no existen otras soluciones."
        },
        "docsUrl": "https://github.com/deepseek-ai/DeepSeek-R1"
    },
    {
        "id": "model-gemini-2-flash",
        "rank": 4,
        "name": "Gemini 2.0 Flash",
        "provider": "Google DeepMind",
        "type": "frontier",
        "category": "multimodal",
        "badge": "⚡ Velocidad Extrema & 2M Contexto",
        "badgeEn": "⚡ Extreme Speed & 2M Context",
        "contextWindow": "2M tokens",
        "contextNum": 2000000,
        "license": "Proprietary (API)",
        "pricing": {
            "input": "$0.10 / 1M",
            "output": "$0.40 / 1M",
            "note": {
                "es": "Nivel gratuito generoso en Google AI Studio",
                "en": "Generous free tier on Google AI Studio"
            }
        },
        "benchmarks": {
            "arenaElo": 1350,
            "mmluPro": "82.1%",
            "sweBench": "51.5%",
            "math500": "91.0%",
            "humanEval": "89.6%"
        },
        "desc": {
            "es": "El modelo de mayor velocidad y ventana de contexto de la industria (2 millones de tokens). Capaz de ingerir bases de código enteras, horas de audio o libros completos con latencia ultra-baja.",
            "en": "Fastest inference and largest context window in the industry (2M tokens). Capable of processing entire code repositories, hours of audio, or whole books with ultra-low latency."
        },
        "strengths": {
            "es": [
                "Ventana masiva de 2,000,000 de tokens",
                "Invocación de herramientas (Function Calling) en tiempo real",
                "Excelente relación costo-rendimiento"
            ],
            "en": [
                "Massive 2,000,000 token context window",
                "Real-time multi-tool function calling",
                "Unbeatable cost-to-performance ratio"
            ]
        },
        "promptingTips": {
            "style": {
                "es": "Instrucciones concisas, aprovechamiento de documentos masivos en contexto y delimitadores Markdown.",
                "en": "Concise directives, massive long-context document ingestion, and Markdown delimiters."
            },
            "syntax": "Long-Context Ingestion",
            "samplePrompt": "Examina el siguiente archivo de log de base de datos de 50,000 líneas.\nIdentifica los 3 cuellos de botella de rendimiento más severos, las consultas lentas con tiempo > 1200ms y propón los índices necesarios en PostgreSQL."
        },
        "docsUrl": "https://ai.google.dev/gemini-api/docs/prompting-strategies"
    },
    {
        "id": "model-o3-mini",
        "rank": 5,
        "name": "OpenAI o3-mini",
        "provider": "OpenAI",
        "type": "frontier",
        "category": "reasoning",
        "badge": "🔬 Razonamiento STEM & Código Especializado",
        "badgeEn": "🔬 STEM Reasoning & Code Specialist",
        "contextWindow": "200K tokens",
        "contextNum": 200000,
        "license": "Proprietary (API)",
        "pricing": {
            "input": "$1.10 / 1M",
            "output": "$4.40 / 1M",
            "note": {
                "es": "Esfuerzo de razonamiento ajustable (low/medium/high)",
                "en": "Adjustable reasoning effort (low/medium/high)"
            }
        },
        "benchmarks": {
            "arenaElo": 1360,
            "mmluPro": "83.5%",
            "sweBench": "49.0%",
            "math500": "96.7%",
            "humanEval": "91.5%"
        },
        "desc": {
            "es": "Modelo de razonamiento compacto de última generación diseñado para tareas complejas en ciencia, tecnología, ingeniería, matemáticas (STEM) y desarrollo de software con esfuerzo de pensamiento calibrable.",
            "en": "Next-generation compact reasoning model optimized for STEM, competitive math, and software engineering with calibrated reasoning effort."
        },
        "strengths": {
            "es": [
                "Capacidad de depuración y refactorización profunda",
                "Puntaje de élite en competiciones de matemáticas",
                "Esfuerzo de razonamiento parametrizable"
            ],
            "en": [
                "Deep debugging and architectural refactoring",
                "Elite performance in math olympiads",
                "Configurable reasoning effort parameter"
            ]
        },
        "promptingTips": {
            "style": {
                "es": "Planteamientos de problemas técnicos sin atajos; especificar criterios de aceptación rigurosos.",
                "en": "Technical problem statements with rigorous acceptance criteria; avoid forcing intermediate steps."
            },
            "syntax": "Rigorous Technical Specs",
            "samplePrompt": "Optimiza la siguiente función de búsqueda de grafos en Python para reducir la complejidad temporal de O(N^2) a O(N log N). Incluye pruebas unitarias con casos extremos (grafos cíclicos, nodos aislados)."
        },
        "docsUrl": "https://platform.openai.com/docs/guides/reasoning"
    },
    {
        "id": "model-llama-3-3-70b",
        "rank": 6,
        "name": "Llama 3.3 70B Instruct",
        "provider": "Meta AI",
        "type": "open_weights",
        "category": "general",
        "badge": "🦙 Estándar Abierto de la Industria",
        "badgeEn": "🦙 Open Industry Standard",
        "contextWindow": "131K tokens",
        "contextNum": 131072,
        "license": "Llama 3.3 Community",
        "pricing": {
            "input": "$0.71 / 1M",
            "output": "$0.71 / 1M",
            "note": {
                "es": "Totalmente desplegable en local con Ollama / Groq / vLLM",
                "en": "Fully deployable locally with Ollama / Groq / vLLM"
            }
        },
        "benchmarks": {
            "arenaElo": 1310,
            "mmluPro": "78.2%",
            "sweBench": "42.0%",
            "math500": "82.5%",
            "humanEval": "88.4%"
        },
        "desc": {
            "es": "El modelo de pesos abiertos más equilibrado del mundo. Rinde al nivel del anterior Llama 3.1 405B pero con los requisitos de cómputo de un modelo de 70B parámetros.",
            "en": "The world's most balanced open weights model. Matches the capability of the massive 405B model while fitting in 70B parameter compute requirements."
        },
        "strengths": {
            "es": [
                "Despliegue local y en servidores privados sin telemetría",
                "Excelente seguimiento de directivas en lenguaje natural",
                "Ecosistema de fine-tuning masivo"
            ],
            "en": [
                "Private self-hosted deployment without external telemetry",
                "Strong natural language instruction following",
                "Massive fine-tuning and tool ecosystem"
            ]
        },
        "promptingTips": {
            "style": {
                "es": "Uso de delimitadores Markdown (### Sistema, ### Instrucción) y especificaciones claras de audiencia.",
                "en": "Markdown delimiters (### System, ### Instruction) with clear audience definitions."
            },
            "syntax": "Markdown Headers + Directives",
            "samplePrompt": "### ROL\nActúa como un Consultor de Ciberseguridad ISO 27001.\n\n### TAREA\nRedacta una política de contraseñas y autenticación multifactor (MFA) para una empresa tecnológica de 200 empleados.\n\n### REQUISITOS\n- Longitud mínima de 14 caracteres.\n- Rotación basada en riesgos (no obligatoria por calendario).\n- Procedimiento para incidentes de cuentas comprometidas."
        },
        "docsUrl": "https://llama.meta.com/"
    },
    {
        "id": "model-qwen-2-5-72b",
        "rank": 7,
        "name": "Qwen 2.5 72B Instruct / Coder",
        "provider": "Alibaba Cloud",
        "type": "open_weights",
        "category": "coding",
        "badge": "💻 SOTA Open Coding & Multilingüe",
        "badgeEn": "💻 SOTA Open Coding & Multilingual",
        "contextWindow": "33K tokens",
        "contextNum": 32768,
        "license": "Apache 2.0 (Open Source)",
        "pricing": {
            "input": "$0.66 / 1M",
            "output": "$1.00 / 1M",
            "note": {
                "es": "Licencia Apache 2.0 permisiva",
                "en": "Permissive Apache 2.0 license"
            }
        },
        "benchmarks": {
            "arenaElo": 1318,
            "mmluPro": "80.4%",
            "sweBench": "46.8%",
            "math500": "85.2%",
            "humanEval": "92.7%"
        },
        "desc": {
            "es": "Líder absoluto de código abierto en benchmarks de programación (HumanEval 92.7%) y soporte multilingüe en más de 29 idiomas. Licencia comercial Apache 2.0 completamente permisiva.",
            "en": "Absolute open weights leader in coding benchmarks (HumanEval 92.7%) and multilingual support across 29+ languages under a permissive Apache 2.0 license."
        },
        "strengths": {
            "es": [
                "Puntaje superior en programación (Python, C++, JS, Rust)",
                "Licencia comercial Apache 2.0 libre",
                "Excelente soporte bilingüe y multilingüe"
            ],
            "en": [
                "Top-tier coding accuracy across Python, C++, JS, Rust",
                "Unrestricted Apache 2.0 commercial license",
                "Outstanding multilingual capabilities"
            ]
        },
        "promptingTips": {
            "style": {
                "es": "Especificaciones de código con firmas de funciones, tipos y doctests.",
                "en": "Code specifications with function signatures, types, and doctests."
            },
            "syntax": "Code Snippets + Type Signatures",
            "samplePrompt": "Escribe un algoritmo en Python que implemente un Rate Limiter con Token Bucket usando Redis. Incluye soporte para operaciones atómicas mediante scripts Lua y manejo de desconexiones."
        },
        "docsUrl": "https://qwenlm.github.io/"
    },
    {
        "id": "model-deepseek-v3",
        "rank": 8,
        "name": "DeepSeek-V3",
        "provider": "DeepSeek",
        "type": "open_weights",
        "category": "general",
        "badge": "🧠 Arquitectura MoE Ultra-Eficiente (671B)",
        "badgeEn": "🧠 Ultra-Efficient MoE Architecture (671B)",
        "contextWindow": "164K tokens",
        "contextNum": 163840,
        "license": "MIT (Open Source)",
        "pricing": {
            "input": "$0.26 / 1M",
            "output": "$0.38 / 1M",
            "note": {
                "es": "Costo por token más bajo del mercado para un modelo frontera",
                "en": "Lowest token cost on the market for a frontier-grade model"
            }
        },
        "benchmarks": {
            "arenaElo": 1325,
            "mmluPro": "81.2%",
            "sweBench": "44.5%",
            "math500": "87.1%",
            "humanEval": "89.2%"
        },
        "desc": {
            "es": "Modelo Mixture-of-Experts masivo (671B parámetros totales con 37B activos por token) que democratizó la inferencia de nivel frontera a una fracción del costo de la industria.",
            "en": "Massive Mixture-of-Experts model (671B total params with 37B active) that democratized frontier-grade inference at a fraction of traditional cost."
        },
        "strengths": {
            "es": [
                "Costo de inferencia ultra-económico",
                "Conocimiento general y traducción de alta fidelidad",
                "Arquitectura MoE optimizada"
            ],
            "en": [
                "Ultra-economical API pricing",
                "High-fidelity general knowledge and translation",
                "Highly optimized MoE architecture"
            ]
        },
        "promptingTips": {
            "style": {
                "es": "Instrucciones estructuradas por viñetas, contexto claro y formato de salida especificado.",
                "en": "Bullet-point structured prompts, clear context, and explicit output formats."
            },
            "syntax": "Bullet-Point Directives",
            "samplePrompt": "Genera un informe comparativo entre las arquitecturas de bases de datos relacionales (PostgreSQL) y documentales (MongoDB) para un sistema de e-commerce de alto tráfico."
        },
        "docsUrl": "https://github.com/deepseek-ai/DeepSeek-V3"
    },
    {
        "id": "model-mistral-large-2",
        "rank": 9,
        "name": "Mistral Large 2",
        "provider": "Mistral AI",
        "type": "open_weights",
        "category": "coding",
        "badge": "🇪🇺 SOTA Europeo & Razonamiento Avanzado",
        "badgeEn": "🇪🇺 European SOTA & Advanced Reasoning",
        "contextWindow": "262K tokens",
        "contextNum": 262144,
        "license": "Mistral Non-Commercial / Commercial API",
        "pricing": {
            "input": "$0.50 / 1M",
            "output": "$1.50 / 1M",
            "note": {
                "es": "Especialista en código multilingüe",
                "en": "Multilingual and code specialist"
            }
        },
        "benchmarks": {
            "arenaElo": 1305,
            "mmluPro": "79.0%",
            "sweBench": "43.2%",
            "math500": "81.0%",
            "humanEval": "89.0%"
        },
        "desc": {
            "es": "El modelo insignia de 123B parámetros de Mistral AI. Especializado en generación y depuración de código en más de 80 lenguajes, razonamiento matemático y razonamiento multilingüe europeo.",
            "en": "Mistral AI 123B parameter flagship model. Specialized in code generation across 80+ programming languages, mathematical reasoning, and European multilingual tasks."
        },
        "strengths": {
            "es": [
                "Soporte para más de 80 lenguajes de programación",
                "Alineación precisa a directivas sin verbosidad excesiva",
                "Invocación de funciones JSON robusta"
            ],
            "en": [
                "Support for 80+ programming languages",
                "Concise instruction following with minimal fluff",
                "Robust JSON function calling"
            ]
        },
        "promptingTips": {
            "style": {
                "es": "Instrucciones concisas y directas sin florituras ni preámbulos.",
                "en": "Concise and direct instructions without conversational filler."
            },
            "syntax": "Concise & Structured Prompting",
            "samplePrompt": "Refactoriza este endpoint en Node.js/Express para implementar compresión gzip, caché en cabeceras ETag y validación de esquema con Zod."
        },
        "docsUrl": "https://docs.mistral.ai/"
    },
    {
        "id": "model-grok-2",
        "rank": 10,
        "name": "Grok 2 / Grok 3",
        "provider": "xAI",
        "type": "frontier",
        "category": "general",
        "badge": "🚀 Datos en Tiempo Real & Pensamiento Crítico",
        "badgeEn": "🚀 Real-Time Data & Critical Thinking",
        "contextWindow": "128K tokens",
        "contextNum": 128000,
        "license": "Proprietary (API)",
        "pricing": {
            "input": "$2.00 / 1M",
            "output": "$10.00 / 1M",
            "note": {
                "es": "Acceso a feed de X en tiempo real",
                "en": "Live access to real-time X feed"
            }
        },
        "benchmarks": {
            "arenaElo": 1335,
            "mmluPro": "81.5%",
            "sweBench": "45.0%",
            "math500": "86.4%",
            "humanEval": "88.5%"
        },
        "desc": {
            "es": "Modelo de vanguardia de xAI entrenado en el clúster Colossus. Destaca por su capacidad para procesar información de actualidad en tiempo real, razonamiento lógico y generación de código sin censuras arbitrarias.",
            "en": "Frontier model from xAI trained on the Colossus supercluster. Excels at real-time news synthesis, logical reasoning, and uncensored objective analysis."
        },
        "strengths": {
            "es": [
                "Acceso a información y tendencias en tiempo real",
                "Menor tasa de negativas por filtros de seguridad excesivos",
                "Comprensión contextual profunda"
            ],
            "en": [
                "Real-time news and event integration",
                "Lower refusal rate on complex technical prompts",
                "Deep contextual comprehension"
            ]
        },
        "promptingTips": {
            "style": {
                "es": "Preguntas directas, debates conceptuales y solicitudes de síntesis de eventos recientes.",
                "en": "Direct exploratory queries, conceptual debates, and real-time event synthesis."
            },
            "syntax": "Direct Exploratory Prompting",
            "samplePrompt": "Sintetiza los últimos avances en arquitecturas de modelos de razonamiento (DeepSeek-R1 vs OpenAI o3) y analiza su impacto en los costos de inferencia para startups de IA."
        },
        "docsUrl": "https://x.ai/"
    }
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
