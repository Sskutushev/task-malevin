export interface ApiResponse<T = undefined> {
  success: boolean;
  data?: T;
  error?: { message: string; details?: unknown };
  meta?: { total?: number; page?: number; limit?: number; totalPages?: number };
}

export function successResponse<T>(
  data: T,
  meta?: ApiResponse["meta"],
): ApiResponse<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(
  message: string,
  details?: unknown,
): ApiResponse<never> {
  return {
    success: false,
    error: { message, ...(details !== undefined ? { details } : {}) },
  };
}
