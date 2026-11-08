
"use client";

import { useState } from "react";

type ProductGalleryProps = {
    images?: string[];
    name: string;
    theme: "light" | "dark";
};

export default function ProductGallery({
    images = [],
    name,
    theme,
}: ProductGalleryProps) {
    const validImages = images.filter(
        (image) => typeof image === "string" && image.trim() !== ""
    );

    const [activeIndex, setActiveIndex] = useState(0);
    const isDark = theme === "dark";
    const mainImage = validImages[activeIndex];

    const previousImage = () => {
        setActiveIndex((current) =>
            current === 0 ? validImages.length - 1 : current - 1
        );
    };

    const nextImage = () => {
        setActiveIndex((current) =>
            current === validImages.length - 1 ? 0 : current + 1
        );
    };

    return (
        <section className="w-full">
            <div className="flex flex-col gap-3 md:flex-row md:gap-4">

                {/* Desktop vertical thumbnails */}
                {validImages.length > 1 && (
                    <div className="hidden w-16 shrink-0 flex-col gap-3 md:flex">
                        {validImages.map((image, index) => (
                            <button
                                key={`${image}-${index}`}
                                type="button"
                                onClick={() => setActiveIndex(index)}
                                className={`aspect-[4/5] w-full overflow-hidden rounded-xl border-2 transition ${activeIndex === index
                                        ? "border-[#176044]"
                                        : "border-transparent"
                                    } ${isDark ? "bg-[#241E1A]" : "bg-[#EAE2D9]"
                                    }`}
                                aria-label={`View product image ${index + 1}`}
                            >
                                <img
                                    src={image}
                                    alt={`${name} thumbnail ${index + 1}`}
                                    className="h-full w-full object-cover"
                                />
                            </button>
                        ))}

                        <div className="flex aspect-[4/5] items-center justify-center rounded-xl bg-[#EAE2D9] text-xs text-[#211B18]">
                            Video
                        </div>
                    </div>
                )}

                {/* Main product image */}
                <div
                    className={`relative aspect-[1.4/1] w-full overflow-hidden rounded-2xl md:flex-1 ${isDark ? "bg-[#241E1A]" : "bg-[#17120F]"
                        }`}
                >
                    {mainImage ? (
                        <>
                            <img
                                src={mainImage}
                                alt={name}
                                className="h-full w-full object-contain"
                            />

                            {validImages.length > 1 && (
                                <>
                                    <button
                                        type="button"
                                        onClick={previousImage}
                                        aria-label="Previous image"
                                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                                    >
                                        &#8592;
                                    </button>

                                    <button
                                        type="button"
                                        onClick={nextImage}
                                        aria-label="Next image"
                                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/50 text-white transition hover:bg-black/70"
                                    >
                                        &#8594;
                                    </button>
                                </>
                            )}
                        </>
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-[#D9B48F]">
                            Product image
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile thumbnails */}
            {validImages.length > 1 && (
                <div className="mt-3 flex gap-3 overflow-x-auto pb-2 md:hidden">
                    {validImages.map((image, index) => (
                        <button
                            key={`${image}-${index}`}
                            type="button"
                            onClick={() => setActiveIndex(index)}
                            className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 ${activeIndex === index
                                    ? "border-[#176044]"
                                    : "border-transparent"
                                }`}
                        >
                            <img
                                src={image}
                                alt={`${name} thumbnail ${index + 1}`}
                                className="h-full w-full object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}
        </section>
    );
}
