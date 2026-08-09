# Plan de Implementación: Sistema Solar 3D en Three.js para la Constelación 8D

- [x] **Fase 1: Preparación y Carga de Three.js**
  - Cargar `three.min.js` y `OrbitControls.js` de forma eficiente (vía CDN con fallback local) en `index.html`.
  - Configurar el contenedor Canvas 3D `#constellation-3d-canvas` dentro de `.orbital-constellation-container`.

- [x] **Fase 2: Motor del Sistema Solar 3D (`js/constellation3d.js`)**
  - Crear la escena Three.js con sol emisor central, 8 órbitas concéntricas inclinadas en 3D, y 8 planetas/geometrias 3D (icosaedro, octaedro, toros, etc.).
  - Implementar rotación orbital continua en 3D, interacciones `OrbitControls` y `Raycaster` con tooltips flotantes al pasar el mouse.

- [x] **Fase 3: Integración de Scoring Dinámico y Temas (Luna 🌙 / Black Hole 🕳️)**
  - Mapear las puntuaciones de las 8 dimensiones a los radios, colores espectrales y pulsos de los 8 nodos 3D.
  - Eliminar el cuadro/borde rectangular HTML del centro (`.central-score-box`) para que la puntuación `PROMPT SCORE` flote de forma orgánica e integrada directamente en el núcleo del Sol 3D.
  - Sincronizar el cambio de tema en tiempo real (crema/vermellón en Modo Luna 🌙 vs espacial/neón en Modo Black Hole 🕳️).

- [x] **Fase 4: Verificación y Pruebas Locales (Cero Pushes)**
  - Ejecutar `node test_edge_cases.js` (22/22 PASS).
  - Verificar fluidez y renderizado visual en local (`http://localhost:3001`).
  - Documentar avances en `tasks/todo.md` y `HANDOFF.md` antes de solicitar la aprobación del usuario.
