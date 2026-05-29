export interface WorkLog {
  id: string;
  date: Date;
  workTypeId: string;
  workTypeGroup: string;
  workTypeName: string;
  volume: number;
  unit: string;
  executorName: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
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
  workTypeId?: string;
  page: number;
  limit: number;
  sortBy: "date" | "createdAt";
  sortOrder: "asc" | "desc";
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
