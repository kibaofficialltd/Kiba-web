import type { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { onlinePlayers, serverStatus } from "@/db/schema";
import { jsonOk, route, ApiError } from "@/lib/api";
import { verifyPluginRequest } from "@/lib/plugin-auth";
import { pluginHeartbeatSchema } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = route(async (req: NextRequest) => {
  const { body } = await verifyPluginRequest(req);
  const rawBody = (body ?? {}) as Record<string, unknown>;
  const normalized = {
    ...rawBody,
    online: typeof rawBody.online === "boolean" ? rawBody.online : rawBody.status === "ONLINE",
    playersOnline:
      typeof rawBody.playersOnline === "number"
        ? rawBody.playersOnline
        : Number(rawBody.onlinePlayers) || 0,
    maxPlayers:
      typeof rawBody.maxPlayers === "number"
        ? rawBody.maxPlayers
        : Number(rawBody.maxPlayers) || 100,
    javaPlayers:
      typeof rawBody.javaPlayers === "number"
        ? rawBody.javaPlayers
        : Number(rawBody.javaPlayers) || 0,
    bedrockPlayers:
      typeof rawBody.bedrockPlayers === "number"
        ? rawBody.bedrockPlayers
        : Number(rawBody.bedrockPlayers) || 0,
    uptimeSeconds:
      typeof rawBody.uptimeSeconds === "number"
        ? rawBody.uptimeSeconds
        : Number(rawBody.uptimeSeconds) || 0,
    tps: rawBody.tps != null ? String(rawBody.tps) : undefined,
  };
  const parsed = pluginHeartbeatSchema.safeParse(normalized);
  if (!parsed.success) {
    throw new ApiError(422, "VALIDATION_ERROR", "Invalid heartbeat payload.", parsed.error.issues);
  }
  const data = parsed.data;
  const now = new Date();

  await db.transaction(async (tx) => {
    await tx
      .insert(serverStatus)
      .values({
        id: 1,
        online: data.online,
        motd: data.motd ?? null,
        version: data.version ?? null,
        playersOnline: data.playersOnline,
        maxPlayers: data.maxPlayers,
        javaPlayers: data.javaPlayers,
        bedrockPlayers: data.bedrockPlayers,
        uptimeSeconds: data.uptimeSeconds,
        tps: data.tps ?? null,
        host: data.host ?? null,
        port: data.port ?? null,
        lastHeartbeatAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: serverStatus.id,
        set: {
          online: data.online,
          motd: data.motd ?? null,
          version: data.version ?? null,
          playersOnline: data.playersOnline,
          maxPlayers: data.maxPlayers,
          javaPlayers: data.javaPlayers,
          bedrockPlayers: data.bedrockPlayers,
          uptimeSeconds: data.uptimeSeconds,
          tps: data.tps ?? null,
          lastHeartbeatAt: now,
          updatedAt: now,
          ...(data.host ? { host: data.host } : {}),
          ...(data.port ? { port: data.port } : {}),
        },
      });

    if (data.players) {
      await tx.delete(onlinePlayers);
      if (data.players.length > 0) {
        await tx.insert(onlinePlayers).values(
          data.players.map((player) => ({
            uuid: player.uuid.toLowerCase(),
            username: player.username,
            edition: player.edition,
            updatedAt: now,
          })),
        );
      }
    }
  });

  return jsonOk({ received: true, timestamp: now.toISOString() });
});
