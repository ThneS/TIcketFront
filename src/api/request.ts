// ------------------------------------------------------------
// Unified API request helper for backend responses of shape:
// { code: number; message: string; data?: T }
// Includes:
//  - Base URL normalization
//  - Query param builder
//  - Automatic envelope unwrap & error mapping
//  - Request timeout (AbortController)
//  - Request-ID capture & exposure
//  - Graceful JSON parse fallbacks
// ------------------------------------------------------------

const RAW_BASE = import.meta.env?.VITE_API_BASE_URL as string | undefined;
const API_BASE = RAW_BASE ? trimTrailingSlash(RAW_BASE) : "";
// Runtime override (Dev Panel). Saved in localStorage for persistence during dev.
let RUNTIME_BASE: string | undefined = undefined;
const LS_KEY_OVERRIDE = "__API_BASE_URL_OVERRIDE__";
if (typeof window !== "undefined") {
  try {
    const v = window.localStorage.getItem(LS_KEY_OVERRIDE);
    if (v) {
      RUNTIME_BASE = trimTrailingSlash(v);
      if (import.meta.env.DEV)
        console.info("[api] Loaded API base override:", RUNTIME_BASE);
    }
  } catch {}
}
export function setRuntimeApiBase(url?: string) {
  if (url && url.trim() !== "") {
    RUNTIME_BASE = trimTrailingSlash(url.trim());
    try {
      window.localStorage.setItem(LS_KEY_OVERRIDE, RUNTIME_BASE);
    } catch {}
  } else {
    RUNTIME_BASE = undefined;
    try {
      window.localStorage.removeItem(LS_KEY_OVERRIDE);
    } catch {}
  }
  if (import.meta.env.DEV)
    console.info("[api] Runtime API base set to:", RUNTIME_BASE || "(cleared)");
}
export function getRuntimeApiBase() {
  return RUNTIME_BASE;
}
function effectiveBase() {
  return RUNTIME_BASE !== undefined ? RUNTIME_BASE : API_BASE;
}
const DEFAULT_TIMEOUT = 15_000; // 15s
const REQUEST_ID_HEADER =
  (import.meta.env?.VITE_REQUEST_ID_HEADER as string) || "x-request-id";

export interface ApiEnvelope<T> {
  code: number;
  message: string;
  data?: T;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  json?: unknown; // JSON body shortcut
  timeoutMs?: number; // custom timeout
  query?: Record<string, unknown | undefined | null>;
  signal?: AbortSignal; // external AbortSignal
  expectRaw?: boolean; // if true, skip envelope parsing
}

export class ApiError extends Error {
  status: number;
  code: number | undefined;
  messageText: string;
  requestId?: string;
  response?: Response;
  payload?: unknown;
  constructor(
    status: number,
    code: number | undefined,
    messageText: string,
    requestId?: string,
    response?: Response,
    payload?: unknown
  ) {
    super(messageText);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.messageText = messageText;
    this.requestId = requestId;
    this.response = response;
    this.payload = payload;
  }
}

function trimTrailingSlash(s: string) {
  return s.endsWith("/") ? s.slice(0, -1) : s;
}

function buildUrl(path: string, query?: RequestOptions["query"]): string {
  const base = path.startsWith("http") ? "" : effectiveBase();
  let url = base + (path.startsWith("/") ? path : `/${path}`);
  if (query && Object.keys(query).length) {
    const usp = new URLSearchParams();
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) continue;
      usp.append(k, String(v));
    }
    url += (url.includes("?") ? "&" : "?") + usp.toString();
  }
  return url;
}

async function safeParseJson<T>(res: Response): Promise<T | undefined> {
  const ct = res.headers.get("content-type") || "";
  if (!ct.includes("application/json")) return undefined;
  try {
    return (await res.json()) as T;
  } catch {
    return undefined;
  }
}

export async function request<T = unknown>(
  path: string,
  opts: RequestOptions = {}
): Promise<T> {
  if (!effectiveBase() && !path.startsWith("http")) {
    throw new ApiError(0, undefined, "API base URL not configured", undefined);
  }

  const { json, timeoutMs = DEFAULT_TIMEOUT, query, expectRaw, ...rest } = opts;

  // Merge headers (case-insensitive) & defaults
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...Object.fromEntries(
      Object.entries(rest.headers || {}).map(([k, v]) => [k, v as string])
    ),
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  const externalSignal = rest.signal;
  if (externalSignal) {
    if (externalSignal.aborted) controller.abort();
    else
      externalSignal.addEventListener("abort", () => controller.abort(), {
        once: true,
      });
  }

  const url = buildUrl(path, query);

  const fetchInit: RequestInit = {
    ...rest,
    method: rest.method || (json ? "POST" : "GET"),
    headers,
    signal: controller.signal,
  };
  if (json !== undefined) {
    (fetchInit as any).body = JSON.stringify(json);
  }

  let response: Response | undefined;
  try {
    response = await fetch(url, fetchInit);
  } catch (e: any) {
    clearTimeout(timeout);
    if (e?.name === "AbortError") {
      throw new ApiError(
        0,
        undefined,
        `Request timeout after ${timeoutMs}ms`,
        undefined
      );
    }
    throw new ApiError(0, undefined, e?.message || "Network error", undefined);
  } finally {
    clearTimeout(timeout);
  }

  const requestId = response.headers.get(REQUEST_ID_HEADER) || undefined;

  if (!response.ok) {
    const payload = await safeParseJson<unknown>(response);
    const text = payload
      ? undefined
      : await response.text().catch(() => undefined);
    // Attempt to extract business info if shape matches
    const code = (payload as any)?.code;
    const msg = (payload as any)?.message || text || `HTTP ${response.status}`;
    throw new ApiError(
      response.status,
      code,
      msg,
      requestId,
      response,
      payload
    );
  }

  if (expectRaw) {
    return (await safeParseJson<any>(response)) as T;
  }

  const envelope = await safeParseJson<ApiEnvelope<T>>(response);
  if (!envelope) {
    throw new ApiError(
      response.status,
      undefined,
      "Invalid JSON response",
      requestId,
      response
    );
  }
  if (typeof envelope.code !== "number") {
    throw new ApiError(
      response.status,
      undefined,
      "Malformed envelope (missing code)",
      requestId,
      response,
      envelope
    );
  }
  if (envelope.code !== 0) {
    throw new ApiError(
      response.status,
      envelope.code,
      envelope.message || "API error",
      requestId,
      response,
      envelope
    );
  }
  return envelope.data as T;
}

// Shorthand helpers
export const http = {
  get: <T>(path: string, opts: Omit<RequestOptions, "method" | "json"> = {}) =>
    request<T>(path, { ...opts, method: "GET" }),
  post: <T>(
    path: string,
    body?: unknown,
    opts: Omit<RequestOptions, "method" | "json" | "body"> = {}
  ) => request<T>(path, { ...opts, method: "POST", json: body }),
  put: <T>(
    path: string,
    body?: unknown,
    opts: Omit<RequestOptions, "method" | "json" | "body"> = {}
  ) => request<T>(path, { ...opts, method: "PUT", json: body }),
  delete: <T>(
    path: string,
    opts: Omit<RequestOptions, "method" | "json"> = {}
  ) => request<T>(path, { ...opts, method: "DELETE" }),
};

// Backwards compatibility simple exports
export const get = http.get;
export const post = <T>(url: string, data?: unknown) => http.post<T>(url, data);

export function isApiEnabled(): boolean {
  return Boolean(effectiveBase());
}
export function getApiBaseUrl(): string | undefined {
  const b = effectiveBase();
  return b || undefined;
}

// Capture last request id for diagnostics (simple in‑memory; can wire to a store)
let lastRequestId: string | undefined;
export function setLastRequestId(rid?: string) {
  lastRequestId = rid;
}
export function getLastRequestId() {
  return lastRequestId;
}
