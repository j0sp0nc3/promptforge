# Plan de Implementación: Motor Híbrido de Análisis de Intención y Enriquecimiento de Contexto de Dominio

- [x] **Fase 1: Motor Local de Arquetipos y Brechas de Contexto (`js/domain-analyzer.js`)**
  - Detección de 8 Arquetipos de Dominio (`software_engineering`, `data_extraction`, `marketing_copy`, `rhetoric_creative`, `rag_knowledge`, `agentic_tool_use`, `financial_legal`, `general_task`).
  - Matriz de Brechas de Contexto (`DomainRequirements`): Identificación de elementos faltantes según el dominio (ej. stack técnico, esquema JSON, audiencias, fallbacks RAG, etc.).
  - Integración en `Signals` y `Analyzer` para enriquecer la puntuación de contexto y recomendaciones.

- [x] **Fase 2: Reescritor de Dominio y Chips de Inyección Rápida (`js/rewriter.js`)**
  - Plantillas de reescritura dinámicas que inyectan secciones XML específicas del dominio (`<stack_tecnico>`, `<audiencia_objetivo>`, `<fallbacks_dominio>`).
  - Chips de acción rápida en UI para insertar contextos faltantes en 1-click (`+ Inyectar Stack`, `+ Inyectar Errores HTTP`, etc.).

- [x] **Fase 3: Endpoint Serverless de Análisis Semántico Profundo (`api/index.js` / `/api/analyze-intent`)**
  - Endpoint de análisis semántico mediante LLM-as-a-Judge (con fallback heurístico si no hay clave de API).
  - Extracción de Objetivo Primario, Supuestos Implícitos y Reescritura Experta de Dominio.

- [x] **Fase 4: Interfaz de Usuario y Tab de Intención & Dominio (`index.html`, `js/app.js`, `css/index.css`)**
  - Insignia visual del Arquetipo de Dominio detectado en la cabecera del Workbench.
  - Panel de Brechas de Contexto de Dominio con acciones de reparación instantánea.
  - Botón *"✨ Optimizar Contexto Profundo con IA"* conectado al endpoint Serverless.

- [x] **Fase 5: Internacionalización (i18n) y Pruebas Automatizadas**
  - Diccionario i18n bilingüe ES/EN (`domain.*`, `contextGaps.*`).
  - Suite de pruebas de estrés `node test_edge_cases.js` (Suite 6 para clasificación de arquetipos y brechas de dominio).
