"use server";

import { prisma } from "@/lib/prisma";
import type { CreateReleaseResult } from "@/lib/adminReleaseTypes";
import { isS3Configured, uploadProductImageToS3 } from "@/lib/s3";

/**
 * Server action backing the admin "Add Release" form. Validates input,
 * uploads images to S3, and writes the Product/Release/ProductImage rows in
 * one transaction — mirroring the shape `promoteTempRelease` writes so both
 * paths (crawler approval and manual entry) produce identical records.
 */
export async function createRelease(
  _prevState: CreateReleaseResult | null,
  formData: FormData,
): Promise<CreateReleaseResult> {
  const name = stringField(formData, "name");
  const sku = stringField(formData, "sku");
  const priceRaw = stringField(formData, "price");
  const type = stringField(formData, "type") || "sneakers";
  const releaseDateRaw = stringField(formData, "releaseDate");
  const colorwayInput = stringField(formData, "colorway");
  const description = stringField(formData, "description");
  const content = stringField(formData, "content");
  const link = stringField(formData, "link");
  const primaryImage = formData.get("primaryImage");
  const galleryImages = formData.getAll("galleryImages");

  if (!name) {
    return { success: false, error: "Name is required." };
  }

  if (!sku) {
    return { success: false, error: "SKU is required." };
  }

  if (sku.length > 11) {
    return { success: false, error: "SKU must be 11 characters or fewer." };
  }

  const price = Number(priceRaw);

  if (!Number.isFinite(price) || price < 0) {
    return { success: false, error: "Price must be a positive number." };
  }

  if (price > 999.99) {
    return { success: false, error: "Price must be 999.99 or less." };
  }

  const releaseDate = releaseDateRaw ? new Date(releaseDateRaw) : null;

  if (!releaseDate || Number.isNaN(releaseDate.getTime())) {
    return { success: false, error: "A valid release date is required." };
  }

  if (!(primaryImage instanceof File) || primaryImage.size === 0) {
    return { success: false, error: "A primary image is required." };
  }

  if (!isS3Configured()) {
    return {
      success: false,
      error:
        "Image storage isn't configured yet. Set AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and S3_BUCKET_NAME.",
    };
  }

  const slug = await generateUniqueSlug(name);
  const colorway = (colorwayInput || description || name).slice(0, 80);

  let primaryImageUrl: string;
  let galleryImageUrls: string[];

  try {
    primaryImageUrl = await uploadProductImageToS3(primaryImage, slug);

    const validGalleryFiles = galleryImages.filter(
      (file): file is File => file instanceof File && file.size > 0,
    );
    galleryImageUrls = await Promise.all(
      validGalleryFiles.map((file) => uploadProductImageToS3(file, slug)),
    );
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Image upload failed.",
    };
  }

  const now = new Date();

  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name,
        sku,
        image: primaryImageUrl,
        link,
        colorway,
        description,
        content,
        slug,
        price,
        comingSoon: 1,
        views: 0,
        resale: "medium",
        type,
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
        productId: created.id,
        releaseDate,
        createdAt: now,
        updatedAt: now,
      },
    });

    if (galleryImageUrls.length) {
      await tx.productImage.createMany({
        data: galleryImageUrls.map((image) => ({
          productId: created.id,
          image,
          optimized: false,
        })),
      });
    }

    return created;
  });

  return { success: true, slug: product.slug, productId: product.id };
}

async function generateUniqueSlug(name: string) {
  const base = slugify(name) || "release";
  let candidate = base;
  let suffix = 2;

  // Slugs aren't unique-constrained in the schema, but the rest of the app
  // (routing, related-products, search) all assumes one product per slug.
  while (await prisma.product.findFirst({ where: { slug: candidate }, select: { id: true } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-")
    .slice(0, 255);
}

function stringField(formData: FormData, key: string) {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}
