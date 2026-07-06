import app from "./app";
import { logger } from "./lib/logger";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error(
    "PORT environment variable is required but was not provided.",
  );
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

// Log startup information for Railway debugging
logger.info({ port, nodeEnv: process.env.NODE_ENV }, "Starting server...");

const server = app.listen(port, "0.0.0.0", () => {
  logger.info(
    {
      port,
      host: "0.0.0.0",
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date().toISOString(),
    },
    "✓ Server successfully started and listening on all interfaces"
  );
});

server.on("error", (err) => {
  logger.error({ err, port }, "✗ Failed to start server");
  process.exit(1);
});

// Graceful shutdown handling for Railway
const signals = ["SIGTERM", "SIGINT"];
signals.forEach((signal) => {
  process.on(signal, () => {
    logger.info({ signal, timestamp: new Date().toISOString() }, "Received termination signal, starting graceful shutdown");
    server.close(() => {
      logger.info("Server closed gracefully");
      process.exit(0);
    });

    // Force exit after 30 seconds if graceful shutdown hangs
    setTimeout(() => {
      logger.error("Graceful shutdown timeout exceeded, forcing exit");
      process.exit(1);
    }, 30000);
  });
});

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error({ error, timestamp: new Date().toISOString() }, "✗ Uncaught exception");
  process.exit(1);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (reason, promise) => {
  logger.error(
    { reason, promise, timestamp: new Date().toISOString() },
    "✗ Unhandled promise rejection"
  );
  process.exit(1);
});
