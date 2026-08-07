/* ============================================================
   Promptometer — Charts Module (Chart.js Wrapper)
   Requires Chart.js loaded globally via CDN.
   ============================================================ */

const Charts = {

  /** @type {Chart|null} */
  radarChart: null,

  /** @type {Chart|null} */
  historyChart: null,

  /* ── Theme tokens (dynamic per active theme) ── */
  get _theme() {
    const isEditorial = document.body && document.body.classList.contains('theme-editorial');
    if (isEditorial) {
      return {
        accent:      '#C73E2D',
        accentAlpha: 'rgba(199, 62, 45, 0.14)',
        gridColor:   'rgba(26, 22, 18, 0.08)',
        tickColor:   'rgba(139, 130, 117, 0.85)',
        labelColor:  'rgba(74, 66, 57, 0.9)',
        tooltipBg:   'rgba(26, 22, 18, 0.92)',
        tooltipText: '#FBF8F2',
        surface:     'rgba(239, 233, 221, 0.6)',
        fontFamily:  "'Fraunces', serif",
        labelFont:   "'Inter', sans-serif",
      };
    }
    return {
      accent:      '#FF9E00',
      accentAlpha: 'rgba(255, 158, 0, 0.22)',
      gridColor:   'rgba(255, 255, 255, 0.08)',
      tickColor:   'rgba(160, 174, 192, 0.85)',
      labelColor:  'rgba(240, 244, 248, 0.9)',
      tooltipBg:   'rgba(17, 20, 32, 0.95)',
      tooltipText: '#F0F4F8',
      surface:     'rgba(12, 14, 23, 0.6)',
      fontFamily:  "'Space Grotesk', sans-serif",
      labelFont:   "'Inter', sans-serif",
    };
  },

  /* ── Dimension labels (resolved via i18n at chart build time) ── */
  get _dimensionLabels() {
    return this._dimensionKeys.map(k => I18n.t(`dimensions.${k}`));
  },

  /* ── Dimension keys (matching score object) ───────────────── */
  _dimensionKeys: [
    'clarity',
    'specificity',
    'structure',
    'robustness',
    'context',
    'outputFormat',
    'chainOfThought',
    'safety',
  ],

  /* ──────────────────────────────────────────────────────────
     Radar Chart
  ────────────────────────────────────────────────────────── */

  /**
   * Initialise the radar chart on a <canvas> element.
   * @param {string} canvasId - The id attribute of the target canvas.
   * @returns {Chart} The created Chart instance.
   */
  initRadar(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`[Charts] Canvas #${canvasId} not found.`);
      return null;
    }

    // Destroy previous instance if any
    if (this.radarChart) {
      this.radarChart.destroy();
      this.radarChart = null;
    }

    // NOTE: do NOT build canvas gradients here. ctx.width / ctx.height are
    // the DOM attributes (or undefined after Chart.js goes responsive) and
    // produced a corrupt gradient that rendered an empty chart. Solid RGBA
    // colours are used instead; they look identical at this scale and are
    // immune to canvas resizing.
    this.radarChart = new Chart(ctx, {
      type: 'radar',
      data: {
        labels: this._dimensionLabels,
        datasets: [
          {
            label: I18n.t('report.datasetLabel'),
            data: new Array(8).fill(0),
            backgroundColor: this._theme.accentAlpha,
            borderColor: this._theme.accent,
            borderWidth: 2,
            pointBackgroundColor: this._theme.accent,
            pointBorderColor: this._theme.accent,
            pointHoverBackgroundColor: '#FBF8F2',
            pointHoverBorderColor: this._theme.accent,
            pointRadius: 4,
            pointHoverRadius: 6,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        animation: {
          duration: 900,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: this._theme.tooltipBg,
            titleFont: { family: this._theme.labelFont, size: 12, weight: '600' },
            bodyFont:  { family: this._theme.labelFont, size: 12 },
            titleColor: this._theme.tooltipText,
            bodyColor:  'rgba(251, 248, 242, 0.75)',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              label: (tooltipItem) => I18n.t('report.tooltipDim', { label: tooltipItem.label, n: tooltipItem.raw }),
            },
          },
        },
        scales: {
          r: {
            beginAtZero: true,
            min: 0,
            max: 100,
            ticks: {
              stepSize: 20,
              color: this._theme.tickColor,
              backdropColor: 'transparent',
              font: { family: this._theme.labelFont, size: 10 },
            },
            grid: {
              color: this._theme.gridColor,
              lineWidth: 1,
            },
            angleLines: {
              color: this._theme.gridColor,
              lineWidth: 1,
            },
            pointLabels: {
              color: this._theme.labelColor,
              font: {
                family: this._theme.fontFamily,
                size: 11,
                weight: '500',
              },
              padding: 14,
            },
          },
        },
      },
    });

    return this.radarChart;
  },

  /**
   * Update the radar chart with new dimension scores.
   * @param {Object} scores - e.g. { clarity: 85, specificity: 70, ... }
   */
  updateRadar(scores) {
    if (!this.radarChart) {
      console.warn('[Charts] Radar chart not initialised. Call initRadar() first.');
      return;
    }

    const data = this._dimensionKeys.map((key) => {
      const val = scores[key];
      return typeof val === 'number' ? Math.max(0, Math.min(100, val)) : 0;
    });

    this.radarChart.data.datasets[0].data = data;
    this.radarChart.update('active');
  },

  /* ──────────────────────────────────────────────────────────
     History Chart (Line)
  ────────────────────────────────────────────────────────── */

  /**
   * Initialise the history line chart.
   * @param {string} canvasId - The id attribute of the target canvas.
   * @returns {Chart} The created Chart instance.
   */
  initHistoryChart(canvasId) {
    const ctx = document.getElementById(canvasId);
    if (!ctx) {
      console.error(`[Charts] Canvas #${canvasId} not found.`);
      return null;
    }

    if (this.historyChart) {
      this.historyChart.destroy();
      this.historyChart = null;
    }

    // NOTE: gradient removed for the same reason as initRadar — ctx.height
    // is unreliable after Chart.js goes responsive. Solid RGBA fill instead.
    this.historyChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [],
        datasets: [
          {
            label: I18n.t('report.datasetLabelHistory'),
            data: [],
            borderColor: this._theme.accent,
            backgroundColor: this._theme.accentAlpha,
            borderWidth: 2.5,
            pointBackgroundColor: this._theme.accent,
            pointBorderColor: '#FBF8F2',
            pointBorderWidth: 2,
            pointRadius: 5,
            pointHoverRadius: 7,
            pointHoverBackgroundColor: '#FBF8F2',
            pointHoverBorderColor: this._theme.accent,
            fill: true,
            tension: 0.4,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: {
          duration: 700,
          easing: 'easeOutCubic',
        },
        interaction: {
          mode: 'index',
          intersect: false,
        },
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: this._theme.tooltipBg,
            titleFont: { family: this._theme.labelFont, size: 12, weight: '600' },
            bodyFont:  { family: this._theme.labelFont, size: 12 },
            titleColor: this._theme.tooltipText,
            bodyColor:  'rgba(251, 248, 242, 0.75)',
            borderColor: 'rgba(255,255,255,0.08)',
            borderWidth: 1,
            padding: 12,
            cornerRadius: 8,
            displayColors: false,
            callbacks: {
              title: (items) => I18n.t('report.tooltipDate', { date: items[0].label }),
              label: (item) => I18n.t('report.tooltipScore', { n: item.raw }),
            },
          },
        },
        scales: {
          x: {
            title: {
              display: true,
              text: I18n.t('report.axisDate'),
              color: this._theme.tickColor,
              font: { family: this._theme.fontFamily, size: 11, weight: '500' },
            },
            grid: {
              color: this._theme.gridColor,
              lineWidth: 1,
            },
            ticks: {
              color: this._theme.tickColor,
              font: { family: this._theme.labelFont, size: 10 },
              maxRotation: 45,
              maxTicksLimit: 12,
            },
            border: {
              color: this._theme.gridColor,
            },
          },
          y: {
            min: 0,
            max: 100,
            title: {
              display: true,
              text: I18n.t('report.axisScore'),
              color: this._theme.tickColor,
              font: { family: this._theme.fontFamily, size: 11, weight: '500' },
            },
            grid: {
              color: this._theme.gridColor,
              lineWidth: 1,
            },
            ticks: {
              stepSize: 20,
              color: this._theme.tickColor,
              font: { family: this._theme.labelFont, size: 10 },
            },
            border: {
              color: this._theme.gridColor,
            },
          },
        },
      },
    });

    return this.historyChart;
  },

  /**
   * Update the history chart with new data points.
   * @param {Array<{date: string, score: number}>} dataPoints
   */
  updateHistoryChart(dataPoints) {
    if (!this.historyChart) {
      console.warn('[Charts] History chart not initialised. Call initHistoryChart() first.');
      return;
    }

    if (!Array.isArray(dataPoints) || dataPoints.length === 0) {
      this.historyChart.data.labels = [];
      this.historyChart.data.datasets[0].data = [];
      this.historyChart.update('active');
      return;
    }

    // Sort by date ascending
    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.date) - new Date(b.date)
    );

    // Format dates for display
    const formatDate = (dateStr) => {
      try {
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short',
        });
      } catch {
        return dateStr;
      }
    };

    this.historyChart.data.labels = sorted.map((p) => formatDate(p.date));
    this.historyChart.data.datasets[0].data = sorted.map((p) =>
      Math.max(0, Math.min(100, p.score))
    );

    this.historyChart.update('active');
  },

  /* ──────────────────────────────────────────────────────────
     Cleanup
  ────────────────────────────────────────────────────────── */

  /**
   * Destroy all chart instances and release resources.
   */
  destroy() {
    if (this.radarChart) {
      this.radarChart.destroy();
      this.radarChart = null;
    }
    if (this.historyChart) {
      this.historyChart.destroy();
      this.historyChart = null;
    }
  },
};
