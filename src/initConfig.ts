#!/usr/bin/env node

/**
 * Generate .codepeel.yml in the current directory from dashboard settings.
 * Usage: npx @codepeel/mcp-server init-config
 */

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const API_BASE = process.env.CODEPEEL_API_URL || 'https://codepeel.com/api';

export async function generateLocalConfig() {
  const token = process.env.CODEPEEL_TOKEN;

  if (!token) {
    console.error('\n❌ CODEPEEL_TOKEN not set.');
    console.error('   Set it: export CODEPEEL_TOKEN=cpk_your-token-here');
    console.error('   Get one: https://codepeel.com/app/settings?tab=api-tokens\n');
    process.exit(1);
  }

  const configPath = join(process.cwd(), '.codepeel.yml');

  if (existsSync(configPath)) {
    console.error('\n⚠️  .codepeel.yml already exists in this directory.');
    console.error('   Delete it first if you want to regenerate.\n');
    process.exit(1);
  }

  console.log('\n🔧 Generating .codepeel.yml from your dashboard settings...\n');

  try {
    const response = await fetch(`${API_BASE}/config/generate`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: response.statusText }));
      console.error(`❌ Failed: ${err.error || response.statusText}`);
      process.exit(1);
    }

    const { yaml } = await response.json();

    writeFileSync(configPath, yaml);

    console.log('✅ Created .codepeel.yml');
    console.log(`   Path: ${configPath}`);
    console.log('\n   Edit it to customize, then commit to your repo.');
    console.log('   Docs: https://codepeel.com/docs/configuration\n');
  } catch (e: any) {
    console.error(`❌ Error: ${e.message}`);
    process.exit(1);
  }
}
