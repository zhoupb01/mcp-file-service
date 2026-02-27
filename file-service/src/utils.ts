import path from "node:path";
import { ROOT_DIR } from "./config.js";

export function resolveSafePath(relPath: string): string {
    const full = path.resolve(ROOT_DIR, relPath);
    if (full === ROOT_DIR || full.startsWith(ROOT_DIR + path.sep)) return full;
    throw new Error("path is outside root");
}

export function parseBool(value: unknown): boolean {
    return value === "1" || value === "true";
}

export function encodeRFC5987(value: string): string {
    return encodeURIComponent(value).replace(/[!'()*]/g, (c) =>
        `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );
}
