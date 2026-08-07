/**
 * Debug: analyze top-1 seed prompt and show dimension breakdown
 * Uses same pattern as test_edge_cases.js
 */
const fs = require('fs');
const path = require('path');

// Mock browser globals
globalThis.localStorage = {
  _store: {},
  getItem(k) { return this._store[k] || null; },
  setItem(k, v) { this._store[k] = String(v); },
  removeItem(k) { delete this._store[k]; }
};

const i18nCode    = fs.readFileSync(path.join(__dirname, 'js/i18n.js'), 'utf8');
const signalsCode = fs.readFileSync(path.join(__dirname, 'js/signals.js'), 'utf8');
const patternsCode= fs.readFileSync(path.join(__dirname, 'js/patterns.js'), 'utf8');
const analyzerCode= fs.readFileSync(path.join(__dirname, 'js/analyzer.js'), 'utf8');

(0, eval)(i18nCode.replace('const I18n =', 'globalThis.I18n ='));
(0, eval)(signalsCode.replace('const Signals =', 'globalThis.Signals ='));
(0, eval)(patternsCode.replace('const Patterns =', 'globalThis.Patterns ='));
(0, eval)(analyzerCode.replace('const Analyzer =', 'globalThis.Analyzer ='));

const TOP1 = `<rol>
Eres un sistema automatizado de extracción de datos estructurados especializado en procesar textos corporativos e informes de inteligencia de negocios.
</rol>

<contexto>
Se te proporcionará un texto no estructurado que contiene información sobre empresas, fusiones, adquisiciones, montos financieros y fechas clave.
</contexto>

<tarea>
Analiza el texto de entrada, identifica todas las entidades comerciales mencionadas y extrae la estructura de datos completa siguiendo estrictamente el esquema JSON indicado.
</tarea>

<formato_salida>
Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura:
{
  "transaccion": {
    "empresa_compradora": string | null,
    "empresa_adquirida": string | null,
    "monto_usd": number | null,
    "fecha_cierre": string | null,
    "sector": string
  },
  "confianza_extraccion": number,
  "justificacion": string
}
</formato_salida>

<restricciones>
- No incluyas explicaciones, saludos ni marcas de formato fuera del bloque JSON.
- Si falta algún dato, asigna valor null explícito en la propiedad correspondiente.
- Cita únicamente datos presentes en el texto original; no asumas montos ni fechas no especificadas.
</restricciones>

<ejemplos>
Entrada: "TechCorp adquirió SoftInc por 450 millones de dólares el 15 de marzo de 2025."
Salida:
{
  "transaccion": {
    "empresa_compradora": "TechCorp",
    "empresa_adquirida": "SoftInc",
    "monto_usd": 450000000,
    "fecha_cierre": "2025-03-15",
    "sector": "Tecnología"
  },
  "confianza_extraccion": 0.98,
  "justificacion": "Mención directa de compra, empresas y fecha en el texto."
}
</ejemplos>

<manejo_errores>
Si el texto de entrada no contiene ninguna transacción comercial válida, responde exactamente con:
{ "transaccion": null, "confianza_extraccion": 0.0, "justificacion": "No se detectaron transacciones en el texto de entrada." }
</manejo_errores>`;

const result = globalThis.Analyzer.analyze(TOP1);
const lang = globalThis.Analyzer._detectLanguage(TOP1);
const signals = globalThis.Signals.extract(TOP1, lang);
const promptType = globalThis.Signals.inferType(TOP1, signals, result.wordCount);
const weights = globalThis.Signals.weightsFor(promptType);

console.log('\n🔍 DIAGNÓSTICO TOP-1 SEED PROMPT');
console.log('='.repeat(65));
console.log(`📊 OVERALL SCORE: ${result.overallScore} / 100 (${result.grade})`);
console.log(`📝 Prompt type: "${promptType}"`);
console.log(`📏 Words: ${result.wordCount} | Chars: ${result.charCount}`);

console.log('\n📐 DIMENSIONES (score × weight → contribución):');
const dims = result.dimensions;
for (const [name, data] of Object.entries(dims)) {
  const w = weights[name] || 0;
  const contrib = (data.score * w).toFixed(1);
  const bar = '█'.repeat(Math.round(data.score / 5)) + '░'.repeat(20 - Math.round(data.score / 5));
  console.log(`  ${name.padEnd(16)} ${String(data.score).padStart(3)}/100  w=${(w*100).toFixed(0).padStart(2)}%  +${contrib.padStart(4)}  ${bar}`);
}

console.log('\n🔎 SIGNALS CLAVE:');
const interestingSignals = [
  'xmlPairs','xmlOpen','hasFewShot','hasNumericConstraint','hasStepByStep',
  'hasReAct','requestsOutputFormat','errorHandling','edgeCases',
  'roleAssignment','roleWithDomain','antiHallucination','scopeLimit',
  'vagueQualifiers','vagueAdjectives','bulletItems','numberedItems',
];
for (const s of interestingSignals) {
  if (signals[s] !== undefined) {
    const val = signals[s];
    const flag = (val === true || (typeof val === 'number' && val > 0)) ? '✅' : '❌';
    console.log(`  ${flag} ${s.padEnd(26)} = ${JSON.stringify(val)}`);
  }
}

console.log('\n💡 SUGERENCIAS DEL MOTOR:');
for (const s of result.suggestions || []) {
  console.log(`  • ${s}`);
}
