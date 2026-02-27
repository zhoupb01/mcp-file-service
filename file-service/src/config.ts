import path from "node:path";

export const PORT = Number(process.env.PORT || 8080);
export const ROOT_DIR = path.resolve(process.env.ROOT_DIR || process.cwd());
export const MAX_BODY_MB = Number(process.env.MAX_BODY_MB || 100);
export const AUTH_TOKEN = "mcp-file-service-token";
