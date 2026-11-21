"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";
import { Input, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";

export type SettingsValues = {
  dailyRewardsEnabled: boolean;
  spinEnabled: boolean;
  storeEnabled: boolean;
  storeMinAccountAgeMinutes: number;
  maintenanceMessage: string;
};

export function SettingsForm({ initial }: { initial: SettingsValues }) {
  const [values, setValues] = useState(initial);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setDone(false);
    try {
      await api("/api/admin/settings", {
        method: "POST",
        body: JSON.stringify(values),
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not save settings.");
    } finally {
      setPending(false);
    }
  }

  function toggle(key: keyof SettingsValues) {
    setValues((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  return (
    <form onSubmit={save} className="space-y-5">
      <FormAlert message={error} />
      {done ? <FormAlert tone="success" message="Settings saved. Changes are live immediately." /> : null}

      <section className="panel overflow-hidden">
        <div className="border-b border-line/70 px-5 py-3.5">
          <h2 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
            Gameplay systems
          </h2>
        </div>
        <div className="divide-y divide-line/50">
          <ToggleRow
            label="Daily rewards"
            description="Allow players to claim the daily coin reward and build streaks."
            checked={values.dailyRewardsEnabled}
            onChange={() => toggle("dailyRewardsEnabled")}
          />
          <ToggleRow
            label="Daily spin"
            description="Enable the weighted coin wheel. One spin per UTC day."
            checked={values.spinEnabled}
            onChange={() => toggle("spinEnabled")}
          />
          <ToggleRow
            label="Coin store"
            description="Allow checkout. Disabling hides nothing but blocks new orders."
            checked={values.storeEnabled}
            onChange={() => toggle("storeEnabled")}
          />
        </div>
      </section>

      <section className="panel space-y-4 p-5">
        <div>
          <h2 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
            Store safeguards
          </h2>
          <p className="mt-1 text-xs text-muted">
            Minimum account age before checkout, in minutes. 0 disables the check.
          </p>
        </div>
        <Input
          type="number"
          min={0}
          max={100000}
          value={values.storeMinAccountAgeMinutes}
          onChange={(event) =>
            setValues((prev) => ({
              ...prev,
              storeMinAccountAgeMinutes: Math.max(0, Number(event.target.value) || 0),
            }))
          }
          aria-label="Minimum account age in minutes"
        />
      </section>

      <section className="panel space-y-3 p-5">
        <div>
          <h2 className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-parchment">
            Maintenance notice
          </h2>
          <p className="mt-1 text-xs text-muted">
            Shown in the site header when non-empty. Leave blank for normal operation.
          </p>
        </div>
        <Textarea
          rows={3}
          value={values.maintenanceMessage}
          onChange={(event) =>
            setValues((prev) => ({ ...prev, maintenanceMessage: event.target.value.slice(0, 300) }))
          }
          placeholder="Scheduled maintenance: the store will be read-only from 22:00 UTC."
        />
      </section>

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          Save settings
        </button>
      </div>
    </form>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 px-5 py-4">
      <span>
        <span className="block text-sm font-semibold text-parchment">{label}</span>
        <span className="mt-0.5 block text-xs text-muted">{description}</span>
      </span>
      <span
        className={
          checked
            ? "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-moss/80 transition"
            : "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full bg-line transition"
        }
      >
        <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
        <span
          className={
            checked
              ? "ml-auto mr-0.5 size-4 rounded-full bg-ink transition"
              : "ml-0.5 size-4 rounded-full bg-muted/60 transition"
          }
        />
      </span>
    </label>
  );
}
