import path from "node:path";

export type ArchiveScope = "shared" | "user";

type BuildArchivePathInput = {
    biz: string;
    req: string;
    scope: ArchiveScope;
    relPath: string;
    user: string;
};

export function resolveLocalPath(localPath: string): string {
    return path.resolve(process.cwd(), localPath);
}

function ensureSegment(value: string, name: "biz" | "req"): string {
    const v = value.trim();
    if (!v || v.includes("/")) {
        throw new Error(`invalid ${name}`);
    }
    return v;
}

function normalizeRelPath(relPath: string): string {
    const raw = relPath.trim();
    if (!raw) return "";
    if (raw.startsWith("/")) {
        throw new Error("invalid relPath");
    }
    const segments = raw.split("/").filter(Boolean);
    if (segments.some((s) => s === "." || s === "..")) {
        throw new Error("invalid relPath");
    }
    return segments.join("/");
}

export function buildArchivePath({ biz, req, scope, relPath, user }: BuildArchivePathInput): string {
    const bizSeg = ensureSegment(biz, "biz");
    const reqSeg = ensureSegment(req, "req");
    const rel = normalizeRelPath(relPath);

    const base =
        scope === "shared"
            ? ["archive", bizSeg, reqSeg, "shared"]
            : ["archive", bizSeg, reqSeg, "users", user.trim()];

    if (scope === "user" && !user.trim()) {
        throw new Error("missing user for user scope");
    }

    return rel ? [...base, rel].join("/") : base.join("/");
}
