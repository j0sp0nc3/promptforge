# PromptForge

**Analizador de Prompts Avanzado** — Evaluación multidimensional, detección de anti-patrones, pruebas adversariales y mejora automática de prompts para LLM. 100% client-side, sin backend ni dependencias de build.

![Lenguaje](https://img.shields.io/badge/JavaScript-Vanilla-f7df1e)
![Estilo](https://img.shields.io/badge/CSS-Vanilla-264de4)
![Build](https://img.shields.io/badge/build-none-success)
![Backend](https://img.shields.io/badge/backend-none-success)

---

## 📑 Tabla de contenidos

1. [Resumen](#-resumen)
2. [Inicio rápido](#-inicio-rápido)
3. [Guía de uso](#-guía-de-uso)
4. [Cómo puntúa PromptForge](#-cómo-puntúa-promptforge)
5. [Arquitectura técnica](#-arquitectura-técnica)
6. [Estructura del proyecto](#-estructura-del-proyecto)
7. [API pública de los módulos](#-api-pública-de-los-módulos)
8. [Formatos de exportación](#-formatos-de-exportación)
9. [Solución de problemas](#-solución-de-problemas)
10. [Roadmap](#-roadmap)

---

## 🎯 Resumen

PromptForge es una herramienta web para **escribir mejores prompts**. Recibe un prompt en texto y devuelve:

- **Puntuación global 0–100** con nota (A+ a F) desglosada en **8 dimensiones**.
- **Anti-patrones detectados** (catálogo de 30) y **fortalezas** (catálogo de 15).
- **10 pruebas adversariales** (inyección, alucinación, ambigüedad, casos borde…).
- **Versión mejorada** del prompt, reescrita con estructura XML canónica.
- **Histórico** de análisis con gráfico de evolución.

Todo se ejecuta en el navegador con JavaScript vanilla + Chart.js (CDN). **Ningún dato sale del equipo.**

---

## 🚀 Inicio rápido

### Requisitos
- Un navegador moderno (Chrome, Firefox, Edge, Safari). No requiere Node.js ni instalación.

### Ejecución
1. Descarga o clona este directorio.
2. Abre `index.html` directamente con doble clic, o sírvelo con cualquier servidor estático:

   ```bash
   # Opción A: Python
   python -m http.server 8000

   # Opción B: Node
   npx serve .

   # Opción C: VS Code
   # Instala la extensión "Live Server" y haz clic derecho > Open with Live Server
   ```

3. Visita `http://localhost:8000` (si usaste servidor) o usa el archivo abierto.

> ℹ️ Abrir con `file://` funciona, pero el portapapeles y algunas APIs modernas requieren `http(s)`. Recomendado servirlo.

---

## 📖 Guía de uso

### Vista **Analizar** (principal)

1. Escribe o pega tu prompt en el área de texto izquierda.
   - Atajo: **Ctrl/Cmd + Enter** para analizar.
   - Botones **Pegar** (portapapeles) y **Limpiar**.
2. Pulsa **Analizar Prompt**.
3. En el panel derecho verás:
   - **Círculo de puntuación global** (0–100) con nota y badges de complejidad e idioma.
   - **5 pestañas** de resultados:

| Pestaña | Contenido |
|---------|-----------|
| **Dimensiones** | 8 tarjetas desplegables (clic para expandir) con hallazgos y sugerencias por dimensión. |
| **Radar** | Gráfico radial de las 8 puntuaciones. |
| **Anti-patrones** | Lista de problemas detectados con severidad y sugerencia, más fortalezas detectadas. |
| **Adversarial** | Resultado de las 10 pruebas de resiliencia (PASA / ADVERTENCIA / FALLA) y resistencia global. |
| **Mejora** | Prompt reescrito con estructura XML, lista de cambios y botones **Aplicar al editor** / **Copiar**. |

### Vista **Templates**

Biblioteca de plantillas optimizadas, organizadas por categoría (Clasificación, Extracción, Generación, Análisis, Código, Agente, Evaluación). Haz clic en **Usar template** para cargarlo en el editor.

Las plantillas usan marcadores `{{variable}}` que debes reemplazar antes de analizar.

### Vista **Historial**

- Lista de análisis previos (persistente en `localStorage`, máx. 50 entradas).
- Gráfico de línea con la evolución de la puntuación.
- Por cada entrada: botones **Cargar en editor** y **Eliminar**.
- Botones globales **Exportar** (JSON) y **Limpiar** todo el historial.

### Exportar (botón superior derecho)

| Formato | Qué incluye |
|---------|-------------|
| **JSON** | Reporte completo estructurado (scores, dimensiones, métricas, tokens, sugerencias, anti-patrones). |
| **Markdown** | Reporte legible con barras de puntuación ASCII, tablas y secciones. |
| **Portapapeles** | El reporte Markdown copiado al portapapeles. |
| **Enlace compartible** | URL con el prompt codificado en base64 (`?p=...`). Al abrirla, el prompt se carga automáticamente. |

---

## 🧠 Cómo puntúa PromptForge

### Las 8 dimensiones (con pesos)

| Dimensión | Peso | Qué evalúa |
|-----------|:----:|------------|
| **Claridad** | 18% | Verbos de acción, estructura de oraciones, ausencia de vaguedades y contradicciones. |
| **Especificidad** | 15% | Restricciones numéricas, entidades nombradas, criterios de éxito medibles, ejemplos. |
| **Estructura** | 13% | XML, encabezados markdown, listas numeradas/viñetas, separadores, bloques de código. |
| **Robustez** | 12% | Manejo de errores, casos borde, ejemplos negativos, ramas condicionales. |
| **Contexto** | 12% | Rol definido, dominio de expertise, audiencia, tono, antecedentes. |
| **Formato de salida** | 12% | JSON/CSV/Markdown/tabla, longitud, idioma, ejemplos de salida, esquema. |
| **Chain of Thought** | 10% | Solicitudes explícitas de razonamiento paso a paso, descomposición, secuencia. |
| **Seguridad** | 8% | Guardrails anti-alucinación, alcance, protección contra inyección. |

Cada dimensión arranca en 50 y suma/resta puntos según señales positivas/negativas detectadas por regex. La puntuación global es el **promedio ponderado**.

### Notas (grade)
`A+` (≥95) · `A` (≥90) · `A-` (≥85) · `B+` (≥80) · `B` (≥75) · `B-` (≥70) · `C+` (≥65) · `C` (≥60) · `C-` (≥55) · `D+` (≥50) · `D` (≥45) · `D-` (≥40) · `F` (<40).

### Catálogos de patrones

- **30 anti-patrones** (`AP001`–`AP030`) en `js/patterns.js`: desde "prompt vacío" hasta "vulnerabilidad a inyección".
- **15 buenas prácticas** (`BP001`–`BP015`): XML tags, few-shot, rol+dominio, guardrails, etc.

### Pruebas adversariales (10)
`js/adversarial.js` evalúa: entrada vacía · inyección de prompt · ambigüedad · entradas extensas · idioma inesperado · scope creep · alucinación · cumplimiento de formato · conversación multi-turno · casos borde. La **resistencia global** es el promedio (pass=100, warning=50, fail=0).

---

## 🏗️ Arquitectura técnica

### Principios de diseño

1. **Sin build, sin bundler, sin framework.** JavaScript vanilla ES5-compatible cargado por etiquetas `<script>` en orden.
2. **Patrón módulo IIFE/objeto literal.** Cada archivo expone un singleton global (`Analyzer`, `Rewriter`, etc.) con métodos públicos y `_private`.
3. **Single source of truth en el Analyzer.** Todos los demás módulos consumen su salida.
4. **Cero dependencias en runtime** salvo Chart.js (CDN) para los gráficos.
5. **Todo client-side.** El historial usa `localStorage`; el compartir, base64 en URL.

### Pipeline de análisis

```
 Usuario escribe prompt
         │
         ▼
 ┌─────────────────┐
 │  Analyzer       │  →  { dimensions, scores, detected, metrics, ... }
 │  .analyze()     │
 └────────┬────────┘
          │
   ┌──────┴──────┬─────────────┬──────────────┐
   ▼             ▼             ▼              ▼
 Patterns     Adversarial   Rewriter      History
 .detect()    .runTests()   .improve()    .save()
   │             │             │              │
   └─────────────┴─────────────┘              │
                 │                            │
                 ▼                            │
           renderResults()  ◄─────────────────┘
           (app.js)
```

Detallado en `app.js:runAnalysis()` (líneas ~90–132).

### Contrato de datos del Analyzer

`Analyzer.analyze(prompt)` devuelve un objeto con dos "vistas" de los mismos datos:

```js
{
  // ── Vista rica (para UI interna) ──
  overallScore: 61,              // 0–100
  grade: 'C',                    // 'A+'..'F'
  complexity: 'intermedio',      // 'básico' | 'intermedio' | 'avanzado'
  tokenEstimate: 61,
  wordCount: 47,
  charCount: 292,
  language: 'es',                // 'es' | 'en' | 'mixed'
  dimensions: {                  // 8 dimensiones, cada una:
    clarity: {
      score: 73,                 // 0–100
      findings: ['Usa verbos...', ...],   // strings
      suggestions: ['Reemplaza...', ...]  // strings
    },
    specificity: { ... }, structure: { ... }, robustness: { ... },
    context: { ... }, outputFormat: { ... }, chainOfThought: { ... }, safety: { ... }
  },
  antiPatterns: [ { id:'AP003', name, description, severity, dimension, suggestion }, ... ],
  strengths:    [ { id:'BP004', name, description, dimension }, ... ],

  // ── Vista plana (shim legacy-compatible, derivada de lo anterior) ──
  prompt: 'Eres un experto...',  // texto analizado
  scores: { clarity:73, ..., overall:61 },          // para ExportUtil
  detected: { hasRole:true, hasXMLTags:false, ... }, // para Rewriter
  detectedDomain: 'negocio',                         // para Rewriter
  metrics: { wordCount, charCount, lineCount, sentenceCount, avgWordsPerSentence, readabilityLevel, xmlSections, variableCount },
  tokens: { estimated:61, model:'~GPT tokenizer', cost:null },
  suggestions: [ { priority:'alta', title, description }, ... ]   // aplanado
}
```

> ℹ️ La "vista plana" es un **shim** que se añadió para que `Rewriter` y `ExportUtil` (escritos originalmente para un shape distinto) funcionen sin reescribirlos. La **fuente de verdad** sigue siendo `dimensions`.

---

## 📁 Estructura del proyecto

```
promptforge/
├── index.html              # Estructura del DOM, carga de scripts y CSS
├── css/
│   └── index.css           # Design system completo (~1300 líneas)
├── js/
│   ├── patterns.js         # BD de 30 anti-patrones + 15 buenas prácticas
│   ├── analyzer.js         # Motor de scoring por 8 dimensiones + shim legacy
│   ├── adversarial.js      # 10 pruebas de resiliencia
│   ├── rewriter.js         # Reescritura a XML canónico
│   ├── templates.js        # Biblioteca de plantillas categorizadas
│   ├── history.js          # Persistencia localStorage + diff LCS
│   ├── charts.js           # Wrapper de Chart.js (radar + línea)
│   ├── export.js           # JSON, Markdown, portapapeles, URL sharing
│   └── app.js              # Orquestador: UI, eventos, pipeline
└── README.md               # Este documento
```

### Orden de carga (importante)
Los `<script>` se cargan en este orden (ver `index.html:312-320`) porque hay dependencias implícitas:

```
patterns.js → analyzer.js → adversarial.js → rewriter.js → templates.js
          → history.js → charts.js → export.js → app.js
```

`app.js` debe ir el último porque es el orquestador que referencia a todos los demás.

---

## 🔌 API pública de los módulos

### `Analyzer.analyze(prompt) → Object`
Ver [Contrato de datos](#contrato-de-datos-del-analyzer). No lanza; devuelve `_emptyResult()` para input inválido.

### `Patterns.detect(prompt) → { antiPatterns, strengths }`
Itera sobre los catálogos y aplica cada función `detect(prompt)`. Los `try/catch` internos evitan que un patrón roco rompa todo.

### `Adversarial.runTests(prompt) → { overallResistance, tests }`
`overallResistance` es 0–100 (promedio). `tests` es un array de 10 resultados `{ name, category, status, detail, suggestion }`.

### `Rewriter.improve(prompt, analysis) → { improvedPrompt, changes, scoreImprovement }`
- `improvedPrompt`: prompt reescrito con secciones XML (`<rol>`, `<contexto>`, `<tarea>`, `<formato_salida>`, `<restricciones>`, `<ejemplos>`, `<manejo_errores>`).
- `changes`: array de `{ type: 'added'|'modified'|'restructured', description }`.
- `scoreImprovement`: **delta** estimado (no la puntuación final). Mostrar como "+N pts".

### `History`
- `save(prompt, analysis) → entry`
- `getAll() → entry[]` (ordenado desc por fecha)
- `getById(id)`, `delete(id)`, `clear()`
- `compare(id1, id2) → diff` (usa algoritmo LCS)
- `getScoreEvolution() → [{date, score, label, id}]`
- `export() → string` (JSON), `import(jsonString) → {imported, duplicates, errors}`

Persistencia: `localStorage` con clave `promptforge_history`, máximo 50 entradas.

### `Charts`
- `initRadar(canvasId) → Chart`, `updateRadar(scores)`
- `initHistoryChart(canvasId) → Chart`, `updateHistoryChart(dataPoints)`
- `destroy()` — libera instancias

### `ExportUtil`
- `toJSON(analysis, prompt?) → string`
- `toMarkdown(analysis, prompt?) → string`
- `toClipboard(text) → Promise<boolean>`
- `downloadFile(content, filename, mimeType)`
- `generateShareURL(prompt) → string`, `parseShareURL() → string|null`

---

## 📤 Formatos de exportación

### JSON
Incluye `_meta` (generador, versión, timestamp) más todos los campos del análisis. Estructura documentada en [Contrato de datos](#contrato-de-datos-del-analyzer).

### Markdown
Reporte legible con secciones: *Puntuación General* (con barra ASCII `█████░░░░░`), *Desglose de Puntuación* (tabla), *Características Detectadas* (✅/❌), *Métricas del Prompt* (tabla), *Estimación de Tokens*, *Sugerencias de Mejora* (priorizadas 🔴🟡🟢) y *Prompt Analizado* (en bloque de código).

### URL compartible
`?p=<base64-utf8>`. Al abrir la URL, `App.checkShareURL()` decodifica y carga el prompt en el editor. Advertencia en consola si la URL supera los 8000 caracteres.

---

## 🛠️ Solución de problemas

| Síntoma | Causa | Solución |
|---------|-------|----------|
| El círculo de score tapa toda la pantalla | (Corregido) El `.score-ring` estaba en `position:absolute` sin contenedor `relative`. | Ya fixed: `.score-circle` ahora es `position: relative`. |
| Las pestañas superiores no cambian la vista | (Corregido) `.view` no tenía `display:none` por defecto, las 3 vistas se renderizaban a la vez. | Ya fixed: `.view { display:none }` y `.view.active { display:block }`. |
| Los hallazgos de dimensiones aparecían como "undefined" | (Corregido) El JS trataba los `findings` como objetos `{text}` cuando son strings. | Ya fixed en `app.js:renderDimensions`. |
| El historial muestra "undefined / undefined" | (Corregido) `History.save` no guardaba `score`/`grade`. | Ya fixed: ahora los guarda explícitamente. |
| Exportar JSON salía casi vacío | (Corregido) `ExportUtil` leía campos que el Analyzer no producía. | Ya fixed vía shim del Analyzer + firma `(analysis, prompt)`. |
| "Mejora estimada: +95 pts" parecía exagerado | (Corregido) `scoreImprovement` devolvía la puntuación total, no el delta. | Ya fixed: ahora devuelve el delta real. |
| Aparecían dos notificaciones al exportar | (Corregido) Doble toast entre `app.js` y `ExportUtil`. | Ya fixed: un solo toast. |
| El portapapeles no funciona con `file://` | Los navegadores exigen contextos seguros (`https`/`localhost`). | Sirve la app con `python -m http.server` o similar. |
| Chart.js no carga | Bloqueo del CDN o sin conexión. | Verifica la consola; puedes descargar Chart.js localmente y cambiar el `<script>` en `index.html`. |
| El historial desaparece al refrescar | Cuota de `localStorage` excedida (prompts muy largos). | Se recorta al 75% automáticamente; usa Exportar para respaldar. |

---

## 🗺️ Roadmap

Mejoras candidatas (no implementadas):

- [ ] Tests unitarios formales (Jest/Vitest) para Analyzer, Rewriter y Adversarial.
- [ ] Soporte para temas claro/oscuro (toggle).
- [ ] Integración opcional con una API de LLM para validar el prompt real (no solo heurísticas).
- [ ] Comparación lado-a-lado de dos prompts en la UI (ya existe `History.compare` sin usar).
- [ ] Internacionalización (la UI está en español; las regex ya son bilingües EN/ES).
- [ ] PWA / instalación offline.

---

## 📄 Licencia

Distribuido bajo la **Licencia MIT**. Consulta el archivo [`LICENSE`](./LICENSE) para más detalles.

```
MIT License

Copyright (c) 2026 j0sp0nc3
```

En resumen: puedes usar, copiar, modificar, fusionar, publicar, distribuir, sublicenciar y/o vender copias del software, siempre que incluyas el aviso de copyright y este aviso de permiso en todas las copias. El software se proporciona "tal cual", sin garantía de ningún tipo.
