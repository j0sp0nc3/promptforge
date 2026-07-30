/**
 * PromptForge — Stress & Edge Case Test Suite
 * Evaluates core engine stability under extreme, malformed, and boundary inputs.
 */

const PromptForgeCore = require('./lib/promptquill-core.js');

const edgeCases = [
  { name: "1. Empty String", input: "" },
  { name: "2. Whitespace Only", input: "   \n\t  \r\n   " },
  { name: "3. Non-String Types (Null / Undefined / Number / Object)", input: null },
  { name: "4. Extremely Short Input", input: "a" },
  { name: "5. Massive Long Prompt (50,000+ chars)", input: "Eres un experto. ".repeat(3000) },
  { name: "6. Regex Poisoning / Special Chars", input: "([.*+?^${}()|[\\]\\\\])*+?^$//\\\\:::;;;:::" },
  { name: "7. Malformed Unclosed XML Tags", input: "<rol><contexto>No tag closure <tarea>hacer algo" },
  { name: "8. Deeply Nested & Random XML", input: "<a><b><c><d><e><f>nested</f></e></d></c></b></a>" },
  { name: "9. Code / Script / XSS Injection", input: "<script>alert('xss')</script><iframe src='javascript:void(0)'></iframe>" },
  { name: "10. Emojis & Special Unicode", input: "🤖🔥🚀 Eres un 🧠 superinteligente. Genera 💡 en 📦 JSON. ⚠️ No alucines 🛑" },
  { name: "11. Non-Latin Characters (Chinese / Arabic / Cyrillic)", input: "你是一个AI专家。请用JSON格式回答。Привет мир. مرحبا بالعالم" },
  { name: "12. Numbers & Punctuation Only", input: "1234567890 !@#$%^&*()_+-=[]{}|;:',.<>/?" },
  { name: "13. Single Repeated Character", input: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" },
  { name: "14. Extreme Keyword Stuffing (Gaming Attempt)", input: "You are an expert. Step by step. Chain of thought. JSON table format. Do not hallucinate. Verify. Scope limit. Example: input output." }
];

console.log("\n============================================================");
console.log("🧪 PROMPTFORGE CORE — SUITE DE PRUEBAS DE ESTRÉS Y LÍMITE");
console.log("============================================================\n");

let passedCount = 0;
let failedCount = 0;
const report = [];

edgeCases.forEach((test, idx) => {
  const testName = test.name;
  const input = test.input;
  
  try {
    const startTime = Date.now();
    
    // Execute Core Pipeline
    const analysis = PromptForgeCore.analyze(input);
    const adversarial = PromptForgeCore.runAdversarial(input);
    const improvement = PromptForgeCore.improve(input, analysis);
    
    const elapsed = Date.now() - startTime;

    // Integrity validations
    const hasNaN = JSON.stringify(analysis).includes("NaN") || JSON.stringify(adversarial).includes("NaN");
    const hasUndefinedStr = JSON.stringify(analysis).includes('"undefined"') || JSON.stringify(improvement).includes('"undefined"');
    const validScore = typeof analysis.overallScore === 'number' && analysis.overallScore >= 0 && analysis.overallScore <= 100;
    const validGrade = ['A', 'B', 'C', 'D', 'F'].includes(analysis.grade);

    if (hasNaN || hasUndefinedStr || !validScore || !validGrade) {
      failedCount++;
      report.push({
        name: testName,
        status: "FAIL",
        error: `Inconsistencia detectada: validScore=${validScore}, validGrade=${validGrade}, hasNaN=${hasNaN}, hasUndefinedStr=${hasUndefinedStr}`,
        elapsed: `${elapsed}ms`
      });
    } else {
      passedCount++;
      report.push({
        name: testName,
        status: "PASS",
        score: analysis.overallScore,
        grade: analysis.grade,
        elapsed: `${elapsed}ms`
      });
    }
  } catch (err) {
    failedCount++;
    report.push({
      name: testName,
      status: "CRASH",
      error: err.message || String(err),
      elapsed: "0ms"
    });
  }
});

console.log("📊 RESULTADOS DE LA SUITE DE PRUEBAS:\n");
report.forEach(r => {
  if (r.status === "PASS") {
    console.log(` ✅ ${r.name.padEnd(50)} | Status: PASS | Score: ${String(r.score).padStart(3)} (${r.grade}) | Tiempo: ${r.elapsed}`);
  } else {
    console.log(` ❌ ${r.name.padEnd(50)} | Status: ${r.status} | Error: ${r.error} | Tiempo: ${r.elapsed}`);
  }
});

console.log("\n------------------------------------------------------------");
console.log(`Resumen Total: ${passedCount + failedCount} Pruebas | ✅ Éxito: ${passedCount} | ❌ Fallos/Crashes: ${failedCount}`);
console.log("------------------------------------------------------------\n");
