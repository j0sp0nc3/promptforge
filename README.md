# Promptometer & Promptometer

**Advanced Prompt Engineering & Evaluation Suite** — Multidimensional scoring, anti-pattern detection, adversarial security testing, automatic prompt improvement, and multi-language engine bindings.


![Language](https://img.shields.io/badge/JavaScript-Vanilla%20%2F%20Node.js-f7df1e)
![Python](https://img.shields.io/badge/Python-Native%20Zero--Dep-3776ab)
![API](https://img.shields.io/badge/REST%20API-HTTP%2FJSON-green)
![Design](https://img.shields.io/badge/UI-Obsidian%20%26%20Amber%20Studio-ffb703)
![i18n](https://img.shields.io/badge/i18n-ES%20%2F%20EN-blue)

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Quick Start](#-quick-start)
3. [Studio Obsidian Design System](#-studio-obsidian-design-system)
4. [Multi-Language Core Libraries](#-multi-language-core-libraries)
   - [JavaScript / Node.js (`promptometer-core.js`)](#1-javascript--nodejs-libpromptometer-corejs)
   - [Python Native (`promptometer_core.py`)](#2-python-native-libpromptometer_corepy)
   - [REST API Microservice (`server.js`)](#3-universal-rest-api-microservice-serverjs)
   - [Declarative JSON Rules (`promptometer-rules.json`)](#4-declarative-rules-libpromptometer-rulesjson)
   - [Command Line Interface (`cli.js`)](#5-command-line-interface-clijs)
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
Open `test_runner.html` in your browser and click **🚀 Run Test Suite** to execute 14 real-time edge case & stress vector tests.

---

## 🎨 Studio Obsidian Design System

The application features a custom high-end UI inspired by engineering workbenches (Linear, Raycast, Vercel Studio):
- **Base Palette:** Deep Obsidian (`#08090e`), Charcoal Surface (`#0f111a`), Electric Amber (`#ffb703`), and Quality Emerald (`#10b981`).
- **Typography:** Dual setup with `JetBrains Mono` for telemetry/code and `Inter` for micro-caps UI labels.
- **Bento Grid:** Modular dashboard grouping the score ring, telemetry radar, dimension list, and security badges.

---

## 📦 Multi-Language Core Libraries

The evaluation engine is decoupled from the UI and exported into standalone modules for any tech stack:

### 1. JavaScript / Node.js (`lib/promptometer-core.js`)
Zero-dependency UMD / ESM / CommonJS build:
```javascript
const PromptometerCore = require('./lib/promptometer-core.js');

const analysis = PromptometerCore.analyze("Your prompt text here...");
console.log(analysis.overallScore, analysis.grade);
```

### 2. Python Native (`lib/promptometer_core.py`)
Pure Python (zero dependencies) for FastAPI, Django, Flask, LangChain, or LlamaIndex:
```python
import sys
sys.path.append('./lib')
import promptometer_core

analysis = promptometer_core.analyze("Your prompt text here...")
print("Score:", analysis["overall_score"], "Grade:", analysis["grade"])
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

### 4. Declarative Rules (`lib/promptometer-rules.json`)
Agnostic JSON specification defining regexes, anti-patterns, and dimension weights for cross-platform engines.

### 5. Command Line Interface (`cli.js`)
Evaluate prompts directly from the system terminal:
```bash
node cli.js "Your prompt here"
```

---

## 🧪 Stress & Edge Case Testing Suite

Promptometer includes automated test runners to verify engine stability against malformed and extreme inputs:
- **`test_runner.html`**: Interactive web test runner console.
- **`test_edge_cases.js`**: Automated Node.js runner.
- **`test_edge_cases.py`**: Automated Python runner.

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
| Dimension | Weight | Focus Area |
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
promptometer/
├── index.html                # Main Workbench Web App
├── test_runner.html          # Interactive Web Stress Test Console
├── css/
│   └── index.css             # Studio Obsidian Design System
├── js/
│   ├── i18n.js               # Internationalization Engine (ES/EN)
│   ├── signals.js            # Single Source of Truth Signal Extractor
│   ├── patterns.js           # Catalog of 30 Anti-Patterns & 15 Strengths
│   ├── analyzer.js           # 8-Dimension Scoring Engine
│   ├── adversarial.js        # Security & Resilience Simulator
│   ├── rewriter.js           # Non-Destructive XML Rewriter
│   ├── templates.js          # Optimized Template Library
│   ├── history.js            # Persistence & Evolution Charts
│   ├── charts.js             # Chart.js Radar & Line Wrapper
│   ├── export.js             # JSON, Markdown, & URL Exporters
│   └── app.js                # Main UI Orchestrator
├── lib/
│   ├── promptometer-core.js   # Universal JS UMD/ESM/CJS Engine
│   ├── promptometer_core.py   # Native Python Engine (Zero-Dep)
│   └── promptometer-rules.json # Declarative Engine Specification
├── server.js                 # REST API Microservice (Port 3000)
├── cli.js                    # Node Terminal Executable
├── test_edge_cases.js        # JS Test Suite Runner
├── test_edge_cases.py        # Python Test Suite Runner
└── README.md                 # Complete Project Documentation
```

---

## 📄 License

Distributed under the **MIT License**. Copyright (c) 2026.
