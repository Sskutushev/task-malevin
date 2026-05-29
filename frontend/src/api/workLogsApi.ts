import {
  ApiResponse,
  CreateWorkLogDto,
  UpdateWorkLogDto,
  WorkLog,
  WorkLogFilters,
} from "@/types";
import { apiClient } from "./client";

export interface WorkLogsPage {
  items: WorkLog[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function buildParams(filters: WorkLogFilters): Record<string, string | number> {
  return Object.fromEntries(
    Object.entries(filters).filter(([, v]) => v !== undefined && v !== ""),
  ) as Record<string, string | number>;
}

export const workLogsApi = {
  async getAll(filters: WorkLogFilters = {}): Promise<WorkLogsPage> {
    const { data } = await apiClient.get<ApiResponse<WorkLog[]>>("/work-logs", {
      params: buildParams(filters),
    });
    return {
      items: data.data ?? [],
      meta: {
        total: data.meta?.total ?? 0,
        page: data.meta?.page ?? 1,
        limit: data.meta?.limit ?? 20,
        totalPages: data.meta?.totalPages ?? 1,
      },
    };
  },

  async create(dto: CreateWorkLogDto): Promise<WorkLog> {
    const { data } = await apiClient.post<ApiResponse<WorkLog>>(
      "/work-logs",
      dto,
    );
    return data.data as WorkLog;
  },

  async update(id: string, dto: UpdateWorkLogDto): Promise<WorkLog> {
    const { data } = await apiClient.patch<ApiResponse<WorkLog>>(
      `/work-logs/${id}`,
      dto,
    );
    return data.data as WorkLog;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/work-logs/${id}`);
  },
};
