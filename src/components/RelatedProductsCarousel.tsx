import Image from "next/image";
import Link from "next/link";
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
  if (!products.length) {
    return null;
  }

  return (
    <section className="related-products" aria-labelledby="related-products-heading">
      <div className="section-heading section-heading--compact">
        <p className="kicker">Related drops</p>
        <h2 id="related-products-heading">More releases to watch</h2>
      </div>
      <div className="related-products__scroller">
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
