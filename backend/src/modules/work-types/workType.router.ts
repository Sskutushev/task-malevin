import { PrismaClient } from "@prisma/client";
import { Router } from "express";
import { WorkTypeController } from "./workType.controller";
import { WorkTypeService } from "./workType.service";
import { CacheService } from "../../shared/cache/cache.service";

export function createWorkTypeRouter(
  prisma: PrismaClient,
  cache: CacheService,
): Router {
  const router = Router();
  const controller = new WorkTypeController(new WorkTypeService(prisma, cache));
  router.get("/", controller.getAll);
  router.post("/", controller.create);
  return router;
}
