# Especificación de Producto — Promptometer

## 1. Visión y Propósito
**Promptometer** es un motor de evaluación y calibración multidimensional de prompts para LLMs, diseñado bajo el estándar *Editorial Technical* y *Cosmic Event Horizon*. Funciona tanto como biblioteca empaquetada (`promptometer-core` en npm y Python) como aplicación web interactiva de alto rendimiento desplegada en Vercel (`promptometer.tech`).

El objetivo central es transformar la formulación empírica y descuidada de prompts en una disciplina rigurosa, auditable, cuantitativa y optimizada para modelos de frontera y entornos de producción.

## 2. Problema a Resolver
- **Contexto:** La mayoría de los desarrolladores y usuarios de LLMs escriben prompts intuitivos carentes de restricciones formales, roles declarados, contratos de herramientas o defensas contra inyecciones y fuga de contexto.
- **Puntos de dolor:** Alucinaciones frecuentes, respuestas con formato inconsistente, vulnerabilidades de fuga de System Prompt (OWASP LLM07), baja eficiencia de tokens y falta de métricas objetivas para saber si un prompt mejoró o empeoró.
- **Resultado deseado:** Evaluación instantánea en 8 dimensiones de calidad con puntaje global (0-100) y nota (A+ a F), detección automática de arquetipos de dominio, identificación de brechas de contexto, recomendaciones accionables e inyección de bloques XML canónicos en un clic.

## 3. Actores y Usuarios
- **Prompt Engineers y Desarrolladores:** Diseñan prompts de producción para RAG, agentes, extracción de datos y razonamiento estructurado.
- **Investigadores y Creadores de IA:** Evalúan técnicas avanzadas (CoVe, ReAct, Hi-CoT, MCP) y comparan benchmarks de modelos frontera.
- **Sistemas Externos y APIs:** 
  - Vercel Serverless Functions (`/api/analyze`, `/api/improve`, `/api/adversarial`, `/api/analyze-intent`, `/api/leaderboard`, `/api/ai-news`, `/api/models`).
  - Vercel KV / Upstash Redis (persistencia del leaderboard y rate limiting).
  - Algolia (Hacker News) y arXiv API (feed de noticias e investigación en tiempo real).
  - OpenRouter / LLM-as-a-Judge (telemetría y diagnóstico profundo opcional).

## 4. Casos de Uso Core
1. **Calibración y Evaluación Multidimensional (Workbench):**
   - **Entrada:** Texto del prompt + objetivo declarado opcional (`coding`, `reasoning`, `json_schema`, `safety_rag`, `creative`, `general`).
   - **Procesamiento:** Extracción de señales léxicas y estructurales (`signals.js`), clasificación en 8 arquetipos de dominio (`domain-analyzer.js`), cálculo de notas base e índices de penalización/bonificación en 8 dimensiones (`analyzer.js`), escaneo de anti-patrones y buenas prácticas (`patterns.js`), y verificación adversarial (`adversarial.js`).
   - **Salida:** Score general (0-100), nota en letra (A+ a F), desglose por dimensión, constelación orbital 3D interactiva en Three.js (`constellation3d.js`), y chips de inyección de bloques XML (`rewriter.js`).
2. **Diagnóstico Asistido y Enriquecimiento de Contexto:**
   - Detección de brechas en 7 bloques XML canónicos (`<system_role>`, `<objective>`, `<context>`, `<requirements>`, `<output_format>`, `<examples>`, `<error_handling>`).
   - Generación de sugerencias quirúrgicas y justificación de arquitectura.
3. **Seguridad y Resiliencia (OWASP LLM07):**
   - Detección de ataques de extracción de System Prompt (`systemPromptExtraction`).
   - Penalización de fugas y evaluación contra 14 vectores adversariales.
4. **Hub de Conocimiento y Benchmarking de Modelos:**
   - 24 términos técnicos, 17 técnicas modernas de prompting (MCP, Test-Time Compute, Andrew Ng Agentic Patterns), 6 frameworks arquitectónicos.
   - Directorio Top 10 modelos frontera y open-weights con telemetría en vivo, precios por 1M tokens y directrices canónicas de prompting.
5. **Feed de Noticias e Innovación en Vivo:**
   - Sincronización en tiempo real de noticias de Hacker News y preprints de arXiv (cs.AI / cs.CL).

## 5. Arquitectura y Flujo de Datos
```text
[ Usuario / Input de Prompt ]
             │
             ▼
    [ js/signals.js ] ── (Extracción de señales y tokens)
             │
             ├──► [ js/domain-analyzer.js ] ── (Inferencia de 8 Arquetipos)
             │
             ├──► [ js/patterns.js ] ── (35 Anti-patrones / 16 Best Practices)
             │
             ├──► [ js/adversarial.js ] ── (14 Tests de estrés y seguridad)
             │
             ▼
    [ js/analyzer.js ] ── (Ponderación 8D calibrada por objetivo)
             │
             ├──► [ js/constellation3d.js ] (Render 3D WebGL Three.js)
             ├──► [ js/rewriter.js ] (Chips de inyección XML canónicos)
             └──► [ js/leaderboard.js ] (Envío opcional a Top 10)
```

## 6. Fuera de Alcance (Anti-alcance)
- Ejecución directa de código de usuario en el servidor o sandbox remoto.
- Almacenamiento persistente invasivo de prompts sin consentimiento explícito del usuario.
- Dependencia obligatoria de API Keys comerciales para la funcionalidad core (todo el análisis opera 100% en local client-side a latencia cero y costo $0).
- Diseños genéricos con glassmorphism excesivo, neon glows o dark mode descontextualizado; se preserva estrictamente el sistema *Editorial Technical* y *Cosmic Event Horizon*.

## 7. Criterios de Aceptación Globales
- [x] Suite completa de pruebas unitarias y de estrés pasando al 100% (`node test_edge_cases.js` -> 27/27 PASS).
- [x] Paridad estricta entre diccionarios i18n (`es` y `en`) sin claves faltantes ni textos duros en interfaz.
- [x] Soporte responsivo sin rotura de layouts desde pantallas móviles (360px) hasta monitores ultra-wide.
- [x] Zero-warning en compilación de assets y cumplimiento de cabeceras de seguridad OWASP en endpoints serverless.
