#!/usr/bin/env node
/**
 * Interactive MCP setup CLI.
 * Usage: npx @codepeel/mcp-server init
 *
 * Detects editor, prompts for token, writes config automatically.
 */
declare function main(): Promise<void>;
export { main as initSetup };
