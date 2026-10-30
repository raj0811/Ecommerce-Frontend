
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

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
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getProduct(id: string): Promise<Product | null> {
    if (!API_URL) {
        throw new Error('NEXT_PUBLIC_API_URL is not configured');
    }

    const response = await fetch(
        `${API_URL}/product/info/${encodeURIComponent(id)}`,
        { cache: 'no-store' },
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(`Failed to fetch product (${response.status})`);
    }

    return response.json();
}

function formatPrice(price: number): string {
    return `₹${Number(price).toLocaleString('en-IN')}`;
}

function ProductLoading() {
    return (
        <main className="mx-auto min-h-screen max-w-7xl animate-pulse px-5 py-12">
            <div className="grid gap-10 md:grid-cols-2">
                <div className="aspect-[4/5] rounded-2xl bg-gray-100" />
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
        console.error('Product fetch failed:', error);
        throw new Error('Unable to load product. Please try again later.');
    }

    if (!product) {
        notFound();
    }

    const name = product.name || product.title || 'Product';

    const images = [
        ...(product.images ?? []),
        ...(product.image ? [product.image] : []),
    ].filter(
        (image, index, array) =>
            Boolean(image) && array.indexOf(image) === index,
    );

    const price =
        product.salePrice ??
        product.sellingPrice ??
        product.price;

    const category =
        typeof product.category === 'object'
            ? product.category?.name
            : product.category;

    const outOfStock =
        product.isActive === false ||
        (typeof product.stock === 'number' && product.stock <= 0);

    return (
        <main className="min-h-screen bg-white text-gray-900">
            <header className="border-b border-gray-100">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
                    <a href="/" className="text-2xl font-black tracking-tight">
                        ALPHA <span className="text-purple-600">MALE</span>
                    </a>

                    <a
                        href="/products"
                        className="text-sm font-semibold text-gray-600 transition hover:text-purple-600"
                    >
                        All Products
                    </a>
                </div>
            </header>

            <section className="mx-auto max-w-7xl px-5 py-10 sm:py-16">
                <div className="grid gap-10 md:grid-cols-2 md:gap-14">
                    <div>
                        {images.length > 0 ? (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-2xl bg-gray-100">
                                    <img
                                        src={images[0]}
                                        alt={name}
                                        fetchPriority="high"
                                        className="aspect-[4/5] w-full object-cover"
                                    />
                                </div>

                                {images.length > 1 && (
                                    <div className="grid grid-cols-3 gap-3">
                                        {images.slice(1, 4).map((image, index) => (
                                            <div
                                                key={`${image}-${index}`}
                                                className="overflow-hidden rounded-xl bg-gray-100"
                                            >
                                                <img
                                                    src={image}
                                                    alt={`${name} view ${index + 2}`}
                                                    className="aspect-square w-full object-cover"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                                No product image available
                            </div>
                        )}
                    </div>

                    <div className="flex flex-col justify-center">
                        {category && (
                            <p className="text-sm font-semibold uppercase tracking-widest text-purple-600">
                                {category}
                            </p>
                        )}

                        <h1 className="mt-3 text-3xl font-black sm:text-4xl">
                            {name}
                        </h1>

                        {price != null && (
                            <div className="mt-5">
                                <p className="text-3xl font-bold">
                                    {formatPrice(price)}
                                </p>

                                {product.compareAtPrice != null &&
                                    product.compareAtPrice > price && (
                                        <p className="mt-1 text-sm text-gray-500 line-through">
                                            {formatPrice(product.compareAtPrice)}
                                        </p>
                                    )}
                            </div>
                        )}

                        <div className="mt-6 border-y py-5">
                            <h2 className="font-semibold">
                                Product Description
                            </h2>

                            <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
                                {product.description ||
                                    'Discover this product from Alpha Male.'}
                            </p>
                        </div>

                        <div className="mt-6">
                            {outOfStock ? (
                                <button
                                    disabled
                                    className="w-full rounded-lg bg-gray-300 px-6 py-4 font-bold text-gray-600"
                                >
                                    Out of Stock
                                </button>
                            ) : (
                                <a
                                    href={`/checkout?productId=${encodeURIComponent(product._id)}`}
                                    className="flex w-full items-center justify-center rounded-lg bg-purple-600 px-6 py-4 font-bold text-white transition hover:bg-purple-700"
                                >
                                    Buy Now
                                </a>
                            )}

                            <p className="mt-3 text-center text-xs text-gray-500">
                                Product ID: {product._id}
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-gray-100 px-5 py-8 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Alpha Male. All rights reserved.
            </footer>
        </main>
    );
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
