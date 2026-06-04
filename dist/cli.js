#!/usr/bin/env node
"use strict";
/**
 * CodePeel CLI
 *
 * Commands:
 *   (no args)      Start the MCP server (used by AI editors)
 *   init           Interactive MCP setup for your editor
 *   init-config    Generate .codepeel.yml from dashboard settings
 *   review         Review a diff from stdin or file
 *   credits        Check your account balance
 *   help           Show this help message
 */
const command = process.argv[2];
switch (command) {
    case 'init':
        import('./init.js').then(m => m.initSetup());
        break;
    case 'init-config':
        import('./initConfig.js').then(m => m.generateLocalConfig());
        break;
    case 'review':
        import('./commands/review.js').then(m => m.reviewCommand());
        break;
    case 'credits':
        import('./commands/credits.js').then(m => m.creditsCommand());
        break;
    case 'help':
    case '--help':
    case '-h':
        printHelp();
        break;
    case 'version':
    case '--version':
    case '-v':
        console.log('codepeel-mcp v1.0.0');
        break;
    default:
        // No command = start MCP server (this is what editors call)
        if (command && !command.startsWith('-')) {
            console.error(`Unknown command: ${command}\n`);
            printHelp();
            process.exit(1);
        }
        import('./server.js').then(m => m.startServer());
        break;
}
function printHelp() {
    console.log(`
  ╭─────────────────────────────────────╮
  │  🔍 CodePeel CLI                    │
  ╰─────────────────────────────────────╯

  Usage: codepeel-mcp [command]

  Commands:
    (none)         Start MCP server (used by AI editors)
    init           Set up MCP in your editor (interactive)
    init-config    Generate .codepeel.yml in current directory
    review         Review code from stdin (pipe git diff)
    credits        Check your review balance
    help           Show this help

  Examples:
    npx @codepeel/mcp-server init
    npx @codepeel/mcp-server init-config
    git diff | npx @codepeel/mcp-server review
    npx @codepeel/mcp-server credits

  Environment:
    CODEPEEL_TOKEN   Your API token (required, starts with cpk_)
                     Get one at: https://codepeel.com/app/settings

  Docs: https://codepeel.com/docs/mcp
`);
}
