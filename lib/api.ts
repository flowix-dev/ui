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
  run: (workflowId: string, file?: File) => {
    if (!file) {
      return api.post(`/workflows/${workflowId}/run`);
    }
    const form = new FormData();
    form.append("file", file);
    return api.post(`/workflows/${workflowId}/run`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getExecution: (executionId: string) => api.get(`/executions/${executionId}`),
  getWorkflowExecutions: (workflowId: string, page = 1, limit = 20) =>
    api.get(`/workflows/${workflowId}/executions?page=${page}&limit=${limit}`),
  getUserExecutions: (page = 1, limit = 20) =>
    api.get(`/executions?page=${page}&limit=${limit}`),
};

export const workflowCrudApi = {
  list: () => api.get("/workflows"),
  get: (id: string) => api.get(`/workflows/${id}`),
  create: (name: string, parentWorkflowId?: string) =>
    api.post("/workflows", { name, parentWorkflowId }),
  update: (
    id: string,
    data: { name?: string; nodes?: unknown[]; edges?: unknown[] },
  ) => api.patch(`/workflows/${id}`, data),
  delete: (id: string) => api.delete(`/workflows/${id}`),
};

export const nodeDefinitionsApi = {
  list: () => api.get("/node-definitions"),
};

export const modelApi = {
  list: () => api.get("/models"),
};

export const usersApi = {
  savePuterToken: (token: string) =>
    api.put("/users/me/puter-token", { token }),
  getPuterUsage: () => api.get("/users/me/puter-usage"),
};

export const chatApi = {
  list: () => api.get("/chats"),
  create: (data: { title?: string; model?: string; assistantId?: string }) =>
    api.post("/chats", data),
  get: (chatId: string) => api.get(`/chats/${chatId}`),
  update: (chatId: string, data: { title?: string; model?: string }) =>
    api.patch(`/chats/${chatId}`, data),
  delete: (chatId: string) => api.delete(`/chats/${chatId}`),
  getMessages: (chatId: string) => api.get(`/chats/${chatId}/messages`),
  listFiles: (chatId: string) => api.get(`/chats/${chatId}/files`),
  uploadFile: (chatId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/chats/${chatId}/files`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const assistantsApi = {
  list: () => api.get("/assistants"),
  get: (assistantId: string) => api.get(`/assistants/${assistantId}`),
  create: (data: { name: string; systemPrompt: string; model?: string }) =>
    api.post("/assistants", data),
  update: (
    assistantId: string,
    data: { name?: string; systemPrompt?: string; model?: string },
  ) => api.patch(`/assistants/${assistantId}`, data),
  delete: (assistantId: string) => api.delete(`/assistants/${assistantId}`),
  uploadFile: (assistantId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post(`/assistants/${assistantId}/files`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  deleteFile: (assistantId: string, fileName: string) =>
    api.delete(
      `/assistants/${assistantId}/files/${encodeURIComponent(fileName)}`,
    ),
};
