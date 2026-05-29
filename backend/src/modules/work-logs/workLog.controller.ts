import { NextFunction, Request, Response } from "express";
import { successResponse } from "../../shared/types/ApiResponse";
import {
  createWorkLogSchema,
  updateWorkLogSchema,
  workLogFiltersSchema,
} from "./workLog.schema";
import { WorkLogService } from "./workLog.service";

export class WorkLogController {
  constructor(private readonly service: WorkLogService) {}

  getAll = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const filters = workLogFiltersSchema.parse(req.query);
      const result = await this.service.getAll(filters);
      res.json(
        successResponse(result.items, {
          total: result.total,
          page: result.page,
          limit: result.limit,
          totalPages: result.totalPages,
        }),
      );
    } catch (err) {
      next(err);
    }
  };

  getById = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      res.json(successResponse(await this.service.getById(req.params.id)));
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
      const dto = createWorkLogSchema.parse(req.body);
      res.status(201).json(successResponse(await this.service.create(dto)));
    } catch (err) {
      next(err);
    }
  };

  update = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const dto = updateWorkLogSchema.parse(req.body);
      res.json(successResponse(await this.service.update(req.params.id, dto)));
    } catch (err) {
      next(err);
    }
  };

  delete = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      await this.service.delete(req.params.id);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
