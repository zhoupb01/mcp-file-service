import path from "node:path";
import type { SupportedRole } from "./config.js";

type DirEntry = {
    name: string;
    type: "file" | "dir";
    size?: number;
    mtimeMs: number;
};

type RoleValue = SupportedRole | "";

export function resolveLocalPath(localPath: string): string {
    return path.resolve(process.cwd(), localPath);
}

export function resolveRemotePath(remotePath: string, role: RoleValue): string {
    if (!role) return remotePath;
    if (remotePath === "template" || remotePath.startsWith("template/")) {
        return `${role}/${remotePath}`;
    }
    return remotePath;
}

function isDirEntry(value: unknown): value is DirEntry {
    if (typeof value !== "object" || value === null) return false;
    const entry = value as Record<string, unknown>;
    if (typeof entry.name !== "string") return false;
    if (entry.type !== "file" && entry.type !== "dir") return false;
    if (typeof entry.mtimeMs !== "number") return false;
    if ("size" in entry && entry.size !== undefined && typeof entry.size !== "number") return false;
    return true;
}

export function rewriteRoleRootEntries(data: Record<string, unknown>, role: RoleValue): Record<string, unknown> {
    if (!role) return data;
    const rawEntries = data.entries;
    if (!Array.isArray(rawEntries)) return data;
    const entries = rawEntries
        .filter(isDirEntry)
        .filter((entry) => entry.name === "archive" || entry.name === role)
        .map((entry) => (entry.name === role ? { ...entry, name: "template" } : entry));
    return { ...data, entries };
}
