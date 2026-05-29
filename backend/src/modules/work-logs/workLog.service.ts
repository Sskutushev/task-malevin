import { PrismaClient } from "@prisma/client";
import { Pool } from "pg";
import { AppError } from "../../shared/errors/AppError";
import { CacheService } from "../../shared/cache/cache.service";
import { WorkTypeRepository } from "../work-types/workType.repository";
import { WorkLogRepository } from "./workLog.repository";
import {
  CreateWorkLogDto,
  PaginatedResult,
  UpdateWorkLogDto,
  WorkLog,
  WorkLogFilters,
} from "./workLog.types";

export class WorkLogService {
  private readonly repo: WorkLogRepository;
  private readonly workTypeRepo: WorkTypeRepository;

  constructor(
    prisma: PrismaClient,
    crdb: Pool,
    private readonly cache: CacheService,
  ) {
    this.repo = new WorkLogRepository(crdb);
    this.workTypeRepo = new WorkTypeRepository(prisma);
  }

  async getAll(filters: WorkLogFilters): Promise<PaginatedResult<WorkLog>> {
    const key = `work-logs:${JSON.stringify(filters)}`;
    const cached = await this.cache.get<PaginatedResult<WorkLog>>(key);
    if (cached) return cached;
    const data = await this.repo.findMany(filters);
    await this.cache.set(key, data, 30);
    return data;
  }

  async getById(id: string): Promise<WorkLog> {
    const row = await this.repo.findById(id);
    if (!row) throw AppError.notFound("Work log not found");
    return row;
  }

  async create(dto: CreateWorkLogDto): Promise<WorkLog> {
    const workType = await this.workTypeRepo.findById(dto.workTypeId);
    if (!workType) throw AppError.notFound("Work type not found");
    const created = await this.repo.create({
      ...dto,
      unit: workType.unit,
      workTypeGroup: workType.groupName,
      workTypeName: workType.name,
    });
    await this.cache.delByPrefix("work-logs:");
    return created;
  }

  async update(id: string, dto: UpdateWorkLogDto): Promise<WorkLog> {
    let snapshot: { name: string; unit: string; groupName: string } | undefined;
    if (dto.workTypeId) {
      const workType = await this.workTypeRepo.findById(dto.workTypeId);
      if (!workType) throw AppError.notFound("Work type not found");
      snapshot = {
        name: workType.name,
        unit: workType.unit,
        groupName: workType.groupName,
      };
    }
    const updated = await this.repo.update(id, {
      ...dto,
      ...(snapshot
        ? {
            workTypeName: snapshot.name,
            workTypeGroup: snapshot.groupName,
            unit: snapshot.unit,
          }
        : {}),
    });
    await this.cache.delByPrefix("work-logs:");
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.getById(id);
    await this.repo.delete(id);
    await this.cache.delByPrefix("work-logs:");
  }
}
