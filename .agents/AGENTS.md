# Project Rules — Promptometer

## Mandatory First Step
Before making ANY code changes, read `HANDOFF.md` in the project root.
It contains the current project state, completed tasks, pending tasks,
and design decisions that MUST be respected.

## Naming
- The product name is **Promptometer** (not PromptQuill, not PromptForge).
- The npm package is `promptometer-core`.
- The web app repo is `promptforge` (deployment name only).

## Git Workflow & Regla Inviolable de Puerta de Validación Humana
- **Desarrollo Exclusivo en `dev`:** Toda modificación, feature o bugfix debe iniciarse, commitearse y pushearse EXCLUSIVAMENTE a la rama `dev` (`origin dev`).
- **PROHIBICIÓN TOTAL DE AUTO-MERGE O PUSH A `main`:** Queda estrictamente prohibido que el agente fusione o pushee a `main` de forma automática.
- **Workflow de Puertas de Calidad (Human-in-the-Loop):**
  1. **Local:** Probar localmente en `http://localhost:3001` y ejecutar `node test_edge_cases.js` (34/34 PASS obligatorios).
  2. **Staging / Dev:** Commit y push únicamente a `dev` (`git push origin dev`).
  3. **Pausa Obligatoria & Validación del Usuario:** El agente debe notificar al usuario que los cambios están en `https://promptometer.vercel.app/` y **DETENERSE**.
  4. **Producción (`main`):** ÚNICAMENTE cuando el USUARIO apruebe en el chat y ordene la promoción ("pasa a prod" / "haz merge a main"), el agente abrirá un **Pull Request de `dev` → `main`** y se detendrá. Nunca merge directo ni push automático a `main`.
  5. **No Bypasses:** Los hotfixes de emergencia deben seguir exactamente el mismo flujo (`dev` → validación humana → `main`).

## Deployment Environments & API Separation
- **Development (dev branch):** `https://promptometer.vercel.app/` — auto-deploys from every push to `dev`. Dev uses relative `/api/*` endpoints (same-origin, no separate subdomain or env variable needed).
- **Production (main branch):** `https://promptometer.tech/` — auto-deploys from every push to `main`. In production ONLY, API calls route to `https://api.promptometer.tech/api/*` via `js/api-config.js` (requires DNS CNAME setup in Vercel/Cloudflare when releasing to main).
- Strict Workflow: commit on `dev` → notify user on `promptometer.vercel.app` → WAIT for user approval → open PR `dev` → `main` → live on `promptometer.tech`.

## Design System: Editorial Technical
- Background: Cream Paper `#F7F3EC`
- Accent: Vermilion `#C73E2D`
- Typography: Fraunces (serif), IBM Plex Mono (data), Inter (body)
- NO glassmorphism, NO neon glow, NO dark mode as default.
- Use thin rules (lines), not box-shadows.

## Code Style
- All UI text must go through the i18n system (`js/i18n.js`).
- Add keys to BOTH `es` and `en` dictionaries.
- Scoring engine changes must be applied to BOTH:
  - `js/analyzer.js` (web app)
  - `packages/core/promptometer-core.js` (npm package)
  - `packages/core/promptometer_core.py` (Python parity)

## Data & News Freshness Policy
- All news publications displayed in the app (AI News Ticker via Hacker News & arXiv), curated landmark feeds, SOTA LLM model directory, telemetry (pricing, context windows), and benchmark metrics MUST be kept strictly fresh and up-to-date (current year 2026).
- Never allow stale news or outdated model statistics to remain un-synchronized.

## Before EVERY Commit (not just at session end)
- Run `node test_edge_cases.js` to verify 22/22 PASS.
- Update `HANDOFF.md`: move completed items to ✅, add new pending items, and update the "Última Actualización" section (date, latest commit hash, and session summary).
- Update `README.md`: if any new techniques, frameworks, features, or files were added/modified, update global counts (e.g., number of techniques/frameworks) and the project file tree.
- Include both `HANDOFF.md` and `README.md` in the commit whenever documentation counts or files change.
- The session may end abruptly (quota limits), so NEVER defer updates.

## When Starting a Session After Another Assistant
- Read `HANDOFF.md` first.
- Run `git log --oneline -10` to see recent commits you didn't make.
- Run `git diff HEAD~3` if needed to understand recent changes.
- Reconcile any work not reflected in HANDOFF.md before proceeding.

## Orquestación del Flujo de Trabajo

### 1. Modo Plan por Defecto
- Entra en modo plan para CUALQUIER tarea no trivial (3+ pasos o decisiones de arquitectura).
- Si algo se tuerce, detente y vuelve a planificar de inmediato; no sigas empujando.
- Usa el modo plan también para los pasos de verificación, no solo para construir.
- Escribe especificaciones detalladas desde el principio para reducir la ambigüedad.

### 2. Estrategia de Subagentes
- Usa subagentes sin problema para mantener limpia la ventana de contexto principal.
- Delega investigación, exploración y análisis en paralelo a subagentes.
- Para problemas complejos, asigna más capacidad de cómputo mediante subagentes.
- Una tarea por subagente para una ejecución enfocada.

### 3. Bucle de Auto-mejora
- Después de CUALQUIER corrección del usuario: actualiza `tasks/lessons.md` con el patrón.
- Escribe reglas para ti mismo que eviten repetir el mismo error.
- Itera sin piedad sobre estas lecciones hasta que baje la tasa de errores.
- Revisa las lecciones al inicio de la sesión para el proyecto relevante.

### 4. Verificación Antes de Darlo por Hecho
- Nunca marques una tarea como completada sin demostrar que funciona.
- Compara el comportamiento entre `main` y tus cambios cuando sea relevante.
- Pregúntate: "¿Lo aprobaría un staff engineer?"
- Ejecuta pruebas, revisa logs y demuestra que es correcto.

### 5. Exige Elegancia (Equilibrada)
- Para cambios no triviales: haz una pausa y pregúntate "¿hay una forma más elegante?"
- Si una solución se siente chapucera: "Sabiendo todo lo que sé ahora, implementa la solución elegante".
- Sáltate esto en arreglos simples y obvios; no sobre-ingenierices.
- Cuestiona tu propio trabajo antes de presentarlo.

### 6. Corrección Autónoma de Bugs
- Cuando te den un reporte de bug: simplemente arréglalo. No pidas que te lleven de la mano.
- Señala logs, errores y tests que fallan; luego resuélvelos.
- Cero cambios de contexto requeridos por parte del usuario.
- Ve y arregla los tests fallidos del CI sin que te digan cómo.

## Gestión de Tareas
1. **Planifica Primero**: Escribe el plan en `tasks/todo.md` con elementos verificables.
2. **Verifica el Plan**: Haz un check-in antes de empezar la implementación.
3. **Haz Seguimiento del Progreso**: Marca los elementos como completados a medida que avanzas.
4. **Explica los Cambios**: Resumen de alto nivel en cada paso.
5. **Documenta los Resultados**: Añade una sección de revisión a `tasks/todo.md`.
6. **Captura Lecciones**: Actualiza `tasks/lessons.md` después de las correcciones.

## Principios Fundamentales
- **La Simplicidad Primero**: Haz cada cambio tan simple como sea posible. Impacta el mínimo código posible.
- **Nada de Pereza**: Encuentra las causas raíz. Nada de arreglos temporales. Estándares de un desarrollador senior.
- **Impacto Mínimo**: Los cambios solo deben tocar lo necesario. Evita introducir bugs.
- **Desarrollo Exclusivamente Local**: Queda estrictamente prohibido hacer `git push` a `dev` o `main` sin el consentimiento explícito del usuario. Todo el desarrollo se prueba primero en local (`http://localhost:3001`).
