"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Image as ImageIcon,
  Loader2,
  PackagePlus,
  Percent,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { FormAlert } from "@/components/ui/form";
import { ApiClientError, api } from "@/lib/http-client";
import { formatCoins } from "@/lib/format";
import { cx } from "@/lib/cx";

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
  image: string | null;
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
          {products.length} product{products.length === 1 ? "" : "s"} · square images & discounts supported
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
                <th className="text-right">Price / Discount</th>
                <th>Stock</th>
                <th>State</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((product) => {
                const hasDiscount =
                  product.compareAtCoins && product.compareAtCoins > product.priceCoins;
                const discountPct = hasDiscount
                  ? Math.round(
                      ((product.compareAtCoins! - product.priceCoins) / product.compareAtCoins!) * 100,
                    )
                  : null;

                return (
                  <tr key={product.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        {/* Square Product Image (1:1) */}
                        <div className="relative aspect-square size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-ink">
                          {product.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={product.image}
                              alt={product.name}
                              className="size-full object-cover"
                            />
                          ) : (
                            <div className="flex size-full items-center justify-center text-[0.6rem] text-muted">
                              <ImageIcon className="size-4 opacity-40" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-parchment truncate">{product.name}</p>
                          <p className="font-mono text-[0.6rem] text-muted">/store/{product.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-xs text-muted">{product.categoryName ?? "—"}</td>
                    <td className="text-right font-mono text-xs">
                      {hasDiscount ? (
                        <div>
                          <span className="line-through text-muted/70 mr-1.5 text-[0.7rem]">
                            {formatCoins(product.compareAtCoins!)}
                          </span>
                          <span className="text-gold-bright font-bold">
                            {formatCoins(product.priceCoins)}
                          </span>
                          <span className="ml-1.5 inline-block rounded bg-ember/20 px-1 py-0.5 text-[0.6rem] font-bold text-ember">
                            −{discountPct}%
                          </span>
                        </div>
                      ) : (
                        <span className="text-gold-bright">{formatCoins(product.priceCoins)}</span>
                      )}
                    </td>
                    <td className="text-xs text-muted">{product.stock ?? "∞"}</td>
                    <td>
                      <span
                        className={
                          product.active ? "text-xs text-moss-bright" : "text-xs text-ember"
                        }
                      >
                        {product.active ? "active" : "inactive"}
                      </span>
                      {product.featured ? (
                        <span className="ml-1 text-[0.6rem] text-gold font-bold">featured</span>
                      ) : null}
                    </td>
                    <td className="text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="btn btn-quiet btn-sm"
                        >
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
                );
              })}
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

  // Product Image (Square 1:1)
  const [imageUrl, setImageUrl] = useState(product?.image ?? "");

  // Discount & Pricing
  const [priceCoins, setPriceCoins] = useState(product?.priceCoins ?? 1000);
  const [compareAtCoins, setCompareAtCoins] = useState<string>(
    product?.compareAtCoins ? String(product.compareAtCoins) : "",
  );

  function applyDiscountPercent(percent: number) {
    const base = compareAtCoins ? Number(compareAtCoins) : priceCoins;
    if (base <= 0) return;
    const discounted = Math.max(1, Math.round(base * (1 - percent / 100)));
    setCompareAtCoins(String(base));
    setPriceCoins(discounted);
  }

  function removeDiscount() {
    if (compareAtCoins) {
      setPriceCoins(Number(compareAtCoins));
    }
    setCompareAtCoins("");
  }

  const numCompare = compareAtCoins ? Number(compareAtCoins) : 0;
  const isDiscounted = numCompare > priceCoins;
  const discountPercent = isDiscounted
    ? Math.round(((numCompare - priceCoins) / numCompare) * 100)
    : 0;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setFieldErrors({});
    const form = new FormData(event.currentTarget);

    const payload = {
      name: String(form.get("name") ?? "").trim(),
      slug: String(form.get("slug") ?? "").trim() || undefined,
      categoryId: String(form.get("categoryId") ?? "") || null,
      tagline: String(form.get("tagline") ?? "").trim(),
      description: String(form.get("description") ?? "").trim(),
      priceCoins: Number(priceCoins),
      compareAtCoins: compareAtCoins ? Number(compareAtCoins) : null,
      image: imageUrl.trim() || null,
      badge: String(form.get("badge") ?? "").trim() || null,
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
    <form onSubmit={onSubmit} className="panel space-y-5 p-5 sm:p-6 border-gold/30">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg">
          {product ? `Edit Product: ${product.name}` : "Create New Store Product"}
        </h2>
        <button type="button" onClick={onClose} className="btn btn-quiet btn-sm" aria-label="Close">
          <X className="size-3.5" />
        </button>
      </div>

      <FormAlert message={error} />

      {/* --- SQUARE IMAGE SYSTEM (1:1 Ratio) --- */}
      <div className="rounded-xl border border-line bg-ink/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-gold">
            Product Image (Square 1:1 Aspect Ratio)
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
          {/* 1:1 Square Preview Box */}
          <div className="relative aspect-square size-24 shrink-0 overflow-hidden rounded-xl border border-line/80 bg-ink shadow-inner">
            {imageUrl ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={imageUrl}
                alt="Product preview"
                className="size-full object-cover"
                onError={() =>
                  setError("Product image failed to load. Please verify the URL.")
                }
              />
            ) : (
              <div className="flex size-full flex-col items-center justify-center gap-1 text-muted text-[0.6rem] text-center p-2">
                <ImageIcon className="size-6 opacity-30" />
                <span>Square 1:1 Preview</span>
              </div>
            )}
          </div>

          <div className="flex-1 space-y-1 w-full">
            <Field
              label="Square Image URL"
              htmlFor="image"
              hint="Must be square 1:1 ratio. Recommended: 500 × 500 px or 600 × 600 px."
            >
              <Input
                id="image"
                name="image"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://... product-icon.png or jpg"
              />
            </Field>
          </div>
        </div>
      </div>

      {/* --- DISCOUNT & PRICING SYSTEM --- */}
      <div className="rounded-xl border border-line bg-ink/60 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[0.64rem] font-bold uppercase tracking-[0.18em] text-gold">
            Pricing & Discount System
          </span>
          {isDiscounted ? (
            <button
              type="button"
              onClick={removeDiscount}
              className="text-xs text-ember hover:underline"
            >
              Remove discount
            </button>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Current Price (Coins)"
            htmlFor="priceCoins"
            error={fieldErrors.priceCoins}
            hint="Amount deducted from player's balance on checkout."
          >
            <Input
              id="priceCoins"
              name="priceCoins"
              type="number"
              min={0}
              value={priceCoins}
              onChange={(e) => setPriceCoins(Number(e.target.value))}
              required
            />
          </Field>

          <Field
            label="Compare-At / Original Price (Coins)"
            htmlFor="compareAtCoins"
            hint="Set higher than Current Price to display a strikethrough discount."
          >
            <Input
              id="compareAtCoins"
              name="compareAtCoins"
              type="number"
              min={0}
              value={compareAtCoins}
              onChange={(e) => setCompareAtCoins(e.target.value)}
              placeholder="Leave blank for regular price"
            />
          </Field>
        </div>

        {/* Quick Discount Calculator Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-line/40">
          <span className="text-xs text-muted flex items-center gap-1">
            <Percent className="size-3" /> Quick discount presets:
          </span>
          {[10, 20, 30, 50, 75].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => applyDiscountPercent(pct)}
              className="btn btn-quiet btn-sm text-[0.7rem] px-2.5 py-1"
            >
              −{pct}%
            </button>
          ))}
          {isDiscounted ? (
            <span className="ml-auto text-xs font-bold text-ember">
              🔥 Active: −{discountPercent}% OFF (Save {numCompare - priceCoins} coins)
            </span>
          ) : null}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Product Name" htmlFor="name" error={fieldErrors.name}>
          <Input id="name" name="name" defaultValue={product?.name} required />
        </Field>

        <Field
          label="Slug"
          htmlFor="slug"
          error={fieldErrors.slug}
          hint="Leave blank to derive from the name."
        >
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

        <Field label="Badge" htmlFor="badge" hint="Optional, e.g. Popular, Sale, or Limited.">
          <Input id="badge" name="badge" defaultValue={product?.badge ?? ""} />
        </Field>

        <Field label="Stock" htmlFor="stock" hint="Blank = unlimited.">
          <Input id="stock" name="stock" type="number" min={0} defaultValue={product?.stock ?? ""} />
        </Field>

        <Field label="Per-player limit" htmlFor="perPlayerLimit" hint="Blank = no limit.">
          <Input
            id="perPlayerLimit"
            name="perPlayerLimit"
            type="number"
            min={1}
            defaultValue={product?.perPlayerLimit ?? ""}
          />
        </Field>

        <Field label="Sort order" htmlFor="sortOrder">
          <Input id="sortOrder" name="sortOrder" type="number" min={0} defaultValue={product?.sortOrder ?? 0} />
        </Field>

        <div className="flex items-center gap-6 pt-5">
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input
              type="checkbox"
              name="featured"
              defaultChecked={product?.featured}
              className="accent-[#6fae7b] size-4"
            />
            <span className="text-parchment">Featured</span>
          </label>
          <label className="flex items-center gap-2 text-xs text-muted cursor-pointer">
            <input
              type="checkbox"
              name="active"
              defaultChecked={product?.active ?? true}
              className="accent-[#6fae7b] size-4"
            />
            <span className="text-parchment">Active</span>
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

      <div className="flex justify-end gap-2 border-t border-line/60 pt-4">
        <button type="button" onClick={onClose} className="btn btn-quiet btn-sm">
          Cancel
        </button>
        <button type="submit" className="btn btn-primary btn-sm" disabled={pending}>
          {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
          {product ? "Save Product" : "Create Product"}
        </button>
      </div>
    </form>
  );
}
