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

- **Multidimensional Score (0–100)** with letter grades (A+ to F) across **8 dimensions**, objective-driven scoring (`options.objective`: Code Generation, Reasoning, JSON Schema, Safety & RAG, Creative Writing), and interactive **Score Scale & Letter Grade Rubric Modal**.
- **3D Solar System Constellation (Three.js WebGL)**: Real-time 3D orbital system with 2-phase protoplanetary disk accretion kinetics, signature 8D planet geometries, permanent floating 3D score badges, interactive planet hover pause (1.25x scale), 1-click smooth-scroll dimension navigation, and dual themes (Cosmic Black Hole 🗓️ & Editorial Moon Mode 🌙).
- **Canonical 7-Block XML Structure**: The rewriter, domain synthesizer, and LLM all generate prompts in the same enforced order: `<system_role>` → `<objective>` → `<context>` → `<requirements>` → `<output_format>` → `<examples>` → `<error_handling>`. Color-coded XML highlighting with 1-click action chips (`⚡ Shorten`, `🧠 Add CoT`, `📐 Enforce JSON`, `🛡️ Guardrails`).
- **LLM-as-a-Judge with Diagnostic Feedback**: The `/api/analyze-intent` endpoint injects the Promptometer diagnostic (score, grade, weaknesses, suggestions, context gaps) into the LLM system prompt. The LLM solves each identified weakness, assigns a domain-specific expert role (e.g., Geologist for magma topics), and returns a `justification` banner explaining improvements. Supports Gemini, OpenAI, and Groq with automatic heuristic fallback at $0 cost.
- **Domain Archetype Engine** (`js/domain-analyzer.js`): Classifies prompts into 8 archetypes (Software Engineering, Data Extraction, Marketing Copy, RAG Knowledge, Agentic Tool Use, Financial/Legal, Rhetoric/Creative, General Task), evaluates context gaps, and synthesizes enriched prompts via `synthesizeLocal()` with `inferDynamicRole()` (geology, health, physics, history, etc.).
- **Anti-Pattern Catalog** (35 anti-patterns) & **Best Practices** (16 strengths, including OWASP LLM07 defense) with expandable `<details>` accordions.
- **Adversarial Security Suite** (14 security tests: jailbreak resistance, prompt exfiltration, hallucination mitigation, OWASP LLM07 System Prompt Leakage, etc.).
- **Interactive Knowledge Hub** with a 24-term bilingual glossary, 17 prompting techniques (including Context Engineering, MCP, Test-Time Compute, Agentic Patterns), 6 structural frameworks (including CO-STAR and Bento-Box), 13 curated research references, and full-text real-time search.
- **Top 10 Hall of Fame Leaderboard** with zero-login global API sync (`/api/leaderboard`), instant URL sharing (`?p=base64`), 10 elite seed prompts (94–99/100), and interactive "Analyze & Try" buttons.
- **Non-Destructive XML Rewriter** preserving user context with a Before vs After impact analysis.
- **Production REST API & CLI** with API Key authentication, strict CORS, rate limiting, and 100 KB payload protection.

---

## 🚀 Quick Start

### Live Web Application
Try the live app immediately: **[https://promptometer.tech/](https://promptometer.tech/)** (Development: **[https://promptometer.vercel.app/](https://promptometer.vercel.app/)**)

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

## 🎨 Cosmic Event Horizon & Dual-Theme System

The application features a cutting-edge **Cosmic Event Horizon** theme inspired by astrophysical instruments and singularity precision, along with a dynamic **Theme Switcher**:
- **Default Theme (Cosmic Void):** Deep Space Void (`#08090E`), Dark Accretion Surface (`#111420`), Photon Ring Orange (`#FF9E00`), Pulsar Cyan (`#00E5FF`), and High-Contrast Starlight text (`#F0F4F8`).
- **Classic Theme (Editorial Technical):** Warm Cream Paper (`#F7F3EC`), Warm Ink (`#1A1612`), Vermilion accent (`#C73E2D`), and Fraunces typography.
- **Dynamic Switcher (`#theme-toggle-btn`):** Seamless one-click switching in the header between Cosmic Mode 🌌 and Editorial Mode 📜 with `localStorage` state persistence.
- **Typography:** `Space Grotesk` & `Fraunces` for titles, `Inter` for UI body, `JetBrains Mono` & `IBM Plex Mono` for telemetry and code.
- **Iconography & Favicon:** High-resolution SVG photon ring calibration gauge icon.

---

## 📚 Knowledge Hub & Leaderboard

The **Learn ("Aprender")** and **Top 10** tabs provide an interactive educational suite:

- **Bilingual Glossary (20 Terms):** Tokenization, Temperature, Top-p, Context Window, System/User/Assistant messages, Embeddings, Vector Stores, Fine-tuning, Grounding, Few-shot/Zero-shot, Chain of Thought, Prompt Injection, LLM-as-a-Judge, In-Context Learning, Delimiters, etc.
- **13 Prompting Techniques:** ReAct, Tree of Thought, Self-Consistency, Reflexion, Zero-shot, Metaprompting, Chain of Verification (CoVe), Skeleton-of-Thought (SoT), Hierarchical CoT (Hi-CoT), Few-shot, CoT, RAG, and Role Prompting — with one-click **"Analyze"** buttons that load example prompts directly into the editor.
- **6 Structural Frameworks:** RTF (Role-Task-Format), CRISPE, RACE, CO-STAR (GovTech Singapore), Bento-Box Modular Architecture, and native 7-section XML Anatomy.
- **Directorio de Modelos LLM & Benchmarks (`#nav-models` & `#view-models`):** Pestaña dedicada con el Top 10 de modelos LLM SOTA de agosto 2026 (Claude Mythos, Claude Fable 5, Claude Opus 4.7, GPT-5.6 Sol, Kimi K3, Gemini 3.1 Pro, DeepSeek V4, GPT-5.5 Pro, Qwen 3.6 y GLM-5.2), telemetría live de precios y contexto vía OpenRouter (auto-sync semanal por GitHub Actions) y benchmarks curados (BenchLM Index, Arena ELO, SWE-bench, GPQA Diamond, Agentic Index), filtros (*Todos*, *Frontera*, *Open Source*, *Razonamiento*, *Código*), podio Top 3 interactivo y modal con guías de prompting y prompts canónicos de 1-clic.
- **Top-Level Radar IA Tab (`#nav-radar` & `#view-radar`):** Primary navigation tab uniting 27 curated AI Creators across 5 languages (Riley Goodside, Andrej Karpathy, Lilian Weng, swyx, Yann LeCun, Andrew Ng, plus 🇪🇸 DotCSV & IA en Español, 🇫🇷 Defend Intelligence, 🇩🇪 Everlast AI, 🇧🇷 Didática Tech, 🇯🇵 Ledge.ai, etc.) with instant search, category filtering (Prompting, Architecture, Agents, Security), and 13 Research References & Guides.
- **Live AI News Ticker (`#news-ticker-bar`):** Header bar displaying 100% live updates — Hacker News stories and fresh arXiv papers (cs.AI/cs.CL, last 7 days) merged by date via `/api/ai-news` with play/pause controls, manual step navigation (‹ / ›), touch pause, and a modal feed log dialog (`#modal-ticker-feed`) to view and filter all live updates statically.
- **Top 10 Hall of Fame (`js/leaderboard.js` & `/api/leaderboard`):** Global community ranking with zero-login API sync, gold/silver/bronze badges, submission modal, and "Analyze & Try" buttons.
- **Unified Expandable Library:** Browse 35 anti-patterns, 16 best practices, and 14 adversarial tests as expandable accordions displaying dimension, description, and suggestions.
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

## ⚙️ Environment Variables Specification

| Environment Variable | Environments | Required? | Behavior WITH Variable | Fallback / Behavior WITHOUT Variable |
| :--- | :--- | :---: | :--- | :--- |
| **`STORAGE_KV_REST_API_URL`**<br>*(or `UPSTASH_REDIS_REST_URL` / `KV_REST_API_URL`)* | Production, Preview | ❌ Optional | Leaderboard & anti-spam rate limiter persist globally across Vercel instances in Upstash Redis / Vercel KV. | Gracefully falls back to an in-memory array per Vercel instance. App remains 100% functional. |
| **`STORAGE_KV_REST_API_TOKEN`**<br>*(or `UPSTASH_REDIS_REST_TOKEN` / `KV_REST_API_TOKEN`)* | Production, Preview | ❌ Optional | Authenticates read/write operations (`GET`, `SET`, `ZADD`, `HSET`) against Vercel KV / Redis. | Redis client disabled; degrades to in-memory storage fallback. |
| **`PROMPTOMETER_API_KEY`** | Production | ❌ Optional | Enforces private key authentication (`x-api-key` / `Bearer token`) on Serverless API endpoints (`HTTP 401` on invalid key). | API operates in open public access mode (ideal for public web UI demo). |
| **`GEMINI_API_KEY`** | Production, Dev | ❌ Optional | Enables live LLM-as-a-Judge inference on `/api/analyze-intent` using Gemini Flash. Returns `justification`, `weaknessesIdentified`, and `improvedPrompt`. | Degrades automatically to zero-latency heuristic synthesizer (`DomainAnalyzer.synthesizeLocal`). |
| **`OPENAI_API_KEY`** | Production, Dev | ❌ Optional | Same as above using GPT models. | Same heuristic fallback. |
| **`GROQ_API_KEY`** | Production, Dev | ❌ Optional | Same as above using Llama 3.3 via Groq. | Same heuristic fallback. |
| **`PORT`** | Local Dev | ❌ Optional | Custom TCP port for local Express server (`server.js`). | Defaults to port `3000`. |

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
├── index.html                  # Main Workbench SPA with JSON-LD Schema & OpenGraph
├── favicon.svg                 # High-resolution vector SVG favicon
├── og-image.svg                # OpenGraph & Social Preview Banner
├── robots.txt                  # Search Engine & AI Crawler Rules
├── sitemap.xml                 # XML Sitemap for Search Engines
├── llms.txt                    # Machine-Readable AI Spec (Answer.ai / Jeremy Howard Standard)
├── llms-full.txt               # Extended Technical API & Core Specification for LLMs
├── manifest.json               # Web App Manifest & PWA Metadata
├── css/
│   └── index.css               # Editorial Technical Design System
├── js/
│   ├── i18n.js                 # Internationalization Engine (ES/EN)
│   ├── domain-analyzer.js      # Domain Archetype Classifier & Context Gap Synthesizer
│   ├── signals.js              # Single Source of Truth Signal Extractor
│   ├── domain-analyzer.js      # 8-Archetype Domain Intelligence & Context Gap Analyzer
│   ├── patterns.js             # Catalog of 35 Anti-Patterns & 16 Strengths (incl. OWASP LLM07)
│   ├── analyzer.js             # 8-Dimension Scoring Engine with Domain Adaptive Weights
│   ├── adversarial.js          # Security & Resilience Simulator (14 Adversarial Stress Tests)
│   ├── rewriter.js             # Non-Destructive XML Rewriter & Action Chips
│   ├── templates.js            # 12 Production-Ready Prompt Templates
│   ├── knowledge.js            # Knowledge Hub (Glossary, Techniques, Frameworks, References)
│   ├── leaderboard.js          # Top 10 Hall of Fame & Persistence Module
│   ├── history.js              # Persistence & Evolution Charts
│   ├── charts.js               # Chart.js Radar & Line Wrapper
│   ├── export.js               # JSON, Markdown, Clipboard & URL Exporters
│   ├── constellation3d.js      # 3D Solar System Constellation Engine (Three.js WebGL)
│   └── app.js                  # Main UI Orchestrator
├── api/
│   ├── index.js                # Secured Vercel Serverless API wrapper (including /api/analyze-intent)
│   └── moderation.js           # Content moderation & anti-spam filter
├── server.js                   # REST API Microservice & Local Dev Server
├── cli.js                      # Node Terminal Executable
├── test_edge_cases.js          # JS Test Suite Runner (27/27 PASS across 9 Suites)
├── test_edge_cases.py          # Python Test Suite Runner (14/14 PASS)
├── vercel.json                 # Vercel Deployment Config
├── HANDOFF.md                  # Project State & Handoff Document
├── SECURITY.md                 # Security Audit & 6-Layer Defense Spec
├── .agents/                    # Agent & IDE Instruction Rules
│   └── AGENTS.md
└── README.md                   # This file
```


The core evaluation engine lives in a separate monorepo: **[j0sp0nc3/promptometer](https://github.com/j0sp0nc3/promptometer)** (`packages/core/`), published on npm as `promptometer-core`.

---

## 👨‍💻 Author & License

Developed with ❤️ by **Jose Ponce** ([j0sp0nc3](https://github.com/j0sp0nc3)).

- **GitHub:** [https://github.com/j0sp0nc3](https://github.com/j0sp0nc3)
- **LinkedIn:** [https://www.linkedin.com/in/josponce](https://www.linkedin.com/in/josponce)
- **Email:** [promptometer@gmail.com](mailto:promptometer@gmail.com) — casilla oficial para consultas, sugerencias, reportes de seguridad y cualquier tema relacionado con el proyecto.

Distributed under the **MIT License**. Copyright (c) 2026.
