# Project Rules — Promptometer

## Mandatory First Step
Before making ANY code changes, read `HANDOFF.md` in the project root.
It contains the current project state, completed tasks, pending tasks,
and design decisions that MUST be respected.

## Naming
- The product name is **Promptometer** (not PromptQuill, not PromptForge).
- The npm package is `promptometer-core`.
- The web app repo is `promptforge` (deployment name only).

## Design System: Editorial Technical
- Background: Cream Paper `#F7F3EC`
- Accent: Vermilion `#C73E2D`
- Typography: Fraunces (serif), IBM Plex Mono (data), Inter (body)
- NO glassmorphism, NO neon glow, NO dark mode as default.
- Use thin rules (lines), not box-shadows.

## Code Style
- All UI text must go through the i18n system (`js/i18n.js`).
- Add keys to BOTH `es` and `en` dictionaries.
- Scoring engine changes must be applied to BOTH:
  - `js/analyzer.js` (web app)
  - `packages/core/promptometer-core.js` (npm package)
  - `packages/core/promptometer_core.py` (Python parity)

## Before Finishing a Session
- Run `node test_edge_cases.js` to verify 14/14 PASS.
- Update `HANDOFF.md` with completed tasks and any new pending items.
- Commit and push all changes.
