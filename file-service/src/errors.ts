import type { Response } from "express";

export type ErrorResult = {
    ok: false;
    error: string;
    code?: string;
};

export function getErrorInfo(err: unknown): { status: number; error: string; code?: string } {
    if (err instanceof Error) {
        const code = (err as NodeJS.ErrnoException).code;
        if (err.message === "path is outside root") {
            return { status: 400, error: err.message };
        }
        if (code === "ENOENT") return { status: 404, error: "not found", code };
        if (code === "EACCES" || code === "EPERM") return { status: 403, error: "permission denied", code };
        if (code === "ENOTDIR" || code === "EISDIR") return { status: 400, error: "invalid path", code };
        if (code === "EEXIST") return { status: 409, error: "file exists", code };
        return { status: 500, error: err.message, code };
    }
    return { status: 500, error: "unknown error" };
}

export function sendHttpError(res: Response, err: unknown): void {
    const info = getErrorInfo(err);
    const result: ErrorResult = { ok: false, error: info.error, code: info.code };
    res.status(info.status).json(result);
}
