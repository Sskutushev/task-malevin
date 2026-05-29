import { ApiResponse, WorkType } from "@/types";
import { apiClient } from "./client";

export const workTypesApi = {
  async getAll(): Promise<WorkType[]> {
    const { data } =
      await apiClient.get<ApiResponse<WorkType[]>>("/work-types");
    return data.data ?? [];
  },
};
