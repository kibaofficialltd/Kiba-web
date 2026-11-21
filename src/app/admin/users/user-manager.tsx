"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Coins, Loader2, Save, ShieldAlert, UserCog } from "lucide-react";
import { Input, Select } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";
import { formatNumber, formatDate } from "@/lib/format";
import { cx } from "@/lib/cx";

export type AdminUserRow = {
  id: string;
  email: string;
  username: string;
  role: string;
  status: string;
  balance: number;
  emailVerifiedAt: string | null;
  createdAt: string;
  minecraftUsername: string | null;
  edition: string | null;
};

export function UserManager({ users, viewerRole }: { users: AdminUserRow[]; viewerRole: string }) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<AdminUserRow | null>(null);

  const filtered = users.filter((user) => {
    const haystack = `${user.username} ${user.email} ${user.minecraftUsername ?? ""}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
  });

  return (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="panel overflow-hidden">
        <div className="border-b border-line/70 p-3">
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search players, emails or Minecraft names…"
            aria-label="Search players"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Player</th>
                <th>Role</th>
                <th>Status</th>
                <th className="text-right">Balance</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id} className={cx(selected?.id === user.id && "bg-white/[0.03]")}>
                  <td>
                    <p className="font-semibold text-parchment">{user.username}</p>
                    <p className="text-[0.62rem] text-muted">{user.email}</p>
                    {user.minecraftUsername ? (
                      <p className="text-[0.6rem] text-moss">
                        {user.minecraftUsername} · {user.edition}
                      </p>
                    ) : null}
                  </td>
                  <td>
                    <span className={user.role === "player" ? "text-xs text-muted" : "text-xs text-gold"}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <span
                      className={
                        user.status === "active" ? "text-xs text-moss-bright" : "text-xs text-ember"
                      }
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="text-right font-mono text-xs text-gold-bright">
                    {formatNumber(user.balance)}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => setSelected(user)}
                      className="btn btn-quiet btn-sm"
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <aside className="xl:sticky xl:top-6 xl:self-start">
        {selected ? (
          <UserEditor
            key={selected.id}
            user={selected}
            viewerRole={viewerRole}
            onDone={() => setSelected(null)}
          />
        ) : (
          <div className="panel p-6 text-center">
            <UserCog className="mx-auto size-7 text-muted/40" />
            <p className="mt-2 font-display text-base">Select a player</p>
            <p className="mt-1 text-xs text-muted">
              Role changes, suspensions and coin adjustments are written to the audit log.
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}

function UserEditor({
  user,
  viewerRole,
  onDone,
}: {
  user: AdminUserRow;
  viewerRole: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [coinDelta, setCoinDelta] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const ownerOnly = viewerRole !== "owner";

  async function save() {
    setPending(true);
    setError(null);
    setDone(false);
    try {
      await api(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify({
          role,
          status,
          coinDelta: coinDelta.trim() ? Number(coinDelta) : undefined,
          note: note.trim() || undefined,
        }),
      });
      setDone(true);
      setCoinDelta("");
      setNote("");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not update this player.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="panel overflow-hidden">
      <div className="border-b border-line/70 px-4 py-3">
        <p className="text-[0.6rem] font-bold uppercase tracking-[0.18em] text-muted">Manage player</p>
        <p className="mt-0.5 truncate font-display text-lg">{user.username}</p>
        <p className="text-[0.62rem] text-muted">joined {formatDate(user.createdAt)}</p>
      </div>

      <div className="space-y-3 p-4">
        <FormAlert message={error} />
        {done ? <FormAlert tone="success" message="Player updated." /> : null}

        <label className="block">
          <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted">Role</span>
          <Select value={role} onChange={(event) => setRole(event.target.value)}>
            {["player", "helper", "moderator", "admin", "owner"].map((value) => (
              <option key={value} value={value} disabled={ownerOnly && (value === "admin" || value === "owner")}>
                {value}
              </option>
            ))}
          </Select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted">Status</span>
          <Select value={status} onChange={(event) => setStatus(event.target.value)}>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
          </Select>
        </label>

        <label className="block">
          <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted">
            Coin adjustment
          </span>
          <Input
            type="number"
            value={coinDelta}
            onChange={(event) => setCoinDelta(event.target.value)}
            placeholder="e.g. 500 or -250"
          />
          <span className="mt-1 block text-[0.62rem] text-muted">
            Current balance: {formatNumber(user.balance)}. Negative values cannot take it below zero.
          </span>
        </label>

        <label className="block">
          <span className="mb-1 block text-[0.6rem] font-bold uppercase tracking-[0.14em] text-muted">
            Reason (audit note)
          </span>
          <Input value={note} onChange={(event) => setNote(event.target.value)} placeholder="Event prize correction" />
        </label>

        <button type="button" onClick={save} disabled={pending} className="btn btn-primary btn-sm btn-block">
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Save changes
        </button>

        <div className="flex flex-wrap gap-2 pt-1">
          <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[0.58rem] text-muted">
            <Coins className="size-2.5" /> {formatNumber(user.balance)} coins
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-line px-2 py-0.5 text-[0.58rem] text-muted">
            <ShieldAlert className="size-2.5" /> {user.status}
          </span>
        </div>

        <button type="button" onClick={onDone} className="btn btn-quiet btn-sm w-full">
          Close
        </button>
      </div>
    </div>
  );
}
