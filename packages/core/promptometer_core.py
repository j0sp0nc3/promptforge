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


# Module level exports for parity
analyze = Analyzer.analyze
improve = Rewriter.improve
run_adversarial = Adversarial.run_tests
runAdversarial = Adversarial.run_tests
detect_patterns = lambda prompt: Patterns.detect(prompt, Signals.extract(prompt))
detectPatterns = detect_patterns
extract_signals = Signals.extract
extractSignals = Signals.extract
