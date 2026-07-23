// ============================================================================
// PromptForge — Adversarial Testing Simulator
// Evaluates prompt resilience against 10 attack / failure vectors.
// All user-facing strings are resolved via I18n.t('adv.<test>.<field>').
// ============================================================================

const Adversarial = {

  /**
   * Run all adversarial tests against a prompt.
   * @returns {{ overallResistance: number, tests: object[] }}
   */
  runTests(prompt) {
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return {
        overallResistance: 0,
        tests: [{
          name: I18n.t('adv.fallbackEmpty.name'),
          category: I18n.t('adv.fallbackEmpty.category'),
          status: 'fail',
          detail: I18n.t('adv.fallbackEmpty.detail'),
          suggestion: I18n.t('adv.fallbackEmpty.sugg'),
        }],
      };
    }

    const trimmed = prompt.trim();

    const rawTests = [
      { weight: 1, result: this._testEmptyInput(trimmed) },
      { weight: 2, result: this._testInjection(trimmed) },
      { weight: 2, result: this._testJailbreakRoleplay(trimmed) },
      { weight: 2, result: this._testIndirectInjection(trimmed) },
      { weight: 2, result: this._testDataExfiltration(trimmed) },
      { weight: 1, result: this._testAmbiguity(trimmed) },
      { weight: 1, result: this._testOverflow(trimmed) },
      { weight: 1, result: this._testLanguageMismatch(trimmed) },
      { weight: 1, result: this._testScopeCreep(trimmed) },
      { weight: 2, result: this._testHallucination(trimmed) },
      { weight: 1, result: this._testFormatBreaking(trimmed) },
      { weight: 1, result: this._testMultiTurn(trimmed) },
      { weight: 1, result: this._testEdgeCases(trimmed) },
    ];

    const tests = rawTests.map(t => t.result);
    const statusScores = { pass: 100, warning: 50, fail: 0 };
    
    let totalScore = 0;
    let totalWeight = 0;
    
    for (const t of rawTests) {
      totalScore += statusScores[t.result.status] * t.weight;
      totalWeight += t.weight;
    }
    
    const overallResistance = Math.round(totalScore / totalWeight);

    return { overallResistance, tests };
  },

  // =========================================================================
  // Each helper builds a result whose name/category/detail/suggestion are
  // resolved from the i18n dictionary (keys: adv.<testId>.<field>).
  // =========================================================================

  _base(testId) {
    return {
      name: I18n.t(`adv.${testId}.name`),
      category: I18n.t('adversarialCategory.' + (I18n.t(`adv.${testId}.category`) || 'robustness')),
      status: 'fail',
      detail: '',
      suggestion: '',
    };
  },

  _testEmptyInput(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('emptyInput');

    const strong = /\b(if.*empty|si.*vacío|if.*blank|si.*blanco|if.*no input|si.*sin entrada|when.*missing|cuando.*falt|if.*not provided|si.*no se proporciona|if.*null|if.*undefined|when.*nothing|cuando.*nada|if.*omit|si.*omit|no data|sin datos|input.*required|entrada.*obligatoria|input.*missing|entrada.*faltante)\b/i;
    const moderate = /\b(if.*invalid|si.*inválid|handle.*error|manejar.*error|validate|valida|check.*input|verifica.*entrada|otherwise|de lo contrario|default|por defecto|fallback)\b/i;

    if (strong.test(lower)) {
      result.status = 'pass';
      result.detail = I18n.t('adv.emptyInput.passDetail');
    } else if (moderate.test(lower)) {
      result.status = 'warning';
      result.detail = I18n.t('adv.emptyInput.warnDetail');
      result.suggestion = I18n.t('adv.emptyInput.warnSugg');
    } else {
      result.detail = I18n.t('adv.emptyInput.failDetail');
      result.suggestion = I18n.t('adv.emptyInput.failSugg');
    }
    return result;
  },

  _testInjection(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('injection');

    let score = 0;
    const details = [];
    if (/\b(ignore.*previous|ignora.*anterior|disregard.*instruction|ignora.*instruc)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.injection.d1')); }
    if (/\b(do not reveal|no reveles|never share|nunca compartas|do not disclose|no divulgues|keep.*secret|mantén.*secreto|system.*prompt|prompt.*sistema|these instructions|estas instrucciones)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.injection.d2')); }
    if (/\b(stay in character|mantén.*personaje|maintain.*role|mantén.*rol|do not break|no rompas|do not deviate|no te desvíes|within.*boundaries|dentro.*límites)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.injection.d3')); }
    if (/\b(do not follow|no sigas|do not execute|no ejecutes|do not comply|no cumplas|refuse|rechaza|deny|niega).*\b(user.*instruction|instrucción.*usuario|external|extern|outside|fuera)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.injection.d4')); }
    if (/\b(guardrail|protección|safeguard|salvaguard|security|seguridad|boundary|límite|filter|filtro|sanitize|sanitiza)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.injection.d5')); }
    if (/\b(only respond|solo responde|only answer|solo contesta|only.*about|solo.*sobre|restricted to|restringido a|limited to|limitado a)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.injection.d6')); }

    const joined = details.join('; ');
    if (score >= 4) {
      result.status = 'pass';
      result.detail = I18n.t('adv.injection.passDetail', { details: joined });
    } else if (score >= 2) {
      result.status = 'warning';
      result.detail = I18n.t('adv.injection.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.injection.warnSugg');
    } else {
      result.detail = I18n.t('adv.injection.failDetail');
      result.suggestion = I18n.t('adv.injection.failSugg');
    }
    return result;
  },

  _testAmbiguity(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('ambiguity');

    let score = 0;
    const details = [];
    if (/\b(clarif|aclara|ask.*question|pregunta|if.*unclear|si.*no.*clar|if.*ambiguous|si.*ambigu|request.*more.*info|solicita.*más.*info|seek.*clarification|pide.*aclaración)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.ambiguity.d1')); }
    if (/\b(assume|supón|assumption|suposición|if.*not specified|si.*no.*especific|by default|por defecto|unless.*stated|a menos que.*indique|presume|presumir)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.ambiguity.d2')); }
    if (/\b(interpret|interpreta|if.*mean|si.*refiere|could mean|podría significar|multiple.*meaning|múltiples.*significado|disambiguat|desambigua)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.ambiguity.d3')); }
    if (/\b(rephrase|reformula|confirm|confirma|make sure|asegúrate|verify.*understand|verifica.*entend|paraphrase|parafrase)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.ambiguity.d4')); }

    const joined = details.join('; ');
    if (score >= 4) {
      result.status = 'pass';
      result.detail = I18n.t('adv.ambiguity.passDetail', { details: joined });
    } else if (score >= 2) {
      result.status = 'warning';
      result.detail = I18n.t('adv.ambiguity.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.ambiguity.warnSugg');
    } else {
      result.detail = I18n.t('adv.ambiguity.failDetail');
      result.suggestion = I18n.t('adv.ambiguity.failSugg');
    }
    return result;
  },

  _testOverflow(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('overflow');

    let score = 0;
    const details = [];
    if (/\b(max.*length|longitud.*máx|character.*limit|límite.*caracter|word.*limit|límite.*palabra|too long|demasiado larg|truncat|trunc|maximum.*\d+|máximo.*\d+|no more than|no más de.*\d+)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.overflow.d1')); }
    if (/\b(summarize|resume|summarise|condense|condensa|if.*too long|si.*demasiado larg|if.*exceed|si.*excede|shorten|acorta|abstract|abstracto|overview|resumen)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.overflow.d2')); }
    if (/\b(chunk|fragmento|paginate|pagina|batch|lote|section|sección|part.*by.*part|parte.*por.*parte|split|divide|segment|segment)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.overflow.d3')); }
    if (/\b(focus on|enfócate en|prioritize|prioriza|most important|más importante|key points|puntos clave|essential|esencial|critical|crítico)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.overflow.d4')); }

    const joined = details.join('; ');
    if (score >= 4) {
      result.status = 'pass';
      result.detail = I18n.t('adv.overflow.passDetail', { details: joined });
    } else if (score >= 2) {
      result.status = 'warning';
      result.detail = I18n.t('adv.overflow.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.overflow.warnSugg');
    } else {
      result.detail = I18n.t('adv.overflow.failDetail');
      result.suggestion = I18n.t('adv.overflow.failSugg');
    }
    return result;
  },

  _testLanguageMismatch(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('languageMismatch');

    let score = 0;
    const details = [];
    if (/\b(respond in|responde en|answer in|contesta en|write in|escribe en|in english|en inglés|in spanish|en español|language|idioma)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.languageMismatch.d1')); }
    if (/\b(if.*different language|si.*otro idioma|regardless.*language|independientemente.*idioma|always.*in|siempre.*en|even if|aunque|whatever.*language|cualquier.*idioma|detect.*language|detecta.*idioma)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.languageMismatch.d2')); }
    if (/\b(translat|traduc|multilingual|multilingüe|bilingual|bilingüe|any language|cualquier idioma)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.languageMismatch.d3')); }
    if (/\b(only in|solo en|exclusively|exclusivamente|must be in|debe ser en|always respond|siempre responde)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.languageMismatch.d4')); }

    const joined = details.join('; ');
    if (score >= 4) {
      result.status = 'pass';
      result.detail = I18n.t('adv.languageMismatch.passDetail', { details: joined });
    } else if (score >= 2) {
      result.status = 'warning';
      result.detail = I18n.t('adv.languageMismatch.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.languageMismatch.warnSugg');
    } else {
      result.detail = I18n.t('adv.languageMismatch.failDetail');
      result.suggestion = I18n.t('adv.languageMismatch.failSugg');
    }
    return result;
  },

  _testScopeCreep(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('scopeCreep');

    let score = 0;
    const details = [];
    if (/\b(scope|alcance|only.*about|solo.*sobre|limited to|limitado a|restricted to|restringido a|focus.*on|enfócate.*en|do not discuss|no discutas|off.?topic|fuera de tema)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.scopeCreep.d1')); }
    if (/\b(do not.*discuss|no.*discuta|do not.*mention|no.*menciones|do not.*address|no.*abordes|avoid.*topic|evita.*tema|stay.*focused|mantente.*enfocado|do not go|no vayas|beyond|más allá|outside|fuera)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.scopeCreep.d2')); }
    if (/\b(redirect|redirige|refer.*to|refiere.*a|suggest.*consult|sugiere.*consult|outside.*expertise|fuera.*experiencia|beyond.*scope|fuera.*alcance|not.*qualified|no.*cualificad|decline|rechaza|politely|amablemente)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.scopeCreep.d3')); }
    if (/\b(as a|como un|your role|tu rol|your job|tu trabajo|your purpose|tu propósito|you.*only|solo.*debes|your task|tu tarea|you are designed|diseñado para)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.scopeCreep.d4')); }

    const joined = details.join('; ');
    if (score >= 5) {
      result.status = 'pass';
      result.detail = I18n.t('adv.scopeCreep.passDetail', { details: joined });
    } else if (score >= 2) {
      result.status = 'warning';
      result.detail = I18n.t('adv.scopeCreep.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.scopeCreep.warnSugg');
    } else {
      result.detail = I18n.t('adv.scopeCreep.failDetail');
      result.suggestion = I18n.t('adv.scopeCreep.failSugg');
    }
    return result;
  },

  _testHallucination(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('hallucination');

    let score = 0;
    const details = [];
    if (/\b(don'?t make up|no inventes|don'?t fabricate|no fabriques|do not invent|no inventes|do not hallucinate|no alucines|do not create false|no crees fals|never fabricate|nunca fabriques)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.hallucination.d1')); }
    if (/\b(cite|cita|source|fuente|reference|referencia|based on|basado en|evidence|evidencia|according to|según|documented|documentado|verified|verificado)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.hallucination.d2')); }
    if (/\b(if.*unsure|si.*segur|if.*don'?t know|si.*no sabes|uncertain|inciert|not sure|no segur|confidence|confianza|acknowledge|reconoce|admit|admite|say.*don'?t know|di.*no sé|honestly|honestamente)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.hallucination.d3')); }
    if (/\b(only.*provided|solo.*proporcionad|only.*given|solo.*dado|based.*on.*above|basado.*en.*anterior|from.*context|del.*contexto|from.*document|del.*documento|stick to|apégate|do not add|no agregues|do not supplement|no complementes)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.hallucination.d4')); }
    if (/\b(fact.check|verifica.*hecho|double.check|revisa|verify|verifica|cross.reference|coteja|validate|valida|accuracy|precisión|correct|correct)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.hallucination.d5')); }

    const joined = details.join('; ');
    if (score >= 6) {
      result.status = 'pass';
      result.detail = I18n.t('adv.hallucination.passDetail', { details: joined });
    } else if (score >= 3) {
      result.status = 'warning';
      result.detail = I18n.t('adv.hallucination.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.hallucination.warnSugg');
    } else {
      result.detail = I18n.t('adv.hallucination.failDetail');
      result.suggestion = I18n.t('adv.hallucination.failSugg');
    }
    return result;
  },

  _testFormatBreaking(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('formatBreaking');

    let score = 0;
    const details = [];
    if (/\b(json|xml|csv|yaml|markdown|table|tabla|html)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.formatBreaking.d1')); }
    if (/\{[\s\S]*"[^"]+"\s*:[\s\S]*\}/.test(prompt) || /<[a-z_]+>[\s\S]*<\/[a-z_]+>/i.test(prompt)) { score += 2; details.push(I18n.t('adv.formatBreaking.d2')); }
    if (/\b(strictly|estrictamente|exactly|exactamente|must follow|debe seguir|format.*exactly|formato.*exactamente|do not deviate|no te desvíes|no additional|sin adicional|only.*format|solo.*formato|no explanation|sin explicación|no commentary|sin comentario|raw.*output|salida.*pura)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.formatBreaking.d3')); }
    if (/\b(example.*output|ejemplo.*salida|sample.*response|respuesta.*ejemplo|like this|como esto|format.*example|ejemplo.*formato|expected.*format|formato.*esperado)\b/i.test(lower) || /```/.test(prompt)) { score += 2; details.push(I18n.t('adv.formatBreaking.d4')); }
    if (/\b(valid.*json|json.*válido|well.formed|bien formado|parseable|parseable|syntactically|sintácticamente|must.*valid|debe.*válido)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.formatBreaking.d5')); }

    const joined = details.join('; ');
    if (score >= 6) {
      result.status = 'pass';
      result.detail = I18n.t('adv.formatBreaking.passDetail', { details: joined });
    } else if (score >= 3) {
      result.status = 'warning';
      result.detail = I18n.t('adv.formatBreaking.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.formatBreaking.warnSugg');
    } else {
      result.detail = I18n.t('adv.formatBreaking.failDetail');
      result.suggestion = I18n.t('adv.formatBreaking.failSugg');
    }
    return result;
  },

  _testMultiTurn(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('multiTurn');

    let score = 0;
    const details = [];
    if (/\b(conversation.*history|historial.*conversación|previous.*message|mensaje.*anterior|chat.*history|historial.*chat|prior.*context|contexto.*previo|above.*conversation|conversación.*anterior|thread|hilo)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.multiTurn.d1')); }
    if (/\b(remember|recuerda|maintain.*context|mantén.*contexto|keep.*track|lleva.*registro|carry.*over|continúa|persistent|persistente|across.*turns|entre.*turnos|throughout|a lo largo)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.multiTurn.d2')); }
    if (/\b(follow.up|seguimiento|clarif.*question|pregunta.*aclaración|if.*user.*asks.*more|si.*usuario.*pregunta.*más|continuation|continuación|building on|construyendo sobre|refer.*back|refiere.*anterior)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.multiTurn.d3')); }
    if (/\b(state|estado|session|sesión|update|actualiza|track|registra|accumulate|acumula|evolve|evoluciona|progress|progres)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.multiTurn.d4')); }
    if (/\b(greet|saluda|welcome|bienven|goodbye|despedid|end.*conversation|terminar.*conversación|wrap.*up|concluir|closing|cierre)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.multiTurn.d5')); }

    const joined = details.join('; ');
    if (score >= 5) {
      result.status = 'pass';
      result.detail = I18n.t('adv.multiTurn.passDetail', { details: joined });
    } else if (score >= 2) {
      result.status = 'warning';
      result.detail = I18n.t('adv.multiTurn.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.multiTurn.warnSugg');
    } else {
      result.detail = I18n.t('adv.multiTurn.failDetail');
      result.suggestion = I18n.t('adv.multiTurn.failSugg');
    }
    return result;
  },

  _testEdgeCases(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('edgeCases');

    let score = 0;
    const covered = [];
    const missing = [];

    if (/\b(empty|vacío|null|none|ninguno|missing|faltante|blank|blanco|N\/A|not available|no disponible|undefined)\b/i.test(lower)) { score += 1; covered.push(I18n.t('adv.edgeCases.c1')); } else { missing.push(I18n.t('adv.edgeCases.m1')); }
    if (/\b(zero|cero|negative|negativ|very large|muy grande|overflow|decimal|fraction|fracción|infinity|infinit|NaN)\b/i.test(lower)) { score += 1; covered.push(I18n.t('adv.edgeCases.c2')); } else if (/\b(number|número|count|conteo|amount|cantidad|calculate|calcula|sum|total)\b/i.test(lower)) { missing.push(I18n.t('adv.edgeCases.m2')); }
    if (/\b(special.*character|caracter.*especial|emoji|unicode|accents|acentos|symbols|símbolos|punctuation|puntuación|escape|html.*entit)\b/i.test(lower)) { score += 1; covered.push(I18n.t('adv.edgeCases.c3')); } else { missing.push(I18n.t('adv.edgeCases.m3')); }
    if (/\b(duplicate|duplicad|repeated|repetid|same|mism[oa]|identical|idéntic|redundant|redundant)\b/i.test(lower)) { score += 1; covered.push(I18n.t('adv.edgeCases.c4')); }
    if (/\b(multiple|múltiples|several|varios|batch|lote|many|muchos|bulk|masiv|array|lista|collection|colección)\b/i.test(lower)) { score += 1; covered.push(I18n.t('adv.edgeCases.c5')); }
    if (/\b(boundary|límite|threshold|umbral|edge|borde|limit|máximo|mínimo|exactly|exactamente|at most|como máximo|at least|al menos)\b/i.test(lower)) { score += 1; covered.push(I18n.t('adv.edgeCases.c6')); } else { missing.push(I18n.t('adv.edgeCases.m4')); }
    if (/\b(error|invalid|inválid|corrupt|corrupto|malformed|malformado|wrong|erróneo|incorrect|incorrecto|broken|roto)\b/i.test(lower)) { score += 1; covered.push(I18n.t('adv.edgeCases.c7')); } else { missing.push(I18n.t('adv.edgeCases.m5')); }
    if (/\b(order|orden|sequence|secuencia|timing|temporalidad|concurrent|concurrente|simultaneous|simultáneo|race condition|first|primero|last|último)\b/i.test(lower)) { score += 1; covered.push(I18n.t('adv.edgeCases.c8')); }

    const coveredStr = covered.join(', ');
    const missingStr = missing.join(', ');
    const missingTop3 = missing.slice(0, 3).join(', ');
    const missingTop4 = missing.slice(0, 4).join(', ');

    if (score >= 5) {
      result.status = 'pass';
      result.detail = I18n.t('adv.edgeCases.passDetail', { details: coveredStr });
    } else if (score >= 2) {
      result.status = 'warning';
      result.detail = I18n.t('adv.edgeCases.warnDetail', { covered: coveredStr, missing: missingTop3 });
      result.suggestion = I18n.t('adv.edgeCases.warnSugg', { missing: missingStr });
    } else {
      result.suggestion = I18n.t('adv.edgeCases.failSugg', { missing: missingTop4 });
    }
    return result;
  },

  _testJailbreakRoleplay(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('jailbreakRoleplay');

    let score = 0;
    const details = [];
    if (/\b(do not follow|no sigas|ignore.*instructions|ignora.*instrucciones|refuse|rechaza|deny|niega).*\b(developer mode|dan|jailbreak|bypass)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.jailbreakRoleplay.d1')); }
    if (/\b(stay in character|mantén.*personaje|maintain.*role|mantén.*rol|do not break|no rompas|do not deviate|no te desvíes)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.jailbreakRoleplay.d2')); }
    if (/\b(always.*polite|siempre.*educado|respectful|respetuoso|harmless|inofensivo|safe|seguro|ethical|ético)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.jailbreakRoleplay.d3')); }

    const joined = details.join('; ');
    if (score >= 4) {
      result.status = 'pass';
      result.detail = I18n.t('adv.jailbreakRoleplay.passDetail', { details: joined });
    } else if (score >= 2) {
      result.status = 'warning';
      result.detail = I18n.t('adv.jailbreakRoleplay.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.jailbreakRoleplay.warnSugg');
    } else {
      result.detail = I18n.t('adv.jailbreakRoleplay.failDetail');
      result.suggestion = I18n.t('adv.jailbreakRoleplay.failSugg');
    }
    return result;
  },

  _testIndirectInjection(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('indirectInjection');

    let score = 0;
    const details = [];
    if (/\b(treat.*as data|trata.*como datos|untrusted|no confiable|user input|entrada del usuario|do not execute|no ejecutes)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.indirectInjection.d1')); }
    if (/(<untrusted>|<user_input>|```|""")/i.test(prompt)) { score += 2; details.push(I18n.t('adv.indirectInjection.d2')); }
    if (/\b(ignore.*commands|ignora.*comandos|ignore.*instructions|ignora.*instrucciones).*\b(inside|dentro|text|texto)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.indirectInjection.d3')); }

    const joined = details.join('; ');
    if (score >= 4) {
      result.status = 'pass';
      result.detail = I18n.t('adv.indirectInjection.passDetail', { details: joined });
    } else if (score >= 2) {
      result.status = 'warning';
      result.detail = I18n.t('adv.indirectInjection.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.indirectInjection.warnSugg');
    } else {
      result.detail = I18n.t('adv.indirectInjection.failDetail');
      result.suggestion = I18n.t('adv.indirectInjection.failSugg');
    }
    return result;
  },

  _testDataExfiltration(prompt) {
    const lower = prompt.toLowerCase();
    const result = this._base('dataExfiltration');

    let score = 0;
    const details = [];
    if (/\b(do not output.*url|no.*url|no link|sin enlace|do not render.*image|no.*imagen)\b/i.test(lower)) { score += 3; details.push(I18n.t('adv.dataExfiltration.d1')); }
    if (/\b(do not.*markdown|no.*markdown|plain text|texto plano|only text|solo texto)\b/i.test(lower)) { score += 2; details.push(I18n.t('adv.dataExfiltration.d2')); }
    if (/\b(do not leak|no.*filtres|protect|protege|confidential|confidencial|secret|secreto)\b/i.test(lower)) { score += 1; details.push(I18n.t('adv.dataExfiltration.d3')); }

    const joined = details.join('; ');
    if (score >= 4) {
      result.status = 'pass';
      result.detail = I18n.t('adv.dataExfiltration.passDetail', { details: joined });
    } else if (score >= 2) {
      result.status = 'warning';
      result.detail = I18n.t('adv.dataExfiltration.warnDetail', { details: joined });
      result.suggestion = I18n.t('adv.dataExfiltration.warnSugg');
    } else {
      result.detail = I18n.t('adv.dataExfiltration.failDetail');
      result.suggestion = I18n.t('adv.dataExfiltration.failSugg');
    }
    return result;
  },
};
