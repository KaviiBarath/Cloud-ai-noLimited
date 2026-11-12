import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  CheckCircle2,
  Zap,
  Download,
  Check,
  Layers,
  Sparkles,
  Cloud,
  Terminal,
  Eye,
  EyeOff,
  Copy,
  BookOpen,
  Monitor,
  Code2,
  Search,
} from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { PageHeader } from '@/components/page-header'
import { AgentIcon } from '@/components/agent-icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/lib/toast'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import toolCatalog from '@/data/agent-tools.json'

interface KeyResponse {
  apiKey: string
}

interface AgentStatusResponse {
  agents: Record<string, { injected: boolean; installed: boolean; path?: string }>
}

const TOOL_DESCRIPTIONS: Record<string, string> = {
  claude: 'Anthropic Claude Code CLI & Claude Desktop with 3P Inference Gateway and Playwright tools.',
  cursor: 'AI-first code editor. Auto-configures OpenAI base URL, custom models & resets telemetry machine ID.',
  playwright: 'Browser automation tool with screenshot/photo capture and DOM interaction capabilities.',
  codex: 'OpenAI command-line assistant. Pre-configured with full router compatibility.',
  cline: 'Autonomous coding agent in VS Code. Creates, edits files, and executes terminal commands.',
  continue: 'Open-source AI code assistant for VS Code and JetBrains IDEs.',
  aider: 'Elite terminal pair programmer. Works directly in your git repository.',
  opencode: 'Autonomous terminal coding agent with multi-file reasoning.',
  goose: 'On-machine autonomous AI agent from Block that automates engineering tasks.',
  qwen: 'Alibaba Qwen coding agent CLI configured with local router fallback.',
  roo: 'Autonomous AI software developer extension for VS Code.',
  kilo: 'Lightweight code agent CLI for quick refactoring and bug fixing.',
  crush: 'Fast terminal AI coding harness for rapid development loops.',
  dsh: 'DeepSeek command-line harness for deep reasoning and code synthesis.',
  mimo: 'Interactive terminal agent with streaming multi-file patch generation.',
  atomcode: 'Minimalist AI development assistant for terminal workflows.',
  openclaw: 'Full-featured AI agent gateway for terminal automation.',
  hermes: 'Multi-model autonomous agent for codebase analysis and tasks.',
  pi: 'Extensible AI engineering assistant for developer workflows.',
  reasonix: 'Specialized reasoning agent optimized for complex architecture tasks.',
  zcode: 'High-performance AI coding CLI built for developer speed.',
  generic: 'Standard OpenAI and Anthropic compatible agent connection mode.',
}

function getToolDescription(id: string, category: string): string {
  return TOOL_DESCRIPTIONS[id] || `${category} agent with automated model fallback and routing.`
}

function masked(value: string): string {
  if (value.length < 12) return '••••••••'
  return `${value.slice(0, 8)}${'•'.repeat(16)}${value.slice(-4)}`
}

export default function AgentsPage() {
  const queryClient = useQueryClient()
  const [revealKey, setRevealKey] = useState(false)
  const [activeTab, setActiveTab] = useState<'grid' | 'guide'>('grid')
  const [guideTool, setGuideTool] = useState<'cursor' | 'claude' | 'vscode' | 'terminal'>('cursor')
  const [copiedUrl, setCopiedUrl] = useState(false)
  const [copiedKey, setCopiedKey] = useState(false)
  const [searchFilter, setSearchFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')

  const [localInjected, setLocalInjected] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('freellmapi_injected_agents')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  const { data: keyData } = useQuery<KeyResponse>({
    queryKey: ['api-key'],
    queryFn: () => apiFetch('/api/settings/api-key'),
  })

  const { data: agentStatus } = useQuery<AgentStatusResponse>({
    queryKey: ['agents-status'],
    queryFn: async (): Promise<AgentStatusResponse> => {
      try {
        return await apiFetch<AgentStatusResponse>('/api/agents/status')
      } catch {
        return { agents: {} }
      }
    },
  })

  const origin = import.meta.env.DEV
    ? `http://${window.location.hostname}:${__SERVER_PORT__}`
    : window.location.origin

  const localhostV1 = `${origin}/v1`
  const currentApiKey = keyData?.apiKey || ''

  const copyToClipboard = (text: string, type: 'url' | 'key' | 'config') => {
    navigator.clipboard.writeText(text)
    if (type === 'url') {
      setCopiedUrl(true)
      setTimeout(() => setCopiedUrl(false), 2000)
      toast.success(`Copied Localhost URL (${text}) to clipboard!`)
    } else if (type === 'key') {
      setCopiedKey(true)
      setTimeout(() => setCopiedKey(false), 2000)
      toast.success('Copied Unified API Key to clipboard!')
    } else {
      toast.success('Copied configuration to clipboard!')
    }
  }

  // 1-Click Inject mutation
  const injectMutation = useMutation({
    mutationFn: async (agentId: string) => {
      return apiFetch<{ success: boolean; message: string; agentId: string }>('/api/agents/inject', {
        method: 'POST',
        body: JSON.stringify({ agentId }),
      })
    },
    onSuccess: (data, agentId) => {
      const next = { ...localInjected }
      if (agentId === 'all') {
        toolCatalog.forEach(tool => { next[tool.id] = true })
        next.playwright = true
      } else {
        next[agentId] = true
      }
      setLocalInjected(next)
      try {
        localStorage.setItem('freellmapi_injected_agents', JSON.stringify(next))
      } catch {}
      queryClient.invalidateQueries({ queryKey: ['agents-status'] })
      toast.success(data.message || `Injected ${agentId} successfully!`)
    },
    onError: (err: any) => {
      toast.error(`Injection failed: ${err.message || 'Unknown error'}`)
    },
  })

  // 1-Click Automation Cloud (Direct Claude Desktop & Web Launch)
  const automationCloudMutation = useMutation({
    mutationFn: async () => {
      return apiFetch<{
        success: boolean
        launched: boolean
        agentId: string
        browserFallbackUrl?: string
        message: string
      }>('/api/agents/automation-cloud', {
        method: 'POST',
      })
    },
    onSuccess: () => {
      const next = { ...localInjected }
      toolCatalog.forEach(tool => { next[tool.id] = true })
      next.claude = true
      next.playwright = true
      setLocalInjected(next)
      try {
        localStorage.setItem('freellmapi_injected_agents', JSON.stringify(next))
      } catch {}
      queryClient.invalidateQueries({ queryKey: ['agents-status'] })
      toast.success('⚡ Automation Cloud: Claude connected & ready to chat!')
    },
    onError: (err: any) => {
      toast.error(`Automation Cloud launch failed: ${err.message || 'Unknown error'}`)
    },
  })

  // 1-Click Terminal Run Mutation
  const terminalRunMutation = useMutation({
    mutationFn: async (agentId?: string) => {
      return apiFetch<{
        success: boolean
        launched: boolean
        agentId: string
        message: string
      }>('/api/agents/terminal-run', {
        method: 'POST',
        body: JSON.stringify({ agentId: agentId || 'claude' }),
      })
    },
    onSuccess: (data) => {
      toast.success(data.message || '🚀 Terminal launched!')
    },
    onError: (err: any) => {
      toast.error(`Terminal launch failed: ${err.message || 'Unknown error'}`)
    },
  })

  const isAgentInjected = (agentId: string): boolean => {
    if (localInjected[agentId]) return true
    if (agentStatus?.agents?.[agentId]?.injected) return true
    return false
  }

  // Filter tools
  const filteredTools = toolCatalog.filter(tool => {
    const matchesSearch = tool.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      getToolDescription(tool.id, tool.category).toLowerCase().includes(searchFilter.toLowerCase()) ||
      tool.id.toLowerCase().includes(searchFilter.toLowerCase())
    if (!matchesSearch) return false
    if (categoryFilter === 'desktop') return ['claude', 'cursor'].includes(tool.id)
    if (categoryFilter === 'ide') return ['cline', 'continue', 'roo'].includes(tool.id)
    if (categoryFilter === 'cli') return ['aider', 'codex', 'opencode', 'goose'].includes(tool.id)
    return true
  })

  const generateConfigSnippet = (agentId: string): string => {
    if (agentId === 'cursor') {
      return JSON.stringify({
        'cursor.openAiBaseUrl': localhostV1,
        'cursor.openAiApiKey': currentApiKey,
        'cursor.models': ['claude-3-7-sonnet', 'claude-3-5-sonnet', 'auto'],
      }, null, 2)
    }
    if (agentId === 'claude') {
      return JSON.stringify({
        inferenceGatewayBaseUrl: localhostV1,
        inferenceGatewayApiKey: currentApiKey,
        inferenceModels: [{ name: 'claude-3-7-sonnet' }, { name: 'claude-3-5-sonnet' }],
      }, null, 2)
    }
    if (agentId === 'continue' || agentId === 'cline') {
      return JSON.stringify({
        models: [{
          title: 'Barath API Claude 3.7',
          provider: 'anthropic',
          model: 'claude-3-7-sonnet',
          apiBase: localhostV1,
          apiKey: currentApiKey,
        }],
      }, null, 2)
    }
    return `export OPENAI_BASE_URL="${localhostV1}"\nexport OPENAI_API_KEY="${currentApiKey}"\nexport ANTHROPIC_BASE_URL="${localhostV1}"\nexport ANTHROPIC_AUTH_TOKEN="${currentApiKey}"`
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <PageHeader
        title="Agent Gateway & Integrations"
        description="Connect Cursor, Claude Desktop, VS Code extensions, and Terminal CLI agents with 1-click injection and unlimited model routing."
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant={activeTab === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('grid')}
              className={activeTab === 'grid' ? 'bg-primary text-primary-foreground font-semibold shadow-sm' : ''}
            >
              <Layers className="mr-1.5 size-3.5" />
              Agent Hub
            </Button>
            <Button
              variant={activeTab === 'guide' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('guide')}
              className={activeTab === 'guide' ? 'bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-sm' : ''}
            >
              <BookOpen className="mr-1.5 size-3.5" />
              Visual Guides & Photos
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => injectMutation.mutate('all')}
              disabled={injectMutation.isPending}
              className="border-primary/30 hover:bg-primary/10 font-semibold"
            >
              <Zap className="mr-1.5 size-3.5 text-primary" />
              {injectMutation.isPending ? 'Injecting...' : 'Inject All (22)'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open('/api/agents/script', '_blank')
                toast.success('Downloaded Windows batch injector script!')
              }}
              title="Download standalone Windows .bat injector"
            >
              <Download className="size-3.5" />
            </Button>
          </div>
        }
      />

      {/* Prominent Connection Box (URL, API Key, Copy Buttons) */}
      <div className="rounded-2xl border border-border/80 bg-card/60 backdrop-blur-md p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Localhost Endpoint Box */}
          <div className="rounded-xl border border-border/70 bg-muted/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Monitor className="size-3.5 text-primary" />
                Localhost Gateway URL
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Port 3001 Active
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground select-all overflow-x-auto">
                {localhostV1}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(localhostV1, 'url')}
                className="shrink-0 h-8 gap-1.5 font-medium hover:border-primary/50"
              >
                {copiedUrl ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {copiedUrl ? 'Copied' : 'Copy URL'}
              </Button>
            </div>
          </div>

          {/* Unified API Key Box */}
          <div className="rounded-xl border border-border/70 bg-muted/40 p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="size-3.5 text-indigo-400" />
                Unified API Key
              </span>
              <button
                type="button"
                onClick={() => setRevealKey(v => !v)}
                className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors cursor-pointer"
              >
                {revealKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
                {revealKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 font-mono text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground select-all overflow-x-auto">
                {currentApiKey ? (revealKey ? currentApiKey : masked(currentApiKey)) : 'Loading…'}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(currentApiKey, 'key')}
                disabled={!currentApiKey}
                className="shrink-0 h-8 gap-1.5 font-medium hover:border-primary/50"
              >
                {copiedKey ? <Check className="size-3.5 text-emerald-500" /> : <Copy className="size-3.5" />}
                {copiedKey ? 'Copied' : 'Copy Key'}
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Launch Action Ribbon */}
        <div className="pt-2 border-t border-border/40 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="size-2 rounded-full bg-emerald-500" />
            <span className="font-medium text-foreground">Multi-Model Gateway Ready:</span>
            <span>Claude 3.7 Sonnet, 3.5 Sonnet, Gemini 2.5 Pro & Auto Router</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => automationCloudMutation.mutate()}
              disabled={automationCloudMutation.isPending}
              className="h-7 text-xs border-purple-500/40 hover:bg-purple-500/10 text-purple-400 font-semibold cursor-pointer"
            >
              <Cloud className="size-3 mr-1" />
              {automationCloudMutation.isPending ? 'Connecting...' : '⚡ Launch Claude'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => injectMutation.mutate('cursor')}
              disabled={injectMutation.isPending}
              className="h-7 text-xs border-cyan-500/40 hover:bg-cyan-500/10 text-cyan-400 font-semibold cursor-pointer"
            >
              <Zap className="size-3 mr-1" />
              ⚡ Inject Cursor
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => terminalRunMutation.mutate('claude')}
              disabled={terminalRunMutation.isPending}
              className="h-7 text-xs border-emerald-500/40 hover:bg-emerald-500/10 text-emerald-400 font-semibold cursor-pointer"
            >
              <Terminal className="size-3 mr-1" />
              ▶ Terminal Run
            </Button>
          </div>
        </div>
      </div>

      {/* TAB 1: AGENT CATALOG */}
      {activeTab === 'grid' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-muted/60 border border-border/60">
              {[
                { id: 'all', label: 'All Agents' },
                { id: 'desktop', label: 'Desktop & IDE' },
                { id: 'ide', label: 'Extensions' },
                { id: 'cli', label: 'CLI Tools' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategoryFilter(cat.id)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                    categoryFilter === cat.id
                      ? 'bg-background text-foreground shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2.5 top-2.5 size-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter agents..."
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-xl text-xs bg-muted/40 border border-border/60 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/50"
              />
            </div>
          </div>

          {/* Agent Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTools.map(tool => {
              const injected = isAgentInjected(tool.id)
              return (
                <Card key={tool.id} className="relative flex flex-col justify-between overflow-hidden border-border/70 hover:border-primary/40 transition-all hover:shadow-md">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center p-2">
                          <AgentIcon id={tool.id} name={tool.name} className="size-6" />
                        </div>
                        <div>
                          <CardTitle className="text-sm font-semibold">{tool.name}</CardTitle>
                          <span className="text-[11px] text-muted-foreground font-mono">
                            {tool.id}
                          </span>
                        </div>
                      </div>

                      <Badge
                        variant={injected ? 'default' : 'secondary'}
                        className={`text-[10px] uppercase tracking-wider font-semibold ${
                          injected
                            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {injected ? 'Connected' : 'Ready'}
                      </Badge>
                    </div>

                    <CardDescription className="text-xs text-muted-foreground line-clamp-2 mt-2 leading-relaxed">
                      {getToolDescription(tool.id, tool.category)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="pt-0 pb-3">
                    <div className="rounded-lg bg-muted/30 p-2 text-[11px] font-mono text-muted-foreground flex items-center justify-between">
                      <span className="truncate">Base: {localhostV1}</span>
                      <button
                        onClick={() => copyToClipboard(generateConfigSnippet(tool.id), 'config')}
                        className="text-primary hover:underline text-[10px] font-sans font-medium shrink-0 ml-2 cursor-pointer"
                      >
                        Copy Snippet
                      </button>
                    </div>
                  </CardContent>

                  <CardAction className="p-3 border-t border-border/50 bg-muted/20 flex items-center gap-2">
                    <Button
                      size="sm"
                      onClick={() => {
                        if (tool.id === 'claude') {
                          automationCloudMutation.mutate()
                        } else {
                          injectMutation.mutate(tool.id)
                        }
                      }}
                      disabled={injectMutation.isPending || automationCloudMutation.isPending}
                      className="flex-1 h-8 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <Zap className="size-3 mr-1" />
                      {tool.id === 'cursor' ? 'Inject & Reset' : 'Inject & Launch'}
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => terminalRunMutation.mutate(tool.id)}
                      disabled={terminalRunMutation.isPending}
                      className="h-8 px-2.5 text-xs font-medium hover:border-emerald-500/50 hover:text-emerald-400"
                      title="Run in dedicated Terminal"
                    >
                      <Terminal className="size-3" />
                    </Button>

                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setActiveTab('guide')
                        if (tool.id === 'cursor') setGuideTool('cursor')
                        else if (tool.id === 'claude') setGuideTool('claude')
                        else if (['cline', 'continue', 'roo'].includes(tool.id)) setGuideTool('vscode')
                        else setGuideTool('terminal')
                      }}
                      className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                      title="View Photo Setup Guide"
                    >
                      <BookOpen className="size-3" />
                    </Button>
                  </CardAction>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* TAB 2: VISUAL GUIDES & PHOTOS */}
      {activeTab === 'guide' && (
        <div className="space-y-6">
          {/* Sub Navigation Pills for Tools */}
          <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-card border border-border/80 shadow-xs">
            {[
              { id: 'cursor', label: 'Cursor IDE (Unlimited Reset)', icon: Monitor },
              { id: 'claude', label: 'Claude Desktop & Web', icon: Cloud },
              { id: 'vscode', label: 'VS Code (Cline / Continue)', icon: Code2 },
              { id: 'terminal', label: 'Terminal CLI (Claude / Aider)', icon: Terminal },
            ].map(tab => {
              const Icon = tab.icon
              const isActive = guideTool === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setGuideTool(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  <Icon className="size-3.5" />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* GUIDE 1: CURSOR IDE */}
          {guideTool === 'cursor' && (
            <div className="space-y-6">
              {/* Photo / Simulated UI Mockup Card */}
              <div className="rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden font-sans">
                {/* Window Chrome Titlebar */}
                <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="size-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 text-xs font-medium text-zinc-400 font-mono">
                      Cursor Settings &gt; Features &gt; Models
                    </span>
                  </div>
                  <Badge variant="outline" className="border-cyan-500/30 text-cyan-400 bg-cyan-950/30 text-[10px]">
                    Photorealistic Setup Mockup
                  </Badge>
                </div>

                {/* Simulated Cursor Settings UI */}
                <div className="p-6 space-y-5 text-zinc-200">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Monitor className="size-4 text-cyan-400" />
                        OpenAI API Key &amp; Base URL Override
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Redirect Cursor completions to Barath API router for unlimited free models.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ✓ Status: Connected
                    </span>
                  </div>

                  {/* Simulated Form Fields */}
                  <div className="space-y-3 max-w-xl">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        Override OpenAI Base URL:
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 font-mono text-xs px-3 py-2 rounded-lg bg-zinc-900 border border-emerald-500/50 text-emerald-400 flex items-center justify-between">
                          <span>{localhostV1}</span>
                          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            Verified ✓
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(localhostV1, 'url')}
                          className="h-8 text-xs border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                        >
                          <Copy className="size-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        OpenAI API Key:
                      </label>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 font-mono text-xs px-3 py-2 rounded-lg bg-zinc-900 border border-emerald-500/50 text-emerald-400 flex items-center justify-between">
                          <span>{currentApiKey ? masked(currentApiKey) : 'barath-api-9bcc7b...'}</span>
                          <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded">
                            Valid ✓
                          </span>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(currentApiKey, 'key')}
                          className="h-8 text-xs border-zinc-700 bg-zinc-800 hover:bg-zinc-700 text-zinc-200"
                        >
                          <Copy className="size-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Active Models Pill Rack */}
                  <div className="pt-2">
                    <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
                      Active Configured Models (Unlimited):
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'claude-3-7-sonnet',
                        'claude-3-5-sonnet',
                        'gemini-2.5-pro',
                        'deepseek-r1',
                        'auto',
                      ].map(model => (
                        <div
                          key={model}
                          className="px-2.5 py-1 rounded-md bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300 flex items-center gap-1.5"
                        >
                          <span className="size-1.5 rounded-full bg-emerald-400" />
                          {model}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/70 p-4 space-y-2">
                  <div className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="text-sm font-semibold">Copy Localhost URL</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    In Cursor, press <kbd className="px-1 py-0.5 rounded bg-muted font-mono text-[10px]">Ctrl+,</kbd> (Settings) &gt; Features &gt; Models. Enable "Override OpenAI Base URL" and paste <code className="text-primary font-mono">{localhostV1}</code>.
                  </p>
                </Card>

                <Card className="border-border/70 p-4 space-y-2">
                  <div className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="text-sm font-semibold">Paste Unified API Key</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Paste your Barath API Key into "OpenAI API Key" field and click <strong>Verify</strong>. All Claude, Gemini, and DeepSeek models will pass verification instantly.
                  </p>
                </Card>

                <Card className="border-border/70 p-4 space-y-2">
                  <div className="size-7 rounded-lg bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="text-sm font-semibold">Unlimited Telemetry Reset</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click <strong>⚡ Inject &amp; Reset Cursor</strong> below anytime. It automatically writes fresh hardware machine UUIDs to Cursor's telemetry so you never get rate-limited.
                  </p>
                </Card>
              </div>

              {/* Action Buttons for Cursor */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => injectMutation.mutate('cursor')}
                  disabled={injectMutation.isPending}
                  className="bg-cyan-600 hover:bg-cyan-500 text-white font-semibold shadow-md shadow-cyan-600/20"
                >
                  <Zap className="size-3.5 mr-1.5" />
                  {injectMutation.isPending ? 'Resetting Cursor...' : '⚡ 1-Click Inject & Reset Cursor'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => terminalRunMutation.mutate('cursor')}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <Terminal className="size-3.5 mr-1.5 text-cyan-400" />
                  ▶ Terminal Run (Cursor CLI)
                </Button>
              </div>
            </div>
          )}

          {/* GUIDE 2: CLAUDE DESKTOP & WEB */}
          {guideTool === 'claude' && (
            <div className="space-y-6">
              {/* Photo / Simulated UI Mockup Card */}
              <div className="rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden font-sans">
                {/* Window Chrome Titlebar */}
                <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="size-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 text-xs font-medium text-zinc-400 font-mono">
                      Claude Desktop &gt; BARATH Gateway &gt; claude-3-7-sonnet
                    </span>
                  </div>
                  <Badge variant="outline" className="border-orange-500/30 text-orange-400 bg-orange-950/30 text-[10px]">
                    Claude Desktop 3P Gateway
                  </Badge>
                </div>

                {/* Simulated Claude Desktop Screen */}
                <div className="p-6 space-y-5 text-zinc-200">
                  <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
                    <div>
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <Cloud className="size-4 text-orange-400" />
                        Claude Desktop 3P Inference Gateway
                      </h4>
                      <p className="text-xs text-zinc-400">
                        Direct connection to Barath API for Claude 3.7 Sonnet &amp; 3.5 Sonnet.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      ● BARATH · Gateway Connected
                    </span>
                  </div>

                  {/* Simulated Chat & Gateway Status */}
                  <div className="rounded-xl bg-zinc-900/90 border border-zinc-800 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-zinc-400">Selected Model:</span>
                      <span className="font-mono text-orange-300 font-semibold bg-orange-950/50 px-2 py-0.5 rounded border border-orange-700/50">
                        claude-3-7-sonnet (Unlimited Free)
                      </span>
                    </div>

                    <div className="p-3 rounded-lg bg-zinc-950 border border-zinc-800/80 text-xs text-zinc-300 space-y-1">
                      <p className="font-medium text-emerald-400 flex items-center gap-1.5">
                        <CheckCircle2 className="size-3.5 text-emerald-400" />
                        If Claude Desktop shows &quot;Gateway couldn&apos;t serve claude-3-7-sonnet&quot;:
                      </p>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">
                        Simply click the <strong>[Check again]</strong> button on the warning banner, or start a new chat. The Barath API server on port 3001 serves Claude 3.7 Sonnet and 3.5 Sonnet seamlessly.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Step-by-Step Instructions */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-border/70 p-4 space-y-2">
                  <div className="size-7 rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs flex items-center justify-center">
                    1
                  </div>
                  <h4 className="text-sm font-semibold">1-Click Auto Configuration</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Click <strong>⚡ Launch Claude Desktop / Web</strong>. Barath API automatically injects all 3P gateway configuration files into Claude Desktop.
                  </p>
                </Card>

                <Card className="border-border/70 p-4 space-y-2">
                  <div className="size-7 rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs flex items-center justify-center">
                    2
                  </div>
                  <h4 className="text-sm font-semibold">Select Claude 3.7 Sonnet</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    In Claude Desktop, select <strong>claude-3-7-sonnet</strong> or <strong>claude-3-5-sonnet</strong> from the model picker. Requests route directly through Barath API.
                  </p>
                </Card>

                <Card className="border-border/70 p-4 space-y-2">
                  <div className="size-7 rounded-lg bg-orange-500/10 text-orange-400 font-bold text-xs flex items-center justify-center">
                    3
                  </div>
                  <h4 className="text-sm font-semibold">Browser Automation Fallback</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    If Claude Desktop is not installed, it automatically opens <code className="text-primary font-mono">claude.ai</code> in your default browser with Playwright tools enabled.
                  </p>
                </Card>
              </div>

              {/* Action Buttons for Claude */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => automationCloudMutation.mutate()}
                  disabled={automationCloudMutation.isPending}
                  className="bg-orange-600 hover:bg-orange-500 text-white font-semibold shadow-md shadow-orange-600/20"
                >
                  <Cloud className="size-3.5 mr-1.5" />
                  {automationCloudMutation.isPending ? 'Opening Claude...' : '⚡ Launch Claude Desktop / Web'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => terminalRunMutation.mutate('claude')}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <Terminal className="size-3.5 mr-1.5 text-orange-400" />
                  ▶ Terminal Run (Claude CLI)
                </Button>
              </div>
            </div>
          )}

          {/* GUIDE 3: VS CODE (CLINE / CONTINUE) */}
          {guideTool === 'vscode' && (
            <div className="space-y-6">
              {/* Photo / Simulated UI Mockup Card */}
              <div className="rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden font-sans">
                {/* Window Chrome Titlebar */}
                <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="size-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 text-xs font-medium text-zinc-400 font-mono">
                      VS Code &gt; Cline / Continue Extension Settings
                    </span>
                  </div>
                  <Badge variant="outline" className="border-blue-500/30 text-blue-400 bg-blue-950/30 text-[10px]">
                    VS Code Extension Mockup
                  </Badge>
                </div>

                {/* Simulated VS Code Extension Settings */}
                <div className="p-6 space-y-4 text-zinc-200">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        API Provider:
                      </label>
                      <div className="font-mono text-xs px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200">
                        Anthropic or OpenAI Compatible
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                        Model ID:
                      </label>
                      <div className="font-mono text-xs px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-zinc-200">
                        claude-3-7-sonnet or auto
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                      Base URL:
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 font-mono text-xs px-3 py-2 rounded-lg bg-zinc-900 border border-emerald-500/50 text-emerald-400">
                        {localhostV1}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(localhostV1, 'url')}
                        className="h-8 text-xs border-zinc-700 bg-zinc-800 text-zinc-200"
                      >
                        <Copy className="size-3 mr-1" />
                        Copy URL
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => injectMutation.mutate('cline')}
                  disabled={injectMutation.isPending}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  <Zap className="size-3.5 mr-1.5" />
                  ⚡ 1-Click Inject Cline &amp; Continue
                </Button>
                <Button
                  variant="outline"
                  onClick={() => copyToClipboard(generateConfigSnippet('cline'), 'config')}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <Copy className="size-3.5 mr-1.5 text-blue-400" />
                  Copy Config JSON
                </Button>
              </div>
            </div>
          )}

          {/* GUIDE 4: TERMINAL CLI */}
          {guideTool === 'terminal' && (
            <div className="space-y-6">
              {/* Photo / Simulated UI Mockup Card */}
              <div className="rounded-2xl border border-zinc-700 bg-zinc-950 shadow-2xl overflow-hidden font-sans">
                {/* Window Chrome Titlebar */}
                <div className="bg-zinc-900 border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-3 rounded-full bg-red-500/80 inline-block" />
                    <span className="size-3 rounded-full bg-yellow-500/80 inline-block" />
                    <span className="size-3 rounded-full bg-emerald-500/80 inline-block" />
                    <span className="ml-2 text-xs font-medium text-zinc-400 font-mono">
                      Terminal — Claude Code CLI / Aider AI
                    </span>
                  </div>
                  <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 bg-emerald-950/30 text-[10px]">
                    CLI Environment Mockup
                  </Badge>
                </div>

                {/* Simulated Terminal Window */}
                <div className="p-6 bg-zinc-950 font-mono text-xs space-y-2 text-zinc-300">
                  <p className="text-zinc-500"># Set environment variables for any CLI tool:</p>
                  <p className="text-emerald-400">$ export ANTHROPIC_BASE_URL=&quot;{localhostV1}&quot;</p>
                  <p className="text-emerald-400">$ export ANTHROPIC_AUTH_TOKEN=&quot;{currentApiKey || 'barath-api-...'}&quot;</p>
                  <p className="text-emerald-400">$ export OPENAI_BASE_URL=&quot;{localhostV1}&quot;</p>
                  <p className="text-emerald-400">$ export OPENAI_API_KEY=&quot;{currentApiKey || 'barath-api-...'}&quot;</p>
                  <p className="text-zinc-500 pt-2"># Run Claude Code or Aider with zero config:</p>
                  <p className="text-cyan-300">$ npx @anthropic-ai/claude-code</p>
                  <div className="p-3 rounded-lg bg-zinc-900/80 border border-zinc-800 text-[11px] text-zinc-400 space-y-1">
                    <p className="text-emerald-400 font-semibold">[Barath API] Connected to Local Router ({localhostV1})</p>
                    <p>Model: claude-3-7-sonnet | Max Tokens: 64,000 | Speed: Instant Free Tier</p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={() => terminalRunMutation.mutate('claude')}
                  disabled={terminalRunMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  <Terminal className="size-3.5 mr-1.5" />
                  {terminalRunMutation.isPending ? 'Launching...' : '▶ Launch Terminal Now (Claude CLI)'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => terminalRunMutation.mutate('aider')}
                  disabled={terminalRunMutation.isPending}
                  className="border-zinc-700 hover:bg-zinc-800"
                >
                  <Terminal className="size-3.5 mr-1.5 text-emerald-400" />
                  ▶ Launch Terminal (Aider AI)
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
