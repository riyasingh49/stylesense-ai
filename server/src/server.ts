import { app } from "./app";
import { env } from "./config/env";

const server = app.listen(env.PORT, () => {
  console.log(`StyleSense AI server is running on port ${env.PORT}.`);
  console.log(`Health check: ${env.APP_BASE_URL}/api/health`);
});

const shutdown = (signal: string): void => {
  console.log(`${signal} received. Closing server...`);

  server.close((error) => {
    if (error) {
      console.error("Error while closing the HTTP server:", error);
      process.exitCode = 1;
      return;
    }

    console.log("HTTP server closed.");
    process.exitCode = 0;
  });
};

process.once("SIGINT", () => shutdown("SIGINT"));
process.once("SIGTERM", () => shutdown("SIGTERM"));

server.on("error", (error: NodeJS.ErrnoException) => {
  console.error("HTTP server failed to start:", error.message);
  process.exitCode = 1;
});
