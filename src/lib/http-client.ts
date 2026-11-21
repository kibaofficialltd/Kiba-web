export type ApiErrorShape = {
  code: string;
  message: string;
  details?: unknown;
};

export class ApiClientError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(status: number, error: ApiErrorShape) {
    super(error.message);
    this.code = error.code;
    this.details = error.details;
    this.status = status;
  }

  /** Maps `{ field: message }` validation details into a form-friendly record. */
  get fieldErrors(): Record<string, string> {
    if (this.details && typeof this.details === "object" && !Array.isArray(this.details)) {
      const out: Record<string, string> = {};
      for (const [key, value] of Object.entries(this.details as Record<string, unknown>)) {
        if (typeof value === "string") out[key] = value;
        else if (Array.isArray(value) && typeof value[0] === "object") {
          const first = value[0] as { path?: string; message?: string };
          if (first?.path && first?.message) out[first.path] = first.message;
        }
      }
      return out;
    }
    if (Array.isArray(this.details)) {
      const out: Record<string, string> = {};
      for (const issue of this.details as Array<{ path?: string; message?: string }>) {
        if (issue.path && issue.message) out[issue.path] = issue.message;
      }
      return out;
    }
    return {};
  }
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    credentials: "same-origin",
  });

  let payload: unknown = null;
  try {
    payload = await res.json();
  } catch {
    // Non-JSON response (rare) — surface a generic failure.
  }

  if (!res.ok || (payload && typeof payload === "object" && "ok" in payload && !(payload as { ok: boolean }).ok)) {
    const error =
      payload && typeof payload === "object" && "error" in payload
        ? ((payload as { error: ApiErrorShape }).error ?? {
            code: "REQUEST_FAILED",
            message: "Request failed.",
          })
        : { code: "REQUEST_FAILED", message: `Request failed (${res.status}).` };
    throw new ApiClientError(res.status, error);
  }

  return (payload as { data: T }).data;
}
