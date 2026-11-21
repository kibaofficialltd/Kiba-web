"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, isAdmin } from "@/lib/auth";
import { pruneExpired } from "@/lib/settings";

export async function pruneNow() {
  const user = await getCurrentUser();
  if (!user || !isAdmin(user.role)) {
    throw new Error("Only administrators can run housekeeping.");
  }
  await pruneExpired();
  revalidatePath("/admin/settings");
}
