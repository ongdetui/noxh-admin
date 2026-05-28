import type {
  AiStatsResponse,
  DocumentAnalysesFilter,
  DocumentAnalysesListResponse,
  DocumentAnalysisDetail,
} from "@/types/ai";
import type { AuthResponse, LoginDto } from "@/types/auth";
import type {
  NewsDetail,
  NewsFilter,
  NewsItem,
  NewsListResponse,
  UpdateNewsDto,
} from "@/types/news";
import type {
  Project,
  ProjectFilter,
  ProjectListResponse,
  UpdateProjectDto,
} from "@/types/project";
import axios from "axios";

const http = axios.create({ baseURL: "/api/v1" });

// Bare instance for refresh calls — no interceptors, avoids loops
const bare = axios.create({ baseURL: "/api/v1" });

// --- Refresh queue ---
let isRefreshing = false;
let queue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function flushQueue(err: unknown, token: string | null) {
  queue.forEach(({ resolve, reject }) =>
    err ? reject(err) : resolve(token!),
  );
  queue = [];
}

function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  window.location.href = "/login";
}

// --- Request interceptor: attach access token ---
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// --- Response interceptor 1: unwrap ApiResponse wrapper ---
// Auth endpoints return { statusCode, message, data }, admin endpoints return data directly
http.interceptors.response.use((res) => {
  const body = res.data;
  if (
    typeof body === "object" &&
    body !== null &&
    "statusCode" in body &&
    "message" in body
  ) {
    res.data = body.data;
  }
  return res;
});

// --- Response interceptor 2: handle 401 with token refresh ---
http.interceptors.response.use(undefined, async (err) => {
  const original = err.config as typeof err.config & { _retry?: boolean };

  if (
    err.response?.status === 401 &&
    !original._retry &&
    original.url !== "/auth/refresh"
  ) {
    // Queue subsequent 401s while refreshing
    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        queue.push({ resolve, reject });
      }).then((token) => {
        original.headers.Authorization = `Bearer ${token}`;
        return http(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem("refreshToken");
    if (!refreshToken) {
      isRefreshing = false;
      clearSession();
      return Promise.reject(err);
    }

    try {
      // Use bare instance — no interceptors — response is raw ApiResponse
      const res = await bare.post<{
        data: { accessToken: string; refreshToken: string };
      }>("/auth/refresh", { refreshToken });

      const { accessToken, refreshToken: newRefresh } = res.data.data;
      localStorage.setItem("accessToken", accessToken);
      localStorage.setItem("refreshToken", newRefresh);

      http.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
      original.headers.Authorization = `Bearer ${accessToken}`;

      flushQueue(null, accessToken);
      return http(original);
    } catch (refreshErr) {
      flushQueue(refreshErr, null);
      clearSession();
      return Promise.reject(refreshErr);
    } finally {
      isRefreshing = false;
    }
  }

  // Normalize error message (NestJS sometimes returns string[], sometimes string)
  const msg =
    err.response?.data?.message ?? err.message ?? "Có lỗi xảy ra";
  throw new Error(Array.isArray(msg) ? msg.join(", ") : msg, { cause: err });
});

// --- Generic request helper ---
async function request<T>(
  method: "get" | "post" | "patch" | "delete",
  path: string,
  data?: unknown,
  params?: Record<string, string>,
): Promise<T> {
  const res = await http.request<T>({ method, url: path, data, params });
  return res.data;
}

export const adminProjectsApi = {
  list: (filter: ProjectFilter) => {
    const params: Record<string, string> = {
      page: String(filter.page),
      limit: String(filter.limit),
    };
    if (filter.search) params.search = filter.search;
    if (filter.city) params.city = filter.city;
    if (filter.status) params.status = filter.status;
    if (filter.isActive !== undefined)
      params.isActive = String(filter.isActive);
    if (filter.isVerified !== undefined)
      params.isVerified = String(filter.isVerified);
    return request<ProjectListResponse>(
      "get",
      "/admin/projects",
      undefined,
      params,
    );
  },
  getOne: (id: number) => request<Project>("get", `/admin/projects/${id}`),
  update: (id: number, body: UpdateProjectDto) =>
    request<Project>("patch", `/admin/projects/${id}`, body),
  verify: (id: number) =>
    request<{ id: number; name: string; isVerified: boolean }>(
      "patch",
      `/admin/projects/${id}/verify`,
    ),
  cancelVerify: (id: number) =>
    request<{ id: number; name: string; isVerified: boolean }>(
      "patch",
      `/admin/projects/${id}/unverify`,
    ),
  remove: (id: number) =>
    request<{ success: boolean }>("delete", `/admin/projects/${id}`),
};

export const adminNewsApi = {
  list: (filter: NewsFilter) => {
    const params: Record<string, string> = {
      page: String(filter.page),
      limit: String(filter.limit),
    };
    if (filter.search) params.search = filter.search;
    if (filter.city) params.city = filter.city;
    if (filter.source) params.source = filter.source;
    if (filter.isActive !== undefined)
      params.isActive = String(filter.isActive);
    if (filter.unlinked) params.unlinked = "true";
    return request<NewsListResponse>("get", "/admin/news", undefined, params);
  },
  getOne: (id: number) => request<NewsDetail>("get", `/admin/news/${id}`),
  update: (id: number, body: UpdateNewsDto) =>
    request<NewsItem>("patch", `/admin/news/${id}`, body),
  remove: (id: number) =>
    request<{ success: boolean }>("delete", `/admin/news/${id}`),
};

export const adminAiApi = {
  stats: (params: { dateFrom?: string; dateTo?: string }) => {
    const p: Record<string, string> = {};
    if (params.dateFrom) p.dateFrom = params.dateFrom;
    if (params.dateTo) p.dateTo = params.dateTo;
    return request<AiStatsResponse>("get", "/admin/ai/stats", undefined, p);
  },
  listAnalyses: (filter: DocumentAnalysesFilter) => {
    const params: Record<string, string> = {
      page: String(filter.page),
      limit: String(filter.limit),
    };
    if (filter.userId) params.userId = filter.userId;
    if (filter.dateFrom) params.dateFrom = filter.dateFrom;
    if (filter.dateTo) params.dateTo = filter.dateTo;
    return request<DocumentAnalysesListResponse>(
      "get",
      "/admin/ai/analyses",
      undefined,
      params,
    );
  },
  getAnalysis: (id: string) =>
    request<DocumentAnalysisDetail>("get", `/admin/ai/analyses/${id}`),
};

export const authApi = {
  login: (body: LoginDto) =>
    request<AuthResponse>("post", "/auth/login", body),
};
