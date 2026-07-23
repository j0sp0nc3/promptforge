#!/usr/bin/env node

/**
 * PromptQuill Core — CLI Console Executable
 * Usage: node cli.js "Your prompt to evaluate here"
 */

const PromptQuillCore = require('./lib/promptquill-core.js');

const inputPrompt = process.argv.slice(2).join(' ');

if (!inputPrompt || !inputPrompt.trim()) {
  console.log(`
============================================================
  PromptQuill Core — CLI Evaluator v${PromptQuillCore.version}
============================================================
Uso:
  node cli.js "<tu prompt aquí>"

Ejemplo:
  node cli.js "Eres un experto en Node.js. Escribe una función concisa en formato JSON."
`);
  process.exit(0);
}

console.log('\n🔍 Analizando prompt con PromptQuill Core...\n');

const analysis = PromptQuillCore.analyze(inputPrompt);
const adversarial = PromptQuillCore.runAdversarial(inputPrompt);
const improvement = PromptQuillCore.improve(inputPrompt, analysis);

console.log('------------------------------------------------------------');
console.log(`📊 PUNTUACIÓN GENERAL : ${analysis.overallScore}/100 (Grado: ${analysis.grade})`);
console.log(`🏷️  TIPO DE PROMPT    : ${analysis.promptType}`);
console.log(`📏 CONTEO PALABRAS    : ${analysis.wordCount} palabras / ${analysis.charCount} caracteres`);
console.log(`🛡️  RESISTENCIA ADV.   : ${adversarial.overallResistance}/100`);
console.log('------------------------------------------------------------');

console.log('\n📐 Puntuación por Dimensiones:');
for (const [dim, dData] of Object.entries(analysis.dimensions)) {
  const bar = '█'.repeat(Math.round(dData.score / 10)) + '░'.repeat(10 - Math.round(dData.score / 10));
  console.log(`  • ${dim.padEnd(16)} : [${bar}] ${dData.score} pts`);
}

if (analysis.antiPatterns.length > 0) {
  console.log('\n⚠️ Anti-patrones Detectados:');
  analysis.antiPatterns.forEach(ap => {
    console.log(`  - [${ap.severity.toUpperCase()}] ${ap.name}: ${ap.suggestion}`);
  });
}

console.log('\n✨ Prompt Mejorado Propuesto:');
console.log('------------------------------------------------------------');
console.log(improvement.improvedPrompt);
console.log('------------------------------------------------------------\n');
