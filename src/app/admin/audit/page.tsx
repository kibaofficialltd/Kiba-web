import { getAuditLog } from "@/lib/admin";
import { formatDateTime } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const entries = await getAuditLog(200);

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow mb-2">System</p>
        <h1 className="display-md">Audit log.</h1>
        <p className="mt-1 text-sm text-muted">
          Append-only record of staff actions, authentication events and economy changes. Entries are
          never edited or deleted from the console.
        </p>
      </header>

      <section className="panel overflow-hidden">
        {entries.length === 0 ? (
          <p className="px-4 py-12 text-center text-sm text-muted">No audit entries yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Target</th>
                  <th>IP</th>
                  <th>Meta</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap text-xs text-muted">
                      {formatDateTime(entry.createdAt)}
                    </td>
                    <td className="text-xs text-parchment-dim">{entry.actor ?? "system"}</td>
                    <td className="font-mono text-[0.68rem] text-parchment">{entry.action}</td>
                    <td className="text-xs text-muted">
                      {entry.targetType ? `${entry.targetType}` : "—"}
                      {entry.targetId ? (
                        <span className="ml-1 font-mono text-[0.6rem] text-muted/70">
                          {entry.targetId.slice(0, 8)}
                        </span>
                      ) : null}
                    </td>
                    <td className="font-mono text-[0.62rem] text-muted">{entry.ip ?? "—"}</td>
                    <td className="max-w-[260px]">
                      {entry.meta ? (
                        <code className="block truncate font-mono text-[0.6rem] text-muted/80">
                          {JSON.stringify(entry.meta)}
                        </code>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
