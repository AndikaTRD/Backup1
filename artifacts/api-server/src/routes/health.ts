import { Router, type IRouter, type Request, type Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { logger } from "../lib/logger";

const router: IRouter = Router();

router.get("/healthz", (_req: Request, res: Response) => {
  try {
    const data = HealthCheckResponse.parse({ status: "ok" });
    logger.debug({ statusCode: 200 }, "Health check passed");
    res.status(200).json(data);
  } catch (err) {
    logger.error({ err }, "Health check validation failed");
    res.status(500).json({ error: "Health check validation failed" });
  }
});

export default router;
