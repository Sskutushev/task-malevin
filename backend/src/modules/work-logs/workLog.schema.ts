import { z } from "zod";

const ISO_DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

export const createWorkLogSchema = z.object({
  date: z.string().regex(ISO_DATE_REGEX),
  workTypeId: z.string().min(1),
  volume: z.coerce.number().positive().max(999999.99),
  unit: z.string().min(1).max(20),
  executorName: z.string().trim().min(2).max(200),
  notes: z.string().trim().max(5000).optional(),
});

export const updateWorkLogSchema = createWorkLogSchema.partial();

export const workLogFiltersSchema = z.object({
  dateFrom: z.string().regex(ISO_DATE_REGEX).optional(),
  dateTo: z.string().regex(ISO_DATE_REGEX).optional(),
  workTypeGroup: z.string().optional(),
  workTypeId: z.string().optional(),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["date", "createdAt"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
