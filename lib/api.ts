import axios from "axios";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api",
  withCredentials: true,
  headers: { "Content-Type": "application/json" },
});

const AUTH_NO_REFRESH_ENDPOINTS = [
  "/auth/login",
  "/auth/register",
  "/auth/refresh",
];

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const isAuthEndpoint = AUTH_NO_REFRESH_ENDPOINTS.some((endpoint) =>
      originalRequest?.url?.endsWith(endpoint),
    );
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${api.defaults.baseURL}/auth/refresh`,
          {},
          { withCredentials: true },
        );
        return api(originalRequest);
      } catch {
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;

export const authApi = {
  register: (data: {
    firstName: string;
    lastName: string;
    email: string;
    password: string;
  }) => api.post("/auth/register", data),
  login: (data: { email: string; password: string }) =>
    api.post("/auth/login", data),
  logout: () => api.post("/auth/logout"),
  me: () => api.get("/auth/me"),
  refresh: () => api.post("/auth/refresh"),
};

export const workflowApi = {
  run: (workflowId: string) => api.post(`/workflows/${workflowId}/run`),
  getExecution: (executionId: string) => api.get(`/executions/${executionId}`),
  getWorkflowExecutions: (workflowId: string, page = 1, limit = 20) =>
    api.get(`/workflows/${workflowId}/executions?page=${page}&limit=${limit}`),
  getUserExecutions: (page = 1, limit = 20) =>
    api.get(`/executions?page=${page}&limit=${limit}`),
};

export const workflowCrudApi = {
  list: () => api.get("/workflows"),
  get: (id: string) => api.get(`/workflows/${id}`),
  create: (name: string) => api.post("/workflows", { name }),
  update: (
    id: string,
    data: { name?: string; nodes?: unknown[]; edges?: unknown[] },
  ) => api.patch(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
};

export const nodeDefinitionsApi = {
  list: () => api.get("/node-definitions"),
};
