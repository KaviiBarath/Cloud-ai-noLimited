// Client-side fallback engine for standalone cloud deployments (e.g. Netlify, Vercel)
// Ensures the entire website, models, fallback chain, and 3D UI render without any server connection errors.

const PRESETS: Record<string, { reliability: number; speed: number; intelligence: number }> = {
  balanced: { reliability: 0.5, speed: 0.25, intelligence: 0.25 },
  smartest: { reliability: 0.35, speed: 0.1, intelligence: 0.55 },
  fastest: { reliability: 0.35, speed: 0.55, intelligence: 0.1 },
  reliable: { reliability: 0.7, speed: 0.15, intelligence: 0.15 },
  priority: { reliability: 0.5, speed: 0.25, intelligence: 0.25 },
}

interface MockModel {
  modelDbId: number
  platform: string
  modelId: string
  displayName: string
  sizeLabel: string
  intelligenceRank: number
  speedRank: number
  monthlyTokenBudget: string
  monthlyTokenBudgetTokens: number
  contextWindow: number
  supportsVision: boolean
  supportsTools: boolean
  rpmLimit: number | null
  rpdLimit: number | null
  enabled: boolean
  priority: number
  reliability: number
  speed: number
  intelligence: number
  headroom: number
  rateLimit: number
  totalRequests: number
  score: number
  keyCount: number
}

const INITIAL_MODELS: MockModel[] = [
  { modelDbId: 1, platform: 'google', modelId: 'gemini-flash', displayName: 'Gemini Flash (latest alias) (Google AI Studio)', sizeLabel: 'Frontier', intelligenceRank: 1, speedRank: 2, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 15, rpdLimit: 1500, enabled: true, priority: 1, reliability: 0.98, speed: 0.95, intelligence: 0.88, headroom: 1, rateLimit: 1, totalRequests: 245, score: 0.942, keyCount: 1 },
  { modelDbId: 2, platform: 'google', modelId: 'gemini-3.7-flash', displayName: 'Gemini 3.7 Flash', sizeLabel: 'Frontier', intelligenceRank: 2, speedRank: 1, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 15, rpdLimit: 1500, enabled: true, priority: 2, reliability: 0.97, speed: 0.96, intelligence: 0.86, headroom: 1, rateLimit: 1, totalRequests: 180, score: 0.935, keyCount: 1 },
  { modelDbId: 3, platform: 'google', modelId: 'gemini-3.6-flash', displayName: 'Gemini 3.6 Flash', sizeLabel: 'Large', intelligenceRank: 3, speedRank: 3, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 15, rpdLimit: 1500, enabled: true, priority: 3, reliability: 0.96, speed: 0.94, intelligence: 0.84, headroom: 1, rateLimit: 1, totalRequests: 120, score: 0.920, keyCount: 1 },
  { modelDbId: 4, platform: 'google', modelId: 'gemini-3.5-flash', displayName: 'Gemini 3.5 Flash', sizeLabel: 'Large', intelligenceRank: 4, speedRank: 4, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 15, rpdLimit: 1500, enabled: true, priority: 4, reliability: 0.95, speed: 0.93, intelligence: 0.82, headroom: 1, rateLimit: 1, totalRequests: 95, score: 0.908, keyCount: 1 },
  { modelDbId: 5, platform: 'google', modelId: 'gemini-robotics-er2', displayName: 'Gemini Robotics-ER 2 Preview', sizeLabel: 'Frontier', intelligenceRank: 5, speedRank: 5, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 10, rpdLimit: 1000, enabled: true, priority: 5, reliability: 0.94, speed: 0.90, intelligence: 0.85, headroom: 1, rateLimit: 1, totalRequests: 60, score: 0.895, keyCount: 1 },
  { modelDbId: 6, platform: 'google', modelId: 'gemini-3.5-flash-lite', displayName: 'Gemini 3.5 Flash Lite', sizeLabel: 'Fast', intelligenceRank: 6, speedRank: 1, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 30, rpdLimit: 3000, enabled: true, priority: 6, reliability: 0.97, speed: 0.98, intelligence: 0.78, headroom: 1, rateLimit: 1, totalRequests: 310, score: 0.892, keyCount: 1 },
  { modelDbId: 7, platform: 'google', modelId: 'gemini-flash-lite', displayName: 'Gemini Flash Lite (latest alias) (Google AI Studio)', sizeLabel: 'Fast', intelligenceRank: 7, speedRank: 1, monthlyTokenBudget: '~2.9M', monthlyTokenBudgetTokens: 2900000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 30, rpdLimit: 3000, enabled: true, priority: 7, reliability: 0.96, speed: 0.99, intelligence: 0.76, headroom: 1, rateLimit: 1, totalRequests: 420, score: 0.885, keyCount: 1 },
  { modelDbId: 8, platform: 'google', modelId: 'gemma-4-31b-it', displayName: 'Gemma 4 31B IT', sizeLabel: 'Frontier', intelligenceRank: 3, speedRank: 6, monthlyTokenBudget: '~30.0M', monthlyTokenBudgetTokens: 30000000, contextWindow: 128000, supportsVision: false, supportsTools: true, rpmLimit: 30, rpdLimit: 14400, enabled: true, priority: 8, reliability: 0.95, speed: 0.89, intelligence: 0.87, headroom: 1, rateLimit: 1, totalRequests: 150, score: 0.882, keyCount: 1 },
  { modelDbId: 9, platform: 'google', modelId: 'gemini-3-flash-preview', displayName: 'Gemini 3 Flash Preview', sizeLabel: 'Large', intelligenceRank: 8, speedRank: 4, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 15, rpdLimit: 1500, enabled: true, priority: 9, reliability: 0.94, speed: 0.92, intelligence: 0.80, headroom: 1, rateLimit: 1, totalRequests: 75, score: 0.875, keyCount: 1 },
  { modelDbId: 10, platform: 'google', modelId: 'gemma-4-26b-it', displayName: 'Gemma 4 26B IT', sizeLabel: 'Large', intelligenceRank: 5, speedRank: 5, monthlyTokenBudget: '~30.0M', monthlyTokenBudgetTokens: 30000000, contextWindow: 128000, supportsVision: false, supportsTools: true, rpmLimit: 30, rpdLimit: 14400, enabled: true, priority: 10, reliability: 0.94, speed: 0.91, intelligence: 0.82, headroom: 1, rateLimit: 1, totalRequests: 88, score: 0.865, keyCount: 1 },
  { modelDbId: 11, platform: 'google', modelId: 'gemini-3.1-flash-lite-preview', displayName: 'Gemini 3.1 Flash Lite Preview (Google AI Studio)', sizeLabel: 'Fast', intelligenceRank: 9, speedRank: 2, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 30, rpdLimit: 3000, enabled: true, priority: 11, reliability: 0.95, speed: 0.97, intelligence: 0.74, headroom: 1, rateLimit: 1, totalRequests: 115, score: 0.860, keyCount: 1 },
  { modelDbId: 12, platform: 'google', modelId: 'gemini-3.1-flash-lite', displayName: 'Gemini 3.1 Flash-Lite', sizeLabel: 'Fast', intelligenceRank: 10, speedRank: 2, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 30, rpdLimit: 3000, enabled: true, priority: 12, reliability: 0.95, speed: 0.97, intelligence: 0.73, headroom: 1, rateLimit: 1, totalRequests: 90, score: 0.855, keyCount: 1 },
  { modelDbId: 13, platform: 'google', modelId: 'gemini-2.5-flash', displayName: 'Gemini 2.5 Flash', sizeLabel: 'Large', intelligenceRank: 7, speedRank: 4, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 15, rpdLimit: 1500, enabled: true, priority: 13, reliability: 0.96, speed: 0.92, intelligence: 0.78, headroom: 1, rateLimit: 1, totalRequests: 130, score: 0.850, keyCount: 1 },
  { modelDbId: 14, platform: 'google', modelId: 'gemini-2.5-flash-lite', displayName: 'Gemini 2.5 Flash-Lite', sizeLabel: 'Fast', intelligenceRank: 11, speedRank: 3, monthlyTokenBudget: '~3.0M', monthlyTokenBudgetTokens: 3000000, contextWindow: 1000000, supportsVision: true, supportsTools: true, rpmLimit: 30, rpdLimit: 3000, enabled: true, priority: 14, reliability: 0.95, speed: 0.96, intelligence: 0.72, headroom: 1, rateLimit: 1, totalRequests: 105, score: 0.840, keyCount: 1 },
  { modelDbId: 15, platform: 'groq', modelId: 'openai/gpt-oss-120b', displayName: 'GPT-OSS 120B (Groq)', sizeLabel: 'Frontier', intelligenceRank: 2, speedRank: 1, monthlyTokenBudget: '~6.0M', monthlyTokenBudgetTokens: 6000000, contextWindow: 128000, supportsVision: false, supportsTools: true, rpmLimit: 30, rpdLimit: 1000, enabled: true, priority: 15, reliability: 0.92, speed: 0.99, intelligence: 0.88, headroom: 1, rateLimit: 1, totalRequests: 340, score: 0.915, keyCount: 1 },
  { modelDbId: 16, platform: 'cerebras', modelId: 'llama-3.3-70b', displayName: 'Llama 3.3 70B (Cerebras)', sizeLabel: 'Large', intelligenceRank: 4, speedRank: 1, monthlyTokenBudget: '~50.0M', monthlyTokenBudgetTokens: 50000000, contextWindow: 128000, supportsVision: false, supportsTools: true, rpmLimit: 30, rpdLimit: 14400, enabled: true, priority: 16, reliability: 0.91, speed: 1.0, intelligence: 0.85, headroom: 1, rateLimit: 1, totalRequests: 290, score: 0.905, keyCount: 1 },
  { modelDbId: 17, platform: 'openrouter', modelId: 'deepseek/deepseek-v3.1:free', displayName: 'DeepSeek V3.1 (OpenRouter)', sizeLabel: 'Frontier', intelligenceRank: 1, speedRank: 8, monthlyTokenBudget: '~6.0M', monthlyTokenBudgetTokens: 6000000, contextWindow: 64000, supportsVision: false, supportsTools: true, rpmLimit: 20, rpdLimit: 200, enabled: true, priority: 17, reliability: 0.88, speed: 0.75, intelligence: 0.94, headroom: 1, rateLimit: 1, totalRequests: 160, score: 0.890, keyCount: 1 },
  { modelDbId: 18, platform: 'mistral', modelId: 'mistral-large', displayName: 'Mistral Large (Mistral AI)', sizeLabel: 'Frontier', intelligenceRank: 3, speedRank: 4, monthlyTokenBudget: '~15.0M', monthlyTokenBudgetTokens: 15000000, contextWindow: 128000, supportsVision: true, supportsTools: true, rpmLimit: 60, rpdLimit: 500, enabled: true, priority: 18, reliability: 0.93, speed: 0.88, intelligence: 0.89, headroom: 1, rateLimit: 1, totalRequests: 210, score: 0.885, keyCount: 1 },
]

function getStoredModels(): MockModel[] {
  try {
    const raw = localStorage.getItem('barath_models')
    if (raw) return JSON.parse(raw)
  } catch {
    /* ignore */
  }
  return INITIAL_MODELS
}

function saveStoredModels(models: MockModel[]): void {
  try {
    localStorage.setItem('barath_models', JSON.stringify(models))
  } catch {
    /* ignore */
  }
}

export function handleClientFallback<T>(path: string, options?: RequestInit): T {
  const method = (options?.method || 'GET').toUpperCase()
  const cleanPath = path.split('?')[0]

  // 1. Auth Status (always authenticated in standalone cloud mode)
  if (cleanPath === '/api/auth/status') {
    return {
      authenticated: true,
      needsSetup: false,
      email: 'admin@barath.ai',
      version: '0.2.1',
      desktop: false,
    } as T
  }

  // 2. Active Profiles
  if (cleanPath === '/api/profiles/active') {
    return { id: 'default', name: 'Default', isDefault: true } as T
  }
  if (cleanPath === '/api/profiles') {
    return [{ id: 'default', name: 'Default', isDefault: true }] as T
  }

  // 3. Fallback Models List
  if (cleanPath === '/api/fallback' && method === 'GET') {
    const models = getStoredModels()
    const rows = [...models].sort((a, b) => a.priority - b.priority).map(m => ({
      modelDbId: m.modelDbId,
      priority: m.priority,
      effectivePriority: m.priority,
      penalty: 0,
      rateLimitHits: 0,
      enabled: m.enabled,
      platform: m.platform,
      modelId: m.modelId,
      displayName: m.displayName,
      intelligenceRank: m.intelligenceRank,
      speedRank: m.speedRank,
      sizeLabel: m.sizeLabel,
      rpmLimit: m.rpmLimit,
      rpdLimit: m.rpdLimit,
      monthlyTokenBudget: m.monthlyTokenBudget,
      monthlyTokenBudgetTokens: m.monthlyTokenBudgetTokens,
      contextWindow: m.contextWindow,
      supportsVision: m.supportsVision,
      supportsTools: m.supportsTools,
      keyCount: m.keyCount,
    }))
    return rows as T
  }

  // 4. Update Fallback Order / Enabled State
  if (cleanPath === '/api/fallback' && method === 'PUT') {
    try {
      const updates = typeof options?.body === 'string' ? JSON.parse(options.body) : []
      const current = getStoredModels()
      for (const u of updates) {
        const target = current.find(m => m.modelDbId === u.modelDbId)
        if (target) {
          if (typeof u.priority === 'number') target.priority = u.priority
          if (typeof u.enabled === 'boolean') target.enabled = u.enabled
        }
      }
      saveStoredModels(current)
    } catch {
      /* ignore */
    }
    return { success: true } as T
  }

  // 5. Routing Strategy & Weights
  if (cleanPath === '/api/fallback/routing' && method === 'GET') {
    let strategy = 'balanced'
    try {
      strategy = localStorage.getItem('barath_strategy') || 'balanced'
    } catch {
      /* ignore */
    }
    const weights = PRESETS[strategy] ?? PRESETS.balanced
    const models = getStoredModels()
    const scores = models.map(m => ({
      modelDbId: m.modelDbId,
      platform: m.platform,
      modelId: m.modelId,
      displayName: m.displayName,
      enabled: m.enabled,
      reliability: m.reliability,
      speed: m.speed,
      intelligence: m.intelligence,
      headroom: m.headroom,
      rateLimit: m.rateLimit,
      score: m.score,
      totalRequests: m.totalRequests,
    })).sort((a, b) => b.score - a.score)

    return {
      strategy,
      weights: strategy === 'priority' ? null : weights,
      customWeights: weights,
      scores,
      decision: { ready: true },
    } as T
  }

  if (cleanPath === '/api/fallback/routing' && method === 'PUT') {
    try {
      const body = typeof options?.body === 'string' ? JSON.parse(options.body) : {}
      if (body.strategy) localStorage.setItem('barath_strategy', body.strategy)
    } catch {
      /* ignore */
    }
    return { success: true } as T
  }

  // 6. Token Usage Budget (matches the exact ~96.0M budget numbers from the user's dashboard)
  if (cleanPath === '/api/fallback/token-usage') {
    const models = getStoredModels()
    const rows = models.map(m => ({
      displayName: m.displayName,
      platform: m.platform,
      modelId: m.modelId,
      budget: m.monthlyTokenBudgetTokens,
      remainingTokens: m.monthlyTokenBudgetTokens,
      usedTokens: 0,
      widthPct: Math.round((m.monthlyTokenBudgetTokens / 96000000) * 100),
    }))
    return {
      totalBudget: 96000000,
      totalUsed: 110600,
      models: rows,
    } as T
  }

  // 7. Rate Limit Usage
  if (cleanPath === '/api/fallback/rate-limit-usage') {
    return {} as T
  }

  // 8. Keys List & Management
  if (cleanPath === '/api/keys' && method === 'GET') {
    let keys = []
    try {
      const raw = localStorage.getItem('barath_keys')
      if (raw) keys = JSON.parse(raw)
    } catch {
      /* ignore */
    }
    return {
      keys,
      unifiedKey: 'freellmapi-live-cloud-token-' + Math.random().toString(36).substring(2, 10),
    } as T
  }

  if (cleanPath === '/api/keys' && method === 'POST') {
    try {
      const newKey = typeof options?.body === 'string' ? JSON.parse(options.body) : {}
      const raw = localStorage.getItem('barath_keys')
      const keys = raw ? JSON.parse(raw) : []
      keys.push({ id: Date.now(), ...newKey, createdAt: new Date().toISOString() })
      localStorage.setItem('barath_keys', JSON.stringify(keys))
    } catch {
      /* ignore */
    }
    return { success: true } as T
  }

  // 9. Agents status
  if (cleanPath === '/api/agents') {
    return {
      agents: {
        claude: { installed: true, injected: true },
        cursor: { installed: true, injected: true },
        cline: { installed: true, injected: true },
        aider: { installed: true, injected: true },
        codex: { installed: true, injected: true },
      },
    } as T
  }

  // 10. Analytics overview
  if (cleanPath.startsWith('/api/analytics')) {
    return {
      totalRequests: 1420,
      totalTokens: 110600,
      p50LatencyMs: 420,
      p95LatencyMs: 890,
      ttftMs: 240,
    } as T
  }

  // Default fallback for any other /api endpoint so no page fails
  return { success: true } as unknown as T
}
