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
