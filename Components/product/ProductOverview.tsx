
"use client";

import { useState } from "react";
import ProductGallery from "./ProductGallery";
import CheckPinCodes from "./checkDelivery";

export type ProductOverviewData = {
    _id: string;
    name?: string;
    title?: string;
    description?: string;
    price?: number;
    salePrice?: number;
    sellingPrice?: number;
    compareAtPrice?: number;
    images?: string[];
    image?: string;
    category?: string | { name?: string };
    stock?: number;
    isActive?: boolean;
    rating?: number;
    reviewCount?: number;
    packs?: {
        quantity: number;
        price: number;
        compareAtPrice?: number;
        discount?: number;
        label?: string;
    }[];
};

type ProductOverviewProps = {
    product: ProductOverviewData;
    theme: "light" | "dark";
    onAddToCart: (product: ProductOverviewData, quantity: number) => void;
};

export default function ProductOverview({
    product,
    theme,
    onAddToCart,
}: ProductOverviewProps) {
    const [quantity, setQuantity] = useState(1);
    const [selectedPack, setSelectedPack] = useState(0);

    const isDark = theme === "dark";

    const name = product.name || product.title || "Product";

    const images = [
        ...(product.images || []),
        ...(product.image ? [product.image] : []),
    ].filter(
        (image, index, array) =>
            Boolean(image) && array.indexOf(image) === index
    );

    const price =
        product.salePrice ??
        product.sellingPrice ??
        product.price;

    const category =
        typeof product.category === "object"
            ? product.category?.name
            : product.category;

    const outOfStock =
        product.isActive === false ||
        (typeof product.stock === "number" && product.stock <= 0);

    const packs = product.packs || [];
    const activePack = packs[selectedPack];

    const displayPrice = activePack?.price ?? price;

    const displayComparePrice =
        activePack?.compareAtPrice ?? product.compareAtPrice;

    const formatPrice = (value?: number) =>
        value == null ? "" : `₹${value.toLocaleString("en-IN")}`;

    const discount =
        activePack?.discount ??
        (displayComparePrice && displayPrice != null && displayComparePrice > displayPrice
            ? Math.round(
                ((displayComparePrice - displayPrice) / displayComparePrice) * 100
            )
            : 0);

    const handleAddToCart = () => {
        if (outOfStock) return;

        onAddToCart(product, quantity);
    };

    const surface = isDark
        ? "bg-[#15110F] text-[#F5EDE4]"
        : "bg-[#FAF7F2] text-[#211B18]";

    return (
        <section className={`w-full ${surface}`}>
            <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-7 lg:px-10">

                {/* Breadcrumb */}
                <div className="mb-5 flex items-center gap-2 text-xs text-[#9B9187]">
                    <a href="/">Home</a>
                    <span>/</span>
                    <a href="/products">Shop</a>
                    <span>/</span>
                    <span className={isDark ? "text-white" : "text-[#211B18]"}>
                        {name}
                    </span>
                </div>

                {/* Main product layout */}
                <div className="grid grid-cols-1 gap-7 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10">

                    {/* Left: Gallery */}
                    <div>
                        <ProductGallery
                            images={images}
                            name={name}
                            theme={theme}
                        />
                    </div>

                    {/* Right: Product details */}
                    <div className="flex flex-col">

                        {category && (
                            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-700">
                                {category}
                            </p>
                        )}

                        <h1 className="mt-2 font-serif text-3xl font-semibold sm:text-4xl">
                            {name}
                        </h1>

                        {product.description && (
                            <p className="mt-2 text-sm text-[#958A80]">
                                {product.description}
                            </p>
                        )}

                        {/* Rating - only if API provides it */}
                        {product.rating != null && (
                            <div className="mt-3 flex items-center gap-2 text-xs">
                                <span className="text-amber-600">
                                    {"★".repeat(Math.max(0, Math.min(5, Math.round(product.rating))))}
                                </span>
                                <strong>
                                    [{product.rating.toFixed(1)}]
                                </strong>
                                {product.reviewCount != null && (
                                    <span className="text-[#958A80]">
                                        [{product.reviewCount} reviews]
                                    </span>
                                )}
                            </div>
                        )}

                        {/* Price */}
                        {displayPrice != null && (
                            <div className="mt-4 flex flex-wrap items-center gap-3">
                                <span className="text-3xl font-bold">
                                    {formatPrice(displayPrice)}
                                </span>

                                {displayComparePrice != null &&
                                    displayComparePrice > displayPrice && (
                                        <span className="text-sm text-[#958A80] line-through">
                                            {formatPrice(displayComparePrice)}
                                        </span>
                                    )}

                                {discount > 0 && (
                                    <span className="rounded bg-emerald-800 px-2 py-1 text-[10px] font-bold text-white">
                                        Save {discount}%
                                    </span>
                                )}
                            </div>
                        )}

                        <p className="mt-1 text-[10px] text-[#958A80]">
                            Inclusive of all taxes
                        </p>

                        {/* Pack selector - only if API provides pack data */}
                        {packs.length > 0 && (
                            <div className="mt-6">
                                <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-emerald-800">
                                    Select a pack
                                </p>

                                <div className="grid grid-cols-3 gap-2">
                                    {packs.map((pack, index) => (
                                        <button
                                            key={`${pack.quantity}-${index}`}
                                            type="button"
                                            onClick={() => setSelectedPack(index)}
                                            className={`rounded-xl border p-2 text-center transition ${selectedPack === index
                                                ? "border-emerald-800 ring-1 ring-emerald-800"
                                                : isDark
                                                    ? "border-[#42362E]"
                                                    : "border-transparent"
                                                } ${isDark ? "bg-[#241E1A]" : "bg-[#F0EBE4]"}`}
                                        >
                                            {pack.discount != null && (
                                                <span className="block rounded bg-emerald-800 py-1 text-[10px] font-bold text-white">
                                                    Save {pack.discount}%
                                                </span>
                                            )}

                                            <p className="mt-2 text-xs font-semibold">
                                                {pack.label || `${pack.quantity} Pack${pack.quantity > 1 ? "s" : ""}`}
                                            </p>

                                            <p className="mt-1 font-bold">
                                                {formatPrice(pack.price)}
                                            </p>

                                            {pack.compareAtPrice != null && (
                                                <p className="text-[10px] text-[#958A80] line-through">
                                                    MRP: {formatPrice(pack.compareAtPrice)}
                                                </p>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Quantity and Add to Cart */}
                        <div className="mt-5 flex gap-2">
                            <div className={`flex shrink-0 items-center rounded-lg border ${isDark ? "border-[#59483B]" : "border-[#DED5CB]"
                                }`}>
                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                    className="px-3 py-3"
                                    aria-label="Decrease quantity"
                                >
                                    −
                                </button>

                                <span className="min-w-6 text-center text-sm">
                                    {quantity}
                                </span>

                                <button
                                    type="button"
                                    onClick={() => setQuantity((q) => q + 1)}
                                    className="px-3 py-3"
                                    aria-label="Increase quantity"
                                >
                                    +
                                </button>
                            </div>

                            <button
                                type="button"
                                disabled={outOfStock}
                                onClick={handleAddToCart}
                                className="flex-1 rounded-lg bg-[#17120F] px-4 py-3 text-sm font-semibold text-[#DDB995] transition hover:bg-[#30251E] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {outOfStock ? "Out of Stock" : "Add to cart"}
                            </button>
                        </div>

                        {/* Buy Now */}
                        <a
                            href={
                                outOfStock
                                    ? undefined
                                    : `/checkout?productId=${encodeURIComponent(product._id)}`
                            }
                            aria-disabled={outOfStock}
                            className={`mt-2 flex items-center justify-center rounded-lg px-4 py-3 text-sm font-bold ${outOfStock
                                ? "pointer-events-none bg-gray-300 text-gray-600"
                                : "bg-[#176044] text-white hover:bg-[#104A35]"
                                }`}
                        >
                            Buy now
                        </a>

                        {/* Delivery checker placeholder */}
                        {/* Add this section when your PIN-code API is available */}

                        <div className="mt-4 flex flex-wrap gap-4 text-[10px] text-[#958A80]">
                            <span>Plain packaging</span>
                            <span>Private billing</span>
                            <span>Easy returns</span>
                        </div>
                        <div className="w-full max-w-[70%] item-center">
                            <CheckPinCodes productId={product._id} />
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
