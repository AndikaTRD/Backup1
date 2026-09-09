import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import session from "express-session";
import path from "path";
import fs from "fs";
import router from "./routes";
import { logger } from "./lib/logger";

declare module "express-session" {
  interface SessionData {
    isAdmin: boolean;
  }
}

const app: Express = express();

// Railway (and most PaaS providers) terminate TLS at their reverse proxy and
// forward requests over HTTP internally. Without trust proxy, express-session
// thinks every request is plain HTTP and refuses to set secure cookies, so
// admin login will silently fail after the first request.
app.set("trust proxy", 1);

const isProduction = process.env.NODE_ENV === "production";

// Fail fast in production if SESSION_SECRET is missing — a missing secret would
// allow any session to be forged. In development, a fallback is acceptable.
if (isProduction && !process.env.SESSION_SECRET) {
  throw new Error("SESSION_SECRET environment variable is required in production.");
}

app.use(
  session({
    secret: process.env.SESSION_SECRET ?? "fallback-dev-secret-do-not-use-in-prod",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 8 * 60 * 60 * 1000,
      // Secure cookies are required over HTTPS (Railway production).
      // In development (Replit) we stay on http so this stays false.
      secure: isProduction,
      // lax is fine: frontend and API are on the same domain in production.
      sameSite: "lax",
    },
  })
);

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const uploadsDir = path.resolve(workspaceRoot, "artifacts/api-server/uploads");
app.use("/api/uploads", express.static(uploadsDir));

app.use("/api", router);

const frontendDist = path.resolve(
  workspaceRoot,
  "artifacts/andika-store/dist/public"
);

if (process.env.NODE_ENV === "production" && fs.existsSync(frontendDist)) {
  app.use(express.static(frontendDist));

  app.get("/{*splat}", (_req, res) => {
    res.sendFile(path.join(frontendDist, "index.html"));
  });
}

// Global error handler — catch-all for any unhandled errors
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, "Unhandled error in express");
  res.status(500).json({ error: "Internal server error" });
});

export default app;
