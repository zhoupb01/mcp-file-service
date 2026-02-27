import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export type ToolResult = CallToolResult;

type ErrorResult = {
    ok: false;
    error: string;
    code?: string;
};

export function ok(result: Record<string, unknown>, message?: string): ToolResult {
    return {
        content: [{ type: "text", text: message ?? JSON.stringify(result) }],
        structuredContent: result,
    };
}

export function fail(error: string, code?: string): ToolResult {
    const result: ErrorResult = { ok: false, error, code };
    return {
        content: [{ type: "text", text: `error: ${error}` }],
        structuredContent: result,
    };
}
