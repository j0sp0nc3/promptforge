# 📋 Backlog de Funcionalidades & Roadmap de Innovación — Promptometer (2026 SOTA)

---

## 🎯 Resumen Ejecutivo del Backlog
Este backlog consolida mejoras funcionales, arquitectónicas y de innovación priorizadas para Promptometer, validadas contra la experiencia industrial de desarrollo de sistemas agénticos y aplicaciones con LLMs en 2026.

---

## 📌 Prioridad 1: ALTA (Innovación Core & DX de Producción)

- [ ] **P1.1 — Exportador Multi-SDK Native Code Snippets (Python / TS / Curl)**
  - **Descripción:** Botón en el Workbench que convierte el prompt calibrado con sus 7 bloques XML en fragmentos de código listos para producción usando los SDKs oficiales de 2026 (OpenAI Python v2, Anthropic TS SDK, Google GenAI SDK y Curl con contratos de herramientas MCP).
  - **Validación Industrial:** Elimina la fricción de reescribir prompts calibrados a código de API.
  - **Criterios de Aceptación:** Generación instantánea client-side en `js/export.js`, botón de copia en 1-click y tabs por lenguaje.

- [ ] **P1.2 — Multi-Model Cost & Token Latency Simulator (Simulador Live de Presupuesto y Latencia)**
  - **Descripción:** Módulo de cálculo en tiempo real en el Workbench que estima el costo financiero (por 1,000 / 100,000 ejecuciones) y la latencia promedio esperada del prompt activo en el Top 10 de modelos SOTA (Claude Mythos, GPT-5.6 Sol, Gemini 3.1 Pro, DeepSeek V4, Llama 4).
  - **Validación Industrial:** Permite calibrar la relación costo-eficiencia antes del envío a producción.
  - **Criterios de Aceptación:** Cálculo automático en `js/analyzer.js` usando telemetría live de `js/models.js`.

---

## 📌 Prioridad 2: MEDIA (Seguridad & Herramientas Agénticas MCP)

- [ ] **P2.1 — MCP Schema Inspector & Auto-Validator (Model Context Protocol)**
  - **Descripción:** Herramienta interactiva para pegar contratos de herramientas en formato JSON/YAML de servidores MCP y auditar si el prompt declara correctamente los tipos, descripciones y guardrails (`<loop_guard>`).
  - **Validación Industrial:** Esencial para prevenir ejecuciones no tipadas (AP049) y envenenamiento de herramientas en flujos agénticos.

- [ ] **P2.2 — Playground de Inyección Adversarial Personalizada & Local Fuzzing**
  - **Descripción:** Permitir al usuario ingresar sus propias reglas de prueba de estrés y ejecutar un mini-fuzzing local contra vulnerabilidades OWASP LLM07, exfiltración de contexto e inyección indirecta.
  - **Validación Industrial:** Aumenta la robustez de seguridad en entornos corporativos.

---

## 📌 Prioridad 3: BAJA / MANTENIMIENTO (Rendimiento & PWA)

- [ ] **P3.1 — Streaming SSE de Noticias e Investigaciones en Tiempo Real (`/api/ai-news`)**
  - **Descripción:** Reemplazar el polling de noticias por Server-Sent Events (SSE) en Vercel Serverless para empujar novedades instantáneas de arXiv y Hacker News a la UI.

- [ ] **P3.2 — PWA Offline First & Service Worker Cache**
  - **Descripción:** Service Worker para funcionamiento 100% offline (Scoring 8D, Motor Genético, Comparación A/B, Hub de Conocimiento).
