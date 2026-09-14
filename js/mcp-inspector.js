// ============================================================================
// Promptometer — MCP Schema Inspector & Auto-Validator (P2.1)
// Audits MCP / OpenAI / Anthropic tool definitions against prompt text.
// ============================================================================

const McpInspector = (() => {

  /**
   * Parse JSON/YAML schema text into structured tool array
   */
  function parseSchema(schemaText) {
    if (!schemaText || typeof schemaText !== 'string') return [];
    
    try {
      const parsed = JSON.parse(schemaText.trim());
      
      // Case 1: Array of tool objects [{ name, description, parameters }]
      if (Array.isArray(parsed)) {
        return parsed.map(_normalizeTool).filter(Boolean);
      }
      
      // Case 2: Object with tools property { tools: [...] }
      if (parsed.tools && Array.isArray(parsed.tools)) {
        return parsed.tools.map(_normalizeTool).filter(Boolean);
      }
      
      // Case 3: Object with functions property { functions: [...] }
      if (parsed.functions && Array.isArray(parsed.functions)) {
        return parsed.functions.map(_normalizeTool).filter(Boolean);
      }
      
      // Case 4: Single tool object { name, description }
      if (parsed.name) {
        const norm = _normalizeTool(parsed);
        return norm ? [norm] : [];
      }
    } catch {
      // Fallback: Regex extraction for simplified YAML / relaxed JSON
      return _fallbackRegexParse(schemaText);
    }
    
    return [];
  }

  function _normalizeTool(raw) {
    if (!raw || typeof raw !== 'object') return null;
    const toolObj = raw.function || raw;
    const name = toolObj.name || raw.name || '';
    if (!name) return null;

    const description = toolObj.description || raw.description || '';
    const params = [];

    const schemaObj = toolObj.parameters || toolObj.input_schema || raw.parameters || {};
    const props = schemaObj.properties || {};
    const required = Array.isArray(schemaObj.required) ? schemaObj.required : [];

    Object.keys(props).forEach(pName => {
      const pDef = props[pName] || {};
      params.push({
        name: pName,
        type: pDef.type || 'string',
        description: pDef.description || '',
        required: required.includes(pName)
      });
    });

    return { name, description, params };
  }

  function _fallbackRegexParse(text) {
    const tools = [];
    const nameMatches = text.matchAll(/name\s*:\s*["']?([a-zA-Z0-9_-]+)["']?/gi);
    for (const match of nameMatches) {
      if (match[1] && !tools.some(t => t.name === match[1])) {
        tools.push({
          name: match[1],
          description: `MCP Tool ${match[1]}`,
          params: []
        });
      }
    }
    return tools;
  }

  /**
   * Audit tools against prompt text
   */
  function inspect(schemaText, promptText) {
    const tools = parseSchema(schemaText);
    const prompt = String(promptText || '');
    const lowerPrompt = prompt.toLowerCase();

    // 1. Check for tools contract block (<tools> or <herramientas>)
    const hasToolsContract = /<(tools|herramientas)>[\s\S]*?<\/(tools|herramientas)>/i.test(prompt);

    // 2. Check for loop guard (<loop_guard>)
    const hasLoopGuard = /<loop_guard>[\s\S]*?<\/loop_guard>/i.test(prompt);

    // 3. Tool coverage: tools declared in schema vs mentioned in prompt
    let declaredCount = 0;
    const toolDetails = tools.map(t => {
      const isMentioned = lowerPrompt.includes(t.name.toLowerCase());
      if (isMentioned) declaredCount++;
      return {
        name: t.name,
        paramsCount: t.params.length,
        isMentioned
      };
    });

    const toolCoverage = tools.length > 0 ? Math.round((declaredCount / tools.length) * 100) : 0;

    // 4. Typed parameters check
    const hasTypedParams = /<param\s+[^>]*type=["'][a-z]+["']/i.test(prompt) || /\b(type|tipo)\s*[:=]\s*["']?[a-z]+["']?/i.test(prompt);

    // 5. Error handling / fallback rule check
    const hasErrorHandling = /\b(error|fallback|excepción|fallo|invalid)\b/i.test(lowerPrompt);

    // Calculate score
    let score = 0;
    if (hasToolsContract) score += 35;
    if (hasLoopGuard) score += 25;
    score += Math.round((toolCoverage / 100) * 25);
    if (hasTypedParams) score += 10;
    if (hasErrorHandling) score += 5;

    return {
      isValidSchema: tools.length > 0,
      toolsCount: tools.length,
      tools,
      toolDetails,
      hasToolsContract,
      hasLoopGuard,
      toolCoverage,
      hasTypedParams,
      hasErrorHandling,
      score: Math.min(100, score)
    };
  }

  /**
   * Generate canonical <tools> XML contract from tool array
   */
  function generateXmlContract(tools) {
    if (!tools || !tools.length) return '';

    let xml = '<tools>\n  <!-- Especificación de Herramientas MCP / Function Calling -->\n';

    tools.forEach(t => {
      xml += `  <tool name="${t.name}">\n`;
      if (t.description) {
        xml += `    <description>${t.description}</description>\n`;
      }
      if (t.params && t.params.length) {
        xml += '    <parameters>\n';
        t.params.forEach(p => {
          const reqStr = p.required ? ' required="true"' : ' required="false"';
          xml += `      <param name="${p.name}" type="${p.type}"${reqStr}>${p.description || p.name}</param>\n`;
        });
        xml += '    </parameters>\n';
      }
      xml += '    <returns type="object">Resultados estructurados o mensaje de error</returns>\n';
      xml += '  </tool>\n';
    });

    xml += '</tools>';
    return xml;
  }

  /**
   * Sample MCP JSON schema for 1-click testing
   */
  function getSampleSchema() {
    return JSON.stringify({
      tools: [
        {
          name: "query_database",
          description: "Ejecuta una consulta SQL de solo lectura en la base de datos de producción.",
          parameters: {
            type: "object",
            properties: {
              query: { type: "string", description: "Consulta SQL a ejecutar" },
              limit: { type: "integer", description: "Número máximo de filas a retornar" }
            },
            required: ["query"]
          }
        },
        {
          name: "fetch_web_article",
          description: "Obtiene el contenido Markdown de un artículo o documentación desde una URL pública.",
          parameters: {
            type: "object",
            properties: {
              url: { type: "string", description: "URL del artículo a consultar" }
            },
            required: ["url"]
          }
        }
      ]
    }, null, 2);
  }

  return {
    parseSchema,
    inspect,
    generateXmlContract,
    getSampleSchema
  };

})();

// Export UMD
if (typeof module !== 'undefined' && module.exports) {
  module.exports = McpInspector;
}
