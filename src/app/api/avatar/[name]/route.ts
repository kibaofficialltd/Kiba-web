import { NextResponse } from "next/server";
import { avatarSvg } from "@/lib/minecraft";

export const runtime = "nodejs";

export async function GET(
  request: Request,
  ctx: { params: Promise<{ name: string }> },
) {
  const { name } = await ctx.params;
  const sizeParam = Number(new URL(request.url).searchParams.get("size") ?? 128);
  const size = [32, 64, 128, 256].includes(sizeParam) ? sizeParam : 128;
  const svg = avatarSvg(decodeURIComponent(name).slice(0, 32), size);

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400",
    },
  });
}
