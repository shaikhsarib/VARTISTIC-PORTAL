/**
 * Typed API client for the versioned portal API.
 * - echoes the CSRF cookie into X-CSRF-Token on mutations
 * - surfaces the API error envelope as a typed ApiClientError
 */
export type ApiClientError = Error & {
  code: string;
  status: number;
  details?: { field: string; message: string }[];
};

function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]) : null;
}

export async function api<T>(
  path: string,
  opts: { method?: string; body?: unknown; signal?: AbortSignal } = {},
): Promise<T> {
  const method = opts.method ?? "GET";
  const headers: Record<string, string> = {};
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";
  if (!["GET", "HEAD", "OPTIONS"].includes(method)) {
    const csrf = readCookie("vartistic_csrf");
    if (csrf) headers["x-csrf-token"] = csrf;
  }
  const res = await fetch(path, {
    method,
    headers,
    credentials: "same-origin",
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
    signal: opts.signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(json?.error?.message ?? "Request failed") as ApiClientError;
    err.code = json?.error?.code ?? "INTERNAL";
    err.status = res.status;
    err.details = json?.error?.details;
    throw err;
  }
  return json as T;
}
