import { registerProcessHandlers } from "./process.js";
import { startServer } from "./server.js";

registerProcessHandlers();

startServer().catch((err) => {
    console.error(err);
    process.exit(1);
});
