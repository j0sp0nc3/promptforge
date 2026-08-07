/* ============================================================
   Promptometer — Content Moderation Module (serverless)
   ------------------------------------------------------------
   Protects the public leaderboard from spam, profanity, and
   malicious payloads. Zero dependencies. Three layers run before
   any prompt is persisted:

     A. Profanity / offensive content filter (ES + EN word lists)
     B. Malicious pattern detection (prompt injection, dangerous code)
     C. Anti-spam (rate limit, min score, deduplication)

   API:
     Moderation.check({ text, score, ip, redis })
       → { allowed: boolean, reason?: string, matches?: string[], detail?: string }

   reason values: 'profanity' | 'injection' | 'malicious_code'
                  | 'rate_limited' | 'low_score' | 'duplicate'
   ============================================================ */

const Moderation = (() => {

  // ── Layer A: Profanity / offensive word lists ──────────────
  // Curated high-confidence terms only (to minimize false positives).
  // Matching is case-insensitive, word-boundary aware, and detects
  // common obfuscation (l33t, repeated chars, spacing).
  const PROFANITY_ES = [
    // Insultos / slurs comunes (high confidence)
    'cabron', 'cabrón', 'hijo de puta', 'hija de puta', 'puta', 'puto', 'puta madre',
    'joder', 'gilipollas', 'imbecil', 'im bécil', 'pendejo', 'maricon', 'maricón',
    'zorra', 'culo', 'coño', 'verga', 'vergas', 'pene', 'polla', 'chocha', 'cochino',
    'chinga', 'chingar', 'chingado', 'pendeja', 'mamada', 'mamón', 'cabrona',
    'idiota', 'estupido', 'estúpido', 'estupida', 'estúpida', 'malparido',
    'maldito', 'maldita',
    // Discurso de odio / discriminación (slurs)
    'negrata', 'negro de mierda', 'sudaca', 'mojado', 'indio de mierda',
    'judío de mierda', 'maton', 'asesino',
    // Contenido sexual explícito
    'porno', 'pornografía', 'follar', 'follando', 'sexo oral', 'sexo anal',
    'masturbacion', 'masturbación', 'eyaculacion', 'eyaculación',
    'violar', 'violacion', 'violación', 'pedofilo', 'pedófilo', 'pedofilia',
    // Violencia gráfica
    'descuartizar', 'decapitar', 'asesinato', 'matar a', 'matar gente',
  ];

  const PROFANITY_EN = [
    // Profanity / insults
    'fuck', 'fucker', 'fucking', 'motherfucker', 'motherfuck', 'shit', 'shitty',
    'bitch', 'bastard', 'asshole', 'dick', 'dickhead', 'pussy', 'cunt', 'twat',
    'dumbass', 'jackass', 'prick', 'wanker', 'bollocks',
    // Slurs / hate speech
    'nigger', 'nigga', 'faggot', 'fag', 'retard', 'retarded', 'tranny',
    'kike', 'spic', 'chink', 'wetback', 'cracker', 'coon', 'gook',
    // Sexual content
    'porn', 'pornography', 'masturbat', 'ejaculat', 'orgasm',
    'rape', 'raping', 'rapist', 'pedophile', 'paedophile', 'pedophilia',
    // Graphic violence
    'decapitate', 'dismember', 'massacre', 'genocide', 'lynch',
    'kill yourself', 'kill all', 'how to murder',
  ];

  // ── Layer B: Malicious patterns ────────────────────────────
  // Prompt injection — attempts to override system instructions.
  const INJECTION_PATTERNS = [
    /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+(instructions?|prompts?|rules?)/i,
    /disregard\s+(all\s+)?(previous|prior|your)\s+(instructions?|rules?|guidelines?)/i,
    /you\s+are\s+(now|no\s+longer)\s+(an?\s+)?(ai|assistant|model|gpt|claude)/i,
    /system\s*(prompt|instruction|message)\s*[:=]/i,
    /(reveal|show|print|output)\s+(your\s+)?(system\s+)?(prompt|instructions?|rules?)/i,
    /override\s+(your|the|all)\s+(safety|content|filter)/i,
    /act\s+as\s+(dan|do anything now|evil|unrestricted)/i,
    /jailbreak|escape\s+(your|the)\s+(restrictions?|guardrails?)/i,
    /pretend\s+you\s+(have\s+no|don't\s+have|do\s+not\s+have)\s+(rules|restrictions|guardrails)/i,
    /\bDAN\b.*\bmode\b/i, // DAN jailbreak
  ];

  // Dangerous code execution patterns.
  const DANGEROUS_CODE_PATTERNS = [
    /\beval\s*\(/,                    // eval(
    /new\s+Function\s*\(/,            // new Function(
    /require\s*\(\s*['"]child_process/, // require('child_process')
    /exec\s*\(\s*['"]/,               // exec('cmd')
    /spawn\s*\(\s*['"]/,              // spawn('cmd')
    /<script[^>]*>/i,                 // <script> XSS
    /javascript:\s*[a-z]/i,           // javascript: URI
    /\brm\s+-rf?\s+[\//~]/,           // rm -rf / or ~
    /drop\s+table/i,                  // SQL DROP
    /;\s*delete\s+from/i,             // SQL DELETE
    /\bunion\s+select\b/i,            // SQL UNION injection
    /\bdocument\.cookie\b/i,          // cookie exfil
    /\bfetch\s*\(\s*['"]https?:\/\/[^'"]*['"]\s*\)\s*\.then/i, // blind exfil
  ];

  // ── Helpers ────────────────────────────────────────────────

  // Normalize text for matching: lowercase, collapse repeated
  // chars (soooooo→so), strip l33t (4→a, 3→e, 0→o, 1→i, $→s, @→a).
  function _normalize(text) {
    return text
      .toLowerCase()
      .replace(/[4@]/g, 'a')
      .replace(/[3]/g, 'e')
      .replace(/[1!|]/g, 'i')
      .replace(/[0]/g, 'o')
      .replace(/[$5]/g, 's')
      .replace(/([a-z])\1{2,}/g, '$1$1') // collapse 3+ repeats to 2
      .replace(/\s+/g, ' ');
  }

  // L33t-obfuscation resilient patterns for the most common profanity
  // roots. These catch deformations like f4ck, f_ck, sh1t, b!tch that
  // survive word-list matching because the substitution maps to a
  // different real letter (4→a turns "fuck" into "fack").
  const OBFUSCATION_PATTERNS = [
    /\bf[4a@*_\-\.]?c[kq]/i,           // fuck / f4ck / f@ck / fck
    /\bsh[1i!*_\-\.]?t/i,              // shit / sh1t / sh!t
    /\bb[1i!*_\-\.]?tch/i,            // bitch / b1tch / b!tch
    /\bc[u4*_\-\.]?nt/i,              // cunt / c4nt
    /\bp[u4*_\-\.]?ss[y4]/i,          // pussy / puzzy / pusy
    /\bd[1i!*_\-\.]?c[kq]/i,          // dick / d1ck / d!ck
    /\b[a4@$]ss[h0o]/i,               // asshole / a55hole
    /\b[a4@$][s5][s5][h0o][0o][l1i]/i, // asshole l33t variants
  ];

  function _checkWordList(text, list) {
    const normalized = _normalize(text);
    const matches = [];
    for (const word of list) {
      const w = _normalize(word);
      // Use word-boundary-ish matching; \b doesn't work well with
      // accented/non-latin chars, so we wrap with space/punct guards.
      const re = new RegExp('(?:^|[^a-záéíóúñü])' + w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '(?:[^a-záéíóúñü]|$)', 'i');
      if (re.test(normalized)) {
        matches.push(word);
      }
    }
    return matches;
  }

  // ── Layer C: Anti-spam constants ───────────────────────────
  const MIN_SCORE = 60;              // below this → rejected
  const RATE_LIMIT_SECONDS = 300;    // 5 minutes between submissions per IP
  const RATE_LIMIT_KEY = (ip) => `lb:ratelimit:${ip}`;
  const DEDUP_KEY = (hash) => `lb:dedup:${hash}`;

  // SHA-256 of text (Node 18+ has globalThis.crypto.subtle).
  async function _sha256(text) {
    try {
      const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
      return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      // Fallback: simple hash (less collision-resistant, but OK for dedup hint)
      let h = 0;
      for (let i = 0; i < text.length; i++) h = ((h << 5) - h + text.charCodeAt(i)) | 0;
      return 'fallback_' + Math.abs(h).toString(16);
    }
  }

  // ── Main entry point ───────────────────────────────────────
  // redis: optional { get, set } functions (Upstash client or no-op).
  // If redis is absent, layers C (rate limit/dedup) are skipped
  // (graceful degradation — useful when Upstash env vars are unset).
  async function check({ text, score, ip, redis }) {
    const content = (text || '').trim();

    if (!content) {
      return { allowed: false, reason: 'empty', detail: 'El prompt está vacío.' };
    }

    // ── Layer A: Profanity ──
    const profanity = [..._checkWordList(content, PROFANITY_ES), ..._checkWordList(content, PROFANITY_EN)];
    // Also check for l33t-obfuscated profanity (f4ck, sh1t, b!tch, etc.)
    const obfuscated = OBFUSCATION_PATTERNS.filter(re => re.test(content)).map(re => re.source);
    if (profanity.length > 0 || obfuscated.length > 0) {
      return {
        allowed: false,
        reason: 'profanity',
        matches: [...profanity, ...obfuscated],
        detail: 'El prompt contiene lenguaje ofensivo o inapropiado.',
      };
    }

    // ── Layer B: Malicious patterns ──
    for (const re of INJECTION_PATTERNS) {
      if (re.test(content)) {
        return {
          allowed: false,
          reason: 'injection',
          detail: 'Se detectó un intento de inyección de prompt. No se permiten intentos de sobreescribir las instrucciones del sistema.',
        };
      }
    }
    for (const re of DANGEROUS_CODE_PATTERNS) {
      if (re.test(content)) {
        return {
          allowed: false,
          reason: 'malicious_code',
          detail: 'Se detectó código potencialmente peligroso (ejecución remota, XSS, o destrucción de datos).',
        };
      }
    }

    // ── Layer C: Anti-spam (requires redis) ──
    if (redis && typeof redis.get === 'function') {
      const clientIp = ip || 'unknown';

      // Min score gate
      if (typeof score === 'number' && score < MIN_SCORE) {
        return {
          allowed: false,
          reason: 'low_score',
          detail: `La puntuación (${score}/100) es inferior al mínimo requerido (${MIN_SCORE}) para el ranking global.`,
        };
      }

      // Rate limit
      const rateKey = RATE_LIMIT_KEY(clientIp);
      const limited = await redis.get(rateKey);
      if (limited) {
        return {
          allowed: false,
          reason: 'rate_limited',
          detail: 'Has publicado un prompt hace menos de 5 minutos. Espera antes de enviar otro.',
        };
      }

      // Deduplication
      const hash = await _sha256(content);
      const dupKey = DEDUP_KEY(hash);
      const isDup = await redis.get(dupKey);
      if (isDup) {
        return {
          allowed: false,
          reason: 'duplicate',
          detail: 'Este prompt ya ha sido publicado. No se permiten duplicados.',
        };
      }
    }

    return { allowed: true };
  }

  // Called AFTER a prompt is accepted, to set the rate-limit + dedup
  // markers so the next identical/submitted-too-fast request is blocked.
  async function markSubmitted({ text, ip, redis }) {
    if (!redis || typeof redis.set !== 'function') return;
    const clientIp = ip || 'unknown';
    try {
      await redis.set(RATE_LIMIT_KEY(clientIp), '1', RATE_LIMIT_SECONDS);
      const hash = await _sha256((text || '').trim());
      await redis.set(DEDUP_KEY(hash), '1', 86400); // dedup lasts 24h
    } catch (e) {
      // Non-fatal: if redis is down, we just don't mark. Worst case
      // is a duplicate slips through — the leaderboard is still safe.
    }
  }

  return { check, markSubmitted, MIN_SCORE };
})();

module.exports = Moderation;
