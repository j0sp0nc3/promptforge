# ============================================================================
# Promptometer Core — Universal Python Library (Zero Dependencies)
# Full parity with promptometer-core.js (v1.1.0)
# Supports camelCase and snake_case keys.
# ============================================================================

import re
import math
from typing import Any, Dict, List, Optional, Union

VERSION = "1.1.0"


class Signals:
    @staticmethod
    def extract(prompt: Optional[str]) -> Dict[str, Any]:
        if not prompt or not isinstance(prompt, str):
            text = ""
        else:
            text = prompt

        lower = text.lower()
        words = [w for w in re.split(r"\s+", lower) if w]
        word_count = len(words)

        xml_pairs = len(re.findall(r"<[a-z_]+>[\s\S]*?</[a-z_]+>", text, re.IGNORECASE))
        xml_open = len(re.findall(r"<[a-z_]+>", text, re.IGNORECASE))
        code_block_markers = len(re.findall(r"```", text))

        request_verb = bool(
            re.search(
                r"\b(respond|reply|return|output|answer|devuelve|responde|format|formatea|entrega|presenta)\b",
                lower,
            )
        )
        format_name = bool(
            re.search(
                r"\b(json|xml|csv|yaml|html|markdown|table|tabla|bullet\s?list|numbered\s?list|lista)\b",
                lower,
            )
        )
        requests_output_format = request_verb and format_name

        example_cue = bool(
            re.search(
                r"\b(example|ejemplo|e\.g\.|for instance|por ejemplo|sample|muestra)\b",
                lower,
            )
        )
        block_delim = code_block_markers >= 2 or bool(re.search(r"→|->|-->", text))
        has_few_shot = example_cue and block_delim

        has_numeric_constraint = bool(
            re.search(
                r"\b\d+\s*(words|palabras|items|elementos|sentences|oraciones|paragraphs|párrafos|points|puntos)\b",
                lower,
            )
        )
        has_step_by_step = bool(
            re.search(
                r"\b(step.?by.?step|paso a paso|think.{0,12}through|piensa.{0,12}detenidamente|chain of thought|cadena de pensamiento)\b",
                lower,
            )
        )
        has_tree_of_thought = bool(
            re.search(
                r"\b(tree of thoughts?|\btot\b|explore.{0,15}branch|múltiples caminos)\b",
                lower,
            )
        )

        role_assignment = bool(
            re.search(
                r"\b(you are (an?|the)|act as (an?|the)|eres un[ao]?|actúa como un[oa]?|your role is|tu rol es)\b",
                lower,
            )
        )
        role_with_domain = role_assignment and bool(
            re.search(
                r"\b(expert in|specialist in|experto en|especialista en)\b",
                lower,
            )
        )

        error_handling = bool(
            re.search(
                r"\b(if.{0,20}(invalid|missing|empty)|si.{0,20}(inválid|faltante|vacío)|fallback|default value|manejo de error)\b",
                lower,
            )
        )
        anti_hallucination = bool(
            re.search(
                r"\b(don'?t make up|no inventes|do not hallucinate|no alucines|cite your sources?|cita tus fuentes)\b",
                lower,
            )
        )
        scope_limit = bool(
            re.search(
                r"\b(scope|alcance|only (respond|answer)|solo (responde|contesta)|limited to|limitado a)\b",
                lower,
            )
        )

        # Agentic & MCP Signals (v1.1.0)
        has_agentic_loop = bool(
            re.search(
                r"\b(agent loop|autonomous agent|agente autónomo|keep (trying|iterating|executing)|sigue intentando|itera hasta|repeat until|repite hasta|loop until|bucle hasta|retry until|reintenta hasta|until (solved|resolved|success)|hasta que (resuelvas|termines|funcione)|step-by-step loop|bucle de pasos)\b",
                lower,
            )
        )
        has_loop_guard = bool(
            re.search(
                r"\b(max(imum)?_?(iterations?|turns?|steps?|attempts?)|(límite|máximo)\s*(máximo\s*)?(de\s*)?\d+\s*(pasos|iteraciones|intentos|steps|iterations)|no más de \d+|criterio de parada|condición de parada|stop condition|stop (when|if|after)|detén(te)?\s*(\w+\s*){0,3}(si|cuando|tras)|detenerse|detener el proceso|abort (if|when)|si no logras|fallback)\b",
                lower,
            )
        )
        has_formal_tool_schema = bool(
            re.search(
                r"(<tools?>[\s\S]*?(parameters?|args|properties|required|type:\s*(string|number|object|boolean|array))[\s\S]*?</tools?>|mcp\s*tool|tool_choice|tools:\s*\[[\s\S]*?parameters)",
                text,
                re.IGNORECASE,
            )
        )
        has_untyped_tool_call = bool(
            re.search(
                r"\b(call (the )?(tools?|functions?)|usa (las? )?(herramientas?|funciones?)|invoca (las? )?(herramientas?|funciones?)|execute (tools?|functions?)|ejecuta (las? )?(herramientas?|funciones?)|@tool|tool_choice)\b",
                lower,
            )
        ) and (not has_formal_tool_schema) and (not bool(re.search(r"\b(parameters?|argumentos|parámetros|inputs?|schema|json)\b", lower)))
        has_tool_untrusted_guard = bool(
            re.search(
                r"\b(untrusted (data|output|content|input)|datos no confiables|salida no confiable|tool outputs? (are|is) untrusted|treat tool (output|response) as untrusted|no ejecutes instrucciones (en|de) la herramienta|do not follow instructions inside (tool|function) (outputs?|results?))\b",
                lower,
            )
        )

        has_xml_tags = xml_pairs > 0 or xml_open >= 2

        return {
            "wordCount": word_count,
            "word_count": word_count,
            "hasXMLTags": has_xml_tags,
            "has_xml_tags": has_xml_tags,
            "requestsOutputFormat": requests_output_format,
            "requests_output_format": requests_output_format,
            "hasFewShot": has_few_shot,
            "has_few_shot": has_few_shot,
            "hasNumericConstraint": has_numeric_constraint,
            "has_numeric_constraint": has_numeric_constraint,
            "hasStepByStep": has_step_by_step,
            "has_step_by_step": has_step_by_step,
            "hasTreeOfThought": has_tree_of_thought,
            "has_tree_of_thought": has_tree_of_thought,
            "roleAssignment": role_assignment,
            "role_assignment": role_assignment,
            "roleWithDomain": role_with_domain,
            "role_with_domain": role_with_domain,
            "errorHandling": error_handling,
            "error_handling": error_handling,
            "antiHallucination": anti_hallucination,
            "anti_hallucination": anti_hallucination,
            "scopeLimit": scope_limit,
            "scope_limit": scope_limit,
            "hasAgenticLoop": has_agentic_loop,
            "has_agentic_loop": has_agentic_loop,
            "hasLoopGuard": has_loop_guard,
            "has_loop_guard": has_loop_guard,
            "hasFormalToolSchema": has_formal_tool_schema,
            "has_formal_tool_schema": has_formal_tool_schema,
            "hasUntypedToolCall": has_untyped_tool_call,
            "has_untyped_tool_call": has_untyped_tool_call,
            "hasToolUntrustedGuard": has_tool_untrusted_guard,
            "has_tool_untrusted_guard": has_tool_untrusted_guard,
        }

    @staticmethod
    def infer_type(signals: Dict[str, Any]) -> str:
        if signals.get("hasFormalToolSchema") or signals.get("hasUntypedToolCall"):
            return "tool-use"
        if signals.get("hasFewShot"):
            return "few-shot"
        if signals.get("hasStepByStep") or signals.get("hasTreeOfThought"):
            return "chainOfThought"
        if signals.get("roleAssignment") and signals.get("wordCount", 0) > 40:
            return "system"
        return "general"

    @staticmethod
    def weights_for(prompt_type: str) -> Dict[str, float]:
        if prompt_type == "system":
            return {"clarity": 0.15, "specificity": 0.15, "structure": 0.15, "robustness": 0.15, "context": 0.15, "outputFormat": 0.10, "chainOfThought": 0.05, "safety": 0.10}
        if prompt_type == "few-shot":
            return {"clarity": 0.15, "specificity": 0.20, "structure": 0.15, "robustness": 0.10, "context": 0.10, "outputFormat": 0.20, "chainOfThought": 0.05, "safety": 0.05}
        if prompt_type == "chainOfThought":
            return {"clarity": 0.15, "specificity": 0.15, "structure": 0.15, "robustness": 0.10, "context": 0.10, "outputFormat": 0.10, "chainOfThought": 0.20, "safety": 0.05}
        if prompt_type == "tool-use":
            return {"clarity": 0.12, "specificity": 0.16, "structure": 0.18, "robustness": 0.18, "context": 0.08, "outputFormat": 0.16, "chainOfThought": 0.04, "safety": 0.08}
        return {"clarity": 0.18, "specificity": 0.15, "structure": 0.13, "robustness": 0.12, "context": 0.12, "outputFormat": 0.12, "chainOfThought": 0.10, "safety": 0.08}


class Patterns:
    @staticmethod
    def detect(prompt: str, signals: Dict[str, Any]) -> Dict[str, Any]:
        trimmed = (prompt or "").strip()
        anti_patterns = []
        strengths = []

        if len(trimmed) < 10:
            anti_patterns.append({
                "id": "AP001",
                "name": "Prompt demasiado corto",
                "severity": "critical",
                "dimension": "clarity",
                "suggestion": "Extiende el prompt describiendo contexto y objetivo."
            })
        if not signals.get("requestsOutputFormat"):
            anti_patterns.append({
                "id": "AP003",
                "name": "Sin formato de salida",
                "severity": "high",
                "dimension": "outputFormat",
                "suggestion": "Especifica el formato deseado (ej. JSON, Tabla)."
            })
        if not signals.get("roleAssignment"):
            anti_patterns.append({
                "id": "AP005",
                "name": "Sin rol definido",
                "severity": "medium",
                "dimension": "context",
                "suggestion": 'Asigna un rol claro (ej. "Eres un analista experto...").'
            })
        if signals.get("wordCount", 0) > 25 and not signals.get("errorHandling"):
            anti_patterns.append({
                "id": "AP009",
                "name": "Sin manejo de errores",
                "severity": "medium",
                "dimension": "robustness",
                "suggestion": "Indica qué hacer ante entradas inválidas o vacías."
            })
        if not signals.get("antiHallucination") and bool(re.search(r"\b(dato|estadística|hecho|fact|number|número)\b", trimmed, re.IGNORECASE)):
            anti_patterns.append({
                "id": "AP030",
                "name": "Propenso a alucinaciones",
                "severity": "high",
                "dimension": "safety",
                "suggestion": 'Añade "no inventes datos" o "cita tus fuentes".'
            })

        # v1.1.0 Agentic & MCP Patterns
        if signals.get("hasAgenticLoop") and not signals.get("hasLoopGuard"):
            anti_patterns.append({
                "id": "AP048",
                "name": "Bucle agéntico autónomo sin condición de parada",
                "severity": "critical",
                "dimension": "robustness",
                "suggestion": "Define un límite máximo de iteraciones (ej. máximo 5 pasos) o criterio de parada."
            })
        if signals.get("hasUntypedToolCall"):
            anti_patterns.append({
                "id": "AP049",
                "name": "Llamada a herramientas sin contrato tipado",
                "severity": "high",
                "dimension": "outputFormat",
                "suggestion": "Define un bloque <tools> con parámetros tipados para function calling / MCP."
            })
        if signals.get("hasFormalToolSchema"):
            strengths.append({
                "id": "BP017",
                "name": "Contrato formal de herramientas y protocolo MCP",
                "dimension": "structure",
                "description": "El prompt define un esquema riguroso para herramientas y function calling."
            })

        return {
            "antiPatterns": anti_patterns,
            "anti_patterns": anti_patterns,
            "strengths": strengths
        }


class Analyzer:
    @staticmethod
    def analyze(prompt: Optional[str]) -> Dict[str, Any]:
        if not prompt or not isinstance(prompt, str) or not prompt.strip():
            return {
                "overallScore": 0,
                "overall_score": 0,
                "grade": "F",
                "wordCount": 0,
                "word_count": 0,
                "charCount": 0,
                "char_count": 0,
                "promptType": "general",
                "prompt_type": "general",
                "dimensions": {},
                "antiPatterns": [],
                "anti_patterns": [],
                "strengths": [],
                "suggestions": []
            }

        trimmed = prompt.strip()
        signals = Signals.extract(trimmed)
        word_count = signals["wordCount"]
        char_count = len(trimmed)
        prompt_type = Signals.infer_type(signals)
        weights = Signals.weights_for(prompt_type)

        dimensions = {
            "clarity": {
                "score": min(100, (70 if word_count > 15 else 40) + (15 if signals["roleAssignment"] else 0)),
                "findings": [] if word_count > 15 else ["El prompt es muy breve."],
                "suggestions": [] if word_count > 15 else ["Añade contexto y objetivo."]
            },
            "specificity": {
                "score": min(100, 50 + (30 if signals["hasNumericConstraint"] else 0) + (20 if signals["requestsOutputFormat"] else 0)),
                "findings": [] if signals["hasNumericConstraint"] else ["Define restricciones cuantitativas."],
                "suggestions": [] if signals["hasNumericConstraint"] else ['Añade cifras con unidades (ej. "5 ítems").']
            },
            "structure": {
                "score": min(100, 40 + (35 if signals["hasXMLTags"] else 0) + (25 if signals["hasFormalToolSchema"] else 0)),
                "findings": [] if signals["hasXMLTags"] else ["Usa etiquetas XML o markdown para estructurar."],
                "suggestions": []
            },
            "robustness": {
                "score": min(100, 40 + (30 if signals["errorHandling"] else 0) + (30 if signals["hasLoopGuard"] else 0) - (30 if (signals["hasAgenticLoop"] and not signals["hasLoopGuard"]) else 0)),
                "findings": [] if signals["errorHandling"] else ["Sin manejo de errores visible."],
                "suggestions": [] if signals["errorHandling"] else ["Indica qué hacer ante entradas inválidas."]
            },
            "context": {
                "score": min(100, 45 + (40 if signals["roleWithDomain"] else 20 if signals["roleAssignment"] else 0)),
                "findings": [] if signals["roleAssignment"] else ["No se define un rol."],
                "suggestions": [] if signals["roleAssignment"] else ["Asigna un rol con dominio."]
            },
            "outputFormat": {
                "score": min(100, (75 if signals["requestsOutputFormat"] else 35) + (25 if signals["hasFormalToolSchema"] else 0)),
                "findings": [] if signals["requestsOutputFormat"] else ["Sin formato de salida explícito."],
                "suggestions": [] if signals["requestsOutputFormat"] else ['Pide "responde en JSON" u otro formato.']
            },
            "chainOfThought": {
                "score": min(100, 90 if signals["hasStepByStep"] else 30),
                "findings": [] if signals["hasStepByStep"] else ["No solicita razonamiento paso a paso."],
                "suggestions": [] if signals["hasStepByStep"] else ['Añade "piensa paso a paso" para tareas complejas.']
            },
            "safety": {
                "score": min(100, (40 if signals["antiHallucination"] else 0) + (40 if signals["scopeLimit"] else 20) + (20 if signals["hasToolUntrustedGuard"] else 0)),
                "findings": [] if signals["antiHallucination"] else ["Sin guardrails anti-alucinación."],
                "suggestions": [] if signals["antiHallucination"] else ['Añade "no inventes datos" o "cita fuentes".']
            }
        }

        # Snake_case alias for dimensions
        dimensions["output_format"] = dimensions["outputFormat"]
        dimensions["chain_of_thought"] = dimensions["chainOfThought"]

        overall_score = 0.0
        for dim, w in weights.items():
            overall_score += dimensions[dim]["score"] * w

        overall_score_int = int(round(max(0, min(100, overall_score))))
        if overall_score_int >= 90:
            grade = "A"
        elif overall_score_int >= 75:
            grade = "B"
        elif overall_score_int >= 60:
            grade = "C"
        elif overall_score_int >= 45:
            grade = "D"
        else:
            grade = "F"

        pattern_results = Patterns.detect(trimmed, signals)

        suggestions = [
            {"priority": ap["severity"], "title": ap["name"], "description": ap["suggestion"]}
            for ap in pattern_results["antiPatterns"]
        ]

        return {
            "overallScore": overall_score_int,
            "overall_score": overall_score_int,
            "grade": grade,
            "wordCount": word_count,
            "word_count": word_count,
            "charCount": char_count,
            "char_count": char_count,
            "promptType": prompt_type,
            "prompt_type": prompt_type,
            "dimensions": dimensions,
            "antiPatterns": pattern_results["antiPatterns"],
            "anti_patterns": pattern_results["anti_patterns"],
            "strengths": pattern_results["strengths"],
            "suggestions": suggestions
        }


class Rewriter:
    @staticmethod
    def improve(prompt: Optional[str], analysis: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        if not prompt or not isinstance(prompt, str) or not prompt.strip():
            return {
                "improvedPrompt": "",
                "improved_prompt": "",
                "changes": [],
                "scoreImprovement": 0,
                "score_improvement": 0
            }

        working = prompt.strip()
        changes = []
        improved = working

        if not bool(re.search(r"<[a-z_]+>", working, re.IGNORECASE)):
            improved = (
                "<system_role>\n"
                "Eres un asistente experto altamente calificado.\n"
                "</system_role>\n\n"
                "<objective>\n"
                f"{working}\n"
                "</objective>\n\n"
                "<output_format>\n"
                "Presenta los resultados en un formato claro, estructurado y directo.\n"
                "</output_format>"
            )
            changes.append({
                "type": "restructured",
                "description": "Añadida estructura XML con <system_role>, <objective> y <output_format>"
            })

        current_score = 50
        if analysis and isinstance(analysis, dict):
            current_score = analysis.get("overallScore") or analysis.get("overall_score") or 50

        score_improvement = min(100, current_score + 20)

        return {
            "improvedPrompt": improved,
            "improved_prompt": improved,
            "changes": changes,
            "scoreImprovement": score_improvement,
            "score_improvement": score_improvement
        }


class Adversarial:
    @staticmethod
    def run_tests(prompt: Optional[str]) -> Dict[str, Any]:
        text = prompt or ""
        lower = text.lower()

        # 1. Jailbreak Direct Resistance
        status_jailbreak = "warning" if bool(re.search(r"\b(ignore (all|previous)|override|jailbreak)\b", lower)) else "pass"
        # 2. Data Exfiltration Guard
        status_exfil = "warning" if bool(re.search(r"\b(system prompt|reveal instructions|contraseña|api_key)\b", lower)) else "pass"
        # 3. Hallucination Mitigation
        status_hallucination = "pass" if bool(re.search(r"\b(don'?t make up|cite|no alucines|no inventes)\b", lower)) else "warning"
        # 4. Tool Poisoning & Output Injection
        if bool(re.search(r"\b(sin validar|without validat|raw execute|ejecuta.*directamente)\b", lower)):
            status_tp = "fail"
        elif bool(re.search(r"\b(untrusted|sanitiz|valida|schema|human-in-the-loop)\b", lower)):
            status_tp = "pass"
        else:
            status_tp = "warning"

        tests = [
            {"name": "Jailbreak Direct Resistance", "category": "Security", "status": status_jailbreak, "detail": "Evaluates resistance against instruction override."},
            {"name": "Data Exfiltration Guard", "category": "Privacy", "status": status_exfil, "detail": "Evaluates protection against system prompt leaks."},
            {"name": "Hallucination Mitigation", "category": "Robustness", "status": status_hallucination, "detail": "Checks for explicit anti-hallucination guardrails."},
            {"name": "Tool Poisoning & Output Injection", "category": "Security", "status": status_tp, "detail": "Evaluates resilience against malicious tool outputs and untrusted payload execution."}
        ]

        pass_count = sum(1 for t in tests if t["status"] == "pass")
        overall_resistance = int(round((pass_count / len(tests)) * 100))

        return {
            "overallResistance": overall_resistance,
            "overall_resistance": overall_resistance,
            "tests": tests
        }


# ============================================================================
# Task Assessment (experimental) — evalúa el PEDIDO que se entrega a un agente
# (humano u orquestador), no un system prompt. Harness-agnostic: el contexto
# (índice de archivos, turno, voz, idioma) llega como dato; assess() nunca
# hace I/O. Heurísticas portadas de yunta/intent.py (Promptometer v2.15.1).
# ============================================================================

_TA_EXT = r"py|js|ts|jsx|tsx|json|md|txt|html|css|yaml|yml|toml|sql|sh|m4a|mp3|wav|rs|go|c|cpp|cs|env"
_RE_TA_FILE_EXT = re.compile(r"\b[\w\-\./\\]+\.(" + _TA_EXT + r")\b", re.IGNORECASE)
_RE_TA_PATH = re.compile(r"\b[\w\-\.]+[/\\][\w\-\.]+\b")

# Dictado fonético (Whisper)
_RE_TA_VOICE_FILE_EXT = re.compile(r"\b(punto|dot)\s+(" + _TA_EXT + r")\b", re.IGNORECASE)
_RE_TA_VOICE_PATH = re.compile(r"\b[\w\-]+\s+(barra|slash)\s+[\w\-]+(\s+(barra|slash)\s+[\w\-]+)*\b", re.IGNORECASE)
_RE_TA_VOICE_SYMBOL = re.compile(
    r"\b(funci[oó]n|clase|m[eé]todo|variable|m[oó]dulo|comando|par[aá]metro|function|class|method)\s+([A-Za-z_]\w*)\b",
    re.IGNORECASE,
)
_RE_TA_VOICE_INDICATORS = re.compile(
    r"\b(punto\s+(py|js|ts|json|md|txt)|barra\s+\w+|slash\s+\w+|gui[oó]n\s+bajo|subgui[oó]n|abrir\s+comillas)\b",
    re.IGNORECASE,
)

_RE_TA_SYMBOLS = re.compile(
    r"(`[^`]+`|\b(def|class|async def)\s+[A-Za-z_]\w*|[A-Za-z_]\w*\(\)|\b[A-Za-z_]+_[A-Za-z0-9_]+\b|\b[A-Z][a-z0-9]+[A-Z][A-Za-z0-9]*\b)"
)
_RE_TA_ACTION = re.compile(
    r"\b(crea|crear|agrega|añade|elimina|borra|corrige|arregla|refactoriza|modifica|busca|encuentra|"
    r"analiza|explica|testea|prueba|optimiza|resume|transcribe|investiga|actualiza|ejecuta|reemplaza|"
    r"implementa|compara|extrae|genera|sintetiza|edita|create|add|remove|delete|fix|repair|refactor|modify|"
    r"search|find|analyze|explain|test|optimize|summarize|transcribe|investigate|update|run|replace|implement|edit)\b",
    re.IGNORECASE,
)
_RE_TA_MUTATING = re.compile(
    r"\b(crea|crear|agrega|añade|elimina|borra|corrige|arregla|refactoriza|modifica|actualiza|reemplaza|"
    r"implementa|edita|create|add|remove|delete|fix|repair|refactor|modify|update|replace|implement|edit)\b",
    re.IGNORECASE,
)
_RE_TA_EDIT = re.compile(
    r"\b(edita|modifica|corrige|arregla|refactoriza|actualiza|reemplaza|elimina|borra|agrega|añade|"
    r"edit|modify|fix|repair|refactor|update|replace|remove|delete|add)\b",
    re.IGNORECASE,
)
_RE_TA_CREATE = re.compile(r"\b(crea|crear|nuevo|nueva|create|new)\b", re.IGNORECASE)
_RE_TA_FIX = re.compile(r"\b(corrige|arregla|fix|repair|bug|falla)\b", re.IGNORECASE)
_RE_TA_READONLY = re.compile(
    r"\b(explica|resume|busca|encuentra|lista|muestra|describe|qu[eé] es|explain|summarize|search|find|list|show|what is)\b",
    re.IGNORECASE,
)
_RE_TA_CONTEXT_OR_ERROR = re.compile(
    r"\b(error|exception|traceback|failed|failure|errno|expected|actual|esperaba|retorna|falla con|"
    r"output|salida|código \d+|line \d+|línea \d+|reproduce|reproducir|KeyError|ValueError|TypeError|AttributeError)\b",
    re.IGNORECASE,
)
_RE_TA_CONSTRAINTS = re.compile(
    r"\b(sin|solo|únicamente|only|don't|no uses|usando|utilizando|respetando|mantén|mantener|debe|debería|"
    r"en vez de|instead of|sin romper|sin alterar|máximo|en viñetas|en español|en inglés)\b",
    re.IGNORECASE,
)
_RE_TA_ANTIPATTERN = re.compile(
    r"^(no anda|no funciona|arreglalo|arregla esto|falla|error|ayuda|help|fix this|fix it|hacelo|hazlo|dale|test|prueba|hola|buenas|ok)\b",
    re.IGNORECASE,
)
# Steering conciso en turnos 2+. Las reversiones viven en _RE_TA_REVERT: siguen
# siendo órdenes accionables, pero además marcan `correction`.
_RE_TA_STEERING = re.compile(
    r"\b(ahora\s+(corre|ejecuta|haz|aplica|muestra|agrega|pasa|sube|baja|cambia)|"
    r"corre(\s+los)?\s+(tests?|pruebas?|pytest)|"
    r"contin[uú]a|sigue(\s+adelante)?|proceed|continue|"
    r"muestra(\s+el)?\s+(diff|resultado|cambio|c[oó]digo|salida)|"
    r"cambia\s+.*por\s+.*|"
    r"agrega\s+(otro|m[aá]s|un)\s+(test|caso|ejemplo)|"
    r"explica\s+(el\s+punto|m[aá]s|mejor)|"
    r"procede|dale|adelante|perfecto|de acuerdo|yes|go ahead)\b",
    re.IGNORECASE,
)
_RE_TA_REVERT = re.compile(r"\b(deshaz|revi[eé]rt\w*|revert\w*|rollback|undo)\b", re.IGNORECASE)
# Quejas de desvío: señalan error pero no dicen qué se esperaba.
_RE_TA_COMPLAINT = re.compile(
    r"(^\s*no\s*[,.!;]|\bas[ií] no\b|\bte equivocaste\b|\best[aá] mal\b|\beso no\b|\bno era eso\b|\bincorrecto\b|"
    r"\bthat'?s wrong\b|\bnot what i\b|\bwrong\b)",
    re.IGNORECASE,
)
_RE_TA_EXPECTED = re.compile(
    r"\b(esperaba|deber[ií]a|en vez de|en lugar de|expected|should|instead)\b",
    re.IGNORECASE,
)
_RE_TA_RESEARCH_SOURCES = re.compile(
    r"\b(audio|audios|m4a|mp3|wav|grabaci[oó]n|grabaciones|c[aá]tedra|c[aá]tedras|clase|clases|"
    r"conferencia|charla|video|podcast|entrevista|documento|documentos|pdf|docx?|txt|csv|paper|papers|"
    r"estudio|url|enlace|link|art[ií]culo|art[ií]culos|fuente|fuentes|bibliograf[ií]a|dataset|datos|"
    r"transcripci[oó]n)\b|https?://|www\.",
    re.IGNORECASE,
)
_RE_TA_RESEARCH_OUTPUT_FORMAT = re.compile(
    r"\b(resumen|vi[nñ]etas|puntos\s+clave|bullet\s*points?|glosario|anki|flashcards?|"
    r"comparativa|tabla|cuadro|s[ií]ntesis|informe|reporte|minuta|cronolog[ií]a|timeline|"
    r"mapa\s+(conceptual|mental)|esquema|outline|preguntas\s+frecuentes|faq|cuestionario|gu[ií]a)\b",
    re.IGNORECASE,
)
_RE_TA_RESEARCH_TOPIC = re.compile(
    r"\b(medicina|m[eé]dica?|farmacolog[ií]a|cardiolog[ií]a|neurolog[ií]a|anatom[ií]a|fisiolog[ií]a|"
    r"biolog[ií]a|qu[ií]mica|derecho|econom[ií]a|finanzas|historia|filosof[ií]a|psicolog[ií]a|"
    r"arquitectura|seguridad|negocio|estrategia|mercado|cl[ií]nic[ao]|paciente|diagn[oó]stico|"
    r"tratamiento|enfermedad|s[ií]ntoma|conductas?\s+motivadas?|inteligencia\s+artificial|"
    r"machine\s+learning|f[aá]rmacos?)\b",
    re.IGNORECASE,
)

_TA_SOFTWARE_KEYWORDS = [
    r"\bcode\b", r"\bcódigo\b", r"\bfix\b", r"\brefactor\b", r"\btest\b", r"\btests\b",
    r"\bpytest\b", r"\bdotnet\b", r"\bclass\b", r"\bfunction\b", r"\bfunción\b",
    r"\bdef\b", r"\bimport\b", r"\bbug\b", r"\berror\b", r"\bpatch\b", r"\bcommit\b",
    r"\brepository\b", r"\brepositorio\b", r"\bendpoint\b", r"\bapi\b", r"\bscript\b",
    r"\bfile\b", r"\barchivo\b", r"\bbuild\b", r"\bcompil\b",
]
_TA_RESEARCH_KEYWORDS = [
    r"\bcátedra\b", r"\bclase\b", r"\bmedicina\b", r"\bmedica\b", r"\bmédica\b",
    r"\bresumen\b", r"\bresumir\b", r"\btranscrib\b", r"\btranscripción\b",
    r"\b audio\b", r"\bvoz\b", r"\bvoice\b", r"\blecture\b", r"\bflashcard\b",
    r"\banki\b", r"\bglosario\b", r"\bconsultoría\b", r"\bconsulting\b",
    r"\binvestigación\b", r"\bresearch\b", r"\banálisis\b", r"\banalize\b",
]
_TA_DEEP_KEYWORDS = [
    r"razonamiento profundo", r"piensa profundamente", r"analiza en detalle",
    r"think hard", r"deep reasoning", r"deep think", r"analiza a fondo",
    r"pensamiento profundo", r"razona profundamente", r"modo profundo",
    r"evalúa exhaustivamente", r"arquitectura", r"refactorización compleja",
    r"causa raíz", r"root cause", r"diagnóstico profundo", r"demostración",
]
_TA_FAST_KEYWORDS = [
    r"\brápido\b", r"\brapido\b", r"\bsin pensar\b", r"\bquick\b", r"\bfast\b", r"\bsencillo\b",
    r"\bdime la hora\b", r"\bhola\b", r"\bgracias\b",
]

# Stems de archivo que son palabras demasiado comunes para reconocerlas como módulo.
_TA_MODULE_STOPLIST = {
    "test", "tests", "main", "index", "config", "utils", "util", "init", "__init__", "setup",
    "readme", "license", "types", "common", "base", "core", "data", "file", "files", "todo",
    "plan", "spec", "lessons", "package", "package-lock", "manifest", "robots", "sitemap",
}

_TA_SEVERITY_RANK = {"critical": 0, "high": 1, "medium": 2, "low": 3}

_TA_MESSAGES = {
    "es": {
        "TA000": "El prompt está vacío. Proporciona una instrucción concreta.",
        "TA001_code": "Evita órdenes ambiguas ('arreglalo', 'no anda'); detalla qué falla, el error o el archivo objetivo para ahorrar turnos.",
        "TA001_research": "Evita órdenes ambiguas; detalla el tema a sintetizar, la fuente de datos o el resultado esperado.",
        "TA002": "Prompt muy escueto. Describir la tarea en mayor detalle ahorra búsquedas y turnos innecesarios.",
        "TA003": "Indica la acción concreta y el archivo o símbolo objetivo (ej. `src/auth.py`, `login()`) para evitar exploración innecesaria.",
        "TA004": "El archivo '{file}' no existe en el workspace; el agente fallará al leerlo. Verifica la ruta o di que hay que crearlo.",
        "TA005": "El pedido abarca {files} archivos y {objectives} objetivos: alto riesgo de saturar el contexto o truncar la salida. Divídelo en lotes de 1-2 archivos.",
        "TA006_complaint": "Decir que está mal no alcanza: indica qué esperabas en vez de eso (ej. 'esperaba X y obtuve Y', o el archivo/función a corregir).",
        "TA006_revert": "Tras revertir, indica qué esperabas para que el siguiente intento no repita el desvío.",
        "TA007": "Añadir el mensaje de error o el comportamiento esperado ayuda a resolver la tarea en un solo turno.",
        "TA008": "Indica criterios o restricciones (ej. 'sin romper tests', 'sin alterar la API') para prevenir efectos colaterales.",
        "TA009": "Especifica el formato deseado (ej. 'resumen en viñetas', 'glosario', 'tabla') para evitar re-generaciones costosas.",
        "TA010": "Indica la fuente (ej. audio, URL, documento) o la temática clave para acotar el contexto.",
        "ok_steering": "Directiva concisa de seguimiento: aprovecha el contexto previo ahorrando tokens.",
        "ok_code": "Pedido específico: archivo, objetivo y contexto definidos, minimizando turnos y costo.",
        "ok_research": "Pedido claro: tema, fuente y formato definidos para resolver en un solo turno.",
        "scaffold_code": "En {file}, {action} {symbol} para [resultado esperado] sin romper [tests/restricción].",
        "scaffold_correction": "Esperaba [comportamiento esperado] pero obtuve [resultado actual] en [archivo/función].",
        "scaffold_research": "Sintetiza {topic} en formato [viñetas/tabla] a partir de {source} enfocándote en [criterio].",
        "ph_file": "[archivo]", "ph_action": "[acción]", "ph_symbol": "[función/símbolo]",
        "ph_topic": "[tema]", "ph_source": "[audio/documento/URL]",
    },
    "en": {
        "TA000": "The prompt is empty. Provide a concrete instruction.",
        "TA001_code": "Avoid ambiguous orders ('fix it', 'doesn't work'); state what fails, the error or the target file to save turns.",
        "TA001_research": "Avoid ambiguous orders; state the topic, the data source or the expected result.",
        "TA002": "Prompt too terse. Describing the task in more detail saves searches and extra turns.",
        "TA003": "State the concrete action and the target file or symbol (e.g. `src/auth.py`, `login()`) to avoid needless exploration.",
        "TA004": "File '{file}' does not exist in the workspace; the agent will fail to read it. Check the path or say it must be created.",
        "TA005": "The request spans {files} files and {objectives} goals: high risk of context saturation or truncated output. Split it into batches of 1-2 files.",
        "TA006_complaint": "Saying it's wrong is not enough: state what you expected instead (e.g. 'expected X, got Y', or the file/function to fix).",
        "TA006_revert": "After reverting, state what you expected so the next attempt doesn't repeat the drift.",
        "TA007": "Adding the error message or the expected behavior helps solve the task in a single turn.",
        "TA008": "State criteria or constraints (e.g. 'without breaking tests', 'keep the API') to prevent side effects.",
        "TA009": "Specify the desired format (e.g. 'bullet summary', 'glossary', 'table') to avoid costly regenerations.",
        "TA010": "State the source (e.g. audio, URL, document) or key topic to narrow the context.",
        "ok_steering": "Concise follow-up directive: reuses prior context and saves tokens.",
        "ok_code": "Specific request: file, target and context defined, minimizing turns and cost.",
        "ok_research": "Clear request: topic, source and format defined to solve it in a single turn.",
        "scaffold_code": "In {file}, {action} {symbol} so that [expected result] without breaking [tests/constraint].",
        "scaffold_correction": "I expected [expected behavior] but got [actual result] in [file/function].",
        "scaffold_research": "Synthesize {topic} as [bullets/table] from {source} focusing on [criterion].",
        "ph_file": "[file]", "ph_action": "[action]", "ph_symbol": "[function/symbol]",
        "ph_topic": "[topic]", "ph_source": "[audio/document/URL]",
    },
}


def _ta_norm_path(p: str) -> str:
    p = p.strip().strip("`'\".,;:()[]{}").replace("\\", "/")
    while p.startswith("./"):
        p = p[2:]
    return p.lower()


def _ta_voice_normalize(text: str) -> str:
    """Convierte dictado fonético a sintaxis ('yunta barra intent punto py' → 'yunta/intent.py')."""
    out = re.sub(r"\s+(barra|slash)\s+", "/", text, flags=re.IGNORECASE)
    return re.sub(r"\s+(punto|dot)\s+(" + _TA_EXT + r")\b", r".\2", out, flags=re.IGNORECASE)


class TaskAssessor:
    """Evalúa pedidos de trabajo para agentes (0 ms, 0 tokens, sin I/O)."""

    @staticmethod
    def classify(prompt: str) -> str:
        if not prompt or not prompt.strip():
            return "code"
        lower = prompt.lower()
        research = sum(1 for kw in _TA_RESEARCH_KEYWORDS if re.search(kw, lower))
        software = sum(1 for kw in _TA_SOFTWARE_KEYWORDS if re.search(kw, lower))
        if re.search(r"\b[\w\-\./\\]+\.(py|js|ts|jsx|tsx|rs|go|c|cpp|cs)\b", lower) or re.search(
            r"\b(punto|dot)\s+(py|js|ts|jsx|tsx|rs|go|c|cpp|cs)\b", lower
        ):
            software += 2
        # Órdenes de reparación/edición y símbolos de código también son señal de software
        # ('arreglalo', 'no anda', `get_user()`), aunque no nombren archivo.
        if re.search(r"\b(arregl|corrig|edit|deshaz|revi[eé]rt|refactori|ayuda)|\bno (anda|funciona)\b|\bfalla\b", lower):
            software += 1
        if _RE_TA_SYMBOLS.search(prompt):
            software += 1
        if research > software:
            return "research"
        if software > 0:
            return "code"
        return "research"

    @staticmethod
    def _parse_context(context: Any) -> Dict[str, Any]:
        ctx = context if isinstance(context, dict) else {}
        known = ctx.get("known_files", ctx.get("knownFiles"))
        if isinstance(known, (list, tuple, set, frozenset)):
            known = [_ta_norm_path(f) for f in known if isinstance(f, str) and f.strip()]
        else:
            known = []
        turn = ctx.get("turn", 1)
        turn = turn if isinstance(turn, int) and not isinstance(turn, bool) and turn >= 1 else 1
        is_voice = ctx.get("is_voice", ctx.get("isVoice", False)) is True
        lang = ctx.get("lang", "es")
        lang = lang if lang in _TA_MESSAGES else "es"
        return {"known_files": known, "turn": turn, "is_voice": is_voice, "lang": lang}

    @staticmethod
    def _ground(text: str, intent: str, known: List[str]) -> Dict[str, List[str]]:
        mentioned: List[str] = []
        for m in list(_RE_TA_FILE_EXT.finditer(text)) + list(_RE_TA_PATH.finditer(text)):
            p = _ta_norm_path(m.group(0))
            if p and p not in mentioned and not re.match(r"^(https?:|www\.)", p):
                mentioned.append(p)
        verified: List[str] = []
        missing: List[str] = []
        modules: List[str] = []
        if known:
            for p in mentioned:
                is_file = bool(_RE_TA_FILE_EXT.fullmatch(p))
                hit = any(f == p or f.endswith("/" + p) for f in known)
                is_dir = (not is_file) and any(f.startswith(p + "/") or ("/" + p + "/") in f for f in known)
                if hit or is_dir:
                    verified.append(p)
                elif is_file:
                    missing.append(p)
            if intent == "code":
                stems: Dict[str, str] = {}
                for f in known:
                    base = f.rsplit("/", 1)[-1]
                    stem = base.rsplit(".", 1)[0] if "." in base else base
                    if len(stem) >= 4 and stem not in _TA_MODULE_STOPLIST:
                        stems.setdefault(stem, f)
                covered = set()
                for p in mentioned:
                    base = p.rsplit("/", 1)[-1]
                    covered.add(base.rsplit(".", 1)[0] if "." in base else base)
                    covered.update(p.split("/"))
                for tok in re.findall(r"[a-z_][\w\-]*", text.lower()):
                    if tok in stems and tok not in covered and tok not in modules:
                        modules.append(tok)
        return {"mentioned": mentioned, "verified": verified, "missing": missing, "modules": modules}

    @staticmethod
    def assess(prompt: Optional[str], context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        ctx = TaskAssessor._parse_context(context)
        turn, lang, known = ctx["turn"], ctx["lang"], ctx["known_files"]
        msg = _TA_MESSAGES[lang]
        grounded = bool(known)
        text = prompt.strip() if isinstance(prompt, str) else ""

        if not text:
            return TaskAssessor._result(
                score=0, intent="code", targets={"mentioned": [], "verified": [], "missing": [], "modules": []},
                grounded=grounded, risk="high", files=0, objectives=0, split=False, tier="standard",
                steering=False, correction=False, signals=[],
                issues=[{"id": "TA000", "severity": "critical", "message": msg["TA000"]}],
                tip=msg["TA000"], scaffold=msg["scaffold_code"].format(
                    file=msg["ph_file"], action=msg["ph_action"], symbol=msg["ph_symbol"]),
                turn=turn, lang=lang,
            )

        lower = text.lower()
        words = text.split()
        char_count = len(text)
        intent = TaskAssessor.classify(text)
        signals: List[str] = []
        issues: List[Dict[str, str]] = []

        has_voice = (
            ctx["is_voice"]
            or bool(_RE_TA_VOICE_FILE_EXT.search(text))
            or bool(_RE_TA_VOICE_PATH.search(text))
            or bool(_RE_TA_VOICE_INDICATORS.search(text))
            or bool(_RE_TA_VOICE_SYMBOL.search(text))
        )
        if has_voice:
            signals.append("expresión técnica fonética (modo voz)")
        ground_text = _ta_voice_normalize(text) if has_voice else text
        targets = TaskAssessor._ground(ground_text, intent, known)

        has_action = bool(_RE_TA_ACTION.search(text))
        has_std_file = bool(_RE_TA_FILE_EXT.search(text) or _RE_TA_PATH.search(text))
        has_voice_file = bool(_RE_TA_VOICE_FILE_EXT.search(text) or _RE_TA_VOICE_PATH.search(text))
        has_std_sym = bool(_RE_TA_SYMBOLS.search(text))
        has_voice_sym = bool(_RE_TA_VOICE_SYMBOL.search(text))
        has_context_err = bool(_RE_TA_CONTEXT_OR_ERROR.search(text))
        has_constraints = bool(_RE_TA_CONSTRAINTS.search(text))
        has_source = bool(_RE_TA_RESEARCH_SOURCES.search(text) or _RE_TA_FILE_EXT.search(text))
        has_output_format = bool(_RE_TA_RESEARCH_OUTPUT_FORMAT.search(text))
        has_topic = bool(_RE_TA_RESEARCH_TOPIC.search(text))
        has_symbol = has_std_sym or has_voice_sym
        creating = bool(_RE_TA_CREATE.search(text))
        if grounded:
            # Un archivo inexistente que se pide crear es un objetivo válido
            has_target = bool(targets["verified"] or targets["modules"] or (creating and targets["missing"]))
        else:
            has_target = has_std_file or has_voice_file

        is_revert = turn > 1 and bool(_RE_TA_REVERT.search(text))
        is_complaint = turn > 1 and bool(_RE_TA_COMPLAINT.search(text))
        has_counterexample = bool(
            has_target or has_symbol or has_context_err or _RE_TA_EXPECTED.search(text) or targets["mentioned"]
        )
        correction = is_revert or is_complaint
        steering = turn > 1 and (is_revert or (bool(_RE_TA_STEERING.search(text)) and not is_complaint))

        actions = []
        for m in _RE_TA_ACTION.finditer(text):
            verb = m.group(0).lower()
            if verb not in actions:
                actions.append(verb)
        if grounded:
            files = len(targets["verified"]) + len(targets["missing"]) + len(targets["modules"])
        else:
            files = len(targets["mentioned"])
        objectives = len(actions)
        split = files >= 3 or (objectives >= 3 and files >= 2)

        if steering:
            # Turno 2+: directiva concisa de seguimiento
            score = 80
            signals.append("dirección concisa de seguimiento (steering)")
            if has_action:
                score += 5
            if has_constraints or has_context_err:
                score += 5
            score = min(100, max(50, score))
            if is_revert and not has_counterexample:
                issues.append({"id": "TA006", "severity": "low", "message": msg["TA006_revert"]})
        else:
            score = 20
            if turn == 1:
                if len(words) <= 3 or char_count < 15:
                    score -= 20
                elif 20 <= char_count <= 800:
                    score += 15
                    signals.append("longitud adecuada")
            else:
                if 20 <= char_count <= 800:
                    score += 15
                    signals.append("longitud adecuada")
                elif len(words) <= 5:
                    score += 10
                    signals.append("concisión en seguimiento ahorra tokens")

            if has_action:
                score += 20
                signals.append("acción clara")

            antipattern = turn == 1 and bool(_RE_TA_ANTIPATTERN.search(text))

            if intent == "code":
                if grounded:
                    if targets["verified"]:
                        score += 30
                        signals.append("archivo verificado en workspace")
                    elif targets["modules"]:
                        score += 20
                        signals.append("módulo del workspace reconocido")
                    elif creating and targets["missing"]:
                        score += 25
                        signals.append("archivo nuevo a crear")
                elif has_voice_file:
                    score += 25
                    signals.append("archivo o ruta objetivo (fonético)")
                elif has_std_file:
                    score += 25
                    signals.append("archivo o ruta objetivo")

                if targets["missing"] and _RE_TA_EDIT.search(text) and not creating:
                    score -= 15
                    signals.append("archivo inexistente en workspace")
                    issues.append({"id": "TA004", "severity": "high",
                                   "message": msg["TA004"].format(file=targets["missing"][0])})

                if has_voice_sym:
                    score += 15
                    signals.append("símbolo o identificador técnico (fonético)")
                elif has_std_sym:
                    score += 15
                    signals.append("símbolo o identificador técnico")
                if has_context_err:
                    score += 15
                    signals.append("contexto de error o diagnóstico")
                if has_constraints:
                    score += 10
                    signals.append("criterios o restricciones")
                if turn > 1 and not (has_std_file or has_voice_file):
                    score += 15
                    signals.append("contexto heredado de turno previo")
            else:
                if has_source:
                    score += 20
                    signals.append("fuente o insumo de datos")
                if has_output_format:
                    score += 15
                    signals.append("formato de salida definido")
                if has_topic:
                    score += 10
                    signals.append("claridad temática o dominio")
                if has_constraints:
                    score += 10
                    signals.append("criterios o restricciones")
                if turn > 1:
                    score += 15
                    signals.append("contexto heredado de turno previo")

            if antipattern:
                score -= 25
                signals.append("antipatrón ambiguo detectado")
                issues.append({"id": "TA001", "severity": "high", "message": msg["TA001_" + intent]})
            elif turn == 1 and (len(words) <= 3 or char_count < 15):
                issues.append({"id": "TA002", "severity": "high", "message": msg["TA002"]})

            if is_complaint and not has_counterexample:
                score = min(score, 45)
                signals.append("corrección sin contra-ejemplo")
                issues.append({"id": "TA006", "severity": "high", "message": msg["TA006_complaint"]})

            if intent == "code":
                if turn == 1 and not has_target and not has_symbol and not targets["missing"]:
                    issues.append({"id": "TA003", "severity": "medium", "message": msg["TA003"]})
                if _RE_TA_FIX.search(text) and not has_context_err:
                    issues.append({"id": "TA007", "severity": "low", "message": msg["TA007"]})
                if turn == 1 and not has_constraints and _RE_TA_MUTATING.search(text):
                    issues.append({"id": "TA008", "severity": "low", "message": msg["TA008"]})
            else:
                if not has_output_format and turn == 1:
                    issues.append({"id": "TA009", "severity": "medium", "message": msg["TA009"]})
                if not has_source and turn == 1:
                    issues.append({"id": "TA010", "severity": "medium", "message": msg["TA010"]})

        if split:
            score = min(score, 75)
            signals.append("pedido multi-archivo / multi-objetivo")
            issues.append({"id": "TA005", "severity": "medium",
                           "message": msg["TA005"].format(files=files, objectives=objectives)})

        score = max(5, min(100, score))

        # Riesgo de exploración (cualitativo)
        if steering:
            risk = "low"
        elif intent == "code":
            if targets["missing"] and not has_target:
                risk = "high"
            elif has_target and (has_symbol or has_context_err):
                risk = "low"
            elif has_target or has_symbol or turn > 1:
                risk = "medium"
            else:
                risk = "high"
        else:
            if has_source and has_output_format:
                risk = "low"
            elif has_source or has_output_format or turn > 1:
                risk = "medium"
            else:
                risk = "high"

        # Tier de modelo recomendado (genérico; cada harness lo mapea a sus modelos)
        if split or any(re.search(kw, lower) for kw in _TA_DEEP_KEYWORDS):
            tier = "deep"
        elif (
            steering
            or any(re.search(kw, lower) for kw in _TA_FAST_KEYWORDS)
            or (_RE_TA_READONLY.search(text) and len(words) <= 40 and not _RE_TA_MUTATING.search(text))
        ):
            tier = "cheap"
        else:
            tier = "standard"

        if issues:
            tip = sorted(issues, key=lambda i: _TA_SEVERITY_RANK[i["severity"]])[0]["message"]
        elif steering:
            tip = msg["ok_steering"]
        else:
            tip = msg["ok_" + intent]

        scaffold = ""
        if score < 50:
            if correction:
                scaffold = msg["scaffold_correction"]
            elif intent == "code":
                file_hint = (targets["verified"] or targets["modules"] or targets["mentioned"] or [None])[0]
                sym = _RE_TA_SYMBOLS.search(text)
                scaffold = msg["scaffold_code"].format(
                    file=file_hint or msg["ph_file"],
                    action=actions[0] if actions else msg["ph_action"],
                    symbol=sym.group(0) if sym else msg["ph_symbol"],
                )
            else:
                topic = _RE_TA_RESEARCH_TOPIC.search(text)
                source = _RE_TA_RESEARCH_SOURCES.search(text)
                scaffold = msg["scaffold_research"].format(
                    topic=topic.group(0) if topic else msg["ph_topic"],
                    source=source.group(0) if source else msg["ph_source"],
                )

        return TaskAssessor._result(
            score=score, intent=intent, targets=targets, grounded=grounded, risk=risk,
            files=files, objectives=objectives, split=split, tier=tier, steering=steering,
            correction=correction, signals=signals, issues=issues, tip=tip, scaffold=scaffold,
            turn=turn, lang=lang,
        )

    @staticmethod
    def _result(score: int, intent: str, targets: Dict[str, List[str]], grounded: bool, risk: str,
                files: int, objectives: int, split: bool, tier: str, steering: bool, correction: bool,
                signals: List[str], issues: List[Dict[str, str]], tip: str, scaffold: str,
                turn: int, lang: str) -> Dict[str, Any]:
        if score >= 90:
            quality = "exemplary"
        elif score >= 70:
            quality = "specific"
        elif score >= 50:
            quality = "moderate"
        else:
            quality = "vague"
        scope = {"files": files, "objectives": objectives, "suggest_split": split, "suggestSplit": split}
        return {
            "version": VERSION,
            "score": score,
            "quality": quality,
            "intent": intent,
            "targets": targets,
            "grounded": grounded,
            "exploration_risk": risk,
            "explorationRisk": risk,
            "scope": scope,
            "recommended_tier": tier,
            "recommendedTier": tier,
            "steering": steering,
            "correction": correction,
            "signals": signals,
            "issues": issues,
            "tip": tip,
            "scaffold": scaffold,
            "turn": turn,
            "lang": lang,
        }


def main(argv: Optional[List[str]] = None) -> int:
    """CLI: `python promptometer_core.py assess "texto" [--files-from git|<archivo>] [--turn N] [--voice] [--lang en]`.

    Imprime JSON en stdout. Único punto con I/O: leer el índice de archivos."""
    import argparse
    import json
    import subprocess
    import sys

    parser = argparse.ArgumentParser(prog="promptometer", description="Promptometer Core CLI")
    sub = parser.add_subparsers(dest="command")
    p_assess = sub.add_parser("assess", help="Evalúa un pedido de trabajo para un agente")
    p_assess.add_argument("prompt", nargs="?", help="Texto del pedido (si se omite, se lee de stdin)")
    p_assess.add_argument("--files-from", dest="files_from",
                          help="'git' (git ls-files en el cwd) o ruta a un archivo con una ruta por línea")
    p_assess.add_argument("--turn", type=int, default=1)
    p_assess.add_argument("--voice", action="store_true")
    p_assess.add_argument("--lang", default="es", choices=sorted(_TA_MESSAGES))
    p_assess.add_argument("--compact", action="store_true", help="JSON en una sola línea")
    p_analyze = sub.add_parser("analyze", help="Análisis 8D de un prompt diseñado")
    p_analyze.add_argument("prompt", nargs="?")
    args = parser.parse_args(argv)

    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8")
    if args.command is None:
        parser.print_help()
        return 2

    text = args.prompt if args.prompt is not None else sys.stdin.read()

    if args.command == "analyze":
        print(json.dumps(Analyzer.analyze(text), ensure_ascii=False, indent=2))
        return 0

    known: List[str] = []
    if args.files_from == "git":
        try:
            out = subprocess.run(["git", "ls-files"], capture_output=True, text=True, check=True, encoding="utf-8")
            known = [line for line in out.stdout.splitlines() if line.strip()]
        except (OSError, subprocess.CalledProcessError) as e:
            print("promptometer: no se pudo ejecutar 'git ls-files': {}".format(e), file=sys.stderr)
            return 1
    elif args.files_from:
        with open(args.files_from, encoding="utf-8") as fh:
            known = [line.strip() for line in fh if line.strip()]

    result = TaskAssessor.assess(text, {"known_files": known, "turn": args.turn,
                                        "is_voice": args.voice, "lang": args.lang})
    print(json.dumps(result, ensure_ascii=False, indent=None if args.compact else 2))
    return 0


# Module level exports for parity
analyze = Analyzer.analyze
improve = Rewriter.improve
run_adversarial = Adversarial.run_tests
runAdversarial = Adversarial.run_tests
detect_patterns = lambda prompt: Patterns.detect(prompt, Signals.extract(prompt))
detectPatterns = detect_patterns
extract_signals = Signals.extract
extractSignals = Signals.extract
assess = TaskAssessor.assess
classify_task = TaskAssessor.classify
classifyTask = TaskAssessor.classify


if __name__ == "__main__":
    import sys as _sys
    _sys.exit(main())
