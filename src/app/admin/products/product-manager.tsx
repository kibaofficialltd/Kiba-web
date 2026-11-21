"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Loader2, PackagePlus, Save, Trash2, X } from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";
import { formatCoins } from "@/lib/format";

export type AdminProduct = {
  id: string;
  slug: string;
  name: string;
  categoryId: string | null;
  categoryName: string | null;
  tagline: string;
  description: string;
  priceCoins: number;
  compareAtCoins: number | null;
  badge: string | null;
  commands: string[];
  perPlayerLimit: number | null;
  stock: number | null;
  featured: boolean;
  active: boolean;
  sortOrder: number;
};

export type Category = { id: string; name: string; slug: string };

export function ProductManager({
  products,
  categories,
}: {
  products: AdminProduct[];
  categories: Category[];
}) {
  const router = useRouter();
  const [editing, setEditing] = useState<AdminProduct | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function startCreate() {
    setEditing(null);
    setCreating(true);
    setError(null);
  }

  function startEdit(product: AdminProduct) {
    setCreating(false);
    setEditing(product);
    setError(null);
  }

  async function deactivate(product: AdminProduct) {
    if (!window.confirm(`Deactivate ${product.name}? Existing orders are unaffected.`)) return;
    setPending(true);
    setError(null);
    try {
      await api(`/api/admin/products?id=${product.id}`, { method: "DELETE" });
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Could not deactivate the product.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <FormAlert message={error} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted">
          {products.length} product{products.length === 1 ? "" : "s"} · prices are in coins
        </p>
        <button type="button" onClick={startCreate} className="btn btn-primary btn-sm">
          <PackagePlus className="size-3.5" /> New product
        </button>
      </div>

      {creating || editing ? (
        <ProductForm
          key={editing?.id ?? "new"}
          product={editing}
          categories={categories}
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
                <th>Product</th>
                <th>Category</th>
                <th className="text-right">Price</th>
                <th>Stock</th>
                <th>State</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => (
                <tr key={product.id}>
                  <td>
                    <p className="font-semibold text-parchment">{product.name}</p>
                    <p className="font-mono text-[0.6rem] text-muted">/store/{product.slug}</p>
                  </td>
                  <td className="text-xs text-muted">{product.categoryName ?? "—"}</td>
                  <td className="text-right font-mono text-xs text-gold-bright">
                    {formatCoins(product.priceCoins)}
                  </td>
                  <td className="text-xs text-muted">{product.stock ?? "∞"}</td>
                  <td>
                    <span className={product.active ? "text-xs text-moss-bright" : "text-xs text-ember"}>
                      {product.active ? "active" : "inactive"}
                    </span>
                    {product.featured ? <span className="ml-1 text-[0.6rem] text-gold">featured</span> : null}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button type="button" onClick={() => startEdit(product)} className="btn btn-quiet btn-sm">
                        Edit
                      </button>
                      {product.active ? (
                        <button
                          type="button"
                          onClick={() => deactivate(product)}
                          disabled={pending}
                          className="btn btn-quiet btn-sm text-ember"
                          aria-label={`Deactivate ${product.name}`}
                        >
                          <Trash2 className="size-3" />
                        </button>
                      ) : null}
                    </div>
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

function ProductForm({
  product,
  categories,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null;
  categories: Category[];
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
      name: String(form.get("name") ?? ""),
      slug: String(form.get("slug") ?? "") || undefined,
      categoryId: String(form.get("categoryId") ?? "") || null,
      tagline: String(form.get("tagline") ?? ""),
      description: String(form.get("description") ?? ""),
      priceCoins: Number(form.get("priceCoins") ?? 0),
      compareAtCoins: form.get("compareAtCoins") ? Number(form.get("compareAtCoins")) : null,
      badge: String(form.get("badge") ?? "") || null,
      commands: String(form.get("commands") ?? "")
        .split("\n")
        .map((line) => line.trim())
        .filter(Boolean),
      perPlayerLimit: form.get("perPlayerLimit") ? Number(form.get("perPlayerLimit")) : null,
      stock: form.get("stock") ? Number(form.get("stock")) : null,
      featured: form.get("featured") === "on",
      active: form.get("active") === "on",
      sortOrder: Number(form.get("sortOrder") ?? 0),
    };

    try {
      await api("/api/admin/products", {
        method: product ? "PATCH" : "POST",
        body: JSON.stringify(product ? { id: product.id, ...payload } : payload),
      });
      onSaved();
    } catch (err) {
      if (err instanceof ApiClientError) {
        setError(err.message);
        setFieldErrors(err.fieldErrors);
      } else setError("Could not save the product.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="panel space-y-4 p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">{product ? `Edit ${product.name}` : "New product"}</h2>
        <button type="button" onClick={onClose} className="btn btn-quiet btn-sm" aria-label="Close">
          <X className="size-3.5" />
        </button>
      </div>

      <FormAlert message={error} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" htmlFor="name" error={fieldErrors.name}>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </Field>
        <Field label="Slug" htmlFor="slug" error={fieldErrors.slug} hint="Leave blank to derive from the name.">
          <Input id="slug" name="slug" defaultValue={product?.slug} />
        </Field>
        <Field label="Category" htmlFor="categoryId">
          <Select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""}>
            <option value="">No category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Badge" htmlFor="badge" hint="Optional, e.g. Popular or Limited.">
          <Input id="badge" name="badge" defaultValue={product?.badge ?? ""} />
        </Field>
        <Field label="Price (coins)" htmlFor="priceCoins" error={fieldErrors.priceCoins}>
          <Input id="priceCoins" name="priceCoins" type="number" min={0} defaultValue={product?.priceCoins ?? 1000} required />
        </Field>
        <Field label="Compare-at price" htmlFor="compareAtCoins" hint="Optional original price for a discount label.">
          <Input id="compareAtCoins" name="compareAtCoins" type="number" min={0} defaultValue={product?.compareAtCoins ?? ""} />
        </Field>
        <Field label="Stock" htmlFor="stock" hint="Blank = unlimited.">
          <Input id="stock" name="stock" type="number" min={0} defaultValue={product?.stock ?? ""} />
        </Field>
        <Field label="Per-player limit" htmlFor="perPlayerLimit" hint="Blank = no limit.">
          <Input id="perPlayerLimit" name="perPlayerLimit" type="number" min={1} defaultValue={product?.perPlayerLimit ?? ""} />
        </Field>
        <Field label="Sort order" htmlFor="sortOrder">
          <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={product?.sortOrder ?? 0} />
        </Field>
        <div className="flex items-end gap-4">
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" name="featured" defaultChecked={product?.featured} className="accent-[#6fae7b]" />
            Featured
          </label>
          <label className="flex items-center gap-2 text-xs text-muted">
            <input type="checkbox" name="active" defaultChecked={product?.active ?? true} className="accent-[#6fae7b]" />
            Active
          </label>
        </div>
      </div>

      <Field label="Tagline" htmlFor="tagline">
        <Input id="tagline" name="tagline" defaultValue={product?.tagline} />
      </Field>

      <Field label="Description" htmlFor="description">
        <Textarea id="description" name="description" rows={3} defaultValue={product?.description} />
      </Field>

      <Field
        label="Delivery commands"
        htmlFor="commands"
        hint="One per line. Use {player} and {uuid}. Quantity multiplies the whole bundle."
      >
        <Textarea
          id="commands"
          name="commands"
          rows={5}
          defaultValue={product?.commands.join("\n")}
          className="font-mono text-xs"
        />
      </Field>

      <div className="flex justify-end gap-2">
        <button type="button" onClick={onClose} className="btn btn-quiet btn-sm">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          {product ? "Save product" : "Create product"}
        </button>
      </div>
    </form>
  );
}
