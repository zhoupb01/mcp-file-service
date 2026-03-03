import path from "node:path";

export const PORT = Number(process.env.PORT || 8080);
export const ROOT_DIR = path.resolve(process.env.ROOT_DIR || process.cwd());
export const MAX_BODY_MB = Number(process.env.MAX_BODY_MB || 100);

function readAuthToken(env: NodeJS.ProcessEnv = process.env): string {
    const token = env.FILE_SERVICE_TOKEN;
    if (!token) {
        throw new Error("missing env FILE_SERVICE_TOKEN");
    }
    return token;
}

export const AUTH_TOKEN = readAuthToken();
