import { randomUUID } from "crypto";
import { Pool } from "pg";
import {
  CreateWorkLogDto,
  PaginatedResult,
  UpdateWorkLogDto,
  WorkLog,
  WorkLogFilters,
} from "./workLog.types";

interface WorkLogRow {
  id: string;
  date: Date;
  work_type_id: string;
  work_type_group: string;
  work_type_name: string;
  volume: string;
  unit: string;
  executor_name: string;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
}

function toEntity(row: WorkLogRow): WorkLog {
  return {
    id: row.id,
    date: new Date(row.date),
    workTypeId: row.work_type_id,
    workTypeGroup: row.work_type_group,
    workTypeName: row.work_type_name,
    volume: Number(row.volume),
    unit: row.unit,
    executorName: row.executor_name,
    notes: row.notes,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

export class WorkLogRepository {
  constructor(private readonly crdb: Pool) {}

  async findMany(filters: WorkLogFilters): Promise<PaginatedResult<WorkLog>> {
    const where: string[] = [];
    const params: Array<string | number> = [];
    let idx = 1;

    if (filters.dateFrom) {
      where.push(`date >= $${idx}`);
      params.push(filters.dateFrom);
      idx += 1;
    }
    if (filters.dateTo) {
      where.push(`date <= $${idx}`);
      params.push(filters.dateTo);
      idx += 1;
    }
    if (filters.workTypeId) {
      where.push(`work_type_id = $${idx}`);
      params.push(filters.workTypeId);
      idx += 1;
    }
    if (filters.workTypeGroup) {
      where.push(`work_type_group = $${idx}`);
      params.push(filters.workTypeGroup);
      idx += 1;
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const orderBy = filters.sortBy === "createdAt" ? "created_at" : "date";
    const orderDirection =
      filters.sortOrder.toUpperCase() === "ASC" ? "ASC" : "DESC";

    const listParams = [
      ...params,
      filters.limit,
      (filters.page - 1) * filters.limit,
    ];
    const listResult = await this.crdb.query<WorkLogRow>(
      `SELECT id, date, work_type_id, work_type_group, work_type_name, volume, unit, executor_name, notes, created_at, updated_at
       FROM work_logs
       ${whereSql}
       ORDER BY ${orderBy} ${orderDirection}
       LIMIT $${idx} OFFSET $${idx + 1}`,
      listParams,
    );

    const countResult = await this.crdb.query<{ total: string }>(
      `SELECT COUNT(*) AS total FROM work_logs ${whereSql}`,
      params,
    );
    const total = Number(countResult.rows[0]?.total ?? 0);

    return {
      items: listResult.rows.map(toEntity),
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.max(1, Math.ceil(total / filters.limit)),
    };
  }

  async findById(id: string): Promise<WorkLog | null> {
    const result = await this.crdb.query<WorkLogRow>(
      `SELECT id, date, work_type_id, work_type_group, work_type_name, volume, unit, executor_name, notes, created_at, updated_at
       FROM work_logs WHERE id = $1`,
      [id],
    );
    return result.rows[0] ? toEntity(result.rows[0]) : null;
  }

  async create(
    dto: CreateWorkLogDto & { workTypeName: string; workTypeGroup: string },
  ): Promise<WorkLog> {
    const id = randomUUID();
    const result = await this.crdb.query<WorkLogRow>(
      `INSERT INTO work_logs
       (id, date, work_type_id, work_type_group, work_type_name, volume, unit, executor_name, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING id, date, work_type_id, work_type_group, work_type_name, volume, unit, executor_name, notes, created_at, updated_at`,
      [
        id,
        dto.date,
        dto.workTypeId,
        dto.workTypeGroup,
        dto.workTypeName,
        dto.volume,
        dto.unit,
        dto.executorName,
        dto.notes ?? null,
      ],
    );
    return toEntity(result.rows[0]);
  }

  async update(
    id: string,
    dto: UpdateWorkLogDto & { workTypeName?: string; workTypeGroup?: string },
  ): Promise<WorkLog> {
    const existing = await this.findById(id);
    if (!existing) {
      throw new Error("Work log not found");
    }

    const result = await this.crdb.query<WorkLogRow>(
      `UPDATE work_logs SET
        date = $2,
        work_type_id = $3,
        work_type_group = $4,
        work_type_name = $5,
        volume = $6,
        unit = $7,
        executor_name = $8,
        notes = $9,
        updated_at = NOW()
       WHERE id = $1
       RETURNING id, date, work_type_id, work_type_group, work_type_name, volume, unit, executor_name, notes, created_at, updated_at`,
      [
        id,
        dto.date ?? existing.date.toISOString().slice(0, 10),
        dto.workTypeId ?? existing.workTypeId,
        dto.workTypeGroup ?? existing.workTypeGroup,
        dto.workTypeName ?? existing.workTypeName,
        dto.volume ?? existing.volume,
        dto.unit ?? existing.unit,
        dto.executorName ?? existing.executorName,
        dto.notes ?? existing.notes,
      ],
    );
    return toEntity(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.crdb.query("DELETE FROM work_logs WHERE id = $1", [id]);
  }
}
