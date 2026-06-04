/**
 * Shared utilities for MCP tools — handles credit checks, rate limits, and auth errors.
 */
export interface ToolResult {
    content: Array<{
        type: 'text';
        text: string;
    }>;
    isError?: boolean;
}
/**
 * Check if the user has reviews remaining. Returns null if OK, or an error ToolResult if not.
 */
export declare function checkCreditsBeforeCall(apiBase: string, token: string): Promise<ToolResult | null>;
/**
 * Handle common API error responses and return a user-friendly ToolResult.
 */
export declare function handleApiError(status: number, error: any): ToolResult;
