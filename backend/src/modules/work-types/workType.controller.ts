import { NextFunction, Request, Response } from "express";
import { z } from "zod";
import { WorkTypeService } from "./workType.service";
import { successResponse } from "../../shared/types/ApiResponse";

const createWorkTypeSchema = z.object({
  groupName: z.string().trim().min(2).max(100),
  name: z.string().trim().min(2).max(100),
  unit: z.string().trim().min(1).max(20),
  quantityHint: z.string().trim().min(5).max(200),
});

export class WorkTypeController {
  constructor(private readonly service: WorkTypeService) {}

  getAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      res.json(successResponse(await this.service.getAll()));
    } catch (err) {
      next(err);
    }
  };

  create = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = createWorkTypeSchema.parse(req.body);
      res.status(201).json(successResponse(await this.service.create(dto)));
    } catch (err) {
      next(err);
    }
  };
}
