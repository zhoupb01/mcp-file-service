import type { Request, Response, NextFunction } from "express";
import { AUTH_TOKEN } from "./config.js";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
    const auth = req.header("authorization");
    if (auth !== `Bearer ${AUTH_TOKEN}`) {
        res.status(401).json({ ok: false, error: "unauthorized" });
        return;
    }
    next();
}
