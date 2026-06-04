interface ChatArgs {
    question: string;
    diff?: string;
}
export declare function askCodePeel(apiBase: string, token: string, args: ChatArgs): Promise<import("./shared.js").ToolResult | {
    content: {
        type: "text";
        text: any;
    }[];
}>;
export {};
