interface FixArgs {
    file: string;
    issue: string;
    problemCode?: string;
    line?: number;
    severity?: string;
}
export declare function generateFix(apiBase: string, token: string, args: FixArgs): Promise<import("./shared.js").ToolResult>;
export {};
