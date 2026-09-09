# Plan de Desarrollo — Promptometer

Plan de desarrollo por fases incrementales guiado por Spec-Driven Development (SDD).
Actualizar este archivo al completar cada fase o hito junto con la suite de verificación.

Estado actual: **Fase 4 — Robustecimiento del Harness, Evaluación Agéntica y Paridad 1.1.0 (Activa)**

---

## Fases del Roadmap

### Fase 1: Mínimo Núcleo Viable (Core MVP) ✅
- [x] Motor de scoring multidimensional con 8 dimensiones base (Estructura, Claridad, Especificidad, Robustez, Contexto, CoT, Tokens, Seguridad).
- [x] Penalización de prompts ultra-cortos (< 3 palabras) y gate de sustancia insuficiente (< 8 palabras sin tarea accionable).
- [x] Empaquetado y publicación inicial de `promptometer-core@1.0.0` en npm.
- [x] Web SPA base con inputs interactivos, cálculo en tiempo real y exportación de reportes.
- [x] **Criterio de éxito:** Motor determinista con suite de pruebas unitarias pasando.

### Fase 2: Lógica de Dominio, Seguridad OWASP e Inteligencia Adaptativa ✅
- [x] Clasificación inteligente en 8 Arquetipos de Dominio (`DomainAnalyzer`).
- [x] Matriz de brechas de contexto y chips de inyección rápida de fragmentos XML canónicos.
- [x] Métrica de seguridad OWASP LLM07 (System Prompt Leakage Detection) con defensa y penalización de ataques.
- [x] Catálogo unificado: 35 Anti-Patrones, 16 Buenas Prácticas y 14 Tests Adversariales.
- [x] Soporte bilingüe total (ES/EN) con sincronización dinámica de metadata y 0 claves faltantes.
- [x] **Criterio de éxito:** Suite de estrés ampliada a 27/27 vectores pasando sin regresiones.

### Fase 3: Interfaz Dual SOTA, Visualización 3D y Telemetría en Tiempo Real ✅
- [x] Sistema de diseño dual: *Cosmic Event Horizon* (predeterminado) y *Editorial Technical* (clásico).
- [x] Constelación orbital 3D interactiva en Three.js WebGL con dos fases dinámicas.
- [x] Directorio Top 10 modelos LLM frontera y open-weights con telemetría en vivo, precios OpenRouter y prompts canónicos.
- [x] Live Ticker en tiempo real combinando Hacker News (Algolia) + preprints de arXiv (cs.AI / cs.CL).
- [x] Leaderboard dinámico de la comunidad con persistencia opcional en Vercel KV / Upstash Redis.
- [x] **Criterio de éxito:** Interfaz accesible WCAG AA, cero errores de consola y navegación fluida en desktop/móvil.

### Fase 4: Robustecimiento del Harness, Evaluación Agéntica y Paridad 1.1.0 🚀 (Fase Activa)
- [x] Integración de guardrails SDD generados por el harness Yunta (`SPEC.md`, `PLAN.md`, `AGENTS.md`).
- [x] Incorporación de métricas de validación para prompts orientados a flujos agénticos y MCP (Model Context Protocol): AP048, AP049, BP017, Test Adversarial #15 Tool Poisoning, action chips Workbench y Suite 10.
- [ ] Certificación de paridad total entre el motor web (`js/analyzer.js`) y el paquete distribuible (`promptometer-core@1.1.0` en JS y Python).
- [ ] Verificación de endpoints de producción (`api.promptometer.tech`) y pruebas de carga local en `http://localhost:3001`.
- [ ] **Criterio de éxito:** 31/31 tests PASS, paridad completa en npm/PyPI y validación lista para merge `dev` → `main`.

---

## Reglas que Gobiernan el Plan
1. **Soberanía del Plan:** No saltar a implementaciones de fases posteriores sin validar y certificar los criterios de la fase activa.
2. **TDD / Verificación Obligatoria:** Todo cambio en el motor o interfaz debe validarse inmediatamente con `node test_edge_cases.js`.
3. **Desarrollo Exclusivamente Local:** Todas las pruebas y validaciones ocurren en local (`http://localhost:3001`). Ningún push a ramas remotas (`dev`/`main`) sin autorización humana.
4. **Mantenimiento de Documentación:** Cualquier cambio en el catálogo de reglas, modelos o técnicas debe reflejarse en `README.md` y `HANDOFF.md`.
