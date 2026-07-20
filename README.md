# PromptForge

**Advanced Prompt Analyzer** — Multidimensional evaluation, anti-pattern detection, adversarial testing and automatic prompt improvement for LLMs. 100% client-side, no backend, no build step.

![Language](https://img.shields.io/badge/JavaScript-Vanilla-f7df1e)
![Style](https://img.shields.io/badge/CSS-Vanilla-264de4)
![Build](https://img.shields.io/badge/build-none-success)
![Backend](https://img.shields.io/badge/backend-none-success)
![i18n](https://img.shields.io/badge/i18n-ES%20%2F%20EN-blue)

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Quick Start](#-quick-start)
3. [Usage Guide](#-usage-guide)
4. [How PromptForge Scores](#-how-promptforge-scores)
5. [Internationalization](#-internationalization)
6. [Technical Architecture](#-technical-architecture)
7. [Project Structure](#-project-structure)
8. [Module Public API](#-module-public-api)
9. [Export Formats](#-export-formats)
10. [Troubleshooting](#-troubleshooting)
11. [Roadmap](#-roadmap)
12. [License](#-license)

---

## 🎯 Overview

PromptForge is a web tool to **write better prompts**. It takes a prompt as text and returns:

- A **global score 0–100** with a letter grade (A+ to F), broken down across **8 dimensions**.
- **Detected anti-patterns** (catalog of 30) and **strengths** (catalog of 15).
- **10 adversarial tests** (injection, hallucination, ambiguity, edge cases…).
- An **improved version** of the prompt, rewritten with canonical XML structure.
- A persistent **history** of analyses with an evolution chart.

Everything runs in the browser with vanilla JavaScript plus Chart.js (via CDN). **No data ever leaves your machine.**

---

## 🚀 Quick Start

### Requirements
- A modern browser (Chrome, Firefox, Edge, Safari). No Node.js or installation needed.

### Running
1. Download or clone this directory.
2. Open `index.html` directly with a double-click, or serve it with any static server:

   ```bash
   # Option A: Python
   python -m http.server 8000

   # Option B: Node
   npx serve .

   # Option C: VS Code
   # Install the "Live Server" extension, then right-click > Open with Live Server
   ```

3. Visit `http://localhost:8000` (if you used a server) or use the opened file.

> ℹ️ Opening with `file://` works, but the clipboard and some modern APIs require `http(s)`. Serving it is recommended.

---

## 📖 Usage Guide

### **Analyze** view (main)

1. Type or paste your prompt in the left text area.
   - Shortcut: **Ctrl/Cmd + Enter** to analyze.
   - Buttons **Paste** (clipboard) and **Clear**.
2. Click **Analyze Prompt**.
3. In the right panel you'll see:
   - A circular **global score** (0–100) with a grade and complexity/language badges.
   - **5 result tabs**:

| Tab | Content |
|------|---------|
| **Dimensions** | 8 expandable cards (click to expand) with findings and suggestions per dimension. |
| **Radar** | Radial chart of the 8 scores. |
| **Anti-patterns** | List of detected problems with severity and suggestion, plus detected strengths. |
| **Adversarial** | Result of the 10 resilience tests (PASS / WARNING / FAIL) and overall resistance. |
| **Improve** | Rewritten prompt with XML structure, list of changes, and **Apply to Editor** / **Copy** buttons. |

### **Templates** view

Library of optimized templates, organized by category (Classification, Extraction, Generation, Analysis, Code, Agent, Evaluation). Click **Use template** to load it into the editor.

Templates use `{{variable}}` placeholders that you must replace before analyzing.

### **History** view

- List of previous analyses (persisted in `localStorage`, max 50 entries).
- Line chart of score evolution.
- For each entry: **Load into editor** and **Delete** buttons.
- Global buttons: **Export** (JSON) and **Clear** the whole history.

### Export (top-right button)

| Format | What it includes |
|--------|------------------|
| **JSON** | Full structured report (scores, dimensions, metrics, tokens, suggestions, anti-patterns). |
| **Markdown** | Readable report with ASCII score bars, tables and sections. |
| **Clipboard** | The Markdown report copied to the clipboard. |
| **Shareable link** | URL with the prompt encoded as base64 (`?p=...`). Opening it auto-loads the prompt. |

---

## 🧠 How PromptForge Scores

### The 8 dimensions (with weights)

| Dimension | Weight | What it evaluates |
|-----------|:------:|-------------------|
| **Clarity** | 18% | Action verbs, sentence structure, absence of vagueness and contradictions. |
| **Specificity** | 15% | Numeric constraints, named entities, measurable success criteria, examples. |
| **Structure** | 13% | XML, markdown headers, numbered/bulleted lists, separators, code blocks. |
| **Robustness** | 12% | Error handling, edge cases, negative examples, conditional branches. |
| **Context** | 12% | Defined role, expertise domain, audience, tone, background. |
| **Output Format** | 12% | JSON/CSV/Markdown/table, length, language, output examples, schema. |
| **Chain of Thought** | 10% | Explicit step-by-step reasoning requests, decomposition, sequence. |
| **Safety** | 8% | Anti-hallucination guardrails, scope, injection protection. |

Each dimension starts at 50 and adds/subtracts points based on positive/negative signals detected via regex. The global score is the **weighted average**.

### Grades
`A+` (≥95) · `A` (≥90) · `A-` (≥85) · `B+` (≥80) · `B` (≥75) · `B-` (≥70) · `C+` (≥65) · `C` (≥60) · `C-` (≥55) · `D+` (≥50) · `D` (≥45) · `D-` (≥40) · `F` (<40).

### Pattern catalogs

- **30 anti-patterns** (`AP001`–`AP030`) in `js/patterns.js`: from "empty prompt" to "injection vulnerability".
- **15 best practices** (`BP001`–`BP015`): XML tags, few-shot, role+domain, guardrails, etc.

### Adversarial tests (10)
`js/adversarial.js` evaluates: empty input · prompt injection · ambiguity · long inputs · unexpected language · scope creep · hallucination · format compliance · multi-turn conversation · edge cases. The **overall resistance** is the average (pass=100, warning=50, fail=0).

---

## 🌐 Internationalization

PromptForge ships with **Spanish (default)** and **English**, with a language switcher (ES/EN) in the top-right header. The selection persists in `localStorage` under the `promptforge_lang` key.

### How it works

- **Single source of truth**: every user-facing string lives in `js/i18n.js` inside the `I18n._dict` object, organized as `{ es: {…}, en: {…} }` with dotted keys (e.g. `nav.analyze`, `dimensions.clarity`, `adv.injection.passDetail`).
- **Markup binding**: HTML elements carry `data-i18n="key"` (textContent), `data-i18n-placeholder="key"` (placeholder), `data-i18n-title="key"` (tooltip) or `data-i18n-html="key"` (innerHTML). On boot and on every language change, `I18n.applyToDOM()` walks these attributes and updates the DOM.
- **Dynamic content**: JS code calls `I18n.t('key', params)` to translate strings, with `{name}` placeholder interpolation (e.g. `I18n.t('stats.words', { n: 47 })` → `"47 words"`).
- **Live switching**: `I18n.setLang(lang)` persists the choice, updates `<html lang>`, re-applies the DOM and dispatches a `langchange` event. `App` listens to it and re-renders the active view (and destroys Chart.js instances so they rebuild in the new language).
- **Initial detection**: `localStorage > navigator.language > 'es'`.

### Public i18n API

```js
I18n.init();                    // boot: pick language from storage or browser
I18n.getLang();                 // 'es' | 'en'
I18n.setLang('en');             // switch language, persist, dispatch 'langchange'
I18n.t('nav.analyze');          // → "Analyze" / "Analizar"
I18n.t('stats.words', { n: 5 }); // → "5 words" / "5 palabras"
I18n.applyToDOM(root?);         // apply translations to [data-i18n*] elements
```

### Adding a new language

1. Add the locale code to `SUPPORTED` in `js/i18n.js` (e.g. `'fr'`).
2. Add a new top-level entry `fr: { … }` in `_dict` mirroring the structure of `es`/`en`.
3. Add a button to the switcher in `index.html`:
   ```html
   <button class="lang-btn" data-lang="fr" type="button">FR</button>
   ```
4. (Optional) Extend `I18n._detectBrowser()` to map `navigator.language` to the new locale.

---

## 🏗️ Technical Architecture

### Design principles

1. **No build, no bundler, no framework.** Vanilla JavaScript loaded via `<script>` tags in order.
2. **IIFE / object-literal module pattern.** Each file exposes a global singleton (`Analyzer`, `Rewriter`, etc.) with public methods and `_private` ones.
3. **Single source of truth in the Analyzer.** Every other module consumes its output.
4. **Zero runtime dependencies** except Chart.js (CDN) for charts.
5. **Fully client-side.** History uses `localStorage`; sharing uses base64 in the URL.

### Analysis pipeline

```
 User types a prompt
         │
         ▼
 ┌─────────────────┐
 │  Analyzer       │  →  { dimensions, scores, detected, metrics, … }
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

Defined in `app.js:runAnalysis()`.

### Analyzer data contract

`Analyzer.analyze(prompt)` returns an object with two "views" of the same data:

```js
{
  // ── Rich view (for internal UI) ──
  overallScore: 61,              // 0–100
  grade: 'C',                    // 'A+'..'F'
  complexity: 'intermediate',    // 'basic' | 'intermediate' | 'advanced'
  tokenEstimate: 61,
  wordCount: 47,
  charCount: 292,
  language: 'es',                // 'es' | 'en' | 'mixed'
  dimensions: {                  // 8 dimensions, each:
    clarity: {
      score: 73,                 // 0–100
      findings: ['Uses clear action verbs...', ...],   // strings
      suggestions: ['Replace vague expressions...', ...]
    },
    specificity: { … }, structure: { … }, robustness: { … },
    context: { … }, outputFormat: { … }, chainOfThought: { … }, safety: { … }
  },
  antiPatterns: [ { id:'AP003', name, description, severity, dimension, suggestion }, … ],
  strengths:    [ { id:'BP004', name, description, dimension }, … ],

  // ── Flat view (legacy-compatible shim, derived from the above) ──
  prompt: 'You are an expert...',  // analyzed text
  scores: { clarity:73, …, overall:61 },          // for ExportUtil
  detected: { hasRole:true, hasXMLTags:false, … }, // for Rewriter
  detectedDomain: 'business',                       // for Rewriter
  metrics: { wordCount, charCount, lineCount, sentenceCount, avgWordsPerSentence, readabilityLevel, xmlSections, variableCount },
  tokens: { estimated:61, model:'~GPT tokenizer', cost:null },
  suggestions: [ { priority:'high', title, description }, … ]   // flattened
}
```

> ℹ️ The "flat view" is a **shim** added so `Rewriter` and `ExportUtil` (originally written for a different shape) keep working without a rewrite. The **source of truth** remains `dimensions`.

---

## 📁 Project Structure

```
promptforge/
├── index.html              # DOM structure, script & CSS loading
├── css/
│   └── index.css           # Full design system + language switcher styles
├── js/
│   ├── i18n.js             # Internationalization (ES/EN dictionary + API)
│   ├── patterns.js         # DB of 30 anti-patterns + 15 best practices
│   ├── analyzer.js         # 8-dimension scoring engine + legacy shim
│   ├── adversarial.js      # 10 resilience tests
│   ├── rewriter.js         # Rewrite into canonical XML
│   ├── templates.js        # Categorized template library
│   ├── history.js          # localStorage persistence + LCS diff
│   ├── charts.js           # Chart.js wrapper (radar + line)
│   ├── export.js           # JSON, Markdown, clipboard, URL sharing
│   └── app.js              # Orchestrator: UI, events, pipeline
└── README.md               # This document
```

### Load order (important)
`<script>` tags load in this order (see `index.html`) because of implicit dependencies:

```
i18n.js → patterns.js → analyzer.js → adversarial.js → rewriter.js → templates.js
       → history.js → charts.js → export.js → app.js
```

`i18n.js` loads first so every later module can call `I18n.t(...)` at definition time; `app.js` goes last because it's the orchestrator that references all the others.

---

## 🔌 Module Public API

### `Analyzer.analyze(prompt) → Object`
See the [data contract](#analyzer-data-contract). Doesn't throw; returns `_emptyResult()` for invalid input.

### `Patterns.detect(prompt) → { antiPatterns, strengths }`
Iterates over the catalogs and applies each `detect(prompt)` function. Internal `try/catch` prevents a single broken pattern from breaking everything.

### `Adversarial.runTests(prompt) → { overallResistance, tests }`
`overallResistance` is 0–100 (average). `tests` is an array of 10 results `{ name, category, status, detail, suggestion }`.

### `Rewriter.improve(prompt, analysis) → { improvedPrompt, changes, scoreImprovement }`
- `improvedPrompt`: prompt rewritten with XML sections (`<rol>`, `<contexto>`, `<tarea>`, `<formato_salida>`, `<restricciones>`, `<ejemplos>`, `<manejo_errores>`).
- `changes`: array of `{ type: 'added'|'modified'|'restructured', description }`.
- `scoreImprovement`: estimated **delta** (not the final score). Display as "+N pts".

### `History`
- `save(prompt, analysis) → entry`
- `getAll() → entry[]` (sorted desc by date)
- `getById(id)`, `delete(id)`, `clear()`
- `compare(id1, id2) → diff` (uses LCS algorithm)
- `getScoreEvolution() → [{date, score, label, id}]`
- `export() → string` (JSON), `import(jsonString) → {imported, duplicates, errors}`

Persistence: `localStorage` under the key `promptforge_history`, max 50 entries.

### `I18n`
See the [Internationalization](#internationalization) section.

### `Charts`
- `initRadar(canvasId) → Chart`, `updateRadar(scores)`
- `initHistoryChart(canvasId) → Chart`, `updateHistoryChart(dataPoints)`
- `destroy()` — releases instances

### `ExportUtil`
- `toJSON(analysis, prompt?) → string`
- `toMarkdown(analysis, prompt?) → string`
- `toClipboard(text) → Promise<boolean>`
- `downloadFile(content, filename, mimeType)`
- `generateShareURL(prompt) → string`, `parseShareURL() → string|null`

### `Templates`
- `categories` — stable category keys (`classification`, `extraction`, …)
- `getCategoryLabel(catKey)` → translated label
- `getName(tpl)`, `getDescription(tpl)`, `getTags(tpl)` → translated strings
- `getById(id)`, `getByCategory(catKey)`, `fillTemplate(templateId, variables)`

---

## 📤 Export Formats

### JSON
Includes `_meta` (generator, version, timestamp) plus every analysis field. Structure documented in the [data contract](#analyzer-data-contract).

### Markdown
Readable report with sections: *Overall Score* (with ASCII bar `█████░░░░░`), *Score Breakdown* (table), *Detected Features* (✅/❌), *Prompt Metrics* (table), *Token Estimation*, *Improvement Suggestions* (prioritized 🔴🟡🟢) and *Analyzed Prompt* (in a code block).

### Shareable URL
`?p=<base64-utf8>`. On open, `App.checkShareURL()` decodes and loads the prompt into the editor. A console warning is emitted if the URL exceeds 8000 characters.

---

## 🛠️ Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| Clipboard doesn't work under `file://` | Browsers require secure contexts (`https`/`localhost`). | Serve the app with `python -m http.server` or similar. |
| Chart.js doesn't load | CDN blocked or offline. | Check the console; you can download Chart.js locally and change the `<script>` in `index.html`. |
| History disappears on refresh | `localStorage` quota exceeded (very long prompts). | Auto-trimmed to 75%; use Export to back up. |
| Language doesn't persist | `localStorage` disabled (private mode). | Re-select on each session; nothing breaks. |
| Templates load in Spanish even in EN mode | Template prompts are LLM-bound content, not UI strings. | Translate the prompt manually after loading, or extend `templatesList.<id>` in `i18n.js`. |
| Grade circle covers the screen | (Fixed) `.score-ring` was absolutely positioned without a relative parent. | Now fixed: `.score-circle` is `position: relative`. |
| Top tabs don't switch views | (Fixed) `.view` had no `display:none` default. | Now fixed: `.view { display:none }` and `.view.active { display:block }`. |
| Findings show as "undefined" | (Fixed) JS treated `findings` as `{text}` objects when they're strings. | Now fixed in `app.js:renderDimensions`. |
| History showed "undefined / undefined" | (Fixed) `History.save` didn't store `score`/`grade`. | Now fixed: it stores them explicitly. |
| JSON export was nearly empty | (Fixed) `ExportUtil` read fields the Analyzer didn't produce. | Now fixed via the Analyzer shim + `(analysis, prompt)` signature. |
| "Estimated improvement: +95 pts" looked exaggerated | (Fixed) `scoreImprovement` returned the total score, not the delta. | Now fixed: it returns the real delta. |
| Two notifications appeared on export | (Fixed) Double toast between `app.js` and `ExportUtil`. | Now fixed: a single toast. |

---

## 🗺️ Roadmap

Candidate improvements (not implemented):

- [ ] Formal unit tests (Jest/Vitest) for Analyzer, Rewriter and Adversarial.
- [ ] Additional languages (FR, DE, PT-BR, ZH).
- [ ] Optional LLM API integration to validate the real prompt (not just heuristics).
- [ ] Side-by-side comparison of two prompts in the UI (`History.compare` already exists, unused).
- [ ] Translate template prompts per language (currently UI-only i18n).
- [ ] PWA / offline installation.

---

## 📄 License

Distributed under the **MIT License**. See the [`LICENSE`](./LICENSE) file for details.

```
MIT License

Copyright (c) 2026 j0sp0nc3
```

In short: you may use, copy, modify, merge, publish, distribute, sublicense and/or sell copies of the software, provided you include the copyright notice and this permission notice in all copies. The software is provided "as is", without any warranty.
