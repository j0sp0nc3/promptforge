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

---

## 🔄 Hub de Conocimiento — Progreso por fases

- [x] **Fase 0**: Esqueleto (App.loadPrompt + nav + HTML/CSS + knowledge.js + library unificada)
- [x] **Fase 1**: Glosario (20 términos bilingüe en `knowledge.js`) ✅
- [x] **Fase 2**: Técnicas (6 nuevas + 4 cross-link con ejemplos Analizables) ✅
- [x] **Fase 3**: Frameworks (RTF, CRISPE, RACE, anatomía XML nativa) ✅
- [x] **Fase 4**: Biblioteca unificada (ya implementada en Fase 0) ✅
- [x] **Fase 5**: Fix 18 claves i18n rotas (promptType.*, técnicas modernas, safety) ✅
- [x] **Biblioteca con detalle expandible**: los anti-patrones (35), buenas prácticas (15) y tests adversariales (13) ahora son acordeones `<details>` expandibles que muestran descripción, dimensión y sugerencia (todo desde i18n existente, sin duplicar contenido).

> ✅ **HUB DE CONOCIMIENTO COMPLETO.** 30 entradas nuevas (20 glosario + 6 técnicas + 4 frameworks),
> bilingües ES/EN, + biblioteca unificada de los 12 templates + 34 anti-patrones + 15 best-practices
> + 13 tests adversariales existentes (con detalle expandible). + 18 bugs de i18n arreglados.

- [x] **Hub de Conocimiento Búsqueda interactiva**: Barra de búsqueda en tiempo real `#learn-search-input` para filtrar conceptos del glosario, técnicas, frameworks, templates, anti-patrones y tests adversariales con botón de borrado rápido e i18n ES/EN.
- [x] **Técnicas & Frameworks 2026**: Adición de 3 técnicas de vanguardia (*Chain of Verification - CoVe, Skeleton-of-Thought - SoT, Hierarchical CoT - Hi-CoT*) y 2 frameworks de arquitectura (*CO-STAR, Bento-Box Modular Architecture*) en `js/knowledge.js`.
- [x] **Pestaña Principal Radar IA (`#nav-radar` & `#view-radar`)**: Promovido del sub-menú de Aprender a pestaña principal en la barra superior de navegación. Reúne en un solo lugar destacado los 12 Creadores AI y las 11 Referencias & Guías oficiales con pestañas internas y modal de sugerencia comunitaria.
- [x] **Banda Ticker de Noticias AI en Vivo (`#news-ticker-bar`)**: Marquesina deslizante continua integrada bajo la cabecera principal que muestra las últimas publicaciones, descubrimientos de inyección de prompt, papers y videos de los creadores de IA con pausa al pasar el ratón e i18n ES/EN.
- [x] **Redes Sociales & Perfiles Oficiales**: Enlaces directos en el pie de página a **LinkedIn** (`/in/josponce`), **X / Twitter** (`@j0sp0nc3`), **GitHub Autor** (`@j0sp0nc3`), **Código Fuente** (`promptforge`) y **Motor NPM** (`promptometer`).
- [x] **Módulo de Moderación de Contenido (`api/moderation.js`) & Persistencia Global Upstash Redis (`api/index.js`)**: Filtro de tres capas (palabras malsonantes ES/EN, patrones maliciosos de inyección/XSS y anti-spam por IP/deduplicación hash) con almacenamiento persistente opcional en Upstash Redis (`UPSTASH_REDIS_REST_URL`).
- [x] **Normalización de Categorías (`js/leaderboard.js`)**: Espacio de nombres canónico de categorías (`general`, `código`, `agentes`, `RAG`, `extracción`, `evaluación`, `marketing`, `NLP`, `traducción`, `salud`) y métodos `getByCategory()` y `normalizeCategory()`.
- [x] **Fix Renderizado Inmediato Top 10 (`js/app.js`)**: Aplicado el patrón *Stale-While-Revalidate* en `renderLeaderboardView()`. Los 10 prompts curados iniciales se renderizan a 0ms (sin espera de red) y luego se actualizan asíncronamente cuando responde la API.
- [x] **Fix 401 Unauthorized en `/api/leaderboard`**: Ajustada la verificación de autenticación en `api/index.js` y `server.js` para permitir peticiones `GET` del mismo origen (que no envían header `Origin` explícito en navegadores) e indicar acceso público al endpoint del Top 10.
- [x] **Fix SyntaxError en `js/leaderboard.js`**: Escapadas las comillas invertidas unescaped (\`npm run build\`) en el prompt semilla #7 que impedían la carga del script en el navegador.
- [x] **Ranking Top 10 / Pabellón de la Fama (`js/leaderboard.js` & `/api/leaderboard`)**: Pestaña principal de navegación **Top 10** con clasificación dinámica de los 10 mejores prompts (94-99/100). Incluye modal de publicación *"Publicar mi Prompt Actual"*, medallas de oro/plata/bronce (`#1 🥇`, `#2 🥈`, `#3 🥉`), botones para *"Analizar y Probar"* y *"Copiar Prompt"*, sincronización global en tiempo real mediante API serverless `/api/leaderboard` (sin registro) y generación de enlaces de compartición directa (`?p=base64`). 10 prompts curados de élite incluidos de entrada.

---

## 📝 Tareas Pendientes

- [ ] Esperar aprobación del PR `promptometer.is-a.dev` por mantenedores de is-a-dev
- [ ] Configurar dominio en Vercel una vez aprobado el PR
- [ ] (Opcional) Lab interactivo transformador (roadmap — requiere técnicas que el rewriter NO cubre)

---

## 🚫 Decisiones de Diseño (NO cambiar sin consultar)

1. **Nombre de marca:** Promptometer (no PromptQuill, no PromptForge)
2. **Tema visual:** Cosmic Event Horizon (Predeterminado: Oscuro Galáctico / Agujero negro) con Selector de Modo Dual a Editorial Classic.
3. **Motor de scoring:** Base 50 por dimensión, penalización fuerte para < 3 palabras
4. **i18n:** Español como idioma principal, inglés como secundario
5. **Despliegue:** Vercel (free tier) con `@vercel/node` para API y `@vercel/static` para assets
6. **Paquete npm:** `promptometer-core` (no `promptforge-core`)

---

## 📁 Estructura de Archivos Clave

```
promptforge/                    ← App Web (Vercel)
├── index.html                  ← SPA principal
├── favicon.svg                 ← Favicon vectorial de alta resolución
├── css/index.css               ← Design system Editorial Technical
├── js/
│   ├── app.js                  ← Controlador principal de UI
│   ├── analyzer.js             ← Motor de análisis (8 dimensiones)
│   ├── signals.js              ← Extracción de señales compartidas
│   ├── patterns.js             ← Detección de anti-patrones (35 APs / 15 BPs)
│   ├── i18n.js                 ← Diccionarios ES/EN
│   ├── knowledge.js            ← Hub de conocimiento (20 términos, 13 técnicas, 6 frameworks, 11 refs)
│   ├── leaderboard.js          ← Módulo de ranking Top 10 y persistencia
│   ├── rewriter.js             ← Mejora automática de prompts
│   └── export.js               ← Exportación JSON, Markdown, Clipboard y URL
├── api/index.js                ← API serverless desplegada en Vercel (incluye /api/leaderboard)
├── server.js                   ← Servidor local de desarrollo
├── vercel.json                 ← Configuración de despliegue Vercel
├── test_edge_cases.js          ← Suite de 14 tests de estrés (PASS)
└── package.json                ← Dependencia: promptometer-core@^1.0.0

promptquill/                    ← Monorepo del Motor Core (npm)
└── packages/core/
    ├── promptometer-core.js    ← Motor JS (publicado en npm)
    ├── promptometer_core.py    ← Motor Python (paridad)
    └── promptometer-rules.json ← Reglas de evaluación
```

---

## 🔄 Última Actualización

- **Fecha:** 2026-08-07
- **Último commit promptforge:** `e6142cf` (feat(ui): implement Cosmic Event Horizon theme & dynamic theme switcher)
- **Último commit promptometer:** `67436ff` (fix scoring ultra-short)
- **Sesión con:** Antigravity AI — **Diseño Novedoso Cosmic Event Horizon + Selector de Modo Dual COMPLETO**
- **Estado:** 22/22 tests de estrés y suites de prueba en PASS. Paridad ES/EN verificada. Desplegado en Vercel.

> 📌 **RESUMEN DE TRABAJO COMPLETADO (esta sesión):**
> - **Nuevo Tema Novedoso Cosmic Event Horizon**: Estética visual galáctica de alta precisión de instrumentos astrofísicos y agujero negro como tema predeterminado.
> - **Selector de Temas Dual (Theme Switcher)**: Botón interactivo en el encabezado (`#theme-toggle-btn`) para alternar entre Modo Cósmico 🌌 y Modo Editorial 📜.
> - **Tipografías Espaciales**: Integración de Space Grotesk y JetBrains Mono.
> - **Favicon & Logo Galácticos**: Favicon SVG actualizado con el anillo fotónico de acreción.
