import { fail, ok, type ToolResult } from "./result.js";

type RemoteClientOptions = {
    remoteBaseUrl: string;
    authToken: string;
    timeoutMs: number;
};

export function createRemoteClient({ remoteBaseUrl, authToken, timeoutMs }: RemoteClientOptions) {
    function buildUrl(pathname: string, params: Record<string, string>): string {
        const url = new URL(pathname, remoteBaseUrl);
        Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
        return url.toString();
    }

    async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        try {
            return await fetch(url, { ...init, signal: controller.signal });
        } finally {
            clearTimeout(timeout);
        }
    }

    async function parseJsonResponse(res: Response): Promise<Record<string, unknown>> {
        const text = await res.text();
        if (!text) return {};
        return JSON.parse(text) as Record<string, unknown>;
    }

    async function failFromResponse(res: Response): Promise<ToolResult> {
        try {
            const data = await parseJsonResponse(res);
            if (data && data.ok === false && typeof data.error === "string") {
                return fail(String(data.error), typeof data.code === "string" ? data.code : undefined);
            }
        } catch {
            // ignore
        }
        return fail(`remote error: ${res.status} ${res.statusText}`);
    }

    async function postJson(pathname: string, body: Record<string, unknown>): Promise<ToolResult> {
        const url = new URL(pathname, remoteBaseUrl);
        const res = await fetchWithTimeout(url.toString(), {
            method: "POST",
            headers: {
                Authorization: `Bearer ${authToken}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(body),
        });
        if (!res.ok) return failFromResponse(res);
        const data = await parseJsonResponse(res);
        if (data.ok === false && typeof data.error === "string") {
            return fail(String(data.error), typeof data.code === "string" ? data.code : undefined);
        }
        return ok(data);
    }

    return {
        authToken,
        buildUrl,
        fetchWithTimeout,
        parseJsonResponse,
        failFromResponse,
        postJson,
    };
}
