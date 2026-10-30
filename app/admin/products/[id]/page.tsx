
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
    images?: string[];
    image?: string;
    stock?: number;
    isActive?: boolean;
    category?: string | { name?: string };
    [key: string]: unknown;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getProduct(id: string): Promise<Product | null> {
    if (!API_URL) {
        throw new Error('NEXT_PUBLIC_API_URL is not configured');
    }

    // Assumes the controller prefix is /product.
    // If your controller has a different @Controller prefix, change it here.
    const response = await fetch(
        `${API_URL}/product/info/${encodeURIComponent(id)}`,
        { cache: 'no-store' },
    );

    if (response.status === 404) return null;

    if (!response.ok) {
        throw new Error(`Failed to fetch product (${response.status})`);
    }

    return response.json();
}

function formatPrice(value: number): string {
    return `₹${value.toLocaleString('en-IN')}`;
}

export default async function ProductDetailsPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    let product: Product | null;

    try {
        product = await getProduct(id);
    } catch {
        throw new Error('Unable to load product. Please try again later.');
    }

    if (!product) notFound();

    const name = product.name || product.title || 'Product';
    const images = [
        ...(product.images ?? []),
        ...(product.image ? [product.image] : []),
    ].filter((image, index, array) => Boolean(image) && array.indexOf(image) === index);

    const price = product.salePrice ?? product.sellingPrice ?? product.price;
    const category =
        typeof product.category === 'object'
            ? product.category?.name
            : product.category;

    return (
        <main className="min-h-screen bg-white text-gray-900">
            <header className="border-b">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
                    <a href="/" className="text-2xl font-black tracking-tight">
                        ALPHA <span className="text-purple-600">MALE</span>
                    </a>

                    <a
                        href="/products"
                        className="text-sm font-semibold text-gray-600 hover:text-purple-600"
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

                        {price !== undefined && price !== null && (
                            <div className="mt-5">
                                <p className="text-3xl font-bold">{formatPrice(price)}</p>
                                {product.salePrice != null &&
                                    product.price != null &&
                                    product.salePrice < product.price && (
                                        <p className="mt-1 text-sm text-gray-500 line-through">
                                            {formatPrice(product.price)}
                                        </p>
                                    )}
                            </div>
                        )}

                        <div className="mt-6 border-y py-5">
                            <h2 className="font-semibold">Product Description</h2>
                            <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
                                {product.description || 'Discover this product from Alpha Male.'}
                            </p>
                        </div>

                        <div className="mt-6">
                            {product.isActive === false ? (
                                <p className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                                    This product is currently unavailable.
                                </p>
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
        </main>
    );
}
