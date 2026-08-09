# 🔄 Handoff — Estado del Proyecto Promptometer

> **Instrucciones para el asistente AI:** Lee este archivo COMPLETO antes de hacer
> cualquier cambio. Contiene el estado actual del proyecto, las tareas pendientes,
> las decisiones de diseño tomadas y el contexto necesario para continuar el trabajo
> sin romper nada ni repetir tareas ya completadas.

---

## 🎯 Objetivo del Proyecto

**Promptometer** es un motor de evaluación multidimensional de prompts para LLMs,
publicado como paquete npm (`promptometer-core@1.0.0`) y como aplicación web
interactiva desplegada en Vercel.

### Repositorios

| Componente | Repositorio | Descripción |
|:---|:---|:---|
| **Motor Core** | [j0sp0nc3/promptometer](https://github.com/j0sp0nc3/promptometer) | Motor de análisis (JS + Python), publicado en npm |
| **App Web** | [j0sp0nc3/promptforge](https://github.com/j0sp0nc3/promptforge) | UI web con API serverless, desplegada en Vercel |

### URLs en Producción

- **Vercel:** https://promptforge-beta-ten.vercel.app/
- **npm:** https://www.npmjs.com/package/promptometer-core
- **Dominio pendiente:** `promptometer.is-a.dev` (PR abierto en is-a-dev/register)

### Autor

- **Nombre:** Jose Ponce
- **GitHub:** [j0sp0nc3](https://github.com/j0sp0nc3)
- **LinkedIn:** [josponce](https://www.linkedin.com/in/josponce)

---

## 🎨 Sistema de Diseño: Editorial Technical

| Token | Valor | Uso |
|:---|:---|:---|
| **Fondo** | `#F7F3EC` (Cream Paper) | Body background |
| **Tinta** | `#1A1612` (Warm Black) | Texto principal |
| **Acento** | `#C73E2D` (Vermilion) | Marca, botones, enlaces activos |
| **Tipografía Serif** | Fraunces | Títulos, logo |
| **Tipografía Mono** | IBM Plex Mono | Datos, scores, código |
| **Tipografía Sans** | Inter | Cuerpo de texto |
| **Logo SVG** | Medidor de calibración vermilion/crema | Con chevrons `< >` de tinta editorial |

> ⚠️ **NO usar** el tema viejo "Obsidian Studio" (yunque ámbar, fondo oscuro, glassmorphism).
> Todo debe seguir el estilo Editorial Technical.

---

## ✅ Tareas Completadas

- [x] Renombrar proyecto de PromptQuill → Promptometer (código, UI, repos)
- [x] Publicar `promptometer-core@1.0.0` en npm
- [x] Desplegar app web en Vercel con API serverless (`/api/analyze`, `/api/improve`, `/api/adversarial`)
- [x] Sistema de scoring multidimensional (8 dimensiones + pesos por tipo de prompt)
- [x] Internacionalización (i18n) completo ES/EN
- [x] Footer Open Source con atribución `j0sp0nc3`, licencia MIT, links a repos y perfil de LinkedIn (`josponce`)
- [x] Claves i18n del footer en ES y EN
- [x] Footer rediseñado (Editorial Technical): avatar circular de GitHub + bloque de marca (wordmark + tagline) + links con íconos SVG (GitHub, Motor, LinkedIn)
- [x] Favicon SVG vectorial de alta resolución alineado al logo de medidor de calibración
- [x] Logo SVG: medidor de calibración vermilion/crema (Editorial Technical)
- [x] Texto del logo: `Prompt<span>ometer</span>`
- [x] Fix scoring: prompts ultra-cortos (< 3 palabras como "Hola") → Grado F (~25/100)
- [x] Fix Vercel: `vercel.json` con builds estáticos explícitos para css/js y favicons
- [x] PR para dominio `promptometer.is-a.dev` (is-a-dev/register) con verificación TXT de Vercel
- [x] Seguritización de API: Autenticación por API Key privada (`x-api-key` / `Authorization: Bearer` configurada vía `PROMPTOMETER_API_KEY` en Vercel, 0 secretos en el código fuente), CORS restrictivo, Rate Limiting (30 req/min/IP), Límite de Payload (100 KB) y Headers OWASP.
- [x] Tests de estrés: 14/14 PASS
- [x] Footer rediseñado (Editorial Technical): avatar circular de GitHub + bloque de marca (wordmark + tagline) + links con íconos SVG (GitHub, Motor, LinkedIn)
- [x] **Hub de Conocimiento Fase 0 (esqueleto)**: nuevo tab "Aprender" con 4 sub-secciones (Glosario, Técnicas, Frameworks, Biblioteca). `App.loadPrompt()` expuesto. CSS `.learn-*` completo. `knowledge.js` creado (vacío, se rellena en fases 1-3). Biblioteca unificada renderiza los 12 templates + 34 anti-patrones + 15 best-practices + 13 tests adversariales existentes. i18n `learn.*` y `nav.learn` en ES/EN.
- [x] **Hub de Conocimiento Fase 1 (Glosario)**: 20 términos bilingües ES/EN en `Knowledge.glossary` (token, temperature, top-p, context window, system/user/assistant, embedding, vector store, fine-tuning, hallucination, grounding, stop sequence, max tokens, function calling, prompt chaining, few-shot/zero-shot, CoT, prompt injection, LLM-as-judge, in-context learning, delimiters). 14 con cross-refs a items existentes (AP###, BP###, tpl-*, adv.*). 8 categorías.
- [x] **Hub de Conocimiento Fase 2 (Técnicas)**: 10 técnicas en `Knowledge.techniques` — 6 nuevas (ReAct, Tree-of-Thought, Self-Consistency, Reflexion, Zero-shot, Metaprompting) con ejemplos Analizables, + 4 clásicas cross-linkadas (Few-shot, CoT, RAG, Role prompting) que ya están en el motor/rewriter. Todas bilingües ES/EN con crossRefs.
- [x] **Hub de Conocimiento Fase 3 (Frameworks)**: 4 frameworks en `Knowledge.frameworks` — RTF (Role-Task-Format), CRISPE (6 componentes), RACE (Role-Action-Context-Expectation), y la **anatomía XML de 7 secciones nativa de Promptometer** (documentada con cross-refs a BP001/002/003/004/006/010/015 y rewriter._restructure). Los 2 principales (RTF + XML nativo) tienen ejemplos Analizables.
- [x] **Hub de Conocimiento Fase 5 (Fix i18n rotas)**: 18 claves i18n que mostraban la key cruda ahora tienen texto real ES/EN: `promptType.{system,few-shot,task,creative,rag,tool-use,general}` (7), `analyzer.chainOfThought.{treeOfThought,reactTechnique,selfConsistency,reflexion}` (4), `analyzer.safety.{piiLeak,piiLeakSugg,assumesCapability,assumesCapabilitySugg,postCutoff,postCutoffSugg}` (6), `adversarialCategory.safety` (1). Paridad ES/EN global verificada (0 diferencias).
- [x] **Tema Novedoso "Cosmic Event Horizon / Singularity Precision" (Modo Oscuro Galáctico)**: Rediseño temático avanzado con fondos Deep Void (`#08090E`), anillo fotónico de acreción (`#FF9E00`), azul púlsar cyan (`#00E5FF`) y tipografías Orbitron/Space Grotesk & JetBrains Mono. Incluye **Selector de Temas (Theme Switcher)** `#theme-toggle-btn` en la cabecera para cambiar en vivo entre Modo Cósmico (predeterminado) y Modo Editorial Clásico (crema/vermilion) con persistencia en localStorage y 22/22 tests PASS.
- [x] **Tutorial Interactivo Oficial de Anthropic en Referencias**: Incorporados los enlaces a Anthropic Interactive Prompt Engineering Tutorial (GitHub `anthropics/prompt-eng-interactive-tutorial` y Google Sheets ejecutable de 9 capítulos) en la pestaña **Radar IA > Referencias & Guías** (`js/knowledge.js`).
- [x] **Optimización Responsiva para Teléfonos/Móviles**: Corrección completa del layout en pantallas pequeñas (< 850px y < 480px). Sistema de Grid de 2 filas para la cabecera (Fila 1: Logo + Controles de tema e idioma compactos; Fila 2: Menú navegable horizontal con desplazamiento suave sin scrollbar visible y máscara de desvanecimiento `mask-image`), reposicionamiento adaptativo de la barra **Radar IA en Vivo** (`#news-ticker-bar`) y ajuste dinámico de `padding-top` en `.app-main` para evitar superposiciones.
- [x] **Footer Responsivo para Móviles**: Footer rediseñado para pantallas < 850px — apilado vertical con centrado, autor con avatar a la izquierda, bloque de marca centrado y 4 links en grid 2×2 con estilos de botón para mayor usabilidad táctil.
- [x] **Radar de Creadores Expandido (20 Creadores)**: Añadidos 8 nuevos creadores al Radar: *Yann LeCun* (Meta/Turing), *François Chollet* (Keras/ARC-AGI), *Andrew Ng* (DeepLearning.AI/The Batch), *Alex Albert* (Anthropic DevRel), *Jerry Liu* (LlamaIndex), *Matt Shumer* (HyperWrite/Agentes), *Ben Hylak* (Raindrop/Observabilidad), *Matt Wolfe* (Future Tools/YouTube). Cada uno con múltiples plataformas: X/Twitter, LinkedIn, YouTube, Newsletter, GitHub y/o Blog. Total: 20 creadores con 5 categorías (prompting, architecture, agents, security, evals).
- [x] **Fix Motor de Scoring (Tipo `extraction` + Signals)**:  Cuatro bugs de detección de señales corregidos en `js/signals.js` y `promptometer-core.js`: (1) `errorHandling` ahora detecta `<manejo_errores>`, "Si el texto no contiene" y "responde exactamente con"; (2) `antiHallucination` detecta "cita únicamente datos del texto", "no asumas" y "datos no especificados"; (3) `scopeLimit` detecta "ÚNICAMENTE", "no incluyas fuera del bloque"; (4) Nuevo tipo de prompt `extraction` con tabla de pesos optimizada (outputFormat 20%, robustness 18%, chainOfThought 2%). El prompt top-1 sube de 66 → 74/100.

---

## 🔄 Hub de Conocimiento — Progreso por fases

- [x] **Fase 0**: Esqueleto (App.loadPrompt + nav + HTML/CSS + knowledge.js + library unificada)
- [x] **Fase 1**: Glosario (20 términos bilingüe en `knowledge.js`) ✅
- [x] **Fase 2**: Técnicas (6 nuevas + 4 cross-link con ejemplos Analizables) ✅
- [x] **Fase 3**: Frameworks (RTF, CRISPE, RACE, anatomía XML nativa) ✅
- [x] **Fase 4**: Biblioteca unificada (ya implementada en Fase 0) ✅
- [x] **Fase 5**: Fix 18 claves i18n rotas (promptType.*, técnicas modernas, safety) ✅
- [x] **Biblioteca con detalle expandible**: los anti-patrones (34), buenas prácticas (15) y tests adversariales (13) ahora son acordeones `<details>` expandibles que muestran descripción, dimensión y sugerencia (todo desde i18n existente, sin duplicar contenido).

> ✅ **HUB DE CONOCIMIENTO COMPLETO.** 30 entradas nuevas (20 glosario + 6 técnicas + 4 frameworks),
> bilingües ES/EN, + biblioteca unificada de los 12 templates + 34 anti-patrones + 15 best-practices
> + 13 tests adversariales existentes (con detalle expandible). + 18 bugs de i18n arreglados.

- [x] **Hub de Conocimiento Búsqueda interactiva**: Barra de búsqueda en tiempo real `#learn-search-input` para filtrar conceptos del glosario, técnicas, frameworks, templates, anti-patrones y tests adversariales con botón de borrado rápido e i18n ES/EN.
- [x] **Técnicas & Frameworks 2026**: Adición de 3 técnicas de vanguardia (*Chain of Verification - CoVe, Skeleton-of-Thought - SoT, Hierarchical CoT - Hi-CoT*) y 2 frameworks de arquitectura (*CO-STAR, Bento-Box Modular Architecture*) en `js/knowledge.js`.
- [x] **Pestaña Principal Radar IA (`#nav-radar` & `#view-radar`)**: Promovido del sub-menú de Aprender a pestaña principal en la barra superior de navegación. Reúne en un solo lugar destacado los 12 Creadores AI y las 11 Referencias & Guías oficiales con pestañas internas y modal de sugerencia comunitaria.
# 🔄 Handoff — Estado del Proyecto Promptometer

> **Instrucciones para el asistente AI:** Lee este archivo COMPLETO antes de hacer
> cualquier cambio. Contiene el estado actual del proyecto, las tareas pendientes,
> las decisiones de diseño tomadas y el contexto necesario para continuar el trabajo
> sin romper nada ni repetir tareas ya completadas.

---

## 🎯 Objetivo del Proyecto

**Promptometer** es un motor de evaluación multidimensional de prompts para LLMs,
publicado como paquete npm (`promptometer-core@1.0.0`) y como aplicación web
interactiva desplegada en Vercel.

### Repositorios

| Componente | Repositorio | Descripción |
|:---|:---|:---|
| **Motor Core** | [j0sp0nc3/promptometer](https://github.com/j0sp0nc3/promptometer) | Motor de análisis (JS + Python), publicado en npm |
| **App Web** | [j0sp0nc3/promptforge](https://github.com/j0sp0nc3/promptforge) | UI web con API serverless, desplegada en Vercel |

### URLs en Producción

- **Vercel:** https://promptforge-beta-ten.vercel.app/
- **npm:** https://www.npmjs.com/package/promptometer-core
- **Dominio:** [https://promptometer.tech](https://promptometer.tech)

### Autor

- **Nombre:** Jose Ponce
- **GitHub:** [j0sp0nc3](https://github.com/j0sp0nc3)
- **LinkedIn:** [josponce](https://www.linkedin.com/in/josponce)

---

## 🎨 Sistema de Diseño: Editorial Technical

| Token | Valor | Uso |
|:---|:---|:---|
| **Fondo** | `#F7F3EC` (Cream Paper) | Body background |
| **Tinta** | `#1A1612` (Warm Black) | Texto principal |
| **Acento** | `#C73E2D` (Vermilion) | Marca, botones, enlaces activos |
| **Tipografía Serif** | Fraunces | Títulos, logo |
| **Tipografía Mono** | IBM Plex Mono | Datos, scores, código |
| **Tipografía Sans** | Inter | Cuerpo de texto |
| **Logo SVG** | Medidor de calibración vermilion/crema | Con chevrons `< >` de tinta editorial |

> ⚠️ **NO usar** el tema viejo "Obsidian Studio" (yunque ámbar, fondo oscuro, glassmorphism).
> Todo debe seguir el estilo Editorial Technical.

---

## ✅ Tareas Completadas

- [x] Renombrar proyecto de PromptQuill → Promptometer (código, UI, repos)
- [x] Publicar `promptometer-core@1.0.0` en npm
- [x] Desplegar app web en Vercel con API serverless (`/api/analyze`, `/api/improve`, `/api/adversarial`)
- [x] Sistema de scoring multidimensional (8 dimensiones + pesos por tipo de prompt)
- [x] Internacionalización (i18n) completo ES/EN
- [x] Footer Open Source con atribución `j0sp0nc3`, licencia MIT, links a repos y perfil de LinkedIn (`josponce`)
- [x] Claves i18n del footer en ES y EN
- [x] Footer rediseñado (Editorial Technical): avatar circular de GitHub + bloque de marca (wordmark + tagline) + links con íconos SVG (GitHub, Motor, LinkedIn)
- [x] Favicon SVG vectorial de alta resolución alineado al logo de medidor de calibración
- [x] Logo SVG: medidor de calibración vermilion/crema (Editorial Technical)
- [x] Texto del logo: `Prompt<span>ometer</span>`
- [x] Fix scoring: prompts ultra-cortos (< 3 palabras como "Hola") → Grado F (~25/100)
- [x] Fix Vercel: `vercel.json` con builds estáticos explícitos para css/js y favicons
- [x] PR para dominio `promptometer.is-a.dev` (is-a-dev/register) con verificación TXT de Vercel
- [x] Seguritización de API: Autenticación por API Key privada (`x-api-key` / `Authorization: Bearer` configurada vía `PROMPTOMETER_API_KEY` en Vercel, 0 secretos en el código fuente), CORS restrictivo, Rate Limiting (30 req/min/IP), Límite de Payload (100 KB) y Headers OWASP.
- [x] Tests de estrés: 14/14 PASS
- [x] Footer rediseñado (Editorial Technical): avatar circular de GitHub + bloque de marca (wordmark + tagline) + links con íconos SVG (GitHub, Motor, LinkedIn)
- [x] **Hub de Conocimiento Fase 0 (esqueleto)**: nuevo tab "Aprender" con 4 sub-secciones (Glosario, Técnicas, Frameworks, Biblioteca). `App.loadPrompt()` expuesto. CSS `.learn-*` completo. `knowledge.js` creado (vacío, se rellena en fases 1-3). Biblioteca unificada renderiza los 12 templates + 34 anti-patrones + 15 best-practices + 13 tests adversariales existentes. i18n `learn.*` y `nav.learn` en ES/EN.
- [x] **Hub de Conocimiento Fase 1 (Glosario)**: 20 términos bilingües ES/EN en `Knowledge.glossary` (token, temperature, top-p, context window, system/user/assistant, embedding, vector store, fine-tuning, hallucination, grounding, stop sequence, max tokens, function calling, prompt chaining, few-shot/zero-shot, CoT, prompt injection, LLM-as-judge, in-context learning, delimiters). 14 con cross-refs a items existentes (AP###, BP###, tpl-*, adv.*). 8 categorías.
- [x] **Hub de Conocimiento Fase 2 (Técnicas)**: 10 técnicas en `Knowledge.techniques` — 6 nuevas (ReAct, Tree-of-Thought, Self-Consistency, Reflexion, Zero-shot, Metaprompting) con ejemplos Analizables, + 4 clásicas cross-linkadas (Few-shot, CoT, RAG, Role prompting) que ya están en el motor/rewriter. Todas bilingües ES/EN con crossRefs.
- [x] **Hub de Conocimiento Fase 3 (Frameworks)**: 4 frameworks en `Knowledge.frameworks` — RTF (Role-Task-Format), CRISPE (6 componentes), RACE (Role-Action-Context-Expectation), y la **anatomía XML de 7 secciones nativa de Promptometer** (documentada con cross-refs a BP001/002/003/004/006/010/015 y rewriter._restructure). Los 2 principales (RTF + XML nativo) tienen ejemplos Analizables.
- [x] **Hub de Conocimiento Fase 5 (Fix i18n rotas)**: 18 claves i18n que mostraban la key cruda ahora tienen texto real ES/EN: `promptType.{system,few-shot,task,creative,rag,tool-use,general}` (7), `analyzer.chainOfThought.{treeOfThought,reactTechnique,selfConsistency,reflexion}` (4), `analyzer.safety.{piiLeak,piiLeakSugg,assumesCapability,assumesCapabilitySugg,postCutoff,postCutoffSugg}` (6), `adversarialCategory.safety` (1). Paridad ES/EN global verificada (0 diferencias).
- [x] **Tema Novedoso "Cosmic Event Horizon / Singularity Precision" (Modo Oscuro Galáctico)**: Rediseño temático avanzado con fondos Deep Void (`#08090E`), anillo fotónico de acreción (`#FF9E00`), azul púlsar cyan (`#00E5FF`) y tipografías Orbitron/Space Grotesk & JetBrains Mono. Incluye **Selector de Temas (Theme Switcher)** `#theme-toggle-btn` en la cabecera para cambiar en vivo entre Modo Cósmico (predeterminado) y Modo Editorial Clásico (crema/vermilion) con persistencia en localStorage y 22/22 tests PASS.
- [x] **Tutorial Interactivo Oficial de Anthropic en Referencias**: Incorporados los enlaces a Anthropic Interactive Prompt Engineering Tutorial (GitHub `anthropics/prompt-eng-interactive-tutorial` y Google Sheets ejecutable de 9 capítulos) en la pestaña **Radar IA > Referencias & Guías** (`js/knowledge.js`).
- [x] **Optimización Responsiva para Teléfonos/Móviles**: Corrección completa del layout en pantallas pequeñas (< 850px y < 480px). Sistema de Grid de 2 filas para la cabecera (Fila 1: Logo + Controles de tema e idioma compactos; Fila 2: Menú navegable horizontal con desplazamiento suave sin scrollbar visible y máscara de desvanecimiento `mask-image`), reposicionamiento adaptativo de la barra **Radar IA en Vivo** (`#news-ticker-bar`) y ajuste dinámico de `padding-top` en `.app-main` para evitar superposiciones.
- [x] **Footer Responsivo para Móviles**: Footer rediseñado para pantallas < 850px — apilado vertical con centrado, autor con avatar a la izquierda, bloque de marca centrado y 4 links en grid 2×2 con estilos de botón para mayor usabilidad táctil.
- [x] **Radar de Creadores Expandido (20 Creadores)**: Añadidos 8 nuevos creadores al Radar: *Yann LeCun* (Meta/Turing), *François Chollet* (Keras/ARC-AGI), *Andrew Ng* (DeepLearning.AI/The Batch), *Alex Albert* (Anthropic DevRel), *Jerry Liu* (LlamaIndex), *Matt Shumer* (HyperWrite/Agentes), *Ben Hylak* (Raindrop/Observabilidad), *Matt Wolfe* (Future Tools/YouTube). Cada uno con múltiples plataformas: X/Twitter, LinkedIn, YouTube, Newsletter, GitHub y/o Blog. Total: 20 creadores con 5 categorías (prompting, architecture, agents, security, evals).
- [x] **Fix Motor de Scoring (Tipo `extraction` + Signals)**:  Cuatro bugs de detección de señales corregidos en `js/signals.js` y `promptometer-core.js`: (1) `errorHandling` ahora detecta `<manejo_errores>`, "Si el texto no contiene" y "responde exactamente con"; (2) `antiHallucination` detecta "cita únicamente datos del texto", "no asumas" y "datos no especificados"; (3) `scopeLimit` detecta "ÚNICAMENTE", "no incluyas fuera del bloque"; (4) Nuevo tipo de prompt `extraction` con tabla de pesos optimizada (outputFormat 20%, robustness 18%, chainOfThought 2%). El prompt top-1 sube de 66 → 74/100.
- [x] **Módulo de Moderación de Contenido (`api/moderation.js`) & Persistencia Global Upstash Redis (`api/index.js`)**: Filtro de tres capas (palabras malsonantes ES/EN, patrones maliciosos de inyección/XSS y anti-spam por IP/deduplicación hash) con almacenamiento persistente opcional en Upstash Redis (`UPSTASH_REDIS_REST_URL`).
- [x] **Normalización de Categorías (`js/leaderboard.js`)**: Espacio de nombres canónico de categorías (`general`, `código`, `agentes`, `RAG`, `extracción`, `evaluación`, `marketing`, `NLP`, `traducción`, `salud`) y métodos `getByCategory()` y `normalizeCategory()`.
- [x] **Fix Renderizado Inmediato Top 10 (`js/app.js`)**: Aplicado el patrón *Stale-While-Revalidate* en `renderLeaderboardView()`. Los 10 prompts curados iniciales se renderizan a 0ms (sin espera de red) y luego se actualizan asíncronamente cuando responde la API.
- [x] **Fix 401 Unauthorized en `/api/leaderboard`**: Ajustada la verificación de autenticación en `api/index.js` y `server.js` para permitir peticiones `GET` del mismo origen (que no envían header `Origin` explícito en navegadores) e indicar acceso público al endpoint del Top 10.
- [x] **Fix SyntaxError en `js/leaderboard.js`**: Escapadas las comillas invertidas unescaped (\`npm run build\`) en el prompt semilla #7 que impedían la carga del script en el navegador.
- [x] **Ranking Top 10 / Pabellón de la Fama (`js/leaderboard.js` & `/api/leaderboard`)**: Pestaña principal de navegación **Top 10** con clasificación dinámica de los 10 mejores prompts (94-99/100). Incluye modal de publicación *"Publicar mi Prompt Actual"*, medallas de oro/plata/bronce (`#1 🥇`, `#2 🥈`, `#3 🥉`), botones para *"Analizar y Probar"* y *"Copiar Prompt"*, sincronización global en tiempo real mediante API serverless `/api/leaderboard` (sin registro) y generación de enlaces de compartición directa (`?p=base64`). 10 prompts curados de élite incluidos de entrada.
- [x] **Dominio Producción Configurado (`promptometer.tech`)**: Dominio de producción registrado en Spaceship.com y vinculado exitosamente a Vercel con registros A (`216.198.79.1`) y CNAME (`ab5e3e981cf6eed7.vercel-dns-017.com`). Redirección automática 307 activa para `www.promptometer.tech` → `https://promptometer.tech/`.
- [x] **Integración Total de la Interfaz con los Mockups Conceptual & Comparison (Mockups 1 & 2)**:
  - **Workbench Comparativo de Doble Tarjeta (Mockup 2)**: Panel principal transformado a visualización en paralelo con Tarjeta Izquierda `Unoptimized Prompt` (puntuación `38/100` en rojo, pills de advertencia `[Vague Goal]`, `[No Constraints]`) vs Tarjeta Derecha `Promptometer Calibrated` (puntuación `95/100` en verde esmeralda, resaltado translúcido neón por etiquetas XML `<role>`, `<task>`, `<output_format>`, `<constraints>` y botones de acción rápida).
  - **Escenario Orbital 8D Espectral Central (Mockup 1)**: Diagrama SVG concéntrico de órbitas vectoriales con caja central `PROMPT SCORE: 88.5`, nodos geométricos en diamante para cada dimensión (`Clarity`, `Role`, `Context`, `Constraints`, `Output`, `Safety`, `CoT`, `Robustness`) y rayos de luz conectores.
  - **Grid Horizontal de Tarjetas de Dimensión Espectral**: Fila inferior de 8 tarjetas de dimensión con destellos de color pastel en el borde superior y métricas decimales de alta precisión (`8.9`, `9.2`, `8.4`, `9.7`).
- [x] **Optimización de SEO & Visibilidad para Inteligencia Artificial (AI Crawlers)**:
  - **Especificación Machine-Readable `llms.txt` y `llms-full.txt`**: Estándar Answer.ai / Jeremy Howard implementado en `/llms.txt` y `/llms-full.txt` para que crawlers de IA (ChatGPT Search, Claude, Perplexity, Gemini, Copilot) entiendan el motor de 8D scoring, API serverless y paquete npm.
  - **`robots.txt`**: Permisos explícitos para motores de búsqueda tradicionales y bots de IA (GPTBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot-Extended, etc.).
  - **`sitemap.xml`**: Mapa del sitio XML indexable con soporte hreflang ES/EN.
  - **Estructura JSON-LD (Schema.org)**: Schemas `WebApplication`, `SoftwareSourceCode` y `FAQPage` integrados en `<head>` de `index.html`.
  - **OpenGraph & Twitter Cards**: Banner vectorial `og-image.svg` (1200x630px) y metadatos sociales para vista previa en Twitter/X, LinkedIn, Slack y Discord.
  - **Meta URL Canónica**: `<link rel="canonical" href="https://promptometer.tech/">`.
  - **PWA Manifest**: Metadata `/manifest.json` para instalabilidad PWA.
  - **Actualización `vercel.json`**: Rutas de compilación estática explícitas para todos los activos raíz (`robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, `manifest.json`, `og-image.svg`).

---

## 📝 Tareas Pendientes

- [ ] (Opcional) Lab interactivo transformador (roadmap — requiere técnicas que el rewriter NO cubre)

---

## 🚫 Decisiones de Diseño (NO cambiar sin consultar)

1. **Nombre de marca:** Promptometer (no PromptQuill, no PromptForge)
2. **Dominio principal:** `https://promptometer.tech` (con alias `www.promptometer.tech` -> 307 redirect)
3. **Tema visual:** Cosmic Event Horizon (Predeterminado: Oscuro Galáctico / Agujero negro) con Selector de Modo Dual a Editorial Classic.
4. **Motor de scoring:** Base 50 por dimensión, penalización fuerte para < 3 palabras
5. **i18n:** Español como idioma principal, inglés como secundario
6. **Despliegue:** Vercel (free tier) con `@vercel/node` para API y `@vercel/static` para assets
7. **Paquete npm:** `promptometer-core` (no `promptforge-core`)

---

## 📁 Estructura de Archivos Clave

```
promptforge/                    ← App Web (Vercel)
├── index.html                  ← SPA principal con layout fiel a Mockups 1 & 2, Schema JSON-LD y OpenGraph
├── favicon.svg                 ← Favicon vectorial de alta resolución
├── og-image.svg                ← Banner SVG de vista previa social OpenGraph (1200x630)
├── robots.txt                  ← Reglas para buscadores y crawlers de IA
├── sitemap.xml                 ← Mapa del sitio XML
├── llms.txt                    ← Especificación para IA (Estándar Answer.ai / Jeremy Howard)
├── llms-full.txt               ← Documentación extendida para modelos de IA
├── manifest.json               ← Manifest PWA
├── css/index.css               ← Design system Editorial Technical & Cosmic (Glassmorphism, Dual Cards & Orbital Grid)
├── js/
│   ├── app.js                  ← Controlador principal de UI (incluye Constelación 8D Orbital SVG & Mockups 1/2 Renderers)
│   ├── analyzer.js             ← Motor de análisis (8 dimensiones)
│   ├── signals.js              ← Extracción de señales compartidas
│   ├── patterns.js             ← Detección de anti-patrones (34 APs / 15 BPs)
│   ├── i18n.js                 ← Diccionarios ES/EN + actualización dinámica de meta tags
│   ├── knowledge.js            ← Hub de conocimiento (20 términos, 13 técnicas, 6 frameworks, 13 refs, 20 creadores)
│   ├── leaderboard.js          ← Módulo de ranking Top 10 y persistencia
│   ├── rewriter.js             ← Mejora automática de prompts
│   └── export.js               ← Exportación JSON, Markdown, Clipboard y URL
├── api/index.js                ← API serverless desplegada en Vercel (incluye /api/leaderboard y /api/suggest-creator)
├── server.js                   ← Servidor local de desarrollo
├── vercel.json                 ← Configuración de despliegue Vercel (rutas estáticas)
├── test_edge_cases.js          ← Suite de 14 tests de estrés (PASS)
└── package.json                ← Dependencia: promptometer-core@^1.0.0
```

---

## 🔄 Última Actualización

- **Fecha:** 2026-08-09
- **Rama activa de desarrollo:** `dev` (`origin/dev`)
- **Último commit promptforge:** `73dfd14` (fix(theme): dynamic SVG constellation node label color update and CSS overrides for Modo Luna 🌙)
- **Último commit promptometer:** `5662a93` (fix(core): sync signal parity)
- **Sesión con:** Antigravity (Gemini 3.6 Flash) — **Creación y Activación de Rama `dev`**
- **Estado:** 22/22 tests en PASS. Paridad ES/EN verificada. Desplegado y funcionando al 100% en Vercel y `https://promptometer.tech/`.

> 📌 **RESUMEN DE TRABAJO COMPLETADO (esta sesión):**
> - **Aclaración y Ajuste de Badges de Scoring (`--/100`)**: Se reemplazaron los números estáticos confundidores (`38/100` y `95/100`) en estado inicial por placeholders neutros `--/100` que se actualizan dinámicamente solo tras ejecutar el análisis del prompt ingresado por el usuario.
> - **Estilizado Completo del Selector de Idioma (`.lang-switcher`)**: Se implementaron reglas CSS integradas para el grupo de botones `ES / EN` con cápsula redondeada, transparencias de cristal en **Modo Black Hole 🕳️** y acabado crema/vermellón en **Modo Luna 🌙**.
> - **Temas Visuales Rebrand**: Modo Editorial → **Modo Luna 🌙** / Modo Cósmico → **Modo Black Hole 🕳️** en i18n (ES/EN), UI del botón de navegación y `app.js`.
> - **Rediseño Fiel a los Mockups 1 & 2**:
>   - **Mockup 2 (Dual Card Prompt Comparison Workbench)**: Tarjetas enfrentadas `Unoptimized Prompt` (roja, botones Pegar/Limpiar, pills de advertencia) vs `Promptometer Calibrated` (verde esmeralda, pills de etiquetas XML color-coded y chips interactivos `⚡ Shorten`, `🧠 Add CoT`, `📐 Enforce JSON`, `🛡️ Guardrails`, `📋 Copy`, `✨ Apply`).
>   - **Mockup 1 (Grand 8D Orbital Constellation Stage)**: Diagrama SVG de órbitas astronómicas concéntricas con caja central `PROMPT SCORE: 88.5` y nodos geométricos en diamante.
>   - **Fila Inferior de 8D Dimensiones**: Tarjetas con badges decimales (`Clarity 8.9`, `Role 9.2`, `Context 7.6`, `Constraints 8.4`, `Safety 9.7`, `Output 8.8`).
> - **Restauración Total de Funcionalidades & 5 Pestañas Interactivas**: Dimensiones, Radar, Anti-patrones, Adversarial y Mejora.
> - **Pruebas de Estrés**: 22/22 PASS en `test_edge_cases.js`.
