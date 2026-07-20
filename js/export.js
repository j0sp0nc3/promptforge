// ============================================================================
// PromptForge - Export Utilities
// JSON, Markdown, clipboard, file download, and URL sharing
// ============================================================================

const ExportUtil = {

  // ════════════════════════════════════════════════════════════════════════
  // Format converters
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Format analysis results as a downloadable JSON string.
   * @param {Object} analysis - The analysis results object
   * @param {string} [prompt] - Optional explicit prompt text (falls back to analysis.prompt)
   * @returns {string} Formatted JSON
   */
  toJSON(analysis, prompt) {
    const exportData = {
      _meta: {
        generator: 'PromptForge',
        version: '1.0',
        exportedAt: new Date().toISOString(),
        format: 'analysis-report'
      },
      prompt: prompt ?? analysis?.prompt ?? '',
      overallScore: analysis?.overallScore ?? null,
      grade: analysis?.grade ?? null,
      complexity: analysis?.complexity ?? null,
      language: analysis?.language ?? null,
      scores: analysis?.scores || {},
      dimensions: analysis?.dimensions || {},
      detected: analysis?.detected || {},
      metrics: analysis?.metrics || {},
      tokens: analysis?.tokens || {},
      suggestions: analysis?.suggestions || [],
      antiPatterns: analysis?.antiPatterns || [],
      strengths: analysis?.strengths || [],
    };

    return JSON.stringify(exportData, null, 2);
  },

  /**
   * Format analysis results as a readable Markdown report.
   * @param {Object} analysis - The analysis results object
   * @param {string} [prompt] - Optional explicit prompt text (falls back to analysis.prompt)
   * @returns {string} Markdown document
   */
  toMarkdown(analysis, prompt) {
    const score = analysis?.overallScore ?? null;
    const scores = analysis?.scores || {};
    const suggestions = analysis?.suggestions || [];
    const detected = analysis?.detected || {};
    const metrics = analysis?.metrics || {};
    const tokens = analysis?.tokens || {};
    const promptText = prompt ?? analysis?.prompt ?? '';
    const locale = I18n.getLang() === 'es' ? 'es-ES' : 'en-US';
    const date = new Date().toLocaleDateString(locale, {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });

    const scoreBar = (value, max = 100) => {
      const n = Number(value);
      if (!Number.isFinite(n)) return '░'.repeat(20) + ` —/${max}`;
      const filled = Math.max(0, Math.min(20, Math.round((n / max) * 20)));
      return '█'.repeat(filled) + '░'.repeat(20 - filled) + ` ${n}/${max}`;
    };

    const scoreDisplay = (score === null || score === undefined) ? '—' : score;

    let md = '';

    // ── Header ──
    md += `# ${I18n.t('report.title')}\n\n`;
    md += `${I18n.t('report.generated', { date })}\n\n`;
    md += `---\n\n`;

    // ── Overall Score ──
    md += `${I18n.t('report.overall')}\n\n`;
    md += `**${scoreDisplay}/100** ${this._scoreEmoji(score)}\n\n`;
    md += `\`${scoreBar(score)}\`\n\n`;

    // ── Score Breakdown ──
    if (Object.keys(scores).length > 0) {
      md += `${I18n.t('report.breakdown')}\n\n`;
      md += `| ${I18n.t('report.breakdownCriterion')} | ${I18n.t('report.breakdownScore')} | ${I18n.t('report.breakdownBar')} |\n`;
      md += `|----------|:----------:|-------|\n`;

      const dimIcons = {
        clarity: '🎯', specificity: '📐', structure: '🏗️', robustness: '🛡️',
        context: '🧩', outputFormat: '📝', chainOfThought: '🔗', safety: '⚠️',
      };

      for (const [key, value] of Object.entries(scores)) {
        if (key === 'overall') continue;
        const label = `${dimIcons[key] || ''} ${I18n.t(`dimensions.${key}`) || key}`.trim();
        md += `| ${label} | ${value}/100 | \`${scoreBar(value)}\` |\n`;
      }
      md += `\n`;
    }

    // ── Detected Features ──
    if (Object.keys(detected).length > 0) {
      md += `${I18n.t('report.detected')}\n\n`;
      for (const [key, value] of Object.entries(detected)) {
        const label = I18n.t(`featureLabels.${key}`) || key;
        const icon = value ? '✅' : '❌';
        md += `- ${icon} ${label}\n`;
      }
      md += `\n`;
    }

    // ── Metrics ──
    if (Object.keys(metrics).length > 0) {
      md += `${I18n.t('report.metrics')}\n\n`;
      md += `| ${I18n.t('report.metricName')} | ${I18n.t('report.metricValue')} |\n`;
      md += `|---------|-------|\n`;

      for (const [key, value] of Object.entries(metrics)) {
        const label = I18n.t(`metricLabels.${key}`) || key;
        md += `| ${label} | ${value} |\n`;
      }
      md += `\n`;
    }

    // ── Token Estimates ──
    if (Object.keys(tokens).length > 0) {
      md += `${I18n.t('report.tokens')}\n\n`;
      if (tokens.estimated) md += `${I18n.t('report.tokensEstimated', { n: tokens.estimated })}\n`;
      if (tokens.model) md += `${I18n.t('report.tokensModel', { model: tokens.model })}\n`;
      if (tokens.cost) md += `${I18n.t('report.tokensCost', { cost: tokens.cost })}\n`;
      md += `\n`;
    }

    // ── Suggestions ──
    if (suggestions.length > 0) {
      md += `${I18n.t('report.suggestions')}\n\n`;
      suggestions.forEach((s, i) => {
        const priority = s.priority || 'medium';
        const icon = priority === 'high' ? '🔴' : priority === 'medium' ? '🟡' : '🟢';
        md += `### ${i + 1}. ${icon} ${s.title || I18n.t('report.suggestion')}\n\n`;
        md += `${s.description || s.text || s}\n\n`;
        if (s.example) {
          md += `${I18n.t('report.example')}\n\`\`\`\n${s.example}\n\`\`\`\n\n`;
        }
      });
    }

    // ── Prompt Text ──
    md += `${I18n.t('report.promptAnalyzed')}\n\n`;
    md += `\`\`\`\n${promptText || I18n.t('report.noPrompt')}\n\`\`\`\n\n`;

    // ── Footer ──
    md += `---\n\n`;
    md += `${I18n.t('report.footer')}\n`;

    return md;
  },

  // ════════════════════════════════════════════════════════════════════════
  // Clipboard & Download
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Copy text to clipboard and show a toast notification.
   * @param {string} text - Text to copy
   * @returns {Promise<boolean>} Whether the copy succeeded
   */
  async toClipboard(text) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for older browsers
        this._fallbackCopy(text);
      }
      this._showToast(I18n.t('exportToast.copied'), 'success');
      return true;
    } catch (err) {
      console.error('[ExportUtil] Clipboard copy failed:', err);
      // Try fallback
      try {
        this._fallbackCopy(text);
        this._showToast(I18n.t('exportToast.copied'), 'success');
        return true;
      } catch (e) {
        this._showToast(I18n.t('exportToast.copyError'), 'error');
        return false;
      }
    }
  },

  /**
   * Trigger a file download in the browser.
   * @param {string} content - File content
   * @param {string} filename - Desired filename
   * @param {string} mimeType - MIME type (e.g. 'application/json', 'text/markdown')
   */
  downloadFile(content, filename, mimeType = 'text/plain') {
    try {
      const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 150);

      this._showToast(I18n.t('exportToast.downloading', { name: filename }), 'success');
    } catch (err) {
      console.error('[ExportUtil] Download failed:', err);
      this._showToast(I18n.t('exportToast.downloadError'), 'error');
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  // URL Sharing
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Generate a shareable URL that encodes the prompt as a base64 parameter.
   * @param {string} prompt - Prompt text to share
   * @returns {string} Full URL with encoded prompt
   */
  generateShareURL(prompt) {
    try {
      // Use TextEncoder for proper UTF-8 handling
      const encoded = this._utfToBase64(prompt);
      const baseURL = window.location.origin + window.location.pathname;
      const shareURL = `${baseURL}?p=${encodeURIComponent(encoded)}`;

      // Warn if URL is very long
      if (shareURL.length > 8000) {
        console.warn('[ExportUtil] Share URL is very long (' + shareURL.length + ' chars). Some browsers may truncate it.');
      }

      return shareURL;
    } catch (err) {
      console.error('[ExportUtil] Failed to generate share URL:', err);
      return '';
    }
  },

  /**
   * Parse a prompt from the current URL if a share parameter exists.
   * @returns {string|null} Decoded prompt or null if not found
   */
  parseShareURL() {
    try {
      const params = new URLSearchParams(window.location.search);
      // URLSearchParams.get() already percent-decodes; the extra
      // decodeURIComponent previously here could throw on stray '%'.
      const encoded = params.get('p');

      if (!encoded) return null;

      const decoded = this._base64ToUtf(encoded);
      return decoded || null;
    } catch (err) {
      console.error('[ExportUtil] Failed to parse share URL:', err);
      return null;
    }
  },

  // ════════════════════════════════════════════════════════════════════════
  // Private helpers
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Fallback clipboard copy using textarea.
   * @private
   */
  _fallbackCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position:fixed;left:-9999px;top:-9999px;opacity:0;';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  },

  /**
   * Show a toast notification.
   * @private
   */
  _showToast(message, type = 'info') {
    // Remove existing toasts
    const existing = document.querySelectorAll('.promptforge-toast');
    existing.forEach(el => el.remove());

    const toast = document.createElement('div');
    toast.className = 'promptforge-toast';
    toast.textContent = message;

    // Color scheme
    const colors = {
      success: { bg: 'rgba(16, 185, 129, 0.95)', border: '#10b981' },
      error: { bg: 'rgba(239, 68, 68, 0.95)', border: '#ef4444' },
      info: { bg: 'rgba(59, 130, 246, 0.95)', border: '#3b82f6' }
    };
    const color = colors[type] || colors.info;

    toast.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      padding: 12px 24px;
      background: ${color.bg};
      color: white;
      border: 1px solid ${color.border};
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      font-weight: 500;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      backdrop-filter: blur(10px);
      z-index: 99999;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      pointer-events: none;
    `;

    document.body.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.style.opacity = '1';
      toast.style.transform = 'translateY(0)';
    });

    // Animate out and remove
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(20px)';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  },

  /**
   * UTF-8 safe base64 encode.
   * @private
   */
  _utfToBase64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (const byte of bytes) {
      binary += String.fromCharCode(byte);
    }
    return btoa(binary);
  },

  /**
   * UTF-8 safe base64 decode.
   * @private
   */
  _base64ToUtf(base64) {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  },

  /**
   * Score emoji helper. NaN-safe.
   * @private
   */
  _scoreEmoji(score) {
    const n = Number(score);
    if (!Number.isFinite(n)) return I18n.t('scoreEmoji.noData');
    if (n >= 90) return I18n.t('scoreEmoji.excellent');
    if (n >= 75) return I18n.t('scoreEmoji.veryGood');
    if (n >= 60) return I18n.t('scoreEmoji.good');
    if (n >= 40) return I18n.t('scoreEmoji.improvable');
    if (n >= 20) return I18n.t('scoreEmoji.needsWork');
    return I18n.t('scoreEmoji.critical');
  }
};
