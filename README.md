# Promptometer

**Advanced Prompt Engineering & Evaluation Suite** — Multidimensional scoring, anti-pattern detection, adversarial security testing, interactive knowledge hub, automatic prompt improvement, and multi-language engine bindings.

![Language](https://img.shields.io/badge/JavaScript-Vanilla%20%2F%20Node.js-f7df1e)
![Python](https://img.shields.io/badge/Python-Native%20Zero--Dep-3776ab)
![API](https://img.shields.io/badge/REST%20API-Secured%20%2F%20Authenticated-green)
![Design](https://img.shields.io/badge/UI-Editorial%20Technical-C73E2D)
![i18n](https://img.shields.io/badge/i18n-ES%20%2F%20EN-blue)

---

## 📑 Table of Contents

1. [Overview](#-overview)
2. [Quick Start](#-quick-start)
3. [Editorial Technical Design System](#-editorial-technical-design-system)
4. [Knowledge Hub (Educational Suite)](#-knowledge-hub-educational-suite)
5. [API Security & Authentication](#-api-security--authentication)
6. [Multi-Language Core Libraries](#-multi-language-core-libraries)
   - [JavaScript / Node.js (`promptometer-core`)](#1-javascript--nodejs-promptometer-core)
   - [Python Native (`promptometer-core`)](#2-python-native-promptometer-core)
   - [REST API Microservice (`server.js` / Vercel)](#3-universal-rest-api-microservice-serverjs--vercel)
   - [Command Line Interface (`cli.js`)](#4-command-line-interface-clijs)
7. [Stress & Edge Case Testing Suite](#-stress--edge-case-testing-suite)
8. [How Promptometer Scores](#-how-promptometer-scores)
9. [Project Structure](#-project-structure)
10. [Author & License](#-author--license)

---

## 🎯 Overview

Promptometer is a complete professional workspace and engine to **evaluate, benchmark, learn, and optimize prompts for LLMs**. It provides:

- **Multidimensional Score (0–100)** with letter grades (A to F) across **8 dimensions**.
- **Anti-Pattern Catalog** (34 anti-patterns) & **Best Practices** (15 strengths) with expandable `<details>` accordions.
- **Adversarial Security Suite** (13 security tests: jailbreak resistance, prompt exfiltration, hallucination mitigation, etc.).
- **Interactive Knowledge Hub** with a 20-term bilingual glossary, 13 prompting techniques (including CoVe, SoT, Hi-CoT), 6 structural frameworks (including CO-STAR and Bento-Box), 11 curated research references, and full-text real-time search.
- **Top 10 Hall of Fame Leaderboard** with zero-login global API sync (`/api/leaderboard`), instant URL sharing (`?p=base64`), 10 elite seed prompts (94–99/100), and interactive "Analyze & Try" buttons.
- **Non-Destructive XML Rewriter** preserving user context with a Before vs After impact analysis.
- **Production REST API & CLI** with API Key authentication, strict CORS, rate limiting, and 100 KB payload protection.

---

## 🚀 Quick Start

### Live Web Application
Try the live app immediately: **[https://promptforge-beta-ten.vercel.app/](https://promptforge-beta-ten.vercel.app/)**

### Local Web App (Zero Setup)
1. Clone the repository and serve static files:
   ```bash
   python -m http.server 8000
   # OR
   node server.js
   ```
2. Open `http://localhost:8000` or `http://localhost:3000` in your browser.

### Stress Test Console
Run the automated edge-case suites from the terminal:
```bash
npm test                      # Node.js runner (test_edge_cases.js)
python test_edge_cases.py     # Python runner
```

---

## 🎨 Editorial Technical Design System

The application uses a custom high-end UI designed for clarity and precision reading (inspired by editorial publications and technical journals):
- **Base Palette:** Warm Cream (`#F7F3EC`), Warm Ink (`#1A1612`), Vermilion accent (`#C73E2D`).
- **Typography:** `Fraunces` serif for headings and identity, `Inter` for UI body, `IBM Plex Mono` for data/code only.
- **Iconography & Favicon:** Custom vector SVG calibration gauge icon in vermilion and cream.
- **Layout:** Thin 1px rules for separation (no glassmorphism, no neon glow), generous whitespace, structured columns.

---

## 📚 Knowledge Hub & Leaderboard

The **Learn ("Aprender")** and **Top 10** tabs provide an interactive educational suite:

- **Bilingual Glossary (20 Terms):** Tokenization, Temperature, Top-p, Context Window, System/User/Assistant messages, Embeddings, Vector Stores, Fine-tuning, Grounding, Few-shot/Zero-shot, Chain of Thought, Prompt Injection, LLM-as-a-Judge, In-Context Learning, Delimiters, etc.
- **13 Prompting Techniques:** ReAct, Tree of Thought, Self-Consistency, Reflexion, Zero-shot, Metaprompting, Chain of Verification (CoVe), Skeleton-of-Thought (SoT), Hierarchical CoT (Hi-CoT), Few-shot, CoT, RAG, and Role Prompting — with one-click **"Analyze"** buttons that load example prompts directly into the editor.
- **6 Structural Frameworks:** RTF (Role-Task-Format), CRISPE, RACE, CO-STAR (GovTech Singapore), Bento-Box Modular Architecture, and native 7-section XML Anatomy.
- **Top-Level Radar IA Tab (`#nav-radar` & `#view-radar`):** Primary navigation tab uniting 12 curated AI Creators (Riley Goodside, Andrej Karpathy, Lilian Weng, swyx, Anthropic Research, Harrison Chase, etc.) and 11 Research References & Guides with sub-nav switching and community suggestion modal.
- **Live AI News Ticker (`#news-ticker-bar`):** Infinite marquee header bar displaying real-time updates, papers, jailbreak discoveries, and new videos from top AI creators with pause-on-hover.
- **Top 10 Hall of Fame (`js/leaderboard.js` & `/api/leaderboard`):** Global community ranking with zero-login API sync, gold/silver/bronze badges, submission modal, and "Analyze & Try" buttons.
- **Unified Expandable Library:** Browse 34 anti-patterns, 15 best practices, and 13 adversarial tests as expandable accordions displaying dimension, description, and suggestions.
- **Real-Time Interactive Search:** Search bar filtering all terms, techniques, frameworks, references, and library entries dynamically as you type.

---

## 🔒 API Security & Authentication

The REST API endpoints (`/api/analyze`, `/api/improve`, `/api/adversarial`) are fortified for production:

1. **API Key Authentication:**
   - External requests require an `x-api-key` header or `Authorization: Bearer <key>`.
   - Configurable via `PROMPTOMETER_API_KEY` in environment variables (no hardcoded secrets in source code).
2. **Strict Domain CORS Policy:**
   - Restricted to official web UI origins (`https://promptforge-beta-ten.vercel.app`, `https://promptometer.is-a.dev`, `localhost`).
3. **Payload Size Limit:**
   - Hard cap of **100 KB** per request body (returns `413 Payload Too Large` if exceeded).
4. **Rate Limiting:**
   - Throttled to **30 requests/minute per IP** (returns `429 Too Many Requests` if exceeded).
5. **OWASP Security Headers:**
   - `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`.

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

### 3. Universal REST API Microservice (`server.js` / Vercel)
Native Node.js HTTP server or Vercel Serverless Function:
```bash
# External API request with API Key
curl -X POST https://promptforge-beta-ten.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -H "x-api-key: YOUR_PROMPTOMETER_API_KEY" \
  -d '{"prompt": "Act as an expert software architect. Output structured JSON."}'
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

Both cover **14/14 edge-case vectors** with 100% pass rates across JS and Python.

### Edge Case Vectors Covered (14/14):
1. Empty string & whitespace
2. Non-string inputs (`null` / `undefined` / numbers / objects)
3. Ultra-short prompts / greetings (< 3 words) ➔ Penalized to Grade F (~25/100)
4. Massive prompts (50,000+ characters)
5. Regex poisoning & special characters (`([.*+?^${}()|[\]\\])*`)
6. Unclosed and malformed XML tags (`<rol><contexto>...`)
7. HTML/XSS code injection
8. Emojis and multi-byte UTF-8
9. Non-Latin scripts (Chinese, Cyrillic, Arabic)
10. Numbers and punctuation only
11. Single repeated character
12. Extreme keyword stuffing / anti-gaming validation

---

## 🧠 How Promptometer Scores

### 8 Dimension Weights
Weights are dynamic: the engine infers the prompt type (system, few-shot, task, creative, RAG, tool-use, or general) and adjusts each dimension's weight accordingly.

| Dimension | Default Weight | Focus Area |
| :--- | :---: | :--- |
| **Clarity** | 18% | Action verbs, absence of vagueness and contradictions, length penalty for < 3 words |
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
promptforge/                    # Web App Repo (Vercel deployment)
├── index.html                  # Main Workbench SPA
├── favicon.svg                 # High-resolution vector SVG favicon
├── css/
│   └── index.css               # Editorial Technical Design System
├── js/
│   ├── i18n.js                 # Internationalization Engine (ES/EN)
│   ├── signals.js              # Single Source of Truth Signal Extractor
│   ├── patterns.js             # Catalog of 34 Anti-Patterns & 15 Strengths
│   ├── analyzer.js             # 8-Dimension Scoring Engine
│   ├── adversarial.js          # Security & Resilience Simulator (13 tests)
│   ├── rewriter.js             # Non-Destructive XML Rewriter
│   ├── templates.js            # 12 Production-Ready Prompt Templates
│   ├── knowledge.js            # Knowledge Hub (Glossary, Techniques, Frameworks, References)
│   ├── leaderboard.js          # Top 10 Hall of Fame & Persistence Module
│   ├── history.js              # Persistence & Evolution Charts
│   ├── charts.js               # Chart.js Radar & Line Wrapper
│   ├── export.js               # JSON, Markdown, Clipboard & URL Exporters
│   └── app.js                  # Main UI Orchestrator
├── api/
│   └── index.js                # Secured Vercel Serverless API wrapper
├── server.js                   # REST API Microservice & Local Dev Server
├── cli.js                      # Node Terminal Executable
├── test_edge_cases.js          # JS Test Suite Runner (14/14 PASS)
├── test_edge_cases.py          # Python Test Suite Runner (14/14 PASS)
├── vercel.json                 # Vercel Deployment Config
├── HANDOFF.md                  # Project State & Handoff Document
├── .agents/                    # Agent & IDE Instruction Rules
│   ├── AGENTS.md
│   └── ACODE_INSTRUCTIONS.md
└── README.md                   # This file
```

The core evaluation engine lives in a separate monorepo: **[j0sp0nc3/promptometer](https://github.com/j0sp0nc3/promptometer)** (`packages/core/`), published on npm as `promptometer-core`.

---

## 👨‍💻 Author & License

Developed with ❤️ by **Jose Ponce** ([j0sp0nc3](https://github.com/j0sp0nc3)).

- **GitHub:** [https://github.com/j0sp0nc3](https://github.com/j0sp0nc3)
- **LinkedIn:** [https://www.linkedin.com/in/josponce](https://www.linkedin.com/in/josponce)

Distributed under the **MIT License**. Copyright (c) 2026.
