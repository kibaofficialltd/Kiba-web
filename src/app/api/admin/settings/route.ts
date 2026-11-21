import type { NextRequest } from "next/server";
import { z } from "zod";
import { assertSameOrigin, clientIp, jsonOk, parseBody, requireApiAdmin, route } from "@/lib/api";
import { audit } from "@/lib/audit";
import { setSetting, settingDefaults, type SettingKey } from "@/lib/settings";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.record(
  z.string(),
  z.union([z.boolean(), z.string().max(300), z.number().int().min(0).max(100_000)]),
);

export const POST = route(async (req: NextRequest) => {
  assertSameOrigin(req);
  const admin = await requireApiAdmin();
  const body = await parseBody(req, schema);

  const changed: string[] = [];
  for (const [key, value] of Object.entries(body)) {
    if (!(key in settingDefaults)) continue;
    await setSetting(key as SettingKey, value);
    changed.push(key);
  }

  await audit({
    actorId: admin.id,
    action: "admin.settings_updated",
    targetType: "settings",
    meta: { changed, ip: clientIp(req) },
  });

  return jsonOk({ updated: changed });
});
