import { createReadStream, createWriteStream, promises as fs } from "node:fs";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { AdapterConfig } from "./config.js";
import { buildArchivePath, resolveLocalPath, type ArchiveScope } from "./paths.js";
import { createRemoteClient } from "./remote.js";
import { fail, ok, type ToolResult } from "./result.js";

export function createServer(config: AdapterConfig): McpServer {
    const { user } = config;
    const remote = createRemoteClient(config);
    const resolveScopedRemotePath = ({
        biz,
        req,
        scope,
        relPath,
    }: {
        biz: string;
        req: string;
        scope: ArchiveScope;
        relPath: string;
    }): string => buildArchivePath({ biz, req, scope, relPath, user });
    const server = new McpServer({
        name: "mcp-file-adapter",
        version: "0.1.0",
    });

    const archivePathInputSchema = z.object({
        biz: z.string(),
        req: z.string(),
        scope: z.enum(["shared", "user"]),
        rel_path: z.string().optional(),
    });

    server.registerTool(
        "list_files",
        {
            description:
                "列出目录条目：通过 biz/req/scope/rel_path 结构化定位远程目录，scope=shared|user，rel_path 为空表示 scope 根目录。",
            inputSchema: archivePathInputSchema,
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
        async ({
            biz,
            req,
            scope,
            rel_path: relPath,
        }: {
            biz: string;
            req: string;
            scope: ArchiveScope;
            rel_path?: string;
        }): Promise<ToolResult> => {
            try {
                const url = remote.buildUrl("/list", {
                    path: resolveScopedRemotePath({ biz, req, scope, relPath: relPath ?? "" }),
                });
                const res = await remote.fetchWithTimeout(url, {
                    method: "GET",
                    headers: { Authorization: `Bearer ${remote.authToken}` },
                });
                if (!res.ok) return remote.failFromResponse(res);
                const data = await remote.parseJsonResponse(res);
                if (data.ok === false && typeof data.error === "string") {
                    return fail(String(data.error), typeof data.code === "string" ? data.code : undefined);
                }
                return ok(data);
            } catch (err) {
                const error = err instanceof Error ? err.message : "unknown error";
                return fail(error);
            }
        }
    );

    server.registerTool(
        "dir_mkdir",
        {
            description:
                "在结构化路径下创建目录：通过 biz/req/scope/rel_path 指定目标目录，recursive 控制是否递归创建父目录（默认 true）。",
            inputSchema: archivePathInputSchema.extend({
                recursive: z.boolean().optional(),
            }),
            outputSchema: z.object({
                ok: z.boolean(),
                error: z.string().optional(),
                code: z.string().optional(),
            }),
        },
        async ({
            biz,
            req,
            scope,
            rel_path: relPath,
            recursive,
        }: {
            biz: string;
            req: string;
            scope: ArchiveScope;
            rel_path?: string;
            recursive?: boolean;
        }): Promise<ToolResult> => {
            try {
                const resolvedPath = resolveScopedRemotePath({ biz, req, scope, relPath: relPath ?? "" });
                return remote.postJson("/mkdir", { path: resolvedPath, recursive: recursive ?? true });
            } catch (err) {
                const error = err instanceof Error ? err.message : "unknown error";
                return fail(error);
            }
        }
    );

    server.registerTool(
        "upload_file",
        {
            description:
                "上传本地文件到结构化远程路径：biz/req/scope/rel_path 决定远程文件位置；local_path 为本地文件路径，overwrite 控制是否覆盖，mkdirs 控制是否创建父目录。",
            inputSchema: z.object({
                local_path: z.string(),
                biz: z.string(),
                req: z.string(),
                scope: z.enum(["shared", "user"]),
                rel_path: z.string(),
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
                biz,
                req,
                scope,
                rel_path: relPath,
                overwrite,
                mkdirs,
            }: {
                local_path: string;
                biz: string;
                req: string;
                scope: ArchiveScope;
                rel_path: string;
                overwrite?: boolean;
                mkdirs?: boolean;
            }
        ): Promise<ToolResult> => {
            try {
                const localFull = resolveLocalPath(localPath);
                const stat = await fs.stat(localFull);
                if (!stat.isFile()) return fail("invalid local path", "EISDIR");
                const resolvedRemotePath = resolveScopedRemotePath({ biz, req, scope, relPath });
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
                "下载结构化远程路径到本地：biz/req/scope/rel_path 决定远程文件位置；local_path 为本地目标路径，overwrite 控制是否覆盖，mkdirs 控制是否创建父目录。",
            inputSchema: z.object({
                biz: z.string(),
                req: z.string(),
                scope: z.enum(["shared", "user"]),
                rel_path: z.string(),
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
                biz,
                req,
                scope,
                rel_path: relPath,
                local_path: localPath,
                overwrite,
                mkdirs,
            }: {
                biz: string;
                req: string;
                scope: ArchiveScope;
                rel_path: string;
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
                const resolvedRemotePath = resolveScopedRemotePath({ biz, req, scope, relPath });
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
                    remote_path: resolvedRemotePath,
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
