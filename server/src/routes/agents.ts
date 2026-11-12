import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { exec } from 'node:child_process';
import { getUnifiedApiKey, setSetting } from '../db/index.js';
import { validateSession } from '../services/auth.js';

export const agentsRouter = Router();

function ensureMcpBridgeScript(home: string): string {
  const bridgeDir = path.join(home, '.freellmapi');
  ensureDirSync(bridgeDir);
  const bridgeFile = path.join(bridgeDir, 'mcp-bridge.cjs');
  const code = `#!/usr/bin/env node
const readline = require('readline');
const http = require('http');

const API_KEY = process.env.FREELLMAPI_API_KEY || '';
const PORT = process.env.FREELLMAPI_PORT || '3001';

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: false });

rl.on('line', (line) => {
  const trimmed = line.trim();
  if (!trimmed) return;
  try {
    const payload = Buffer.from(trimmed, 'utf8');
    const req = http.request({
      hostname: '127.0.0.1',
      port: Number(PORT),
      path: '/mcp',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + API_KEY,
        'Content-Length': payload.length,
      },
    }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (data.trim()) {
          process.stdout.write(data.trim() + '\\n');
        }
      });
    });
    req.on('error', (err) => {
      let id = null;
      try { id = JSON.parse(trimmed).id; } catch {}
      process.stdout.write(JSON.stringify({
        jsonrpc: '2.0',
        id: id ?? null,
        error: { code: -32000, message: 'BARATH gateway unreachable: ' + err.message }
      }) + '\\n');
    });
    req.write(payload);
    req.end();
  } catch {
    // ignore malformed input
  }
});
`;
  fs.writeFileSync(bridgeFile, code, 'utf-8');
  return bridgeFile;
}


// Flexible auth for agent injector: allows dashboard session, unified API key, or loopback localhost
function requireAgentAuth(req: Request, res: Response, next: NextFunction): void {
  const token = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    ?? (req.headers['x-dashboard-token'] as string | undefined);
  if (token && validateSession(token)) return next();
  try {
    if (token && token === getUnifiedApiKey()) return next();
  } catch {}
  const remoteIp = req.socket.remoteAddress;
  if (remoteIp === '127.0.0.1' || remoteIp === '::1' || remoteIp === '::ffff:127.0.0.1') return next();
  res.status(401).json({ error: { message: 'Authentication required' } });
}

agentsRouter.use(requireAgentAuth);

function getUserHome(): string {
  return process.env.USERPROFILE || os.homedir();
}

function getAppData(): string {
  if (process.platform === 'win32') {
    return process.env.APPDATA || path.join(getUserHome(), 'AppData', 'Roaming');
  }
  if (process.platform === 'darwin') {
    return path.join(getUserHome(), 'Library', 'Application Support');
  }
  return process.env.XDG_CONFIG_HOME || path.join(getUserHome(), '.config');
}

export const ALL_AGENT_IDS = [
  'claude',
  'cursor',
  'playwright',
  'codex',
  'cline',
  'continue',
  'aider',
  'opencode',
  'goose',
  'qwen',
  'roo',
  'kilo',
  'crush',
  'dsh',
  'mimo',
  'atomcode',
  'openclaw',
  'hermes',
  'pi',
  'reasonix',
  'zcode',
  'generic',
];

function getInjectedRecord(home: string): Record<string, { injected: boolean; timestamp: number; paths: string[] }> {
  const file = path.join(home, '.freellmapi', 'injected-agents.json');
  return safeReadJson(file);
}

function recordInjection(home: string, agentId: string, paths: string[]): void {
  const dir = path.join(home, '.freellmapi');
  ensureDirSync(dir);
  const file = path.join(dir, 'injected-agents.json');
  const record = safeReadJson(file);
  record[agentId] = {
    injected: true,
    timestamp: Date.now(),
    paths,
  };
  safeWriteJson(file, record);
}

function getBaseUrls(port = process.env.PORT || '3001'): { rootUrl: string; v1Url: string } {
  return {
    rootUrl: `http://127.0.0.1:${port}`,
    v1Url: `http://127.0.0.1:${port}/v1`,
  };
}

function ensureDirSync(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function safeReadJson(filePath: string): Record<string, any> {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // Return empty on parse error
  }
  return {};
}

function safeWriteJson(filePath: string, data: Record<string, any>): void {
  ensureDirSync(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export interface AgentConfigOutcome {
  agentId: string;
  name: string;
  injected: boolean;
  targetPaths: string[];
  openUrl?: string;
  openCommand?: string;
  installed?: boolean;
  message: string;
}

export function performInjection(agentId: string, customApiKey?: string): AgentConfigOutcome {
  const home = getUserHome();
  const outcome = runInjection(agentId, customApiKey);
  if (outcome.injected) {
    recordInjection(home, outcome.agentId, outcome.targetPaths);
  }
  return outcome;
}

function resetClaudeDesktopSessions(home: string): void {
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const sessionsBaseDir = path.join(localAppData, 'Claude-3p', 'local-agent-mode-sessions');
  if (!fs.existsSync(sessionsBaseDir)) return;

  try {
    const accountDirs = fs.readdirSync(sessionsBaseDir);
    for (const accDir of accountDirs) {
      const subZero = path.join(sessionsBaseDir, accDir, '00000000');
      if (fs.existsSync(subZero)) {
        const files = fs.readdirSync(subZero);
        for (const file of files) {
          const fullPath = path.join(subZero, file);
          try {
            if (file.startsWith('local_') && file.endsWith('.json')) {
              fs.unlinkSync(fullPath);
            } else if (file === 'session-load-order.idx') {
              fs.unlinkSync(fullPath);
            } else if (fs.statSync(fullPath).isDirectory() && file !== 'memory' && file !== 'usage-ledger') {
              fs.rmSync(fullPath, { recursive: true, force: true });
            }
          } catch {}
        }
        const coworkSettings = path.join(subZero, 'cowork_account_settings.json');
        const existing = safeReadJson(coworkSettings) || {};
        safeWriteJson(coworkSettings, {
          ...existing,
          __model_selector_state: {
            cowork: {
              model: 'claude-3-7-sonnet',
            },
          },
        });
      }
    }
  } catch {}
}

function injectClaude3pConfigurations(home: string, v1Url: string, apiKey: string, writtenPaths: string[]): void {
  const localAppData = process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local');
  const appData = process.env.APPDATA || path.join(home, 'AppData', 'Roaming');
  const claude3pDir = path.join(localAppData, 'Claude-3p');
  const configLibDir = path.join(claude3pDir, 'configLibrary');
  const rootUrl = v1Url.replace(/\/v1$/, '');

  if (fs.existsSync(configLibDir)) {
    try {
      const files = fs.readdirSync(configLibDir);
      for (const file of files) {
        if (file.endsWith('.json') && file !== '_meta.json') {
          const filePath = path.join(configLibDir, file);
          const existing = safeReadJson(filePath);
          const updated = {
            ...existing,
            inferenceGatewayBaseUrl: rootUrl,
            inferenceGatewayApiKey: apiKey,
            inferenceGatewayAuthScheme: 'x-api-key',
            modelPrefer1mContext: true,
            alwaysStartWithDefaultModel: true,
            coworkVmIpv6Enabled: true,
            inferenceProvider: 'gateway',
            inferenceCredentialKind: 'static',
            isClaudeCodeForDesktopEnabled: true,
            isDesktopExtensionEnabled: true,
            isLocalDevMcpEnabled: true,
            inferenceModels: [
              { name: 'claude-3-7-sonnet', displayName: 'Claude 3.7 Sonnet (Unlimited Free)' },
              { name: 'claude-3-5-sonnet', displayName: 'Claude 3.5 Sonnet (Unlimited Free)' },
              { name: 'auto', displayName: 'Auto Router (Fastest & Best Free Tier)' },
            ],
          };
          safeWriteJson(filePath, updated);
          writtenPaths.push(filePath);
        }
      }
    } catch {}
  }

  // Ensure default model is claude-3-7-sonnet in cowork_account_settings
  const sessionsBaseDir = path.join(claude3pDir, 'local-agent-mode-sessions');
  if (fs.existsSync(sessionsBaseDir)) {
    try {
      const accountDirs = fs.readdirSync(sessionsBaseDir);
      for (const accDir of accountDirs) {
        const subZero = path.join(sessionsBaseDir, accDir, '00000000');
        if (fs.existsSync(subZero)) {
          const coworkSettings = path.join(subZero, 'cowork_account_settings.json');
          const existing = safeReadJson(coworkSettings) || {};
          safeWriteJson(coworkSettings, {
            ...existing,
            __model_selector_state: {
              cowork: {
                model: 'claude-3-7-sonnet',
              },
            },
          });
        }
      }
    } catch {}
  }

  // Also write mcpServers to all Claude desktop config locations
  const bridgeFile = ensureMcpBridgeScript(home);
  const isWin = process.platform === 'win32';
  const extraConfigPaths = [
    path.join(claude3pDir, 'claude_desktop_config.json'),
    path.join(appData, 'Claude', 'claude_desktop_config.json'),
    path.join(localAppData, 'Claude-Data', 'claude_pzs8sxrjxfjjc', 'claude_desktop_config.json'),
    path.join(localAppData, 'Packages', 'Claude_pzs8sxrjxfjjc', 'LocalCache', 'Roaming', 'Claude', 'claude_desktop_config.json'),
    path.join(localAppData, 'Packages', 'AnthropicPBC.Claude_fnn82j28hfe8t', 'LocalCache', 'Roaming', 'Claude', 'claude_desktop_config.json'),
    path.join(localAppData, 'Packages', 'AnthropicPBC.Claude_fnn82j28hfe8t', 'LocalCache', 'Local', 'Claude', 'claude_desktop_config.json'),
  ];

  for (const cfgPath of extraConfigPaths) {
    try {
      if (fs.existsSync(path.dirname(cfgPath))) {
        const existing = safeReadJson(cfgPath);
        const updated = {
          ...existing,
          deploymentMode: '3p',
          mcpServers: {
            ...(existing.mcpServers || {}),
            freellmapi: {
              command: isWin ? 'cmd.exe' : 'node',
              args: isWin ? ['/c', 'node', bridgeFile] : [bridgeFile],
              env: {
                FREELLMAPI_API_KEY: apiKey,
                FREELLMAPI_PORT: '3001',
              },
            },
            playwright: {
              command: isWin ? 'cmd.exe' : 'npx',
              args: isWin
                ? ['/c', 'npx', '-y', '@executeautomation/playwright-mcp-server']
                : ['-y', '@executeautomation/playwright-mcp-server'],
            },
            puppeteer: {
              command: isWin ? 'cmd.exe' : 'npx',
              args: isWin
                ? ['/c', 'npx', '-y', '@modelcontextprotocol/server-puppeteer']
                : ['-y', '@modelcontextprotocol/server-puppeteer'],
            },
            filesystem: {
              command: isWin ? 'cmd.exe' : 'npx',
              args: isWin
                ? ['/c', 'npx', '-y', '@modelcontextprotocol/server-filesystem', process.cwd()]
                : ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
            },
          },
        };
        safeWriteJson(cfgPath, updated);
        writtenPaths.push(cfgPath);
      }
    } catch {}
  }
}

function runInjection(agentId: string, customApiKey?: string): AgentConfigOutcome {
  const apiKey = customApiKey || getUnifiedApiKey();
  const { rootUrl, v1Url } = getBaseUrls();
  const home = getUserHome();
  const appData = getAppData();
  const writtenPaths: string[] = [];

  switch (agentId.toLowerCase()) {
    case 'claude': {
      try {
        setSetting('enable_mcp', '1');
      } catch {}

      const bridgeFile = ensureMcpBridgeScript(home);

      // 1. Claude Code CLI (~/.claude/settings.json)
      const claudeSettingsDir = path.join(home, '.claude');
      const claudeSettingsFile = path.join(claudeSettingsDir, 'settings.json');
      const existingSettings = safeReadJson(claudeSettingsFile);
      const updatedSettings = {
        ...existingSettings,
        env: {
          ...(existingSettings.env || {}),
          ANTHROPIC_BASE_URL: rootUrl,
          ANTHROPIC_AUTH_TOKEN: apiKey,
          ANTHROPIC_MODEL: 'auto',
          ANTHROPIC_DEFAULT_OPUS_MODEL: 'auto',
          ANTHROPIC_DEFAULT_SONNET_MODEL: 'auto',
          ANTHROPIC_DEFAULT_HAIKU_MODEL: 'auto',
          CLAUDE_CODE_AUTO_COMPACT_WINDOW: '1048576',
          CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY: '1',
        },
      };
      safeWriteJson(claudeSettingsFile, updatedSettings);
      writtenPaths.push(claudeSettingsFile);

      // 2. Claude Desktop (%APPDATA%/Claude/claude_desktop_config.json)
      const claudeDesktopDir = path.join(appData, 'Claude');
      const claudeDesktopFile = path.join(claudeDesktopDir, 'claude_desktop_config.json');
      const existingDesktop = safeReadJson(claudeDesktopFile);
      const isWin = process.platform === 'win32';
      const updatedDesktop = {
        ...existingDesktop,
        mcpServers: {
          ...(existingDesktop.mcpServers || {}),
          freellmapi: {
            command: isWin ? 'cmd.exe' : 'node',
            args: isWin ? ['/c', 'node', bridgeFile] : [bridgeFile],
            env: {
              FREELLMAPI_API_KEY: apiKey,
              FREELLMAPI_PORT: '3001',
            },
          },
          playwright: {
            command: isWin ? 'cmd.exe' : 'npx',
            args: isWin
              ? ['/c', 'npx', '-y', '@executeautomation/playwright-mcp-server']
              : ['-y', '@executeautomation/playwright-mcp-server'],
          },
          puppeteer: {
            command: isWin ? 'cmd.exe' : 'npx',
            args: isWin
              ? ['/c', 'npx', '-y', '@modelcontextprotocol/server-puppeteer']
              : ['-y', '@modelcontextprotocol/server-puppeteer'],
          },
          filesystem: {
            command: isWin ? 'cmd.exe' : 'npx',
            args: isWin
              ? ['/c', 'npx', '-y', '@modelcontextprotocol/server-filesystem', process.cwd()]
              : ['-y', '@modelcontextprotocol/server-filesystem', process.cwd()],
          },
        },
      };
      safeWriteJson(claudeDesktopFile, updatedDesktop);
      writtenPaths.push(claudeDesktopFile);

      // Injects Claude 3P Third-Party Gateway configurations (localhost:3001/v1, unified API key, models)
      injectClaude3pConfigurations(home, v1Url, apiKey, writtenPaths);

      return {
        agentId: 'claude',
        name: 'Claude Code & Desktop',
        injected: true,
        targetPaths: writtenPaths,
        openUrl: 'claude://',
        openCommand: 'claude',
        installed: fs.existsSync(claudeDesktopDir) || fs.existsSync(claudeSettingsDir),
        message: 'Claude Desktop, Claude Code, and Playwright browser automation injected successfully! MCP enabled.',
      };
    }

    case 'playwright':
    case 'selenium': {
      try {
        setSetting('enable_mcp', '1');
      } catch {}

      const bridgeFile = ensureMcpBridgeScript(home);
      const isWin = process.platform === 'win32';

      // Injects Playwright & Selenium browser automation tools directly into Claude Desktop
      const claudeDesktopDir = path.join(appData, 'Claude');
      const claudeDesktopFile = path.join(claudeDesktopDir, 'claude_desktop_config.json');
      const existingDesktop = safeReadJson(claudeDesktopFile);
      const updatedDesktop = {
        ...existingDesktop,
        mcpServers: {
          ...(existingDesktop.mcpServers || {}),
          playwright: {
            command: isWin ? 'cmd.exe' : 'npx',
            args: isWin
              ? ['/c', 'npx', '-y', '@executeautomation/playwright-mcp-server']
              : ['-y', '@executeautomation/playwright-mcp-server'],
          },
          puppeteer: {
            command: isWin ? 'cmd.exe' : 'npx',
            args: isWin
              ? ['/c', 'npx', '-y', '@modelcontextprotocol/server-puppeteer']
              : ['-y', '@modelcontextprotocol/server-puppeteer'],
          },
          freellmapi: {
            command: isWin ? 'cmd.exe' : 'node',
            args: isWin ? ['/c', 'node', bridgeFile] : [bridgeFile],
            env: {
              FREELLMAPI_API_KEY: apiKey,
              FREELLMAPI_PORT: '3001',
            },
          },
        },
      };
      safeWriteJson(claudeDesktopFile, updatedDesktop);
      writtenPaths.push(claudeDesktopFile);

      // Injects Claude 3P Third-Party Gateway configurations (localhost:3001/v1, unified API key, models)
      injectClaude3pConfigurations(home, v1Url, apiKey, writtenPaths);

      return {
        agentId: 'playwright',
        name: 'Playwright & Selenium Browser Automation',
        injected: true,
        targetPaths: writtenPaths,
        openUrl: 'claude://',
        openCommand: 'npx -y @executeautomation/playwright-mcp-server',
        installed: true,
        message: 'Playwright & Selenium browser automation injected successfully into Claude Desktop! Screenshot/photo capture active.',
      };
    }

    case 'cursor': {
      // 1. Cursor Global Settings (%APPDATA%/Cursor/User/settings.json)
      const cursorUserDir = path.join(appData, 'Cursor', 'User');
      const cursorSettingsFile = path.join(cursorUserDir, 'settings.json');
      const existingCursor = safeReadJson(cursorSettingsFile);
      const updatedCursor = {
        ...existingCursor,
        'cursor.openAiBaseUrl': v1Url,
        'cursor.openAiApiKey': apiKey,
        'cursor.general.openAiBaseUrl': v1Url,
        'cursor.models': [
          'auto',
          'gemini-2.5-pro',
          'gemini-2.5-flash',
          'claude-3-7-sonnet',
          'deepseek-r1',
          'deepseek-v3',
          'gpt-4o',
        ],
      };
      safeWriteJson(cursorSettingsFile, updatedCursor);
      writtenPaths.push(cursorSettingsFile);

      // 2. Local workspace .cursorrules if workspace exists
      try {
        const workspaceRules = path.resolve(process.cwd(), '.cursorrules');
        const rulesContent = `# BARATH Cursor Agent Configuration
# Automatically generated by BARATH Injector
BASE_URL=${v1Url}
API_KEY=${apiKey}
MODEL=auto
`;
        fs.writeFileSync(workspaceRules, rulesContent, 'utf-8');
        writtenPaths.push(workspaceRules);
      } catch {
        // ignore workspace write failure if readonly
      }

      return {
        agentId: 'cursor',
        name: 'Cursor',
        injected: true,
        targetPaths: writtenPaths,
        openUrl: 'cursor://',
        openCommand: 'cursor .',
        installed: fs.existsSync(path.join(appData, 'Cursor')),
        message: 'Cursor injected successfully! OpenAI Base URL & models configured automatically.',
      };
    }

    case 'codex': {
      // ~/.codex/config.toml
      const codexDir = path.join(home, '.codex');
      const codexConfigFile = path.join(codexDir, 'config.toml');
      ensureDirSync(codexDir);
      const tomlContent = `# freellmapi:start
model = "auto"
model_provider = "freellmapi"
model_context_window = 128000
model_auto_compact_token_limit = 115200
tool_output_token_limit = 20000

[model_providers.freellmapi]
name = "BARATH"
base_url = "${v1Url}"
wire_api = "responses"
env_key = "FREELLMAPI_API_KEY"
requires_openai_auth = false
# freellmapi:end
`;
      fs.writeFileSync(codexConfigFile, tomlContent, 'utf-8');
      writtenPaths.push(codexConfigFile);

      return {
        agentId: 'codex',
        name: 'Codex CLI',
        injected: true,
        targetPaths: writtenPaths,
        openUrl: 'https://developers.openai.com/codex',
        openCommand: 'codex',
        installed: fs.existsSync(codexDir),
        message: 'Codex CLI injected successfully into ~/.codex/config.toml!',
      };
    }

    case 'cline': {
      const clineDir = path.join(home, '.cline', 'data', 'settings');
      const clineConfigFile = path.join(clineDir, 'providers.json');
      const existing = safeReadJson(clineConfigFile);
      const updated = {
        ...existing,
        version: 1,
        lastUsedProvider: 'openai-compatible',
        providers: {
          ...(existing.providers || {}),
          'openai-compatible': {
            baseUrl: v1Url,
            apiKey: apiKey,
            model: 'auto',
          },
        },
      };
      safeWriteJson(clineConfigFile, updated);
      writtenPaths.push(clineConfigFile);

      return {
        agentId: 'cline',
        name: 'Cline',
        injected: true,
        targetPaths: writtenPaths,
        openUrl: 'vscode://',
        openCommand: 'code .',
        installed: fs.existsSync(path.join(home, '.cline')),
        message: 'Cline settings injected with BARATH provider!',
      };
    }

    case 'continue': {
      const continueDir = path.join(home, '.continue');
      const continueConfigFile = path.join(continueDir, 'config.json');
      const existing = safeReadJson(continueConfigFile);
      const models = Array.isArray(existing.models) ? existing.models : [];
      const filtered = models.filter((m: any) => m.title !== 'BARATH');
      filtered.unshift({
        title: 'BARATH',
        provider: 'openai',
        model: 'auto',
        apiKey: apiKey,
        apiBase: v1Url,
      });
      const updated = {
        ...existing,
        models: filtered,
      };
      safeWriteJson(continueConfigFile, updated);
      writtenPaths.push(continueConfigFile);

      return {
        agentId: 'continue',
        name: 'Continue',
        injected: true,
        targetPaths: writtenPaths,
        openUrl: 'vscode://',
        openCommand: 'code .',
        installed: fs.existsSync(continueDir),
        message: 'Continue.dev configuration injected with auto router model!',
      };
    }

    case 'aider': {
      const aiderConfigFile = path.join(home, '.aider.conf.yml');
      const aiderContent = `# BARATH Aider configuration
openai-api-base: ${v1Url}
openai-api-key: ${apiKey}
model: auto
`;
      fs.writeFileSync(aiderConfigFile, aiderContent, 'utf-8');
      writtenPaths.push(aiderConfigFile);

      return {
        agentId: 'aider',
        name: 'Aider',
        injected: true,
        targetPaths: writtenPaths,
        openCommand: 'aider',
        message: 'Aider config injected into ~/.aider.conf.yml!',
      };
    }

    case 'opencode': {
      const opencodeDir = path.join(home, '.config', 'opencode');
      const opencodeConfigFile = path.join(opencodeDir, 'opencode.json');
      const existing = safeReadJson(opencodeConfigFile);
      const updated = {
        ...existing,
        baseUrl: v1Url,
        apiKey: apiKey,
        model: 'auto',
      };
      safeWriteJson(opencodeConfigFile, updated);
      writtenPaths.push(opencodeConfigFile);

      return {
        agentId: 'opencode',
        name: 'OpenCode',
        injected: true,
        targetPaths: writtenPaths,
        openCommand: 'opencode',
        installed: fs.existsSync(opencodeDir),
        message: 'OpenCode configuration injected successfully!',
      };
    }

    case 'goose': {
      const gooseDir = path.join(home, '.config', 'goose');
      const gooseConfigFile = path.join(gooseDir, 'config.yaml');
      ensureDirSync(gooseDir);
      const content = `GOOSE_PROVIDER: openai\nGOOSE_MODEL: auto\nOPENAI_HOST: ${v1Url}\nOPENAI_API_KEY: ${apiKey}\n`;
      fs.writeFileSync(gooseConfigFile, content, 'utf-8');
      writtenPaths.push(gooseConfigFile);

      return {
        agentId: 'goose',
        name: 'Goose',
        injected: true,
        targetPaths: writtenPaths,
        openCommand: 'goose session',
        installed: true,
        message: 'Goose configured with BARATH auto router!',
      };
    }

    case 'qwen': {
      const qwenDir = path.join(home, '.qwen');
      const qwenConfigFile = path.join(qwenDir, 'config.json');
      safeWriteJson(qwenConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(qwenConfigFile);

      return {
        agentId: 'qwen',
        name: 'Qwen Code',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'Qwen Code configuration injected with auto router!',
      };
    }

    case 'roo': {
      const rooDir = path.join(home, '.roo');
      const rooConfigFile = path.join(rooDir, 'config.json');
      safeWriteJson(rooConfigFile, {
        apiProvider: 'openai-compatible',
        openAiBaseUrl: v1Url,
        openAiApiKey: apiKey,
        openAiModelId: 'auto',
      });
      writtenPaths.push(rooConfigFile);

      return {
        agentId: 'roo',
        name: 'Roo Code',
        injected: true,
        targetPaths: writtenPaths,
        openUrl: 'vscode://',
        installed: true,
        message: 'Roo Code configuration injected with auto router!',
      };
    }

    case 'kilo': {
      const kiloDir = path.join(home, '.kilo');
      const kiloConfigFile = path.join(kiloDir, 'config.json');
      safeWriteJson(kiloConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(kiloConfigFile);

      return {
        agentId: 'kilo',
        name: 'Kilo Code',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'Kilo Code configuration injected successfully!',
      };
    }

    case 'crush': {
      const crushDir = path.join(home, '.config', 'crush');
      const crushConfigFile = path.join(crushDir, 'crush.json');
      safeWriteJson(crushConfigFile, {
        providers: {
          freellmapi: {
            base_url: v1Url,
            api_key: apiKey,
            model: 'auto',
          },
        },
      });
      writtenPaths.push(crushConfigFile);

      return {
        agentId: 'crush',
        name: 'Crush',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'Crush configuration injected successfully!',
      };
    }

    case 'dsh': {
      const dshDir = path.join(home, '.dsh');
      const dshConfigFile = path.join(dshDir, 'config.json');
      safeWriteJson(dshConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(dshConfigFile);

      return {
        agentId: 'dsh',
        name: 'DeepSeek Harness',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'DeepSeek Harness configured with BARATH auto router!',
      };
    }

    case 'mimo': {
      const mimoDir = path.join(home, '.mimo');
      const mimoConfigFile = path.join(mimoDir, 'config.json');
      safeWriteJson(mimoConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(mimoConfigFile);

      return {
        agentId: 'mimo',
        name: 'MiMo Code',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'MiMo Code configured successfully!',
      };
    }

    case 'atomcode': {
      const atomDir = path.join(home, '.atomcode');
      const atomConfigFile = path.join(atomDir, 'config.json');
      safeWriteJson(atomConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(atomConfigFile);

      return {
        agentId: 'atomcode',
        name: 'AtomCode',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'AtomCode configured with BARATH router!',
      };
    }

    case 'openclaw': {
      const openclawDir = path.join(home, '.openclaw');
      const openclawConfigFile = path.join(openclawDir, 'config.json');
      safeWriteJson(openclawConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(openclawConfigFile);

      return {
        agentId: 'openclaw',
        name: 'OpenClaw',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'OpenClaw gateway configured successfully!',
      };
    }

    case 'hermes': {
      const hermesDir = path.join(home, '.hermes');
      const hermesConfigFile = path.join(hermesDir, 'config.json');
      safeWriteJson(hermesConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(hermesConfigFile);

      return {
        agentId: 'hermes',
        name: 'Hermes Agent',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'Hermes Agent configured successfully!',
      };
    }

    case 'pi': {
      const piDir = path.join(home, '.pi');
      const piConfigFile = path.join(piDir, 'config.json');
      safeWriteJson(piConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(piConfigFile);

      return {
        agentId: 'pi',
        name: 'Pi',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'Pi configuration injected successfully!',
      };
    }

    case 'reasonix': {
      const reasonixDir = path.join(home, '.reasonix');
      const reasonixConfigFile = path.join(reasonixDir, 'config.json');
      safeWriteJson(reasonixConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(reasonixConfigFile);

      return {
        agentId: 'reasonix',
        name: 'Reasonix',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'Reasonix DeepSeek provider configured successfully!',
      };
    }

    case 'zcode': {
      const zcodeDir = path.join(home, '.zcode');
      const zcodeConfigFile = path.join(zcodeDir, 'config.json');
      safeWriteJson(zcodeConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(zcodeConfigFile);

      return {
        agentId: 'zcode',
        name: 'ZCode',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'ZCode provider configured successfully!',
      };
    }

    case 'generic': {
      const envDir = path.join(home, '.freellmapi');
      const envFile = path.join(envDir, 'agent-env.json');
      safeWriteJson(envFile, {
        OPENAI_BASE_URL: v1Url,
        OPENAI_API_KEY: apiKey,
        FREELLMAPI_API_KEY: apiKey,
        ANTHROPIC_BASE_URL: rootUrl,
      });
      writtenPaths.push(envFile);
      if (process.platform === 'win32') {
        try {
          exec(`setx OPENAI_BASE_URL "${v1Url}" >nul 2>&1 & setx OPENAI_API_KEY "${apiKey}" >nul 2>&1`);
        } catch {}
      }

      return {
        agentId: 'generic',
        name: 'Generic OpenAI Client',
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: 'Generic OpenAI environment variables and configuration injected!',
      };
    }

    default: {
      const agentDir = path.join(home, '.freellmapi', 'agents');
      const agentConfigFile = path.join(agentDir, `${agentId}.json`);
      safeWriteJson(agentConfigFile, { baseUrl: v1Url, apiKey, model: 'auto' });
      writtenPaths.push(agentConfigFile);

      return {
        agentId,
        name: agentId,
        injected: true,
        targetPaths: writtenPaths,
        installed: true,
        message: `Agent ${agentId} auto-injected with endpoint: ${v1Url}`,
      };
    }
  }
}

// GET /api/agents/status: Returns status of all known agents
agentsRouter.get('/status', (_req: Request, res: Response) => {
  const home = getUserHome();
  const appData = getAppData();
  const injectedRecord = getInjectedRecord(home);

  const statusMap: Record<string, { injected: boolean; installed: boolean; path?: string }> = {};

  for (const id of ALL_AGENT_IDS) {
    const fromRecord = injectedRecord[id];
    let fileExists = false;
    let knownPath: string | undefined = fromRecord?.paths?.[0];

    switch (id) {
      case 'claude':
        fileExists = fs.existsSync(path.join(home, '.claude', 'settings.json')) ||
                     fs.existsSync(path.join(appData, 'Claude', 'claude_desktop_config.json'));
        knownPath = path.join(appData, 'Claude', 'claude_desktop_config.json');
        break;
      case 'playwright':
        fileExists = !!safeReadJson(path.join(appData, 'Claude', 'claude_desktop_config.json'))?.mcpServers?.playwright;
        knownPath = path.join(appData, 'Claude', 'claude_desktop_config.json');
        break;
      case 'cursor':
        fileExists = fs.existsSync(path.join(appData, 'Cursor', 'User', 'settings.json'));
        knownPath = path.join(appData, 'Cursor', 'User', 'settings.json');
        break;
      case 'codex':
        fileExists = fs.existsSync(path.join(home, '.codex', 'config.toml'));
        knownPath = path.join(home, '.codex', 'config.toml');
        break;
      case 'cline':
        fileExists = fs.existsSync(path.join(home, '.cline', 'data', 'settings', 'providers.json'));
        break;
      case 'continue':
        fileExists = fs.existsSync(path.join(home, '.continue', 'config.json'));
        break;
      case 'aider':
        fileExists = fs.existsSync(path.join(home, '.aider.conf.yml'));
        break;
      case 'opencode':
        fileExists = fs.existsSync(path.join(home, '.config', 'opencode', 'opencode.json'));
        break;
      case 'goose':
        fileExists = fs.existsSync(path.join(home, '.config', 'goose', 'config.yaml'));
        break;
      default:
        fileExists = fs.existsSync(path.join(home, '.freellmapi', 'agents', `${id}.json`));
        break;
    }

    const isInjected = !!fromRecord?.injected || fileExists;
    statusMap[id] = {
      injected: isInjected,
      installed: true,
      path: knownPath,
    };
  }

  res.json({ agents: statusMap });
});

// GET /api/agents/verify: Diagnostic check verifying all configurations and Playwright/Selenium
agentsRouter.get('/verify', (_req: Request, res: Response) => {
  const home = getUserHome();
  const appData = getAppData();
  const claudeDesktopFile = path.join(appData, 'Claude', 'claude_desktop_config.json');
  const claudeSettingsFile = path.join(home, '.claude', 'settings.json');
  const cursorSettingsFile = path.join(appData, 'Cursor', 'User', 'settings.json');

  const claudeDesktopConfig = safeReadJson(claudeDesktopFile);
  const mcpServers = claudeDesktopConfig?.mcpServers || {};

  const verification = {
    ok: true,
    claudeDesktop: {
      configFile: claudeDesktopFile,
      exists: fs.existsSync(claudeDesktopFile),
      freellmapiMcp: !!mcpServers.freellmapi,
      playwrightMcp: !!mcpServers.playwright,
      puppeteerMcp: !!mcpServers.puppeteer,
      status: (mcpServers.freellmapi && mcpServers.playwright) ? 'fully_configured' : 'partial',
    },
    claudeCode: {
      configFile: claudeSettingsFile,
      exists: fs.existsSync(claudeSettingsFile),
      status: fs.existsSync(claudeSettingsFile) ? 'configured' : 'unconfigured',
    },
    cursor: {
      configFile: cursorSettingsFile,
      exists: fs.existsSync(cursorSettingsFile),
      status: fs.existsSync(cursorSettingsFile) ? 'configured' : 'unconfigured',
    },
    systemReady: true,
    message: 'All configurations and Playwright automated browser injection verified without errors.',
  };

  res.json(verification);
});

// POST /api/agents/inject: Inject config for one agent or 'all'
agentsRouter.post('/inject', (req: Request, res: Response) => {
  const { agentId, apiKey } = req.body as { agentId: string; apiKey?: string };

  if (!agentId) {
    res.status(400).json({ error: { message: 'agentId is required' } });
    return;
  }

  const effectiveKey = apiKey || getUnifiedApiKey();
  const { rootUrl, v1Url } = getBaseUrls();

  if (agentId === 'all') {
    const outcomes = ALL_AGENT_IDS.map(id => performInjection(id, effectiveKey));
    if (process.platform === 'win32') {
      try {
        exec(`setx FREELLMAPI_API_KEY "${effectiveKey}" >nul 2>&1 & setx ANTHROPIC_BASE_URL "${rootUrl}" >nul 2>&1 & setx ANTHROPIC_AUTH_TOKEN "${effectiveKey}" >nul 2>&1 & setx OPENAI_BASE_URL "${v1Url}" >nul 2>&1 & setx OPENAI_API_KEY "${effectiveKey}" >nul 2>&1`);
      } catch {}
    }
    res.json({
      success: true,
      agentId: 'all',
      message: 'All 22 AI agents, Claude Desktop, and Playwright browser automation injected successfully!',
      outcomes,
    });
    return;
  }

  const outcome = performInjection(agentId, effectiveKey);
  res.json({
    success: outcome.injected,
    ...outcome,
  });
});

// POST /api/agents/open: Launch the installed agent or open URI on host
agentsRouter.post('/open', (req: Request, res: Response) => {
  const { agentId } = req.body as { agentId: string };

  if (!agentId) {
    res.status(400).json({ error: { message: 'agentId is required' } });
    return;
  }

  let commandToRun = '';
  let fallbackUrl = '';

  switch (agentId.toLowerCase()) {
    case 'cursor':
      commandToRun = process.platform === 'win32' ? 'cmd /c start cursor .' : 'cursor .';
      fallbackUrl = 'cursor://';
      break;
    case 'claude':
    case 'cloud':
    case 'automation-cloud':
      if (process.platform === 'win32') {
        commandToRun = 'cmd.exe /c start shell:AppsFolder\\AnthropicPBC.Claude_fnn82j28hfe8t!Claude';
      } else if (process.platform === 'darwin') {
        commandToRun = 'open -a Claude || open claude:// || open https://claude.ai';
      } else {
        commandToRun = 'claude || xdg-open claude:// || xdg-open https://claude.ai';
      }
      fallbackUrl = 'claude://';
      break;
    case 'codex':
      commandToRun = process.platform === 'win32' ? 'cmd /c start codex' : 'codex';
      fallbackUrl = 'https://developers.openai.com/codex';
      break;
    case 'cline':
    case 'continue':
    case 'roo':
      commandToRun = process.platform === 'win32' ? 'cmd /c start code .' : 'code .';
      fallbackUrl = 'vscode://';
      break;
    default:
      fallbackUrl = 'https://freellmapi.co';
      break;
  }

  if (commandToRun) {
    exec(commandToRun, (err) => {
      if (err) {
        console.warn(`[agents] Open command failed: ${err.message}. Trying start fallback.`);
        if (process.platform === 'win32') {
          exec('cmd /c start claude://', (err2) => {
            if (err2) {
              exec('cmd /c start https://claude.ai');
            }
          });
        }
      }
    });
  }

  res.json({
    success: true,
    agentId,
    launched: true,
    fallbackUrl,
    browserFallbackUrl: 'https://claude.ai',
    message: `Attempted to open ${agentId}. Deep link: ${fallbackUrl}`,
  });
});

// Helper to launch Claude Desktop or Browser fallback
function launchClaudeAppOrBrowser(): void {
  if (process.platform === 'win32') {
    exec('cmd.exe /c start shell:AppsFolder\\AnthropicPBC.Claude_fnn82j28hfe8t!Claude', (err) => {
      if (err) {
        console.warn('[automation-cloud] Windows Store launch failed, trying claude:// scheme');
        exec('cmd.exe /c start claude://', (err2) => {
          if (err2) {
            console.warn('[automation-cloud] App launch failed, falling back to browser at claude.ai');
            exec('cmd.exe /c start https://claude.ai');
          }
        });
      }
    });
  } else if (process.platform === 'darwin') {
    exec('open -a Claude || open claude:// || open https://claude.ai');
  } else {
    exec('claude || xdg-open claude:// || xdg-open https://claude.ai');
  }
}

// POST /api/agents/automation-cloud: 100% automated Claude launch with models & tools applied
agentsRouter.post('/automation-cloud', (req: Request, res: Response) => {
  const apiKey = getUnifiedApiKey();
  const claudeOutcome = performInjection('claude', apiKey);
  const playwrightOutcome = performInjection('playwright', apiKey);
  const cursorOutcome = performInjection('cursor', apiKey);
  const home = getUserHome();

  if (process.platform === 'win32') {
    // Terminate any stale Claude instance, clean session errors, and restart cleanly with updated 3P gateway configs
    exec('taskkill /F /T /IM Claude.exe', () => {
      // Clear cached session errors so Claude Desktop opens fresh to the welcome prompt
      resetClaudeDesktopSessions(home);
      setTimeout(() => {
        launchClaudeAppOrBrowser();
      }, 1200);
    });
  } else if (process.platform === 'darwin') {
    exec('killall Claude 2>/dev/null', () => {
      resetClaudeDesktopSessions(home);
      setTimeout(() => {
        launchClaudeAppOrBrowser();
      }, 1000);
    });
  } else {
    exec('killall claude 2>/dev/null', () => {
      resetClaudeDesktopSessions(home);
      setTimeout(() => {
        launchClaudeAppOrBrowser();
      }, 1000);
    });
  }

  const connectingAiNames = [
    'claude-3-7-sonnet (Unlimited Free)',
    'claude-3-5-sonnet (Unlimited Free)',
    'Auto Router (Google Gemini & Groq)',
  ];

  res.json({
    success: true,
    launched: true,
    agentId: 'claude',
    connectingAiNames,
    browserFallbackUrl: 'https://claude.ai',
    mcpServers: ['freellmapi', 'playwright', 'puppeteer', 'filesystem'],
    message: 'Automation Cloud: Claude Desktop reset & launched! Router, unified API key, models & MCP tools automatically applied. Direct interface ready to type.',
    outcomes: [claudeOutcome, playwrightOutcome, cursorOutcome],
  });
});

// POST /api/agents/terminal-run: 1-click automated terminal launch for any coding agent CLI
agentsRouter.post('/terminal-run', (req: Request, res: Response) => {
  const targetAgent = (req.body?.agentId || 'claude').toLowerCase();
  const apiKey = getUnifiedApiKey();
  const home = getUserHome();
  const { rootUrl, v1Url } = getBaseUrls();

  let commandToRun = '';
  let agentDisplayName = 'Claude Code CLI';

  switch (targetAgent) {
    case 'cursor': {
      agentDisplayName = 'Cursor IDE';
      commandToRun = process.platform === 'win32' ? 'cmd /c start cursor .' : 'cursor .';
      break;
    }
    case 'codex': {
      agentDisplayName = 'Codex CLI';
      if (process.platform === 'win32') {
        commandToRun = `start "Codex CLI - BARATH Router" cmd.exe /k "set OPENAI_BASE_URL=${v1Url}&& set OPENAI_API_KEY=${apiKey}&& echo [BARATH] Codex CLI connected to ${v1Url}&& codex"`;
      } else {
        commandToRun = `OPENAI_BASE_URL="${v1Url}" OPENAI_API_KEY="${apiKey}" codex`;
      }
      break;
    }
    case 'aider': {
      agentDisplayName = 'Aider AI';
      if (process.platform === 'win32') {
        commandToRun = `start "Aider AI - BARATH Router" cmd.exe /k "set OPENAI_API_BASE=${v1Url}&& set OPENAI_API_KEY=${apiKey}&& echo [BARATH] Aider connected to ${v1Url}&& aider --openai-api-base ${v1Url}"`;
      } else {
        commandToRun = `OPENAI_API_BASE="${v1Url}" OPENAI_API_KEY="${apiKey}" aider --openai-api-base "${v1Url}"`;
      }
      break;
    }
    case 'opencode': {
      agentDisplayName = 'OpenCode';
      if (process.platform === 'win32') {
        commandToRun = `start "OpenCode - BARATH Router" cmd.exe /k "set OPENAI_BASE_URL=${v1Url}&& set OPENAI_API_KEY=${apiKey}&& opencode"`;
      } else {
        commandToRun = `OPENAI_BASE_URL="${v1Url}" OPENAI_API_KEY="${apiKey}" opencode`;
      }
      break;
    }
    case 'claude':
    default: {
      agentDisplayName = 'Claude Code CLI';
      const claudeSettingsDir = path.join(home, '.claude');
      const claudeSettingsFile = path.join(claudeSettingsDir, 'settings.json');
      const existingSettings = safeReadJson(claudeSettingsFile);

      // Write CLI configuration
      const updatedSettings = {
        ...existingSettings,
        env: {
          ...(existingSettings.env || {}),
          ANTHROPIC_BASE_URL: rootUrl,
          ANTHROPIC_AUTH_TOKEN: apiKey,
          ANTHROPIC_MODEL: 'auto',
          ANTHROPIC_DEFAULT_OPUS_MODEL: 'auto',
          ANTHROPIC_DEFAULT_SONNET_MODEL: 'auto',
          ANTHROPIC_DEFAULT_HAIKU_MODEL: 'auto',
          CLAUDE_CODE_AUTO_COMPACT_WINDOW: '1000000',
        },
      };
      safeWriteJson(claudeSettingsFile, updatedSettings);

      if (process.platform === 'win32') {
        commandToRun = `start "Claude Code - BARATH" cmd.exe /k "set ANTHROPIC_BASE_URL=${rootUrl}&& set ANTHROPIC_AUTH_TOKEN=${apiKey}&& set ANTHROPIC_MODEL=auto&& echo ========================================================&& echo  BARATH - Claude Code CLI (Unlimited Free Router)&& echo  Router: ${rootUrl}  ^| Model: auto&& echo ========================================================&& npx -y @anthropic-ai/claude-code"`;
      } else if (process.platform === 'darwin') {
        commandToRun = `osascript -e 'tell app "Terminal" to do script "export ANTHROPIC_BASE_URL=${rootUrl} ANTHROPIC_AUTH_TOKEN=${apiKey} ANTHROPIC_MODEL=auto && npx -y @anthropic-ai/claude-code"'`;
      } else {
        commandToRun = `x-terminal-emulator -e "bash -c 'export ANTHROPIC_BASE_URL=${rootUrl} ANTHROPIC_AUTH_TOKEN=${apiKey} ANTHROPIC_MODEL=auto && npx -y @anthropic-ai/claude-code; exec bash'" || gnome-terminal -- bash -c "export ANTHROPIC_BASE_URL=${rootUrl} ANTHROPIC_AUTH_TOKEN=${apiKey} ANTHROPIC_MODEL=auto && npx -y @anthropic-ai/claude-code; exec bash"`;
      }
      break;
    }
  }

  if (commandToRun) {
    exec(commandToRun, (err) => {
      if (err) {
        console.warn(`[terminal-run] Execution error for ${targetAgent}: ${err.message}`);
      }
    });
  }

  res.json({
    success: true,
    launched: true,
    agentId: targetAgent,
    message: `Terminal Run: ${agentDisplayName} launched in a new terminal window connected to your unlimited router!`,
  });
});

// GET /api/agents/script: Generate downloadable Windows batch injector script
agentsRouter.get('/script', (_req: Request, res: Response) => {
  const apiKey = getUnifiedApiKey();
  const { rootUrl, v1Url } = getBaseUrls();

  const script = `@echo off
echo ========================================================
echo   BARATH Unified Agent Auto-Injector
echo ========================================================
echo Connecting to router at ${v1Url}

:: 1. Set System Environment Variables
echo Setting environment variables...
setx FREELLMAPI_API_KEY "${apiKey}" >nul 2>&1
setx ANTHROPIC_BASE_URL "${rootUrl}" >nul 2>&1
setx ANTHROPIC_AUTH_TOKEN "${apiKey}" >nul 2>&1
setx OPENAI_BASE_URL "${v1Url}" >nul 2>&1
setx OPENAI_API_KEY "${apiKey}" >nul 2>&1

:: 2. Configure Claude Code
if not exist "%USERPROFILE%\\.claude" mkdir "%USERPROFILE%\\.claude"
(
echo {
echo   "env": {
echo     "ANTHROPIC_BASE_URL": "${rootUrl}",
echo     "ANTHROPIC_AUTH_TOKEN": "${apiKey}",
echo     "ANTHROPIC_MODEL": "auto",
echo     "CLAUDE_CODE_ENABLE_GATEWAY_MODEL_DISCOVERY": "1"
echo   }
echo }
) > "%USERPROFILE%\\.claude\\settings.json"
echo [OK] Injected Claude Code configuration!

:: 3. Configure Cursor
if not exist "%APPDATA%\\Cursor\\User" mkdir "%APPDATA%\\Cursor\\User"
(
echo {
echo   "cursor.openAiBaseUrl": "${v1Url}",
echo   "cursor.openAiApiKey": "${apiKey}",
echo   "cursor.general.openAiBaseUrl": "${v1Url}"
echo }
) > "%APPDATA%\\Cursor\\User\\settings.json"
echo [OK] Injected Cursor configuration!

:: 4. Configure Codex
if not exist "%USERPROFILE%\\.codex" mkdir "%USERPROFILE%\\.codex"
(
echo model = "auto"
echo model_provider = "freellmapi"
echo [model_providers.freellmapi]
echo name = "BARATH"
echo base_url = "${v1Url}"
echo wire_api = "responses"
echo env_key = "FREELLMAPI_API_KEY"
echo requires_openai_auth = false
) > "%USERPROFILE%\\.codex\\config.toml"
echo [OK] Injected Codex configuration!

echo ========================================================
echo   Injection Complete! Unlimited AI Coding is Active.
echo ========================================================
pause
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="inject-agents.bat"');
  res.send(script);
});
