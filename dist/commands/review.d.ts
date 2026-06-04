/**
 * CLI: codepeel-mcp review
 * Reads a diff from stdin and runs a code review.
 *
 * Usage:
 *   git diff | npx @codepeel/mcp-server review
 *   git diff --cached | npx @codepeel/mcp-server review
 *   cat changes.patch | npx @codepeel/mcp-server review
 */
export declare function reviewCommand(): Promise<void>;
