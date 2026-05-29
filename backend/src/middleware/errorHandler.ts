import { NextFunction, Request, Response } from "express";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import { AppError } from "../shared/errors/AppError";
import { errorResponse } from "../shared/types/ApiResponse";

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;
  if (err instanceof ZodError) {
    res
      .status(422)
      .json(errorResponse("Validation failed", err.flatten().fieldErrors));
    return;
  }

  if (err instanceof AppError) {
    res.status(err.statusCode).json(errorResponse(err.message));
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      res.status(404).json(errorResponse("Record not found"));
      return;
    }
  }

  res.status(500).json(errorResponse("Internal server error"));
}

export function notFoundHandler(req: Request, res: Response): void {
  res
    .status(404)
    .json(errorResponse(`Route ${req.method} ${req.path} not found`));
}
