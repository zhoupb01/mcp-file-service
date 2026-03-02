import { parseArgs } from "node:util";

export const RESERVED_SYSTEM_NAMES = ["template", "archive"] as const;
export type SupportedRole = string;

export type AdapterConfig = {
    remoteBaseUrl: string;
    authToken: string;
    timeoutMs: number;
    role: SupportedRole | "";
    user: string;
};

const DEFAULT_REMOTE_BASE_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 30000;
const AUTH_TOKEN = "mcp-file-service-token";

type CliValues = {
    "remote-base-url"?: string;
    role?: string | boolean;
    user?: string | boolean;
};

function parseCliValues(args: string[]): CliValues {
    try {
        const { values } = parseArgs({
            args,
            strict: true,
            allowPositionals: false,
            options: {
                "remote-base-url": { type: "string" },
                role: { type: "string" },
                user: { type: "string" },
            },
        });
        return values as CliValues;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("--role")) {
            throw new Error(
                `invalid --role: missing value, expected non-empty string and must not be system names: ${RESERVED_SYSTEM_NAMES.join(
                    ", "
                )}`
            );
        }
        if (message.includes("--user")) {
            throw new Error("invalid --user: missing value, expected non-empty string");
        }
        throw err;
    }
}

function parseRole(rawRole: string | boolean | undefined, source: "cli" | "env"): SupportedRole | "" {
    if (rawRole === undefined) return "";
    if (typeof rawRole !== "string") {
        if (rawRole === true) {
            throw new Error(
                `invalid --role: missing value, expected non-empty string and must not be system names: ${RESERVED_SYSTEM_NAMES.join(
                    ", "
                )}`
            );
        }
        throw new Error(
            `invalid --role: expected string value, expected non-empty string and must not be system names: ${RESERVED_SYSTEM_NAMES.join(
                ", "
            )}`
        );
    }
    const role = rawRole.trim();
    if (!role) {
        if (source === "cli") {
            throw new Error(
                `invalid --role: empty value, expected non-empty string and must not be system names: ${RESERVED_SYSTEM_NAMES.join(
                    ", "
                )}`
            );
        }
        return "";
    }
    if ((RESERVED_SYSTEM_NAMES as readonly string[]).includes(role)) {
        throw new Error(`invalid role "${role}", role must not be system names: ${RESERVED_SYSTEM_NAMES.join(", ")}`);
    }
    return role;
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

export function loadConfig(args: string[] = process.argv.slice(2), env: NodeJS.ProcessEnv = process.env): AdapterConfig {
    const values = parseCliValues(args);
    const role = values.role !== undefined ? parseRole(values.role, "cli") : parseRole(env.REMOTE_ROLE, "env");
    const user = values.user !== undefined ? parseUser(values.user, "cli") : parseUser(env.REMOTE_USER, "env");

    return {
        remoteBaseUrl: values["remote-base-url"] || env.REMOTE_BASE_URL || DEFAULT_REMOTE_BASE_URL,
        authToken: AUTH_TOKEN,
        timeoutMs: Number(env.TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
        role,
        user,
    };
}
