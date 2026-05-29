import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import cors from "cors";
import express, { Application } from "express";
import helmet from "helmet";
import { env } from "./config/env";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { requestLogger } from "./middleware/requestLogger";
import { createV1Router } from "./routes/v1";
import { CacheService } from "./shared/cache/cache.service";

export function createApp(
  prisma: PrismaClient,
  crdb: Pool,
  cache: CacheService,
): Application {
  const app = express();
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ["GET", "POST", "PATCH", "DELETE"],
      allowedHeaders: ["Content-Type"],
    }),
  );
  app.use(express.json({ limit: "50kb" }));
  app.use(requestLogger);
  app.get("/health", (_req, res) => res.json({ status: "ok" }));
  app.use("/api/v1", createV1Router(prisma, crdb, cache));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
