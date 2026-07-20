"use client";

import Image from "next/image";
import { useMemo, useState } from "react";

type ProductImageCarouselProps = {
  images: string[];
  name: string;
};

export function ProductImageCarousel({ images, name }: ProductImageCarouselProps) {
  const normalizedImages = useMemo(
    () => Array.from(new Set(images.filter(Boolean))),
    [images],
  );
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = normalizedImages[activeIndex] ?? normalizedImages[0];

  if (!activeImage) {
    return null;
  }

  return (
    <div className="product-carousel" aria-label={`${name} product images`}>
      <div className="product-carousel__stage">
        <Image
          src={activeImage}
          alt={`${name} sneaker image ${activeIndex + 1}`}
          width={840}
          height={840}
          priority
          loading="eager"
        />
      </div>
      {normalizedImages.length > 1 ? (
        <div className="product-carousel__thumbs" aria-label="Choose product image">
          {normalizedImages.map((image, index) => (
            <button
              aria-label={`Show ${name} image ${index + 1}`}
              aria-pressed={index === activeIndex}
              key={image}
              onClick={() => setActiveIndex(index)}
              type="button"
            >
              <Image
                src={image}
                alt=""
                width={88}
                height={88}
                loading="lazy"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
