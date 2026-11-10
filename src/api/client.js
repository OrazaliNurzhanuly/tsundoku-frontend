import { storage } from "./storage";

const BASE = (import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api").replace(/\/$/, "");
const MOCK_MODE = import.meta.env.VITE_USE_MOCK || "auto";

export class ApiError extends Error {
  constructor(status, body) {
    const firstFieldError = body?.errors ? Object.values(body.errors).flat()[0] : null;
    super(firstFieldError || body?.message || `Ошибка сервера (${status})`);
    this.status = status;
    this.errors = body?.errors || {};
  }
}

// Решаем один раз за сессию: настоящий бэкенд или тестовые данные
let mockDecision = null;
export function isMockMode() {
  if (MOCK_MODE === "true") return Promise.resolve(true);
  if (MOCK_MODE === "false") return Promise.resolve(false);
  mockDecision ??= fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) })
    .then(res => !res.ok)
    .catch(() => true);
  return mockDecision;
}

export const getToken = () => storage.get("token");
export const setToken = token => storage.set("token", token);

export async function request(method, path, { query, body } = {}) {
  const token = getToken();

  if (await isMockMode()) {
    const { mockRequest } = await import("./mock.js");
    const res = await mockRequest(method, path, { query, body, token });
    return handle(res.status, res.body);
  }

  const url = new URL(BASE + path);
  for (const [key, value] of Object.entries(query || {})) {
    if (value !== undefined && value !== null && value !== "") url.searchParams.set(key, value);
  }

  let res;
  try {
    res = await fetch(url, {
      method,
      headers: {
        Accept: "application/json",
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(0, { message: "Сервер недоступен. Проверьте, что бэкенд запущен." });
  }
  const data = res.status === 204 ? null : await res.json().catch(() => null);
  return handle(res.status, data);
}

function handle(status, data) {
  if (status >= 400) {
    if (status === 401) window.dispatchEvent(new Event("auth:expired"));
    throw new ApiError(status, data);
  }
  return data;
}
