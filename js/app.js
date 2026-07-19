/**
 * PromptForge — App Orchestrator
 * Main application controller that wires all modules together.
 */

const App = (() => {
  let currentAnalysis = null;
  let currentView = 'analyzer';

  function init() {
    setupNavigation();
    setupEditor();
    setupTabs();
    setupExport();
    setupTemplatesView();
    setupHistoryView();
    checkShareURL();
    updateEditorStats();
  }

  // ── Navigation ──────────────────────────────────────────
  function setupNavigation() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const view = btn.dataset.view;
        switchView(view);
      });
    });
  }

  function switchView(viewName) {
    currentView = viewName;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.nav-btn[data-view="${viewName}"]`).classList.add('active');
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    if (viewName === 'history') renderHistoryView();
    if (viewName === 'templates') renderTemplatesView();
  }

  // ── Editor ──────────────────────────────────────────────
  function setupEditor() {
    const textarea = document.getElementById('prompt-input');
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnClear = document.getElementById('btn-clear');
    const btnPaste = document.getElementById('btn-paste');

    textarea.addEventListener('input', updateEditorStats);

    textarea.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        runAnalysis();
      }
    });

    btnAnalyze.addEventListener('click', runAnalysis);

    btnClear.addEventListener('click', () => {
      textarea.value = '';
      updateEditorStats();
      showEmptyState();
    });

    btnPaste.addEventListener('click', async () => {
      try {
        const text = await navigator.clipboard.readText();
        textarea.value = text;
        updateEditorStats();
        textarea.focus();
      } catch {
        showToast('No se pudo acceder al portapapeles', 'error');
      }
    });
  }

  function updateEditorStats() {
    const text = document.getElementById('prompt-input').value;
    const chars = text.length;
    // Aligned with Analyzer._estimateTokens: split on whitespace, filter empties
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const tokens = Math.round(words * 1.3);

    document.getElementById('stat-chars').textContent = `${chars} caracteres`;
    document.getElementById('stat-words').textContent = `${words} palabras`;
    document.getElementById('stat-tokens').textContent = `~${tokens} tokens`;
  }

  // ── Analysis Pipeline ───────────────────────────────────
  function runAnalysis() {
    const prompt = document.getElementById('prompt-input').value.trim();
    if (!prompt) {
      showToast('Escribe un prompt para analizar', 'warning');
      return;
    }

    // Show loading state
    const btn = document.getElementById('btn-analyze');
    btn.disabled = true;
    btn.innerHTML = `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Analizando...`;

    // Small delay for UX feel
    setTimeout(() => {
      try {
        // 1. Core analysis
        const analysis = Analyzer.analyze(prompt);

        // 2. Adversarial tests
        const adversarial = Adversarial.runTests(prompt);

        // 3. Generate improved version
        const improved = Rewriter.improve(prompt, analysis);

        // 4. Store results
        currentAnalysis = { prompt, analysis, adversarial, improved, timestamp: Date.now() };

        // 5. Save to history
        History.save(prompt, analysis);

        // 6. Render results
        renderResults();

        showToast('Análisis completado', 'success');
      } catch (err) {
        console.error('Analysis error:', err);
        showToast('Error durante el análisis', 'error');
      }

      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> Analizar Prompt`;
    }, 400);
  }

  // ── Render Results ──────────────────────────────────────
  function renderResults() {
    if (!currentAnalysis) return;

    document.getElementById('empty-state').classList.add('hidden');
    const content = document.getElementById('results-content');
    content.classList.remove('hidden');

    const { analysis, adversarial, improved } = currentAnalysis;

    // Animate score
    animateScore(analysis.overallScore, analysis.grade);

    // Badges
    document.getElementById('badge-complexity').textContent = analysis.complexity;
    document.getElementById('badge-complexity').className = `badge badge-${analysis.complexity === 'avanzado' ? 'success' : analysis.complexity === 'intermedio' ? 'warning' : 'info'}`;
    document.getElementById('badge-language').textContent = analysis.language === 'es' ? 'Español' : analysis.language === 'en' ? 'English' : 'Mixto';
    document.getElementById('badge-language').className = 'badge badge-info';

    // Dimensions
    renderDimensions(analysis.dimensions);

    // Radar chart is initialised lazily when the user visits the Radar tab
    // (see switchTab) — calling renderRadar here would warn because the
    // chart does not exist yet on first analysis.

    // Anti-patterns
    renderAntiPatterns(analysis.antiPatterns, analysis.strengths);

    // Adversarial
    renderAdversarial(adversarial);

    // Improved prompt
    renderImproved(improved);

    // Switch to dimensions tab
    switchTab('dimensions');
  }

  function animateScore(targetScore, grade) {
    const numberEl = document.getElementById('score-number');
    const gradeEl = document.getElementById('score-grade');
    const ringFill = document.getElementById('score-ring-fill');
    const circumference = 2 * Math.PI * 54;
    
    ringFill.style.strokeDasharray = circumference;

    let current = 0;
    const duration = 1200;
    const start = performance.now();

    function update(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * targetScore);

      numberEl.textContent = current;
      const offset = circumference - (current / 100) * circumference;
      ringFill.style.strokeDashoffset = offset;

      // Color based on score
      const hue = (current / 100) * 120;
      ringFill.style.stroke = `hsl(${hue}, 80%, 55%)`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        gradeEl.textContent = grade;
        gradeEl.className = `score-grade grade-${grade.replace('+', 'plus').replace('-', 'minus')}`;
      }
    }
    requestAnimationFrame(update);
  }

  function renderDimensions(dimensions) {
    const container = document.getElementById('dimensions-list');
    const dimConfig = {
      clarity:        { icon: '🎯', name: 'Claridad',           color: '#00d4ff' },
      specificity:    { icon: '📐', name: 'Especificidad',      color: '#7c3aed' },
      structure:      { icon: '🏗️', name: 'Estructura',         color: '#f59e0b' },
      robustness:     { icon: '🛡️', name: 'Robustez',           color: '#10b981' },
      context:        { icon: '🧩', name: 'Contexto',           color: '#ec4899' },
      outputFormat:   { icon: '📝', name: 'Formato de Salida',  color: '#6366f1' },
      chainOfThought: { icon: '🔗', name: 'Chain of Thought',   color: '#f97316' },
      safety:         { icon: '⚠️', name: 'Seguridad',          color: '#ef4444' },
    };

    container.innerHTML = '';

    for (const [key, dim] of Object.entries(dimensions)) {
      const config = dimConfig[key];
      const card = document.createElement('div');
      card.className = 'dimension-card';
      card.style.setProperty('--dim-color', config.color);

      const scoreClass = dim.score >= 70 ? 'good' : dim.score >= 40 ? 'warning' : 'bad';

      card.innerHTML = `
        <div class="dimension-header" onclick="this.parentElement.classList.toggle('expanded')">
          <div class="dimension-left">
            <span class="dimension-icon">${config.icon}</span>
            <span class="dimension-name">${config.name}</span>
          </div>
          <div class="dimension-right">
            <div class="dimension-bar">
              <div class="dimension-bar-fill ${scoreClass}" style="width: ${dim.score}%"></div>
            </div>
            <span class="dimension-score ${scoreClass}">${dim.score}</span>
            <svg class="dimension-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div class="dimension-body">
          ${dim.findings.length > 0 ? `
            <div class="dimension-section">
              <h4 class="dimension-section-title">Hallazgos</h4>
              <ul class="finding-list">
                ${dim.findings.map(f => `<li class="finding-item finding-info">${escapeHtml(typeof f === 'string' ? f : (f.text || ''))}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${dim.suggestions.length > 0 ? `
            <div class="dimension-section">
              <h4 class="dimension-section-title">Sugerencias</h4>
              <ul class="suggestion-list">
                ${dim.suggestions.map(s => `<li class="suggestion-item">${escapeHtml(typeof s === 'string' ? s : (s.text || ''))}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${dim.findings.length === 0 && dim.suggestions.length === 0 ? '<p class="dim-empty">Sin observaciones específicas.</p>' : ''}
        </div>
      `;
      container.appendChild(card);
    }
  }

  function renderRadar(dimensions) {
    const scores = {
      clarity: dimensions.clarity.score,
      specificity: dimensions.specificity.score,
      structure: dimensions.structure.score,
      robustness: dimensions.robustness.score,
      context: dimensions.context.score,
      outputFormat: dimensions.outputFormat.score,
      chainOfThought: dimensions.chainOfThought.score,
      safety: dimensions.safety.score,
    };
    Charts.updateRadar(scores);
  }

  function renderAntiPatterns(antiPatterns, strengths) {
    const apList = document.getElementById('antipatterns-list');
    const stList = document.getElementById('strengths-list');

    document.getElementById('antipattern-count').textContent = antiPatterns.length;
    document.getElementById('strengths-count').textContent = strengths.length;

    if (antiPatterns.length === 0) {
      apList.innerHTML = '<div class="empty-findings"><p>🎉 No se detectaron anti-patrones. ¡Buen trabajo!</p></div>';
    } else {
      apList.innerHTML = antiPatterns.map(ap => `
        <div class="finding-card finding-card-${ap.severity}">
          <div class="finding-card-header">
            <span class="badge badge-${ap.severity}">${ap.severity.toUpperCase()}</span>
            <strong>${ap.name}</strong>
          </div>
          <p class="finding-card-desc">${ap.description}</p>
          <p class="finding-card-suggestion">💡 ${ap.suggestion}</p>
        </div>
      `).join('');
    }

    if (strengths.length === 0) {
      stList.innerHTML = '<div class="empty-findings"><p>No se detectaron patrones positivos destacables.</p></div>';
    } else {
      stList.innerHTML = strengths.map(s => `
        <div class="finding-card finding-card-strength">
          <div class="finding-card-header">
            <span class="badge badge-success">✓</span>
            <strong>${s.name}</strong>
          </div>
          <p class="finding-card-desc">${s.description}</p>
        </div>
      `).join('');
    }
  }

  function renderAdversarial(adversarial) {
    document.getElementById('resistance-score').textContent = `${adversarial.overallResistance}/100`;
    const list = document.getElementById('adversarial-list');

    list.innerHTML = adversarial.tests.map(t => `
      <div class="finding-card adversarial-card adversarial-${t.status}">
        <div class="finding-card-header">
          <span class="adversarial-status adversarial-status-${t.status}">
            ${t.status === 'pass' ? '✅' : t.status === 'warning' ? '⚠️' : '❌'} 
            ${t.status === 'pass' ? 'PASA' : t.status === 'warning' ? 'ADVERTENCIA' : 'FALLA'}
          </span>
          <strong>${t.name}</strong>
        </div>
        <p class="finding-card-desc">${t.detail}</p>
        ${t.suggestion ? `<p class="finding-card-suggestion">💡 ${t.suggestion}</p>` : ''}
      </div>
    `).join('');
  }

  function renderImproved(improved) {
    document.getElementById('improved-prompt-text').textContent = improved.improvedPrompt;

    const badge = document.getElementById('improvement-badge');
    badge.innerHTML = `Mejora estimada: <strong>+${improved.scoreImprovement} pts</strong>`;

    const changesList = document.getElementById('changes-list');
    changesList.innerHTML = improved.changes.map(c => `
      <div class="change-item change-${c.type}">
        <span class="change-type">${c.type === 'added' ? '➕ Agregado' : c.type === 'modified' ? '✏️ Modificado' : '🔄 Reestructurado'}</span>
        <span class="change-desc">${escapeHtml(c.description)}</span>
      </div>
    `).join('');

    // Button handlers
    document.getElementById('btn-apply-improvement').onclick = () => {
      document.getElementById('prompt-input').value = improved.improvedPrompt;
      updateEditorStats();
      switchView('analyzer');
      showToast('Prompt mejorado aplicado al editor', 'success');
    };

    document.getElementById('btn-copy-improvement').onclick = () => {
      ExportUtil.toClipboard(improved.improvedPrompt);
    };
  }

  function showEmptyState() {
    currentAnalysis = null;
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('results-content').classList.add('hidden');
  }

  // ── Tabs ────────────────────────────────────────────────
  function setupTabs() {
    document.getElementById('results-tabs').addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      switchTab(tab.dataset.tab);
    });
  }

  function switchTab(tabName) {
    document.querySelectorAll('#results-tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`#results-tabs .tab[data-tab="${tabName}"]`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (tabName === 'radar' && currentAnalysis) {
      // Initialise the chart only once; avoid the destroy/recreate flicker.
      if (!Charts.radarChart) {
        Charts.initRadar('radar-canvas');
      }
      renderRadar(currentAnalysis.analysis.dimensions);
    }
  }

  // ── Export ──────────────────────────────────────────────
  function setupExport() {
    const btn = document.getElementById('btn-export-menu');
    const menu = document.getElementById('export-menu');

    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const rect = btn.getBoundingClientRect();
      menu.style.top = `${rect.bottom + 8}px`;
      menu.style.right = `${window.innerWidth - rect.right}px`;
      menu.classList.toggle('hidden');
    });

    document.addEventListener('click', () => menu.classList.add('hidden'));

    document.getElementById('export-json').addEventListener('click', () => {
      if (!currentAnalysis) return showToast('Primero analiza un prompt', 'warning');
      // ExportUtil.downloadFile already shows a toast — avoid duplicate notifications.
      const json = ExportUtil.toJSON(currentAnalysis.analysis, currentAnalysis.prompt);
      ExportUtil.downloadFile(json, 'promptforge-analysis.json', 'application/json');
    });

    document.getElementById('export-markdown').addEventListener('click', () => {
      if (!currentAnalysis) return showToast('Primero analiza un prompt', 'warning');
      const md = ExportUtil.toMarkdown(currentAnalysis.analysis, currentAnalysis.prompt);
      ExportUtil.downloadFile(md, 'promptforge-analysis.md', 'text/markdown');
    });

    document.getElementById('export-clipboard').addEventListener('click', () => {
      if (!currentAnalysis) return showToast('Primero analiza un prompt', 'warning');
      const md = ExportUtil.toMarkdown(currentAnalysis.analysis, currentAnalysis.prompt);
      ExportUtil.toClipboard(md);
    });

    document.getElementById('export-share').addEventListener('click', () => {
      if (!currentAnalysis) return showToast('Primero analiza un prompt', 'warning');
      // toClipboard already notifies on success.
      const url = ExportUtil.generateShareURL(currentAnalysis.prompt);
      ExportUtil.toClipboard(url);
    });
  }

  // ── Templates View ─────────────────────────────────────
  function setupTemplatesView() {
    // Category filter clicks
    document.querySelector('.templates-filter').addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTemplatesView(btn.dataset.category);
    });
  }

  function renderTemplatesView(category = 'all') {
    // Render category buttons
    const filtersContainer = document.getElementById('category-filters');
    if (filtersContainer.children.length === 0) {
      Templates.categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.category = cat;
        btn.textContent = cat;
        filtersContainer.appendChild(btn);
      });
    }

    const grid = document.getElementById('templates-grid');
    const templates = category === 'all' ? Templates.templates : Templates.getByCategory(category);

    grid.innerHTML = templates.map(t => `
      <div class="template-card" data-id="${t.id}">
        <div class="template-card-header">
          <span class="template-category badge badge-info">${t.category}</span>
        </div>
        <h3 class="template-name">${t.name}</h3>
        <p class="template-desc">${t.description}</p>
        <div class="template-tags">
          ${t.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
        </div>
        <button class="btn btn-secondary btn-sm template-use-btn">Usar template</button>
      </div>
    `).join('');

    // Click to load template
    grid.querySelectorAll('.template-card').forEach(card => {
      card.querySelector('.template-use-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const id = card.dataset.id;
        const template = Templates.getById(id);
        if (template) {
          document.getElementById('prompt-input').value = template.prompt;
          updateEditorStats();
          switchView('analyzer');
          showToast(`Template "${template.name}" cargado`, 'success');
        }
      });
    });
  }

  // ── History View ───────────────────────────────────────
  function setupHistoryView() {
    document.getElementById('btn-export-history').addEventListener('click', () => {
      // downloadFile shows its own toast.
      const data = History.export();
      ExportUtil.downloadFile(data, 'promptforge-history.json', 'application/json');
    });

    document.getElementById('btn-clear-history').addEventListener('click', () => {
      if (confirm('¿Estás seguro de que deseas borrar todo el historial?')) {
        History.clear();
        renderHistoryView();
        showToast('Historial borrado', 'success');
      }
    });
  }

  function renderHistoryView() {
    const entries = History.getAll();
    const list = document.getElementById('history-list');
    const empty = document.getElementById('history-empty');
    const chartContainer = document.getElementById('history-chart-container');

    if (entries.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'flex';
      chartContainer.style.display = 'none';
      return;
    }

    empty.style.display = 'none';
    chartContainer.style.display = 'block';

    // Update history chart
    const evolution = History.getScoreEvolution();
    Charts.initHistoryChart('history-canvas');
    Charts.updateHistoryChart(evolution);

    list.innerHTML = entries.map(entry => {
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const preview = entry.prompt.substring(0, 100) + (entry.prompt.length > 100 ? '...' : '');
      // score/grade are convenience fields on the entry; fall back to analysis
      const score = entry.score ?? entry.overallScore ?? entry.analysis?.overallScore ?? null;
      const grade = entry.grade ?? entry.analysis?.grade ?? '—';
      const scoreClass = score === null ? 'bad' : (score >= 70 ? 'good' : score >= 40 ? 'warning' : 'bad');

      return `
        <div class="history-item" data-id="${entry.id}">
          <div class="history-score">
            <span class="history-score-value ${scoreClass}">${score === null ? '—' : score}</span>
            <span class="history-score-grade">${grade}</span>
          </div>
          <div class="history-info">
            <p class="history-preview">${escapeHtml(preview)}</p>
            <span class="history-date">${dateStr}</span>
          </div>
          <div class="history-actions-group">
            <button class="btn-icon btn-sm history-load" title="Cargar en editor">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
            <button class="btn-icon btn-sm history-delete" title="Eliminar">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/></svg>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // Event handlers
    list.querySelectorAll('.history-load').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.history-item').dataset.id;
        const entry = History.getById(id);
        if (entry) {
          document.getElementById('prompt-input').value = entry.prompt;
          updateEditorStats();
          switchView('analyzer');
          showToast('Prompt cargado desde historial', 'success');
        }
      });
    });

    list.querySelectorAll('.history-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.target.closest('.history-item').dataset.id;
        History.delete(id);
        renderHistoryView();
      });
    });
  }

  // ── Share URL ──────────────────────────────────────────
  function checkShareURL() {
    const prompt = ExportUtil.parseShareURL();
    if (prompt) {
      document.getElementById('prompt-input').value = prompt;
      updateEditorStats();
      showToast('Prompt cargado desde enlace compartido', 'info');
    }
  }

  // ── Toast Notifications ────────────────────────────────
  function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };

    // Build the DOM with textContent to avoid XSS if message ever includes
    // user-controlled content.
    const iconSpan = document.createElement('span');
    iconSpan.className = 'toast-icon';
    iconSpan.textContent = icons[type] || icons.info;

    const msgSpan = document.createElement('span');
    msgSpan.className = 'toast-msg';
    msgSpan.textContent = message;

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('toast-show'));

    setTimeout(() => {
      toast.classList.remove('toast-show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }

  // ── Utility ────────────────────────────────────────────
  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // ── Public API ─────────────────────────────────────────
  return { init, showToast, switchView };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
