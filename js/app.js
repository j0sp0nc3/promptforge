/**
 * Promptometer — App Orchestrator
 * Main application controller that wires all modules together.
 */

const App = (() => {
  let currentAnalysis = null;
  let currentView = 'analyzer';

  function init() {
    // i18n must boot first so every later render speaks the right language.
    I18n.init();
    I18n.applyToDOM();
    applyDocMetadata();

    setupLanguageSwitcher();
    setupNavigation();
    setupEditor();
    setupTabs();
    setupExport();
    setupTemplatesView();
    setupHistoryView();
    setupLearnView();
    setupLeaderboardView();
    checkShareURL();
    updateEditorStats();

    // Re-render dynamic content when the language changes.
    document.addEventListener('langchange', onLangChange);
  }

  // ── i18n helpers ────────────────────────────────────────────
  function t(key, params) { return I18n.t(key, params); }

  function applyDocMetadata() {
    document.title = t('meta.title');
    const meta = document.getElementById('meta-description');
    if (meta) meta.setAttribute('content', t('meta.description'));
  }

  function onLangChange() {
    applyDocMetadata();
    // Charts bake their labels at build time, so destroy them so the next
    // render rebuilds them in the new language.
    if (typeof Charts !== 'undefined') Charts.destroy();
    // Re-render the active view so dynamic strings pick up the new language.
    if (currentView === 'templates') renderTemplatesView(getActiveCategoryFilter());
    if (currentView === 'history') renderHistoryView();
    if (currentView === 'learn') renderLearnView(getActiveLearnSub());
    if (currentView === 'leaderboard') renderLeaderboardView();
    if (currentAnalysis) renderResults();
  }

  function getActiveCategoryFilter() {
    const active = document.querySelector('.filter-btn.active');
    return active ? active.dataset.category : 'all';
  }

  function setupLanguageSwitcher() {
    const switcher = document.getElementById('lang-switcher');
    if (!switcher) return;

    // Reflect the active language on load.
    const current = I18n.getLang();
    switcher.querySelectorAll('.lang-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.lang === current);
    });

    switcher.addEventListener('click', (e) => {
      const btn = e.target.closest('.lang-btn');
      if (!btn) return;
      const lang = btn.dataset.lang;
      if (lang === I18n.getLang()) return;
      I18n.setLang(lang);
      switcher.querySelectorAll('.lang-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.lang === lang);
      });
    });
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
    if (viewName === 'templates') renderTemplatesView(getActiveCategoryFilter());
    if (viewName === 'learn') renderLearnView(getActiveLearnSub());
    if (viewName === 'leaderboard') renderLeaderboardView();
  }

  function getActiveLearnSub() {
    const active = document.querySelector('.learn-subnav-btn.active');
    return active ? active.dataset.sub : 'glossary';
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
        showToast(t('toast.pasteError'), 'error');
      }
    });
  }

  function updateEditorStats() {
    const text = document.getElementById('prompt-input').value;
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).filter(Boolean).length : 0;
    const tokens = Math.round(words * 1.3);

    document.getElementById('stat-chars').textContent = t('stats.chars', { n: chars });
    document.getElementById('stat-words').textContent = t('stats.words', { n: words });
    document.getElementById('stat-tokens').textContent = t('stats.tokens', { n: tokens });
  }

  // ── Analysis Pipeline ───────────────────────────────────
  function runAnalysis() {
    const prompt = document.getElementById('prompt-input').value.trim();
    if (!prompt) {
      showToast(t('toast.writePrompt'), 'warning');
      return;
    }

    // Show loading state
    const btn = document.getElementById('btn-analyze');
    btn.disabled = true;
    btn.innerHTML = `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> ${escapeHtml(t('editor.analyzing'))}`;

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

        showToast(t('toast.analysisComplete'), 'success');
      } catch (err) {
        console.error('Analysis error:', err);
        showToast(t('toast.analysisError'), 'error');
      }

      btn.disabled = false;
      btn.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg> ${escapeHtml(t('editor.analyze'))}`;
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
    const complexityKey = analysis.complexity; // 'basic' | 'intermediate' | 'advanced'
    const complexityBadge = document.getElementById('badge-complexity');
    complexityBadge.textContent = t(`complexity.${complexityKey}`);
    complexityBadge.className = `badge badge-${complexityKey === 'advanced' ? 'success' : complexityKey === 'intermediate' ? 'warning' : 'info'}`;

    const langBadge = document.getElementById('badge-language');
    langBadge.textContent = analysis.language === 'es' ? t('language.es')
                          : analysis.language === 'en' ? t('language.en')
                          : t('language.mixed');
    langBadge.className = 'badge badge-info';

    // Dimensions
    renderDimensions(analysis.dimensions);

    // Anti-patterns
    renderAntiPatterns(analysis.antiPatterns, analysis.strengths);

    // Adversarial
    renderAdversarial(adversarial);

    // Improved prompt
    renderImproved(improved);

    // Radar chart is initialised lazily when the user visits the Radar tab.
    if (document.getElementById('tab-radar').classList.contains('active')) {
      if (!Charts.radarChart) Charts.initRadar('radar-canvas');
      renderRadar(analysis.dimensions);
    }

    // Keep the currently active results tab active.
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
      clarity:        { icon: '🎯', name: t('dimensions.clarity'),        color: '#00d4ff' },
      specificity:    { icon: '📐', name: t('dimensions.specificity'),    color: '#7c3aed' },
      structure:      { icon: '🏗️', name: t('dimensions.structure'),      color: '#f59e0b' },
      robustness:     { icon: '🛡️', name: t('dimensions.robustness'),     color: '#10b981' },
      context:        { icon: '🧩', name: t('dimensions.context'),        color: '#ec4899' },
      outputFormat:   { icon: '📝', name: t('dimensions.outputFormat'),   color: '#6366f1' },
      chainOfThought: { icon: '🔗', name: t('dimensions.chainOfThought'), color: '#f97316' },
      safety:         { icon: '⚠️', name: t('dimensions.safety'),         color: '#ef4444' },
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
            <span class="dimension-name">${escapeHtml(config.name)}</span>
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
              <h4 class="dimension-section-title">${escapeHtml(t('sections.findings'))}</h4>
              <ul class="finding-list">
                ${dim.findings.map(f => `<li class="finding-item finding-info">${escapeHtml(typeof f === 'string' ? f : (f.text || ''))}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${dim.suggestions.length > 0 ? `
            <div class="dimension-section">
              <h4 class="dimension-section-title">${escapeHtml(t('sections.suggestions'))}</h4>
              <ul class="suggestion-list">
                ${dim.suggestions.map(s => `<li class="suggestion-item">${escapeHtml(typeof s === 'string' ? s : (s.text || ''))}</li>`).join('')}
              </ul>
            </div>
          ` : ''}
          ${dim.findings.length === 0 && dim.suggestions.length === 0 ? `<p class="dim-empty">${escapeHtml(t('dimensions.noObservations'))}</p>` : ''}
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
      apList.innerHTML = `<div class="empty-findings"><p>${escapeHtml(t('antipatterns.empty'))}</p></div>`;
    } else {
      apList.innerHTML = antiPatterns.map(ap => `
        <div class="finding-card finding-card-${ap.severity}">
          <div class="finding-card-header">
            <span class="badge badge-${ap.severity}">${ap.severity.toUpperCase()}</span>
            <strong>${escapeHtml(ap.name)}</strong>
          </div>
          <p class="finding-card-desc">${escapeHtml(ap.description)}</p>
          <p class="finding-card-suggestion">💡 ${escapeHtml(ap.suggestion)}</p>
        </div>
      `).join('');
    }

    if (strengths.length === 0) {
      stList.innerHTML = `<div class="empty-findings"><p>${escapeHtml(t('strengths.empty'))}</p></div>`;
    } else {
      stList.innerHTML = strengths.map(s => `
        <div class="finding-card finding-card-strength">
          <div class="finding-card-header">
            <span class="badge badge-success">✓</span>
            <strong>${escapeHtml(s.name)}</strong>
          </div>
          <p class="finding-card-desc">${escapeHtml(s.description)}</p>
        </div>
      `).join('');
    }
  }

  function renderAdversarial(adversarial) {
    document.getElementById('resistance-score').textContent = `${adversarial.overallResistance}/100`;
    const list = document.getElementById('adversarial-list');

    list.innerHTML = adversarial.tests.map(test => {
      const statusLabel = t(`status.${test.status}`);
      const icon = test.status === 'pass' ? '✅' : test.status === 'warning' ? '⚠️' : '❌';
      return `
        <div class="finding-card adversarial-card adversarial-${test.status}">
          <div class="finding-card-header">
            <span class="adversarial-status adversarial-status-${test.status}">
              ${icon} ${escapeHtml(statusLabel)}
            </span>
            <strong>${escapeHtml(test.name)}</strong>
          </div>
          <p class="finding-card-desc">${escapeHtml(test.detail)}</p>
          ${test.suggestion ? `<p class="finding-card-suggestion">💡 ${escapeHtml(test.suggestion)}</p>` : ''}
        </div>
      `;
    }).join('');
  }

  function renderImproved(improved) {
    document.getElementById('improved-prompt-text').textContent = improved.improvedPrompt;

    const badge = document.getElementById('improvement-badge');
    badge.innerHTML = t('improvement.estimated', { n: improved.scoreImprovement });

    // FASE 7: Top 5 Impact Issues (Before / After Resolution)
    const topImpactEl = document.getElementById('top-impact-container');
    if (topImpactEl && currentAnalysis && currentAnalysis.analysis.suggestions) {
      const topSuggestions = currentAnalysis.analysis.suggestions.slice(0, 5);
      if (topSuggestions.length > 0) {
        topImpactEl.innerHTML = `
          <div style="margin-bottom: 1rem; padding: 12px; background: rgba(255, 183, 3, 0.05); border: 1px solid rgba(255, 183, 3, 0.15); border-radius: var(--radius-md);">
            <h4 style="color: var(--accent-amber); font-size: 0.85rem; margin-bottom: 8px;">⚡ Resolución de Problemas Prioritarios (Antes vs Después)</h4>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${topSuggestions.map((s, idx) => `
                <div style="display: flex; align-items: flex-start; justify-content: space-between; font-size: 0.8rem; padding: 6px 0; border-bottom: 1px solid rgba(255, 255, 255, 0.04);">
                  <div style="flex: 1;">
                    <span style="color: var(--severity-high); font-weight: 700;">Antes:</span> ${escapeHtml(s.description || s.title)}
                  </div>
                  <div style="flex: 1; text-align: right; color: var(--accent-emerald); font-weight: 600;">
                    ✓ Resuelto mediante estructura XML
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        `;
      } else {
        topImpactEl.innerHTML = '';
      }
    }

    const changesList = document.getElementById('changes-list');
    const typeLabel = (type) => t(`changes.${type === 'added' ? 'added' : type === 'modified' ? 'modified' : 'restructured'}`);
    changesList.innerHTML = improved.changes.map(c => `
      <div class="change-item change-${c.type}">
        <span class="change-type">${escapeHtml(typeLabel(c.type))}</span>
        <span class="change-desc">${escapeHtml(c.description)}</span>
      </div>
    `).join('');

    // Button handlers
    document.getElementById('btn-apply-improvement').onclick = () => {
      document.getElementById('prompt-input').value = improved.improvedPrompt;
      updateEditorStats();
      switchView('analyzer');
      showToast(t('toast.improvementApplied'), 'success');
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
    document.querySelectorAll('#results-tabs .tab').forEach(tEl => tEl.classList.remove('active'));
    document.querySelector(`#results-tabs .tab[data-tab="${tabName}"]`).classList.add('active');
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).classList.add('active');

    if (tabName === 'radar' && currentAnalysis) {
      if (typeof Charts !== 'undefined') {
        // Initialise only once; reusing the existing chart avoids the
        // destroy/recreate flicker on every tab visit.
        if (!Charts.radarChart) {
          Charts.initRadar('radar-canvas');
        }
        // renderRadar extracts the .score numbers from each dimension;
        // passing dimensions directly to updateRadar yields 0 for every
        // axis (dimensions are objects, not numbers).
        renderRadar(currentAnalysis.analysis.dimensions);
      }
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
      if (!currentAnalysis) return showToast(t('toast.noAnalysis'), 'warning');
      const json = ExportUtil.toJSON(currentAnalysis.analysis, currentAnalysis.prompt);
      ExportUtil.downloadFile(json, 'promptometer-analysis.json', 'application/json');
    });

    document.getElementById('export-markdown').addEventListener('click', () => {
      if (!currentAnalysis) return showToast(t('toast.noAnalysis'), 'warning');
      const md = ExportUtil.toMarkdown(currentAnalysis.analysis, currentAnalysis.prompt);
      ExportUtil.downloadFile(md, 'promptometer-analysis.md', 'text/markdown');
    });

    document.getElementById('export-clipboard').addEventListener('click', () => {
      if (!currentAnalysis) return showToast(t('toast.noAnalysis'), 'warning');
      const md = ExportUtil.toMarkdown(currentAnalysis.analysis, currentAnalysis.prompt);
      ExportUtil.toClipboard(md);
    });

    document.getElementById('export-share').addEventListener('click', () => {
      if (!currentAnalysis) return showToast(t('toast.noAnalysis'), 'warning');
      const url = ExportUtil.generateShareURL(currentAnalysis.prompt);
      ExportUtil.toClipboard(url);
    });
  }

  // ── Templates View ─────────────────────────────────────
  function setupTemplatesView() {
    document.querySelector('.templates-filter').addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      renderTemplatesView(btn.dataset.category);
    });
  }

  function renderTemplatesView(category = 'all') {
    // Render category buttons (translated)
    const filtersContainer = document.getElementById('category-filters');
    filtersContainer.innerHTML = '';
    Templates.categories.forEach(cat => {
      const btn = document.createElement('button');
      btn.className = 'filter-btn';
      btn.dataset.category = cat;
      btn.textContent = Templates.getCategoryLabel(cat);
      filtersContainer.appendChild(btn);
    });
    // Restore active state for the requested category
    document.querySelectorAll('.filter-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.category === category);
    });

    const grid = document.getElementById('templates-grid');
    const templates = category === 'all' ? Templates.templates : Templates.getByCategory(category);

    grid.innerHTML = templates.map(tpl => `
      <div class="template-card" data-id="${tpl.id}">
        <div class="template-card-header">
          <span class="template-category badge badge-info">${escapeHtml(Templates.getCategoryLabel(tpl.category))}</span>
        </div>
        <h3 class="template-name">${escapeHtml(Templates.getName(tpl))}</h3>
        <p class="template-desc">${escapeHtml(Templates.getDescription(tpl))}</p>
        <div class="template-tags">
          ${Templates.getTags(tpl).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>
        <button class="btn btn-secondary btn-sm template-use-btn">${escapeHtml(I18n.t('templates.use'))}</button>
      </div>
    `).join('');

    // Click to load template
    grid.querySelectorAll('.template-card').forEach(card => {
      card.querySelector('.template-use-btn').addEventListener('click', (e) => {
        e.stopPropagation();
        const id = card.dataset.id;
        const tpl = Templates.getById(id);
        if (tpl) {
          document.getElementById('prompt-input').value = tpl.prompt;
          updateEditorStats();
          switchView('analyzer');
          showToast(I18n.t('toast.templateLoaded', { name: Templates.getName(tpl) }), 'success');
        }
      });
    });
  }

  // ── History View ───────────────────────────────────────
  function setupHistoryView() {
    document.getElementById('btn-export-history').addEventListener('click', () => {
      const data = History.export();
      ExportUtil.downloadFile(data, 'promptometer-history.json', 'application/json');
    });

    document.getElementById('btn-clear-history').addEventListener('click', () => {
      if (confirm(I18n.t('history.confirmClear'))) {
        History.clear();
        renderHistoryView();
        showToast(I18n.t('toast.historyCleared'), 'success');
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

    const locale = I18n.getLang() === 'es' ? 'es-ES' : 'en-US';
    list.innerHTML = entries.map(entry => {
      const date = new Date(entry.timestamp);
      const dateStr = date.toLocaleDateString(locale, { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
      const preview = entry.prompt.substring(0, 100) + (entry.prompt.length > 100 ? '...' : '');
      const score = entry.score ?? entry.overallScore ?? entry.analysis?.overallScore ?? null;
      const grade = entry.grade ?? entry.analysis?.grade ?? '—';
      const scoreClass = score === null ? 'bad' : (score >= 70 ? 'good' : score >= 40 ? 'warning' : 'bad');

      return `
        <div class="history-item" data-id="${entry.id}">
          <div class="history-score">
            <span class="history-score-value ${scoreClass}">${score === null ? '—' : score}</span>
            <span class="history-score-grade">${escapeHtml(grade)}</span>
          </div>
          <div class="history-info">
            <p class="history-preview">${escapeHtml(preview)}</p>
            <span class="history-date">${escapeHtml(dateStr)}</span>
          </div>
          <div class="history-actions-group">
            <button class="btn-icon btn-sm history-load" title="${escapeHtml(I18n.t('history.load'))}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>
            </button>
            <button class="btn-icon btn-sm history-delete" title="${escapeHtml(I18n.t('history.delete'))}">
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
          showToast(I18n.t('toast.historyLoaded'), 'success');
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
      showToast(I18n.t('toast.shareLoaded'), 'info');
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
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
  }

  // ── Learn Hub (Knowledge) ─────────────────────────────
  // A navigation + expansion layer over existing content. See js/knowledge.js
  // for the data module. Sub-sections: glossary, techniques, frameworks, library.
  let currentLearnSub = 'glossary';

  function setupLearnView() {
    const subnav = document.getElementById('learn-subnav');
    if (subnav) {
      subnav.addEventListener('click', (e) => {
        const btn = e.target.closest('.learn-subnav-btn');
        if (!btn) return;
        renderLearnView(btn.dataset.sub);
      });
    }

    const searchInput = document.getElementById('learn-search-input');
    const searchClear = document.getElementById('learn-search-clear');

    if (searchInput) {
      searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim().toLowerCase();
        if (searchClear) searchClear.classList.toggle('hidden', !query);
        applyLearnSearchFilter(query);
      });
    }

    if (searchClear && searchInput) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        searchClear.classList.add('hidden');
        applyLearnSearchFilter('');
        searchInput.focus();
      });
    }
  }

  function applyLearnSearchFilter(query) {
    const activeSub = getActiveLearnSub();
    const activePanel = document.getElementById(`learn-${activeSub}`);
    if (!activePanel) return;

    const items = activePanel.querySelectorAll('.learn-card, .learn-list-item');
    let visibleCount = 0;

    items.forEach(item => {
      if (!query) {
        item.style.display = '';
        visibleCount++;
        return;
      }
      const text = item.textContent.toLowerCase();
      const matches = text.includes(query);
      item.style.display = matches ? '' : 'none';
      if (matches) visibleCount++;
    });

    const existingNotice = activePanel.querySelector('.learn-empty-search');
    if (existingNotice) existingNotice.remove();

    if (query && visibleCount === 0) {
      const notice = document.createElement('div');
      notice.className = 'learn-empty-search';
      notice.innerHTML = `
        <p>${t('learn.noSearchResults', { query: escapeHtml(query) })}</p>
        <button class="btn btn-secondary btn-sm" style="margin-top:8px" onclick="document.getElementById('learn-search-clear').click()">${t('learn.clearSearch')}</button>
      `;
      activePanel.appendChild(notice);
    }
  }

  function renderLearnView(sub) {
    if (sub) currentLearnSub = sub;
    const activeSub = currentLearnSub;

    // Toggle active state on sub-nav buttons
    document.querySelectorAll('.learn-subnav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.sub === activeSub);
    });

    // Show only the matching panel
    ['glossary', 'techniques', 'frameworks', 'library', 'references'].forEach(name => {
      const panel = document.getElementById(`learn-${name}`);
      if (panel) panel.classList.toggle('active', name === activeSub);
    });

    // Render the panel's content (lazy, re-rendered each visit for i18n)
    if (activeSub === 'glossary') renderGlossary();
    if (activeSub === 'techniques') renderTechniques();
    if (activeSub === 'frameworks') renderFrameworks();
    if (activeSub === 'library') renderLibrary();
    if (activeSub === 'references') renderReferences();

    const searchInput = document.getElementById('learn-search-input');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    applyLearnSearchFilter(query);
  }

  function renderReferences() {
    const container = document.getElementById('learn-references');
    if (!container || typeof Knowledge === 'undefined') return;
    const lang = I18n.getLang();
    const references = Knowledge.references || [];

    const badgeMap = {
      official: { class: 'badge-success', label: { es: 'Oficial', en: 'Official' } },
      guide: { class: 'badge-info', label: { es: 'Guía', en: 'Guide' } },
      paper: { class: 'badge-warning', label: { es: 'Investigación', en: 'Paper' } },
      security: { class: 'badge-critical', label: { es: 'Seguridad', en: 'Security' } },
    };

    container.innerHTML = `
      <div class="learn-panel-header">
        <h2 class="view-title">${t('learn.referencesTitle')}</h2>
        <p class="view-subtitle">${t('learn.referencesSubtitle')}</p>
      </div>
      <div class="learn-grid">
        ${references.map(ref => {
          const badgeInfo = badgeMap[ref.type] || { class: 'badge-info', label: { es: ref.type, en: ref.type } };
          const badgeText = badgeInfo.label[lang] || badgeInfo.label.es;
          return `
          <article class="learn-card learn-card-reference" data-id="${ref.id}">
            <div class="learn-card-header">
              <span class="learn-term-name">${escapeHtml(ref.title[lang] || ref.title.es)}</span>
              <span class="badge ${badgeInfo.class}">${escapeHtml(badgeText)}</span>
            </div>
            <p class="learn-meta"><strong>${escapeHtml(ref.source)}</strong></p>
            <p class="learn-term-def">${escapeHtml(ref.desc[lang] || ref.desc.es)}</p>
            <div class="learn-example-block" style="margin-top:auto">
              <a href="${escapeHtml(ref.url)}" target="_blank" rel="noopener noreferrer" class="btn btn-secondary btn-sm learn-link-btn" style="text-decoration:none;display:inline-flex;align-items:center;gap:6px">
                ${t('learn.visitLink')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </article>`;
        }).join('')}
      </div>
    `;
  }

  function renderGlossary() {
    const container = document.getElementById('learn-glossary');
    if (!container || typeof Knowledge === 'undefined') return;
    const lang = I18n.getLang();
    const terms = Knowledge.glossary;

    container.innerHTML = `
      <div class="learn-panel-header">
        <h2 class="view-title">${t('learn.glossaryTitle')}</h2>
        <p class="view-subtitle">${t('learn.glossarySubtitle')}</p>
      </div>
      <div class="learn-grid">
        ${terms.map(term => `
          <article class="learn-card learn-card-glossary" data-id="${term.id}">
            <div class="learn-card-header">
              <span class="learn-term-name">${escapeHtml(term.term[lang] || term.term.es)}</span>
              <span class="learn-term-tag tag">${escapeHtml(term.category || 'concept')}</span>
            </div>
            <p class="learn-term-def">${escapeHtml(term.def[lang] || term.def.es)}</p>
            ${term.example ? `
              <div class="learn-term-example">
                <span class="learn-example-label">${t('learn.exampleLabel')}</span>
                <code>${escapeHtml(term.example[lang] || term.example.es)}</code>
              </div>` : ''}
            ${term.crossRefs && term.crossRefs.length ? `
              <div class="learn-cross-refs">
                ${term.crossRefs.map(ref => `<span class="cross-ref tag">${escapeHtml(ref)}</span>`).join('')}
              </div>` : ''}
          </article>
        `).join('')}
      </div>
    `;
  }

  function renderTechniques() {
    const container = document.getElementById('learn-techniques');
    if (!container || typeof Knowledge === 'undefined') return;
    const lang = I18n.getLang();
    const techniques = Knowledge.techniques;

    container.innerHTML = `
      <div class="learn-panel-header">
        <h2 class="view-title">${t('learn.techniquesTitle')}</h2>
        <p class="view-subtitle">${t('learn.techniquesSubtitle')}</p>
      </div>
      <div class="learn-grid">
        ${techniques.map(tech => `
          <article class="learn-card learn-card-technique ${tech.crossLinkOnly ? 'learn-card-linked' : ''}" data-id="${tech.id}">
            <div class="learn-card-header">
              <span class="learn-term-name">${escapeHtml(tech.name[lang] || tech.name.es)}</span>
              ${tech.crossLinkOnly ? `<span class="badge badge-info">${t('learn.linkedLabel')}</span>` : `<span class="badge badge-success">${t('learn.newLabel')}</span>`}
            </div>
            <p class="learn-term-def">${escapeHtml(tech.what[lang] || tech.what.es)}</p>
            ${tech.when ? `<p class="learn-meta"><strong>${t('learn.whenLabel')}:</strong> ${escapeHtml(tech.when[lang] || tech.when.es)}</p>` : ''}
            ${tech.example ? `
              <div class="learn-example-block">
                <div class="learn-example-code"><pre>${escapeHtml(tech.example[lang] || tech.example.es)}</pre></div>
                <button class="btn btn-secondary btn-sm learn-analyze-btn" data-prompt-id="${tech.id}">${t('learn.analyzeExample')}</button>
              </div>` : ''}
            ${tech.crossRefs && tech.crossRefs.length ? `
              <div class="learn-cross-refs">
                ${tech.crossRefs.map(ref => `<span class="cross-ref tag">${escapeHtml(ref)}</span>`).join('')}
              </div>` : ''}
          </article>
        `).join('')}
      </div>
    `;
    bindAnalyzeButtons(container, Knowledge.techniques);
  }

  function renderFrameworks() {
    const container = document.getElementById('learn-frameworks');
    if (!container || typeof Knowledge === 'undefined') return;
    const lang = I18n.getLang();
    const frameworks = Knowledge.frameworks;

    container.innerHTML = `
      <div class="learn-panel-header">
        <h2 class="view-title">${t('learn.frameworksTitle')}</h2>
        <p class="view-subtitle">${t('learn.frameworksSubtitle')}</p>
      </div>
      <div class="learn-grid">
        ${frameworks.map(fw => `
          <article class="learn-card learn-card-framework" data-id="${fw.id}">
            <div class="learn-card-header">
              <span class="learn-term-name">${escapeHtml(fw.name[lang] || fw.name.es)}</span>
              ${fw.acronym ? `<span class="learn-term-tag tag">${escapeHtml(fw.acronym)}</span>` : ''}
            </div>
            <p class="learn-term-def">${escapeHtml(fw.def[lang] || fw.def.es)}</p>
            ${fw.structure ? `
              <div class="learn-example-block">
                <div class="learn-example-code"><pre>${escapeHtml(fw.structure[lang] || fw.structure.es)}</pre></div>
                ${fw.example ? `<button class="btn btn-secondary btn-sm learn-analyze-btn" data-prompt-id="${fw.id}">${t('learn.analyzeExample')}</button>` : ''}
              </div>` : ''}
            ${fw.crossRefs && fw.crossRefs.length ? `
              <div class="learn-cross-refs">
                ${fw.crossRefs.map(ref => `<span class="cross-ref tag">${escapeHtml(ref)}</span>`).join('')}
              </div>` : ''}
          </article>
        `).join('')}
      </div>
    `;
    bindFrameworkAnalyzeButtons(container);
  }

  // Hardcoded list of adversarial test IDs + categories (Adversarial module builds
  // tests dynamically in runTests(), so there is no static array to iterate).
  // Source of truth: js/adversarial.js runTests() rawTests order + _test* helpers.
  const ADVERSARIAL_TEST_IDS = [
    'emptyInput', 'injection', 'jailbreakRoleplay', 'indirectInjection',
    'dataExfiltration', 'ambiguity', 'overflow', 'languageMismatch',
    'scopeCreep', 'hallucination', 'formatBreaking', 'multiTurn', 'edgeCases',
  ];

  function renderLibrary() {
    const container = document.getElementById('learn-library');
    if (!container) return;

    // Unified navigation over EXISTING content: templates, anti-patterns, adversarial.
    const templates = (typeof Templates !== 'undefined') ? Templates.templates : [];
    const apData = (typeof Patterns !== 'undefined') ? (Patterns.antiPatterns || []) : [];
    const bpData = (typeof Patterns !== 'undefined') ? (Patterns.bestPractices || []) : [];

    container.innerHTML = `
      <div class="learn-panel-header">
        <h2 class="view-title">${t('learn.libraryTitle')}</h2>
        <p class="view-subtitle">${t('learn.librarySubtitle')}</p>
      </div>

      <section class="learn-library-section">
        <h3 class="section-title">${t('learn.libTemplates')} <span class="count-badge">${templates.length}</span></h3>
        <div class="learn-grid">
          ${templates.map(tpl => `
            <article class="learn-card learn-card-template" data-id="${tpl.id}">
              <div class="learn-card-header">
                <span class="learn-term-name">${escapeHtml(Templates.getName(tpl))}</span>
                <span class="badge badge-info">${escapeHtml(Templates.getCategoryLabel(tpl.category))}</span>
              </div>
              <p class="learn-term-def">${escapeHtml(Templates.getDescription(tpl))}</p>
              <button class="btn btn-secondary btn-sm learn-template-btn" data-template-id="${tpl.id}">${t('learn.useTemplate')}</button>
            </article>
          `).join('')}
        </div>
      </section>

      <section class="learn-library-section">
        <h3 class="section-title">${t('learn.libAntipatterns')} <span class="count-badge">${apData.length}</span></h3>
        <div class="learn-list">
          ${apData.map(ap => {
            const dimLabel = t('dimensions.' + ap.dimension) || ap.dimension;
            const desc = I18n.t('patterns.' + ap.id + '.desc');
            const sugg = I18n.t('patterns.' + ap.id + '.sugg');
            return `
            <details class="learn-list-item learn-expandable" data-id="${ap.id}">
              <summary class="learn-expandable-summary">
                <span class="learn-list-id">${escapeHtml(ap.id)}</span>
                <span class="learn-list-name">${escapeHtml(I18n.t('patterns.' + ap.id + '.name'))}</span>
                <span class="badge badge-${ap.severity || 'low'}">${t('learn.sev_' + (ap.severity || 'low'))}</span>
                <svg class="learn-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div class="learn-expandable-body">
                <p class="learn-detail-row"><span class="learn-detail-label">${t('learn.detailDimension')}</span><span class="learn-detail-value">${escapeHtml(dimLabel)}</span></p>
                <p class="learn-detail-desc">${escapeHtml(desc)}</p>
                ${sugg && sugg !== ('patterns.' + ap.id + '.sugg') ? `<p class="learn-detail-row"><span class="learn-detail-label">${t('learn.detailSuggestion')}</span></p><p class="learn-detail-sugg">${escapeHtml(sugg)}</p>` : ''}
              </div>
            </details>`;
          }).join('')}
        </div>
      </section>

      <section class="learn-library-section">
        <h3 class="section-title">${t('learn.libBestPractices')} <span class="count-badge">${bpData.length}</span></h3>
        <div class="learn-list">
          ${bpData.map(bp => {
            const dimLabel = t('dimensions.' + bp.dimension) || bp.dimension;
            const desc = I18n.t('patterns.' + bp.id + '.desc');
            return `
            <details class="learn-list-item learn-expandable" data-id="${bp.id}">
              <summary class="learn-expandable-summary">
                <span class="learn-list-id">${escapeHtml(bp.id)}</span>
                <span class="learn-list-name">${escapeHtml(I18n.t('patterns.' + bp.id + '.name'))}</span>
                <svg class="learn-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div class="learn-expandable-body">
                <p class="learn-detail-row"><span class="learn-detail-label">${t('learn.detailDimension')}</span><span class="learn-detail-value">${escapeHtml(dimLabel)}</span></p>
                <p class="learn-detail-desc">${escapeHtml(desc)}</p>
              </div>
            </details>`;
          }).join('')}
        </div>
      </section>

      <section class="learn-library-section">
        <h3 class="section-title">${t('learn.libAdversarial')} <span class="count-badge">${ADVERSARIAL_TEST_IDS.length}</span></h3>
        <div class="learn-list">
          ${ADVERSARIAL_TEST_IDS.map(id => {
            const name = I18n.t('adv.' + id + '.name');
            const detail = I18n.t('adv.' + id + '.detail');
            const suggestion = I18n.t('adv.' + id + '.suggestion');
            const category = I18n.t('adv.' + id + '.category');
            const catLabel = category && category !== ('adv.' + id + '.category')
              ? I18n.t('adversarialCategory.' + category)
              : '';
            return `
            <details class="learn-list-item learn-expandable" data-id="${id}">
              <summary class="learn-expandable-summary">
                <span class="learn-list-id">${escapeHtml(id)}</span>
                <span class="learn-list-name">${escapeHtml(name)}</span>
                ${catLabel ? `<span class="badge badge-info">${escapeHtml(catLabel)}</span>` : ''}
                <svg class="learn-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="6 9 12 15 18 9"/></svg>
              </summary>
              <div class="learn-expandable-body">
                ${detail && detail !== ('adv.' + id + '.detail') ? `<p class="learn-detail-desc">${escapeHtml(detail)}</p>` : ''}
                ${suggestion && suggestion !== ('adv.' + id + '.suggestion') ? `<p class="learn-detail-row"><span class="learn-detail-label">${t('learn.detailSuggestion')}</span></p><p class="learn-detail-sugg">${escapeHtml(suggestion)}</p>` : ''}
              </div>
            </details>`;
          }).join('')}
        </div>
      </section>
    `;

    // Bind template "use" buttons (clone of templates view pattern)
    container.querySelectorAll('.learn-template-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.templateId;
        const tpl = Templates.getById(id);
        if (tpl) {
          loadPrompt(tpl.prompt);
          showToast(t('toast.templateLoaded', { name: Templates.getName(tpl) }), 'success');
        }
      });
    });
  }

  // Bind "Analyze example" buttons for techniques (data-prompt-id references Knowledge.techniques)
  function bindAnalyzeButtons(container, collection) {
    container.querySelectorAll('.learn-analyze-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.promptId;
        const item = collection.find(x => x.id === id);
        if (item && item.example) {
          const lang = I18n.getLang();
          const promptText = item.example[lang] || item.example.es;
          loadPrompt(promptText);
          showToast(t('learn.exampleLoaded'), 'success');
        }
      });
    });
  }

  // Bind "Analyze example" buttons for frameworks (Knowledge.frameworks has .example)
  function bindFrameworkAnalyzeButtons(container) {
    container.querySelectorAll('.learn-analyze-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.dataset.promptId;
        const item = Knowledge.frameworks.find(x => x.id === id);
        if (item && item.example) {
          const lang = I18n.getLang();
          const promptText = item.example[lang] || item.example.es;
          loadPrompt(promptText);
          showToast(t('learn.exampleLoaded'), 'success');
        }
      });
    });
  }

  // ── Leaderboard (Top 10 Hall of Fame) ───────────────────
  function setupLeaderboardView() {
    const btnOpenModal = document.getElementById('btn-open-submit-modal');
    const btnCloseModal = document.getElementById('btn-close-submit-modal');
    const btnCancelModal = document.getElementById('btn-cancel-submit-modal');
    const btnConfirmSubmit = document.getElementById('btn-confirm-submit');
    const btnSubmitHero = document.getElementById('btn-submit-to-leaderboard');

    if (btnOpenModal) btnOpenModal.addEventListener('click', openLeaderboardSubmitModal);
    if (btnSubmitHero) btnSubmitHero.addEventListener('click', openLeaderboardSubmitModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeLeaderboardSubmitModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeLeaderboardSubmitModal);
    if (btnConfirmSubmit) btnConfirmSubmit.addEventListener('click', submitPromptToLeaderboard);
  }

  function openLeaderboardSubmitModal() {
    if (!currentAnalysis || !currentAnalysis.prompt) {
      showToast(t('leaderboard.noPromptToSubmit'), 'warning');
      return;
    }

    const modal = document.getElementById('modal-submit-leaderboard');
    const scorePreview = document.getElementById('modal-score-preview');
    if (scorePreview) {
      scorePreview.innerHTML = `
        <span><strong>${escapeHtml(t('score.label'))}:</strong> ${currentAnalysis.analysis.overallScore}/100</span>
        <span class="badge badge-info">${escapeHtml(t(`complexity.${currentAnalysis.analysis.complexity}`))}</span>
      `;
    }
    if (modal) modal.classList.remove('hidden');
  }

  function closeLeaderboardSubmitModal() {
    const modal = document.getElementById('modal-submit-leaderboard');
    if (modal) modal.classList.add('hidden');
  }

  function submitPromptToLeaderboard() {
    if (!currentAnalysis || !currentAnalysis.prompt) return;

    const titleInput = document.getElementById('submit-prompt-title');
    const authorInput = document.getElementById('submit-prompt-author');

    const title = titleInput ? titleInput.value.trim() : '';
    const author = authorInput ? authorInput.value.trim() : '';

    const res = Leaderboard.submit(title, author, currentAnalysis.prompt, currentAnalysis.analysis);

    closeLeaderboardSubmitModal();

    if (res.success) {
      if (res.isRanked) {
        showToast(t('leaderboard.submittedSuccess', { rank: res.rank }), 'success');
      } else {
        const minScore = res.top10[res.top10.length - 1].overallScore;
        showToast(t('leaderboard.submittedNotRanked', { score: currentAnalysis.analysis.overallScore, minScore }), 'info');
      }
      switchView('leaderboard');
    }
  }

  async function renderLeaderboardView() {
    const container = document.getElementById('leaderboard-grid');
    if (!container || typeof Leaderboard === 'undefined') return;

    const lang = I18n.getLang();
    const top10 = await Leaderboard.fetchGlobalTop10();

    const rankMedals = { 1: '🥇', 2: '🥈', 3: '🥉' };

    container.innerHTML = top10.map((item, index) => {
      const rank = index + 1;
      const medal = rankMedals[rank] ? ` ${rankMedals[rank]}` : '';
      const titleText = (typeof item.title === 'object') ? (item.title[lang] || item.title.es) : item.title;
      const rankClass = rank <= 3 ? `rank-${rank}` : '';

      return `
        <article class="leaderboard-card" data-id="${item.id}">
          <div class="leaderboard-rank ${rankClass}">#${rank}${medal}</div>
          <div class="leaderboard-content-block">
            <div class="leaderboard-card-header">
              <span class="learn-term-name">${escapeHtml(titleText)}</span>
              <span class="badge badge-success" style="font-size:0.85rem;font-weight:700">${item.overallScore}/100 (${item.grade})</span>
            </div>
            <p class="learn-meta">
              <strong>${t('leaderboard.labelAuthor').split(' ')[0]}:</strong> ${escapeHtml(item.author || 'Anónimo')} · 
              <span class="tag">${escapeHtml(item.category)}</span> · 
              <span>${escapeHtml(item.date)}</span>
            </p>
            <div class="leaderboard-prompt-preview"><code>${escapeHtml(item.prompt)}</code></div>
            <div class="leaderboard-actions">
              <button class="btn btn-secondary btn-sm load-leaderboard-btn" data-prompt-id="${item.id}">${t('leaderboard.tryPrompt')}</button>
              <button class="btn btn-secondary btn-sm copy-leaderboard-btn" data-prompt-id="${item.id}">${t('leaderboard.copyPrompt')}</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    // Bind action buttons
    container.querySelectorAll('.load-leaderboard-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.promptId;
        const item = top10.find(x => x.id === id);
        if (item) {
          loadPrompt(item.prompt);
          showToast(t('learn.exampleLoaded'), 'success');
        }
      });
    });

    container.querySelectorAll('.copy-leaderboard-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.promptId;
        const item = top10.find(x => x.id === id);
        if (item) {
          try {
            await navigator.clipboard.writeText(item.prompt);
            showToast(t('toast.copied'), 'success');
          } catch {
            showToast(t('toast.copyError'), 'error');
          }
        }
      });
    });
  }

  // ── Public API ─────────────────────────────────────────
  // loadPrompt(text): fill the editor with a prompt and jump to the analyzer.
  // Used by the Learn hub "Analyze this example" buttons (and reusable by any
  // module that needs to seed the editor from outside the IIFE).
  function loadPrompt(text) {
    const input = document.getElementById('prompt-input');
    if (!input) return;
    input.value = text;
    updateEditorStats();
    switchView('analyzer');
  }

  return { init, showToast, switchView, loadPrompt };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
