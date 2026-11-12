import { useState } from 'react'
import { Monitor, Cloud, Bot, ChevronDown, ChevronUp, Cpu, Zap, Shield, ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'

export function AgentHeroBanner() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem('freellmapi.heroBanner.collapsed') === '1'
    } catch {
      return false
    }
  })

  function toggleCollapsed() {
    setCollapsed(prev => {
      const next = !prev
      try {
        localStorage.setItem('freellmapi.heroBanner.collapsed', next ? '1' : '0')
      } catch {
        /* ignore */
      }
      return next
    })
  }

  return (
    <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-card p-6 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.55),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-300">
      {/* GitHub Cosmic Cloud & Nebula Glow behind the banner */}
      <div className="pointer-events-none absolute -top-24 -left-20 size-80 rounded-full bg-cyan-500/15 blur-[80px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-20 size-80 rounded-full bg-indigo-500/15 blur-[90px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/3 size-64 -translate-y-1/2 rounded-full bg-purple-500/10 blur-[100px]" />

      {/* GitHub Grid Matrix Overlay */}
      <div className="github-grid-bg pointer-events-none absolute inset-0 opacity-15" />

      {/* Header bar of the Hero Section */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 border-b border-border/50 pb-4">
        <div className="flex items-center gap-3">
          {/* 3D Computer Logo with Cloud Aura */}
          <div className="relative flex size-10 items-center justify-center rounded-xl border border-primary/40 bg-background/80 p-2 shadow-[0_0_15px_rgba(56,189,248,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-indigo-500/20 blur-sm" />
            <Monitor className="relative size-5 text-primary drop-shadow-[0_0_8px_rgba(56,189,248,0.8)]" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-heading text-base font-semibold tracking-tight text-foreground">
                BARATH.AI Agent Cloud
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                <span className="size-1.5 animate-pulse rounded-full bg-emerald-400" />
                ONLINE · 34 CLOUDS
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Autonomous AI agent orchestration with intelligent multi-model failover
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/agents">
            <Button variant="outline" size="xs" className="gap-1 border-primary/30 text-xs hover:border-primary/60">
              <Bot className="size-3.5 text-primary" />
              Configure Agents
              <ArrowUpRight className="size-3 text-muted-foreground" />
            </Button>
          </Link>
          <button
            type="button"
            onClick={toggleCollapsed}
            aria-label={collapsed ? 'Expand AI Agent workspace' : 'Collapse AI Agent workspace'}
            className="inline-flex items-center gap-1 rounded-lg border border-border/60 bg-background/60 p-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            {collapsed ? <ChevronDown className="size-3.5" /> : <ChevronUp className="size-3.5" />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {!collapsed && (
        <div className="relative z-10 mt-5 grid grid-cols-1 items-center gap-6 lg:grid-cols-12">
          {/* Left Column: 3D Computer Terminal Workstation */}
          <div className="lg:col-span-7">
            <div className="relative rounded-2xl border border-border/80 bg-background/90 shadow-[0_8px_30px_rgba(0,0,0,0.6),inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              {/* Terminal Window Top Bar */}
              <div className="flex items-center justify-between border-b border-border/60 bg-muted/40 px-3 py-2">
                <div className="flex items-center gap-1.5">
                  <span className="size-2.5 rounded-full bg-rose-500/80 shadow-[0_0_5px_rgba(244,63,94,0.5)]" />
                  <span className="size-2.5 rounded-full bg-amber-500/80 shadow-[0_0_5px_rgba(245,158,11,0.5)]" />
                  <span className="size-2.5 rounded-full bg-emerald-500/80 shadow-[0_0_5px_rgba(16,185,129,0.5)]" />
                  <span className="ml-2 font-mono text-[11px] text-muted-foreground">
                    barath@agent-cloud:~ (bash)
                  </span>
                </div>
                <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground/80">
                  <Cpu className="size-3 text-primary" />
                  <span>mesh: active</span>
                </div>
              </div>

              {/* Terminal Screen Body */}
              <div className="space-y-1.5 p-4 font-mono text-xs leading-relaxed">
                <div className="flex items-center gap-2 text-cyan-400">
                  <span className="text-muted-foreground">$</span>
                  <span>barath-agent --connect --cloud-mesh --live</span>
                </div>
                <div className="text-muted-foreground/90">
                  [✓] <span className="text-foreground">AI Core:</span> BARATH.AI Intelligence Engine v2.4 initialized
                </div>
                <div className="text-muted-foreground/90">
                  [✓] <span className="text-cyan-300">Cloud Mesh:</span> 34 free provider tiers aggregated (635 endpoints)
                </div>
                <div className="text-muted-foreground/90">
                  [✓] <span className="text-indigo-300">Agent Routing:</span> Claude Code, Cursor, Cline, Aider ready
                </div>
                <div className="text-muted-foreground/90">
                  [✓] <span className="text-emerald-400">Monthly Allowance:</span> ~7.4 Billion tokens available
                </div>
                <div className="flex items-center gap-2 pt-1 text-primary">
                  <span>&gt; agent listening on</span>
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[11px] text-primary">
                    http://127.0.0.1:3001/v1
                  </span>
                  <span className="inline-block size-2 animate-pulse bg-primary" />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: AI Agent Cloud Telemetry Cards */}
          <div className="grid grid-cols-2 gap-3 lg:col-span-5">
            <div className="group rounded-xl border border-border/70 bg-card/80 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_4px_16px_rgba(56,189,248,0.15)]">
              <div className="flex items-center gap-2 text-primary">
                <Cloud className="size-4 drop-shadow-[0_0_6px_currentColor]" />
                <span className="text-xs font-semibold text-foreground">34 AI Clouds</span>
              </div>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                Google, Groq, Cerebras, Mistral, OpenRouter and 29+ free clouds
              </p>
            </div>

            <div className="group rounded-xl border border-border/70 bg-card/80 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_4px_16px_rgba(56,189,248,0.15)]">
              <div className="flex items-center gap-2 text-indigo-400">
                <Bot className="size-4 drop-shadow-[0_0_6px_currentColor]" />
                <span className="text-xs font-semibold text-foreground">Agent CLIs</span>
              </div>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                Auto-configures Claude Code, Cursor, Codex, Cline, Roo and Aider
              </p>
            </div>

            <div className="group rounded-xl border border-border/70 bg-card/80 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_4px_16px_rgba(56,189,248,0.15)]">
              <div className="flex items-center gap-2 text-emerald-400">
                <Zap className="size-4 drop-shadow-[0_0_6px_currentColor]" />
                <span className="text-xs font-semibold text-foreground">Smart Fallover</span>
              </div>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                Zero rate-limit stalls with automatic fallback & live scoring
              </p>
            </div>

            <div className="group rounded-xl border border-border/70 bg-card/80 p-3.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-[0_4px_16px_rgba(56,189,248,0.15)]">
              <div className="flex items-center gap-2 text-purple-400">
                <Shield className="size-4 drop-shadow-[0_0_6px_currentColor]" />
                <span className="text-xs font-semibold text-foreground">Encrypted Local</span>
              </div>
              <p className="mt-1 text-[11px] leading-tight text-muted-foreground">
                AES-256-GCM encrypted in SQLite; single unified API key
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
