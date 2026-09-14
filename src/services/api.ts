export class ApiError extends Error {
  readonly status: number;
  constructor(status: number) {
    super(`API error: ${status}`);
    this.status = status;
  }
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
    throw new ApiError(response.status);
  }
  return response.status === 204
    ? (undefined as T)
    : (response.json() as Promise<T>);
}
