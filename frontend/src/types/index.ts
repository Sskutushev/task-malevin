export interface WorkType {
  id: string;
  groupName: string;
  name: string;
  unit: string;
  quantityHint: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkLog {
  id: string;
  date: string;
  workTypeId: string;
  workTypeGroup: string;
  workTypeName: string;
  volume: number;
  unit: string;
  executorName: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkLogDto {
  date: string;
  workTypeId: string;
  volume: number;
  unit: string;
  executorName: string;
  notes?: string;
}

export type UpdateWorkLogDto = Partial<CreateWorkLogDto>;

export interface WorkLogFilters {
  dateFrom?: string;
  dateTo?: string;
  workTypeGroup?: string;
  page?: number;
  limit?: number;
  sortBy?: "date" | "createdAt";
  sortOrder?: "asc" | "desc";
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
}
