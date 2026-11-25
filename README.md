# CodePeel MCP Server

[![codepeel/mcp-server MCP server](https://glama.ai/mcp/servers/codepeel/mcp-server/badges/score.svg)](https://glama.ai/mcp/servers/codepeel/mcp-server)

AI code review tools for Claude Code, Cline, Roo, and other MCP-compatible agents.

## What it does

When you're vibe coding with an AI agent, CodePeel acts as a second opinion: reviewing the generated code for bugs, security issues, and bad patterns before you commit.

## Tools

| Tool | Description |
|------|-------------|
| `review_code` | Review a diff for bugs, security issues, and best practices |
| `fix_code` | Generate a fix for a specific code issue |
| `ask_codepeel` | Ask questions about code patterns, architecture, etc. |
| `check_credits` | Check your account balance and usage |

## Setup

### 1. Get your API token

1. Sign in at [codepeel.com](https://codepeel.com)
2. Go to **Settings → API Tokens**
3. Click **Create Token** and copy the token (starts with `cpk_`)

API tokens don't expire — they work until you revoke them.

### 2. Configure MCP

Add to your MCP config (`.kiro/settings/mcp.json`, `claude_desktop_config.json`, or Cline settings):

```json
{
  "mcpServers": {
    "codepeel": {
      "command": "npx",
      "args": ["-y", "github:codepeel/mcp-server"],
      "env": {
        "CODEPEEL_TOKEN": "cpk_your_token_here"
      }
    }
  }
}
```

### 3. Use it

The AI agent will automatically have access to CodePeel's review tools. You can ask it to:

- "Review my recent changes for bugs"
- "Check this diff for security issues"
- "Fix the null pointer issue in auth.ts"
- "How many reviews do I have left?"

## Example Usage

### Review code changes

```
Agent: I'll review your changes using CodePeel.
[calls review_code with git diff output]

CodePeel found 3 issues:
🟠 Potential null pointer in user.ts:45
🟡 Missing error handling in api.ts:23
🔵 Unused import in utils.ts:1
```

### Self-review during vibe coding

The AI can review its own output before presenting it to you:

```
You: Build a login form with validation
Agent: [writes code, then calls review_code on its own output]
Agent: I found a potential XSS issue in my implementation. Let me fix that...
[calls fix_code, applies the fix]
Agent: Here's the login form: I caught and fixed a security issue during generation.
```

## CLI Commands

```bash
npx -y github:codepeel/mcp-server init          # Interactive editor setup
npx -y github:codepeel/mcp-server init-config   # Generate .codepeel.yml
npx -y github:codepeel/mcp-server credits       # Check your balance
git diff | npx -y github:codepeel/mcp-server review  # Review from stdin
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `CODEPEEL_TOKEN` | Yes | Your API token from Settings (starts with `cpk_`) |
| `CODEPEEL_API_URL` | No | API base URL (default: `https://codepeel.com/api`) |
| `CODEPEEL_REVIEW_URL` | No | Review endpoint URL (default: Firebase function) |

## Troubleshooting

| Error | Fix |
|-------|-----|
| "Token expired" | You're using a Firebase ID token instead of an API token. Create a `cpk_` token in Settings. |
| "Invalid token" | Check that your token starts with `cpk_` and hasn't been revoked. |
| "No credits remaining" | Upgrade your plan or wait for credits to reset. |

## License

MIT
