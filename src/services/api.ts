export class ApiError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly field?: string;
  readonly reason?: string;
  constructor(status: number, payload?: unknown) {
    super(`API error: ${status}`);
    this.status = status;
    if (payload && typeof payload === "object") {
      const detail = payload as Record<string, unknown>;
      if (typeof detail.code === "string") this.code = detail.code;
      if (typeof detail.field === "string") this.field = detail.field;
      if (typeof detail.reason === "string") this.reason = detail.reason;
    }
  }
}
async function apiError(response: Response) {
  let payload: unknown;
  try {
    payload = JSON.parse(await response.text());
  } catch {
    payload = undefined;
  }
  return new ApiError(response.status, payload);
}
export async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: body === undefined ? "GET" : "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      ...(body === undefined
        ? {}
        : {
            "Content-Type": "application/json",
            "X-Requested-With": "Aristoteles",
          }),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    if (response.status === 401 && path !== "/api/auth/login")
      window.dispatchEvent(new Event("auth-expired"));
    throw await apiError(response);
  }
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  return (text ? JSON.parse(text) : null) as T;
}

export async function apiForm<T>(path: string, body: FormData): Promise<T> {
  const response = await fetch(path, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "X-Requested-With": "Aristoteles",
    },
    body,
  });
  if (!response.ok) {
    if (response.status === 401)
      window.dispatchEvent(new Event("auth-expired"));
    throw await apiError(response);
  }
  return response.json() as Promise<T>;
}
