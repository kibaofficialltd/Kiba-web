"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Images,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";
import { cx } from "@/lib/cx";

export type AdminGuide = {
  id: string;
  slug: string;
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image: string | null;
  published: boolean;
  sortOrder: number;
  updatedAt?: Date | string;
};

const COMMON_CATEGORIES = [
  "Getting Started",
  "Economy & Coins",
  "Land Protection",
  "Ranks & Perks",
  "Commands & Controls",
  "Java & Bedrock Setup",
  "Rules & Fair Play",
];

export function GuideManager({ initialGuides }: { initialGuides: AdminGuide[] }) {
  const router = useRouter();
  const [guides, setGuides] = useState<AdminGuide[]>(initialGuides);
  const [editing, setEditing] = useState<AdminGuide | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setError(null);
  }

  function startEdit(guide: AdminGuide) {
    setCreating(false);
    setEditing(guide);
    setError(null);
  }

  async function togglePublished(guide: AdminGuide) {
    setPending(true);
    setError(null);
    try {
      await api("/api/admin/guides", {
        method: "PATCH",
        body: JSON.stringify({ id: guide.id, published: !guide.published }),
      });
      setGuides((prev) =>
        prev.map((g) => (g.id === guide.id ? { ...g, published: !g.published } : g)),
      );
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to toggle guide status.");
    } finally {
      setPending(false);
    }
  }

  async function deleteGuide(guide: AdminGuide) {
    if (!window.confirm(`Delete guide "${guide.title}"?`)) return;
    setPending(true);
    setError(null);
    try {
      await api(`/api/admin/guides?id=${guide.id}`, { method: "DELETE" });
      setGuides((prev) => prev.filter((g) => g.id !== guide.id));
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to delete guide.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-6">
      <FormAlert message={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {guides.length} guide{guides.length === 1 ? "" : "s"} · published in documentation
        </p>
        <button type="button" onClick={startCreate} className="btn btn-primary btn-sm">
          <Plus className="size-3.5" /> Write new guide
        </button>
      </div>

      {creating || editing ? (
        <GuideForm
          key={editing?.id ?? "new"}
          guide={editing}
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

      {/* Guides List */}
      <div className="grid gap-4">
        {guides.length === 0 ? (
          <div className="panel p-8 text-center text-xs text-muted">
            No guides created yet. Click &quot;Write new guide&quot; to publish your first player guide.
          </div>
        ) : (
          guides.map((guide) => (
            <div
              key={guide.id}
              className={cx(
                "panel flex flex-col sm:flex-row sm:items-center sm:justify-between overflow-hidden",
                !guide.published && "opacity-60",
              )}
            >
              <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-4 p-4">
                {/* Image or Icon Preview */}
                <div className="relative aspect-video w-full sm:w-40 shrink-0 overflow-hidden rounded-lg border border-line bg-ink">
                  {guide.image ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={guide.image}
                      alt={guide.title}
                      className="size-full object-cover"
                    />
                  ) : (
                    <div className="flex size-full flex-col items-center justify-center gap-1 text-muted text-[0.65rem] bg-ink/50">
                      <BookOpen className="size-5 text-gold/40" />
                      <span>Text only</span>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-gold/15 px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider text-gold-bright">
                      {guide.category}
                    </span>
                    <span className="text-[0.6rem] font-mono text-muted">#{guide.sortOrder}</span>
                  </div>
                  <h3 className="truncate font-display text-base text-parchment">{guide.title}</h3>
                  <p className="line-clamp-1 text-xs text-muted">{guide.excerpt || "No summary provided."}</p>
                  <p className="text-[0.65rem] font-mono text-muted">/guide/{guide.slug}</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 border-t border-line/60 bg-ink/40 px-4 py-3 sm:border-l sm:border-t-0 sm:bg-transparent">
                <a
                  href={`/guide/${guide.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-quiet btn-sm"
                  title="View published guide"
                >
                  <ExternalLink className="size-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => togglePublished(guide)}
                  className="btn btn-quiet btn-sm"
                  title={guide.published ? "Unpublish guide" : "Publish guide"}
                  disabled={pending}
                >
                  {guide.published ? (
                    <Eye className="size-3.5 text-moss" />
                  ) : (
                    <EyeOff className="size-3.5 text-muted" />
                  )}
                  <span className="hidden sm:inline">
                    {guide.published ? "Published" : "Draft"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => startEdit(guide)}
                  className="btn btn-quiet btn-sm"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteGuide(guide)}
                  className="btn btn-quiet btn-sm text-ember hover:text-ember"
                  title="Delete guide"
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

function GuideForm({
  guide,
  onClose,
  onSaved,
}: {
  guide: AdminGuide | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState(guide?.image ?? "");
  const [category, setCategory] = useState(guide?.category ?? "Getting Started");
  const [customCategory, setCustomCategory] = useState(
    guide && !COMMON_CATEGORIES.includes(guide.category) ? guide.category : "",
  );
  const [content, setContent] = useState(guide?.content ?? "");
  const [newImgUrl, setNewImgUrl] = useState("");
  const [newImgCaption, setNewImgCaption] = useState("");

  // Live scan for all images currently inside markdown content
  const extractedImages = useMemo(() => {
    const list: { alt: string; src: string; raw: string }[] = [];
    const regex = /!\[([^\]]*)\]\(([^)]+)\)/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(content)) !== null) {
      list.push({ alt: match[1] || "Screenshot", src: match[2], raw: match[0] });
    }
    return list;
  }, [content]);

  function insertImageIntoContent(url: string, caption: string) {
    if (!url.trim()) return;
    const tag = `\n\n![${caption.trim() || "Guide illustration"}](${url.trim()})\n\n`;
    setContent((prev) => prev + tag);
    setNewImgUrl("");
    setNewImgCaption("");
  }

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);

    const finalCategory = customCategory.trim() || category;

    const payload = {
      title: String(form.get("title") ?? "").trim(),
      slug: String(form.get("slug") ?? "").trim() || undefined,
      category: finalCategory,
      excerpt: String(form.get("excerpt") ?? "").trim(),
      content: content.trim(),
      image: imageUrl.trim() || null,
      sortOrder: Number(form.get("sortOrder") ?? 0),
      published: form.get("published") === "on",
    };

    if (!payload.title || !payload.content) {
      setError("Please provide a title and article content.");
      setPending(false);
      return;
    }

    try {
      await api("/api/admin/guides", {
        method: guide ? "PATCH" : "POST",
        body: JSON.stringify(guide ? { id: guide.id, ...payload } : payload),
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Failed to save guide.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-5 p-5 sm:p-6 border-gold/30">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">
          {guide ? `Edit Guide: ${guide.title}` : "Write New Guide"}
        </h2>
        <button type="button" onClick={onClose} className="btn btn-quiet btn-sm" aria-label="Close">
          <X className="size-3.5" />
        </button>
      </div>

      <FormAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Guide Title" htmlFor="title" hint="Clear, descriptive headline.">
          <Input id="title" name="title" defaultValue={guide?.title} placeholder="e.g. How to Claim Land" required />
        </Field>

        <Field label="URL Slug" htmlFor="slug" hint="Leave blank to auto-generate from title.">
          <Input id="slug" name="slug" defaultValue={guide?.slug} placeholder="e.g. how-to-claim-land" />
        </Field>

        <Field label="Category" htmlFor="categorySelect">
          <Select
            id="categorySelect"
            value={customCategory ? "custom" : category}
            onChange={(e) => {
              if (e.target.value === "custom") {
                setCustomCategory(category);
              } else {
                setCustomCategory("");
                setCategory(e.target.value);
              }
            }}
          >
            {COMMON_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="custom">+ Custom Category</option>
          </Select>
        </Field>

        {customCategory || !COMMON_CATEGORIES.includes(category) ? (
          <Field label="Custom Category Name" htmlFor="customCat">
            <Input
              id="customCat"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Enter category name"
            />
          </Field>
        ) : (
          <Field label="Sort Order" htmlFor="sortOrder" hint="Lower numbers appear first.">
            <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={guide?.sortOrder ?? 0} />
          </Field>
        )}
      </div>

      {/* --- OPTIONAL IMAGE SYSTEM --- */}
      <div className="rounded-xl border border-line bg-ink/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-gold">
            Featured Image (Optional)
          </span>
          {imageUrl ? (
            <button
              type="button"
              onClick={() => setImageUrl("")}
              className="text-xs text-ember hover:underline flex items-center gap-1"
            >
              <Trash2 className="size-3" /> Remove image
            </button>
          ) : null}
        </div>

        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="relative aspect-video w-full sm:w-48 shrink-0 overflow-hidden rounded-xl border border-line/80 bg-ink">
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="Guide cover preview"
                className="size-full object-cover"
                onError={() =>
                  setError("Cover image failed to load. Please check that the URL is valid.")
                }
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 text-muted text-[0.62rem] text-center p-2">
                <ImageIcon className="size-6 opacity-30" />
                <span>No image provided (Displays text layout)</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1 w-full">
            <Field
              label="Cover Image URL"
              htmlFor="guideImage"
              hint="Optional. If omitted, the guide displays with a clean dark-fantasy typography header."
            >
              <Input
                id="guideImage"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... cover-photo.jpg or png"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* --- MULTI-IMAGE & SCREENSHOTS MANAGER --- */}
      <div className="rounded-xl border border-gold/40 bg-ink-raised/50 p-4 sm:p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
          <div>
            <span className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-gold-bright flex items-center gap-1.5">
              <Images className="size-4 text-gold" /> Guide Screenshots & Images ({extractedImages.length})
            </span>
            <p className="text-xs text-muted mt-0.5">
              Add multiple screenshots, diagrams, and photos into your guide. They will be formatted with full lightbox zoom!
            </p>
          </div>
        </div>

        {/* Add New Image Form */}
        <div className="grid gap-2.5 sm:grid-cols-12 rounded-xl border border-line/80 bg-ink/80 p-3.5 items-end">
          <div className="sm:col-span-6 space-y-1">
            <label className="text-[0.68rem] font-medium text-parchment">Image URL</label>
            <Input
              value={newImgUrl}
              onChange={(e) => setNewImgUrl(e.target.value)}
              placeholder="https://... or /guides/..."
              className="text-xs"
            />
          </div>
          <div className="sm:col-span-4 space-y-1">
            <label className="text-[0.68rem] font-medium text-parchment">Caption / Step Title</label>
            <Input
              value={newImgCaption}
              onChange={(e) => setNewImgCaption(e.target.value)}
              placeholder="e.g. Step 1: Tap Menu Button"
              className="text-xs"
            />
          </div>
          <div className="sm:col-span-2">
            <button
              type="button"
              onClick={() => insertImageIntoContent(newImgUrl, newImgCaption)}
              disabled={!newImgUrl.trim()}
              className="btn btn-gold btn-sm w-full inline-flex items-center justify-center gap-1"
            >
              <Plus className="size-3.5" /> Insert
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[0.65rem] text-muted font-medium">Quick presets:</span>
          <button
            type="button"
            onClick={() => insertImageIntoContent("/guides/banners/guide-hero-banner.jpg", "Guide Hero Banner")}
            className="rounded-full border border-line bg-ink px-2.5 py-1 text-[0.65rem] text-parchment-dim hover:border-gold hover:text-gold transition"
          >
            + Guide Banner
          </button>
          <button
            type="button"
            onClick={() => insertImageIntoContent("/guides/link/step-1-open-menu.png", "Step 1: Open Menu")}
            className="rounded-full border border-line bg-ink px-2.5 py-1 text-[0.65rem] text-parchment-dim hover:border-gold hover:text-gold transition"
          >
            + Menu Step
          </button>
          <button
            type="button"
            onClick={() => insertImageIntoContent("/guides/link/step-4-generate-code.png", "Generate Link Code")}
            className="rounded-full border border-line bg-ink px-2.5 py-1 text-[0.65rem] text-parchment-dim hover:border-gold hover:text-gold transition"
          >
            + Link Code
          </button>
          <button
            type="button"
            onClick={() => insertImageIntoContent("/guides/link/step-6-in-game-link.jpg", "In-Game Chat Command")}
            className="rounded-full border border-line bg-ink px-2.5 py-1 text-[0.65rem] text-parchment-dim hover:border-gold hover:text-gold transition"
          >
            + In-Game Chat
          </button>
        </div>

        {/* Grid of images currently inside this guide */}
        {extractedImages.length > 0 ? (
          <div className="space-y-2 pt-2 border-t border-line/60">
            <span className="text-[0.65rem] font-bold text-parchment uppercase tracking-wider">
              Images in this guide ({extractedImages.length})
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
              {extractedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="group relative aspect-video rounded-xl overflow-hidden border border-line bg-ink shadow-sm"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img.src} alt={img.alt} className="size-full object-cover" />
                  <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition flex flex-col justify-between p-2">
                    <span className="text-[0.62rem] text-parchment truncate font-medium">{img.alt}</span>
                    <button
                      type="button"
                      onClick={() => setContent((prev) => prev.replace(img.raw, ""))}
                      className="btn btn-sm py-0.5 text-[0.65rem] text-ember bg-ink/90 hover:bg-ember hover:text-white transition"
                      title="Remove from guide"
                    >
                      <Trash2 className="size-2.5 inline mr-1" /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      <Field label="Excerpt / Summary" htmlFor="excerpt" hint="Short 1-2 sentence preview for the guide card.">
        <Input id="excerpt" name="excerpt" defaultValue={guide?.excerpt} placeholder="Brief summary of what players learn in this guide." />
      </Field>

      <Field
        label="Guide Content (Markdown Supported)"
        htmlFor="content"
        hint="Supports headings (#, ##), bullet lists (-), bold (**text**), code (`/command`), and images (![caption](url))."
      >
        <Textarea
          id="content"
          name="content"
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="# Guide Title&#10;&#10;Explain step-by-step how to play...&#10;&#10;![Screenshot Description](https://...image.png)&#10;&#10;## Commands&#10;- `/link <code>` - Link your account"
          className="font-mono text-xs"
          required
        />
      </Field>

      <div className="flex items-center justify-between border-t border-line/60 pt-4">
        <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
          <input
            type="checkbox"
            name="published"
            defaultChecked={guide?.published ?? true}
            className="size-4 rounded accent-[#6fae7b]"
          />
          <span className="text-parchment font-medium">Published (visible on website)</span>
        </label>

        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-quiet btn-sm">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            {guide ? "Save Changes" : "Publish Guide"}
          </button>
        </div>
      </div>
    </form>
  );
}
