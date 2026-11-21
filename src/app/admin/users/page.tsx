import { getAdminUsers } from "@/lib/admin";
import { getCurrentUser } from "@/lib/auth";
import { UserManager } from "./user-manager";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const [user, rows] = await Promise.all([getCurrentUser(), getAdminUsers(200)]);
  if (!user) return null;

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Players</p>
        <h1 className="display-md">Accounts & permissions.</h1>
        <p className="mt-1 text-sm text-muted">
          Staff roles control the console. Coin adjustments go through the ledger; nothing is edited
          silently.
        </p>
      </header>

      <UserManager
        viewerRole={user.role}
        users={rows.map((row) => ({
          id: row.id,
          email: row.email,
          username: row.username,
          role: row.role,
          status: row.status,
          balance: row.balance,
          emailVerifiedAt: row.emailVerifiedAt ? row.emailVerifiedAt.toISOString() : null,
          createdAt: row.createdAt.toISOString(),
          minecraftUsername: row.minecraftUsername,
          edition: row.edition,
        }))}
      />
    </div>
  );
}
