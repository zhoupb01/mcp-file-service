export function registerProcessHandlers(): void {
    const log = (level: "info" | "error", message: string, extra?: unknown) => {
        const line = `[${new Date().toISOString()}] ${message}`;
        if (level === "error") {
            console.error(line, extra ?? "");
        } else {
            console.log(line, extra ?? "");
        }
    };

    process.on("exit", (code) => {
        log("info", "process exit", { code });
    });
    process.on("SIGTERM", () => {
        log("info", "received SIGTERM");
        process.exit(0);
    });
    process.on("SIGINT", () => {
        log("info", "received SIGINT");
        process.exit(0);
    });
    process.on("uncaughtException", (err) => {
        log("error", "uncaughtException", err);
        process.exit(1);
    });
    process.on("unhandledRejection", (reason) => {
        log("error", "unhandledRejection", reason);
        process.exit(1);
    });
}
