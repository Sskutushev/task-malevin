import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { Router } from "express";
import { WorkLogController } from "./workLog.controller";
import { WorkLogService } from "./workLog.service";
import { CacheService } from "../../shared/cache/cache.service";

export function createWorkLogRouter(
  prisma: PrismaClient,
  crdb: Pool,
  cache: CacheService,
): Router {
  const router = Router();
  const controller = new WorkLogController(
    new WorkLogService(prisma, crdb, cache),
  );
  router.get("/", controller.getAll);
  router.get("/:id", controller.getById);
  router.post("/", controller.create);
  router.patch("/:id", controller.update);
  router.delete("/:id", controller.delete);
  return router;
}
