"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { LegacyRelease } from "@/lib/legacyMobileApi";
import {
  formatReleaseDate,
  getBrandName,
  getReleaseImage,
  getReleaseUrl,
} from "@/lib/siteData";

type RelatedProductsCarouselProps = {
  products: LegacyRelease[];
};

export function RelatedProductsCarousel({ products }: RelatedProductsCarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null);

  if (!products.length) {
    return null;
  }

  function scrollByCard(direction: -1 | 1) {
    scrollerRef.current?.scrollBy({
      left: direction * 320,
      behavior: "smooth",
    });
  }

  return (
    <section className="related-products" aria-labelledby="related-products-heading">
      <div className="related-products__header">
        <div className="section-heading section-heading--compact">
          <p className="kicker">Related drops</p>
          <h2 id="related-products-heading">More releases to watch</h2>
        </div>
        <div className="related-products__controls" aria-label="Related release controls">
          <button type="button" onClick={() => scrollByCard(-1)} aria-label="Previous releases">
            ←
          </button>
          <button type="button" onClick={() => scrollByCard(1)} aria-label="Next releases">
            →
          </button>
        </div>
      </div>
      <div className="related-products__scroller" ref={scrollerRef}>
        {products.map((product) => (
          <Link
            className="related-product"
            href={getReleaseUrl(product)}
            key={product.product_id}
          >
            <span className="related-product__image">
              <Image
                src={getReleaseImage(product)}
                alt={`${product.name} sneaker`}
                width={260}
                height={260}
                loading="lazy"
              />
            </span>
            <span className="kicker">{getBrandName(product)}</span>
            <strong>{product.name}</strong>
            <small>
              {formatReleaseDate(product)} · ${product.price}
            </small>
          </Link>
        ))}
      </div>
    </section>
  );
}
