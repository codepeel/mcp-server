/**
 * CLI: codepeel-mcp credits
 * Check your CodePeel account balance and usage.
 *
 * Usage:
 *   npx @codepeel/mcp-server credits
 */

import { checkCredits } from '../tools/credits.js';

const API_BASE = process.env.CODEPEEL_API_URL || 'https://codepeel.com/api';

export async function creditsCommand() {
  const token = process.env.CODEPEEL_TOKEN;

  if (!token) {
    console.error('❌ CODEPEEL_TOKEN not set.');
    console.error('   Get a token at: https://codepeel.com/app/settings?tab=api-tokens');
    console.error('   Then: export CODEPEEL_TOKEN=cpk_your-token-here\n');
    process.exit(1);
  }

  const result = await checkCredits(API_BASE, token);
  const text = result.content[0]?.text || '';

  if (result.isError) {
    console.error(text);
    process.exit(1);
  }

  console.log(text);
}
