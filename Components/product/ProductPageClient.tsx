
"use client";

import { useEffect, useState } from "react";

import ProductOverview from "./ProductOverview";
import FrequentlyBoughtTogether, {
    type Product as RecommendationProduct,
} from "./FrequentlyBoughtTogether";

import useCart from "@/hooks/useCart";
import type { StoreProduct } from "@/app/components/store/ProductSection";
import ProductBanners from "./ProductBanners";
import { log } from "util";

type Product = {
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
    category?: string | { name?: string };
    rating?: number;
    reviewCount?: number;
    packs?: {
        quantity: number;
        price: number;
        compareAtPrice?: number;
        discount?: number;
        label?: string;
    }[];
    bannerImages?: string[]
};

export default function ProductPageClient({
    product,
}: {
    product: Product;
}) {
    console.log(product);

    const [theme, setTheme] = useState<"light" | "dark">("light");

    const { addToCart, cartError } = useCart();

    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");

        setTheme(savedTheme === "dark" ? "dark" : "light");
    }, []);

    // Convert API product into your existing cart product structure.
    const handleAddToCart = async (
        selectedProduct: RecommendationProduct,
        quantity: number = 1,
    ) => {
        try {
            const cartProduct: StoreProduct = {
                _id: selectedProduct._id,
                name:
                    selectedProduct.name ||
                    selectedProduct.title ||
                    "Product",
                slug: selectedProduct.slug,
                price:
                    selectedProduct.salePrice ??
                    selectedProduct.sellingPrice ??
                    selectedProduct.price ??
                    0,
                images:
                    selectedProduct.images ??
                    (selectedProduct.image
                        ? [selectedProduct.image]
                        : []),
                stock: selectedProduct.stock,
                isActive: selectedProduct.isActive,
            };

            await addToCart(cartProduct, quantity);
        } catch (error) {
            console.error("Add to cart failed:", error);
        }
    };

    return (
        <main
            className={
                theme === "dark"
                    ? "min-h-screen bg-[#15110F] text-[#F5EDE4]"
                    : "min-h-screen bg-[#FAF7F2] text-[#211B18]"
            }
        >
            {/* Main product section */}
            <ProductOverview
                product={product}
                theme={theme}
                onAddToCart={handleAddToCart}
            />

            {/* Frequently bought together */}
            <FrequentlyBoughtTogether
                currentProduct={product}
                theme={theme}
                onAddToCart={handleAddToCart}
            />

            <ProductBanners
                bannerImages={product.bannerImages}
                theme={theme}
            />

            {/* Cart error */}
            {cartError && (
                <p className="mx-auto max-w-7xl px-5 pb-4 text-sm text-red-600">
                    {cartError}
                </p>
            )}
        </main>
    );
}
