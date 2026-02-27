#!/usr/bin/env node
import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

function readArg(name: string): string | undefined {
    const prefix = `--${name}=`;
    for (const arg of process.argv.slice(2)) {
        if (arg === `--${name}`) return "true";
        if (arg.startsWith(prefix)) return arg.slice(prefix.length);
    }
    return undefined;
}

const REMOTE_BASE_URL = readArg("remote-base-url") || process.env.REMOTE_BASE_URL || "http://localhost:8080";
const AUTH_TOKEN = "mcp-file-service-token";
const TIMEOUT_MS = Number(process.env.TIMEOUT_MS || 30000);

type ToolResult = CallToolResult;

type ErrorResult = {
    ok: false;
    error: string;
    code?: string;
};

function ok(result: Record<string, unknown>, message?: string): ToolResult {
    return {
        content: [{ type: "text", text: message ?? JSON.stringify(result) }],
        structuredContent: result,
    };
}

function fail(error: string, code?: string): ToolResult {
    const result: ErrorResult = { ok: false, error, code };
    return {
        content: [{ type: "text", text: `error: ${error}` }],
        structuredContent: result,
    };
}

function resolveLocalPath(localPath: string): string {
    return path.resolve(process.cwd(), localPath);
}

function buildUrl(pathname: string, params: Record<string, string>): string {
    const url = new URL(pathname, REMOTE_BASE_URL);
    Object.entries(params).forEach(([key, value]) => url.searchParams.set(key, value));
    return url.toString();
}

async function fetchWithTimeout(url: string, init: RequestInit): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
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
    const url = new URL(pathname, REMOTE_BASE_URL);
    const res = await fetchWithTimeout(url.toString(), {
        method: "POST",
        headers: {
            Authorization: `Bearer ${AUTH_TOKEN}`,
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

function createServer(): McpServer {
    const server = new McpServer({
        name: "mcp-file-adapter",
        version: "0.1.0",
    });

    server.registerTool(
        "list_files",
        {
            description:
                "列出远程目录下的条目：path 为远程相对路径（空字符串表示根目录），返回 name/type/size/mtimeMs。",
            inputSchema: z.object({
                path: z.string(),
            }),
            outputSchema: z.object({
                ok: z.boolean(),
                entries: z.array(
                    z.object({
                        name: z.string(),
                        type: z.enum(["file", "dir"]),
                        size: z.number().optional(),
                        mtimeMs: z.number(),
                    })
                ).optional(),
                error: z.string().optional(),
                code: z.string().optional(),
            }),
        },
        async ({ path: relPath }: { path: string }): Promise<ToolResult> => {
            const url = buildUrl("/list", { path: relPath });
            const res = await fetchWithTimeout(url, {
                method: "GET",
                headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
            });
            if (!res.ok) return failFromResponse(res);
            const data = await parseJsonResponse(res);
            if (data.ok === false && typeof data.error === "string") {
                return fail(String(data.error), typeof data.code === "string" ? data.code : undefined);
            }
            return ok(data);
        }
    );

    server.registerTool(
        "dir_mkdir",
        {
            description: "在远程创建目录：path 为远程相对路径，recursive 控制是否递归创建父目录（默认 true）。",
            inputSchema: z.object({
                path: z.string(),
                recursive: z.boolean().optional(),
            }),
            outputSchema: z.object({
                ok: z.boolean(),
                error: z.string().optional(),
                code: z.string().optional(),
            }),
        },
        async ({ path: relPath, recursive }: { path: string; recursive?: boolean }): Promise<ToolResult> => {
            return postJson("/mkdir", { path: relPath, recursive: recursive ?? true });
        }
    );

    server.registerTool(
        "upload_file",
        {
            description:
                "上传本地文件到远程：local_path 为本地文件路径（相对路径会基于当前工作目录解析），remote_path 为远程相对路径；overwrite 控制是否覆盖，mkdirs 控制是否创建父目录。",
            inputSchema: z.object({
                local_path: z.string(),
                remote_path: z.string(),
                overwrite: z.boolean().optional(),
                mkdirs: z.boolean().optional(),
            }),
            outputSchema: z.object({
                ok: z.boolean(),
                remote_path: z.string().optional(),
                local_path: z.string().optional(),
                size: z.number().optional(),
                error: z.string().optional(),
                code: z.string().optional(),
            }),
        },
        async (
            {
                local_path: localPath,
                remote_path: remotePath,
                overwrite,
                mkdirs,
            }: {
                local_path: string;
                remote_path: string;
                overwrite?: boolean;
                mkdirs?: boolean;
            }
        ): Promise<ToolResult> => {
            try {
                const localFull = resolveLocalPath(localPath);
                const stat = await fs.stat(localFull);
                if (!stat.isFile()) return fail("invalid local path", "EISDIR");
                const url = buildUrl("/upload", {
                    path: remotePath,
                    overwrite: overwrite ? "1" : "0",
                    mkdirs: mkdirs ? "1" : "0",
                });
                const body = Readable.toWeb(createReadStream(localFull));
                const res = await fetchWithTimeout(url, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${AUTH_TOKEN}`,
                        "Content-Type": "application/octet-stream",
                    },
                    body,
                    duplex: "half",
                });
                if (!res.ok) return failFromResponse(res);
                const data = await parseJsonResponse(res);
                if (data.ok === false && typeof data.error === "string") {
                    return fail(String(data.error), typeof data.code === "string" ? data.code : undefined);
                }
                return ok({
                    ok: true,
                    local_path: localPath,
                    remote_path: remotePath,
                    size: stat.size,
                });
            } catch (err) {
                const error = err instanceof Error ? err.message : "unknown error";
                return fail(error);
            }
        }
    );

    server.registerTool(
        "download_file",
        {
            description:
                "下载远程文件到本地：remote_path 为远程相对路径，local_path 为本地目标路径（相对路径会基于当前工作目录解析）；overwrite 控制是否覆盖，mkdirs 控制是否创建父目录。",
            inputSchema: z.object({
                remote_path: z.string(),
                local_path: z.string(),
                overwrite: z.boolean().optional(),
                mkdirs: z.boolean().optional(),
            }),
            outputSchema: z.object({
                ok: z.boolean(),
                remote_path: z.string().optional(),
                local_path: z.string().optional(),
                size: z.number().optional(),
                error: z.string().optional(),
                code: z.string().optional(),
            }),
        },
        async (
            {
                remote_path: remotePath,
                local_path: localPath,
                overwrite,
                mkdirs,
            }: {
                remote_path: string;
                local_path: string;
                overwrite?: boolean;
                mkdirs?: boolean;
            }
        ): Promise<ToolResult> => {
            try {
                const localFull = resolveLocalPath(localPath);
                if (mkdirs) {
                    await fs.mkdir(path.dirname(localFull), { recursive: true });
                }
                if (!overwrite) {
                    try {
                        await fs.stat(localFull);
                        return fail("file exists", "EEXIST");
                    } catch (err) {
                        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
                    }
                }
                const url = buildUrl("/download", { path: remotePath });
                const res = await fetchWithTimeout(url, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${AUTH_TOKEN}` },
                });
                if (!res.ok) return failFromResponse(res);
                if (!res.body) return fail("empty response body");
                const stream = Readable.fromWeb(res.body as any);
                await pipeline(stream, createWriteStream(localFull));
                const stat = await fs.stat(localFull);
                return ok({
                    ok: true,
                    local_path: localPath,
                    remote_path: remotePath,
                    size: stat.size,
                });
            } catch (err) {
                const error = err instanceof Error ? err.message : "unknown error";
                return fail(error);
            }
        }
    );

    return server;
}

async function main(): Promise<void> {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
