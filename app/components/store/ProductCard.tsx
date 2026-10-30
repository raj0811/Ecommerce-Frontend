import Link from "next/link";
import type { StoreProduct } from "./ProductSection";

type ProductCardProps = {
    product: StoreProduct;
    onAddToCart: (product: StoreProduct) => void;
};

export default function ProductCard({
    product,
    onAddToCart,
}: ProductCardProps) {
    const image = product.images?.[0];
    const outOfStock =
        typeof product.stock === "number" && product.stock <= 0;

    const productUrl = `/products/${product._id}`;

    return (
        <article className="group min-w-0">
            <Link
                href={productUrl}
                className="block"
                aria-label={`View ${product.name} details`}
            >
                <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-gray-100">
                    {image ? (
                        <img
                            src={image}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-gray-400">
                            No image available
                        </div>
                    )}

                    {product.isFeatured && (
                        <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold">
                            Featured
                        </span>
                    )}
                </div>
            </Link>

            <div className="pt-4">
                <Link href={productUrl} className="block">
                    <h3 className="truncate font-semibold text-gray-900 transition group-hover:text-orange-600">
                        {product.name}
                    </h3>
                </Link>

                {product.description && (
                    <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                        {product.description}
                    </p>
                )}

                <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span className="font-bold">
                        ₹{Number(product.price).toLocaleString("en-IN")}
                    </span>

                    {product.compareAtPrice != null &&
                        product.compareAtPrice > product.price && (
                            <span className="text-sm text-gray-400 line-through">
                                ₹{Number(product.compareAtPrice).toLocaleString("en-IN")}
                            </span>
                        )}
                </div>

                <button
                    type="button"
                    onClick={() => onAddToCart(product)}
                    disabled={outOfStock}
                    className="mt-4 w-full rounded-full bg-gray-900 px-3 py-3 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                    {outOfStock ? "Out of Stock" : "Add to Cart"}
                </button>
            </div>
        </article>
    );
}