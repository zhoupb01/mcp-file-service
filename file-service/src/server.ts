import express from "express";
import { createReadStream } from "node:fs";
import { promises as fs } from "node:fs";
import path from "node:path";
import { MAX_BODY_MB, PORT, ROOT_DIR } from "./config.js";
import { requireAuth } from "./auth.js";
import { sendHttpError } from "./errors.js";
import { encodeRFC5987, parseBool, resolveSafePath } from "./utils.js";

type DirEntry = {
    name: string;
    type: "file" | "dir";
    size?: number;
    mtimeMs: number;
};

export async function startServer(): Promise<void> {
    const app = express();
    const uiHtmlPath = new URL("./ui.html", import.meta.url);
    const uiHtml = await fs.readFile(uiHtmlPath, "utf8");
    const publicDir = new URL("./public", import.meta.url).pathname;

    app.use(express.json({ limit: `${MAX_BODY_MB}mb` }));
    app.use("/public", express.static(publicDir));

    app.get("/", (_req, res) => {
        res.setHeader("Content-Type", "text/html; charset=utf-8");
        res.send(uiHtml);
    });

    app.get("/list", requireAuth, async (req, res) => {
        try {
            const relPath = typeof req.query.path === "string" ? req.query.path : "";
            const full = resolveSafePath(relPath);
            const dirents = await fs.readdir(full, { withFileTypes: true });
            const entries: DirEntry[] = await Promise.all(
                dirents.map(async (d) => {
                    const p = path.join(full, d.name);
                    const stat = await fs.stat(p);
                    return {
                        name: d.name,
                        type: d.isDirectory() ? "dir" : "file",
                        size: d.isFile() ? stat.size : undefined,
                        mtimeMs: stat.mtimeMs,
                    };
                })
            );
            res.json({ ok: true, entries });
        } catch (err) {
            sendHttpError(res, err);
        }
    });

    app.get("/download", requireAuth, async (req, res) => {
        try {
            const relPath = typeof req.query.path === "string" ? req.query.path : "";
            if (!relPath) {
                res.status(400).json({ ok: false, error: "invalid path" });
                return;
            }
            const full = resolveSafePath(relPath);
            if (full === ROOT_DIR) {
                res.status(400).json({ ok: false, error: "invalid path" });
                return;
            }
            const stat = await fs.stat(full);
            if (!stat.isFile()) {
                res.status(400).json({ ok: false, error: "invalid path", code: "EISDIR" });
                return;
            }
            const filename = path.basename(full);
            const fallback = filename.replace(/[^\x20-\x7E]/g, "_");
            res.setHeader("Content-Type", "application/octet-stream");
            res.setHeader("Content-Length", stat.size.toString());
            res.setHeader(
                "Content-Disposition",
                `attachment; filename="${fallback}"; filename*=UTF-8''${encodeRFC5987(filename)}`
            );
            const stream = createReadStream(full);
            stream.on("error", (err) => sendHttpError(res, err));
            stream.pipe(res);
        } catch (err) {
            sendHttpError(res, err);
        }
    });

    app.post("/mkdir", requireAuth, async (req, res) => {
        try {
            const relPath = req.body?.path;
            if (typeof relPath !== "string") {
                res.status(400).json({ ok: false, error: "invalid path" });
                return;
            }
            const recursive = Boolean(req.body?.recursive ?? true);
            const full = resolveSafePath(relPath);
            await fs.mkdir(full, { recursive });
            res.json({ ok: true });
        } catch (err) {
            sendHttpError(res, err);
        }
    });

    app.post(
        "/upload",
        requireAuth,
        express.raw({ type: "*/*", limit: `${MAX_BODY_MB}mb` }),
        async (req, res) => {
            try {
                const relPath = typeof req.query.path === "string" ? req.query.path : "";
                if (!relPath) {
                    res.status(400).json({ ok: false, error: "invalid path" });
                    return;
                }
                const overwrite = parseBool(req.query.overwrite);
                const mkdirs = parseBool(req.query.mkdirs);
                const full = resolveSafePath(relPath);
                if (full === ROOT_DIR) {
                    res.status(400).json({ ok: false, error: "invalid path" });
                    return;
                }
                if (mkdirs) {
                    await fs.mkdir(path.dirname(full), { recursive: true });
                }
                if (!overwrite) {
                    try {
                        await fs.stat(full);
                        res.status(409).json({ ok: false, error: "file exists", code: "EEXIST" });
                        return;
                    } catch (err) {
                        if ((err as NodeJS.ErrnoException).code !== "ENOENT") throw err;
                    }
                }
                const body = req.body as Buffer;
                await fs.writeFile(full, body);
                res.json({ ok: true, path: relPath, size: body.length });
            } catch (err) {
                sendHttpError(res, err);
            }
        }
    );

    app.post("/delete", requireAuth, async (req, res) => {
        try {
            const relPath = req.body?.path;
            if (typeof relPath !== "string" || !relPath) {
                res.status(400).json({ ok: false, error: "invalid path" });
                return;
            }
            const full = resolveSafePath(relPath);
            if (full === ROOT_DIR) {
                res.status(400).json({ ok: false, error: "cannot delete root" });
                return;
            }
            const stat = await fs.stat(full);
            if (stat.isDirectory()) {
                const children = await fs.readdir(full);
                if (children.length > 0) {
                    res.status(400).json({ ok: false, error: "directory not empty" });
                    return;
                }
                await fs.rmdir(full);
            } else {
                await fs.unlink(full);
            }
            res.json({ ok: true });
        } catch (err) {
            sendHttpError(res, err);
        }
    });

    app.listen(PORT, () => {
        console.log(`file-service listening on http://localhost:${PORT}`);
    });
}
