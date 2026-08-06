# Promptometer

**Advanced Prompt Engineering & Evaluation Suite** — Multidimensional scoring, anti-pattern detection, adversarial security testing, automatic prompt improvement, and multi-language engine bindings.


![Language](https://img.shields.io/badge/JavaScript-Vanilla%20%2F%20Node.js-f7df1e)
![Python](https://img.shields.io/badge/Python-Native%20Zero--Dep-3776ab)
![API](https://img.shields.io/badge/REST%20API-HTTP%2FJSON-green)
![Design](https://img.shields.io/badge/UI-Editorial%20Technical-C73E2D)
![i18n](https://img.shields.io/badge/i18n-ES%20%2F%20EN-blue)

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Quick Start](#-quick-start)
3. [Editorial Technical Design System](#-editorial-technical-design-system)
4. [Multi-Language Core Libraries](#-multi-language-core-libraries)
   - [JavaScript / Node.js (`promptometer-core`)](#1-javascript--nodejs-promptometer-core)
   - [Python Native (`promptometer-core`)](#2-python-native-promptometer-core)
   - [REST API Microservice (`server.js`)](#3-universal-rest-api-microservice-serverjs)
   - [Command Line Interface (`cli.js`)](#4-command-line-interface-clijs)
5. [Stress & Edge Case Testing Suite](#-stress--edge-case-testing-suite)
6. [How Promptometer Scores](#-how-promptometer-scores)
7. [Project Structure](#-project-structure)
8. [License](#-license)

---

## 🎯 Overview

Promptometer is a complete professional workspace and engine to **evaluate, benchmark, and optimize prompts for LLMs**. It provides:

- **Multidimensional Score (0–100)** with letter grades (A to F) across **8 dimensions**.
- **Anti-Pattern Catalog** (30 anti-patterns) & **Best Practices** (15 strengths).
- **Adversarial Security Suite** (jailbreak resistance, prompt exfiltration, hallucination mitigation).
- **Non-Destructive XML Rewriter** preserving user context with a Before vs After impact analysis.
- **Standalone Core Libraries** for Web, Node.js, Python, REST APIs, and CLI.

---

## 🚀 Quick Start

### Web App (Zero Setup)
1. Double-click `index.html` or serve with any static server:
   ```bash
   python -m http.server 8000
   ```
2. Open `http://localhost:8000` in your browser.

### Stress Test Console
Run the automated edge-case suites from the terminal:
```bash
npm test          # Node.js runner (test_edge_cases.js)
python test_edge_cases.py   # Python runner
```

---

## 🎨 Editorial Technical Design System

The application uses a custom high-end UI designed for clarity and precision reading (inspired by editorial publications and technical journals):
- **Base Palette:** Warm Cream (`#F7F3EC`), Ink (`#1A1612`), Vermilion accent (`#C73E2D`).
- **Typography:** `Fraunces` serif for headings and identity, `Inter` for UI body, `IBM Plex Mono` for data/code only.
- **Layout:** Thin 1px rules for separation (no glassmorphism, no glow), generous whitespace, structured columns.

---

## 📦 Multi-Language Core Libraries

The evaluation engine is decoupled from the UI and published as a standalone package ([`promptometer-core`](https://github.com/j0sp0nc3/promptometer)) with JS/Python parity:

### 1. JavaScript / Node.js (`promptometer-core`)
Zero-dependency UMD / ESM / CommonJS build:
```bash
npm install promptometer-core
```
```javascript
const { analyze } = require('promptometer-core');

const analysis = analyze("Your prompt text here...");
console.log(analysis.overallScore, analysis.grade);
```

### 2. Python Native (`promptometer-core`)
Pure Python (zero dependencies) for FastAPI, Django, Flask, LangChain, or LlamaIndex:
```bash
pip install promptometer-core
```
```python
from promptometer_core import PromptometerCore

analysis = PromptometerCore().analyze("Your prompt text here...")
print("Score:", analysis["overallScore"], "Grade:", analysis["grade"])
```

### 3. Universal REST API Microservice (`server.js`)
Native Node.js HTTP server. Consumable from C#, Java, Go, Rust, PHP, or Ruby via HTTP POST:
```bash
node server.js
```
```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Act as an expert developer. Output JSON."}'
```

### 4. Command Line Interface (`cli.js`)
Evaluate prompts directly from the system terminal:
```bash
node cli.js "Your prompt here"
```

---

## 🧪 Stress & Edge Case Testing Suite

Promptometer includes automated test runners to verify engine stability against malformed and extreme inputs:
- **`test_edge_cases.js`**: Automated Node.js runner.
- **`test_edge_cases.py`**: Automated Python runner.

Both cover **14/14 edge-case vectors** with identical results across JS and Python.

### Edge Case Vectors Covered (14/14):
1. Empty string & whitespace
2. Non-string inputs (`null` / `undefined`)
3. Massive prompts (50,000+ characters)
4. Regex poisoning & special characters (`([.*+?^${}()|[\]\\])*`)
5. Unclosed and malformed XML tags (`<rol><contexto>...`)
6. HTML/XSS code injection
7. Emojis and multi-byte UTF-8
8. Non-Latin scripts (Chinese, Cyrillic, Arabic)
9. Keyword stuffing / anti-gaming validation

---

## 🧠 How Promptometer Scores

### 8 Dimension Weights
Weights are dynamic: the engine infers the prompt type (system, few-shot, chain-of-thought, or general) and adjusts each dimension's weight accordingly.

| Dimension | Default Weight | Focus Area |
| :--- | :---: | :--- |
| **Clarity** | 18% | Action verbs, absence of vagueness and contradictions |
| **Specificity** | 15% | Measurable constraints, quantitative criteria |
| **Structure** | 13% | XML tags, markdown headers, bullet/numbered lists |
| **Robustness** | 12% | Error handling, edge cases, fallback instructions |
| **Context** | 12% | Expert role, domain definition, target audience |
| **Output Format** | 12% | Explicit format (JSON, Table), length constraints |
| **Chain of Thought** | 10% | Step-by-step reasoning instructions |
| **Safety** | 8% | Anti-hallucination guardrails and scope limits |

---

## 📁 Project Structure

```
promptforge/                    # This repo — the web app
├── index.html                  # Main Workbench Web App
├── css/
│   └── index.css               # Editorial Technical Design System
├── js/
│   ├── i18n.js                 # Internationalization Engine (ES/EN)
│   ├── signals.js              # Single Source of Truth Signal Extractor
│   ├── patterns.js             # Catalog of 30 Anti-Patterns & 15 Strengths
│   ├── analyzer.js             # 8-Dimension Scoring Engine
│   ├── adversarial.js          # Security & Resilience Simulator
│   ├── rewriter.js             # Non-Destructive XML Rewriter
│   ├── templates.js            # Optimized Template Library
│   ├── history.js              # Persistence & Evolution Charts
│   ├── charts.js               # Chart.js Radar & Line Wrapper
│   ├── export.js               # JSON, Markdown, & URL Exporters
│   └── app.js                  # Main UI Orchestrator
├── api/
│   └── index.js                # Vercel Serverless API wrapper
├── server.js                   # REST API Microservice (Port 3000)
├── cli.js                      # Node Terminal Executable
├── test_edge_cases.js          # JS Test Suite Runner
├── test_edge_cases.py          # Python Test Suite Runner
├── vercel.json                 # Deployment config (static + serverless)
└── README.md                   # This file
```

The evaluation engine lives in a separate repo: **[j0sp0nc3/promptometer](https://github.com/j0sp0nc3/promptometer)** (`packages/core/`), consumed here via `npm i promptometer-core` with a local fallback for development.

---

## 📄 License

Distributed under the **MIT License**. Copyright (c) 2026.
