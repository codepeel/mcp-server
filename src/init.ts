#!/usr/bin/env node

/**
 * Interactive MCP setup CLI.
 * Usage: npx @codepeel/mcp-server init
 *
 * Detects editor, prompts for token, writes config automatically.
 */

import { createInterface } from 'readline';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';
import { execSync } from 'child_process';

const rl = createInterface({ input: process.stdin, output: process.stdout });

function ask(question: string): Promise<string> {
  return new Promise((resolve) => rl.question(question, resolve));
}

function pick(question: string, options: string[]): Promise<number> {
  return new Promise((resolve) => {
    console.log(`\n${question}`);
    options.forEach((opt, i) => console.log(`  ${i + 1}. ${opt}`));
    rl.question(`\nChoice (1-${options.length}): `, (answer) => {
      const idx = parseInt(answer, 10) - 1;
      resolve(idx >= 0 && idx < options.length ? idx : 0);
    });
  });
}

interface EditorConfig {
  name: string;
  configPath: () => string;
  configKey: string;
}

const EDITORS: EditorConfig[] = [
  {
    name: 'Kiro',
    configPath: () => join(process.cwd(), '.kiro', 'settings', 'mcp.json'),
    configKey: 'mcpServers',
  },
  {
    name: 'Claude Code',
    configPath: () => {
      const platform = process.platform;
      if (platform === 'win32') return join(homedir(), 'AppData', 'Roaming', 'Claude', 'claude_desktop_config.json');
      if (platform === 'darwin') return join(homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
      return join(homedir(), '.config', 'claude', 'claude_desktop_config.json');
    },
    configKey: 'mcpServers',
  },
  {
    name: 'Cursor',
    configPath: () => join(process.cwd(), '.cursor', 'mcp.json'),
    configKey: 'mcpServers',
  },
  {
    name: 'Cline (VS Code)',
    configPath: () => {
      const platform = process.platform;
      if (platform === 'win32') return join(homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
      if (platform === 'darwin') return join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
      return join(homedir(), '.config', 'Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json');
    },
    configKey: 'mcpServers',
  },
  {
    name: 'Roo (VS Code)',
    configPath: () => {
      const platform = process.platform;
      if (platform === 'win32') return join(homedir(), 'AppData', 'Roaming', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
      if (platform === 'darwin') return join(homedir(), 'Library', 'Application Support', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
      return join(homedir(), '.config', 'Code', 'User', 'globalStorage', 'rooveterinaryinc.roo-cline', 'settings', 'cline_mcp_settings.json');
    },
    configKey: 'mcpServers',
  },
];

const CODEPEEL_SERVER_CONFIG = {
  command: 'npx',
  args: ['@codepeel/mcp-server'],
  env: { CODEPEEL_TOKEN: '' },
};

async function main() {
  console.log('\n🔍 CodePeel MCP Setup\n');
  console.log('This will configure CodePeel as an MCP tool in your AI editor.\n');

  // 1. Pick editor
  const editorIdx = await pick('Which editor are you using?', EDITORS.map(e => e.name));
  const editor = EDITORS[editorIdx];

  // 2. Get token
  console.log(`\n📋 You need a CodePeel API token.`);
  console.log(`   Get one at: https://codepeel.com/app/settings?tab=api-tokens\n`);

  const openBrowser = await ask('Open browser to create a token? (y/n): ');
  if (openBrowser.toLowerCase() === 'y') {
    try {
      const url = 'https://codepeel.com/app/settings?tab=api-tokens';
      if (process.platform === 'win32') execSync(`start "" "${url}"`, { stdio: 'ignore' });
      else if (process.platform === 'darwin') execSync(`open "${url}"`, { stdio: 'ignore' });
      else execSync(`xdg-open "${url}"`, { stdio: 'ignore' });
    } catch { /* ignore */ }
  }

  const token = await ask('\nPaste your API token (starts with cpk_): ');

  if (!token.startsWith('cpk_')) {
    console.log('\n❌ Invalid token. Must start with "cpk_". Run this command again.');
    rl.close();
    process.exit(1);
  }

  // 3. Write config
  const configPath = editor.configPath();
  const configDir = join(configPath, '..');

  // Ensure directory exists
  if (!existsSync(configDir)) {
    mkdirSync(configDir, { recursive: true });
    console.log(`\n📁 Created directory: ${configDir}`);
  }

  // Read existing config or start fresh
  let config: any = {};
  if (existsSync(configPath)) {
    try {
      config = JSON.parse(readFileSync(configPath, 'utf-8'));
      console.log(`\n📄 Found existing config at: ${configPath}`);
    } catch {
      config = {};
    }
  }

  // Add CodePeel server
  if (!config[editor.configKey]) {
    config[editor.configKey] = {};
  }

  config[editor.configKey].codepeel = {
    ...CODEPEEL_SERVER_CONFIG,
    env: { CODEPEEL_TOKEN: token },
  };

  writeFileSync(configPath, JSON.stringify(config, null, 2));

  console.log(`\n✅ Done! CodePeel MCP server configured for ${editor.name}.`);
  console.log(`   Config written to: ${configPath}`);
  console.log(`\n🚀 Restart ${editor.name} to activate the tools.`);
  console.log(`\n   Available tools:`);
  console.log(`   • review_code  — Review diffs for bugs and security issues`);
  console.log(`   • fix_code     — Generate fixes for specific issues`);
  console.log(`   • ask_codepeel — Ask questions about code`);
  console.log(`   • check_credits — Check your usage and plan\n`);

  rl.close();
}

// Entry point — only run if called with "init" argument
const args = process.argv.slice(2);
if (args[0] === 'init') {
  main().catch((e) => {
    console.error('Setup failed:', e.message);
    process.exit(1);
  });
}

export { main as initSetup };
