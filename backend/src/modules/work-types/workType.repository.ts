import { PrismaClient } from "@prisma/client";
import { CreateWorkTypeDto, WorkType } from "./workType.types";

export class WorkTypeRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findAll(): Promise<WorkType[]> {
    return this.prisma.workType.findMany({ orderBy: { name: "asc" } });
  }

  async findByName(name: string): Promise<WorkType | null> {
    return this.prisma.workType.findUnique({ where: { name } });
  }

  async findById(id: string): Promise<WorkType | null> {
    return this.prisma.workType.findUnique({ where: { id } });
  }

  async create(dto: CreateWorkTypeDto): Promise<WorkType> {
    return this.prisma.workType.create({ data: dto });
  }
}
