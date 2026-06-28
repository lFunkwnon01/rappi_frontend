/**
 * Cliente HTTP para el backend Popeyes desplegado en AWS.
 * Base URL: API Gateway del stack dev3 (multi-tenant).
 *
 * Convención:
 * - Todas las funciones devuelven la promesa del body `data` (ya parseado).
 * - Lanza ApiError si success:false en la respuesta, con el mensaje del backend.
 * - Si falla el fetch (red, 500, etc.) lanza un Error genérico.
 */

import type {
  Order,
  OrderStatus,
  User,
  AuthResponse,
  Store,
  Product,
  CreateOrderInput,
  WorkflowTask,
  DashboardSummary,
} from "./types";

export const API_BASE =
  "https://lzlfyhmww8.execute-api.us-east-1.amazonaws.com";

const TOKEN_KEY = "popeyes_jwt";
const USER_KEY = "popeyes_user";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function request<T>(
  path: string,
  init: RequestInit & { token?: string | null } = {},
): Promise<T> {
  const { token, ...rest } = init;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> | undefined),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers });
  let body: ApiResponse<T> | null = null;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    // body no es JSON
  }
  if (!res.ok || !body || !body.success) {
    const msg = body?.error || `HTTP ${res.status}`;
    throw new ApiError(msg, res.status, body);
  }
  return body.data as T;
}

// ============================================================
// Auth
// ============================================================


export const auth = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const data = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    return data;
  },
  async register(input: {
    email: string;
    password: string;
    name: string;
    role?: string;
    tenantId?: string;
    storeId?: string;
  }): Promise<AuthResponse> {
    return request<AuthResponse>("/auth/register", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
  async me(token: string): Promise<User> {
    return request<User>("/auth/me", { token });
  },
};

// ============================================================
// Stores
// ============================================================


export const stores = {
  async list(token: string | null): Promise<Store[]> {
    return request<Store[]>("/stores", { token });
  },
};

// ============================================================
// Products
// ============================================================



export const products = {
  async list(storeId: string, token: string | null): Promise<Product[]> {
    return request<Product[]>(`/products?storeId=${encodeURIComponent(storeId)}`, { token });
  },
};

// ============================================================
// Orders
// ============================================================



export const orders = {
  async create(input: CreateOrderInput, token: string): Promise<Order> {
    return request<Order>("/orders", {
      method: "POST",
      token,
      body: JSON.stringify(input),
    });
  },
  async list(token: string | null, filters?: { storeId?: string; status?: OrderStatus }): Promise<Order[]> {
    const params = new URLSearchParams();
    if (filters?.storeId) params.set("storeId", filters.storeId);
    if (filters?.status) params.set("status", filters.status);
    const qs = params.toString();
    return request<Order[]>(`/orders${qs ? `?${qs}` : ""}`, { token });
  },
  async get(orderId: string, token: string): Promise<Order> {
    return request<Order>(`/orders/${encodeURIComponent(orderId)}`, { token });
  },
};

// ============================================================
// Tasks
// ============================================================


export const tasks = {
  async list(token: string, filters?: { status?: string; orderId?: string }): Promise<WorkflowTask[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.set("status", filters.status);
    if (filters?.orderId) params.set("orderId", filters.orderId);
    const qs = params.toString();
    return request<WorkflowTask[]>(`/tasks${qs ? `?${qs}` : ""}`, { token });
  },
  async complete(taskId: string, token: string): Promise<{ taskId: string; status: string; completedAt: string }> {
    return request(`/tasks/${encodeURIComponent(taskId)}/complete`, {
      method: "POST",
      token,
      body: "{}",
    });
  },
};

// ============================================================
// Dashboard
// ============================================================


export const dashboard = {
  async get(token: string): Promise<DashboardSummary> {
    return request<DashboardSummary>("/dashboard/summary", { token });
  },
};

// ============================================================
// Token helpers (persistencia en localStorage)
// ============================================================

// Re-exportar los tipos para conveniencia
export type {
  AuthResponse,
  Store,
  Product,
  ProductCategory,
  Order,
  OrderItem,
  OrderItemPayload,
  OrderStatus,
  OrderOrigin,
  PaymentMethod,
  CreateOrderInput,
  WorkflowTask,
  WorkflowStep,
  DashboardSummary,
  User,
  Role,
  OrderEvent,
} from "./types";

export const tokenStore = {
  get(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },
  set(token: string): void {
    localStorage.setItem(TOKEN_KEY, token);
  },
  clear(): void {
    localStorage.removeItem(TOKEN_KEY);
  },
  getUser(): User | null {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },
  setUser(user: User): void {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },
  clearUser(): void {
    localStorage.removeItem(USER_KEY);
  },
};
