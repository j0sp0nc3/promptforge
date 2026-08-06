# 🔄 Handoff — Estado del Proyecto Promptometer

> **Instrucciones para el asistente AI:** Lee este archivo COMPLETO antes de hacer
> cualquier cambio. Contiene el estado actual del proyecto, las tareas pendientes,
> las decisiones de diseño tomadas y el contexto necesario para continuar el trabajo
> sin romper nada ni repetir tareas ya completadas.

---

## 🎯 Objetivo del Proyecto

**Promptometer** es un motor de evaluación multidimensional de prompts para LLMs,
publicado como paquete npm (`promptometer-core@1.0.0`) y como aplicación web
interactiva desplegada en Vercel.

### Repositorios

| Componente | Repositorio | Descripción |
|:---|:---|:---|
| **Motor Core** | [j0sp0nc3/promptometer](https://github.com/j0sp0nc3/promptometer) | Motor de análisis (JS + Python), publicado en npm |
| **App Web** | [j0sp0nc3/promptforge](https://github.com/j0sp0nc3/promptforge) | UI web con API serverless, desplegada en Vercel |

### URLs en Producción

- **Vercel:** https://promptforge-beta-ten.vercel.app/
- **npm:** https://www.npmjs.com/package/promptometer-core
- **Dominio pendiente:** `promptometer.is-a.dev` (PR abierto en is-a-dev/register)

---

## 🎨 Sistema de Diseño: Editorial Technical

| Token | Valor | Uso |
|:---|:---|:---|
| **Fondo** | `#F7F3EC` (Cream Paper) | Body background |
| **Tinta** | `#1A1612` (Warm Black) | Texto principal |
| **Acento** | `#C73E2D` (Vermilion) | Marca, botones, enlaces activos |
| **Tipografía Serif** | Fraunces | Títulos, logo |
| **Tipografía Mono** | IBM Plex Mono | Datos, scores, código |
| **Tipografía Sans** | Inter | Cuerpo de texto |
| **Logo SVG** | Medidor de calibración vermilion/crema | Con chevrons `< >` de tinta editorial |

> ⚠️ **NO usar** el tema viejo "Obsidian Studio" (yunque ámbar, fondo oscuro, glassmorphism).
> Todo debe seguir el estilo Editorial Technical.

---

## ✅ Tareas Completadas

- [x] Renombrar proyecto de PromptQuill → Promptometer (código, UI, repos)
- [x] Publicar `promptometer-core@1.0.0` en npm
- [x] Desplegar app web en Vercel con API serverless (`/api/analyze`, `/api/improve`, `/api/adversarial`)
- [x] Sistema de scoring multidimensional (8 dimensiones + pesos por tipo de prompt)
- [x] Internacionalización (i18n) completo ES/EN
- [x] Footer Open Source con atribución `j0sp0nc3`, licencia MIT, links a repos
- [x] Claves i18n del footer en ES y EN
- [x] Logo SVG: medidor de calibración vermilion/crema (Editorial Technical)
- [x] Texto del logo: `Prompt<span>ometer</span>`
- [x] Fix scoring: prompts ultra-cortos (< 3 palabras como "Hola") → Grado F (~25/100)
- [x] Fix Vercel: `vercel.json` con builds estáticos explícitos para css/js
- [x] PR para dominio `promptometer.is-a.dev` (is-a-dev/register) con verificación TXT de Vercel
- [x] Tests de estrés: 14/14 PASS

---

## 📝 Tareas Pendientes

- [ ] Esperar aprobación del PR `promptometer.is-a.dev` por mantenedores de is-a-dev
- [ ] Configurar dominio en Vercel una vez aprobado el PR
- [ ] (Opcional) Mejorar el README.md del repo promptforge con tema Editorial Technical
- [ ] (Opcional) Añadir más templates de prompts en el catálogo

---

## 🚫 Decisiones de Diseño (NO cambiar sin consultar)

1. **Nombre de marca:** Promptometer (no PromptQuill, no PromptForge)
2. **Tema visual:** Editorial Technical (crema + vermilion + reglas finas)
3. **Motor de scoring:** Base 50 por dimensión, penalización fuerte para < 3 palabras
4. **i18n:** Español como idioma principal, inglés como secundario
5. **Despliegue:** Vercel (free tier) con `@vercel/node` para API y `@vercel/static` para assets
6. **Paquete npm:** `promptometer-core` (no `promptforge-core`)

---

## 📁 Estructura de Archivos Clave

```
promptforge/                    ← App Web (Vercel)
├── index.html                  ← SPA principal
├── css/index.css               ← Design system Editorial Technical
├── js/
│   ├── app.js                  ← Controlador principal de UI
│   ├── analyzer.js             ← Motor de análisis (8 dimensiones)
│   ├── signals.js              ← Extracción de señales compartidas
│   ├── patterns.js             ← Detección de anti-patrones
│   ├── i18n.js                 ← Diccionarios ES/EN
│   ├── rewriter.js             ← Mejora automática de prompts
│   └── export.js               ← Exportación de resultados
├── api/index.js                ← Vercel Serverless Functions
├── server.js                   ← Servidor local de desarrollo
├── vercel.json                 ← Configuración de despliegue Vercel
├── test_edge_cases.js          ← Suite de 14 tests de estrés
└── package.json                ← Dependencia: promptometer-core@^1.0.0

promptquill/                    ← Monorepo del Motor Core (npm)
└── packages/core/
    ├── promptometer-core.js    ← Motor JS (publicado en npm)
    ├── promptometer_core.py    ← Motor Python (paridad)
    └── promptometer-rules.json ← Reglas de evaluación
```

---

## 🔄 Última Actualización

- **Fecha:** 2026-08-06
- **Último commit promptforge:** `bfbae68` (fix SVG logo icon)
- **Último commit promptometer:** `67436ff` (fix scoring ultra-short)
- **Sesión anterior con:** Antigravity (Claude Opus)
