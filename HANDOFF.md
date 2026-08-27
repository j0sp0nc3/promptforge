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

### URLs y Ambientes de Despliegue

| Ambiente | Rama Git | URL | Proxy Cloudflare | Propósito |
|:---------|:---------|:----|:-----------------|:----------|
| **Desarrollo** | `dev` | https://promptometer.vercel.app/ | — | Preview de cada push a dev |
| **Producción Web** | `main` | https://promptometer.tech/ | Nube NARANJA (proxy ON) | URL pública, web protegida por CF |
| **Producción API** | `main` | https://api.promptometer.tech/ | Nube GRIS (DNS only) | API directa a Vercel, IPs reales |

- **Arquitectura API separada (EXCLUSIVO PRODUCCIÓN):** El subdominio `api.promptometer.tech` aplica **únicamente en Producción (`main`)**. En Desarrollo (`dev` / `localhost` / `promptometer.vercel.app`), las llamadas al API operan en mismo origen (`/api/*`), sin requerir subdominio ni variables adicionales. `js/api-config.js` detecta automáticamente el hostname (`promptometer.tech`) para apuntar a `https://api.promptometer.tech`, dejando la base vacía en `dev`.
- **Setup Cloudflare/Vercel pendiente (para lanzamiento a producción):** Crear registro `api` CNAME → `cname.vercel-dns.com` en nube gris (DNS-only); añadir `api.promptometer.tech` en Vercel → Settings → Domains.
- **Enrutamiento por Host en Producción:** Toda solicitud dirigida al host `api.promptometer.tech` (incluyendo la raíz `/`, `/docs`, `/api` y subrutas) enruta directamente a `/api/index.js` retornando respuestas JSON oficiales, manteniendo la Web UI (`index.html`) limpia en el dominio principal `promptometer.tech`.
- **Flujo:** commit en `dev` → verificar en `promptometer.vercel.app` → merge `dev`→`main` → live en `promptometer.tech`

### ⚙️ Especificación de Variables de Entorno (Vercel & Local)

| Variable de Entorno | Entornos | ¿Requerida? | Comportamiento AL TENER la variable | Comportamiento SIN la variable (Fallback) |
| :--- | :--- | :---: | :--- | :--- |
| **`STORAGE_KV_REST_API_URL`**<br>*(o `UPSTASH_REDIS_REST_URL` / `KV_REST_API_URL`)* | Production, Preview | ❌ Opcional | Leaderboard y filtro anti-spam persisten globalmente en Vercel KV / Upstash Redis. | Degrada a almacenamiento en memoria local de la función serverless. |
| **`STORAGE_KV_REST_API_TOKEN`**<br>*(o `UPSTASH_REDIS_REST_TOKEN` / `KV_REST_API_TOKEN`)* | Production, Preview | ❌ Opcional | Token de autenticación Bearer para escribir y leer en Vercel KV / Redis. | Conexión Redis desactivada; fallback automático a memoria. |
| **`PROMPTOMETER_API_KEY`** | Production | ❌ Opcional | Exige encabezado `x-api-key` / `Bearer` para acceder a los endpoints Serverless (`401 Unauthorized` si falla). | API opera de forma pública abierta (ideal para demo web sin autenticación). |
| **`OPENAI_API_KEY`** / **`GROQ_API_KEY`** / **`GEMINI_API_KEY`** | Production, Dev | ❌ Opcional | Habilita inferencia en vivo con LLM-as-a-Judge en el endpoint `/api/analyze-intent`. | Degrada automáticamente al sintetizador heurístico local (`DomainAnalyzer.synthesizeLocal`) a costo $0 y latencia 0. |
| **`PORT`** | Local Dev | ❌ Opcional | Define el puerto TCP de `server.js`. | Utiliza el puerto por defecto `3001`. |

### Autor

- **Nombre:** Jose Ponce
- **GitHub:** [j0sp0nc3](https://github.com/j0sp0nc3)
- **LinkedIn:** [josponce](https://www.linkedin.com/in/josponce)

---

## 🎨 Sistema de Diseño: Editorial Technical & Cosmic Event Horizon

| Token | Valor | Uso |
|:---|:---|:---|
| **Fondo Editorial** | `#F7F3EC` (Cream Paper) | Body background (Modo Clásico) |
| **Fondo Cósmico** | `#08090E` (Deep Space Void) | Body background (Modo Galáctico por defecto) |
| **Tinta Editorial** | `#1A1612` (Warm Black) | Texto principal |
| **Acento** | `#C73E2D` (Vermilion) / `#FF9E00` (Photon Ring) | Marca, botones, enlaces activos |
| **Tipografía Serif/Display** | Fraunces / Space Grotesk | Títulos, logo |
| **Tipografía Mono** | IBM Plex Mono / JetBrains Mono | Datos, scores, código |
| **Tipografía Sans** | Inter | Cuerpo de texto |
| **Selector de Tema** | `#theme-toggle-btn` | Conmutador en tiempo real entre Modo Galáctico y Editorial Clásico |

---

## ✅ Tareas Completadas

- [x] Renombrar proyecto de PromptQuill → Promptometer (código, UI, repos)
- [x] Publicar `promptometer-core@1.0.0` en npm
- [x] Desplegar app web en Vercel con API serverless (`/api/analyze`, `/api/improve`, `/api/adversarial`)
- [x] Sistema de scoring multidimensional (8 dimensiones + pesos por tipo de prompt)
- [x] Internacionalización (i18n) completo ES/EN
- [x] Footer Open Source con atribución `j0sp0nc3`, licencia MIT, links a repos y perfil de LinkedIn (`josponce`)
- [x] Footer rediseñado (Editorial Technical): avatar circular de GitHub + bloque de marca + links con íconos SVG
- [x] Favicon SVG vectorial de alta resolución alineado al logo de medidor de calibración
- [x] Logo SVG: medidor de calibración vermilion/crema (Editorial Technical)
- [x] Fix scoring: prompts ultra-cortos (< 3 palabras como "Hola") → Grado F (~25/100)
- [x] Fix Vercel: `vercel.json` con builds estáticos explícitos para css/js y favicons
- [x] Seguritización de API: Autenticación por API Key privada (`x-api-key` / `Authorization: Bearer`), CORS restrictivo, Rate Limiting (30 req/min/IP), Límite de Payload (100 KB) y Headers OWASP.
- [x] Tests de estrés: 22/22 PASS
- [x] **Hub de Conocimiento Bilingüe (Glosario, Técnicas, Frameworks, Biblioteca)**: 20 términos bilingües en glosario, 13 técnicas prompting (ReAct, CoVe, SoT, Hi-CoT, CoT, etc.), 6 frameworks de arquitectura (CO-STAR, Bento-Box, RTF, XML nativo), biblioteca unificada expandible (34 anti-patrones, 15 best practices, 13 tests adversariales) y búsqueda interactiva en tiempo real.
- [x] **Radar IA & Creadores**: Pestaña principal `#nav-radar` reuniendo 27 creadores destacados (7 internacionales: ES/FR/DE/BR/JP) de IA y 11 referencias y guías oficiales de prompt engineering.
- [x] **Tema Novedoso "Cosmic Event Horizon"**: Modo Oscuro Galáctico por defecto con conmutador en vivo a Modo Editorial Clásico (`#theme-toggle-btn`).
- [x] **Constelación 8D Solar System 3D (Three.js WebGL)**: Visualización orbital 3D interactiva en Three.js con animación astronómica de 2 fases (condensación protoplanetaria + traslación orbital trazadora), planetas coloreados por dimensión, etiquetas flotantes permanentes, pausa al hacer hover y fallback SVG.
- [x] **Ranking Top 10 / Pabellón de la Fama (`js/leaderboard.js` & `/api/leaderboard`)**: Clasificación dinámica con medallas, modal de publicación, enlaces de compartición directa (`?p=base64`) y persistencia global en Vercel KV / Upstash Redis.
- [x] **Optimizaciones Responsivas en Teléfonos/Móviles**: Header adaptativo en 2 filas, máscara de scroll desvanecida y footer apilado en grid 2x2.
- [x] **Especificaciones Machine-Readable para IA & SEO**: `llms.txt`, `llms-full.txt`, `robots.txt`, `sitemap.xml`, Schemas JSON-LD y OpenGraph.
- [x] **Leyenda de Calificaciones & Rúbrica de Notas (Score Scale Modal)**: Modal interactivo (`#modal-score-legend`) desplegable al hacer clic en la insignia de score o en el botón de ayuda para explicar detalladamente el sistema multidimensional de 0 a 100 y la rúbrica de notas de letra (**A+** a **F**).
- [x] **Feedback Específico para Prompts Ultra-Cortos**: Adición de hallazgos y sugerencias explicativas (`tooShort` & `tooShortSugg`) en las dimensiones de Estructura, Robustez, Chain of Thought y Seguridad cuando el prompt contiene menos de 3 palabras.
- [x] **Motor Híbrido de Análisis de Intención y Enriquecimiento de Contexto de Dominio (`js/domain-analyzer.js`, `api/index.js`, `js/rewriter.js`, `js/app.js`)**: Detección de 8 Arquetipos de Dominio, matriz de brechas de contexto, chips de inyección rápida de fragmentos XML en 1-clic, endpoint serverless `/api/analyze-intent` (con fallback local `synthesizeLocal`) e insignia de arquetipo en el Workbench.
- [x] **Auditoría UX & Accesibilidad (fixes de estilos rotos + WCAG)**: Tokens CSS faltantes definidos (`--shadow-sm/lg`, `--vermilion`, `--rule-color` + typos `--space-2xl`/`--ink-soft`/`--font-sans`), toasts con posicionamiento fixed restaurado (`#toast-container`), modal suggest-creator duplicado eliminado (7 IDs repetidos), share modal des-anidado (3 `</div>`), layout Learn restaurado a grid con subnav sticky, chips `.action-chip` consolidados (modificador `--inject`), `:focus-visible` global, `prefers-reduced-motion`, contraste AA de `--ink-faint`, ARIA (role=dialog/tablist/tab, aria-current, aria-expanded, aria-label en icon-only), y cierre uniforme de modales (ESC + backdrop + foco inicial).
- [x] **Fixes de Scoring, Arquetipo de Dominio e i18n (sesión 2026-08-26)**: (1) Gate de "sustancia insuficiente" en `Analyzer.analyze` — prompts sin tarea accionable (sin verbo de acción, pregunta directa, estructura, ejemplos ni restricciones) con < 8 palabras quedan limitados a grado F (≤25/100); "esto es un prompt" pasa de 48/D a 25/F, mientras tareas cortas legítimas ("Resume… en 3 puntos", "Qué es…?") no se penalizan. (2) `DomainAnalyzer.inferArchetype(prompt, objectiveHint)` — el objetivo seleccionado del Workbench actúa como desempate: con texto neutral y objetivo `coding`/`json_schema`/`safety_rag`/`creative` el arquetipo sigue al objetivo (las señales del texto siempre ganan). (3) Bug raíz del badge `domain.general_task` crudo: sección `domain` duplicada en los diccionarios i18n (la última pisaba a la de arquetipos en runtime) — eliminada la legacy sin consumidores. (4) i18n completo del Workbench: hero, pills warning/calibrated, chips de acción, Copy/Apply, título de constelación, PROMPT SCORE central y pill `[Meta: {name}]` (nuevas claves `hero.*`, `workbench.*`, `constellation.title/subtitle`, `score.centralLabel`); `onLangChange` ahora re-renderiza la vista Analizer (las cards 8D y resultados seguían el idioma del análisis). (5) Theme toggle solo icono (label eliminado; aria-label se mantiene).

- [x] **Directorio de Modelos LLM & Benchmarks (`index.html`, `css/index.css`, `js/knowledge.js`, `js/app.js`, `js/i18n.js`):** Nueva pestaña principal (`#nav-models` & `#view-models`) con el Top 10 global de modelos frontera y open-weights (Claude 3.7 Sonnet, GPT-4o, DeepSeek-R1, Gemini 2.0, o3-mini, Llama 3.3 70B, Qwen 2.5 72B, DeepSeek-V3, Mistral Large 2, Grok 2/3), podio visual Top 3 (Oro, Plata, Bronce), filtros por categoría (*Frontera*, *Open Source*, *Razonamiento*, *Código*), buscador instantáneo, telemetría técnica (LMSYS Arena ELO, MMLU-Pro, SWE-bench, MATH 500, HumanEval, Context Window, $/1M tokens) y modal de detalle accesible (`#modal-model-detail`) con directrices de prompting óptimas por modelo y botón de carga de prompt canónico en el Workbench. Suite de pruebas actualizada a 27/27 PASS en 9 suites.
- [x] **Live News Ticker & Radar de Creadores IA (`index.html`, `css/index.css`, `js/app.js`, `js/knowledge.js`)**: Barra superior de noticias en vivo (`#news-ticker-bar`) con controles manuales completos (Play/Pausa ⏸/▶, navegación anterior ‹ y siguiente › paso a paso con centrado suave sin saltos de animación), modal de novedades (`#modal-ticker-feed`) compacto con buscador integrado y filtrado por etiquetas; pestaña Radar IA (`#view-radar`) con 27 creadores curados, búsqueda rápida en tiempo real, filtros por categoría (Prompting, Arquitectura, Agentes, Seguridad) y corrección de handle de Riley Goodside (`@goodside`).
- [x] **Métrica OWASP LLM07 — System Prompt Leakage integrada al motor (`js/signals.js`, `js/analyzer.js`, `js/patterns.js`, `js/adversarial.js`)**: 3 señales nuevas (`leakageDefense`, `sensitiveSystemPrompt`, `systemPromptExtraction`) con lógica de co-ocurrencia ES/EN; scoring en la dimensión Seguridad (+12 defensa, −18 ataque de extracción, −12 contenido sensible sin directiva de confidencialidad); anti-patrón **AP047** (Fuga de System Prompt, critical) y best practice **BP016** (defensa anti-fuga); test adversarial #14 **systemPromptLeakage** (peso 2, categoría safety) que falla por definición si el prompt evaluado ES un ataque de extracción. Catálogos: 35 APs / 16 BPs / 14 tests adversariales. Paridad i18n ES/EN completa (21 claves nuevas).
- [x] **Paridad con `promptometer-core@1.1.0` (repo promptometer, commit `3f25c4c`)**: gate de sustancia insuficiente, `analyze(prompt, { objective })` con `domainArchetype` (hint de objetivo) y métrica OWASP LLM07 replicados en el paquete npm. ⚠️ Falta `npm publish` (sin sesión npm activa) — publicar y luego `npm install` en promptforge para que el serverless use el nuevo core.
- [x] **Radar IA Internacional + Ticker de Noticias en Vivo (`js/knowledge.js`, `api/index.js`, `js/app.js`, sesión 2026-08-27)**: (1) 7 creadores internacionales verificados añadidos al Radar (total **27**): 🇪🇸 DotCSV (@DotCSV, ~800k), 🇪🇸 IA en Español (newsletter 40k+), 🇪🇸 Saul Gordillo (Substack), 🇫🇷 Defend Intelligence (Anis Ayari), 🇩🇪 Everlast AI (Leonard Schmedding), 🇧🇷 Didática Tech, 🇯🇵 Ledge.ai — con descripciones ES/EN y URLs verificadas por búsqueda web. (2) Endpoint **`GET /api/ai-news`**: noticias frescas reales desde Hacker News (Algolia, sin API key), filtro de calidad por título (AI/LLM/GPT/agent/…), ≥5 puntos, caché de 10 min en la instancia serverless y respuesta degradada con caché vieja si HN falla. (3) Cliente: `refreshAiNews()` en init + `setInterval` de 5 min + refresco al recuperar el foco de la pestaña; el ticker y el modal de feed fusionan noticias live + feed curado estático (fallback sin red).
- [x] **Deuda UX menor resuelta (sesión 2026-08-27)**: overrides editoriales para pills semánticas/XML tags/grade badges hardcodeados (paleta paper-friendly), tipografía mínima ≥0.68rem/11px (antes 8.3-10px), line-clamp de 3 líneas en previews del leaderboard, performance móvil (sin `background-attachment: fixed` ni backdrop-filter/blur de prismas a ≤768px) y limpieza de dead markup JS (`renderReferences`, badges `complexity/language` fantasma, animación de `score-ring-fill` inexistente, `btn-submit-to-leaderboard`).

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
├── css/index.css               ← Design system Editorial Technical & Cosmic (Glassmorphic Dual Mode + Action Chips)
├── js/
│   ├── app.js                  ← Controlador principal de UI (modal score legend, domain intelligence, router y renderers)
│   ├── domain-analyzer.js      ← Motor de clasificación de 8 arquetipos y brechas de contexto de dominio
│   ├── analyzer.js             ← Motor de análisis (8 dimensiones con scoring adaptativo de dominio)
│   ├── signals.js              ← Extracción de señales compartidas e inteligencia de dominio
│   ├── patterns.js             ← Detección de anti-patrones (34 APs / 15 BPs)
│   ├── i18n.js                 ← Diccionarios ES/EN + actualización dinámica de meta tags
│   ├── knowledge.js            ← Hub de conocimiento (20 términos, 13 técnicas, 6 frameworks, 13 refs, 27 creadores)
│   ├── leaderboard.js          ← Módulo de ranking Top 10 y persistencia
│   ├── rewriter.js             ← Mejora automática de prompts y chips de inyección de contexto XML
│   ├── constellation3d.js      ← Motor del Sistema Solar 3D en Three.js WebGL
│   └── export.js               ← Exportación JSON, Markdown, Clipboard y URL
├── api/index.js                ← API serverless desplegada en Vercel (incluye /api/leaderboard, /api/suggest-creator y /api/analyze-intent)
├── server.js                   ← Servidor local de desarrollo
├── vercel.json                 ← Configuración de despliegue Vercel (rutas estáticas)
├── test_edge_cases.js          ← Suite de 26 tests de estrés (8 Suites, 26/26 PASS)
├── test_edge_cases.py          
└── package.json                ← Dependencia: promptometer-core@^1.0.0
```

---

## 🔄 Última Actualización

- **Fecha:** 2026-08-26
- **Rama activa de desarrollo:** `dev` (`origin/dev`)
- **Ambientes:** `dev` → https://promptometer.vercel.app/ | `main` → https://promptometer.tech/
- **Último commit promptforge:** fixes de scoring (gate sustancia insuficiente), arquetipo por objetivo e i18n del Workbench
- **Estado:** 26/26 tests en PASS. Paridad de features con `promptometer-core` v1.1.0 lograda en código (commit `3f25c4c` del repo promptometer; falta `npm publish` — sin sesión npm). Merge `dev`→`main` en curso para desplegar a producción.

> 📌 **RESUMEN DE TRABAJO COMPLETADO (reciente):**
>
> **Scoring + Arquetipo + i18n — Sesión 2026-08-26:**
> - **Gate de sustancia insuficiente (`js/analyzer.js`):** `wordCount < 8` sin verbo de acción, pregunta directa, estructura, few-shot, formato solicitado ni restricción numérica → tope 30 por dimensión y overall ≤ 25 (F). Verificado: "esto es un prompt" 48→25; "Resume este artículo en 3 puntos" (51) y "Qué es la fotosíntesis?" (48) sin cambios.
> - **Arquetipo por objetivo (`js/domain-analyzer.js`, `js/signals.js`, `js/analyzer.js`):** `inferArchetype(prompt, objectiveHint)` con mapa `coding→software_engineering`, `json_schema→data_extraction`, `safety_rag→rag_knowledge`, `creative→rhetoric_creative` solo cuando el texto no produce señales.
> - **Bug i18n raíz (`js/i18n.js`):** sección `domain` duplicada (ES y EN) — la última (labels legacy de export sin consumidores) pisaba a la de arquetipos; por eso el badge mostraba `domain.general_task` crudo. Eliminada.
> - **i18n del Workbench:** claves nuevas ES/EN `hero.*`, `workbench.*` (pills, chips, copy/apply, goalPill `{name}`), `constellation.title/subtitle`, `score.centralLabel`; `data-i18n` en el HTML; `onLangChange` re-renderiza el analyzer (cards 8D, resultados, dominio).
> - **Theme toggle:** solo icono (label fuera, `aria-label` intacto).
> - **Verificación:** 26/26 tests, harness de scoring, 133 claves data-i18n resuelven en ES y EN, servidor local actualizado sin restart.
>
> **Auditoría UX & Accesibilidad — Fixes de estilos rotos + WCAG:**
> - **Tokens CSS indefinidos (`css/index.css`):** Definidos `--shadow-sm`, `--shadow-lg`, `--vermilion` (cósmico `#FF9E00` / editorial `#C73E2D`), `--rule-color` (color puro) en `:root` y `body.theme-editorial`. Corregidos typos `--space-xxl`→`--space-2xl`, `--ink-body`→`--ink-soft`, `--font-body`→`--font-sans` y `border-top: 1px solid var(--rule-color)`. La sección Radar IA recupera sus acentos y los modales su sombra.
> - **Toasts (`index.html`):** `#toast-container` ahora lleva la clase `.toast-container` (el CSS posicionaba la clase pero el HTML solo tenía el id) + `aria-live="polite"`.
> - **Modal suggest-creator duplicado (`index.html`):** Eliminada la versión vieja (7 IDs duplicados); se conserva la accesible con `role="dialog"`. Los errores de validación (`#suggest-creator-status`) vuelven a ser visibles.
> - **Share modal malformado (`index.html`):** Cerrados 3 `</div>` faltantes → `#modal-score-legend` des-anidado.
> - **Layout Learn (`css/index.css`):** Eliminada la redefinición flex que pisaba el grid `220px 1fr` con subnav sticky.
> - **Chips (`css/index.css`, `js/app.js`):** `.action-chip` consolidada (base neutral del design system + modificador `.action-chip--inject` mono/azul para inyección de dominio). El chip editorial ya no sale azul por error de cascada.
> - **Accesibilidad (`css/index.css`):** `:focus-visible` global (anillo con `--accent`), `prefers-reduced-motion` (ticker, constelación, spin, smooth-scroll), contraste AA de `--ink-faint` (`#94A3B8` cósmico / `#6B6153` editorial).
> - **ARIA (`index.html`, `js/app.js`, `js/i18n.js`):** `role="dialog"/aria-modal` en los 4 modales vivos, tabs de resultados con `role="tablist"/"tab"/"tabpanel"` + `aria-selected`, `aria-current="page"` en nav, `aria-expanded` + teclado en acordeón de dimensiones (delegación de eventos), `aria-label` en textarea y botones icon-only (i18n `a11y.*` ES/EN).
> - **Modales uniformes (`js/app.js`):** `setupModalA11y()` (ESC + click en backdrop) y `focusModal()` (foco inicial al primer input/botón) en los 4 modales.
> - **Verificación:** 26/26 tests PASS, HTML sin IDs duplicados y con divs balanceados (136/136), CSS con llaves balanceadas y 0 variables sin resolver sin fallback, servidor local verificado.
>
> **Commit `9bb897b` — Propagación de Objetivo Declarado al Pipeline Diagnóstico Gemini:**
> - **Inclusión de `objective` en Payload (`js/app.js`):** El handler de `#btn-deep-domain-ai` incluye el objetivo seleccionado en el selector del Workbench (`coding`, `reasoning`, `json_schema`, `safety_rag`, `creative` o `general`).
> - **Priorización en Backend Serverless (`api/index.js`):** `_handleAnalyzeIntent` pasa `objective` a `PromptometerCore.analyze` para calibración de pesos, incluye el objetivo declarado en `diagnosticPrompt` y agrega la regla 1b al `systemPrompt` para obligar al LLM a priorizar dimensiones críticas del objetivo.
> - **Tests:** 26/26 PASS.
>
> **Commit `0444e02` — Diagnóstico de Debilidades + Banner de Justificación:**
> - **Diagnóstico de Debilidades enviado al LLM (`api/index.js`):** `_handleAnalyzeIntent` construye `diagnosticPrompt` con score, grade, findings, suggestions y contextGaps.
> - **Banner de Justificación en UI (`index.html`, `css/index.css`, `js/app.js`):** `#domain-justification-banner` en panel de dominio.
>
> **Commit `cb28095` — Orden Canónico de 7 Bloques XML:**
> - Set único de etiquetas canónicas (`<system_role>` → `<objective>` → `<context>` → `<requirements>` → `<output_format>` → `<examples>` → `<error_handling>`) en toda la cadena.
