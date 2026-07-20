// ============================================================================
// PromptForge - Version History Manager
// localStorage-backed history with diff, export/import, and score tracking
// ============================================================================

const History = {
  STORAGE_KEY: 'promptforge_history',
  MAX_ENTRIES: 50,

  // ════════════════════════════════════════════════════════════════════════
  // Core CRUD operations
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Save a prompt and its analysis to history.
   * @param {string} prompt - The prompt text
   * @param {Object} analysis - Analysis results (scores, metrics, etc.)
   * @returns {Object} The saved entry
   */
  save(prompt, analysis) {
    const entries = this._load();

    const entry = {
      id: this._generateId(),
      timestamp: new Date().toISOString(),
      prompt: prompt || '',
      analysis: analysis || {},
      overallScore: analysis?.overallScore ?? null,
      // Convenience fields used by renderHistoryView (kept in sync with analysis)
      score: analysis?.overallScore ?? null,
      grade: analysis?.grade ?? null,
      label: this._autoLabel(prompt),
      version: entries.filter(e => this._similarPrompt(e.prompt, prompt)).length + 1
    };

    entries.unshift(entry);

    // Enforce max entries limit — remove oldest
    while (entries.length > this.MAX_ENTRIES) {
      entries.pop();
    }

    const ok = this._persist(entries);
    if (!ok) {
      console.warn('[PromptForge History] No se pudo persistir el historial (posible cuota excedida).');
    }
    return entry;
  },

  /**
   * Get all history entries sorted by date descending.
   * @returns {Array}
   */
  getAll() {
    return this._load().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  },

  /**
   * Get a single entry by its ID.
   * @param {string} id
   * @returns {Object|null}
   */
  getById(id) {
    return this._load().find(e => e.id === id) || null;
  },

  /**
   * Delete a single entry.
   * @param {string} id
   * @returns {boolean} Whether the entry was found and deleted
   */
  delete(id) {
    const entries = this._load();
    const index = entries.findIndex(e => e.id === id);
    if (index === -1) return false;
    entries.splice(index, 1);
    this._persist(entries);
    return true;
  },

  /**
   * Clear all history.
   */
  clear() {
    this._persist([]);
  },

  // ════════════════════════════════════════════════════════════════════════
  // Comparison & analytics
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Compare two history entries and return a structured diff.
   * @param {string} id1 - First entry ID
   * @param {string} id2 - Second entry ID
   * @returns {Object} Diff object with added, removed, changed lines and score comparison
   */
  compare(id1, id2) {
    const entry1 = this.getById(id1);
    const entry2 = this.getById(id2);

    if (!entry1 || !entry2) {
      return { error: 'Una o ambas entradas no encontradas.', entry1: !!entry1, entry2: !!entry2 };
    }

    const lines1 = (entry1.prompt || '').split('\n');
    const lines2 = (entry2.prompt || '').split('\n');

    // Compute line-level diff using LCS
    const diff = this._computeDiff(lines1, lines2);

    // Score comparison
    const score1 = entry1.overallScore ?? entry1.analysis?.overallScore ?? null;
    const score2 = entry2.overallScore ?? entry2.analysis?.overallScore ?? null;

    return {
      entry1: { id: id1, timestamp: entry1.timestamp, label: entry1.label },
      entry2: { id: id2, timestamp: entry2.timestamp, label: entry2.label },
      diff,
      stats: {
        linesAdded: diff.filter(d => d.type === 'added').length,
        linesRemoved: diff.filter(d => d.type === 'removed').length,
        linesUnchanged: diff.filter(d => d.type === 'unchanged').length,
        totalChanges: diff.filter(d => d.type !== 'unchanged').length
      },
      scores: {
        score1,
        score2,
        delta: (score1 !== null && score2 !== null) ? score2 - score1 : null,
        improved: (score1 !== null && score2 !== null) ? score2 > score1 : null
      },
      promptLength: {
        length1: entry1.prompt.length,
        length2: entry2.prompt.length,
        delta: entry2.prompt.length - entry1.prompt.length
      }
    };
  },

  /**
   * Get score evolution over time for charting.
   * @returns {Array<{ date: string, score: number, label: string, id: string }>}
   */
  getScoreEvolution() {
    return this.getAll()
      .filter(e => e.overallScore !== null && e.overallScore !== undefined)
      .reverse() // chronological order for charts
      .map(e => ({
        date: e.timestamp,
        score: e.overallScore,
        label: e.label,
        id: e.id
      }));
  },

  // ════════════════════════════════════════════════════════════════════════
  // Import / Export
  // ════════════════════════════════════════════════════════════════════════

  /**
   * Export all history as a JSON string.
   * @returns {string} Formatted JSON
   */
  export() {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      application: 'PromptForge',
      entries: this.getAll()
    };
    return JSON.stringify(data, null, 2);
  },

  /**
   * Import history from a JSON string. Merges with existing (deduplicates by ID).
   * @param {string} jsonString
   * @returns {{ imported: number, duplicates: number, errors: string[] }}
   */
  import(jsonString) {
    const result = { imported: 0, duplicates: 0, errors: [] };

    let data;
    try {
      data = JSON.parse(jsonString);
    } catch (e) {
      result.errors.push(`Error al parsear JSON: ${e.message}`);
      return result;
    }

    // Support both raw array and wrapped format
    const entries = Array.isArray(data) ? data : (data.entries || []);

    if (!Array.isArray(entries)) {
      result.errors.push('Formato inválido: se esperaba un array de entradas.');
      return result;
    }

    const existing = this._load();
    const existingIds = new Set(existing.map(e => e.id));

    for (const entry of entries) {
      // Validate required fields
      if (!entry.id || !entry.prompt) {
        result.errors.push(`Entrada inválida (falta id o prompt): ${JSON.stringify(entry).substring(0, 80)}...`);
        continue;
      }

      if (existingIds.has(entry.id)) {
        result.duplicates++;
        continue;
      }

      // Ensure required fields have defaults
      existing.push({
        id: entry.id,
        timestamp: entry.timestamp || new Date().toISOString(),
        prompt: entry.prompt,
        analysis: entry.analysis || {},
        overallScore: entry.overallScore ?? entry.analysis?.overallScore ?? null,
        label: entry.label || this._autoLabel(entry.prompt),
        version: entry.version || 1
      });

      existingIds.add(entry.id);
      result.imported++;
    }

    // Enforce max entries
    existing.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    while (existing.length > this.MAX_ENTRIES) {
      existing.pop();
    }

    const ok = this._persist(existing);
    if (!ok && result.errors) {
      result.errors.push('No se pudo persistir el historial importado (cuota de almacenamiento excedida).');
    }
    return result;
  },

  // ════════════════════════════════════════════════════════════════════════
  // Private helpers
  // ════════════════════════════════════════════════════════════════════════

  /** @private Load entries from localStorage */
  _load() {
    try {
      const raw = localStorage.getItem(this.STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.warn('[PromptForge History] Error reading from localStorage:', e);
      return [];
    }
  },

  /**
   * @private Persist entries to localStorage.
   * @returns {boolean} true if persisted successfully (possibly after trimming).
   */
  _persist(entries) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(entries));
      return true;
    } catch (e) {
      console.error('[PromptForge History] Error writing to localStorage:', e);
      // If quota exceeded, try removing oldest entries
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        const trimmed = entries.slice(0, Math.floor(entries.length * 0.75));
        try {
          localStorage.setItem(this.STORAGE_KEY, JSON.stringify(trimmed));
          console.warn(`[PromptForge History] Trimmed to ${trimmed.length} entries due to storage quota.`);
          return true;
        } catch (e2) {
          console.error('[PromptForge History] Cannot save even after trimming:', e2);
        }
      }
      return false;
    }
  },

  /** @private Generate a unique ID */
  _generateId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `pf-${timestamp}-${random}`;
  },

  /** @private Generate an automatic label from the prompt */
  _autoLabel(prompt) {
    if (!prompt) return I18n.t('historyLabel.emptyPrompt');
    // Take first meaningful line, trimmed
    const firstLine = prompt.trim().split('\n')
      .map(l => l.replace(/<\/?[^>]+>/g, '').trim())
      .find(l => l.length > 5);

    if (!firstLine) return I18n.t('historyLabel.untitled');
    return firstLine.length > 60 ? firstLine.substring(0, 57) + '...' : firstLine;
  },

  /** @private Check if two prompts are similar (for versioning) */
  _similarPrompt(a, b) {
    if (!a || !b) return false;
    // Normalized comparison: strip whitespace and XML tags, compare first 100 chars
    const normalize = s => s.replace(/<\/?[^>]+>/g, '').replace(/\s+/g, ' ').trim().substring(0, 100).toLowerCase();
    const na = normalize(a);
    const nb = normalize(b);

    // Simple Jaccard similarity on words
    const wordsA = new Set(na.split(' '));
    const wordsB = new Set(nb.split(' '));
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;

    return union > 0 && (intersection / union) > 0.6;
  },

  /**
   * Compute a line-level diff using Longest Common Subsequence.
   * @private
   * @param {string[]} lines1
   * @param {string[]} lines2
   * @returns {Array<{ type: 'added'|'removed'|'unchanged', content: string }>}
   */
  _computeDiff(lines1, lines2) {
    const m = lines1.length;
    const n = lines2.length;

    // Build LCS table
    const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (lines1[i - 1] === lines2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    // Backtrack to build diff
    const diff = [];
    let i = m, j = n;

    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && lines1[i - 1] === lines2[j - 1]) {
        diff.unshift({ type: 'unchanged', content: lines1[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        diff.unshift({ type: 'added', content: lines2[j - 1] });
        j--;
      } else {
        diff.unshift({ type: 'removed', content: lines1[i - 1] });
        i--;
      }
    }

    return diff;
  }
};
