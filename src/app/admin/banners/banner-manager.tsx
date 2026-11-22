"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Field, Input } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";
import { cx } from "@/lib/cx";

export type AdminBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  linkUrl: string | null;
  buttonText: string | null;
  active: boolean;
  sortOrder: number;
};

export function BannerManager({ initialBanners }: { initialBanners: AdminBanner[] }) {
  const router = useRouter();
  const [banners, setBanners] = useState<AdminBanner[]>(initialBanners);
  const [editing, setEditing] = useState<AdminBanner | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setError(null);
  }

  function startEdit(banner: AdminBanner) {
    setCreating(false);
    setEditing(banner);
    setError(null);
  }

  async function toggleActive(banner: AdminBanner) {
    setPending(true);
    setError(null);
    try {
      await api("/api/admin/banners", {
        method: "PATCH",
        body: JSON.stringify({ id: banner.id, active: !banner.active }),
      });
      setBanners((prev) =>
        prev.map((b) => (b.id === banner.id ? { ...b, active: !b.active } : b)),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to toggle banner status.");
    } finally {
      setPending(false);
    }
  }

  async function deleteBanner(banner: AdminBanner) {
    if (!window.confirm(`Delete banner "${banner.title}"?`)) return;
    setPending(true);
    setError(null);
    try {
      await api(`/api/admin/banners?id=${banner.id}`, { method: "DELETE" });
      setBanners((prev) => prev.filter((b) => b.id !== banner.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to delete banner.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <FormAlert message={error} />

      {/* Recommended Dimension Notice */}
      <div className="rounded-xl border border-gold/30 bg-gold/[0.06] p-4 text-xs text-parchment-dim shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-gold/20 text-gold">
            <ImageIcon className="size-4" />
          </div>
          <div>
            <p className="font-semibold text-gold-bright">
              Banner Dimension & Ratio Requirement
            </p>
            <p className="mt-1 leading-relaxed">
              Top autoscrolling banners use a <strong>3:1 rectangle ratio</strong>.
              <br />
              Recommended image resolution:{" "}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-gold">
                1920 × 640 px
              </code>{" "}
              (or{" "}
              <code className="rounded bg-black/40 px-1.5 py-0.5 font-mono text-gold">
                1200 × 400 px
              </code>
              ). High-contrast gaming, esports, or Minecraft shaders backgrounds work best.
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {banners.length} banner{banners.length === 1 ? "" : "s"} · autoscrolls on homepage
        </p>
        <button type="button" onClick={startCreate} className="btn btn-primary btn-sm">
          <Plus className="size-3.5" /> Add new banner
        </button>
      </div>

      {creating || editing ? (
        <BannerForm
          key={editing?.id ?? "new"}
          banner={editing}
          onClose={() => {
            setCreating(false);
            setEditing(null);
          }}
          onSaved={() => {
            setCreating(false);
            setEditing(null);
            router.refresh();
          }}
        />
      ) : null}

      {/* Banners List */}
      <div className="grid gap-4">
        {banners.length === 0 ? (
          <div className="panel p-8 text-center text-xs text-muted">
            No custom banners created yet. The website is currently displaying the default welcome banner.
          </div>
        ) : (
          banners.map((banner) => (
            <div
              key={banner.id}
              className={cx(
                "panel flex flex-col overflow-hidden sm:flex-row sm:items-center sm:justify-between",
                !banner.active && "opacity-60",
              )}
            >
              <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 p-4">
                {/* 3:1 Thumbnail */}
                <div className="relative aspect-[3/1] w-full sm:w-56 shrink-0 overflow-hidden rounded-lg border border-line bg-ink">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={banner.imageUrl}
                    alt={banner.title}
                    className="size-full object-cover"
                  />
                  {!banner.active ? (
                    <span className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-muted">
                      Hidden
                    </span>
                  ) : null}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[0.6rem] font-mono text-muted">#{banner.sortOrder}</span>
                    <h3 className="truncate font-display text-base text-parchment">{banner.title}</h3>
                  </div>
                  {banner.subtitle ? (
                    <p className="line-clamp-1 text-xs text-muted">{banner.subtitle}</p>
                  ) : null}
                  {banner.linkUrl ? (
                    <a
                      href={banner.linkUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[0.68rem] text-gold hover:underline"
                    >
                      <ExternalLink className="size-3" /> {banner.linkUrl}
                      {banner.buttonText ? ` (${banner.buttonText})` : ""}
                    </a>
                  ) : null}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line/60 bg-ink/40 px-4 py-3 sm:border-l sm:border-t-0 sm:bg-transparent">
                <button
                  type="button"
                  onClick={() => toggleActive(banner)}
                  className="btn btn-quiet btn-sm"
                  title={banner.active ? "Hide banner" : "Show banner"}
                  disabled={pending}
                >
                  {banner.active ? <Eye className="size-3.5 text-moss" /> : <EyeOff className="size-3.5 text-muted" />}
                  <span className="hidden sm:inline">{banner.active ? "Active" : "Hidden"}</span>
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(banner)}
                  className="btn btn-quiet btn-sm"
                  title="Edit banner"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteBanner(banner)}
                  className="btn btn-quiet btn-sm text-ember hover:text-ember"
                  title="Delete banner"
                  disabled={pending}
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function BannerForm({
  banner,
  onClose,
  onSaved,
}: {
  banner: AdminBanner | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(banner?.imageUrl ?? "");

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    const payload = {
      title: String(form.get("title") ?? "").trim(),
      subtitle: String(form.get("subtitle") ?? "").trim() || null,
      imageUrl: String(form.get("imageUrl") ?? "").trim(),
      linkUrl: String(form.get("linkUrl") ?? "").trim() || null,
      buttonText: String(form.get("buttonText") ?? "").trim() || null,
      active: form.get("active") === "on",
      sortOrder: Number(form.get("sortOrder") ?? 0),
    };

    if (!payload.imageUrl) {
      setError("Please provide an image URL for the banner.");
      setPending(false);
      return;
    }

    try {
      await api("/api/admin/banners", {
        method: banner ? "PATCH" : "POST",
        body: JSON.stringify(banner ? { id: banner.id, ...payload } : payload),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save banner.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5 sm:p-6 border-gold/30">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">
          {banner ? `Edit Banner: ${banner.title}` : "Create New Banner"}
        </h2>
        <button type="button" onClick={onClose} className="btn btn-quiet btn-sm" aria-label="Close">
          <X className="size-3.5" />
        </button>
      </div>

      <FormAlert message={error} />

      {/* 3:1 Live Preview Box */}
      <div className="space-y-1.5">
        <span className="text-[0.62rem] font-bold uppercase tracking-[0.16em] text-muted">
          Live Preview (3:1 Rectangle Ratio · 1920×640 px recommended)
        </span>
        <div className="relative aspect-[3/1] w-full max-w-2xl overflow-hidden rounded-xl border border-line bg-ink">
          {imageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Banner preview"
                className="size-full object-cover"
                onError={() => setError("Image failed to load. Check that the URL is publicly accessible.")}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gold">Preview</span>
                <p className="font-display text-lg text-parchment">Sample Banner Heading</p>
              </div>
            </>
          ) : (
            <div className="flex size-full flex-col items-center justify-center gap-2 text-xs text-muted">
              <ImageIcon className="size-8 opacity-40" />
              <span>Enter an image URL below to see the 3:1 rectangle preview</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Banner Title" htmlFor="title" hint="Bold headline displayed on the slide.">
          <Input id="title" name="title" defaultValue={banner?.title} placeholder="e.g. Grand Opening Sale" required />
        </Field>

        <Field label="Subtitle / Description" htmlFor="subtitle" hint="Short promotional description.">
          <Input id="subtitle" name="subtitle" defaultValue={banner?.subtitle ?? ""} placeholder="e.g. 20% off all ranks this weekend" />
        </Field>

        <Field
          label="Image URL (3:1 Ratio)"
          htmlFor="imageUrl"
          hint="Must be rectangle. Recommended 1920x640px or 1200x400px."
        >
          <Input
            id="imageUrl"
            name="imageUrl"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... image.jpg / png / webp"
            required
          />
        </Field>

        <Field label="Target Link URL" htmlFor="linkUrl" hint="Page or external link opened on click.">
          <Input id="linkUrl" name="linkUrl" defaultValue={banner?.linkUrl ?? ""} placeholder="e.g. /store or /guide" />
        </Field>

        <Field label="Button Text" htmlFor="buttonText" hint="Action button text.">
          <Input id="buttonText" name="buttonText" defaultValue={banner?.buttonText ?? "Learn more"} placeholder="e.g. Shop Now" />
        </Field>

        <Field label="Sort Order" htmlFor="sortOrder" hint="Lower numbers appear first (e.g. 1, 2, 3).">
          <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={banner?.sortOrder ?? 0} />
        </Field>
      </div>

      <div className="flex items-center justify-between border-t border-line/60 pt-4">
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
          <input
            type="checkbox"
            name="active"
            defaultChecked={banner?.active ?? true}
            className="size-4 rounded accent-[#6fae7b]"
          />
          <span className="text-parchment font-medium">Active (visible on website)</span>
        </label>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-quiet btn-sm">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {banner ? "Save Changes" : "Create Banner"}
          </button>
        </div>
      </div>
    </form>
  );
}
