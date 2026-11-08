
"use client";

type ProductBannersProps = {
    bannerImages?: string[];
    theme?: "light" | "dark";
};

export default function ProductBanners({
    bannerImages = [],
    theme = "light",
}: ProductBannersProps) {
    const validBanners = bannerImages.filter(
        (image) =>
            typeof image === "string" &&
            image.trim().length > 0
    );

    if (!validBanners.length) return null;

    const isDark = theme === "dark";

    return (
        <section
            className={`mx-auto my-8 w-full max-w-7xl px-4 sm:px-6 lg:px-8 ${isDark ? "bg-[#15110F]" : "bg-[#FAF7F2]"
                }`}
        >
            <div
                className={`grid grid-cols-1 gap-4 ${validBanners.length > 1
                        ? "md:grid-cols-2"
                        : "md:grid-cols-1"
                    }`}
            >
                {validBanners.map((image, index) => (
                    <div
                        key={`${image}-${index}`}
                        className="group overflow-hidden rounded-xl"
                    >
                        <img
                            src={image}
                            alt={`Alpha Male product banner ${index + 1}`}
                            loading="lazy"
                            className="h-auto w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                        />
                    </div>
                ))}
            </div>
        </section>
    );
}
