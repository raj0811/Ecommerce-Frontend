
import { Suspense } from "react";
import { notFound } from "next/navigation";
import ProductPageClient from "@/Components/product/ProductPageClient";

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
    category?: string | { name?: string };
    bannerImages?: string[]
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getProduct(id: string): Promise<Product | null> {
    if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const response = await fetch(
        `${API_URL.replace(/\/+$/, "")}/product/info/${encodeURIComponent(id)}`,
        { cache: "no-store" }
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch product (${response.status})`);
    }

    return response.json();
}

function ProductLoading() {
    return (
        <main className="mx-auto min-h-screen max-w-7xl animate-pulse px-5 py-12">
            <div className="grid gap-10 md:grid-cols-2">
                <div className="aspect-square rounded-2xl bg-gray-100" />

                <div className="space-y-5 py-8">
                    <div className="h-8 w-3/4 rounded bg-gray-100" />
                    <div className="h-6 w-1/3 rounded bg-gray-100" />
                    <div className="h-24 rounded bg-gray-100" />
                </div>
            </div>
        </main>
    );
}

async function ProductContent({ id }: { id: string }) {
    let product: Product | null;

    try {
        product = await getProduct(id);

    } catch (error) {
        console.error("Product fetch failed:", error);
        throw new Error("Unable to load product. Please try again later.");
    }

    if (!product) {
        notFound();
    }

    return <ProductPageClient product={product} />;
}

async function ProductPageParams({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return <ProductContent id={id} />;
}

export default function ProductDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    return (
        <Suspense fallback={<ProductLoading />}>
            <ProductPageParams params={params} />
        </Suspense>
    );
}
