
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000")
    .replace(/\/+$/, "");

type HeroProduct = {
    _id: string;
    name: string;
    slug: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
};

export default function HeroSlider() {
    const [products, setProducts] = useState<HeroProduct[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchHeroProducts = async () => {
            try {
                setLoading(true);
                setError("");

                const response = await fetch(`${API_URL}/product/hero`);

                if (!response.ok) {
                    throw new Error("Unable to load hero products");
                }

                const data = await response.json();

                // Supports both a direct array and { data: [] } response.
                const rawProducts = Array.isArray(data)
                    ? data
                    : Array.isArray(data?.products)
                        ? data.products
                        : Array.isArray(data?.data)
                            ? data.data
                            : [];

                // Handle nested arrays returned by the API.
                const productList = rawProducts.flat(Infinity);

                setProducts(productList);
                setActiveIndex(0);

            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong"
                );
            } finally {
                setLoading(false);
            }
        };

        fetchHeroProducts();
    }, []);

    const activeProduct = products[activeIndex];

    const formatPrice = (price: number) =>
        Number(price).toLocaleString("en-IN");

    return (
        <section className="overflow-hidden bg-[#F7EEEA]">
            <div className="mx-auto grid min-h-[550px] max-w-[1600px] grid-cols-1 items-center gap-10 px-6 py-12 sm:px-10 lg:min-h-[620px] lg:grid-cols-2 lg:gap-14 lg:px-16 lg:py-16">

                {/* Left content */}
                <div className="order-2 max-w-xl lg:order-1">
                    <p className="mb-5 text-xs font-semibold uppercase tracking-[0.18em] text-[#812E50] sm:text-sm">
                        Sexual wellness, made simple
                    </p>

                    <h1 className="font-[family-name:var(--font-fraunces)] text-4xl leading-[1.12] tracking-tight text-[#302128] sm:text-5xl lg:text-6xl">
                        Feel good. No awkwardness.
                    </h1>

                    <p className="mt-6 max-w-lg text-base leading-7 text-[#62505A] sm:text-lg">
                        Body-safe products, honest guidance and packaging
                        that keeps it between you and us.
                    </p>

                    <p className="mt-2 text-sm font-medium text-[#812E50]">
                        Your comfort. Your confidence. Your privacy.
                    </p>

                    <div className="mt-8 flex flex-wrap gap-3">
                        <Link
                            href="/products"
                            className="rounded-full bg-[#812E50] px-8 py-4 text-sm font-semibold text-white transition hover:bg-[#68243F]"
                        >
                            Shop bestsellers
                        </Link>

                        <Link
                            href="/quiz"
                            className="rounded-full border border-[#302128] px-8 py-4 text-sm font-semibold text-[#302128] transition hover:bg-[#302128] hover:text-white"
                        >
                            Take the 2-minute quiz
                        </Link>
                    </div>

                    <div className="mt-9 flex flex-wrap gap-5 text-xs text-[#76636C]">
                        <span>✓ Discreet packaging</span>
                        <span>✓ Secure payments</span>
                        <span>✓ Private billing</span>
                    </div>
                </div>

                {/* Right product visual */}
                <div className="order-1 lg:order-2">
                    {loading ? (
                        <div className="flex aspect-[4/3] w-full animate-pulse items-center justify-center rounded-t-[35%] rounded-b-2xl bg-[#E9CEC6] sm:rounded-t-[30%]">
                            <div className="h-8 w-40 rounded bg-[#D9B9B0]" />
                        </div>
                    ) : error ? (
                        <div className="flex aspect-[4/3] items-center justify-center rounded-t-[35%] rounded-b-2xl bg-[#E9CEC6] p-6 text-center text-sm text-[#812E50]">
                            {error}
                        </div>
                    ) : activeProduct ? (
                        <div className="relative">
                            <Link
                                href={`/products/${activeProduct._id}`}
                                aria-label={`View ${activeProduct.name}`}
                                className="group relative block aspect-[4/3] overflow-hidden rounded-t-[35%] rounded-b-2xl bg-[#E9CEC6] sm:rounded-t-[30%]"
                            >
                                {activeProduct.images?.[0] ? (
                                    <img
                                        src={activeProduct.images[0]}
                                        alt={activeProduct.name}
                                        className="h-full w-full object-contain p-8 transition duration-700 group-hover:scale-105 sm:p-12"
                                    />
                                ) : (
                                    <div className="flex h-full items-center justify-center text-sm text-[#812E50]">
                                        Product image unavailable
                                    </div>
                                )}

                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/50 to-transparent p-6 pt-16 opacity-0 transition group-hover:opacity-100">
                                    <p className="text-lg font-semibold text-white">
                                        View product →
                                    </p>
                                </div>
                            </Link>

                            {/* Product information */}
                            <div className="absolute bottom-5 left-5 rounded-xl bg-white/90 px-4 py-3 shadow-lg backdrop-blur-sm sm:bottom-7 sm:left-7">
                                <p className="max-w-[180px] truncate text-sm font-semibold text-[#302128]">
                                    {activeProduct.name}
                                </p>

                                <p className="mt-1 text-sm font-medium text-[#812E50]">
                                    ₹{formatPrice(activeProduct.price)}
                                </p>
                            </div>

                            {/* Product slider controls */}
                            {products.length > 1 && (
                                <div className="absolute bottom-6 right-5 flex items-center gap-2 sm:bottom-8 sm:right-7">
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveIndex((prev) =>
                                                prev === 0
                                                    ? products.length - 1
                                                    : prev - 1
                                            )
                                        }
                                        aria-label="Previous product"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#302128] shadow transition hover:bg-[#812E50] hover:text-white"
                                    >
                                        ←
                                    </button>

                                    <span className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-[#302128]">
                                        {activeIndex + 1}/{products.length}
                                    </span>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            setActiveIndex((prev) =>
                                                (prev + 1) % products.length
                                            )
                                        }
                                        aria-label="Next product"
                                        className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-[#302128] shadow transition hover:bg-[#812E50] hover:text-white"
                                    >
                                        →
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex aspect-[4/3] items-center justify-center rounded-t-[35%] rounded-b-2xl bg-[#E9CEC6] text-sm text-[#812E50]">
                            No hero products available
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
