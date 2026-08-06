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
- [x] **Hub de Conocimiento Fase 0 (esqueleto)**: nuevo tab "Aprender" con 4 sub-secciones (Glosario, Técnicas, Frameworks, Biblioteca). `App.loadPrompt()` expuesto. CSS `.learn-*` completo. `knowledge.js` creado (vacío, se rellena en fases 1-3). Biblioteca unificada renderiza los 12 templates + 35 anti-patrones + 15 best-practices + 13 tests adversariales existentes. i18n `learn.*` y `nav.learn` en ES/EN.
- [x] **Hub de Conocimiento Fase 1 (Glosario)**: 20 términos bilingües ES/EN en `Knowledge.glossary` (token, temperature, top-p, context window, system/user/assistant, embedding, vector store, fine-tuning, hallucination, grounding, stop sequence, max tokens, function calling, prompt chaining, few-shot/zero-shot, CoT, prompt injection, LLM-as-judge, in-context learning, delimiters). 14 con cross-refs a items existentes (AP###, BP###, tpl-*, adv.*). 8 categorías.
- [x] **Hub de Conocimiento Fase 2 (Técnicas)**: 10 técnicas en `Knowledge.techniques` — 6 nuevas (ReAct, Tree-of-Thought, Self-Consistency, Reflexion, Zero-shot, Metaprompting) con ejemplos Analizables, + 4 clásicas cross-linkadas (Few-shot, CoT, RAG, Role prompting) que ya están en el motor/rewriter. Todas bilingües ES/EN con crossRefs.
- [x] **Hub de Conocimiento Fase 3 (Frameworks)**: 4 frameworks en `Knowledge.frameworks` — RTF (Role-Task-Format), CRISPE (6 componentes), RACE (Role-Action-Context-Expectation), y la **anatomía XML de 7 secciones nativa de Promptometer** (documentada con cross-refs a BP001/002/003/004/006/010/015 y rewriter._restructure). Los 2 principales (RTF + XML nativo) tienen ejemplos Analizables.

---

## 🔄 Hub de Conocimiento — Progreso por fases

- [x] **Fase 0**: Esqueleto (App.loadPrompt + nav + HTML/CSS + knowledge.js + library unificada)
- [x] **Fase 1**: Glosario (20 términos bilingüe en `knowledge.js`) ✅
- [x] **Fase 2**: Técnicas (6 nuevas + 4 cross-link con ejemplos Analizables) ✅
- [x] **Fase 3**: Frameworks (RTF, CRISPE, RACE, anatomía XML nativa) ✅
- [x] **Fase 4**: Biblioteca unificada (ya implementada en Fase 0)
- [ ] **Fase 5**: Fix ~15 claves i18n rotas (promptType.*, técnicas modernas, safety) — **ÚLTIMA FASE**

---

## 📝 Tareas Pendientes

- [ ] Esperar aprobación del PR `promptometer.is-a.dev` por mantenedores de is-a-dev
- [ ] Configurar dominio en Vercel una vez aprobado el PR
- [ ] (Opcional) Mejorar el README.md del repo promptforge con tema Editorial Technical
- [ ] (Opcional) Añadir más templates de prompts en el catálogo

---

## 🚫 Decisiones de Diseño (NO cambiar sin consultar)

1. **Nombre de marca:** Promptometer (no PromptQuill, no PromptForge)
2. **Tema visual:** Editorial Technical (crema + vermilion + reglas finas)
3. **Motor de scoring:** Base 50 por dimensión, penalización fuerte para < 3 palabras
4. **i18n:** Español como idioma principal, inglés como secundario
5. **Despliegue:** Vercel (free tier) con `@vercel/node` para API y `@vercel/static` para assets
6. **Paquete npm:** `promptometer-core` (no `promptforge-core`)

---

## 📁 Estructura de Archivos Clave

```
promptforge/                    ← App Web (Vercel)
├── index.html                  ← SPA principal
├── css/index.css               ← Design system Editorial Technical
├── js/
│   ├── app.js                  ← Controlador principal de UI
│   ├── analyzer.js             ← Motor de análisis (8 dimensiones)
│   ├── signals.js              ← Extracción de señales compartidas
│   ├── patterns.js             ← Detección de anti-patrones
│   ├── i18n.js                 ← Diccionarios ES/EN
│   ├── rewriter.js             ← Mejora automática de prompts
│   └── export.js               ← Exportación de resultados
├── api/index.js                ← Vercel Serverless Functions
├── server.js                   ← Servidor local de desarrollo
├── vercel.json                 ← Configuración de despliegue Vercel
├── test_edge_cases.js          ← Suite de 14 tests de estrés
└── package.json                ← Dependencia: promptometer-core@^1.0.0

promptquill/                    ← Monorepo del Motor Core (npm)
└── packages/core/
    ├── promptometer-core.js    ← Motor JS (publicado en npm)
    ├── promptometer_core.py    ← Motor Python (paridad)
    └── promptometer-rules.json ← Reglas de evaluación
```

---

## 🔄 Última Actualización

- **Fecha:** 2026-08-06
- **Último commit promptforge:** `7a4db77` (Hub de Conocimiento Fase 0 — esqueleto)
- **Último commit promptometer:** `67436ff` (fix scoring ultra-short)
- **Sesión en curso con:** ZCode (GLM-5.2) — implementando Hub de Conocimiento
- **Próxima fase:** Fase 1 (Glosario ~20 términos bilingüe en `knowledge.js`)

> 📌 **Contexto para Antigravity u otro asistente que continúe:**
> Se está construyendo un **Hub de Conocimiento de Prompt Engineering** en el tab
> "Aprender". La arquitectura está completa (Fase 0, commit `7a4db77`): nuevo
> módulo `js/knowledge.js`, vista `#view-learn` con 4 sub-secciones, `App.loadPrompt()`
> expuesto, y la sub-sección "Biblioteca" ya renderiza los 12 templates + 35
> anti-patrones + 15 best-practices + 13 tests adversariales existentes.
>
> **Lo que falta (fases 1-3):** rellenar los arrays `Knowledge.glossary`,
> `Knowledge.techniques` y `Knowledge.frameworks` en `js/knowledge.js` con
> contenido bilingüe (campos `{es, en}`). El principio rector es **NO duplicar**
> lo que ya existe — solo añadir conocimiento nuevo y cross-linkar.
>
> **Fase 5 final:** fix de ~15 claves i18n rotas (`promptType.*`, técnicas modernas
> en `analyzer.chainOfThought.*`, `analyzer.safety.piiLeak/postCutoff/assumesCapability`,
> `adversarialCategory.safety`).
>
> Ver el plan completo aprobado en `.zcode/plans/plan-sess_b0d39578-*.md`.
