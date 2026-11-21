"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CalendarPlus, Loader2, Save, X } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ApiClientError, api } from "@/lib/http-client";
import { formatDateTime } from "@/lib/format";

export type AdminEvent = {
  id: string;
  slug: string;
  title: string;
  description: string;
  coverImage: string | null;
  type: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  registrationOpen: boolean;
  prize: string | null;
  winner: string | null;
  registrations: number;
};

const statuses = ["upcoming", "active", "completed", "cancelled"] as const;

export function EventManager({ events }: { events: AdminEvent[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminEvent | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <FormAlert message={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {events.length} event{events.length === 1 ? "" : "s"} · prizes are delivered in-game
        </p>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreating(true);
            setError(null);
          }}
          className="btn btn-primary btn-sm"
        >
          <CalendarPlus className="size-3.5" /> New event
        </button>
      </div>

      {creating || editing ? (
        <EventForm
          key={editing?.id ?? "new"}
          event={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
          onError={setError}
        />
      ) : null}

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Type</th>
                <th>Status</th>
                <th>Starts</th>
                <th className="text-right">Entries</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id}>
                  <td>
                    <p className="font-semibold text-parchment">{event.title}</p>
                    <p className="font-mono text-[0.6rem] text-muted">/events/{event.slug}</p>
                  </td>
                  <td>
                    <Badge tone={event.type === "giveaway" ? "gold" : "moss"}>{event.type}</Badge>
                  </td>
                  <td>
                    <span
                      className={
                        event.status === "active"
                          ? "text-xs text-moss-bright"
                          : event.status === "cancelled"
                            ? "text-xs text-ember"
                            : "text-xs text-muted"
                      }
                    >
                      {event.status}
                    </span>
                  </td>
                  <td className="whitespace-nowrap text-xs text-muted">
                    {formatDateTime(event.startsAt)}
                  </td>
                  <td className="text-right font-mono text-xs text-parchment-dim">
                    {event.registrations}
                  </td>
                  <td className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setCreating(false);
                        setEditing(event);
                        setError(null);
                      }}
                      className="btn btn-quiet btn-sm"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function toLocalInput(value: string | null): string {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function EventForm({
  event,
  onClose,
  onSaved,
  onError,
}: {
  event: AdminEvent | null;
  onClose: () => void;
  onSaved: () => void;
  onError: (message: string | null) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(formEvent: React.FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setPending(true);
    setError(null);
    onError(null);
    setFieldErrors({});
    const form = new FormData(formEvent.currentTarget);

    const startsAt = String(form.get("startsAt") ?? "");
    const endsAt = String(form.get("endsAt") ?? "");

    const payload = {
      title: String(form.get("title") ?? ""),
      slug: String(form.get("slug") ?? "") || undefined,
      description: String(form.get("description") ?? ""),
      coverImage: String(form.get("coverImage") ?? "") || null,
      type: String(form.get("type") ?? "event"),
      status: String(form.get("status") ?? "upcoming"),
      startsAt: startsAt ? new Date(startsAt).toISOString() : "",
      endsAt: endsAt ? new Date(endsAt).toISOString() : null,
      registrationOpen: form.get("registrationOpen") === "on",
      prize: String(form.get("prize") ?? "") || null,
      winner: String(form.get("winner") ?? "") || null,
    };

    try {
      await api("/api/admin/events", {
        method: event ? "PATCH" : "POST",
        body: JSON.stringify(event ? { id: event.id, ...payload } : payload),
      });
      onSaved();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else setError("Could not save the event.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">{event ? `Edit ${event.title}` : "New event"}</h2>
        <button type="button" onClick={onClose} className="btn btn-quiet btn-sm" aria-label="Close">
          <X className="size-3.5" />
        </button>
      </div>

      <FormAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" error={fieldErrors.title}>
          <Input id="title" name="title" defaultValue={event?.title} required />
        </Field>
        <Field label="Slug" htmlFor="slug" hint="Leave blank to derive from the title.">
          <Input id="slug" name="slug" defaultValue={event?.slug} />
        </Field>
        <Field label="Type" htmlFor="type">
          <Select id="type" name="type" defaultValue={event?.type ?? "event"}>
            <option value="event">event</option>
            <option value="giveaway">giveaway</option>
          </Select>
        </Field>
        <Field label="Status" htmlFor="status">
          <Select id="status" name="status" defaultValue={event?.status ?? "upcoming"}>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Starts at" htmlFor="startsAt" error={fieldErrors.startsAt}>
          <Input
            id="startsAt"
            name="startsAt"
            type="datetime-local"
            defaultValue={toLocalInput(event?.startsAt ?? null)}
            required
          />
        </Field>
        <Field label="Ends at" htmlFor="endsAt" hint="Optional.">
          <Input id="endsAt" name="endsAt" type="datetime-local" defaultValue={toLocalInput(event?.endsAt ?? null)} />
        </Field>
        <Field label="Prize" htmlFor="prize" hint="Shown to players on the event page.">
          <Input id="prize" name="prize" defaultValue={event?.prize ?? ""} placeholder="5,000 coins + custom tag" />
        </Field>
        <Field label="Winner" htmlFor="winner" hint="Fill in when the event finishes.">
          <Input id="winner" name="winner" defaultValue={event?.winner ?? ""} />
        </Field>
      </div>

      <Field label="Cover image URL" htmlFor="coverImage">
        <Input id="coverImage" name="coverImage" defaultValue={event?.coverImage ?? ""} placeholder="/brand/events/build-battle.jpg" />
      </Field>

      <Field
        label="Description"
        htmlFor="description"
        hint="Supports ## headings, - lists, **bold**, `code` and [links](url)."
      >
        <Textarea id="description" name="description" rows={6} defaultValue={event?.description} />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            name="registrationOpen"
            defaultChecked={event?.registrationOpen ?? true}
            className="accent-[#6fae7b]"
          />
          Registration open
        </label>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-quiet btn-sm">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save event
          </button>
        </div>
      </div>
    </form>
  );
}
