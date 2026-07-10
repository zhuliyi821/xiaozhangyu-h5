"use client";
import type { ModuleProps } from "./";

export default function BannerModule({ config }: ModuleProps) {
  const images: { src: string; link?: string }[] = config?.images || [];

  if (!images.length) return null;

  return (
    <div className="px-3 mt-3">
      <div className="rounded-[8px] overflow-hidden bg-gray-100">
        <div className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide">
          {images.map((img, i) => (
            <div key={i} className="min-w-full snap-center">
              {img.link ? (
                <a href={img.link}>
                  <img
                    src={img.src}
                    alt={`banner-${i}`}
                    className="w-full h-[160px] object-cover"
                  />
                </a>
              ) : (
                <img
                  src={img.src}
                  alt={`banner-${i}`}
                  className="w-full h-[160px] object-cover"
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
