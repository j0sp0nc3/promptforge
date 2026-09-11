# UI Redesign Plan — Promptometer V2 "Flagship"

> **Documento de dirección de arte y proyecto de rediseño íntegro de interfaz.**
> Estado ejecutado: **v3.6 · Modern Product + Craft + Electric Accents** (2026-09-10).
> Playground vivo: `design-system.html` · Suite: 34/34 PASS.
> Tono de agencia de diseño de élite. Objetivo: que Promptometer se posiciona como
> producto de referencia de su categoría — obra de un equipo de diseño completo,
> no de un template. Todo cambio posterior a este plan sigue el flujo SDD de `AGENTS.md`
> (local → `node test_edge_cases.js` → `dev` → verificación → `main`).

---

## 0. Posicionamiento (brand strategy)

**Statement:** *"Promptometer es el instrumento de precisión de la era LLM — el laboratorio donde un prompt se vuelve ingeniería."*

- Categoría mental a conquistar: **"el Swiss Watch del prompt engineering"** — precisión instrumental, no chatbot genérico.
- Narrativa visual: **instrumento científico de frontera** (observatorio × terminal editorial), no "app AI".
- Toda la UI comunica tres valores: **determinismo** (mismo input → mismo score), **auditoría** (cada punto justificado) y **soberanía** (análisis 100% local).
- Anti-posicionamiento: prohibido el vocabulario visual "AI genérico" (ver §10).

---

## 1. Auditoría del estado actual (design debt)

| Hallazgo | Evidencia | impacta | Acción asociada |
|:---|:---|:---|:---|
| ~76 overrides `body.theme-editorial .x` duplicando lógica de componentes | `css/index.css` L181–2873 | Alta | Migrar a tokens temáticos: 1 fuente de verdad por propiedad (§4) |
| Badges duplicados: `.badge-red/.badge-emerald/.badge-neutral` coexisten con `.badge-success/.badge-warning/.badge-critical` | L609–634 vs L1000–1012 | Alta | Fusionar en un único componente `Badge` (§5) |
| Iconografía por emojis (🕳️ ✨ 🐍 🌐) mezclada con SVG | header, tabs SDK, botones | Alta | Set propio de iconos SVG `js/icons.js` (§10) |
| Motion sin sistema: 8 keyframes ad-hoc, sin tokens de timing/easing | 864, 934, 1049, 1991, 2221, 2802, 4229 | Media | Motion system con tokens + choreografía (§7) |
| Tipografía "serif" en modo cósmico = Space Grotesk ( Neo-grotesk, no serif) | --font-serif L45 | Media | Redefinir roles tipográficos reales por tema (§3) |
| Sin jerarquía de foco visible estándar ni skip-link | — | A11y | Anillo `focus-ring` + skip-link (§8) |
| Estados vacíos/carga improvisados | vistas templates/history | Media | Componente `Skeleton` + empty states ilustrados (§5) |

**Decisión:** no reescribir desde cero. Rediseño por **migración estructurada**: los 100+ tokens semánticos existentes (`--bg-body`, `--ink`, `--accent`, `--rule`, `--sev-*`) se conservan como contratos y se completa la arquitectura de 3 capas por encima.

---

## 2. Design System — arquitectura (front-end architecture)

Un solo sistema regido por 4 archivos (nuevos o reorganizados dentro de `css/`):

| Archivo | Capa | Contenido |
|:---|:---|:---|
| `css/tokens.css` | 🟦 `@layer tokens` | Primitivas + semánticos (importa por tema) |
| `css/base.css` | 🟩 `@layer base` | Reset, tipografías, grid, a11y, utilitarios |
| `css/components.css` | 🟨 `@layer components` | Todos los componentes canónicos (§5) |
| `css/index.css` | 🟧 ensamblador | Solo imports + overrides de integración |

### 2.1 Capas de tokens (3 niveles)

```css
/* Capa 1 — PRIMITIVAS (sin semántica, jamás usadas por componentes) */
:root {
  --pm-void:        #08090E;
  --pm-ink-warm:    #1A1612;
  --pm-amber:       #FF9E00;
  --pm-vermilion:   #C73E2D;
  --pm-space:       #111420;   /* …escala neutra 0–1000 por tema */
}
/* Capa 2 — SEMÁNTICOS (los que ya existen, completados) */
:root, body.theme-cosmic { /* valores actuales de index.css */ }
body.theme-editorial    { /* valores actuales de index.css */ }
/* Capa 3 — DE COMPONENTE (consumen capa 2, nunca literals) */
:root {
  --btn-primary-bg:  var(--accent);
  --tab-indicator:   var(--accent);
  --chip-hover-bg:   var(--accent-bg);
}
```

**Reglas de sistema (inviolables):**
1. Los componentes (`components.css`) solo consumen capas 1–3; prohibido un literal en un componente salvo que exista su token.
2. Un cambio de tema = re-asignar capa 2; **cero cascadas por componentes del tipo `body.theme-editorial .botón`** (elimina la deuda del hallazgo 1).
3. Primitivas nuevas requieren patrón de nomenclatura: `--pm-{familia}-{intensidad}`.
4. Todo componente declara estado completo en una única firma; estados vía `[data-state="…"]`, variantes vía clase compuesta.

### 2.2 Contratos de nomenclatura

- Utilitarios: `u-` (`.u-scroll-x`, `.u-select-none`).
- Puntos de corte: 360 / 768 / 1080 / 1440 / 1920; token `--measure: 66ch`.

---

## 3. Dirección de arte (art direction)

### 3.1 Los dos temas como "identidades gemelas", no como overrides

| Concepto | **Cosmic Event Horizon** (por defecto) | **Editorial Technical** |
|:---|:---|:---|
| Sentimiento | Instrumento de frontera: obsesión técnica en la penumbra | Papel técnico revisado: método, tinta y sello |
| Fondo | `#08090E` void + `#111420` tabla | `#F7F3EC` crema |
| Acento | Ámbar `#FF9E00` (señal) | Vermilion `#C73E2D` (pluma) |
| Tipografía | Numeradores tamizados | Fraunces manifiesto, Maxwell hard impression |
| Data-viz | Frontera luminosa caída | Frontera fina tinta-tamizada |
| Figura emblemática | Teorías: horizonte, órbitas 3D | Trazado, sello, tabla editorial |

**Iluminación:** en cósmico, la luz es "señal" (ácidos ámbar/cian de bajo radio); prohibido cualquier glow de radio > 24px, la anatomía del void nunca "invade la mesa".

### 3.2 Tipografía (roles disciplinados por tema)

| Rol | Cósmico | Editorial | Reglas |
|:---|:---|:---|:---|
| Manifiesto (h1) | Space Grotesk 700 / -0.045em | Fraunces 900 opsz 144 | max 3 manifiestos por vista |
| Instrumento (display numérico) | Space Grotesk 600 + `font-variant-numeric: tabular-nums` | Fraunces 600 | siempres tabular |
| Datos / código / medición | JetBrains Mono | IBM Plex Mono | tamaño mínimo 0.72rem |
| Cuerpo | Inter 400–500 / 0.02em | Inter 400 | `--measure: 66ch` |
| Etiqueta micro | Mono 500, `letter-spacing: +0.14em`, mayúsculas | idem | solo para device-y labels |

### 3.3 Espaciado, reglas y entradas (elevación atómica)

- Escala 4-8-12-16-24-32-48-64-96-128 (compatibiliza tokens actuales `--space-*`).
- Materia es **línea, no sombra**: `--rule` como material primario; sombras solo para elevación real (modales, poppers).
- Radios: agitar sistemas currently: 4/8/12: agitar nuevos: **2 / 6 / 10 / 9999** para modificar naturaleza "instrumento" (esquinas frías, chips 100%).

---

## 4. Grid y layout system

```
Header 64px (sticky, pulso de estado obligatorio)
Ticker 36px (uno solo, canonizado)
Main    → contenedor max 1440px, padding-inline 24/48px
          grid 12 columnas, gutter 24, margen S1 = col spill
Workbench       → col 1–6 (editor) · col 7–12 (análisis)  @ ≥1080
Constelación    → stage 3D al 52vh, a Issues canyon
Dimensiones     → lista 8D en tab de detalle + fila de chips
```

- Mapa visual de una misma vista siempre a **una constelación central** (fallback SVG si WebGL falla — ya existe, canonizar).
- Rango editorial: la viewers syenso en retícula del `analysis-tabs-section`, se reflow-boolean editorial corta-col.

---

## 5. Inventario de componentes (registro canónico)

> **ACTUALIZADO v3.6 (2026-09-10).** El playground vivo es `design-system.html`.
> Gramática final: Inter + zinc + paleta de acento conmutable (`body[data-accent]`,
> default coral eléctrico #FF5200; volt/cyan/magenta/amber/iris alternativos),
> tema claro por defecto + dark igual ciudadano, hero Apple/Linear (kicker pill +
> manifiesto centrado + dual CTA + metric strip + score stage keynote), paneles
> sin cajas (hairlines), Phosphor Icons + icon-btn.

**Regla de oro:** *antes de crear cualquier marcado, se consulta la tabla. Si el componente existe, se instancia. Un componente nuevo requiere: ID, estados, i18n es/en y suite green.*

| ID | Componente | Clase canónica (v3.6) | Variantes | Estados | Uso previsto |
|:---|:---|:---|:---|:---|:---|
| BT-1 | Button | `.btn` | `--primary`, `--accent`, `--secondary`, `--dark`, `--ghost`, `--sm` | hover/active/disabled | CTAs globales |
| IB-2 | Icon button | `.icon-btn` (Phosphor) | close/theme/export | hover/focus | modales, header |
| LG-1 | Logo | `.pg-brand` | — | — | nav playground, header |
| CH-1 | Chip | `.chip` | `--accent`, `--injected` | hover/active/injected | XML injectors |
| TB-1 | Tab | `.tab` + `.tab-bar` | `.seg` (segmented) | active/hover/focus | resultados, controles |
| BA-1 | Badge | `.badge` | `success/warning/critical/high/medium/low/neutral` | estático | veredictos |
| SD-1 | Score | `.score-hero`, `.score-ring`, `.score-value`, `.score-grade` | idle→revealed | stage, hero |
| SC-2 | Score pill | `.score-pill` | `--ok/--err` | listas compactas |
| DM-1 | Dimension row | `.dim-card` | `is-active` (bar) | hover/active | 8D |
| PC-1 | Panel | `.panel` | `--flat`, `--ghost`, `--featured`, `--section` | — | agrupaciones |
| TO-1 | Toast | `.toast` | `--success/--warning/--error` | enter/exit/auto | global |
| MD-1 | Modal | `.modal` (+`__header/__icon/__title/__item/__footer`) | dialog/sheet<640 | open/closed/Escape | export, docs |
| SR-1 | Skeleton | `.skeleton` | `--line/--title/--block` | shimmer | cargas |
| EM-1 | Empty | `.empty-state` | — | — | history, leaderboard |
| ID-6 | Icon | Phosphor `.ph` (CDN v2.1.1) + `js/icons.js` fallback | `ph-s/m/l`, pesos | hover | reemplaza emojis |
| NK-2 | Ticker | `.ticker` | live-dot | playing/paused | global |
| RK-1 | Stat | `.stat` | — | — | editor |
| CR-3 | Craft | `.craft-numeral/dots/grad/hairline/blip` | opt-in | — | profundidad visual |

### 5.b Los que FALTAN por diseñar (gap analysis vs `index.html` real)

> **Estado v3.7:** los 4 P1 (IN-1, SE-1, DA-1, DD-1) están **diseñados, instanciados y verificados** en la sección 08 del playground. Persisten solo los P2/P3.

| ID propuesto | Componente | Dónde vive en `index.html` hoy | Estado |
|:---|:---|:---|:---|
| IN-1 | Textarea (prompt editor) + toolbar + stats | `#prompt-input` L369 | ✅ **v3.7 diseñado** (`.editor`, focus coral, contador en vivo) |
| SE-1 | Select nativo estilizado | `#prompt-objective-select` L360 | ✅ **v3.7 diseñado** (`.select` + chevron Phosphor) |
| DA-1 | Data table de modelos | vista modelos | ✅ **v3.7 diseñado** (`.table`, dot de modelo, precios mono, badges) |
| DD-1 | Dropdown menu | `#export-menu` L877 | ✅ **v3.7 diseñado** (kbd hints, Escape, outside-click) |
| FT-1 | Footer del sitio | `.site-footer` L913 | ⬜ P2 |
| LB-1 | Leaderboard entry | vista leaderboard | ⬜ P2 |
| FR-1 | Form input/textarea validados | modales suggest-* L969+ | ⬜ P2 |
| CT-1 | Search input con icono | learn/models search L705/801 | ⬜ P2 |
| TP-1 | Tooltip informed | legend pills | ⬜ P2 |
| SW-1 | Switch (radar/theme) | toggle radar live | ⬜ P3 |

### 5.c Documentación verificada (2026-09-10 · v3.7)

- Playground: 9 secciones, 10 paneles 100% con captions, temas claro/oscuro, 6 paletas conmutables, Phosphor cargado (12 iconos en modal), coreografía score 0→87 funcional.
- Suite: **34/34 JS PASS** · paridad npm/py intacta (lógica no tocada).
- A11y: skip-link, focus-ring token, `:focus-visible` global, focus automático en modal, Escape, `aria-modal`, toasts `aria-live`.
- Presto valores verificados por computed style: accent `#FF5200` (claro) / `#FF6A33` (oscuro), bg `#F9FAFB` / `#121317`, header modal 80px, sin overflow horizontal.

---

## 6. Motion system (motion design)

### 6.1 Tokens

```css
:root {
  --dur-inst: 90ms;  --dur-fast: 160ms; --dur-base: 240ms;
  --dur-slow: 420ms; --dur-story: 800ms;
  --ease-out: cubic-bezier(.22, 1, .36, 1);
  --ease-io:  cubic-bezier(.65, 0, .35, 1);
  --ease-spring: cubic-bezier(.34, 1.56, .64, 1); /* solo elementos ≤ 96px */
}
```

### 6.2 Leyes de choreografía

1. **Entrada jerárquica al activar una vista:** manifiesto (i) → subtexto (i+60ms) → cards (stagger 40ms) → data-visual (último). Jamás dos animaciones de layout simultáneas a viewport llena.
2. **Feedback siempre < 160ms**; transformaciones del mundo (score, 3D) cuentan una historia ≤ 800ms.
3. Máximo **2 elementos con spring** visibles por pantalla; el resto ease-out.
4. `prefers-reduced-motion` apaga feedback y transforma historias en ráfagas ≤ 90ms; el contenido jamás queda oculto tras una animación (ya existe en CSS: conservar y universalizar).

### 6.3 Microespectáculos patrón (motor visual del producto)

| Momento | Choreografía | Tokens |
|:---|:---|:---|
| **Revelación 8D** (btn-analyze) | 1) manifiesto falla foco en stage→ring traza 720ms→2) numerador roll numérico 0→score (exponential easing) 3) 8 nodos se encienden con stagger 60ms en orden ponderado 4) letra calibración "sella" (spring 1.02→1) | --dur-story, --ease-spring |
| **Escáner de patrones** | línea de barrido 1.5px cruzando el textarea durante el análisis; los anti-patrones se marcan cuando el barrido pasa por el chunk relevante | --dur-slow |
| **Chips de inyección** | pop-in stagger 30ms; al inyectar, el chip se fundo con el ring del score y un eco de highlight recorre 700ms el bloque añadido | --ease-spring |
| **Hover de botones** | 1.5px underline-donación, 8x1px sweep de 240ms; presión = scale .98 + .4px "recolección" | --dur-fast |
| **Ticker** | la velocidad baja 40% al hover (no se detiene) — vivacidad editorial | custom |
| **Radar** | diff overlay A/B con trazado de parcelas interpolando 480ms | --dur-slow |

---

## 7. Interacciones de élite (interaction design)

**Golpes de awwwards sin gimmick:** 3 sistemas que hacen la UI AAA:

1. **Command Palette (`Ctrl/⌘+K`)** — navegar vistas, ejecutar acciones (analizar, exportar, tema, idioma, ir al leaderboard) con teclado selectivo. Estado y datos en `js/palette.js` (nuevo, vanilla). Registra *todas* las cadenas en `js/i18n.js`.
2. **Análisis-en-tiempo-espera** — debounce 400ms mientras se escribe; los chips stats se actualizan; preview de score en el badge del editor con micro-roll de 160ms (sin reescanear patrones).
3. **Caisson hover contextual del stage 3D** — la constelación responde con parallax suave (dampened) al cursor; al mover a una dimensión de la fila 8D, su nodo orbita al frente (canoniza el `pulseDimHighlight` en屈服 data-nodo).

**Paquetes incrementales de interacción (checklist de faisítos):**
- hold-to-confirm en Clear (no destrucción accidental), toast con ajuste (undo).
- copia con feedback en chips/blocks (mono metadata: "42 tokens · 7 bloques XML").
- navegación por flechas en tap-bars (físico: ← → cambia tab).
- foco-visible instante robusto (anillo con fondo), skip-link al Workbench.
- scroll-railing en main views (secciones `sticky` con manifiesso interior) @ ≥1080.

---

## 8. Accesibilidad (a11y expert)

- Objetivo **WCAG AA+** (el SPEC ya lo declara; la auditoría formaliza):
  - `:focus-visible` con token `--focus-ring: 0 0 0 2px var(--bg-body), 0 0 0 4px var(--accent)`.
  - Skip-link primero en `<body>`.
  - El ticker: `aria-live="off"` (con región anunciada manualmente), pausa en `:focus-within`.
  - Contraste AA en ambos temas (incl. badges sev-*); celebrar tabular-nums para todo dato numérico.
  - El stage 3D mantiene path estático accesible (fallback SVG ya cubre; añadir `role="img"` + descripción).

---

## 9. Performance (engineering craft)

- Presupuesto: LCP < 2.5s, CLS < 0.02, INP < 200ms en endpoint prod.
- Fuentes: mantener `display=swap`; añadir `size-adjust`/`ascent-override` en un fallback `@font-face` por familia para matar el FOUT shift (mínima CLS).
- Chart.js, Three.js: solo carga on-demand (lazy import por vista — ya parcial; completar).
- Canvas 3D: DPR cap 2, pausa RAF cuando la vista no es la activa (`document.visibilitychange` ya existe: reusar).
- CSS: `@layer` real; cero `!important` en el sistema nuevo.

---

## 10. Guardarraíles de anti-artefacto "AI genérico" (brand enforcement)

Prohibiciones en cámara, marcadas por el equipo de dirección de arte:

1. ❌ Emojis como iconografía → set propio de iconos stroke plano (1.5px, cuadrícula 24px): `js/icons.js` con `icon(name, size)`).
2. ❌ Gradients default de modelos genéricos (violeta/índigo → CSS de análisis); gradientes solo los canónicos del sistema.
3. ❌ Glassmorphism difuso, glow sin causa física (jamás radio > 24px), sombras decorativas.
4. ❌ Confetti, memes wow, sparkle-genéricos, "starfield random" sin dato debajo.
5. ✅ Todo movimiento o elemento brighter debe Wien estar instanciado de un **componente con ID** del registro §5.
6. ✅ Todo nuevo texto visible vive en `js/i18n.js` (es+en, 0 llaves faltantes — regla 7 de `AGENTS.md`).

---

## 11. Estructura de trabajo por fases (estado real v3.6)

> **Actualizado 2026-09-10** tras las iteraciones del playground. U-0 y U-1
> ya están materializados en `css/ds/{tokens,base,components}.css` +
> `design-system.html` + `js/icons.js` (fallback). El arco de acentos
> conmutables existe (`body[data-accent]`) y goberna: coral/volt/cyan/magenta/amber/iris.

| Fase | Entregable | Estado | Criterio de cierre |
|:---|:---|:---|:---|
| **U-0 · Base** | 3 capas de tokens + base a11y + iconos Phosphor | ✅ **materializado en playground** | suite 34/34 · a11y skip/focus/AA · computed audit |
| **U-1 · Componentes** | BT/IB/CH/TB/BA/SD/DM/PC/TO/MD/SR/EM + craft layer | ✅ **materializado** | registro §5 coherente · captions 10/10 · sin cajas dobles |
| **U-2 · Choreografía** | Motion tokens + score reveal + stagger | ✅ **materializado** (ticker/rAF-tick pendiente port) | reduced-motion seguro |
| **U-3 · Interacciones AAA** | ⌘K palette · hold-to-confirm · stage parallax | ⬜ pendiente | keyboard-only recorre producto |
| **U-4 · Integración `index.html`** | IN-1/SE-1/DA-1/DD-1 de §5.b + hero → Workbench real | ⬜ **siguiente** | playground look = look app, sin regresiones 360→1920 |
| **U-5 · Vistas restantes** | FT-1 footer, LB-1, FR-1, CT-1, TP-1, learn/models skin | ⬜ | audit i18n es/en 0-gap · suite green |

**Definición de Done (global):** suite 34/34 · paridad npm/py sin tocar motor · i18n 0-gap · a11y AA+ con foco gestionado en overlays · responsive QA 360→1920 · promoción solo vía `dev` → verificación `.vercel.app` → merge `main` (regla 5 `AGENTS.md`).

---

## 13. Decisiones de diseño registradas durante la iteración (ADR)

1. **Inter solo** (serif Fraunces descartada en v3) — jerarquía por peso/tamaño; serif solo si el brand lo pide.
2. **Un solo acento por producto**; hairline única línea divisoria; los glows sin causa física quedan prohibidos (capturas v3.4/v3.5).
3. **El hero es tipográfico-centrado** (kicker pill → manifiesto → dual CTA → metric strip → stage keynote) — eliminados los layouts de 2 columnas dashboard.
4. **Paneles sin caja por defecto**; caja solo para contenido realmente agrupado (código en `--flat`, featured única por vista).
5. **Drin Phosphor como casa de iconos** (v3.6): contrato `.ph` en base.css, `icon-btn` canónico; self-host del subset al integrar producción.
6. **Paletas conmutables `body[data-accent]`** con doble token (`--accent` superficie + `--accent-text` AA); default **coral eléctrico `#FF5200`** por herencia vermilion y diferenciación frente al cliché AI-indigo.
7. **Reset anti-margin-block**: todo heading declara su ritmo inferior (lección sistémica de los choques de títulos).
8. **`--s-5: 20px` ahora existe**: ningún rung de la escala puede faltar — los tokens fantasma rompen silenciosamente componentes (lección del modal).

---

## 14. Estructura de trabajo por fases (fidelity a `PLAN.md`)

Estas fases se agregarán al roadmap como **"Fase 5 — UI Flagship & Design System"** al iniciar su desarrollo (sólo escritura en PLAN.md cuando se arranque; este plan es el contrato). Cada tarea vía flujo `AGENTS.md` §5: código local → `node test_edge_cases.js` → push solo a `dev` → verificar en `promptometer.vercel.app` → merge.

| Fase | Entregable | Criterio de cierre |
|:---|:---|:---|
| **U-0 · Base** | `tokens.css` + `base.css` con las 3 capas; emojis → `js/icons.js`; skip-link + focus-ring; auditoría a11y cerrada | 31/31 PASS; cero console warning; Lighthouse a11y ≥ 95 |
| **U-1 · Componentes canónicos** | `components.css` (BT/BA/TB/TO/MD/SR/EM); absorción de 76 overrides; deprecaciones ejecutadas | `grep "body.theme-editorial \."` ⇒ solo integración de stage |
| **U-2 · Choreografía** | Motion tokens + revelación 8D + scan de patrones + microespectáculos; `js/motion.js` (Dispatcher de tokens, reduced-motion listen) | reduce-motion audit PASS; sin layout thrash (perf log) |
| **U-3 · Interacciones AAA** | ⌘K palette + typing-analysis + stage parallax + skeletson / empty states arreglados | PALETTE uso total de i18n; keyboard-only recorre el producto |
| **U-4 · Pulido por vista** | Workbench bit-precision, modelos table, learn, radar A/B, footer/brand KO framing | QA visual por breakpoint 360→1920 firmada en PR |

**Definición de Done (global):** suite 31/31 · paridad npm/py sin tocar motor · i18n 0-gap · Lighthouse ≥ 95 (perf/a11y) · 0 corrupciones visuales en responsive manual QA · mainstream dev→main solo tras validar en vercel.app.

---

## 15. Evidencia de "equipo de diseño completo"

Cada decisión de este plan queda trazada a una disciplina (lo que la ejecución posterior también]:

| Disciplina | Dueño virtual | Drive en este plan |
|:---|:---|:---|
| Brand Strategy | §0 | statement, anti-posicionamiento |
| Art Direction | §3 | temas, tipografía, luz |
| UX Architecture | §2, §4 | capas, grid, retícula |
| Design Systems | §2, §5 | tokens, registro |
| Interaction Design | §7 | palette, hottracks |
| Motion Design | §6 | tokens, choreografías |
| Accessibility | §8 | AA+, focos, live regions |
| Content / i18n | §10.6, regla 7 AGENTS | voz bilingüe |
| Frontend Eng | §2, §9 | `@layer`, perf, vanilla-first |

**Ritual de gobernanza del sistema:** ningún componente nuevo de UI se fusiona a `dev` sin (a) ID en el registro, (b) estados completos, (c) audit i18n es/en, (d) suite green. El registro §5 es la fuente de verdad: si existe, se instancia.
