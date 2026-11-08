
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import useCart from "@/hooks/useCart";
import type { StoreProduct } from "@/app/components/store/ProductSection";

type Product = {
    _id: string;
    name: string;
    slug?: string;
    description?: string;
    price: number;
    compareAtPrice?: number | null;
    images?: string[];
    category?: string;
    stock?: number;
    isActive?: boolean;
    isFeatured?: boolean;
};

type ProductResponse = {
    products: Product[];
    pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
};

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

const formatPrice = (price: number) =>
    `₹${Number(price).toLocaleString("en-IN")}`;

export default function ProductListing() {
    const { addToCart } = useCart();

    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState({
        total: 0,
        page: 1,
        limit: 12,
        totalPages: 0,
    });

    const [theme, setTheme] = useState<"light" | "dark">("light");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    const [categories, setCategories] = useState<string[]>([]);
    const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

    const [minPrice, setMinPrice] = useState("0");
    const [maxPrice, setMaxPrice] = useState("2500");
    const [inStock, setInStock] = useState(false);

    const [sortBy, setSortBy] = useState("featured");
    const [page, setPage] = useState(1);

    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [wishlist, setWishlist] = useState<string[]>([]);
    const [addingProduct, setAddingProduct] = useState<string | null>(null);

    // Theme
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        setTheme(savedTheme === "dark" ? "dark" : "light");
    }, []);

    // Debounced search
    useEffect(() => {
        const timeout = setTimeout(() => {
            setSearch(searchInput.trim());
            setPage(1);
        }, 400);

        return () => clearTimeout(timeout);
    }, [searchInput]);

    // Fetch products
    const fetchProducts = useCallback(async () => {
        if (!API_URL) {
            setError("API URL is not configured.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const params = new URLSearchParams({
                page: String(page),
                limit: "12",
            });

            if (search) params.set("search", search);

            // The current API accepts one category at a time.
            if (selectedCategories.length === 1) {
                params.set("category", selectedCategories[0]);
            }

            if (minPrice !== "") params.set("minPrice", minPrice);
            if (maxPrice !== "") params.set("maxPrice", maxPrice);
            if (inStock) params.set("inStock", "true");

            const response = await fetch(
                `${API_URL}/product?${params.toString()}`,
                { cache: "no-store" }
            );

            if (!response.ok) {
                throw new Error(`Request failed (${response.status})`);
            }

            const data: ProductResponse = await response.json();

            setProducts(data.products || []);
            setPagination(data.pagination);

            // Collect categories from products received.
            setCategories((previous) => {
                const combined = new Set(previous);

                (data.products || []).forEach((product) => {
                    if (product.category) {
                        combined.add(product.category);
                    }
                });

                return Array.from(combined).sort();
            });
        } catch (err) {
            console.error("Product listing error:", err);
            setError("Unable to load products. Please try again.");
        } finally {
            setLoading(false);
        }
    }, [
        page,
        search,
        selectedCategories,
        minPrice,
        maxPrice,
        inStock,
    ]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    // Multiple category selections are filtered locally because
    // the current backend accepts only one category parameter.
    const filteredProducts = useMemo(() => {
        let result = [...products];

        if (selectedCategories.length > 1) {
            result = result.filter((product) =>
                selectedCategories.includes(product.category || "")
            );
        }

        if (sortBy === "price-low") {
            result.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price-high") {
            result.sort((a, b) => b.price - a.price);
        } else if (sortBy === "featured") {
            result.sort(
                (a, b) =>
                    Number(b.isFeatured) - Number(a.isFeatured)
            );
        }

        return result;
    }, [products, selectedCategories, sortBy]);

    // Search suggestions from currently fetched products.
    const suggestions = useMemo(() => {
        const value = searchInput.trim().toLowerCase();

        if (!value) return [];

        return products
            .filter((product) =>
                product.name.toLowerCase().includes(value)
            )
            .slice(0, 5);
    }, [products, searchInput]);

    const toggleCategory = (category: string) => {
        setSelectedCategories((previous) =>
            previous.includes(category)
                ? previous.filter((item) => item !== category)
                : [...previous, category]
        );
        setPage(1);
    };

    const toggleWishlist = (id: string) => {
        setWishlist((previous) =>
            previous.includes(id)
                ? previous.filter((item) => item !== id)
                : [...previous, id]
        );
    };

    const handleAddToCart = async (product: Product) => {
        try {
            setAddingProduct(product._id);

            const cartProduct: StoreProduct = {
                _id: product._id,
                name: product.name,
                slug: product.slug,
                description: product.description,
                price: product.price,
                compareAtPrice: product.compareAtPrice ?? undefined,
                images: product.images || [],
                stock: product.stock,
                isActive: product.isActive,
            };

            await addToCart(cartProduct, 1);
        } catch (err) {
            console.error("Add to cart failed:", err);
        } finally {
            setAddingProduct(null);
        }
    };

    const clearFilters = () => {
        setSelectedCategories([]);
        setMinPrice("0");
        setMaxPrice("2500");
        setInStock(false);
        setSearchInput("");
        setSearch("");
        setPage(1);
    };

    const isDark = theme === "dark";

    const pageStyle = isDark
        ? "bg-[#15110F] text-[#F5EDE4]"
        : "bg-[#FAF7F2] text-[#211B18]";

    const inputStyle = isDark
        ? "border-[#493B32] bg-[#241E1A] text-white"
        : "border-[#DED5CB] bg-white text-[#211B18]";

    // Sidebar filters
    const Filters = () => (
        <div className="space-y-6">
            <div>
                <div className="mb-4 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-800">
                        Category
                    </h3>

                    <button
                        onClick={() => setSelectedCategories([])}
                        className="text-xs text-[#958A80]"
                    >
                        Clear
                    </button>
                </div>

                <div className="space-y-3">
                    {categories.map((category) => (
                        <label
                            key={category}
                            className="flex cursor-pointer items-center justify-between gap-2 text-sm"
                        >
                            <span className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={selectedCategories.includes(category)}
                                    onChange={() => toggleCategory(category)}
                                    className="h-4 w-4 accent-emerald-800"
                                />
                                <span className="capitalize">
                                    {category}
                                </span>
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            <div className={`border-t pt-5 ${isDark ? "border-[#493B32]" : "border-[#E5DDD4]"}`}>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-800">
                    Price
                </h3>

                <div className="grid grid-cols-2 items-center gap-2">
                    <input
                        type="number"
                        min="0"
                        placeholder="Min"
                        value={minPrice}
                        onChange={(e) => {
                            setMinPrice(e.target.value);
                            setPage(1);
                        }}
                        className={`min-w-0 rounded-lg border px-3 py-2.5 text-sm ${inputStyle}`}
                    />

                    <input
                        type="number"
                        min="0"
                        placeholder="Max"
                        value={maxPrice}
                        onChange={(e) => {
                            setMaxPrice(e.target.value);
                            setPage(1);
                        }}
                        className={`min-w-0 rounded-lg border px-3 py-2.5 text-sm ${inputStyle}`}
                    />
                </div>

                <p className="mt-2 text-xs text-[#958A80]">
                    Enter your preferred price range.
                </p>
            </div>

            <div className={`border-t pt-5 ${isDark ? "border-[#493B32]" : "border-[#E5DDD4]"}`}>
                <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-emerald-800">
                    Availability
                </h3>

                <label className="flex cursor-pointer items-center gap-3 text-sm">
                    <input
                        type="checkbox"
                        checked={inStock}
                        onChange={(e) => {
                            setInStock(e.target.checked);
                            setPage(1);
                        }}
                        className="h-4 w-4 accent-emerald-800"
                    />
                    In stock only
                </label>
            </div>
        </div>
    );

    return (
        <main className={`min-h-screen ${pageStyle}`}>

            {/* Top navigation */}
            <header className={`border-b ${isDark ? "border-[#493B32]" : "border-[#E5DDD4]"}`}>
                <div className="mx-auto grid max-w-[1600px] grid-cols-[auto_1fr_auto] items-center gap-5 px-5 py-5 sm:px-8">

                    <Link href="/" className="font-serif text-xl font-bold sm:text-2xl">
                        ALPHA MALE
                    </Link>

                    {/* Search */}
                    <div className="relative mx-auto w-full max-w-xl">
                        <div className={`flex items-center gap-3 rounded-full border px-4 py-3 ${isDark ? "border-[#59483B] bg-[#241E1A]" : "border-emerald-800 bg-white"}`}>
                            <span className="text-lg">⌕</span>

                            <input
                                type="search"
                                value={searchInput}
                                onChange={(e) => {
                                    setSearchInput(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        setSearch(searchInput.trim());
                                        setShowSuggestions(false);
                                        setPage(1);
                                    }
                                    if (e.key === "Escape") {
                                        setShowSuggestions(false);
                                    }
                                }}
                                placeholder="Search products..."
                                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
                            />

                            {searchInput && (
                                <button
                                    onClick={() => {
                                        setSearchInput("");
                                        setSearch("");
                                        setShowSuggestions(false);
                                        setPage(1);
                                    }}
                                    aria-label="Clear search"
                                >
                                    ×
                                </button>
                            )}
                        </div>

                        {showSuggestions && searchInput.trim() && (
                            <div className={`absolute left-0 right-0 top-full z-40 mt-2 overflow-hidden rounded-xl border p-2 shadow-xl ${isDark ? "border-[#493B32] bg-[#241E1A]" : "border-[#E5DDD4] bg-white"}`}>
                                <p className="px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[#958A80]">
                                    Suggestions
                                </p>

                                {suggestions.length > 0 ? (
                                    suggestions.map((product) => (
                                        <Link
                                            key={product._id}
                                            href={`/products/${product._id}`}
                                            onClick={() => setShowSuggestions(false)}
                                            className="flex items-center gap-3 rounded-lg p-2 hover:bg-black/5"
                                        >
                                            <div className="h-11 w-11 shrink-0 overflow-hidden rounded-lg bg-[#211B18]">
                                                {product.images?.[0] && (
                                                    <img
                                                        src={product.images[0]}
                                                        alt={product.name}
                                                        className="h-full w-full object-cover"
                                                    />
                                                )}
                                            </div>

                                            <div className="min-w-0">
                                                <p className="truncate text-sm font-semibold">
                                                    {product.name}
                                                </p>
                                                <p className="text-xs text-[#958A80]">
                                                    Alpha Male · {formatPrice(product.price)}
                                                </p>
                                            </div>
                                        </Link>
                                    ))
                                ) : (
                                    <p className="px-3 py-3 text-xs text-[#958A80]">
                                        No suggestions in the current results.
                                    </p>
                                )}

                                <button
                                    onClick={() => {
                                        setSearch(searchInput.trim());
                                        setShowSuggestions(false);
                                        setPage(1);
                                    }}
                                    className="w-full px-3 py-3 text-left text-xs font-bold text-emerald-700"
                                >
                                    See all results for "{searchInput}"
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-4 text-sm">
                        <Link href="/profile" className="hidden sm:block">
                            Account
                        </Link>
                        <Link href="/cart">
                            Bag
                        </Link>
                    </div>
                </div>
            </header>

            {/* Click outside search */}
            {showSuggestions && (
                <button
                    aria-label="Close search suggestions"
                    className="fixed inset-0 z-20 cursor-default"
                    onClick={() => setShowSuggestions(false)}
                />
            )}

            <div className="relative z-10 mx-auto max-w-[1600px] px-5 py-8 sm:px-8">

                {/* Breadcrumb and title */}
                <div className="mb-7">
                    <div className="mb-4 text-xs text-[#958A80]">
                        <Link href="/">Home</Link>
                        <span className="mx-2">/</span>
                        <span>Shop</span>
                        <span className="mx-2">/</span>
                        <span className="text-current">All products</span>
                    </div>

                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <div>
                            <h1 className="font-serif text-4xl sm:text-5xl">
                                All products
                            </h1>

                            <p className="mt-2 text-sm text-[#958A80]">
                                Showing {pagination.total} products
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <span className="hidden text-xs text-[#958A80] sm:block">
                                Sort by
                            </span>

                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className={`rounded-lg border px-3 py-3 text-sm outline-none ${inputStyle}`}
                            >
                                <option value="featured">Featured</option>
                                <option value="newest">Default order</option>
                                <option value="price-low">Price: Low to High</option>
                                <option value="price-high">Price: High to Low</option>
                            </select>
                        </div>
                    </div>

                    {/* Selected filter chips */}
                    {(selectedCategories.length > 0 || inStock || search) && (
                        <div className="mt-5 flex flex-wrap gap-2">
                            {selectedCategories.map((category) => (
                                <button
                                    key={category}
                                    onClick={() => toggleCategory(category)}
                                    className="rounded-full bg-[#E6F1EA] px-3 py-2 text-xs font-semibold text-emerald-800"
                                >
                                    {category} ×
                                </button>
                            ))}

                            {inStock && (
                                <button
                                    onClick={() => setInStock(false)}
                                    className="rounded-full bg-[#E6F1EA] px-3 py-2 text-xs font-semibold text-emerald-800"
                                >
                                    In stock ×
                                </button>
                            )}

                            {search && (
                                <button
                                    onClick={() => {
                                        setSearch("");
                                        setSearchInput("");
                                    }}
                                    className="rounded-full bg-[#E6F1EA] px-3 py-2 text-xs font-semibold text-emerald-800"
                                >
                                    Search: {search} ×
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Main content */}
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-[220px_minmax(0,1fr)] xl:grid-cols-[250px_minmax(0,1fr)]">

                    {/* Desktop sidebar */}
                    <aside className="hidden lg:block">
                        <div className="sticky top-5">
                            <Filters />
                        </div>
                    </aside>

                    {/* Products */}
                    <section>
                        {/* Mobile filter button */}
                        <button
                            onClick={() => setMobileFiltersOpen(true)}
                            className="mb-5 rounded-lg border px-4 py-2 text-sm lg:hidden"
                        >
                            Filter products
                        </button>

                        {error && (
                            <div className="rounded-xl bg-red-50 p-5 text-sm text-red-700">
                                {error}
                                <button
                                    onClick={fetchProducts}
                                    className="ml-3 font-bold underline"
                                >
                                    Retry
                                </button>
                            </div>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-6">
                                {Array.from({ length: 12 }).map((_, i) => (
                                    <div key={i} className="animate-pulse">
                                        <div className="aspect-[3/4] rounded-xl bg-gray-200" />
                                        <div className="mt-3 h-4 rounded bg-gray-200" />
                                        <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
                                    </div>
                                ))}
                            </div>
                        ) : !error && filteredProducts.length === 0 ? (
                            <div className="py-24 text-center">
                                <h2 className="font-serif text-2xl">
                                    No products found
                                </h2>
                                <p className="mt-2 text-sm text-[#958A80]">
                                    Try changing your filters.
                                </p>
                                <button
                                    onClick={clearFilters}
                                    className="mt-5 rounded-lg bg-[#176044] px-6 py-3 text-sm font-semibold text-white"
                                >
                                    Clear filters
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 xl:grid-cols-6">

                                {filteredProducts.map((product) => {
                                    const discount =
                                        product.compareAtPrice &&
                                            product.compareAtPrice > product.price
                                            ? Math.round(
                                                ((product.compareAtPrice - product.price) /
                                                    product.compareAtPrice) * 100
                                            )
                                            : 0;

                                    const liked = wishlist.includes(product._id);

                                    return (
                                        <article
                                            key={product._id}
                                            className="group min-w-0"
                                        >
                                            {/* Product image */}
                                            <Link href={`/products/${product._id}`}>
                                                <div className={`relative aspect-[3/4] overflow-hidden rounded-xl ${isDark ? "bg-[#241E1A]" : "bg-[#EDE7DF]"}`}>

                                                    {product.images?.[0] ? (
                                                        <img
                                                            src={product.images[0]}
                                                            alt={product.name}
                                                            loading="lazy"
                                                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                                        />
                                                    ) : (
                                                        <div className="flex h-full items-center justify-center text-xs text-[#958A80]">
                                                            No image
                                                        </div>
                                                    )}

                                                    {product.isFeatured && (
                                                        <span className="absolute left-2 top-2 rounded bg-[#176044] px-2 py-1 text-[9px] font-bold text-white">
                                                            Bestseller
                                                        </span>
                                                    )}

                                                    {discount > 0 && (
                                                        <span className="absolute left-2 top-2 rounded bg-[#176044] px-2 py-1 text-[9px] font-bold text-white">
                                                            Save {discount}%
                                                        </span>
                                                    )}

                                                    <button
                                                        type="button"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            toggleWishlist(product._id);
                                                        }}
                                                        aria-label={liked ? "Remove from wishlist" : "Add to wishlist"}
                                                        className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg text-[#211B18] shadow-sm"
                                                    >
                                                        {liked ? "♥" : "♡"}
                                                    </button>

                                                    {product.stock === 0 && (
                                                        <span className="absolute inset-x-0 bottom-0 bg-black/70 py-2 text-center text-xs font-bold text-white">
                                                            Out of stock
                                                        </span>
                                                    )}
                                                </div>
                                            </Link>

                                            {/* Product information */}
                                            <div className="pt-3">
                                                <Link href={`/products/${product._id}`}>
                                                    <h3 className="line-clamp-2 text-sm font-semibold">
                                                        {product.name}
                                                    </h3>
                                                </Link>

                                                <div className="mt-1 flex flex-wrap items-center gap-1 text-xs">
                                                    <span className="text-amber-600">★</span>
                                                    <span className="text-[#958A80]">
                                                        Rating unavailable
                                                    </span>
                                                </div>

                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                    <span className="text-sm font-bold">
                                                        {formatPrice(product.price)}
                                                    </span>

                                                    {product.compareAtPrice != null &&
                                                        product.compareAtPrice > product.price && (
                                                            <span className="text-xs text-[#958A80] line-through">
                                                                {formatPrice(product.compareAtPrice)}
                                                            </span>
                                                        )}
                                                </div>

                                                <button
                                                    type="button"
                                                    disabled={
                                                        product.isActive === false ||
                                                        product.stock === 0 ||
                                                        addingProduct === product._id
                                                    }
                                                    onClick={() => handleAddToCart(product)}
                                                    className="mt-3 w-full rounded-lg border border-current px-2 py-2.5 text-xs font-semibold transition hover:bg-[#176044] hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                                                >
                                                    {addingProduct === product._id
                                                        ? "Adding..."
                                                        : product.stock === 0
                                                            ? "Out of stock"
                                                            : "Add to cart"}
                                                </button>
                                            </div>
                                        </article>
                                    );
                                })}
                            </div>
                        )}

                        {/* Pagination */}
                        {!loading && !error && pagination.totalPages > 1 && (
                            <div className="mt-12 flex items-center justify-center gap-2">
                                <button
                                    disabled={page <= 1}
                                    onClick={() => setPage((p) => p - 1)}
                                    className="rounded-lg border px-4 py-2 text-sm disabled:opacity-30"
                                >
                                    Previous
                                </button>

                                <span className="px-3 text-sm">
                                    {page} / {pagination.totalPages}
                                </span>

                                <button
                                    disabled={page >= pagination.totalPages}
                                    onClick={() => setPage((p) => p + 1)}
                                    className="rounded-lg border px-4 py-2 text-sm disabled:opacity-30"
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </section>
                </div>
            </div>

            {/* Mobile filter drawer */}
            {mobileFiltersOpen && (
                <div className="fixed inset-0 z-50 lg:hidden">
                    <button
                        aria-label="Close filters"
                        onClick={() => setMobileFiltersOpen(false)}
                        className="absolute inset-0 bg-black/50"
                    />

                    <div className={`absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl p-6 ${isDark ? "bg-[#201A16] text-white" : "bg-[#FAF7F2] text-[#211B18]"}`}>
                        <div className="mb-6 flex items-center justify-between">
                            <h2 className="text-lg font-semibold">
                                Filters
                            </h2>
                            <button
                                onClick={() => setMobileFiltersOpen(false)}
                                className="text-2xl"
                            >
                                ×
                            </button>
                        </div>

                        <Filters />

                        <button
                            onClick={() => setMobileFiltersOpen(false)}
                            className="mt-7 w-full rounded-lg bg-[#176044] py-3 font-semibold text-white"
                        >
                            Show products
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}
