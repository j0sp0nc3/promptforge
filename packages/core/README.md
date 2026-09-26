# promptometer-core

Zero-dependency prompt evaluation engine with JS/Python parity (0 ms, 0 tokens, no network).

- `analyze(prompt)` — 8-dimension score, grade and anti-patterns for **designed prompts** (system prompts, templates).
- `assess(prompt, context?)` — evaluates the **work request handed to an agent** (typed by a person or emitted by an orchestrator). Harness-agnostic: the host passes context as data and `assess()` never touches the disk. *(experimental, v1.2.0)*
- `improve(prompt)`, `runAdversarial(prompt)`, `detectPatterns(prompt)`.

## Install

```bash
npm install promptometer-core      # JS (browser, Node, Deno, Bun)
pip install -e packages/core       # Python, from this repo (adds the `promptometer` CLI)
```

## `assess()`

```js
const { assess } = require('promptometer-core');

const r = assess('edita auth/inexistente.py para validar el token', {
  known_files: ['src/auth.py', 'js/app.js'], // optional workspace index (e.g. `git ls-files`)
  turn: 1, is_voice: false, lang: 'es',      // all optional
});
r.quality;          // vague | moderate | specific | exemplary  (+ r.score 0-100)
r.targets;          // { mentioned, verified, missing, modules } — grounding against known_files
r.exploration_risk; // low | medium | high — qualitative blast radius
r.scope;            // { files, objectives, suggest_split } — anti mega-prompt
r.recommended_tier; // cheap | standard | deep — map it to your own models
r.correction;       // turn 2+: drift / correction detected
r.issues;           // [{ id: 'TA004', severity: 'high', message }] — stable ids TA000-TA010
r.tip; r.scaffold;  // one coaching tip + fill-in template when score < 50 ('' otherwise)
```

Python exposes the same function and output (`import promptometer_core as pc; pc.assess(...)`); keys come in both `snake_case` and `camelCase`.

## CLI (JSON on stdout)

```bash
node promptometer-core.js assess "agrega tests a analyzer" --files-from git
python promptometer_core.py assess "reviértelo, te equivocaste" --turn 2 --lang en --compact
```

## Parity

`fixtures/assess-cases.json` is the shared spec. `python test_assess.py` checks Python against it, checks that the regex/message spec embedded in the JS file (`TA_SPEC`) is in sync (`--sync-js` regenerates it) and compares both engines over the fixtures plus a randomized Unicode corpus.

MIT © j0sp0nc3
