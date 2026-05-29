import winston from "winston";
import { env } from "./env";

const loggerFormat =
  env.NODE_ENV === "production"
    ? winston.format.combine(winston.format.timestamp(), winston.format.json())
    : winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.timestamp({ format: "HH:mm:ss" }),
        winston.format.printf(
          ({ level, message, timestamp }) =>
            `${timestamp} [${level}] ${message}`,
        ),
      );

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: loggerFormat,
  transports: [new winston.transports.Console()],
});
