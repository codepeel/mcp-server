interface ReviewArgs {
    diff: string;
    repo?: string;
}
export declare function reviewCode(apiBase: string, token: string, args: ReviewArgs): Promise<import("./shared.js").ToolResult>;
export {};
