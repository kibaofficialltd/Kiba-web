"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FilePlus2, Loader2, Save, X } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { ApiClientError, api } from "@/lib/http-client";
import { formatDate } from "@/lib/format";

export type AdminAnnouncement = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  coverImage: string | null;
  pinned: boolean;
  published: boolean;
  publishedAt: string;
};

const categories = ["update", "feature", "maintenance", "event", "giveaway", "notice"];

export function AnnouncementManager({ posts }: { posts: AdminAnnouncement[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminAnnouncement | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="space-y-4">
      <FormAlert message={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">{posts.length} dispatch{posts.length === 1 ? "" : "es"}</p>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setCreating(true);
          }}
          className="btn btn-primary btn-sm"
        >
          <FilePlus2 className="size-3.5" /> New dispatch
        </button>
      </div>

      {creating || editing ? (
        <AnnouncementForm
          key={editing?.id ?? "new"}
          post={editing}
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

      <section className="panel overflow-hidden">
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Dispatch</th>
                <th>Category</th>
                <th>Published</th>
                <th>State</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {posts.map((post) => (
                <tr key={post.id}>
                  <td>
                    <p className="font-semibold text-parchment">{post.title}</p>
                    <p className="font-mono text-[0.6rem] text-muted">/news/{post.slug}</p>
                  </td>
                  <td>
                    <Badge tone="moss">{post.category}</Badge>
                  </td>
                  <td className="text-xs text-muted">{formatDate(post.publishedAt)}</td>
                  <td>
                    <span className={post.published ? "text-xs text-moss-bright" : "text-xs text-ember"}>
                      {post.published ? "published" : "draft"}
                    </span>
                    {post.pinned ? <span className="ml-1 text-[0.6rem] text-gold">pinned</span> : null}
                  </td>
                  <td className="text-right">
                    <button type="button" onClick={() => setEditing(post)} className="btn btn-quiet btn-sm">
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

function AnnouncementForm({
  post,
  onClose,
  onSaved,
}: {
  post: AdminAnnouncement | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    const form = new FormData(event.currentTarget);
    const payload = {
      title: String(form.get("title") ?? ""),
      slug: String(form.get("slug") ?? "") || undefined,
      excerpt: String(form.get("excerpt") ?? ""),
      body: String(form.get("body") ?? ""),
      category: String(form.get("category") ?? "update"),
      coverImage: String(form.get("coverImage") ?? "") || null,
      pinned: form.get("pinned") === "on",
      published: form.get("published") === "on",
    };

    try {
      await api("/api/admin/announcements", {
        method: post ? "PATCH" : "POST",
        body: JSON.stringify(post ? { id: post.id, ...payload } : payload),
      });
      onSaved();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else setError("Could not save the dispatch.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">{post ? "Edit dispatch" : "New dispatch"}</h2>
        <button type="button" onClick={onClose} className="btn btn-quiet btn-sm" aria-label="Close">
          <X className="size-3.5" />
        </button>
      </div>

      <FormAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" htmlFor="title" error={fieldErrors.title}>
          <Input id="title" name="title" defaultValue={post?.title} required />
        </Field>
        <Field label="Slug" htmlFor="slug" hint="Leave blank to derive from the title.">
          <Input id="slug" name="slug" defaultValue={post?.slug} />
        </Field>
        <Field label="Category" htmlFor="category">
          <Select id="category" name="category" defaultValue={post?.category ?? "update"}>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Cover image URL" htmlFor="coverImage">
          <Input id="coverImage" name="coverImage" defaultValue={post?.coverImage ?? ""} placeholder="/brand/news/season-one.jpg" />
        </Field>
      </div>

      <Field label="Excerpt" htmlFor="excerpt">
        <Textarea id="excerpt" name="excerpt" rows={2} defaultValue={post?.excerpt} />
      </Field>

      <Field
        label="Body"
        htmlFor="body"
        hint="Supports ## headings, - lists, **bold**, `code` and [links](url)."
      >
        <Textarea id="body" name="body" rows={10} defaultValue={post?.body} />
      </Field>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" name="published" defaultChecked={post?.published ?? true} className="accent-[#6fae7b]" />
            Published
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" name="pinned" defaultChecked={post?.pinned} className="accent-[#6fae7b]" />
            Pinned
          </label>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="btn btn-quiet btn-sm">
            Cancel
          </button>
          <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
            {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
            Save dispatch
          </button>
        </div>
      </div>
    </form>
  );
}
