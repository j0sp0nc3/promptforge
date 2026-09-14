# 📋 Backlog de Funcionalidades & Roadmap de Innovación — Promptometer (2026 SOTA)

---

## 🎯 Resumen Ejecutivo del Backlog
Este backlog consolida mejoras funcionales, arquitectónicas y de innovación priorizadas para Promptometer, validadas contra la experiencia industrial de desarrollo de sistemas agénticos y aplicaciones con LLMs en 2026.

---

## 📌 Motor Híbrido de Análisis de Intención & Enriquecimiento de Contexto de Dominio (Opción 3) — COMPLETADO ✅

- [x] **Fase 1: Motor Local de Arquetipos y Brechas de Contexto (`js/domain-analyzer.js`)**
  - Detección de 8 Arquetipos de Dominio (`software_engineering`, `data_extraction`, `marketing_copy`, `rhetoric_creative`, `rag_knowledge`, `agentic_tool_use`, `financial_legal`, `general_task`).
  - Matriz de Brechas de Contexto (`DomainRequirements`): Identificación de elementos faltantes según el dominio (ej. stack técnico, esquema JSON, audiencias, fallbacks RAG, etc.).
  - Integración en `Signals` y `Analyzer` para enriquecer la puntuación de contexto y recomendaciones.

- [x] **Fase 2: Reescritor de Dominio y Chips de Inyección Rápida (`js/rewriter.js`, `js/app.js`)**
  - Plantillas de reescritura dinámicas que inyectan secciones XML específicas del dominio (`<stack_tecnico>`, `<audiencia_objetivo>`, `<fallbacks_error>`).
  - Chips de acción rápida en UI para insertar contextos faltantes en 1-click (`+ Inyectar Stack`, `+ Inyectar Errores HTTP`, etc.).

- [x] **Fase 3: Endpoint Serverless de Análisis Semántico Profundo (`api/index.js` / `/api/analyze-intent`)**
  - Endpoint de análisis semántico mediante Gemini 1.5 Flash Free Tier API con fallback automático y transparente al sintetizador heurístico local `DomainSynthesizer`.
  - Extracción de Objetivo Primario, Supuestos Implícitos y Reescritura Experta de Dominio.

- [x] **Fase 4: Interfaz de Usuario y Tab de Intención & Dominio (`index.html`, `js/app.js`, `css/index.css`)**
  - Insignia visual del Arquetipo de Dominio detectado en la cabecera del Workbench.
  - Panel de Brechas de Contexto de Dominio con acciones de reparación instantánea.
  - Botón *"✨ Optimizar Contexto Profundo con IA"* conectado al endpoint Serverless.

- [x] **Fase 5: Internacionalización (i18n) y Pruebas Automatizadas**
  - Diccionario i18n bilingüe ES/EN (`domain.*`, `contextGaps.*`).
  - Suite de pruebas de estrés `node test_edge_cases.js` (42/42 PASS en 15 suites).

---

## 📌 Prioridad 1: ALTA (Innovación Core & DX de Producción) — COMPLETADO ✅

- [x] **P1.1 — Exportador Multi-SDK Native Code Snippets (Python / TS / Curl)**
  - Generación de código nativo para Python (OpenAI v2), TypeScript (Anthropic SDK) y cURL con contratos MCP.
- [x] **P1.2 — Multi-Model Cost & Token Latency Simulator (Simulador Live de Presupuesto y Latencia)**
  - Telemetría y calculadora de presupuestos para el Top 10 de modelos SOTA 2026.

---

## 📌 Prioridad 2: MEDIA (Seguridad & Herramientas Agénticas MCP) — COMPLETADO ✅

- [x] **P2.1 — MCP Schema Inspector & Auto-Validator (Model Context Protocol)**
  - Inspector de esquemas JSON/YAML MCP con auditoría de 5 criterios y generación de contrato XML `<tools>`.
- [x] **P2.2 — Playground de Inyección Adversarial Personalizada & Local Fuzzing**
  - Fuzzer local con 20 mutaciones de prueba contra OWASP LLM07 y guardrails de seguridad en 1-click.

---

## 📌 Prioridad 3: MANTENIMIENTO & PERMITIVIDAD — COMPLETADO ✅

- [x] **P3.1 — Streaming SSE de Noticias e Investigaciones en Tiempo Real (`/api/ai-news`)**
  - Server-Sent Events (SSE) para noticias en vivo desde Hacker News y arXiv.
- [x] **P3.2 — PWA Offline First & Service Worker Cache (`sw.js`)**
  - Soporte 100% offline para el motor de scoring, tuner genético y herramientas del Workbench.
