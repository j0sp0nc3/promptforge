// ============================================================================
// Promptometer — LLM Models Observatory
// Curated Top 10 + benchmark glossary. Data snapshot: August 2026.
// Sources: BenchLM monthly leaderboard (benchlm.ai) & LLM-Stats (llm-stats.com).
// Scores are only included where published by the sources above.
// ============================================================================

const Models = {

  updated: '2026-08',

  sources: [
    { name: 'BenchLM', url: 'https://benchlm.ai/' },
    { name: 'LLM-Stats', url: 'https://llm-stats.com/' },
    { name: 'LM Arena', url: 'https://lmarena.ai/' },
  ],

  // ── Top 10 (curated composite ranking, Aug 2026) ─────────────────────────
  // type: 'frontier' (closed weights) | 'open' (open weights)
  list: [
    {
      id: 'claude-mythos', rank: 1, name: 'Claude Mythos', lab: 'Anthropic', type: 'frontier',
      license: 'Propietario', licenseEn: 'Proprietary', released: '2026',
      index: 83.3, gpqa: 94.6,
      url: 'https://www.anthropic.com/claude',
      highlights: {
        es: 'Líder del composite BenchLM (83.26) y del razonamiento científico: 94.6% en GPQA Diamond, el techo actual de las evaluaciones frontera.',
        en: 'BenchLM composite leader (83.26) and science reasoning leader: 94.6% on GPQA Diamond — the current ceiling of frontier evaluations.'
      }
    },
    {
      id: 'claude-fable', rank: 2, name: 'Claude Fable 5', lab: 'Anthropic', type: 'frontier',
      license: 'Propietario', licenseEn: 'Proprietary', released: '2026',
      index: 83.0, arena: 1509,
      url: 'https://www.anthropic.com/claude',
      highlights: {
        es: '#1 en preferencia humana (LM Arena, 1508.6 Elo): el modelo que los usuarios eligen más a menudo en comparaciones ciegas.',
        en: '#1 in human preference (LM Arena, 1508.6 Elo): the model users pick most often in blind side-by-side comparisons.'
      }
    },
    {
      id: 'claude-opus-47', rank: 3, name: 'Claude Opus 4.7', lab: 'Anthropic', type: 'frontier',
      license: 'Propietario', licenseEn: 'Proprietary', released: '2026',
      index: 82.9, swe: 91.0,
      url: 'https://www.anthropic.com/claude',
      highlights: {
        es: 'Rey de la ingeniería de software: ~91% en SWE-bench Verified resolviendo issues reales de GitHub, por delante de GPT-5.5 Pro y Gemini 3.1 Pro.',
        en: 'King of software engineering: ~91% on SWE-bench Verified resolving real GitHub issues, ahead of GPT-5.5 Pro and Gemini 3.1 Pro.'
      }
    },
    {
      id: 'gpt-56-sol', rank: 4, name: 'GPT-5.6 Sol', lab: 'OpenAI', type: 'frontier',
      license: 'Propietario', licenseEn: 'Proprietary', released: '2026',
      index: 82.0, agentic: 55.3,
      url: 'https://openai.com/',
      highlights: {
        es: 'El líder agéntico: ~55.3 en el Agentic Index (tareas autónomas multi-paso). Fuera del top 10 de preferencia humana (#14), pero imbatible ejecutando agentes.',
        en: 'The agentic leader: ~55.3 on the Agentic Index (autonomous multi-step tasks). Outside the human-preference top 10 (#14), but unmatched at running agents.'
      }
    },
    {
      id: 'kimi-k3', rank: 5, name: 'Kimi K3', lab: 'Moonshot AI', type: 'open',
      license: 'Apache 2.0', licenseEn: 'Apache 2.0', released: '2026',
      index: 80.5,
      url: 'https://huggingface.co/moonshotai',
      highlights: {
        es: '🏆 El modelo abierto más capaz (80.45 en BenchLM): licencia Apache 2.0, pesos en Hugging Face y foco en contextos muy largos. La mejor opción open para agentes y RAG.',
        en: '🏆 The most capable open model (80.45 on BenchLM): Apache 2.0 license, weights on Hugging Face, and a focus on very long contexts. The best open pick for agents and RAG.'
      }
    },
    {
      id: 'gemini-31-pro', rank: 6, name: 'Gemini 3.1 Pro', lab: 'Google DeepMind', type: 'frontier',
      license: 'Propietario', licenseEn: 'Proprietary', released: '2026',
      url: 'https://deepmind.google/models/gemini/',
      highlights: {
        es: 'El mejor coste-eficiencia del nivel frontera y contendiente directo en coding (SWE-bench). Multimodal nativo con el ecosistema Google más amplio.',
        en: 'Best cost-efficiency at the frontier level and a direct coding contender (SWE-bench). Native multimodal with the broadest Google ecosystem.'
      }
    },
    {
      id: 'deepseek-v4', rank: 7, name: 'DeepSeek V4', lab: 'DeepSeek', type: 'open',
      license: 'Pesos abiertos (MIT-like)', licenseEn: 'Open weights (MIT-like)', released: '2026',
      url: 'https://www.deepseek.com/',
      highlights: {
        es: 'El contendiente coste-eficiente de código y propósito general: referencia en despliegues API baratos con calidad cercana a la frontera.',
        en: 'The cost-efficient general & coding contender: the go-to for cheap API deployments with near-frontier quality.'
      }
    },
    {
      id: 'gpt-55-pro', rank: 8, name: 'GPT-5.5 Pro', lab: 'OpenAI', type: 'frontier',
      license: 'Propietario', licenseEn: 'Proprietary', released: '2026',
      url: 'https://openai.com/',
      highlights: {
        es: 'La generación Pro previa de OpenAI: sigue top-5 en SWE-bench y mantiene uno de los ecosistemas de herramientas más maduros (Realtime, tools, embeddings).',
        en: 'OpenAI\'s previous Pro generation: still top-5 on SWE-bench with one of the most mature tool ecosystems (Realtime, tools, embeddings).'
      }
    },
    {
      id: 'qwen-36', rank: 9, name: 'Qwen 3.6', lab: 'Alibaba', type: 'open',
      license: 'Apache 2.0 (mayoría)', licenseEn: 'Apache 2.0 (most sizes)', released: '2026',
      url: 'https://qwen.ai/',
      highlights: {
        es: 'La familia open con el rango más amplio de tamaños desplegables (desde edge hasta datacenter). Qwen3.6-27B es una de las opciones API más baratas con calidad alta.',
        en: 'The open family with the broadest range of deployable sizes (from edge to datacenter). Qwen3.6-27B is one of the cheapest high-quality API options.'
      }
    },
    {
      id: 'glm-52', rank: 10, name: 'GLM-5.2', lab: 'Zhipu AI (Z.ai)', type: 'open',
      license: 'Pesos abiertos', licenseEn: 'Open weights', released: '2026',
      url: 'https://z.ai/',
      highlights: {
        es: 'La apuesta open de coding con contexto largo. Alternativa sólida a DeepSeek/Kimi para agentes de código con ventanas de contexto extensas.',
        en: 'The long-context coding bet in open weights. A solid DeepSeek/Kimi alternative for code agents with extensive context windows.'
      }
    },
  ],

  // ── Benchmark glossary ────────────────────────────────────────────────────
  benchmarks: [
    { id: 'index', name: 'Índice Global (BenchLM)', nameEn: 'Global Index (BenchLM)', icon: '🏁',
      desc: { es: 'Composite multi-benchmark que pondera razonamiento, código, matemáticas y uso de herramientas en una sola métrica 0–100.',
              en: 'Multi-benchmark composite weighting reasoning, code, math and tool use into a single 0–100 score.' } },
    { id: 'gpqa', name: 'GPQA Diamond', nameEn: 'GPQA Diamond', icon: '🔬',
      desc: { es: 'Preguntas de nivel post-doctoral en física, química y biología escritas para ser "Google-proof". El estándar del razonamiento científico.',
              en: 'Post-doctoral level physics, chemistry and biology questions designed to be "Google-proof". The science reasoning standard.' } },
    { id: 'swe', name: 'SWE-bench Verified', nameEn: 'SWE-bench Verified', icon: '🛠️',
      desc: { es: 'Resolución de issues reales de repositorios GitHub open-source (patch correcto + tests pasando). El estándar de ingeniería de software.',
              en: 'Resolving real issues from open-source GitHub repos (correct patch + passing tests). The software engineering standard.' } },
    { id: 'arena', name: 'LM Arena (Elo)', nameEn: 'LM Arena (Elo)', icon: '🗳️',
      desc: { es: 'Preferencia humana en comparaciones ciegas entre modelos (estilo Elo de ajedrez). Mide utilidad percibida, no solo acierto.',
              en: 'Human preference in blind side-by-side model comparisons (chess-style Elo). Measures perceived usefulness, not just accuracy.' } },
    { id: 'agentic', name: 'Agentic Index', nameEn: 'Agentic Index', icon: '🤖',
      desc: { es: 'Éxito en tareas autónomas multi-paso: navegación web, uso de herramientas y persistencia en objetivos de larga duración.',
              en: 'Success on autonomous multi-step tasks: web navigation, tool use and long-horizon goal persistence.' } },
    { id: 'frontier', name: 'FrontierMath / HLE', nameEn: 'FrontierMath / HLE', icon: '🧮',
      desc: { es: 'Matemática de nivel investigación olímpico (FrontierMath) y el examen "Humanity\'s Last Exam" — las evaluaciones más duras conocidas.',
              en: 'Research-olympiad level mathematics (FrontierMath) and the "Humanity\'s Last Exam" test — the hardest known evaluations.' } },
  ],

  // ── Helpers ──────────────────────────────────────────────────────────────
  top(filter) {
    const list = [...this.list].sort((a, b) => a.rank - b.rank);
    if (!filter || filter === 'all') return list;
    return list.filter(m => m.type === filter);
  },

  countBy(type) {
    return this.list.filter(m => m.type === type).length;
  },
};
