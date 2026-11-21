import { getSettings } from "@/lib/settings";
import { SettingsForm, type SettingsValues } from "./settings-form";
import { pruneNow } from "./actions";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  const initial: SettingsValues = {
    dailyRewardsEnabled: Boolean(settings.dailyRewardsEnabled),
    spinEnabled: Boolean(settings.spinEnabled),
    storeEnabled: Boolean(settings.storeEnabled),
    storeMinAccountAgeMinutes: Number(settings.storeMinAccountAgeMinutes ?? 0),
    maintenanceMessage: String(settings.maintenanceMessage ?? ""),
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow mb-2">System</p>
        <h1 className="display-md">Network settings.</h1>
        <p className="mt-1 text-sm text-muted">
          Toggles are read by the API on every request — no restart required. Every change is logged
          with the actor and IP.
        </p>
      </header>

      <SettingsForm initial={initial} />

      <section className="panel p-5">
        <h2 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
          Housekeeping
        </h2>
        <p className="mt-1 text-xs text-muted">
          Expired sessions, email tokens, link codes, plugin nonces and rate-limit windows are pruned
          by the scheduler endpoint. Run it from your host cron:
        </p>
        <code className="mt-2 block overflow-x-auto rounded-lg border border-line bg-ink/60 p-3 font-mono text-[0.68rem] text-moss-bright">
          curl -X POST https://your-domain/api/cron/prune -H &quot;Authorization: Bearer $CRON_SECRET&quot;
        </code>
        <p className="mt-2 text-[0.66rem] text-muted">
          Last prune runs are safe to repeat. Nothing here touches player balances or orders.
        </p>
        <form action={pruneNow} className="mt-3">
          <button type="submit" className="btn btn-quiet btn-sm">
            Prune expired records now
          </button>
        </form>
      </section>
    </div>
  );
}
