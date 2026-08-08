# Seguridad — API de Promptometer

> Documento de auditoría de seguridad del API serverless (`api/index.js`)
> y servidor local (`server.js`). Última revisión: 2026-08-08.

---

## 📋 Resumen ejecutivo

El API implementa **6 capas de defensa** activas, verificadas con pruebas
de penetración reales contra producción (https://promptforge-beta-ten.vercel.app).
Se encontraron y corrigieron **2 vulnerabilidades** durante la auditoría.

| Capa | Implementación | Estado |
|:-----|:----------------|:------:|
| Autenticación (API Key) | `x-api-key` / `Authorization: Bearer` vía env var | ✅ |
| CORS restrictivo | Solo orígenes oficiales + localhost | ✅ |
| Rate limiting | 30 req/min por IP (in-memory) | ✅ |
| Límite de payload | 100 KB máx (413 si excede) | ✅ |
| Headers OWASP | `nosniff`, `DENY`, `X-XSS-Protection` | ✅ |
| Moderación de contenido | Profanidad, injection, código malicioso, anti-spam | ✅ |
| Sanitización de inputs | HTML strip en title/author/name/handle | ✅ (fix aplicado) |

---

## 🔓 Superficies de ataque y mitigaciones

### 1. Acceso no autorizado al API (`/api/analyze`, `/api/improve`, `/api/adversarial`)

**Modelo**: doble vía de autorización — el request pasa si tiene API key **O** viene
de la Web UI oficial (Origin/Referer/Host verificados).

```js
const isWebUI = isAllowedOrigin || isAllowedReferer || isSameOriginHost;
const hasValidApiKey = validateApiKey(req);
if (!isWebUI && !hasValidApiKey) return 401;
```

**Verificación en producción** (2026-08-08):
- ✅ Request sin Origin ni API key → `401 Unauthorized`
- ✅ Request con Origin válido → `200 OK`
- ✅ Request con Origin ajeno (`evil.com`) → `401 Unauthorized`
- ✅ Request con API key válida → `200 OK`

**API Key**: se lee **únicamente** de variables de entorno
(`PROMPTOMETER_API_KEY`). No hay secrets hardcodeados en el repositorio.

### 2. CORS (Cross-Origin Resource Sharing)

Solo se permite el header `Access-Control-Allow-Origin` para:
- `https://promptforge-beta-ten.vercel.app` (producción)
- `https://promptometer.is-a.dev` (dominio pendiente)
- `http://localhost:*` y `http://127.0.0.1:*` (desarrollo)

Cualquier otro origen recibe el CORS default del sitio de producción, no el suyo.

### 3. Rate limiting

- **General**: 30 requests/minuto por IP (mapa en memoria con cleanup a 1000 entradas)
- **Leaderboard**: adicionalmente 1 submit cada 5 minutos por IP (vía Redis SETEX)
- **Suggest-creator**: 5 sugerencias por día por IP (vía Redis)

**Nota**: el rate limiting general es in-memory por instancia serverless. En
Vercel, cada cold start reinicia el mapa. El rate limiting del leaderboard
(sí usa Redis cuando Upstash está configurado) sí es persistente entre
instancias.

### 4. Límite de payload

100 KB máximo por request body. Si se excede, se destruye la conexión
(`req.destroy()`) y se devuelve `413 Payload Too Large`. Previene ataques
de memoria y DoS por payloads gigantes.

### 5. Headers de seguridad OWASP

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
```

Estos se aplican en **todas** las respuestas, incluyendo errores.

### 6. Moderación de contenido (`api/moderation.js`)

Tres capas que se ejecutan **antes** de almacenar cualquier prompt en el
leaderboard público:

#### Capa A — Filtro de profanidad (ES + EN)
- Lista curada de ~70 términos de alta confianza (insultos, slurs, contenido
  sexual/violento) en español e inglés
- **Resistente a l33t speak**: patrones que detectan `f4ck`, `sh1t`, `b!tch`,
  `a55hole` mediante sustitución de caracteres y regex de obfuscación
- Normalización: lowercase, strip de l33t (`4→a`, `3→e`, `0→o`, `1→i`, `$→s`),
  colapso de repetidos (`soooo→soo`)

#### Capa B — Patrones maliciosos
- **Prompt injection**: `ignore previous instructions`, jailbreak DAN,
  `reveal system prompt`, `override safety`, etc. (10 patrones regex)
- **Código peligroso**: `eval(`, `child_process`, `<script>`, `rm -rf`,
  SQL `DROP TABLE`/`DELETE FROM`/`UNION SELECT`, `document.cookie` (13 patrones)

#### Capa C — Anti-spam (requiere Redis/Upstash)
- Score mínimo: ≥ 60/100 para el ranking global
- Rate limit: 1 submit por IP cada 5 minutos (Redis SETEX TTL 300s)
- Deduplicación: SHA-256 del prompt, bloquea duplicados por 24h

**Verificación en producción**:
- ✅ Prompt con grosería → `400 {"reason":"profanity"}`
- ✅ Prompt con injection → `400 {"reason":"injection"}`
- ✅ Prompt con `<script>` → `400 {"reason":"malicious_code"}`
- ✅ Prompt con score < 60 → `400 {"reason":"low_score"}`

Cuando Redis no está configurado, la Capa C se omite gracefulmente
(las capas A y B siguen funcionando).

---

## 🔧 Vulnerabilidades encontradas y corregidas

### VULN-1: XSS almacenado en `author` y `title` del leaderboard (CORREGIDO)

**Severidad**: Media (defense-in-depth — el cliente escapaba con `escapeHtml`,
pero el payload se almacenaba crudo en Redis)

**Descripción**: Los campos `title`, `author`, `name`, `handle`, y `reason`
del leaderboard y suggest-creator no se sanitizaban en el backend. Un
payload como `<img src=x onerror=alert(document.cookie)>` en el campo
`author` era aceptado y almacenado tal cual.

**Impacto**: Aunque el cliente usa `escapeHtml()` al renderizar (lo que
prevenía ejecución directa), el payload quedaba almacenado en Redis y
cualquier consumidor del API que no escapara sería vulnerable.

**Fix aplicado**: función `_sanitizeText()` que strippa HTML tags y
neutraliza comillas antes de almacenar:
```js
function _sanitizeText(raw, maxLen) {
  return String(raw)
    .replace(/<[^>]*>/g, '')     // strip HTML tags
    .replace(/"/g, '&quot;')     // neutralize attribute breakout
    .replace(/'/g, '&#x27;')
    .trim()
    .slice(0, maxLen || 200);
}
```

Aplicada en `_handleLeaderboardSubmit` (title, author) y
`_handleSuggestCreator` (name, handle, reason).

### VULN-2: Clave i18n `promptType.extraction` faltante (CORREGIDO)

**Severidad**: Baja (no era de seguridad, pero era un bug visible)

El tipo `extraction` fue añadido al analyzer sin su clave i18n, mostrando
`promptType.extraction` como texto crudo. Corregido añadiendo las claves
ES/EN.

---

## 🔑 Gestión de secrets

- **API Key**: `process.env.PROMPTOMETER_API_KEY` — configurada en Vercel,
  **nunca** en el código fuente.
- **Upstash Redis**: `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN`
  (con aliases para Vercel KV: `KV_REST_API_URL`, etc.) — configuradas en
  Vercel, nunca en el código.
- El repo no contiene ningún secret. Verificado: `grep -r "sk-\|Bearer \|password"
  api/ js/` no encuentra nada.

---

## 📊 Endpoints y su nivel de exposición

| Endpoint | Auth requerida | Moderación | Persistencia |
|:---------|:--------------|:-----------|:-------------|
| `POST /api/analyze` | API key **O** Web UI | — | No |
| `POST /api/improve` | API key **O** Web UI | — | No |
| `POST /api/adversarial` | API key **O** Web UI | — | No |
| `GET /api/leaderboard` | Público (por diseño) | — | Redis/memoria |
| `POST /api/leaderboard` | Web UI (Origin check) | ✅ Sí | Redis/memoria |
| `POST /api/suggest-creator` | Web UI (Origin check) | ✅ Sí | Redis/memoria |

---

## ✅ Checklist de verificación (re-ejecutable)

```bash
# 1. Sin auth → 401
curl -sL -o /dev/null -w "%{http_code}" -X POST \
  https://promptforge-beta-ten.vercel.app/api/analyze \
  -H "Content-Type: application/json" -d '{"prompt":"test"}'
# Esperado: 401

# 2. Con Origin válido → 200
curl -sL -o /dev/null -w "%{http_code}" -X POST \
  https://promptforge-beta-ten.vercel.app/api/analyze \
  -H "Content-Type: application/json" \
  -H "Origin: https://promptforge-beta-ten.vercel.app" \
  -d '{"prompt":"test"}'
# Esperado: 200

# 3. Profanidad bloqueada → 400
curl -sL -w "\n%{http_code}" -X POST \
  https://promptforge-beta-ten.vercel.app/api/leaderboard \
  -H "Content-Type: application/json" \
  -H "Origin: https://promptforge-beta-ten.vercel.app" \
  -d '{"prompt":"fucking test","title":"t","author":"a"}'
# Esperado: 400 reason:profanity

# 4. XSS en author sanitizado
curl -sL -X POST \
  https://promptforge-beta-ten.vercel.app/api/leaderboard \
  -H "Content-Type: application/json" \
  -H "Origin: https://promptforge-beta-ten.vercel.app" \
  -d '{"prompt":"<script>alert(1)</script>","title":"t","author":"a"}'
# Esperado: 400 reason:malicious_code
```

---

## 🚨 Reportar vulnerabilidades

Si encuentras una vulnerabilidad, **no abras un issue público**.
Envía un email privado a: `beroiza79@gmail.com` con los detalles.

Tiempo de respuesta objetivo: 48 horas.
