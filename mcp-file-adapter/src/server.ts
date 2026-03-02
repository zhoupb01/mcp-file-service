import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AdapterConfig } from "./config.js";
import { resolveArchiveWritePath, resolveLocalPath, resolveRemotePath, rewriteRoleRootEntries } from "./paths.js";
import { createRemoteClient } from "./remote.js";
import { fail, ok, type ToolResult } from "./result.js";

export function createServer(config: AdapterConfig): McpServer {
    const { role, user } = config;
    const remote = createRemoteClient(config);
    const server = new McpServer({
        name: role ? `mcp-file-adapter[${role}]` : "mcp-file-adapter",
        version: "0.1.0",
    });

    server.registerTool(
        "list_files",
        {
            description: "列出远程目录下的条目：path 为远程相对路径（空字符串表示根目录），返回 name/type/size/mtimeMs。",
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
            const url = remote.buildUrl("/list", { path: resolveRemotePath(relPath, role) });
            const res = await remote.fetchWithTimeout(url, {
                method: "GET",
                headers: { Authorization: `Bearer ${remote.authToken}` },
            });
            if (!res.ok) return remote.failFromResponse(res);
            const data = await remote.parseJsonResponse(res);
            if (data.ok === false && typeof data.error === "string") {
                return fail(String(data.error), typeof data.code === "string" ? data.code : undefined);
            }
            if (role && relPath === "") {
                return ok(rewriteRoleRootEntries(data, role));
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
            const resolvedPath = resolveArchiveWritePath(resolveRemotePath(relPath, role), user);
            return remote.postJson("/mkdir", { path: resolvedPath, recursive: recursive ?? true });
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
                const resolvedRemotePath = resolveArchiveWritePath(resolveRemotePath(remotePath, role), user);
                const url = remote.buildUrl("/upload", {
                    path: resolvedRemotePath,
                    overwrite: overwrite ? "1" : "0",
                    mkdirs: mkdirs ? "1" : "0",
                });
                const body = Readable.toWeb(createReadStream(localFull));
                const res = await remote.fetchWithTimeout(url, {
                    method: "POST",
                    headers: {
                        Authorization: `Bearer ${remote.authToken}`,
                        "Content-Type": "application/octet-stream",
                    },
                    body,
                    duplex: "half",
                });
                if (!res.ok) return remote.failFromResponse(res);
                const data = await remote.parseJsonResponse(res);
                if (data.ok === false && typeof data.error === "string") {
                    return fail(String(data.error), typeof data.code === "string" ? data.code : undefined);
                }
                return ok({
                    ok: true,
                    local_path: localPath,
                    remote_path: resolvedRemotePath,
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
                const resolvedRemotePath = resolveRemotePath(remotePath, role);
                const res = await remote.fetchWithTimeout(remote.buildUrl("/download", { path: resolvedRemotePath }), {
                    method: "GET",
                    headers: { Authorization: `Bearer ${remote.authToken}` },
                });
                if (!res.ok) return remote.failFromResponse(res);
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
