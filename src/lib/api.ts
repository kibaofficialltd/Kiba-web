import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { ZodError, type ZodType } from "zod";
import { env } from "@/lib/env";
import { getCurrentUser, isAdmin, isStaff, type Role, type SessionUser } from "@/lib/auth";

export class ApiError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json(
      { ok: false, error: { code: error.code, message: error.message, details: error.details } },
      { status: error.status },
    );
  }
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Please check the highlighted fields.",
          details: error.issues.map((i) => ({ path: i.path.join("."), message: i.message })),
        },
      },
      { status: 422 },
    );
  }
  console.error("[api] unhandled error", error);
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } },
    { status: 500 },
  );
}

/** Wraps a route handler with consistent error handling. */
export function route<T extends unknown[]>(
  handler: (req: NextRequest, ...rest: T) => Promise<Response>,
) {
  return async (req: NextRequest, ...rest: T): Promise<Response> => {
    try {
      return await handler(req, ...rest);
    } catch (error) {
      return jsonError(error);
    }
  };
}

export function clientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "0.0.0.0";
}

export async function parseBody<S extends ZodType>(req: NextRequest, schema: S): Promise<import("zod").infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ApiError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }
  const result = schema.safeParse(raw);
  if (!result.success) throw result.error;
  return result.data;
}

/**
 * CSRF defence for cookie-authenticated mutations: the browser must send an
 * Origin header that matches this deployment. Requests without an Origin
 * (server-to-server, some mobile browsers) are rejected for state changes.
 */
export function assertSameOrigin(req: NextRequest): void {
  const origin = req.headers.get("origin");
  const referer = req.headers.get("referer");
  const expected = new URL(env.appUrl).host;
  const candidate = origin ?? (referer ? new URL(referer).origin : null);
  if (!candidate) {
    throw new ApiError(403, "ORIGIN_REQUIRED", "Missing request origin.");
  }
  const host = candidate.replace(/^https?:\/\//, "").split("/")[0];
  if (host !== expected) {
    throw new ApiError(403, "BAD_ORIGIN", "Cross-origin request rejected.");
  }
}

export async function requireApiUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "UNAUTHENTICATED", "Please sign in to continue.");
  return user;
}

export async function requireApiRole(roles: Role[]): Promise<SessionUser> {
  const user = await requireApiUser();
  if (!roles.includes(user.role)) {
    throw new ApiError(403, "FORBIDDEN", "You do not have permission to do that.");
  }
  return user;
}

export const requireApiStaff = () => requireApiRole(["helper", "moderator", "admin", "owner"]);
export const requireApiAdmin = () => requireApiRole(["admin", "owner"]);

export function assert(condition: unknown, status: number, code: string, message: string): asserts condition {
  if (!condition) throw new ApiError(status, code, message);
}

export { isAdmin, isStaff };
