import { describe, it, expect, beforeAll } from 'vitest';
import type { Express } from 'express';
import { createApp } from '../../app.js';
import { initDb } from '../../db/index.js';
import { ALL_AGENT_IDS } from '../../routes/agents.js';

let app: Express;

beforeAll(() => {
  initDb(':memory:');
  app = createApp();
});

async function apiRequest(path: string, method = 'GET', body?: any) {
  const server = app.listen(0, '127.0.0.1');
  if (!server.listening) await new Promise<void>(resolve => server.once('listening', () => resolve()));
  const addr = server.address() as { port: number };
  const res = await fetch(`http://127.0.0.1:${addr.port}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  server.close();
  return { status: res.status, data };
}

describe('Agents Automation & Cloud Endpoints', () => {
  it('reports all 22 catalog agents in /api/agents/status', async () => {
    const { status, data } = await apiRequest('/api/agents/status');
    expect(status).toBe(200);
    expect(Object.keys(data.agents).length).toBe(ALL_AGENT_IDS.length);
    for (const id of ALL_AGENT_IDS) {
      expect(data.agents[id]).toBeDefined();
    }
  });

  it('injects all 22 agents at once when agentId is "all"', async () => {
    const { status, data } = await apiRequest('/api/agents/inject', 'POST', { agentId: 'all' });
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.outcomes.length).toBe(ALL_AGENT_IDS.length);
    for (const outcome of data.outcomes) {
      expect(outcome.injected).toBe(true);
    }
  });

  it('runs automation-cloud launch and returns connected models and MCP tools', async () => {
    const { status, data } = await apiRequest('/api/agents/automation-cloud', 'POST', {});
    expect(status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.launched).toBe(true);
    expect(Array.isArray(data.connectingAiNames)).toBe(true);
    expect(data.connectingAiNames.length).toBeGreaterThan(0);
    expect(data.mcpServers).toContain('freellmapi');
    expect(data.mcpServers).toContain('playwright');
  });
});
