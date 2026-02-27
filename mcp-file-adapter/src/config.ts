import { parseArgs } from "node:util";

export const SUPPORTED_ROLES = ["product", "java", "python", "android", "vue"] as const;
export type SupportedRole = (typeof SUPPORTED_ROLES)[number];

export type AdapterConfig = {
    remoteBaseUrl: string;
    authToken: string;
    timeoutMs: number;
    role: SupportedRole | "";
};

const DEFAULT_REMOTE_BASE_URL = "http://localhost:8080";
const DEFAULT_TIMEOUT_MS = 30000;
const AUTH_TOKEN = "mcp-file-service-token";

type CliValues = {
    "remote-base-url"?: string;
    role?: string | boolean;
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
            },
        });
        return values as CliValues;
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("--role")) {
            throw new Error(`invalid --role: missing value, expected one of ${SUPPORTED_ROLES.join(", ")}`);
        }
        throw err;
    }
}

function parseRole(rawRole: string | boolean | undefined, source: "cli" | "env"): SupportedRole | "" {
    if (rawRole === undefined) return "";
    if (typeof rawRole !== "string") {
        if (rawRole === true) {
            throw new Error(`invalid --role: missing value, expected one of ${SUPPORTED_ROLES.join(", ")}`);
        }
        throw new Error(`invalid --role: expected string value, expected one of ${SUPPORTED_ROLES.join(", ")}`);
    }
    const role = rawRole.trim();
    if (!role) {
        if (source === "cli") {
            throw new Error(`invalid --role: empty value, expected one of ${SUPPORTED_ROLES.join(", ")}`);
        }
        return "";
    }
    if ((SUPPORTED_ROLES as readonly string[]).includes(role)) {
        return role as SupportedRole;
    }
    throw new Error(`invalid role "${role}", expected one of ${SUPPORTED_ROLES.join(", ")}`);
}

export function loadConfig(args: string[] = process.argv.slice(2), env: NodeJS.ProcessEnv = process.env): AdapterConfig {
    const values = parseCliValues(args);
    const role = values.role !== undefined ? parseRole(values.role, "cli") : parseRole(env.REMOTE_ROLE, "env");

    return {
        remoteBaseUrl: values["remote-base-url"] || env.REMOTE_BASE_URL || DEFAULT_REMOTE_BASE_URL,
        authToken: AUTH_TOKEN,
        timeoutMs: Number(env.TIMEOUT_MS || DEFAULT_TIMEOUT_MS),
        role,
    };
}
