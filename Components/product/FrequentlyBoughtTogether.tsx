
"use client";

import { useEffect, useMemo, useState } from "react";

export type Product = {
    _id: string;
    name?: string;
    title?: string;
    slug?: string;
    description?: string;
    price?: number;
    salePrice?: number;
    sellingPrice?: number;
    compareAtPrice?: number;
    images?: string[];
    image?: string;
    stock?: number;
    isActive?: boolean;
};

type RecommendationResponse = {
    productId: string;
    type: string;
    algorithmVersion?: number;
    sourceCount?: number;
    generatedAt?: string;
    products?: {
        product: Product;
        score: number;
        purchaseCount: number;
        confidence: number;
        lift: number;
    }[];
};

type FrequentlyBoughtTogetherProps = {
    currentProduct: Product;
    theme?: "light" | "dark";
    onAddToCart: (
        product: Product,
        quantity: number
    ) => void | Promise<void>;
};

export default function FrequentlyBoughtTogether({
    currentProduct,
    theme = "light",
    onAddToCart,
}: FrequentlyBoughtTogetherProps) {
    const [recommendations, setRecommendations] = useState<Product[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    const isDark = theme === "dark";

    const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

    // Fetch frequently bought together products
    useEffect(() => {
        if (!API_URL || !currentProduct?._id) {
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        const fetchRecommendations = async () => {
            try {
                setLoading(true);

                const response = await fetch(
                    `${API_URL}/product/frequently-bought-together/${encodeURIComponent(currentProduct._id)}`,
                    {
                        method: "GET",
                        cache: "no-store",
                        signal: controller.signal,
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Failed to fetch recommendations: ${response.status}`
                    );
                }

                const data: RecommendationResponse =
                    await response.json();

                const products = (data.products || [])
                    .map((item) => item.product)
                    .filter(
                        (product): product is Product =>
                            Boolean(
                                product &&
                                product._id &&
                                product._id !== currentProduct._id &&
                                product.isActive !== false &&
                                (product.stock == null || product.stock > 0)
                            )
                    );

                setRecommendations(products);

                // Select current product and all recommended products.
                setSelectedIds([
                    currentProduct._id,
                    ...products.map((product) => product._id),
                ]);
            } catch (error) {
                if (!controller.signal.aborted) {
                    console.error(
                        "Frequently bought together error:",
                        error
                    );
                    setRecommendations([]);
                }
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchRecommendations();

        return () => controller.abort();
    }, [API_URL, currentProduct._id]);

    // Current product + recommended products
    const allProducts = useMemo(
        () => [currentProduct, ...recommendations],
        [currentProduct, recommendations]
    );

    // Selected products
    const selectedProducts = allProducts.filter((product) =>
        selectedIds.includes(product._id)
    );

    // Get effective product price
    const getPrice = (product: Product) =>
        product.salePrice ??
        product.sellingPrice ??
        product.price ??
        0;

    // Calculate combo price
    const comboTotal = selectedProducts.reduce(
        (total, product) => total + getPrice(product),
        0
    );

    const formatPrice = (price: number) =>
        `₹${price.toLocaleString("en-IN")}`;

    // Select / deselect product
    const toggleProduct = (productId: string) => {
        setSelectedIds((previous) =>
            previous.includes(productId)
                ? previous.filter((id) => id !== productId)
                : [...previous, productId]
        );
    };

    // Add selected products to cart
    const handleAddCombo = async () => {
        if (!selectedProducts.length || adding) return;

        try {
            setAdding(true);

            for (const product of selectedProducts) {
                await onAddToCart(product, 1);
            }
        } catch (error) {
            console.error("Failed to add combo to cart:", error);
        } finally {
            setAdding(false);
        }
    };

    // Loading state
    if (loading) {
        return (
            <section
                className={`mx-auto my-8 max-w-7xl animate-pulse rounded-2xl p-6 ${isDark ? "bg-[#241E1A]" : "bg-white"
                    }`}
            >
                <div className="h-7 w-64 rounded bg-gray-200" />
                <div className="mt-5 h-40 rounded-xl bg-gray-200" />
            </section>
        );
    }

    // Hide section if there are no recommendations
    if (!recommendations.length) return null;

    return (
        <section
            className={`mx-auto my-8 max-w-7xl rounded-2xl p-5 sm:p-6 lg:p-8 ${isDark
                    ? "bg-[#241E1A] text-[#F5EDE4]"
                    : "bg-white text-[#211B18]"
                }`}
        >
            <h2 className="mb-5 font-serif text-2xl font-semibold sm:text-3xl">
                Frequently bought together
            </h2>

            <div className="grid grid-cols-1 items-center gap-6 lg:grid-cols-[1fr_1.8fr]">

                {/* Product cards */}
                <div className="grid grid-cols-3 gap-3 sm:gap-5">
                    {allProducts.map((product, index) => {
                        const image =
                            product.images?.[0] || product.image;

                        const price = getPrice(product);

                        return (
                            <div
                                key={product._id}
                                className="min-w-0"
                            >
                                {/* Product image */}
                                <div className="relative">
                                    <div
                                        className={`flex aspect-square items-center justify-center overflow-hidden rounded-xl ${isDark
                                                ? "bg-[#15110F]"
                                                : "bg-[#211B18]"
                                            }`}
                                    >
                                        {image ? (
                                            <img
                                                src={image}
                                                alt={
                                                    product.name ||
                                                    product.title ||
                                                    "Product"
                                                }
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span className="px-1 text-center text-xs tracking-widest text-[#D9B48F]">
                                                {product.name ||
                                                    product.title ||
                                                    "PRODUCT"}
                                            </span>
                                        )}
                                    </div>

                                    {index !== allProducts.length - 1 && (
                                        <span className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-xl lg:block">
                                            +
                                        </span>
                                    )}
                                </div>

                                {/* Product checkbox and details */}
                                <label className="mt-3 flex cursor-pointer items-start gap-2 text-xs">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(
                                            product._id
                                        )}
                                        onChange={() =>
                                            toggleProduct(product._id)
                                        }
                                        className="mt-0.5 h-4 w-4 shrink-0 accent-emerald-800"
                                    />

                                    <span className="min-w-0">
                                        <span className="block line-clamp-2 font-medium">
                                            {product.name ||
                                                product.title ||
                                                "Product"}
                                        </span>

                                        <span className="mt-1 block text-[#958A80]">
                                            {formatPrice(price)}
                                        </span>
                                    </span>
                                </label>
                            </div>
                        );
                    })}
                </div>

                {/* Combo summary */}
                <div
                    className={`rounded-xl border border-dashed p-4 sm:p-5 ${isDark
                            ? "border-emerald-700 bg-[#151E19]"
                            : "border-emerald-700 bg-[#F5FAF6]"
                        }`}
                >
                    <p className="text-sm font-semibold text-emerald-800">
                        Combo of {selectedProducts.length} products
                    </p>

                    <p className="mt-1 text-2xl font-bold">
                        {formatPrice(comboTotal)}
                    </p>

                    <button
                        type="button"
                        onClick={handleAddCombo}
                        disabled={!selectedProducts.length || adding}
                        className="mt-4 w-full rounded-xl bg-[#176044] px-5 py-4 text-sm font-bold text-white transition hover:bg-[#104A35] disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {adding
                            ? "Adding to cart..."
                            : "Add combo to cart"}
                    </button>
                </div>
            </div>
        </section>
    );
}
