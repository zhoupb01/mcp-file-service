import { parseArgs } from "node:util";

export type AdapterConfig = {
    remoteBaseUrl: string;
    authToken: string;
    timeoutMs: number;
    user: string;
};

const DEFAULT_REMOTE_BASE_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 30000;

type CliValues = {
    "auth-token"?: string | boolean;
    "remote-base-url"?: string;
    user?: string | boolean;
};

function parseCliValues(args: string[]): CliValues {
    try {
        const { values } = parseArgs({
            args,
            strict: true,
            allowPositionals: false,
            options: {
                "auth-token": { type: "string" },
                "remote-base-url": { type: "string" },
                user: { type: "string" },
            },
        });
        return values as CliValues;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("--user")) {
            throw new Error("invalid --user: missing value, expected non-empty string");
        }
        if (message.includes("--auth-token")) {
            throw new Error("invalid --auth-token: missing value, expected non-empty string");
        }
        throw err;
    }
}

function parseUser(rawUser: string | boolean | undefined, source: "cli" | "env"): string {
    if (rawUser === undefined) return "";
    if (typeof rawUser !== "string") {
        if (rawUser === true) {
            throw new Error("invalid --user: missing value, expected non-empty string");
        }
        throw new Error("invalid --user: expected string value, expected non-empty string");
    }
    const user = rawUser.trim();
    if (!user) {
        if (source === "cli") {
            throw new Error("invalid --user: empty value, expected non-empty string");
        }
        return "";
    }
    return user;
}

function parseAuthToken(rawToken: string | boolean | undefined): string {
    if (rawToken === undefined) {
        throw new Error("missing required --auth-token");
    }
    if (typeof rawToken !== "string") {
        throw new Error("invalid --auth-token: expected string value, expected non-empty string");
    }
    const token = rawToken.trim();
    if (!token) {
        throw new Error("invalid --auth-token: empty value, expected non-empty string");
    }
    return token;
}

export function loadConfig(args: string[] = process.argv.slice(2), env: NodeJS.ProcessEnv = process.env): AdapterConfig {
    const values = parseCliValues(args);
    const user = values.user !== undefined ? parseUser(values.user, "cli") : parseUser(env.REMOTE_USER, "env");

    return {
        remoteBaseUrl: values["remote-base-url"] || env.REMOTE_BASE_URL || DEFAULT_REMOTE_BASE_URL,
        authToken: parseAuthToken(values["auth-token"]),
        timeoutMs: Number(env.TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
        user,
    };
}
