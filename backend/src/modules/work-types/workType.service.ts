import { PrismaClient } from "@prisma/client";
import { WorkTypeRepository } from "./workType.repository";
import { CreateWorkTypeDto, WorkType } from "./workType.types";
import { AppError } from "../../shared/errors/AppError";
import { CacheService } from "../../shared/cache/cache.service";

export class WorkTypeService {
  private readonly repo: WorkTypeRepository;

  constructor(
    prisma: PrismaClient,
    private readonly cache: CacheService,
  ) {
    this.repo = new WorkTypeRepository(prisma);
  }

  async getAll(): Promise<WorkType[]> {
    const key = "work-types:all";
    const cached = await this.cache.get<WorkType[]>(key);
    if (cached) return cached;
    const rows = await this.repo.findAll();
    await this.cache.set(key, rows, 300);
    return rows;
  }

  async create(dto: CreateWorkTypeDto): Promise<WorkType> {
    const existing = await this.repo.findByName(dto.name);
    if (existing) {
      throw AppError.conflict(`Work type '${dto.name}' already exists`);
    }
    const created = await this.repo.create(dto);
    await this.cache.delByPrefix("work-types:");
    return created;
  }
}
