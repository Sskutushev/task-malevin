import { PrismaClient } from "@prisma/client";
import { createApp } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { createCrdbPool } from "./db/crdb";
import { CacheService } from "./shared/cache/cache.service";

async function bootstrap(): Promise<void> {
  const prisma = new PrismaClient();
  const crdb = createCrdbPool();
  const cache = new CacheService();
  await prisma.$connect();
  await crdb.query("SELECT 1");
  await cache.connect();

  const app = createApp(prisma, crdb, cache);
  const server = app.listen(env.PORT, () => {
    logger.info(`Server started on ${env.PORT}`);
  });

  const shutdown = async (): Promise<void> => {
    server.close(async () => {
      await prisma.$disconnect();
      await crdb.end();
      await cache.disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

bootstrap().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
