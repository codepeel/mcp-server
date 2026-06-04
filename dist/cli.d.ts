#!/usr/bin/env node
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
declare const command: string;
declare function printHelp(): void;
