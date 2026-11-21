import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, jsonOk, parseBody, requireApiUser, route } from "@/lib/api";
import { requireVerifiedEmail } from "@/lib/guards";
import { enforceRateLimit } from "@/lib/rate-limit";
import { checkout } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  items: z
    .array(
      z.object({
        productId: z.string().uuid(),
        quantity: z.number().int().min(1).max(10),
      }),
    )
    .min(1)
    .max(20),
});

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const user = await requireApiUser();
  await requireVerifiedEmail(user.id);
  await enforceRateLimit(`checkout:${user.id}`, 12, 3600, "Too many checkout attempts. Try again later.");

  const body = await parseBody(req, schema);
  const result = await checkout(user.id, body.items);
  return jsonOk(result);
});
