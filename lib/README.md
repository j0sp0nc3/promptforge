# PromptQuill Core

The reusable engine that powers PromptQuill — a prompt-analysis toolkit that
scores prompts across 8 dimensions, detects anti-patterns, runs adversarial
tests and produces improved rewrites.

This folder is designed to be **extractable as an independent library**
(`packages/core/` in the future monorepo) so any application — web, CLI,
server, or third-party tool — can consume the same evaluation engine.

## Files

| File | Role |
|------|------|
| `promptquill-core.js` | Universal JS library (UMD / ESM / CommonJS). Works in browsers, Node, Deno, Bun. **Zero dependencies.** |
| `promptquill_core.py` | Native Python port. **Zero dependencies** (stdlib only). Drop into any Python project. |
| `promptquill-rules.json` | Declarative weights & simple rule definitions. Intended as a shared config surface so weights can be tuned in one place. |

## Output contract (identical across JS and Python)

Both implementations return the **same camelCase shape**:

```js
{
  overallScore: 46,            // 0–100
  grade: "D",                  // A | B | C | D | F
  wordCount: 12,
  charCount: 72,
  promptType: "general",       // general | system | few-shot | chainOfThought
  dimensions: {
    clarity:        { score, findings: [...], suggestions: [...] },
    specificity:    { score, findings, suggestions },
    structure:      { ... },
    robustness:     { ... },
    context:        { ... },
    outputFormat:   { ... },
    chainOfThought: { ... },
    safety:         { ... }
  },
  antiPatterns: [ { id, name, severity, dimension, suggestion }, ... ],
  strengths:    [ ... ],
  suggestions:  [ { priority, title, description }, ... ]
}
```

## Usage

### JavaScript / Node

```js
const PromptQuillCore = require('./lib/promptquill-core.js');

const analysis   = PromptQuillCore.analyze("Your prompt here");
const improved   = PromptQuillCore.improve("Your prompt here", analysis);
const adversarial = PromptQuillCore.runAdversarial("Your prompt here");

console.log(analysis.overallScore);   // 46
console.log(analysis.dimensions);     // { clarity: {…}, specificity: {…}, ... }
```

### Python

```python
import sys
sys.path.insert(0, "lib")
import promptquill_core as pf

analysis    = pf.analyze("Your prompt here")
improved    = pf.improve("Your prompt here", analysis)
adversarial = pf.run_adversarial("Your prompt here")

print(analysis["overallScore"])       # 46
print(analysis["dimensions"])         # { "clarity": {...}, ... }
```

### Any language via REST API

Start the server (`node server.js` from the project root) and POST:

```bash
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{"prompt":"Your prompt here"}'
```

Works from C#, Java, Go, Rust, PHP, Ruby, anything that speaks HTTP+JSON.

## Parity

The JS and Python ports are kept in sync. A cross-test verifies that the same
prompt yields the same `overallScore`, `grade`, `promptType`, per-dimension
scores, findings, anti-patterns and suggestions in both languages.

## Scope (honest)

This core is a **simplified, dependency-free port** of the full web engine.
The web app (`js/` at the repo root) has the complete catalogue:
30+ anti-patterns, 15 best practices, 13 adversarial tests, full i18n
(ES/EN). The core packages ship the most impactful subset (5 anti-patterns,
3 adversarial tests) to keep them small and zero-dep. The weights and signal
extraction logic are identical, so scores are directly comparable.
