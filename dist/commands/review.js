/**
 * CLI: codepeel-mcp review
 * Reads a diff from stdin and runs a code review.
 *
 * Usage:
 *   git diff | npx @codepeel/mcp-server review
 *   git diff --cached | npx @codepeel/mcp-server review
 *   cat changes.patch | npx @codepeel/mcp-server review
 */
import { reviewCode } from '../tools/review.js';
const API_BASE = process.env.CODEPEEL_API_URL || 'https://codepeel.com/api';
const REVIEW_BASE = process.env.CODEPEEL_REVIEW_URL || 'https://idereview-5ytww7s7ta-uc.a.run.app';
export async function reviewCommand() {
    const token = process.env.CODEPEEL_TOKEN;
    if (!token) {
        console.error('❌ CODEPEEL_TOKEN not set.');
        console.error('   Get a token at: https://codepeel.com/app/settings?tab=api-tokens');
        console.error('   Then: export CODEPEEL_TOKEN=cpk_your-token-here\n');
        process.exit(1);
    }
    // Read diff from stdin
    const chunks = [];
    const stdin = process.stdin;
    if (stdin.isTTY) {
        console.error('❌ No input. Pipe a diff into this command:');
        console.error('   git diff | npx @codepeel/mcp-server review');
        console.error('   git diff --cached | npx @codepeel/mcp-server review\n');
        process.exit(1);
    }
    for await (const chunk of stdin) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const diff = Buffer.concat(chunks).toString('utf-8');
    if (!diff.trim()) {
        console.log('✅ No changes to review (empty diff).');
        process.exit(0);
    }
    console.error('🔍 Reviewing...\n');
    const result = await reviewCode(REVIEW_BASE, token, { diff, repo: 'local' });
    const text = result.content[0]?.text || '';
    if (result.isError) {
        console.error(text);
        process.exit(1);
    }
    console.log(text);
}
