import { API_BASE } from "@/config";
import type { ApiError } from "@/types/common";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

type Options = {
  method?: HttpMethod;
  body?: unknown;
  signal?: AbortSignal;
  headers?: Record<string, string>;
  // If an endpoint returns non-JSON (not in our case), we could extend here.
};

function isApiError(x: unknown): x is ApiError {
  return !!x && typeof x === "object" && "detail" in x;
}

export async function fetchJson<T>(
  path: string,
  { method = "GET", body, signal, headers = {} }: Options = {}
): Promise<T> {
  const url = path.startsWith("http") ? path : `${API_BASE}${path}`;

  const res = await fetch(url, {
    method,
    signal,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");

  if (!res.ok) {
    let detail = `HTTP ${res.status}`;
    if (isJson) {
      try {
        const data = (await res.json()) as unknown;
        if (isApiError(data) && data.detail) detail = data.detail;
      } catch {
        // ignore parse error
      }
    }
    throw new Error(detail);
  }

  if (isJson) {
    return (await res.json()) as T;
  }
  // Fallback: if server returns empty body
  return undefined as unknown as T;
}

/** Helper to build query strings with optional params */
export function qs(params: Record<string, string | number | boolean | null | undefined>) {
  const sp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "") sp.set(k, String(v));
  });
  const s = sp.toString();
  return s ? `?${s}` : "";
}
