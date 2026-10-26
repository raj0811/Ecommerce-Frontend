
import ProductCard from "./ProductCard";

export type StoreProduct = {
    _id: string;
    name: string;
    slug?: string;
    description?: string;
    price: number;
    compareAtPrice?: number;
    images?: string[];
    stock?: number;
    isActive?: boolean;
    isFeatured?: boolean;
};

type ProductSectionProps = {
    products: StoreProduct[];
    onAddToCart: (product: StoreProduct) => void;
};

export default function ProductSection({
    products,
    onAddToCart,
}: ProductSectionProps) {
    if (products.length === 0) {
        return (
            <div className="rounded-2xl border border-dashed border-gray-300 py-16 text-center">
                <p className="text-lg font-semibold">No products available yet</p>
                <p className="mt-2 text-sm text-gray-500">
                    Add active products from your admin dashboard.
                </p>
            </div>
        );
    }

    return (
        <div
            id="products"
            className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 lg:grid-cols-4"
        >
            {products.map((product) => (
                <ProductCard
                    key={product._id}
                    product={product}
                    onAddToCart={onAddToCart}
                />
            ))}
        </div>
    );
}
