# ============================================================================
# PromptForge Core — Python Stress & Edge Case Test Suite
# ============================================================================

import sys
import time
import json
sys.path.append('./lib')
import promptquill_core as promptforge_core

edge_cases = [
    {"name": "1. Prompt Vacío", "input": ""},
    {"name": "2. Espacios en Blanco & Saltos de Línea", "input": "   \n\t  \r\n   "},
    {"name": "3. Tipos No-String (None)", "input": None},
    {"name": "4. Carácter Único ('a')", "input": "a"},
    {"name": "5. Prompt Masivo Gigante (50,000+ chars)", "input": "Eres un experto. " * 3000},
    {"name": "6. Caracteres Especiales & Regex Poisoning", "input": "([.*+?^${}()|[\\]\\\\])*+?^$//\\\\:::;;;:::"},
    {"name": "7. Etiquetas XML Malformadas y Sin Cerrar", "input": "<rol><contexto>Sin cierre <tarea>hacer algo"},
    {"name": "8. XML Profundamente Anidado", "input": "<a><b><c><d><e><f>nested</f></e></d></c></b></a>"},
    {"name": "9. Inyección de Código HTML/XSS", "input": "<script>alert('xss')</script><iframe src='javascript:void(0)'></iframe>"},
    {"name": "10. Emojis y Caracteres Unicode Especiales", "input": "🤖🔥🚀 Eres un 🧠 superinteligente. Genera 💡 en 📦 JSON. ⚠️ No alucines 🛑"},
    {"name": "11. Idiomas No-Latinos (Chino / Ruso / Árabe)", "input": "你是一个AI专家。请用JSON格式回答。Привет мир. مرحبا بالعالم"},
    {"name": "12. Solo Números y Símbolos", "input": "1234567890 !@#$%^&*()_+-=[]{}|;:',.<>/?"},
    {"name": "13. Cadena Repetitiva Sin Separador", "input": "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"},
    {"name": "14. Gaming Masivo de Palabras Clave", "input": "You are an expert. Step by step. Chain of thought. JSON table format. Do not hallucinate. Verify. Scope limit. Example: input output."}
]

print("\n============================================================")
print("🧪 PROMPTFORGE CORE (PYTHON) — SUITE DE PRUEBAS DE ESTRÉS")
print("============================================================\n")

passed = 0
failed = 0

for test in edge_cases:
    name = test["name"]
    inp = test["input"]
    t0 = time.time()
    
    try:
        analysis = promptforge_core.analyze(inp)
        adversarial = promptforge_core.run_adversarial(inp)
        improved = promptforge_core.improve(inp, analysis)
        elapsed = round((time.time() - t0) * 1000, 2)

        raw_dump = json.dumps(analysis) + json.dumps(adversarial) + json.dumps(improved)
        if "NaN" in raw_dump or "null" in raw_dump and inp and len(str(inp).strip()) > 0:
            failed += 1
            print(f" ❌ {name:<52} | FAIL (Respuesta inconsistente) | {elapsed} ms")
        else:
            passed += 1
            score = analysis.get("overall_score", 0)
            grade = analysis.get("grade", "F")
            print(f" ✅ {name:<52} | PASS | Score: {score:>3} ({grade}) | {elapsed} ms")
    except Exception as e:
        failed += 1
        print(f" 💥 {name:<52} | CRASH: {e}")

print("\n------------------------------------------------------------")
print(f"Resumen Total: {len(edge_cases)} Pruebas | ✅ Éxito: {passed} | ❌ Fallos/Crashes: {failed}")
print("------------------------------------------------------------\n")
