import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { Router } from "express";
import { createWorkLogRouter } from "../../modules/work-logs/workLog.router";
import { createWorkTypeRouter } from "../../modules/work-types/workType.router";
import { CacheService } from "../../shared/cache/cache.service";

export function createV1Router(
  prisma: PrismaClient,
  crdb: Pool,
  cache: CacheService,
): Router {
  const router = Router();
  router.use("/work-logs", createWorkLogRouter(prisma, crdb, cache));
  router.use("/work-types", createWorkTypeRouter(prisma, cache));
  return router;
}
