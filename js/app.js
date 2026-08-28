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
    setupThemeSwitcher();
    setupNavigation();
    setupEditor();
    setupTabs();
    setupDimensionAccordion();
    setupExport();
    setupScoreLegend();
    setupTemplatesView();
    setupHistoryView();
    setupLearnView();
    setupRadarView();
    setupModelsView();
    setupLeaderboardView();
    setupTickerControls();
    renderNewsTicker();
    // Live AI news: fetch on load, then refresh every 5 minutes (and when the
    // tab regains focus after being away for a while).
    refreshAiNews();
    setInterval(refreshAiNews, 5 * 60 * 1000);
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) refreshAiNews();
    });
    checkShareURL();
    updateEditorStats();

    if (typeof Constellation3D !== 'undefined') {
      Constellation3D.init('constellation-3d-canvas');
      Constellation3D.onPlanetClick(key => navigateToDimensionDetail(key));
    }

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
    renderNewsTicker();
    // Charts bake their labels at build time, so destroy them so the next
    // render rebuilds them in the new language.
    if (typeof Charts !== 'undefined') Charts.destroy();
    // Re-render the active view so dynamic strings pick up the new language.
    if (currentView === 'templates') renderTemplatesView(getActiveCategoryFilter());
    if (currentView === 'history') renderHistoryView();
    if (currentView === 'learn') renderLearnView(getActiveLearnSub());
    if (currentView === 'models') renderModelsView();
    if (currentView === 'radar') renderRadarView(getActiveRadarSub());
    if (currentView === 'leaderboard') renderLeaderboardView();
    // Analyzer results (dimension cards, eval cards, improved prompt…) are
    // JS-rendered too: re-render them so they follow the language switch.
    if (currentView === 'analyzer' && currentAnalysis) renderResults();
  }

  

  // 📡 Live News Ticker Controls & Modal Feed 📡
  let isTickerPaused = false;
  let activeTickerFeedCategory = 'all';
  let tickerModalSearchQuery = '';
  let tickerStepIndex = 0;

  function setupTickerControls() {
    const toggleBtn = document.getElementById('ticker-toggle-btn');
    const prevBtn = document.getElementById('ticker-prev-btn');
    const nextBtn = document.getElementById('ticker-next-btn');
    const viewAllBtn = document.getElementById('ticker-view-all-btn');
    const track = document.getElementById('news-ticker-track');

    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        isTickerPaused = !isTickerPaused;
        if (track) {
          if (isTickerPaused) {
            track.classList.add('paused');
          } else {
            track.classList.remove('paused');
            track.style.animation = '';
            track.style.transform = '';
          }
        }
        toggleBtn.textContent = isTickerPaused ? '▶' : '⏸';
        toggleBtn.setAttribute('title', isTickerPaused ? t('radar.tickerPlay') : t('radar.tickerPause'));
        toggleBtn.setAttribute('aria-label', isTickerPaused ? t('radar.tickerPlay') : t('radar.tickerPause'));
      });
    }

    const stepTicker = (dir) => {
      if (!track || typeof Knowledge === 'undefined') return;
      const items = track.querySelectorAll('.ticker-item');
      if (!items || items.length === 0) return;

      isTickerPaused = true;
      track.classList.add('paused');
      track.style.animation = 'none'; // Disable keyframes so transform takes effect
      track.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)';

      if (toggleBtn) {
        toggleBtn.textContent = '▶';
        toggleBtn.setAttribute('title', t('radar.tickerPlay'));
      }

      const totalItems = getTickerFeed().length;
      if (dir === 'next') {
        tickerStepIndex = (tickerStepIndex + 1) % totalItems;
      } else {
        tickerStepIndex = (tickerStepIndex - 1 + totalItems) % totalItems;
      }

      const targetEl = items[tickerStepIndex];
      if (targetEl) {
        const targetOffset = targetEl.offsetLeft;
        track.style.transform = `translateX(-${targetOffset}px)`;
      }
    };

    if (prevBtn) {
      prevBtn.addEventListener('click', () => stepTicker('prev'));
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => stepTicker('next'));
    }

    if (viewAllBtn) {
      viewAllBtn.addEventListener('click', openTickerFeedModal);
    }

    // Tapping on ticker badge / label opens the full feed modal
    const tickerBadgeBtn = document.getElementById('news-ticker-badge-btn') || document.querySelector('.news-ticker-label');
    if (tickerBadgeBtn) {
      tickerBadgeBtn.addEventListener('click', openTickerFeedModal);
      tickerBadgeBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openTickerFeedModal();
        }
      });
    }

    // On mobile screens or general ticker tap, open the radar modal
    const tickerViewport = document.getElementById('news-ticker-viewport');
    if (tickerViewport) {
      tickerViewport.addEventListener('click', (e) => {
        if (window.innerWidth <= 640) {
          e.preventDefault();
          e.stopPropagation();
          openTickerFeedModal();
        } else if (!e.target.closest('a')) {
          openTickerFeedModal();
        }
      }, true);
    }

    const closeFeedBtn = document.getElementById('btn-close-ticker-modal');
    if (closeFeedBtn) {
      closeFeedBtn.addEventListener('click', closeTickerFeedModal);
    }

    const modalSearchInput = document.getElementById('ticker-feed-search-input');
    if (modalSearchInput) {
      modalSearchInput.addEventListener('input', (e) => {
        tickerModalSearchQuery = e.target.value;
        renderTickerFeedModalContent();
      });
    }
  }

  function openTickerFeedModal() {
    const modal = document.getElementById('modal-ticker-feed');
    if (!modal) return;
    modal.classList.remove('hidden');
    setupModalA11y(modal, closeTickerFeedModal);
    renderTickerFeedModalContent();
  }

  function closeTickerFeedModal() {
    const modal = document.getElementById('modal-ticker-feed');
    if (modal) modal.classList.add('hidden');
  }

  function renderTickerFeedModalContent() {
    const filterBar = document.getElementById('ticker-feed-filter-bar');
    const feedList = document.getElementById('ticker-feed-list');
    if (!feedList || typeof Knowledge === 'undefined') return;
    const lang = I18n.getLang();
    const feed = getTickerFeed();

    const tabs = [
      { id: 'all', labelKey: 'radar.tabAll' },
      { id: 'models', labelKey: 'radar.tabModels' },
      { id: 'agents', labelKey: 'radar.tabAgents' },
      { id: 'evals', labelKey: 'radar.tabEvals' }
    ];

    if (filterBar) {
      filterBar.innerHTML = tabs.map(tab => `
        <button class="editorial-tab-btn ${activeTickerFeedCategory === tab.id ? 'active' : ''}" data-tab="${tab.id}">
          ${t(tab.labelKey)}
        </button>
      `).join('');

      filterBar.onclick = (e) => {
        const btn = e.target.closest('.editorial-tab-btn');
        if (!btn) return;
        activeTickerFeedCategory = btn.dataset.tab;
        renderTickerFeedModalContent();
      };
    }

    const query = tickerModalSearchQuery.toLowerCase().trim();
    const filtered = feed.filter(item => {
      const tagLower = (item.tag || '').toLowerCase();
      const textLower = (item.text[lang] || item.text.es || '').toLowerCase();
      const authorLower = (item.author || '').toLowerCase();

      let matchCat = true;
      if (activeTickerFeedCategory === 'models') {
        matchCat = /sonnet|o3|r1|flash|llama|qwen|mistral|grok|moe|model|weights|inference|claude|deepseek|openai|gemini|meta|reason/i.test(tagLower + ' ' + textLower);
      } else if (activeTickerFeedCategory === 'agents') {
        matchCat = /langgraph|agent|voyager|code|mlx|compound|tool|software|workflow|engineering/i.test(tagLower + ' ' + textLower);
      } else if (activeTickerFeedCategory === 'evals') {
        matchCat = /eval|benchmark|helm|seal|safety|security|mmlu|inyeccion|caching|injection|red team|guardrail/i.test(tagLower + ' ' + textLower);
      }

      const matchQuery = !query || textLower.includes(query) || authorLower.includes(query) || tagLower.includes(query);
      return matchCat && matchQuery;
    });

    if (filtered.length === 0) {
      feedList.innerHTML = `
        <div class="editorial-empty-state">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
          <p>${t('radar.noResults')}</p>
        </div>
      `;
      return;
    }

    feedList.innerHTML = filtered.map(item => {
      const initial = (item.author || 'AI').replace(/^@/, '').charAt(0).toUpperCase();
      return `
        <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="editorial-feed-card">
          <div class="editorial-card-header">
            <div class="editorial-author-pill">
              <span class="editorial-author-avatar">${initial}</span>
              <span class="editorial-author-name">${escapeHtml(item.author)}</span>
            </div>
            <div class="editorial-card-badges">
              <span class="editorial-tag-badge">${escapeHtml(item.tag)}</span>
              <span class="editorial-time-badge">${escapeHtml(item.timestamp)}</span>
            </div>
          </div>
          <div class="editorial-card-body">
            <p class="editorial-card-text">${escapeHtml(item.text[lang] || item.text.es)}</p>
          </div>
          <div class="editorial-card-footer">
            <span class="editorial-read-link">
              <span>${t('radar.readSource')}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
            </span>
          </div>
        </a>
      `;
    }).join('');
  }

  // ── Live AI News (from /api/ai-news — Hacker News) ──────
  let liveAiNews = [];

  function getTickerFeed() {
    const curated = (typeof Knowledge !== 'undefined' && Knowledge.feed) ? Knowledge.feed : [];
    return liveAiNews.length ? [...liveAiNews, ...curated] : curated;
  }

  function _timeAgo(ms, lang) {
    const diffMin = Math.max(1, Math.round((Date.now() - ms) / 60000));
    if (diffMin < 60) return lang === 'es' ? `hace ${diffMin}m` : `${diffMin}m ago`;
    const diffH = Math.round(diffMin / 60);
    if (diffH < 24) return lang === 'es' ? `hace ${diffH}h` : `${diffH}h ago`;
    const diffD = Math.round(diffH / 24);
    return lang === 'es' ? `hace ${diffD}d` : `${diffD}d ago`;
  }

  async function refreshAiNews() {
    try {
      const res = await fetch(API_CONFIG.getUrl('/api/ai-news'));
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !Array.isArray(data.items)) return;

      const lang = I18n.getLang();
      liveAiNews = data.items
        .filter(it => it.title && it.url)
        .map(it => ({
          id: it.id,
          author: '@' + (it.author || 'hn'),
          tag: 'HN · ' + (it.points || 0) + ' pts',
          text: { es: it.title, en: it.title },
          url: it.url,
          timestamp: it.publishedAt ? _timeAgo(it.publishedAt, lang) : '',
        }));

      // Re-render so the fresh items show up immediately.
      renderNewsTicker();
      const modal = document.getElementById('modal-ticker-feed');
      if (modal && !modal.classList.contains('hidden')) renderTickerFeedModalContent();
    } catch (e) {
      // Network/offline: keep the curated static feed.
    }
  }

  function renderNewsTicker() {
    const track = document.getElementById('news-ticker-track');
    if (!track || typeof Knowledge === 'undefined') return;
    const lang = I18n.getLang();
    const feed = getTickerFeed();

    // Duplicate feed list to create seamless infinite loop animation
    const fullFeed = [...feed, ...feed];

    // Smooth, gentle reading speed (~6.5s per item for effortless legibility)
    const durationSec = Math.max(140, Math.round(feed.length * 6.5));
    track.style.animationDuration = `${durationSec}s`;

    track.innerHTML = fullFeed.map(item => `
      <a href="${escapeHtml(item.url)}" target="_blank" rel="noopener noreferrer" class="ticker-item">
        <span class="ticker-author">${escapeHtml(item.author)}</span>
        <span class="ticker-tag">${escapeHtml(item.tag)}</span>
        <span class="ticker-text">${escapeHtml(item.text[lang] || item.text.es)}</span>
        <span class="ticker-time">(${escapeHtml(item.timestamp)})</span>
      </a>
    `).join('');
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

  // ── Theme Switcher ──────────────────────────────────────
  function setupThemeSwitcher() {
    const btn = document.getElementById('theme-toggle-btn');
    if (!btn) return;

    const savedTheme = localStorage.getItem('promptometer_theme') || 'cosmic';
    if (savedTheme === 'editorial') {
      document.body.classList.add('theme-editorial');
    } else {
      document.body.classList.remove('theme-editorial');
    }
    updateThemeBtnUI();

    btn.addEventListener('click', () => {
      const isEditorial = document.body.classList.toggle('theme-editorial');
      const newTheme = isEditorial ? 'editorial' : 'cosmic';
      localStorage.setItem('promptometer_theme', newTheme);
      updateThemeBtnUI();

      if (typeof Charts !== 'undefined') {
        Charts.destroy();
        if (currentAnalysis) {
          Charts.initRadar('radar-canvas');
          renderRadar(currentAnalysis.analysis.dimensions);
        }
      }

      if (currentAnalysis) {
        renderOrbitalConstellationSVG(currentAnalysis.analysis.dimensions, currentAnalysis.analysis.overallScore);
        if (typeof Constellation3D !== 'undefined' && Constellation3D.isInitialized()) {
          Constellation3D.update(currentAnalysis.analysis, isEditorial ? 'luna' : 'blackhole');
        }
      }
    });
  }

  function updateThemeBtnUI() {
    const icon = document.getElementById('theme-icon');
    const label = document.getElementById('theme-label');
    const isEditorial = document.body.classList.contains('theme-editorial');
    if (isEditorial) {
      if (icon) icon.textContent = '🌙';
      if (label) {
        label.setAttribute('data-i18n', 'nav.themeEditorial');
        label.textContent = t('nav.themeEditorial');
      }
    } else {
      if (icon) icon.textContent = '🕳️';
      if (label) {
        label.setAttribute('data-i18n', 'nav.themeCosmic');
        label.textContent = t('nav.themeCosmic');
      }
    }
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
    document.querySelectorAll('.nav-btn').forEach(b => {
      const isActive = b.dataset.view === viewName;
      b.classList.toggle('active', isActive);
      if (isActive) b.setAttribute('aria-current', 'page');
      else b.removeAttribute('aria-current');
    });
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    document.getElementById(`view-${viewName}`).classList.add('active');

    if (viewName === 'history') renderHistoryView();
    if (viewName === 'templates') renderTemplatesView(getActiveCategoryFilter());
    if (viewName === 'learn') renderLearnView(getActiveLearnSub());
    if (viewName === 'models') renderModelsView();
    if (viewName === 'radar') renderRadarView(getActiveRadarSub());
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

    if (btnClear) {
      btnClear.addEventListener('click', () => {
        textarea.value = '';
        updateEditorStats();
        showEmptyState();
      });
    }

    if (btnPaste) {
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

    const btnDeepAi = document.getElementById('btn-deep-domain-ai');
    if (btnDeepAi) {
      btnDeepAi.addEventListener('click', async () => {
        const promptInput = document.getElementById('prompt-input');
        const prompt = promptInput ? promptInput.value.trim() : '';
        if (!prompt) return;

        const btnText = document.getElementById('btn-deep-domain-ai-text');
        btnDeepAi.disabled = true;
        if (btnText) btnText.textContent = t('contextGaps.deepAiLoading');

        try {
          const res = await fetch(API_CONFIG.getUrl('/api/analyze-intent'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt,
              objective: currentAnalysis?.objective || document.getElementById('prompt-objective-select')?.value || 'general',
              analysis: currentAnalysis?.analysis || currentAnalysis
            })
          });

          let result;
          if (res.ok) {
            result = await res.json();
          } else {
            const arch = currentAnalysis?.analysis?.domainArchetype || 'general_task';
            const gaps = currentAnalysis?.analysis?.contextGaps || [];
            result = Rewriter.deepDomainOptimize(prompt, arch, gaps);
          }

          if (result && result.improvedPrompt) {
            promptInput.value = result.improvedPrompt;
            updateEditorStats();
            runAnalysis();

            const justBanner = document.getElementById('domain-justification-banner');
            const justText = document.getElementById('domain-justification-text');
            if (justBanner && justText && result.justification) {
              justText.textContent = result.justification;
              justBanner.classList.remove('hidden');
            }

            const toastMsg = result.justification ? `✨ ${result.justification}` : t('contextGaps.deepAiSuccess');
            showToast(toastMsg, 'success', 6000);
          }
        } catch (e) {
          const arch = currentAnalysis?.analysis?.domainArchetype || 'general_task';
          const gaps = currentAnalysis?.analysis?.contextGaps || [];
          const result = Rewriter.deepDomainOptimize(prompt, arch, gaps);
          if (result && result.improvedPrompt) {
            promptInput.value = result.improvedPrompt;
            updateEditorStats();
            runAnalysis();
            showToast(t('contextGaps.deepAiSuccess'), 'success');
          }
        } finally {
          btnDeepAi.disabled = false;
          if (btnText) btnText.textContent = t('contextGaps.deepAiBtn');
        }
      });
    }
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

    const objective = document.getElementById('prompt-objective-select')?.value || 'general';

    // Show loading state
    const btn = document.getElementById('btn-analyze');
    btn.disabled = true;
    btn.innerHTML = `<svg class="spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> ${escapeHtml(t('editor.analyzing'))}`;

    // Small delay for UX feel
    setTimeout(() => {
      try {
        // 1. Core analysis
        const analysis = Analyzer.analyze(prompt, { objective });

        // 2. Adversarial tests
        const adversarial = Adversarial.runTests(prompt);

        // 3. Generate improved version
        const improved = Rewriter.improve(prompt, analysis, { objective });

        // 4. Store results
        currentAnalysis = { prompt, objective, analysis, adversarial, improved, timestamp: Date.now() };

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

    const { analysis, adversarial, improved, objective } = currentAnalysis;

    // Objective Pill Tag
    const objPill = document.getElementById('calibrated-objective-pill');
    if (objPill) {
      const objKey = objective || 'general';
      const objText = t(`objectives.${objKey}`) || objKey;
      // Extract short name e.g. "General", "Código", "Análisis"
      const shortName = objText.replace(/^[\p{Emoji}\s]+/u, '');
      objPill.textContent = t('workbench.goalPill', { name: shortName });
    }

    // Dual-card score badges
    const unoptBadge = document.getElementById('unoptimized-score-badge');
    if (unoptBadge) {
      unoptBadge.innerHTML = `${analysis.overallScore}<span>/100</span>`;
      unoptBadge.className = `card-score-badge ${analysis.overallScore >= 70 ? 'badge-emerald' : 'badge-red'}`;
    }
    const calibBadge = document.getElementById('calibrated-score-badge');
    if (calibBadge && improved) {
      const newScore = Math.min(99, analysis.overallScore + (improved.scoreImprovement || 25));
      calibBadge.innerHTML = `${newScore}<span>/100</span>`;
      calibBadge.className = 'card-score-badge badge-emerald';
    }

    // Animate score
    animateScore(analysis.overallScore, analysis.grade);

    // Scroll to the 3D constellation so the user watches the protoplanetary →
    // solar system transition unfold. The Constellation3D.update() call (which
    // triggers the transition) is deferred ~600ms so the smooth-scroll finishes
    // first and the user has their eyes on the stage when it ignites.
    const constellationSection = document.getElementById('orbital-constellation-section');
    if (constellationSection) {
      constellationSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    setTimeout(() => {
      if (typeof Constellation3D !== 'undefined' && Constellation3D.isInitialized()) {
        const theme = document.body.classList.contains('theme-editorial') ? 'luna' : 'blackhole';
        Constellation3D.update(analysis, theme);
      }
    }, 600);

    // Dimensions
    renderDimensions(analysis.dimensions);

    // Anti-patterns
    renderAntiPatterns(analysis.antiPatterns, analysis.strengths);

    // Adversarial
    renderAdversarial(adversarial);

    // Improved prompt
    renderImproved(improved);

    // Domain Intelligence & Context Gaps
    renderDomainIntelligence(analysis);

    // Radar chart is initialised lazily when the user visits the Radar tab.
    if (document.getElementById('tab-radar').classList.contains('active')) {
      if (!Charts.radarChart) Charts.initRadar('radar-canvas');
      renderRadar(analysis.dimensions);
    }

    // Keep the currently active results tab active.
  }

  function escapeAttr(str) {
    return String(str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function renderDomainIntelligence(analysis) {
    const panel = document.getElementById('domain-intelligence-panel');
    const badge = document.getElementById('domain-archetype-badge');
    const card = document.getElementById('domain-context-gaps-card');
    const gapsList = document.getElementById('domain-gaps-list');
    const chipsContainer = document.getElementById('domain-action-chips');

    if (!panel || !badge) return;

    const archetypeKey = analysis.domainArchetype || 'general_task';
    const translatedArchetype = t(`domain.${archetypeKey}`) || t(`domain.archetypes.${archetypeKey}`) || archetypeKey;
    badge.textContent = translatedArchetype;
    panel.classList.remove('hidden');

    const gaps = analysis.contextGaps || [];
    if (gaps.length > 0 && card && gapsList && chipsContainer) {
      gapsList.innerHTML = gaps.map(g => `<div class="gap-item">⚠️ ${escapeHtml(t(g.key) || g.id)}</div>`).join('');
      chipsContainer.innerHTML = gaps.map(g => `<button class="action-chip action-chip--inject" data-snippet="${escapeAttr(g.snippetToInject)}">${escapeHtml(t(g.actionChipKey) || '+ Inyectar Contexto')}</button>`).join('');
      card.classList.remove('hidden');

      chipsContainer.querySelectorAll('.action-chip').forEach(chip => {
        chip.addEventListener('click', () => {
          const snippet = chip.dataset.snippet;
          const textarea = document.getElementById('prompt-input');
          if (textarea && snippet) {
            textarea.value = Rewriter.injectSnippet(textarea.value, snippet);
            updateEditorStats();
            runAnalysis();
          }
        });
      });
    } else if (card) {
      card.classList.add('hidden');
    }
  }

  function animateScore(targetScore, grade) {
    const numberEl = document.getElementById('score-number');
    const gradeEl = document.getElementById('score-grade');

    let current = 0;
    const duration = 1200;
    const start = performance.now();

    function update(time) {
      const elapsed = time - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      current = Math.round(eased * targetScore);

      if (numberEl) numberEl.textContent = current;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else if (gradeEl) {
        gradeEl.textContent = grade;
        gradeEl.className = `score-grade grade-${grade.replace('+', 'plus').replace('-', 'minus')}`;
      }
    }
    requestAnimationFrame(update);
  }

  function renderDimensions(dimensions) {
    const container = document.getElementById('dimensions-list');
    if (!container) return;
    const dimConfig = {
      clarity:        { icon: '🎯', name: t('dimensions.clarity'),        color: '#00e5ff' },
      specificity:    { icon: '📐', name: t('dimensions.specificity'),    color: '#7c3aed' },
      structure:      { icon: '🏗️', name: t('dimensions.structure'),      color: '#f59e0b' },
      robustness:     { icon: '🛡️', name: t('dimensions.robustness'),     color: '#10b981' },
      context:        { icon: '🧩', name: t('dimensions.context'),        color: '#ec4899' },
      outputFormat:   { icon: '📝', name: t('dimensions.outputFormat'),   color: '#38bdf8' },
      chainOfThought: { icon: '🔗', name: t('dimensions.chainOfThought'), color: '#f97316' },
      safety:         { icon: '⚠️', name: t('dimensions.safety'),         color: '#ef4444' },
    };

    container.innerHTML = '';

    for (const [key, dim] of Object.entries(dimensions)) {
      const config = dimConfig[key] || { icon: '🔍', name: key, color: '#00e5ff' };
      const card = document.createElement('div');
      card.className = 'dimension-card';
      card.dataset.dim = key;
      card.style.setProperty('--dim-color', config.color);

      const scoreClass = dim.score >= 70 ? 'good' : dim.score >= 40 ? 'warning' : 'bad';

      card.innerHTML = `
        <div class="dimension-header" role="button" tabindex="0" aria-expanded="false">
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

  // Dimension cards accordion: click / Enter / Space toggles + aria-expanded
  function setupDimensionAccordion() {
    const container = document.getElementById('dimensions-list');
    if (!container) return;

    const toggle = (header) => {
      const expanded = header.parentElement.classList.toggle('expanded');
      header.setAttribute('aria-expanded', String(expanded));
    };

    container.addEventListener('click', (e) => {
      const header = e.target.closest('.dimension-header');
      if (header) toggle(header);
    });
    container.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const header = e.target.closest('.dimension-header');
      if (!header) return;
      e.preventDefault();
      toggle(header);
    });
  }

  function renderRadar(dimensions) {
    if (!Charts.radarChart) return;
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

    // 1. Render Grand 8D Orbital Constellation Stage SVG
    if (currentAnalysis && currentAnalysis.analysis) {
      renderOrbitalConstellationSVG(currentAnalysis.analysis.dimensions, currentAnalysis.analysis.overallScore);
      renderEvaluationDimensionCards(currentAnalysis.analysis.dimensions);
    }

    // 2. Render Color-Coded XML Highlighted Prompt
    renderHighlightedPrompt(improved.improvedPrompt);

    // 3. Setup Action Chips & Copy Handlers
    setupActionChips(improved.improvedPrompt);

    const changesList = document.getElementById('changes-list');
    if (changesList && improved.changes) {
      const typeLabel = (type) => t(`changes.${type === 'added' ? 'added' : type === 'modified' ? 'modified' : 'restructured'}`);
      changesList.innerHTML = improved.changes.map(c => `
        <div class="change-item change-${c.type}">
          <span class="change-type">${escapeHtml(typeLabel(c.type))}</span>
          <span class="change-desc">${escapeHtml(c.description)}</span>
        </div>
      `).join('');
    }

    // Button handlers
    const btnApply = document.getElementById('btn-apply-improvement');
    if (btnApply) {
      btnApply.onclick = () => {
        document.getElementById('prompt-input').value = improved.improvedPrompt;
        updateEditorStats();
        switchView('analyzer');
        showToast(t('toast.improvementApplied'), 'success');
      };
    }

    const btnCopy = document.getElementById('btn-copy-improvement');
    if (btnCopy) {
      btnCopy.onclick = () => {
        ExportUtil.toClipboard(improved.improvedPrompt);
      };
    }
  }

  // ── Grand 8D Orbital Constellation SVG Stage Renderer ───────
  function renderOrbitalConstellationSVG(dimensions, overallScore) {
    const svg = document.getElementById('orbital-constellation-svg');
    if (!svg) return;

    const centerX = 400;
    const centerY = 225;
    const orbits = [110, 160, 200];

    const dimList = [
      { key: 'clarity',        label: 'Clarity',     color: '#00e5ff', angle: 270, orbitIdx: 1 },
      { key: 'role',           label: 'Role',        color: '#fbbf24', angle: 30,  orbitIdx: 1 },
      { key: 'outputFormat',   label: 'Output',      color: '#38bdf8', angle: 90,  orbitIdx: 1 },
      { key: 'constraints',    label: 'Constraints', color: '#a78bfa', angle: 150, orbitIdx: 1 },
      { key: 'context',        label: 'Context',     color: '#f472b6', angle: 210, orbitIdx: 1 },
      { key: 'chainOfThought', label: 'CoT',         color: '#f97316', angle: 330, orbitIdx: 2 },
      { key: 'safety',         label: 'Safety',      color: '#f87171', angle: 120, orbitIdx: 2 },
      { key: 'robustness',     label: 'Robustness',  color: '#34d399', angle: 240, orbitIdx: 2 },
    ];

    const isEditorial = document.body.classList.contains('theme-editorial');
    const labelColor = isEditorial ? '#1A1612' : '#F0F4F8';
    const orbitStroke = isEditorial ? 'rgba(26, 22, 18, 0.15)' : 'rgba(255, 255, 255, 0.08)';

    let orbitsHTML = '';
    orbits.forEach(r => {
      orbitsHTML += `<circle cx="${centerX}" cy="${centerY}" r="${r}" fill="none" stroke="${orbitStroke}" stroke-width="1.5" stroke-dasharray="4 6" />`;
    });

    let raysHTML = '';
    let nodesHTML = '';

    dimList.forEach(d => {
      const dimData = (dimensions && dimensions[d.key]) ? dimensions[d.key] : { score: 75 };
      const scoreVal = (dimData.score !== undefined) ? dimData.score : 75;
      const rad = (d.angle * Math.PI) / 180;
      const dist = orbits[d.orbitIdx - 1];
      const nx = centerX + dist * Math.cos(rad);
      const ny = centerY + dist * Math.sin(rad);

      // Ray from center score box to node
      raysHTML += `<line x1="${centerX}" y1="${centerY}" x2="${nx}" y2="${ny}" stroke="${d.color}" stroke-width="1.2" opacity="0.45" />`;

      // Diamond node
      const s = 14;
      const points = `${nx},${ny - s} ${nx + s},${ny} ${nx},${ny + s} ${nx - s},${ny}`;

      nodesHTML += `
        <g class="orbital-node-group" style="cursor:pointer" title="${escapeHtml(d.label)}: ${scoreVal}/100">
          <polygon points="${points}" fill="${d.color}" opacity="0.25" />
          <polygon points="${points}" fill="none" stroke="${d.color}" stroke-width="2" />
          <circle cx="${nx}" cy="${ny}" r="4" fill="${d.color}" />
          <text x="${nx}" y="${ny - s - 8}" class="orbital-node-label" text-anchor="middle" fill="${labelColor}" font-family="var(--font-sans)" font-size="11" font-weight="600">${escapeHtml(d.label)}</text>
          <text x="${nx}" y="${ny + s + 14}" class="orbital-node-score" text-anchor="middle" fill="${d.color}" font-family="var(--font-mono)" font-size="12" font-weight="700">${(scoreVal / 10).toFixed(1)}</text>
        </g>
      `;
    });

    svg.innerHTML = orbitsHTML + raysHTML + nodesHTML;

    // Update central score box numbers
    const scoreNumEl = document.getElementById('score-number');
    if (scoreNumEl && overallScore !== undefined) {
      scoreNumEl.textContent = overallScore;
    }
  }

  // ── Horizontal Evaluation Dimension Cards Renderer ────────
  function renderEvaluationDimensionCards(dimensions) {
    const container = document.getElementById('evaluation-dimensions-row');
    if (!container || !dimensions) return;

    const dimList = [
      { key: 'clarity',        label: t('dimensions.clarity'),        color: '#00e5ff' },
      { key: 'specificity',    label: t('dimensions.specificity'),    color: '#7c3aed' },
      { key: 'structure',      label: t('dimensions.structure'),      color: '#f59e0b' },
      { key: 'robustness',     label: t('dimensions.robustness'),     color: '#10b981' },
      { key: 'context',        label: t('dimensions.context'),        color: '#ec4899' },
      { key: 'outputFormat',   label: t('dimensions.outputFormat'),   color: '#38bdf8' },
      { key: 'chainOfThought', label: t('dimensions.chainOfThought'), color: '#f97316' },
      { key: 'safety',         label: t('dimensions.safety'),         color: '#ef4444' },
    ];

    container.innerHTML = dimList.map(d => {
      const dimData = dimensions[d.key] || { score: 75 };
      const scoreVal = (dimData.score !== undefined) ? dimData.score : 75;
      const scoreDec = (scoreVal / 10).toFixed(1);

      return `
        <div class="eval-dim-card" data-dim="${d.key}" style="border-top: 2px solid ${d.color}; box-shadow: 0 4px 16px ${d.color}15;">
          <div class="eval-dim-name">${escapeHtml(d.label)}</div>
          <div class="eval-dim-score" style="color: ${d.color}">${scoreDec}</div>
        </div>
      `;
    }).join('');

    container.querySelectorAll('.eval-dim-card').forEach(card => {
      card.addEventListener('click', () => {
        const dimKey = card.dataset.dim;
        navigateToDimensionDetail(dimKey);
      });
    });
  }

  // ── Interactive Navigation to Dimension Details ───────────
  function navigateToDimensionDetail(dimKey) {
    if (!dimKey) return;

    // 1. Switch active tab to 'dimensions'
    const tabBtn = document.querySelector('.tab[data-tab="dimensions"]');
    if (tabBtn) tabBtn.click();

    // 2. Locate target dimension card, scroll into view and highlight
    const targetCard = document.querySelector(`.dimension-card[data-dim="${dimKey}"]`);
    if (targetCard) {
      targetCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
      if (!targetCard.classList.contains('expanded')) {
        targetCard.classList.add('expanded');
      }
      targetCard.classList.add('highlight-pulse');
      setTimeout(() => targetCard.classList.remove('highlight-pulse'), 2000);
    } else {
      const tabsSection = document.getElementById('analysis-tabs-section');
      if (tabsSection) tabsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // ── Color-Coded XML Highlighted Prompt Renderer ────────────

  function renderHighlightedPrompt(promptText) {
    const container = document.getElementById('improved-prompt-highlighted');
    if (!container) return;

    if (!promptText) {
      container.innerHTML = '';
      return;
    }

    const tagClassMap = {
      rol: 'xml-tag-role',
      role: 'xml-tag-role',
      contexto: 'xml-tag-context',
      context: 'xml-tag-context',
      tarea: 'xml-tag-task',
      task: 'xml-tag-task',
      formato_salida: 'xml-tag-format',
      output_format: 'xml-tag-format',
      restricciones: 'xml-tag-constraints',
      constraints: 'xml-tag-constraints',
      ejemplos: 'xml-tag-examples',
      examples: 'xml-tag-examples',
      manejo_errores: 'xml-tag-error',
      error_handling: 'xml-tag-error',
      pensamiento: 'xml-tag-task',
      reasoning: 'xml-tag-task'
    };

    let escaped = escapeHtml(promptText);

    // Replace <tag>...</tag> opening and closing tags with highlighted pills
    escaped = escaped.replace(/&lt;(\/?[a-z_]+)&gt;/gi, (match, tagContent) => {
      const isClosing = tagContent.startsWith('/');
      const rawTag = isClosing ? tagContent.slice(1).toLowerCase() : tagContent.toLowerCase();
      const cssClass = tagClassMap[rawTag] || 'xml-tag-format';
      return `<span class="xml-tag-pill ${cssClass}">&lt;${tagContent}&gt;</span>`;
    });

    container.innerHTML = escaped;
  }

  // ── Action Chips Event Handlers ─────────────────────────────
  function setupActionChips(currentPromptText) {
    const btnShorten = document.getElementById('chip-shorten');
    const btnCoT     = document.getElementById('chip-cot');
    const btnJSON    = document.getElementById('chip-json');
    const btnSafety  = document.getElementById('chip-safety');

    if (btnShorten) {
      btnShorten.onclick = () => {
        let p = currentPromptText
          .replace(/\b(por favor|de la mejor manera posible|sé conciso y|de forma amable)\b/gi, '')
          .replace(/\n{3,}/g, '\n\n')
          .trim();
        p += '\n\n<restricciones>\n- Sé conciso y directo.\n</restricciones>';
        updateImprovedView(p);
        showToast(t('toast.improvementApplied'), 'success');
      };
    }

    if (btnCoT) {
      btnCoT.onclick = () => {
        let p = currentPromptText;
        if (!p.includes('<pensamiento>')) {
          p += '\n\n<pensamiento>\nAnaliza la solicitud paso a paso antes de responder.\nThought: [Razonamiento inicial]\nAction: [Respuesta final]\n</pensamiento>';
        }
        updateImprovedView(p);
        showToast(t('toast.improvementApplied'), 'success');
      };
    }

    if (btnJSON) {
      btnJSON.onclick = () => {
        let p = currentPromptText;
        if (!p.includes('<formato_salida>')) {
          p += '\n\n<formato_salida>\nResponde únicamente con un objeto JSON válido sin texto fuera del bloque.\n</formato_salida>';
        } else {
          p = p.replace(/<formato_salida>[\s\S]*?<\/formato_salida>/gi, '<formato_salida>\nResponde únicamente con un objeto JSON válido con esquema estricto.\n</formato_salida>');
        }
        updateImprovedView(p);
        showToast(t('toast.improvementApplied'), 'success');
      };
    }

    if (btnSafety) {
      btnSafety.onclick = () => {
        let p = currentPromptText;
        if (!p.includes('<restricciones>')) {
          p += '\n\n<restricciones>\n- Cita únicamente datos del texto original.\n- Si no estás seguro de un dato, di explícitamente "No sé". No inventes información.\n</restricciones>';
        } else {
          p = p.replace('</restricciones>', '- Cita únicamente datos del texto original.\n- Si no estás seguro, di "No sé".\n</restricciones>');
        }
        updateImprovedView(p);
        showToast(t('toast.improvementApplied'), 'success');
      };
    }
  }

  function updateImprovedView(newPromptText) {
    document.getElementById('improved-prompt-text').textContent = newPromptText;
    renderHighlightedPrompt(newPromptText);
    if (currentAnalysis && currentAnalysis.improved) {
      currentAnalysis.improved.improvedPrompt = newPromptText;
    }
  }

  function showEmptyState() {
    currentAnalysis = null;
    document.getElementById('empty-state').classList.remove('hidden');
    document.getElementById('results-content').classList.add('hidden');

    // Reset 3D constellation back to protoplanetary disk state
    if (typeof Constellation3D !== 'undefined' && Constellation3D.isInitialized()) {
      Constellation3D.reset();
    }

    // Reset central score display
    const scoreNum = document.getElementById('score-number');
    const scoreGrade = document.getElementById('score-grade');
    if (scoreNum) scoreNum.textContent = '--';
    if (scoreGrade) scoreGrade.textContent = t('constellation.awaitingEvaluation');

    const unoptBadge = document.getElementById('unoptimized-score-badge');
    if (unoptBadge) {
      unoptBadge.innerHTML = `--<span>/100</span>`;
      unoptBadge.className = 'card-score-badge badge-neutral';
    }
    const calibBadge = document.getElementById('calibrated-score-badge');
    if (calibBadge) {
      calibBadge.innerHTML = `--<span>/100</span>`;
      calibBadge.className = 'card-score-badge badge-neutral';
    }
  }

  // ── Tabs ────────────────────────────────────────────────
  function setupTabs() {
    const tabsBar = document.getElementById('results-tabs');
    if (!tabsBar) return;

    tabsBar.addEventListener('click', (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      switchTab(tab.dataset.tab);
    });
  }

  function switchTab(tabName) {
    const tabsBar = document.getElementById('results-tabs');
    if (tabsBar) {
      tabsBar.querySelectorAll('.tab').forEach(tEl => {
        const isActive = tEl.dataset.tab === tabName;
        tEl.classList.toggle('active', isActive);
        tEl.setAttribute('aria-selected', String(isActive));
      });
    }
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    const targetContent = document.getElementById(`tab-${tabName}`);
    if (targetContent) targetContent.classList.add('active');

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

    if (btn && menu) {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = btn.getBoundingClientRect();
        menu.style.top = `${rect.bottom + 8}px`;
        menu.style.right = `${window.innerWidth - rect.right}px`;
        menu.classList.toggle('hidden');
      });

      document.addEventListener('click', () => menu.classList.add('hidden'));
    }

    document.getElementById('export-json')?.addEventListener('click', () => {
      const promptText = document.getElementById('prompt-input')?.value?.trim() || currentAnalysis?.prompt;
      if (!promptText) return showToast(t('toast.writePrompt'), 'warning');
      const analysisObj = currentAnalysis?.analysis || { prompt: promptText, overallScore: 0 };
      const json = ExportUtil.toJSON(analysisObj, promptText);
      ExportUtil.downloadFile(json, 'promptometer-analysis.json', 'application/json');
    });

    document.getElementById('export-markdown')?.addEventListener('click', () => {
      const promptText = document.getElementById('prompt-input')?.value?.trim() || currentAnalysis?.prompt;
      if (!promptText) return showToast(t('toast.writePrompt'), 'warning');
      const analysisObj = currentAnalysis?.analysis || { prompt: promptText, overallScore: 0 };
      const md = ExportUtil.toMarkdown(analysisObj, promptText);
      ExportUtil.downloadFile(md, 'promptometer-analysis.md', 'text/markdown');
    });

    document.getElementById('export-clipboard')?.addEventListener('click', () => {
      const promptText = document.getElementById('prompt-input')?.value?.trim() || currentAnalysis?.prompt;
      if (!promptText) return showToast(t('toast.writePrompt'), 'warning');
      const analysisObj = currentAnalysis?.analysis || { prompt: promptText, overallScore: 0 };
      const md = ExportUtil.toMarkdown(analysisObj, promptText);
      ExportUtil.toClipboard(md);
    });

    document.getElementById('export-share')?.addEventListener('click', () => {
      const promptText = document.getElementById('prompt-input')?.value?.trim() || currentAnalysis?.prompt;
      if (!promptText) return showToast(t('toast.writePrompt'), 'warning');
      const url = ExportUtil.generateShareURL(promptText);
      if (!url) return showToast(t('toast.analysisError'), 'error');
      
      ExportUtil.toClipboard(url);
      openShareModal(url, promptText);
    });

    // Share Modal Handlers
    document.getElementById('btn-close-share-modal')?.addEventListener('click', closeShareModal);
    document.getElementById('btn-close-share-modal-bottom')?.addEventListener('click', closeShareModal);
    setupModalA11y('modal-share-link', closeShareModal);
    document.getElementById('btn-copy-share-url')?.addEventListener('click', () => {
      const input = document.getElementById('share-url-input');
      if (input && input.value) {
        ExportUtil.toClipboard(input.value);
        input.select();
      }
    });

  }

  function setupScoreLegend() {
    const triggerBtn = document.getElementById('btn-score-legend-trigger');
    const scoreBox = document.querySelector('.central-score-box');
    const closeBtn = document.getElementById('btn-close-score-legend');
    const closeBottomBtn = document.getElementById('btn-close-score-legend-bottom');
    const modal = document.getElementById('modal-score-legend');

    if (triggerBtn) triggerBtn.addEventListener('click', openScoreLegendModal);
    if (scoreBox) scoreBox.addEventListener('click', openScoreLegendModal);
    if (closeBtn) closeBtn.addEventListener('click', closeScoreLegendModal);
    if (closeBottomBtn) closeBottomBtn.addEventListener('click', closeScoreLegendModal);
    setupModalA11y('modal-score-legend', closeScoreLegendModal);
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

  // ── Share URL & Modal ──────────────────────────────────
  // Unified modal a11y: close on ESC / backdrop click + initial focus
  function setupModalA11y(modalId, closeFn) {
    const modal = document.getElementById(modalId);
    if (!modal || typeof closeFn !== 'function') return;

    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeFn();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modal.classList.contains('hidden')) closeFn();
    });
  }

  function focusModal(modal) {
    if (!modal) return;
    const target = modal.querySelector('input:not([type="hidden"]), textarea, select')
      || modal.querySelector('.modal-actions .btn, .modal-footer .btn, .modal-close-btn, .modal-close');
    if (target) target.focus();
  }

  function openShareModal(url, promptText) {
    const modal = document.getElementById('modal-share-link');
    const input = document.getElementById('share-url-input');
    const shareX = document.getElementById('share-x');
    const shareWa = document.getElementById('share-wa');
    const shareLi = document.getElementById('share-li');

    if (input) input.value = url;
    const textSnippet = promptText.length > 80 ? promptText.slice(0, 80) + '...' : promptText;
    const encodedMsg = encodeURIComponent(`Evalúa y optimiza tus prompts con Promptometer: ${textSnippet}\n${url}`);
    
    if (shareX) shareX.href = `https://twitter.com/intent/tweet?text=${encodedMsg}`;
    if (shareWa) shareWa.href = `https://api.whatsapp.com/send?text=${encodedMsg}`;
    if (shareLi) shareLi.href = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`;

    if (modal) {
      modal.classList.remove('hidden');
      setTimeout(() => input?.select(), 100);
    }
  }

  function closeShareModal() {
    document.getElementById('modal-share-link')?.classList.add('hidden');
  }

  function openScoreLegendModal() {
    const modal = document.getElementById('modal-score-legend');
    if (modal) {
      modal.classList.remove('hidden');
      focusModal(modal);
    }
  }

  function closeScoreLegendModal() {
    document.getElementById('modal-score-legend')?.classList.add('hidden');
  }

  function checkShareURL() {
    const prompt = ExportUtil.parseShareURL();
    if (prompt) {
      document.getElementById('prompt-input').value = prompt;
      updateEditorStats();
      showToast(I18n.t('toast.shareLoaded'), 'info');
      runAnalysis();
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

    setupSuggestCreatorModal();
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
    ['glossary', 'techniques', 'frameworks', 'library'].forEach(name => {
      const panel = document.getElementById(`learn-${name}`);
      if (panel) panel.classList.toggle('active', name === activeSub);
    });

    // Render the panel's content (lazy, re-rendered each visit for i18n)
    if (activeSub === 'glossary') renderGlossary();
    if (activeSub === 'techniques') renderTechniques();
    if (activeSub === 'frameworks') renderFrameworks();
    if (activeSub === 'library') renderLibrary();

    const searchInput = document.getElementById('learn-search-input');
    const query = searchInput ? searchInput.value.trim().toLowerCase() : '';
    applyLearnSearchFilter(query);
  }

  // ── Radar IA View (Top-Level) ──────────────────────────
  let currentRadarSub = 'creators';

  function setupRadarView() {
    const subnav = document.getElementById('radar-subnav-bar');
    if (subnav) {
      subnav.addEventListener('click', (e) => {
        const btn = e.target.closest('.radar-subnav-btn');
        if (!btn) return;
        renderRadarView(btn.dataset.radarSub);
      });
    }

    const btnSuggestTop = document.getElementById('btn-open-suggest-creator-modal-top');
    if (btnSuggestTop) {
      btnSuggestTop.addEventListener('click', openSuggestCreatorModal);
    }
  }

  function getActiveRadarSub() {
    const active = document.querySelector('.radar-subnav-btn.active');
    return active ? active.dataset.radarSub : 'creators';
  }

  function renderRadarView(sub) {
    if (sub) currentRadarSub = sub;
    const activeSub = currentRadarSub;

    document.querySelectorAll('.radar-subnav-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.radarSub === activeSub);
    });

    const creatorsPanel = document.getElementById('radar-creators-panel');
    const refsPanel = document.getElementById('radar-references-panel');

    if (creatorsPanel) creatorsPanel.classList.toggle('active', activeSub === 'creators');
    if (refsPanel) refsPanel.classList.toggle('active', activeSub === 'references');

    if (activeSub === 'creators') _renderRadarCreatorsPanel();
    if (activeSub === 'references') _renderRadarReferencesPanel();
  }

  function _renderRadarCreatorsPanel() {
    const container = document.getElementById('radar-creators-panel');
    if (!container || typeof Knowledge === 'undefined') return;
    const lang = I18n.getLang();
    const creators = Knowledge.radar || [];

    const platformIcons = {
      x: '𝕏',
      linkedin: 'in',
      youtube: '▶',
      substack: '✍',
      github: '⚙',
    };

    container.innerHTML = `
      <div class="radar-grid">
        ${creators.map(c => {
          const initial = c.name.charAt(0).toUpperCase();
          return `
          <article class="radar-card" data-id="${c.id}">
            <div class="radar-card-header">
              <div class="radar-avatar">${initial}</div>
              <div class="radar-info">
                <span class="radar-name">${escapeHtml(c.name)}</span>
                <span class="radar-handle">${escapeHtml(c.handle)}</span>
                <span class="radar-role">${escapeHtml(c.role[lang] || c.role.es)}</span>
              </div>
            </div>
            <p class="radar-desc">${escapeHtml(c.desc[lang] || c.desc.es)}</p>
            <div class="radar-platforms">
              ${c.platforms.map(p => `
                <a href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer" class="platform-pill">
                  <span>${platformIcons[p.type] || '🌐'}</span>
                  <span>${escapeHtml(p.name)}</span>
                </a>
              `).join('')}
            </div>
          </article>`;
        }).join('')}
      </div>
    `;
  }

  function _renderRadarReferencesPanel() {
    const container = document.getElementById('radar-references-panel');
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
                ${t('radar.visitLink')}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            </div>
          </article>`;
        }).join('')}
      </div>
    `;
  }

  function setupSuggestCreatorModal() {
    const btnClose = document.getElementById('btn-close-suggest-modal');
    const btnCancel = document.getElementById('btn-cancel-suggest-modal');
    const btnConfirm = document.getElementById('btn-confirm-suggest-creator');

    if (btnClose) btnClose.addEventListener('click', closeSuggestCreatorModal);
    if (btnCancel) btnCancel.addEventListener('click', closeSuggestCreatorModal);
    if (btnConfirm) btnConfirm.addEventListener('click', submitCreatorSuggestion);
    setupModalA11y('modal-suggest-creator', closeSuggestCreatorModal);
  }

  function openSuggestCreatorModal() {
    const modal = document.getElementById('modal-suggest-creator');
    if (modal) {
      modal.classList.remove('hidden');
      focusModal(modal);
    }
  }

  function closeSuggestCreatorModal() {
    const modal = document.getElementById('modal-suggest-creator');
    if (modal) modal.classList.add('hidden');
  }

  async function submitCreatorSuggestion() {
    const nameInput   = document.getElementById('suggest-creator-name');
    const handleInput = document.getElementById('suggest-creator-handle');
    const reasonInput = document.getElementById('suggest-creator-reason');
    const btnConfirm  = document.getElementById('btn-confirm-suggest-creator');
    const statusEl    = document.getElementById('suggest-creator-status');

    const name   = nameInput   ? nameInput.value.trim()   : '';
    const handle = handleInput ? handleInput.value.trim() : '';
    const reason = reasonInput ? reasonInput.value.trim() : '';

    if (!name || !handle) {
      if (statusEl) {
        statusEl.textContent = t('radar.validationRequired') || 'Por favor completa el nombre y el handle.';
        statusEl.className = 'suggest-status suggest-status--error';
      }
      return;
    }

    // Loading state
    if (btnConfirm) {
      btnConfirm.disabled = true;
      btnConfirm.style.opacity = '0.6';
    }
    if (statusEl) {
      statusEl.textContent = '';
      statusEl.className = 'suggest-status hidden';
    }

    try {
      const _apiBase = (window.ApiConfig) ? window.ApiConfig.API_BASE : '';
      const res = await fetch(_apiBase + '/api/suggest-creator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, handle, reason }),
      });

      if (res.ok) {
        // Success — clear form and close
        if (nameInput)   nameInput.value   = '';
        if (handleInput) handleInput.value = '';
        if (reasonInput) reasonInput.value = '';
        closeSuggestCreatorModal();
        showToast(t('radar.suggestSuccess'), 'success');
      } else {
        const data = await res.json().catch(() => ({}));
        const msg = data.error || `Error ${res.status}`;
        if (statusEl) {
          statusEl.textContent = msg;
          statusEl.className = 'suggest-status suggest-status--error';
        }
      }
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'No se pudo conectar. Intenta de nuevo.';
        statusEl.className = 'suggest-status suggest-status--error';
      }
    } finally {
      if (btnConfirm) {
        btnConfirm.disabled = false;
        btnConfirm.style.opacity = '';
      }
    }
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
  let currentLeaderboardCategory = 'all';

  function setupLeaderboardView() {
    const btnOpenModal = document.getElementById('btn-open-submit-modal');
    const btnCloseModal = document.getElementById('btn-close-submit-modal');
    const btnCancelModal = document.getElementById('btn-cancel-submit-modal');
    const btnConfirmSubmit = document.getElementById('btn-confirm-submit');

    if (btnOpenModal) btnOpenModal.addEventListener('click', openLeaderboardSubmitModal);
    if (btnCloseModal) btnCloseModal.addEventListener('click', closeLeaderboardSubmitModal);
    if (btnCancelModal) btnCancelModal.addEventListener('click', closeLeaderboardSubmitModal);
    if (btnConfirmSubmit) btnConfirmSubmit.addEventListener('click', submitPromptToLeaderboard);
    setupModalA11y('modal-submit-leaderboard', closeLeaderboardSubmitModal);

    setupLeaderboardFilters();
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
    if (modal) {
      modal.classList.remove('hidden');
      focusModal(modal);
    }
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

  function renderLeaderboardView(category) {
    const container = document.getElementById('leaderboard-grid');
    if (!container || typeof Leaderboard === 'undefined') return;

    // Resolve active category filter (persisted in-session state)
    if (category) currentLeaderboardCategory = category;
    const activeCat = currentLeaderboardCategory || 'all';

    // Render category filter buttons (translated)
    _renderLeaderboardFilters(activeCat);

    // Render immediately from local/seed storage filtered by category
    const localTop10 = activeCat === 'all'
      ? Leaderboard.getTop10()
      : Leaderboard.getByCategory(activeCat);
    _renderLeaderboardCards(container, localTop10, activeCat);

    // Asynchronously fetch global top 10 and refresh (re-filter after merge)
    Leaderboard.fetchGlobalTop10().then(globalTop10 => {
      const filtered = activeCat === 'all'
        ? globalTop10
        : globalTop10.filter(item => Leaderboard.normalizeCategory(item.category) === activeCat);
      _renderLeaderboardCards(container, filtered, activeCat);
    }).catch(() => {});
  }

  function _renderLeaderboardFilters(activeCat) {
    const filtersContainer = document.getElementById('leaderboard-filters');
    if (!filtersContainer) return;

    // "All" button + one per canonical category
    const cats = Leaderboard.CATEGORIES;
    const buttons = [
      `<button class="filter-btn ${activeCat === 'all' ? 'active' : ''}" data-category="all">${escapeHtml(t('leaderboard.filterAll'))}</button>`,
      ...cats.map(cat =>
        `<button class="filter-btn ${activeCat === cat ? 'active' : ''}" data-category="${escapeHtml(cat)}">${escapeHtml(Leaderboard.getCategoryLabel(cat))}</button>`
      ),
    ];
    filtersContainer.innerHTML = buttons.join('');
    filtersContainer.className = 'leaderboard-filter';
  }

  function setupLeaderboardFilters() {
    const filtersContainer = document.getElementById('leaderboard-filters');
    if (!filtersContainer) return;
    filtersContainer.addEventListener('click', (e) => {
      const btn = e.target.closest('.filter-btn');
      if (!btn) return;
      renderLeaderboardView(btn.dataset.category);
    });
  }

  function _renderLeaderboardCards(container, list, activeCat) {
    if (!container || !Array.isArray(list)) return;
    const lang = I18n.getLang();
    const rankMedals = { 1: '🥇', 2: '🥈', 3: '🥉' };

    if (list.length === 0) {
      container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <p class="empty-text">${escapeHtml(t('leaderboard.emptyCategory'))}</p>
        </div>`;
      return;
    }

    container.innerHTML = list.map((item, index) => {
      const rank = index + 1;
      const medal = rankMedals[rank] ? ` ${rankMedals[rank]}` : '';
      const titleText = (typeof item.title === 'object') ? (item.title[lang] || item.title.es) : item.title;
      const rankClass = rank <= 3 ? `rank-${rank}` : '';
      const catLabel = (typeof Leaderboard !== 'undefined')
        ? Leaderboard.getCategoryLabel(Leaderboard.normalizeCategory(item.category))
        : item.category;

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
              <span class="tag">${escapeHtml(catLabel)}</span> ·
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
        const item = list.find(x => x.id === id);
        if (item) {
          loadPrompt(item.prompt);
          showToast(t('learn.exampleLoaded'), 'success');
        }
      });
    });

    container.querySelectorAll('.copy-leaderboard-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const id = btn.dataset.promptId;
        const item = list.find(x => x.id === id);
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

  
  // ── Models Directory & Benchmarks View ────────────────────────────
  let currentModelFilter = 'all';
  let currentModelSearch = '';
  let activeSelectedModel = null;

  function setupModelsView() {
    const searchInput = document.getElementById('models-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        currentModelSearch = (e.target.value || '').trim().toLowerCase();
        renderModelsView();
      });
    }

    const filterContainer = document.getElementById('models-filter-pills');
    if (filterContainer) {
      filterContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.filter-chip');
        if (!btn) return;
        filterContainer.querySelectorAll('.filter-chip').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentModelFilter = btn.dataset.type || 'all';
        renderModelsView();
      });
    }

    // Event delegation on Podium cards
    const podiumContainer = document.getElementById('models-podium-section');
    if (podiumContainer) {
      podiumContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.podium-card');
        if (card && card.dataset.id) {
          openModelDetailModal(card.dataset.id);
        }
      });
    }

    // Event delegation on Grid cards
    const gridContainer = document.getElementById('models-grid');
    if (gridContainer) {
      gridContainer.addEventListener('click', (e) => {
        const card = e.target.closest('.model-card');
        if (card && card.dataset.id) {
          openModelDetailModal(card.dataset.id);
        }
      });
    }

    // Suggest Model Modal listeners
    const btnOpenSuggestModel = document.getElementById('btn-open-suggest-model-modal');
    const modalSuggest = document.getElementById('modal-suggest-model');
    const btnCloseSuggest = document.getElementById('btn-close-suggest-model-modal');
    const btnCancelSuggest = document.getElementById('btn-cancel-suggest-model');
    const btnConfirmSuggest = document.getElementById('btn-confirm-suggest-model');

    function openSuggestModelModal() {
      if (modalSuggest) {
        modalSuggest.classList.remove('hidden');
        focusModal(modalSuggest);
      }
    }

    function closeSuggestModelModal() {
      if (modalSuggest) modalSuggest.classList.add('hidden');
    }

    if (btnOpenSuggestModel) btnOpenSuggestModel.addEventListener('click', openSuggestModelModal);
    if (btnCloseSuggest) btnCloseSuggest.addEventListener('click', closeSuggestModelModal);
    if (btnCancelSuggest) btnCancelSuggest.addEventListener('click', closeSuggestModelModal);
    setupModalA11y('modal-suggest-model', closeSuggestModelModal);

    if (btnConfirmSuggest) {
      btnConfirmSuggest.addEventListener('click', async () => {
        const nameInput = document.getElementById('suggest-model-name');
        const providerInput = document.getElementById('suggest-model-provider');
        const name = (nameInput?.value || '').trim();
        const provider = (providerInput?.value || '').trim();

        if (!name || !provider) {
          showToast(I18n.getLang() === 'en' ? 'Please fill in model name and creator/lab.' : 'Por favor ingresa el nombre y creador del modelo.', 'warning');
          return;
        }

        btnConfirmSuggest.disabled = true;
        try {
          const res = await fetch(API_CONFIG.getUrl('/api/suggest-model'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name,
              provider,
              benchmarks: (document.getElementById('suggest-model-benchmarks')?.value || '').trim(),
            }),
          });

          if (res.ok) {
            if (nameInput) nameInput.value = '';
            if (providerInput) providerInput.value = '';
            const benchInput = document.getElementById('suggest-model-benchmarks');
            if (benchInput) benchInput.value = '';
            closeSuggestModelModal();
            showToast(I18n.t('models.suggestSuccessToast'), 'success');
          } else {
            const err = await res.json().catch(() => ({}));
            showToast(err.error || t('toast.analysisError'), 'error');
          }
        } catch (e) {
          showToast(I18n.getLang() === 'en' ? 'Network error — try again.' : 'Error de red — intenta de nuevo.', 'error');
        } finally {
          btnConfirmSuggest.disabled = false;
        }
      });
    }

    // Modal close listeners
    const closeBtn = document.getElementById('btn-close-model-modal');
    const closeBottomBtn = document.getElementById('btn-close-model-modal-bottom');
    if (closeBtn) closeBtn.addEventListener('click', closeModelDetailModal);
    if (closeBottomBtn) closeBottomBtn.addEventListener('click', closeModelDetailModal);
    setupModalA11y('modal-model-detail', closeModelDetailModal);

    // Copy prompt listener in modal
    const copyBtn = document.getElementById('btn-copy-model-prompt');
    if (copyBtn) {
      copyBtn.addEventListener('click', () => {
        if (!activeSelectedModel || !activeSelectedModel.promptingTips) return;
        const text = activeSelectedModel.promptingTips.samplePrompt || '';
        navigator.clipboard.writeText(text).then(() => {
          const label = document.getElementById('btn-copy-model-prompt-label');
          if (label) label.textContent = I18n.getLang() === 'en' ? 'Copied!' : '¡Copiado!';
          setTimeout(() => {
            if (label) label.textContent = I18n.getLang() === 'en' ? 'Copy' : 'Copiar';
          }, 1800);
        });
      });
    }

    // Use prompt in Workbench
    const useBtn = document.getElementById('btn-use-model-prompt');
    if (useBtn) {
      useBtn.addEventListener('click', () => {
        if (!activeSelectedModel || !activeSelectedModel.promptingTips) return;
        const promptText = activeSelectedModel.promptingTips.samplePrompt;
        loadPrompt(promptText);
        closeModelDetailModal();
        showToast(I18n.t('models.promptLoadedToast', { model: activeSelectedModel.name }), 'success');
      });
    }
  }

  // Benchmark values may be null ("not verified") — render an em dash.
  function fmtBench(v) {
    return (v === null || v === undefined || v === '') ? '—' : v;
  }

  function renderModelsView() {
    if (typeof Models === 'undefined' || !Array.isArray(Models.list)) return;
    const lang = I18n.getLang();
    const models = Models.list;

    // Filter models
    const filtered = models.filter(m => {
      // Type / Category filter
      if (currentModelFilter === 'frontier' && m.type !== 'frontier') return false;
      if (currentModelFilter === 'open_weights' && m.type !== 'open_weights') return false;
      if (currentModelFilter === 'reasoning' && m.category !== 'reasoning') return false;
      if (currentModelFilter === 'coding' && m.category !== 'coding') return false;

      // Text search
      if (currentModelSearch) {
        const query = currentModelSearch;
        const matchName = m.name.toLowerCase().includes(query);
        const matchProvider = m.provider.toLowerCase().includes(query);
        const matchDesc = (m.desc[lang] || m.desc.es).toLowerCase().includes(query);
        const matchLicense = m.license.toLowerCase().includes(query);
        if (!matchName && !matchProvider && !matchDesc && !matchLicense) return false;
      }
      return true;
    });

    // Render Podium (Top 3) if no search/filter or if top models are present
    const podiumContainer = document.getElementById('models-podium-section');
    if (podiumContainer) {
      if (!currentModelSearch && currentModelFilter === 'all') {
        const top3 = models.slice(0, 3);
        const podiumClasses = ['podium-card--gold', 'podium-card--silver', 'podium-card--bronze'];
        
        podiumContainer.innerHTML = top3.map((m, idx) => {
          const badgeText = lang === 'en' ? (m.badgeEn || m.badge) : m.badge;
          const descText = m.desc[lang] || m.desc.es;
          return `
            <div class="podium-card ${podiumClasses[idx]}" data-id="${escapeAttr(m.id)}">
              <div class="podium-card-badge-top">${escapeHtml(badgeText)}</div>
              <h3 class="podium-card-title">#${m.rank} ${escapeHtml(m.name)}</h3>
              <div class="podium-card-provider">${escapeHtml(m.provider)} · <span class="model-type-tag model-type-tag--${m.type}">${m.type === 'frontier' ? (lang === 'en' ? 'Frontier' : 'Frontera') : 'Open Weights'}</span></div>
              <p class="podium-card-desc">${escapeHtml(descText)}</p>

              <div class="model-metrics-grid">
                <div class="metric-item">
                  <span class="metric-val">${fmtBench(m.benchmarks.arenaElo)}</span>
                  <span class="metric-lbl">Arena ELO</span>
                </div>
                <div class="metric-item">
                  <span class="metric-val">${fmtBench(m.benchmarks.sweBench)}</span>
                  <span class="metric-lbl">SWE-bench</span>
                </div>
                <div class="metric-item">
                  <span class="metric-val">${escapeHtml(m.contextWindow)}</span>
                  <span class="metric-lbl">${lang === 'en' ? 'Context' : 'Contexto'}</span>
                </div>
              </div>

              <div class="model-card-footer">
                <span>${escapeHtml(m.pricing.input)}</span>
                <span class="model-card-action">
                  <span>${I18n.t('models.viewSpecs')}</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
                </span>
              </div>
            </div>
          `;
        }).join('');
        podiumContainer.style.display = 'grid';
      } else {
        podiumContainer.style.display = 'none';
      }
    }

    // Render Full Grid
    const grid = document.getElementById('models-grid');
    const emptyState = document.getElementById('models-empty-state');
    if (!grid) return;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');
    grid.innerHTML = filtered.map(m => {
      const typeLabel = m.type === 'frontier' ? (lang === 'en' ? 'Frontier' : 'Frontera') : 'Open Weights';
      const descText = m.desc[lang] || m.desc.es;
      return `
        <div class="model-card" data-id="${escapeAttr(m.id)}">
          <div>
            <div class="model-card-header">
              <div class="model-card-header-left">
                <span class="model-rank-badge">#${m.rank}</span>
                <span class="model-card-name">${escapeHtml(m.name)}</span>
              </div>
              <span class="model-type-tag model-type-tag--${m.type}">${typeLabel}</span>
            </div>
            <div class="model-card-provider">${escapeHtml(m.provider)} · ${escapeHtml(m.license)}</div>

            <div class="model-metrics-grid">
              <div class="metric-item">
                <span class="metric-val">${fmtBench(m.benchmarks.arenaElo)}</span>
                <span class="metric-lbl">Arena ELO</span>
              </div>
              <div class="metric-item">
                <span class="metric-val">${fmtBench(m.benchmarks.globalIndex)}</span>
                <span class="metric-lbl">BenchLM</span>
              </div>
              <div class="metric-item">
                <span class="metric-val">${escapeHtml(m.contextWindow)}</span>
                <span class="metric-lbl">${lang === 'en' ? 'Context' : 'Contexto'}</span>
              </div>
            </div>

            <p class="model-modal-desc" style="font-size:12px; margin: 8px 0; -webkit-line-clamp:2; display:-webkit-box; -webkit-box-orient:vertical; overflow:hidden;">
              ${escapeHtml(descText)}
            </p>
          </div>

          <div class="model-card-footer">
            <span>${escapeHtml(m.pricing.input)}</span>
            <span class="model-card-action">
              <span>${I18n.t('models.viewSpecs')}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
            </span>
          </div>
        </div>
      `;
    }).join('');
  }

  function openModelDetailModal(modelId) {
    if (typeof Models === 'undefined' || !Array.isArray(Models.list)) return;
    const model = Models.list.find(m => m.id === modelId);
    if (!model) return;
    activeSelectedModel = model;

    const lang = I18n.getLang();
    const modal = document.getElementById('modal-model-detail');
    if (!modal) return;

    // Header info
    document.getElementById('model-modal-rank').textContent = '#' + model.rank;
    document.getElementById('model-detail-modal-title').textContent = model.name;
    const typeLabel = model.type === 'frontier' ? (lang === 'en' ? 'Frontier / Proprietary' : 'Frontera / Propietario') : 'Open Source / Open Weights';
    document.getElementById('model-modal-provider').textContent = `${model.provider} · ${typeLabel} · ${model.license}`;

    // Metrics grid
    const metricsGrid = document.getElementById('model-modal-metrics-grid');
    if (metricsGrid) {
      metricsGrid.innerHTML = `
        <div class="metric-item">
          <span class="metric-val">${fmtBench(model.benchmarks.globalIndex)}</span>
          <span class="metric-lbl">BenchLM Index</span>
        </div>
        <div class="metric-item">
          <span class="metric-val">${fmtBench(model.benchmarks.arenaElo)}</span>
          <span class="metric-lbl">Arena ELO</span>
        </div>
        <div class="metric-item">
          <span class="metric-val">${fmtBench(model.benchmarks.sweBench)}</span>
          <span class="metric-lbl">SWE-bench</span>
        </div>
        <div class="metric-item">
          <span class="metric-val">${fmtBench(model.benchmarks.gpqa)}</span>
          <span class="metric-lbl">GPQA Diamond</span>
        </div>
        <div class="metric-item">
          <span class="metric-val">${fmtBench(model.benchmarks.agenticIndex)}</span>
          <span class="metric-lbl">Agentic Index</span>
        </div>
        <div class="metric-item">
          <span class="metric-val">${escapeHtml(model.contextWindow)}</span>
          <span class="metric-lbl">${lang === 'en' ? 'Context' : 'Contexto'}</span>
        </div>
      `;
    }

    // Description & Strengths
    document.getElementById('model-modal-desc').textContent = model.desc[lang] || model.desc.es;
    const strengthsList = document.getElementById('model-modal-strengths');
    if (strengthsList) {
      const list = model.strengths[lang] || model.strengths.es || [];
      strengthsList.innerHTML = list.map(s => `<li>${escapeHtml(s)}</li>`).join('');
    }

    // Prompting style and sample prompt
    const tipEl = document.getElementById('model-modal-prompt-tip');
    if (tipEl) {
      tipEl.textContent = model.promptingTips.style[lang] || model.promptingTips.style.es;
    }
    const sampleEl = document.getElementById('model-modal-sample-prompt');
    if (sampleEl) {
      sampleEl.textContent = model.promptingTips.samplePrompt || '';
    }

    // Docs Link
    const docsLink = document.getElementById('btn-model-docs-link');
    if (docsLink) {
      docsLink.href = model.docsUrl || '#';
    }

    modal.classList.remove('hidden');
    document.body.classList.add('modal-open');
  }

  function closeModelDetailModal() {
    const modal = document.getElementById('modal-model-detail');
    if (modal) {
      modal.classList.add('hidden');
      document.body.classList.remove('modal-open');
    }
    activeSelectedModel = null;
  }

  return { init, showToast, switchView, loadPrompt, openModelDetailModal, closeModelDetailModal, renderModelsView };
})();

// Boot
document.addEventListener('DOMContentLoaded', () => {
  App.init();
});
