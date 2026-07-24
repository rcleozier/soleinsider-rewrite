import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAdmin, ADMIN_EMAIL } from "@/lib/adminAuth";
import { getProductImageUrl } from "@/lib/productImages";

/** The admin's own favorited releases, shown on the dashboard. */
export async function getAdminFavorites(limit = 12) {
  const admin = await prisma.member.findUnique({ where: { email: ADMIN_EMAIL } });

  if (!admin) return [];

  const favorites = await prisma.favorite.findMany({
    where: { memberId: admin.id },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const products = await prisma.product.findMany({
    where: { id: { in: favorites.map((favorite) => favorite.productId) } },
    select: { id: true, name: true, slug: true, image: true },
  });

  const productsById = new Map(products.map((product) => [product.id, product]));

  return favorites
    .map((favorite) => {
      const product = productsById.get(favorite.productId);
      if (!product) return null;

      return {
        favoriteId: favorite.id,
        productId: product.id,
        name: product.name,
        image: getProductImageUrl(product.image),
        url: `/${product.slug}/${product.id}`,
        favoritedAt: favorite.createdAt,
      };
    })
    .filter((favorite): favorite is NonNullable<typeof favorite> => favorite !== null);
}

export type AdminProductListParams = {
  search?: string;
  page?: number;
  perPage?: number;
};

/** Paginated, searchable product list for the admin products page. */
export async function getAdminProductList({ search = "", page = 1, perPage = 24 }: AdminProductListParams = {}) {
  const trimmed = search.trim();
  const where = trimmed
    ? {
        OR: [
          { name: { contains: trimmed, mode: "insensitive" as const } },
          { sku: { contains: trimmed, mode: "insensitive" as const } },
        ],
      }
    : undefined;

  const currentPage = Math.max(1, page);

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: { id: "desc" },
      skip: (currentPage - 1) * perPage,
      take: perPage,
      select: { id: true, name: true, slug: true, image: true, sku: true, price: true, type: true },
    }),
  ]);

  const releases = await prisma.release.findMany({
    where: { productId: { in: products.map((product) => product.id) } },
    orderBy: { id: "desc" },
    select: { productId: true, releaseDate: true },
  });

  const releaseByProduct = new Map<number, Date>();
  for (const release of releases) {
    if (!releaseByProduct.has(release.productId)) {
      releaseByProduct.set(release.productId, release.releaseDate);
    }
  }

  return {
    total,
    page: currentPage,
    perPage,
    pageCount: Math.max(1, Math.ceil(total / perPage)),
    products: products.map((product) => ({
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: String(product.price),
      type: product.type,
      image: getProductImageUrl(product.image),
      url: `/${product.slug}/${product.id}`,
      releaseDate: releaseByProduct.get(product.id) ?? null,
    })),
  };
}

export async function getEditableProduct(id: number) {
  const [product, release] = await Promise.all([
    prisma.product.findUnique({ where: { id } }),
    prisma.release.findFirst({ where: { productId: id }, orderBy: { id: "desc" } }),
  ]);

  if (!product) return null;

  return { product, release };
}

export async function updateProduct(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isFinite(id)) {
    throw new Error("Invalid product id.");
  }

  const name = stringField(formData, "name");
  const sku = stringField(formData, "sku");
  const priceRaw = stringField(formData, "price");
  const type = stringField(formData, "type") || "sneakers";
  const releaseDateRaw = stringField(formData, "releaseDate");
  const description = stringField(formData, "description");
  const content = stringField(formData, "content");
  const link = stringField(formData, "link");

  if (!name) throw new Error("Name is required.");
  if (!sku) throw new Error("SKU is required.");

  const price = Number(priceRaw);
  if (!Number.isFinite(price) || price < 0) throw new Error("Price must be a positive number.");

  const releaseDate = releaseDateRaw ? new Date(releaseDateRaw) : null;
  if (!releaseDate || Number.isNaN(releaseDate.getTime())) {
    throw new Error("A valid release date is required.");
  }

  const now = new Date();

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: { name, sku, price, type, description, content, link, updatedAt: now },
    });

    const existingRelease = await tx.release.findFirst({ where: { productId: id }, orderBy: { id: "desc" } });

    if (existingRelease) {
      await tx.release.update({ where: { id: existingRelease.id }, data: { releaseDate, updatedAt: now } });
    } else {
      await tx.release.create({ data: { productId: id, releaseDate, createdAt: now, updatedAt: now } });
    }
  });

  redirect(`/admin/products/${id}/edit?saved=1`);
}

export async function deleteProduct(formData: FormData) {
  "use server";

  await requireAdmin();

  const id = Number(formData.get("id"));

  if (!Number.isFinite(id)) {
    throw new Error("Invalid product id.");
  }

  await prisma.$transaction([
    prisma.favorite.deleteMany({ where: { productId: id } }),
    prisma.releaseInterest.deleteMany({ where: { productId: id } }),
    prisma.comment.deleteMany({ where: { productId: id } }),
    prisma.productImage.deleteMany({ where: { productId: id } }),
    prisma.release.deleteMany({ where: { productId: id } }),
    prisma.product.delete({ where: { id } }),
  ]);

  const redirectTo = formData.get("redirectTo");
  redirect(typeof redirectTo === "string" && redirectTo ? redirectTo : "/admin");
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
