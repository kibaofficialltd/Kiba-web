import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { productCategories, products } from "@/db/schema";
import { ProductManager } from "./product-manager";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [rows, categories] = await Promise.all([
    db
      .select({
        id: products.id,
        slug: products.slug,
        name: products.name,
        categoryId: products.categoryId,
        categoryName: productCategories.name,
        tagline: products.tagline,
        description: products.description,
        priceCoins: products.priceCoins,
        compareAtCoins: products.compareAtCoins,
        image: products.image,
        badge: products.badge,
        commands: products.commands,
        perPlayerLimit: products.perPlayerLimit,
        stock: products.stock,
        featured: products.featured,
        active: products.active,
        sortOrder: products.sortOrder,
      })
      .from(products)
      .leftJoin(productCategories, eq(productCategories.id, products.categoryId))
      .orderBy(asc(products.sortOrder), asc(products.name)),
    db
      .select({ id: productCategories.id, name: productCategories.name, slug: productCategories.slug })
      .from(productCategories)
      .orderBy(productCategories.sortOrder),
  ]);

  return (
    <div className="space-y-5">
      <header>
        <p className="eyebrow mb-2">Coin store</p>
        <h1 className="display-md">Products & delivery.</h1>
        <p className="mt-1 text-sm text-muted">
          Every product delivers commands to KIBAOFFICIALCore. Coins are charged on checkout, never
          here.
        </p>
      </header>

      <ProductManager products={rows} categories={categories} />
    </div>
  );
}
