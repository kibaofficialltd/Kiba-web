import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { getCurrentUser } from "@/lib/auth";
import { NotificationList } from "./notification-list";

export const metadata: Metadata = { title: "Notifications" };
export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, user.id))
    .orderBy(desc(notifications.createdAt))
    .limit(100);

  return (
    <div>
      <header className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow mb-2">Notifications</p>
          <h1 className="display-md">What changed while you were away.</h1>
          <p className="mt-1 text-sm text-muted">
            Link confirmations, reward deliveries, purchase updates and staff messages.
          </p>
        </div>
      </header>

      <NotificationList
        initial={rows.map((row) => ({
          id: row.id,
          type: row.type,
          title: row.title,
          body: row.body,
          link: row.link,
          readAt: row.readAt ? row.readAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
        }))}
      />
    </div>
  );
}
