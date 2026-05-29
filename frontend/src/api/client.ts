import axios, { AxiosError } from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_URL ?? "/api"}/v1`;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: { message?: string } }>) => {
    const message =
      error.response?.data?.error?.message ?? error.message ?? "Network error";
    return Promise.reject(new Error(message));
  },
);
