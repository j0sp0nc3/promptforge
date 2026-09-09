# Contexto del Proyecto y Reglas para Agentes — Promptometer

Este archivo define las reglas de convivencia, restricciones y contexto ontológico para cualquier agente de código (Yunta, Antigravity, Claude, Cursor, Copilot) que trabaje en este proyecto.

## 1. Contexto del Proyecto
- **Proyecto:** Promptometer (repositorio web: `promptforge`, paquete npm: `promptometer-core`)
- **Filosofía:** Spec-Driven Development (SDD). El código sigue estrictamente a la especificación en `SPEC.md` y al roadmap en `PLAN.md`.
- **Stack:** Vanilla JavaScript ES6+, HTML5 semántico, CSS3 nativo (sin frameworks pesados como Tailwind/Bootstrap), Three.js WebGL (Constelación 3D), Node.js serverless en Vercel.

## 2. Comandos Esenciales
- **Ejecutar tests unitarios y de estrés (31/31 obligatorios):** `node test_edge_cases.js`
- **Servidor local de desarrollo:** `node server.js` (escucha en `http://localhost:3001`)
- **Validación de sintaxis:** `node -c js/*.js api/*.js`
- **Sincronización/Verificación de modelos:** `node scripts/sync_models.js --validate`

## 3. Reglas Inviolables para Agentes
1. **Soberanía de las Especificaciones (SDD):** Consulta `SPEC.md` y `PLAN.md` antes de proponer o implementar cambios. No agregues complejidad ni cambies la arquitectura sin validación.
2. **TDD / Verificación Obligatoria:** Todo cambio debe verificarse con `node test_edge_cases.js`. Nunca declares una tarea terminada sin haber demostrado su éxito con herramientas reales.
3. **Mínimo Código Necesario:** No añadas dependencias npm ni bibliotecas innecesarias si JavaScript nativo resuelve el problema de forma óptima.
4. **Frontera de Ejecución:** Respeta la fase activa definida en `PLAN.md`.
5. **Desarrollo Exclusivamente Local:** Queda estrictamente prohibido hacer `git push` a `dev` o `main` sin el consentimiento explícito del usuario. Todo el desarrollo se prueba primero en local (`http://localhost:3001`).
6. **Sistema de Diseño Sagrado:**
   - Modo Dual: *Cosmic Event Horizon* (`#08090E`, `#FF9E00`) y *Editorial Technical* (`#F7F3EC`, `#C73E2D`, `#1A1612`).
   - Tipografía: Fraunces / Space Grotesk (títulos), IBM Plex Mono / JetBrains Mono (datos/código), Inter (cuerpo).
   - No añadir glassmorphism descuidado, ni sombras pesadas, ni neones no autorizados.
7. **Internacionalización (i18n):** Todo texto visible de la interfaz debe registrarse en `js/i18n.js` tanto para el diccionario `es` (español) como `en` (inglés). 0 llaves faltantes toleradas.
8. **Paridad de Motores:** Cualquier ajuste a la lógica de scoring o evaluación debe sincronizarse con:
   - `js/analyzer.js` (Web App)
   - `packages/core/promptometer-core.js` (npm core)
   - `packages/core/promptometer_core.py` (Python parity)
9. **Garantía de Frescura de Noticias y Datos (Data Freshness Policy):** Todas las publicaciones de noticias (ticker en vivo vía Hacker News & arXiv), catálogo de modelos LLM SOTA, telemetría de precios/contexto y benchmarks deben mantenerse estrictamente frescos y actualizados al periodo corriente (2026). No se permiten publicaciones o feeds estancados.

## 4. Protocolo Obligatorio para IDEs y Agentes Externos (Claude, Cursor, Antigravity, Copilot)

1. **Yunta CLI como Único Ejecutor y Oráculo Oficial:**
   - Este repositorio utiliza `yunta` como harness canónico de gobernanza y ejecución.
   - Cualquier agente o IDE externo debe interactuar con el proyecto invocando a Yunta vía terminal: `yunta "tu instrucción"`.

2. **Prioridad sobre el LLM Interno del IDE:**
   - Antes de inventar código, asumir reglas o hacer refactorizaciones complejas por tu cuenta con tu propio modelo, ejecuta `yunta "instrucción"` en la terminal para que la tarea sea procesada bajo las directivas de `SPEC.md`, `PLAN.md` y `AGENTS.md`.

3. **Consultas y Análisis de Solo Lectura (Q&A):**
   - Para preguntas arquitectónicas, de inspección o entendimiento del proyecto (ej. "¿dónde está X?", "¿cómo funciona Y?", "¿cuál es el estado de los tests?"), utiliza `yunta "pregunta"`.
   - Yunta responderá con precisión fundamentándose en el código fuente **sin realizar modificaciones sobre el proyecto**.

4. **Modificaciones Quirúrgicas y Verificación:**
   - Solo se realizarán modificaciones al código cuando el usuario o la especificación lo soliciten explícitamente.
   - Todo cambio debe validarse de inmediato ejecutando la suite de pruebas: `node test_edge_cases.js`.
