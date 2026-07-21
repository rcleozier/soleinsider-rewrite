"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type ProductImageCarouselProps = {
  images: string[];
  name: string;
  autoPlayMs?: number;
};

export function ProductImageCarousel({
  images,
  name,
  autoPlayMs = 6000,
}: ProductImageCarouselProps) {
  const normalizedImages = useMemo(
    () => Array.from(new Set(images.filter(Boolean))),
    [images],
  );
  const total = normalizedImages.length;
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef<number | null>(null);

  const goTo = useCallback(
    (index: number) => {
      if (total < 2) {
        return;
      }

      setActiveIndex(((index % total) + total) % total);
    },
    [total],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrev = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  useEffect(() => {
    if (total < 2 || isPaused || !autoPlayMs) {
      return;
    }

    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % total);
    }, autoPlayMs);

    return () => window.clearInterval(timer);
  }, [autoPlayMs, isPaused, total]);

  if (!total) {
    return null;
  }

  const isSlideshow = total > 1;

  return (
    <div
      className="product-carousel"
      aria-label={`${name} product images`}
      aria-roledescription={isSlideshow ? "carousel" : undefined}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocusCapture={() => setIsPaused(true)}
      onBlurCapture={() => setIsPaused(false)}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") {
          event.preventDefault();
          goNext();
        }

        if (event.key === "ArrowLeft") {
          event.preventDefault();
          goPrev();
        }
      }}
      role={isSlideshow ? "group" : undefined}
      tabIndex={isSlideshow ? 0 : undefined}
    >
      <div
        className="product-carousel__stage"
        onTouchStart={(event) => {
          touchStartX.current = event.touches[0]?.clientX ?? null;
        }}
        onTouchEnd={(event) => {
          const start = touchStartX.current;
          const end = event.changedTouches[0]?.clientX ?? null;
          touchStartX.current = null;

          if (start === null || end === null || Math.abs(end - start) < 40) {
            return;
          }

          if (end < start) {
            goNext();
          } else {
            goPrev();
          }
        }}
      >
        <div
          className="product-carousel__track"
          style={{ transform: `translate3d(-${activeIndex * 100}%, 0, 0)` }}
        >
          {normalizedImages.map((image, index) => (
            <div className="product-carousel__slide" key={image} aria-hidden={index !== activeIndex}>
              <Image
                src={image}
                alt={`${name} sneaker image ${index + 1}`}
                width={840}
                height={840}
                priority={index === 0}
                loading={index === 0 ? "eager" : "lazy"}
              />
            </div>
          ))}
        </div>

        {isSlideshow ? (
          <>
            <button
              aria-label="Previous image"
              className="product-carousel__arrow product-carousel__arrow--prev"
              onClick={goPrev}
              type="button"
            >
              ←
            </button>
            <button
              aria-label="Next image"
              className="product-carousel__arrow product-carousel__arrow--next"
              onClick={goNext}
              type="button"
            >
              →
            </button>
            <div className="product-carousel__counter" aria-hidden="true">
              {activeIndex + 1} / {total}
            </div>
          </>
        ) : null}
      </div>

      {isSlideshow ? (
        <div className="product-carousel__thumbs" aria-label="Choose product image">
          {normalizedImages.map((image, index) => (
            <button
              aria-label={`Show ${name} image ${index + 1}`}
              aria-pressed={index === activeIndex}
              key={image}
              onClick={() => goTo(index)}
              type="button"
            >
              <Image src={image} alt="" width={88} height={88} loading="lazy" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
