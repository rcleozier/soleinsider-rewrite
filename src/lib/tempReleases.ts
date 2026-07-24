import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getProductImageUrl } from "@/lib/productImages";

export type TempReleaseStatusFilter = "all" | "pending" | "approved";

export async function getTempReleases(
  { status = "all", limit = 80 }: { status?: TempReleaseStatusFilter; limit?: number } = {},
) {
  return prisma.tempProduct.findMany({
    where: status === "all" ? undefined : { status: statusToDbValue(status) },
    orderBy: [{ status: "asc" }, { id: "desc" }],
    take: limit,
  });
}

export async function getTempReleaseCounts() {
  const [total, approved] = await Promise.all([
    prisma.tempProduct.count(),
    prisma.tempProduct.count({ where: { status: "approved" } }),
  ]);

  return { total, approved, pending: total - approved };
}

function statusToDbValue(status: TempReleaseStatusFilter) {
  if (status === "approved") {
    return "approved";
  }

  // Legacy rows default to "new"; anything that isn't approved or rejected is pending.
  return { notIn: ["approved", "rejected"] };
}

export async function getTempRelease(id: number) {
  return prisma.tempProduct.findUnique({
    where: { id },
  });
}

export async function getTempReleaseImages(id: number) {
  return prisma.tempProductImage.findMany({
    where: { productId: id },
    orderBy: { id: "asc" },
  });
}

export async function approveTempRelease(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  if (!Number.isFinite(id)) {
    throw new Error("Invalid temp release id.");
  }

  await promoteTempRelease(id);
  redirect(redirectTarget(formData, id));
}

export async function rejectTempRelease(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  if (!Number.isFinite(id)) {
    throw new Error("Invalid temp release id.");
  }

  await prisma.tempProduct.update({
    where: { id },
    data: { status: "rejected", updatedAt: new Date() },
  });

  redirect(redirectTarget(formData, id));
}

function redirectTarget(formData: FormData, id: number) {
  const redirectTo = formData.get("redirectTo");
  return typeof redirectTo === "string" && redirectTo ? redirectTo : `/admin/viewTempReleases/${id}`;
}

export async function deleteTempRelease(formData: FormData) {
  "use server";

  const id = Number(formData.get("id"));

  if (!Number.isFinite(id)) {
    throw new Error("Invalid temp release id.");
  }

  await prisma.$transaction([
    prisma.tempProductImage.deleteMany({ where: { productId: id } }),
    prisma.tempProduct.delete({ where: { id } }),
  ]);

  redirect("/admin/tempReleases");
}

export async function promoteTempRelease(id: number) {
  const tempProduct = await prisma.tempProduct.findUnique({
    where: { id },
  });

  if (!tempProduct) {
    throw new Error("Temp release not found.");
  }

  if (tempProduct.status === "approved") {
    return tempProduct;
  }

  const images = await getTempReleaseImages(id);
  const releaseDate = tempProduct.releaseDate ?? new Date();
  const now = new Date();

  await prisma.$transaction(async (tx) => {
    const product = await tx.product.create({
      data: {
        name: tempProduct.name,
        sku: tempProduct.sku || "TBA",
        image: tempProduct.image || images[0]?.image || getProductImageUrl(null),
        link: tempProduct.link,
        colorway: clampText(tempProduct.description, 80),
        description: tempProduct.description,
        content: tempProduct.content,
        slug: tempProduct.slug,
        price: tempProduct.price,
        comingSoon: 1,
        views: 0,
        resale: "medium",
        type: tempProduct.type,
        stockxUrl: "",
        stockxThumbnailUrl: "",
        stockxTickerSymbol: "",
        stockxName: "",
        stockxMake: "",
        stockxModel: "",
        stockxPrice: 0,
        stockxHighestBid: 0,
        stockxTotalDollars: 0,
        stockxLowestAsk: 0,
        stockxLastSale: 0,
        stockxDeadstockSold: 0,
        stockxSalesLast72: 0,
        createdAt: now,
        updatedAt: now,
      },
    });

    await tx.release.create({
      data: {
        productId: product.id,
        releaseDate,
        createdAt: now,
        updatedAt: now,
      },
    });

    const galleryImages = images.length ? images.map((image) => image.image).filter(Boolean) : [];

    if (galleryImages.length) {
      await tx.productImage.createMany({
        data: galleryImages.map((image) => ({
          productId: product.id,
          image: image ?? "",
          optimized: false,
        })),
      });
    }

    await tx.tempProduct.update({
      where: { id },
      data: {
        status: "approved",
        updatedAt: now,
      },
    });
  });

  return tempProduct;
}

export function formatTempPrice(price: unknown) {
  const numeric = Number(price);

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return "TBA";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(numeric);
}

export function formatTempDate(date: Date | null) {
  if (!date) {
    return "TBA";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

function clampText(value: string, length: number) {
  return (value || "").slice(0, length);
}
