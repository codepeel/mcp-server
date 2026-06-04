import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { reviewCode } from './tools/review.js';
import { generateFix } from './tools/fix.js';
import { askCodePeel } from './tools/chat.js';
import { checkCredits } from './tools/credits.js';
export function startServer() {
    const API_BASE = process.env.CODEPEEL_API_URL || 'https://codepeel.com/api';
    const REVIEW_BASE = process.env.CODEPEEL_REVIEW_URL || 'https://idereview-5ytww7s7ta-uc.a.run.app';
    const server = new Server({ name: 'codepeel', version: '1.0.0' }, { capabilities: { tools: {} } });
    server.setRequestHandler(ListToolsRequestSchema, async () => ({
        tools: [
            {
                name: 'review_code',
                description: 'Review code changes for bugs, security issues, and best practice violations. Pass a unified diff or file contents. Returns findings with severity, explanation, and suggested fixes.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        diff: {
                            type: 'string',
                            description: 'Unified diff of code changes to review. Use `git diff` output or construct manually.',
                        },
                        repo: {
                            type: 'string',
                            description: 'Repository name (e.g. "my-app"). Used for context.',
                            default: 'local',
                        },
                    },
                    required: ['diff'],
                },
            },
            {
                name: 'fix_code',
                description: 'Generate a fix for a specific code issue. Provide the file path, problem description, and optionally the problematic code snippet.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        file: {
                            type: 'string',
                            description: 'File path where the issue exists.',
                        },
                        issue: {
                            type: 'string',
                            description: 'Description of the issue to fix.',
                        },
                        problemCode: {
                            type: 'string',
                            description: 'The problematic code snippet.',
                        },
                        line: {
                            type: 'number',
                            description: 'Line number where the issue is.',
                        },
                        severity: {
                            type: 'string',
                            enum: ['critical', 'high', 'medium', 'low'],
                            description: 'Severity of the issue.',
                            default: 'medium',
                        },
                    },
                    required: ['file', 'issue'],
                },
            },
            {
                name: 'ask_codepeel',
                description: 'Ask CodePeel a question about code. Can analyze code patterns, explain issues, suggest improvements, or answer architecture questions. Optionally provide a diff for context.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        question: {
                            type: 'string',
                            description: 'Your question about the code.',
                        },
                        diff: {
                            type: 'string',
                            description: 'Optional diff or code context to analyze.',
                        },
                    },
                    required: ['question'],
                },
            },
            {
                name: 'check_credits',
                description: 'Check your CodePeel account balance, plan tier, and usage for the current billing period.',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
        ],
    }));
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
        const { name, arguments: args } = request.params;
        const token = process.env.CODEPEEL_TOKEN;
        if (!token) {
            return {
                content: [{
                        type: 'text',
                        text: 'Error: CODEPEEL_TOKEN environment variable is not set. Get your token at https://codepeel.com/app/settings',
                    }],
                isError: true,
            };
        }
        try {
            switch (name) {
                case 'review_code':
                    return await reviewCode(REVIEW_BASE, token, args);
                case 'fix_code':
                    return await generateFix(API_BASE, token, args);
                case 'ask_codepeel':
                    return await askCodePeel(API_BASE, token, args);
                case 'check_credits':
                    return await checkCredits(API_BASE, token);
                default:
                    return {
                        content: [{ type: 'text', text: `Unknown tool: ${name}` }],
                        isError: true,
                    };
            }
        }
        catch (error) {
            return {
                content: [{ type: 'text', text: `Error: ${error.message}` }],
                isError: true,
            };
        }
    });
    async function main() {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('[CodePeel MCP] Server started');
    }
    main().catch((error) => {
        console.error('[CodePeel MCP] Fatal error:', error);
        process.exit(1);
    });
}
