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
- [x] **Radar IA & Creadores**: Pestaña principal `#nav-radar` reuniendo 20 creadores destacados de IA y 11 referencias y guías oficiales de prompt engineering.
- [x] **Tema Novedoso "Cosmic Event Horizon"**: Modo Oscuro Galáctico por defecto con conmutador en vivo a Modo Editorial Clásico (`#theme-toggle-btn`).
- [x] **Constelación 8D Solar System 3D (Three.js WebGL)**: Visualización orbital 3D interactiva en Three.js con animación astronómica de 2 fases (condensación protoplanetaria + traslación orbital trazadora), planetas coloreados por dimensión, etiquetas flotantes permanentes, pausa al hacer hover y fallback SVG.
- [x] **Ranking Top 10 / Pabellón de la Fama (`js/leaderboard.js` & `/api/leaderboard`)**: Clasificación dinámica con medallas, modal de publicación, enlaces de compartición directa (`?p=base64`) y persistencia global en Vercel KV / Upstash Redis.
- [x] **Optimizaciones Responsivas en Teléfonos/Móviles**: Header adaptativo en 2 filas, máscara de scroll desvanecida y footer apilado en grid 2x2.
- [x] **Especificaciones Machine-Readable para IA & SEO**: `llms.txt`, `llms-full.txt`, `robots.txt`, `sitemap.xml`, Schemas JSON-LD y OpenGraph.
- [x] **Leyenda de Calificaciones & Rúbrica de Notas (Score Scale Modal)**: Modal interactivo (`#modal-score-legend`) desplegable al hacer clic en la insignia de score o en el botón de ayuda para explicar detalladamente el sistema multidimensional de 0 a 100 y la rúbrica de notas de letra (**A+** a **F**).
- [x] **Feedback Específico para Prompts Ultra-Cortos**: Adición de hallazgos y sugerencias explicativas (`tooShort` & `tooShortSugg`) en las dimensiones de Estructura, Robustez, Chain of Thought y Seguridad cuando el prompt contiene menos de 3 palabras.
- [x] **Motor Híbrido de Análisis de Intención y Enriquecimiento de Contexto de Dominio (`js/domain-analyzer.js`, `api/index.js`, `js/rewriter.js`, `js/app.js`)**: Detección de 8 Arquetipos de Dominio, matriz de brechas de contexto, chips de inyección rápida de fragmentos XML en 1-clic, endpoint serverless `/api/analyze-intent` (con fallback local `synthesizeLocal`) e insignia de arquetipo en el Workbench.

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
│   ├── knowledge.js            ← Hub de conocimiento (20 términos, 13 técnicas, 6 frameworks, 13 refs, 20 creadores)
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

- **Fecha:** 2026-08-13
- **Rama activa de desarrollo:** `dev` (`origin/dev`)
- **Ambientes:** `dev` → https://promptometer.vercel.app/ | `main` → https://promptometer.tech/
- **Último commit promptforge:** `1af4316` (feat(scoring): add score scale legend modal and short prompt analyzer feedback)
- **Estado:** 26/26 tests en PASS (8 Suites completas). Paridad ES/EN, desanidamiento XML, rol temático dinámico, diagnóstico de debilidades enviado al LLM, y `justification` banner integrado en UI. Endpoint Gemini verificado y funcionando en `llm_as_a_judge`.

> 📌 **RESUMEN DE TRABAJO COMPLETADO (esta sesión):**
> - **Corrección de Desanidamiento XML & Asignación Dinámica de Rol Temático (`js/domain-analyzer.js`, `api/index.js`)**:
>   - **Extracción limpia del Prompt Central (`extractCoreTask`)**: Elimina bloques metálicos anteriores (`<role>`, `<rol>`, `<task>`, `<tarea>`, `<constraints>`, `<restricciones>`) evitando que se dupliquen o aniden etiquetas sobre prompts ya mejorados.
>   - **Inferencia Dinámica de Rol por Tema (`inferDynamicRole`)**: Si el prompt trata sobre geología/magma, asigna `"Geólogo y Vulcanólogo Senior especializado en Dinámica del Manto"`; si es salud, asigna `"Especialista Biomédico"`; si es física, asigna `"Científico de Investigación"`; si es genérico, asigna `"Especialista de Investigación e Inteligencia Analítica"`.
> - **Diagnóstico de Debilidades enviado al LLM (`api/index.js`):**
>   - `_handleAnalyzeIntent` ahora acepta `payload.analysis` (o lo computa con `PromptometerCore.analyze`) y formatea `findings`, `suggestions` y `contextGaps` en un `diagnosticPrompt` estructurado que se inyecta como contenido de usuario al LLM.
>   - El `systemPrompt` actualizado exige que el LLM: (1) solucione CADA debilidad detectada, (2) asigne un rol alineado al tema, (3) produzca una `justification` en 1-2 oraciones en español explicando qué se mejoró y por qué.
>   - La respuesta JSON del LLM ahora incluye: `{ inferredGoal, weaknessesIdentified, justification, gapsFixedCount, improvedPrompt }`.
> - **Justification Banner en UI (`index.html`, `css/index.css`, `js/app.js`):**
>   - Añadido `#domain-justification-banner` y `#domain-justification-text` en `index.html` dentro del panel de dominio.
>   - Estilos `.domain-justification-banner` añadidos en `css/index.css` para ambos temas (Cosmic Dark y Editorial Light).
>   - `#btn-deep-domain-ai` handler en `js/app.js` actualizado para: enviar `{ prompt, analysis: currentAnalysis?.analysis }` al API; renderizar `result.justification` en el banner; mostrar toast con la justificación (6s).
> - **Internacionalización (`js/i18n.js`):**
>   - Añadido `domain.justificationTitle` en diccionarios ES y EN.
> - **Suite de pruebas (`test_edge_cases.js`):**
>   - SUITE 8 ahora es async (`await new Promise`) para aguardar la respuesta del endpoint serverless local antes de evaluar `apiPass`. **26/26 PASS**.
> - **Gemini verificado en vivo:** `source: llm_as_a_judge`, `provider: gemini`, `justification` generada correctamente en español alineada al tema.
