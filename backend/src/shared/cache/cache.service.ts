import { createClient, RedisClientType } from "redis";
import { env } from "../../config/env";
import { logger } from "../../config/logger";

export class CacheService {
  private client: RedisClientType | null = null;
  private available = false;

  async connect(): Promise<void> {
    try {
      this.client = createClient({ url: env.REDIS_URL });
      this.client.on("error", (error) => {
        logger.warn(`Redis error: ${String(error)}`);
      });
      await this.client.connect();
      this.available = true;
      logger.info("Redis connected");
    } catch (error) {
      this.available = false;
      logger.warn(
        `Redis unavailable, continue without cache: ${String(error)}`,
      );
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.available) {
      await this.client.disconnect();
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.available) return null;
    const raw = await this.client.get(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  }

  async set(key: string, value: unknown, ttlSeconds = 60): Promise<void> {
    if (!this.client || !this.available) return;
    await this.client.set(key, JSON.stringify(value), { EX: ttlSeconds });
  }

  async delByPrefix(prefix: string): Promise<void> {
    if (!this.client || !this.available) return;
    const keys = await this.client.keys(`${prefix}*`);
    if (keys.length > 0) {
      await this.client.del(keys);
    }
  }
}
