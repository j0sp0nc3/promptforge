# ============================================================================
# PromptQuill Core — Python Native Library (Zero Dependencies)
# Standalone evaluation & prompt engineering engine for Python projects.
#
# Output contract: matches the JS core (camelCase keys) so any client that
# consumes the REST API gets the same shape regardless of which language
# implements the server.
# ============================================================================

import re
from typing import Dict, Any, List


class PromptQuillCore:
    VERSION = "1.0.0"

    # ──────────────────────────────────────────────────────────────────────
    # Signals: every derived cue is computed exactly once here, mirroring
    # the JS Signals.extract(). Each scorer reads from this map.
    # ──────────────────────────────────────────────────────────────────────
    @staticmethod
    def _extract_signals(prompt: str) -> Dict[str, Any]:
        lower = prompt.lower()
        words = [w for w in lower.split() if w]
        word_count = len(words)

        xml_pairs = len(re.findall(r'<[a-z_]+>[\s\S]*?<\/[a-z_]+>', prompt, re.IGNORECASE))
        xml_open = len(re.findall(r'<[a-z_]+>', prompt, re.IGNORECASE))

        request_verb = bool(re.search(r'\b(respond|reply|return|output|answer|devuelve|responde|format|formatea|entrega|presenta)\b', lower))
        format_name = bool(re.search(r'\b(json|xml|csv|yaml|html|markdown|table|tabla|bullet\s?list|numbered\s?list|lista)\b', lower))
        requests_output_format = request_verb and format_name

        example_cue = bool(re.search(r'\b(example|ejemplo|e\.g\.|for instance|por ejemplo|sample|muestra)\b', lower))
        code_blocks = len(re.findall(r'```', prompt))
        block_delim = code_blocks >= 2 or bool(re.search(r'→|->|-->', prompt))
        has_few_shot = example_cue and block_delim

        has_numeric_constraint = bool(re.search(r'\b\d+\s*(words|palabras|items|elementos|sentences|oraciones|paragraphs|párrafos|points|puntos)\b', lower))
        has_step_by_step = bool(re.search(r'\b(step.?by.?step|paso a paso|think.{0,12}through|piensa.{0,12}detenidamente|chain of thought|cadena de pensamiento)\b', lower))
        has_tree_of_thought = bool(re.search(r'\b(tree of thoughts?|\btot\b|explore.{0,15}branch|múltiples caminos)\b', lower))

        role_assignment = bool(re.search(r'\b(you are (an?|the)|act as (an?|the)|eres un[ao]?|actúa como un[oa]?|your role is|tu rol es)\b', lower))
        role_with_domain = role_assignment and bool(re.search(r'\b(expert in|specialist in|experto en|especialista en)\b', lower))

        error_handling = bool(re.search(r'\b(if.{0,20}(invalid|missing|empty)|si.{0,20}(inválid|faltante|vacío)|fallback|default value|manejo de error)\b', lower))
        anti_hallucination = bool(re.search(r'\b(don\'?t make up|no inventes|do not hallucinate|no alucines|cite your sources?|cita tus fuentes)\b', lower))
        scope_limit = bool(re.search(r'\b(scope|alcance|only (respond|answer)|solo (responde|contesta)|limited to|limitado a)\b', lower))

        return {
            "wordCount": word_count,
            "hasXMLTags": xml_pairs > 0 or xml_open >= 2,
            "requestsOutputFormat": requests_output_format,
            "hasFewShot": has_few_shot,
            "hasNumericConstraint": has_numeric_constraint,
            "hasStepByStep": has_step_by_step,
            "hasTreeOfThought": has_tree_of_thought,
            "roleAssignment": role_assignment,
            "roleWithDomain": role_with_domain,
            "errorHandling": error_handling,
            "antiHallucination": anti_hallucination,
            "scopeLimit": scope_limit,
        }

    @staticmethod
    def _infer_type(signals: Dict[str, Any]) -> str:
        if signals["hasFewShot"]:
            return "few-shot"
        if signals["hasStepByStep"] or signals["hasTreeOfThought"]:
            return "chainOfThought"
        if signals["roleAssignment"] and signals["wordCount"] > 40:
            return "system"
        return "general"

    @staticmethod
    def _weights_for(prompt_type: str) -> Dict[str, float]:
        if prompt_type == "system":
            return {"clarity": 0.15, "specificity": 0.15, "structure": 0.15, "robustness": 0.15, "context": 0.15, "outputFormat": 0.10, "chainOfThought": 0.05, "safety": 0.10}
        if prompt_type == "few-shot":
            return {"clarity": 0.15, "specificity": 0.20, "structure": 0.15, "robustness": 0.10, "context": 0.10, "outputFormat": 0.20, "chainOfThought": 0.05, "safety": 0.05}
        if prompt_type == "chainOfThought":
            return {"clarity": 0.15, "specificity": 0.15, "structure": 0.15, "robustness": 0.10, "context": 0.10, "outputFormat": 0.10, "chainOfThought": 0.20, "safety": 0.05}
        return {"clarity": 0.18, "specificity": 0.15, "structure": 0.13, "robustness": 0.12, "context": 0.12, "outputFormat": 0.12, "chainOfThought": 0.10, "safety": 0.08}

    # ──────────────────────────────────────────────────────────────────────
    # Patterns: anti-patterns with findings + suggestions, mirroring the JS
    # core's output shape.
    # ──────────────────────────────────────────────────────────────────────
    @staticmethod
    def _detect_patterns(prompt: str, signals: Dict[str, Any]) -> Dict[str, List]:
        trimmed = prompt.strip()
        anti_patterns = []

        if len(trimmed) < 10:
            anti_patterns.append({"id": "AP001", "name": "Prompt demasiado corto", "severity": "critical", "dimension": "clarity", "suggestion": "Extiende el prompt describiendo contexto y objetivo."})
        if not signals["requestsOutputFormat"]:
            anti_patterns.append({"id": "AP003", "name": "Sin formato de salida", "severity": "high", "dimension": "outputFormat", "suggestion": "Especifica el formato deseado (ej. JSON, Tabla)."})
        if not signals["roleAssignment"]:
            anti_patterns.append({"id": "AP005", "name": "Sin rol definido", "severity": "medium", "dimension": "context", "suggestion": "Asigna un rol claro (ej. \"Eres un analista experto...\")."})
        if signals["wordCount"] > 25 and not signals["errorHandling"]:
            anti_patterns.append({"id": "AP009", "name": "Sin manejo de errores", "severity": "medium", "dimension": "robustness", "suggestion": "Indica qué hacer ante entradas inválidas o vacías."})
        if not signals["antiHallucination"] and re.search(r'\b(dato|estadística|hecho|fact|number|número)\b', trimmed, re.IGNORECASE):
            anti_patterns.append({"id": "AP030", "name": "Propenso a alucinaciones", "severity": "high", "dimension": "safety", "suggestion": "Añade \"no inventes datos\" o \"cita tus fuentes\"."})

        return {"antiPatterns": anti_patterns, "strengths": []}

    # ──────────────────────────────────────────────────────────────────────
    # Analyze: full evaluation. Output keys are camelCase to match the JS
    # core and the REST API contract.
    # ──────────────────────────────────────────────────────────────────────
    @classmethod
    def analyze(cls, prompt: str) -> Dict[str, Any]:
        if not prompt or not prompt.strip():
            return {"overallScore": 0, "grade": "F", "wordCount": 0, "charCount": 0, "dimensions": {}, "antiPatterns": [], "strengths": []}

        trimmed = prompt.strip()
        signals = cls._extract_signals(trimmed)
        word_count = signals["wordCount"]
        char_count = len(trimmed)
        prompt_type = cls._infer_type(signals)
        weights = cls._weights_for(prompt_type)

        # Dimensions now include findings + suggestions (richer contract).
        dimensions = {
            "clarity": {
                "score": min(100, (70 if word_count > 15 else 40) + (15 if signals["roleAssignment"] else 0)),
                "findings": [] if word_count > 15 else ["El prompt es muy breve."],
                "suggestions": [] if word_count > 15 else ["Añade contexto y objetivo."],
            },
            "specificity": {
                "score": min(100, 50 + (30 if signals["hasNumericConstraint"] else 0) + (20 if signals["requestsOutputFormat"] else 0)),
                "findings": ["Define restricciones cuantitativas."] if not signals["hasNumericConstraint"] else [],
                "suggestions": ["Añade cifras con unidades (ej. \"5 ítems\")."] if not signals["hasNumericConstraint"] else [],
            },
            "structure": {
                "score": min(100, 40 + (35 if signals["hasXMLTags"] else 0)),
                "findings": ["Usa etiquetas XML o markdown para estructurar."] if not signals["hasXMLTags"] else [],
                "suggestions": [],
            },
            "robustness": {
                "score": min(100, 40 + (40 if signals["errorHandling"] else 0)),
                "findings": [] if signals["errorHandling"] else ["Sin manejo de errores visible."],
                "suggestions": [] if signals["errorHandling"] else ["Indica qué hacer ante entradas inválidas."],
            },
            "context": {
                "score": min(100, 45 + (40 if signals["roleWithDomain"] else 20 if signals["roleAssignment"] else 0)),
                "findings": [] if signals["roleAssignment"] else ["No se define un rol."],
                "suggestions": [] if signals["roleAssignment"] else ["Asigna un rol con dominio."],
            },
            "outputFormat": {
                "score": min(100, 85 if signals["requestsOutputFormat"] else 35),
                "findings": [] if signals["requestsOutputFormat"] else ["Sin formato de salida explícito."],
                "suggestions": [] if signals["requestsOutputFormat"] else ["Pide \"responde en JSON\" u otro formato."],
            },
            "chainOfThought": {
                "score": min(100, 90 if signals["hasStepByStep"] else 30),
                "findings": [] if signals["hasStepByStep"] else ["No solicita razonamiento paso a paso."],
                "suggestions": [] if signals["hasStepByStep"] else ["Añade \"piensa paso a paso\" para tareas complejas."],
            },
            "safety": {
                "score": min(100, (40 if signals["antiHallucination"] else 0) + (40 if signals["scopeLimit"] else 20)),
                "findings": [] if signals["antiHallucination"] else ["Sin guardrails anti-alucinación."],
                "suggestions": [] if signals["antiHallucination"] else ["Añade \"no inventes datos\" o \"cita fuentes\"."],
            },
        }

        overall_score = round(sum(dimensions[dim]["score"] * w for dim, w in weights.items()))
        overall_score = max(0, min(100, overall_score))
        grade = "A" if overall_score >= 90 else "B" if overall_score >= 75 else "C" if overall_score >= 60 else "D" if overall_score >= 45 else "F"

        pattern_results = cls._detect_patterns(trimmed, signals)

        return {
            "overallScore": overall_score,
            "grade": grade,
            "wordCount": word_count,
            "charCount": char_count,
            "promptType": prompt_type,
            "dimensions": dimensions,
            "antiPatterns": pattern_results["antiPatterns"],
            "strengths": pattern_results["strengths"],
            "suggestions": [{"priority": ap["severity"], "title": ap["name"], "description": ap["suggestion"]} for ap in pattern_results["antiPatterns"]],
        }

    # ──────────────────────────────────────────────────────────────────────
    # Rewriter: non-destructive structured XML rewrite.
    # ──────────────────────────────────────────────────────────────────────
    @classmethod
    def improve(cls, prompt: str, analysis: Dict[str, Any] = None) -> Dict[str, Any]:
        if not prompt or not prompt.strip():
            return {"improvedPrompt": "", "changes": [], "scoreImprovement": 0}

        working = prompt.strip()
        changes = []

        if not re.search(r'<[a-z_]+>', working, re.IGNORECASE):
            working = f"<rol>\nEres un asistente experto altamente calificado.\n</rol>\n\n<tarea>\n{working}\n</tarea>\n\n<formato_salida>\nPresenta los resultados en un formato claro, estructurado y directo.\n</formato_salida>"
            changes.append({"type": "restructured", "description": "Añadida estructura XML con <rol>, <tarea> y <formato_salida>"})

        current_score = (analysis or {}).get("overallScore", 50)
        return {
            "improvedPrompt": working,
            "changes": changes,
            "scoreImprovement": min(100, current_score + 20),
        }

    # ──────────────────────────────────────────────────────────────────────
    # Adversarial: security & injection resilience tests.
    # ──────────────────────────────────────────────────────────────────────
    @classmethod
    def run_adversarial(cls, prompt: str) -> Dict[str, Any]:
        lower = (prompt or "").lower()
        tests = [
            {"name": "Jailbreak Direct Resistance", "category": "Security", "status": "warning" if re.search(r'\b(ignore (all|previous)|override)\b', lower) else "pass", "detail": "Evaluates resistance against instruction override."},
            {"name": "Data Exfiltration Guard", "category": "Privacy", "status": "warning" if re.search(r'\b(system prompt|reveal instructions|api_key|contraseña)\b', lower) else "pass", "detail": "Evaluates protection against system prompt leaks."},
            {"name": "Hallucination Mitigation", "category": "Robustness", "status": "pass" if re.search(r'\b(don\'?t make up|cite|no alucines|no inventes)\b', lower) else "warning", "detail": "Checks for explicit anti-hallucination guardrails."},
        ]
        pass_count = len([t for t in tests if t["status"] == "pass"])
        return {
            "overallResistance": round((pass_count / len(tests)) * 100),
            "tests": tests,
        }


# Standard module-level exports (callable without instantiating the class).
analyze = PromptQuillCore.analyze
improve = PromptQuillCore.improve
run_adversarial = PromptQuillCore.run_adversarial
VERSION = PromptQuillCore.VERSION
