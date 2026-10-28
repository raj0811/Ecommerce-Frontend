
"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AddProductModal from "./modals/AddProductModal";
import RecentLandingPages from "./Components/RecentLandingPages";
import AdminSidebar from "./Components/AdminSidebar";


const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Product {
    _id: string;
    name: string;
    sku?: string;
    price: number;
    stock: number;
    category: string;
    images?: string[];
    createdAt?: string;
    isFeatured?: boolean;
}

interface AdminProfile {
    name: string;
    email: string;
}

interface ProductsResponse {
    products?: Product[];
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export default function AdminDashboardPage() {
    const router = useRouter();

    const [admin, setAdmin] = useState<AdminProfile | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [totalProducts, setTotalProducts] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [stats, setStats] = useState({
        totalProducts: 0,
        inventoryUnits: 0,
        featuredProducts: 0,
        lowStock: 0,
    });
    const logout = useCallback(() => {
        localStorage.removeItem("adminAccessToken");
        router.replace("/admin/login");
    }, [router]);

    useEffect(() => {
        let cancelled = false;

        async function loadDashboard() {
            const token = localStorage.getItem("adminAccessToken");

            if (!token) {
                router.replace("/admin/login");
                return;
            }

            try {
                const headers = {
                    Authorization: `Bearer ${token}`,
                };

                const [profileResponse, productsResponse] = await Promise.all([
                    fetch(`${API_URL}/admin/profile`, {
                        headers,
                        cache: "no-store",
                    }),
                    fetch(`${API_URL}/product?page=1&limit=100`, {
                        headers,
                        cache: "no-store",
                    }),
                ]);

                if (
                    profileResponse.status === 401 ||
                    profileResponse.status === 403
                ) {
                    localStorage.removeItem("adminAccessToken");
                    router.replace("/admin/login");
                    return;
                }

                if (!profileResponse.ok) {
                    throw new Error("Could not verify your admin profile.");
                }

                if (!productsResponse.ok) {
                    throw new Error("Could not load products from the server.");
                }

                const profileResult = await profileResponse.json();
                const profile = profileResult.admin ?? profileResult;

                const productResult: ProductsResponse | Product[] =
                    await productsResponse.json();

                const productList = Array.isArray(productResult)
                    ? productResult
                    : productResult.products ?? [];

                const total = Array.isArray(productResult)
                    ? productList.length
                    : productResult.pagination?.total ?? productList.length;

                if (!cancelled) {
                    setAdmin(profile);
                    setProducts(
                        [...productList].sort((a, b) => {
                            const dateA = a.createdAt
                                ? new Date(a.createdAt).getTime()
                                : 0;
                            const dateB = b.createdAt
                                ? new Date(b.createdAt).getTime()
                                : 0;

                            return dateB - dateA;
                        }),
                    );
                    setTotalProducts(total);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Failed to load dashboard.",
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        return () => {
            cancelled = true;
        };
    }, [router]);

    useEffect(() => {
        const fetchDashboardStats = async () => {
            try {
                const token = localStorage.getItem('adminAccessToken');

                const response = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/product/stats`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    },
                );

                if (!response.ok) {
                    throw new Error('Failed to fetch dashboard statistics');
                }

                const result = await response.json();
                setStats(result.data);
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            }
        };

        fetchDashboardStats();
    }, []);

    // const inventoryUnits = products.reduce(
    //     (total, product) => total + (Number(product.stock) || 0),
    //     0,
    // );

    // const featuredProducts = products.filter(
    //     (product) => product.isFeatured,
    // ).length;

    // const lowStockProducts = products.filter(
    //     (product) => Number(product.stock) > 0 && Number(product.stock) <= 5,
    // ).length;

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
                <p className="text-sm font-medium text-slate-600">
                    Loading dashboard...
                </p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-slate-100 text-slate-900 md:flex">
            {/* <AdminSidebar adminName={admin?.name} /> */}
            {/* Admin header */}


            <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
                {/* Page heading */}
                <section className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                            Dashboard
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Welcome back{admin?.name ? `, ${admin.name}` : ""}.
                            Here's your store overview.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAddProduct(true)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        <span className="text-lg">+</span>
                        Add Product
                    </button>
                </section>

                {error && (
                    <div
                        role="alert"
                        className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        {error}
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="ml-2 font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Analytics cards */}
                <section className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <AnalyticsCard
                        label="Total products"
                        value={stats.totalProducts.toLocaleString("en-IN")}
                        description="Products in your catalogue"
                        symbol="P"
                    />

                    <AnalyticsCard
                        label="Inventory units"
                        value={stats.inventoryUnits.toLocaleString("en-IN")}
                        description="Units in the loaded product list"
                        symbol="I"
                    />

                    <AnalyticsCard
                        label="Featured products"
                        value={stats.featuredProducts.toLocaleString("en-IN")}
                        description="Featured in the loaded product list"
                        symbol="F"
                    />

                    <AnalyticsCard
                        label="Low stock"
                        value={stats.lowStock.toLocaleString("en-IN")}
                        description="Products with 1–5 units in the loaded list"
                        symbol="!"
                    />
                </section>

                {/* Recently added products */}
                <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                        <div>
                            <h2 className="text-lg font-bold">
                                Recently added products
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                Your newest products at a glance.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={() => router.push("/admin/products")}
                            className="self-start text-sm font-semibold text-slate-700 hover:text-black sm:self-auto"
                        >
                            View all products →
                        </button>
                    </div>

                    {products.length === 0 ? (
                        <div className="px-5 py-16 text-center sm:px-6">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl font-bold text-slate-500">
                                +
                            </div>
                            <h3 className="mt-4 font-semibold">
                                No products yet
                            </h3>
                            <p className="mt-2 text-sm text-slate-500">
                                Add your first product to start building your catalogue.
                            </p>
                            <button
                                type="button"
                                onClick={() => router.push("/admin/products/add")}
                                className="mt-5 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Add your first product
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Mobile product cards */}
                            <div className="divide-y divide-slate-100 md:hidden">
                                {products.slice(0, 5).map((product) => (
                                    <div key={product._id} className="flex gap-4 p-4">
                                        {product.images?.[0] ? (
                                            <img
                                                src={product.images[0]}
                                                alt={product.name}
                                                className="h-20 w-20 shrink-0 rounded-lg border border-slate-200 object-cover"
                                            />
                                        ) : (
                                            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs text-slate-400">
                                                No image
                                            </div>
                                        )}

                                        <div className="min-w-0 flex-1">
                                            <p className="break-words font-semibold">
                                                {product.name}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                SKU: {product.sku || "—"}
                                            </p>
                                            <p className="mt-2 font-semibold">
                                                ₹{Number(product.price).toLocaleString("en-IN")}
                                            </p>
                                            <p className="mt-1 text-xs text-slate-500">
                                                Stock: {product.stock} · {product.category}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop product table */}
                            <div className="hidden overflow-x-auto md:block">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                        <tr>
                                            <th className="px-6 py-4 font-semibold">Product</th>
                                            <th className="px-6 py-4 font-semibold">SKU</th>
                                            <th className="px-6 py-4 font-semibold">Category</th>
                                            <th className="px-6 py-4 text-right font-semibold">Price</th>
                                            <th className="px-6 py-4 text-right font-semibold">Stock</th>
                                            <th className="px-6 py-4 font-semibold">Added</th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {products.slice(0, 5).map((product) => (
                                            <tr
                                                key={product._id}
                                                className="transition hover:bg-slate-50"
                                            >
                                                <td className="px-6 py-4">
                                                    <div className="flex min-w-56 items-center gap-3">
                                                        {product.images?.[0] ? (
                                                            <img
                                                                src={product.images[0]}
                                                                alt={product.name}
                                                                className="h-12 w-12 shrink-0 rounded-lg border border-slate-200 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-12 w-12 shrink-0 rounded-lg bg-slate-100" />
                                                        )}
                                                        <span className="font-semibold">
                                                            {product.name}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="px-6 py-4 text-slate-500">
                                                    {product.sku || "—"}
                                                </td>

                                                <td className="px-6 py-4 capitalize text-slate-600">
                                                    {product.category || "—"}
                                                </td>

                                                <td className="px-6 py-4 text-right font-semibold">
                                                    ₹{Number(product.price).toLocaleString("en-IN")}
                                                </td>

                                                <td className="px-6 py-4 text-right">
                                                    <span
                                                        className={
                                                            product.stock <= 5
                                                                ? "font-semibold text-amber-700"
                                                                : "text-slate-700"
                                                        }
                                                    >
                                                        {product.stock}
                                                    </span>
                                                </td>

                                                <td className="whitespace-nowrap px-6 py-4 text-slate-500">
                                                    {product.createdAt
                                                        ? new Date(product.createdAt).toLocaleDateString(
                                                            "en-IN",
                                                            {
                                                                day: "numeric",
                                                                month: "short",
                                                                year: "numeric",
                                                            },
                                                        )
                                                        : "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="border-t border-slate-200 px-5 py-4 text-sm text-slate-500 sm:px-6">
                                Showing {Math.min(products.length, 5)} of{" "}
                                {totalProducts} products.
                            </div>
                        </>
                    )}
                </section>
                {/* Recent Landing Pages */}
                <RecentLandingPages />
            </div>
            {showAddProduct && (
                <AddProductModal
                    onClose={() => setShowAddProduct(false)}
                    onCreated={() => {
                        setShowAddProduct(false);
                        window.location.reload();
                    }}
                />
            )}
        </main>
    );
}

function AnalyticsCard({
    label,
    value,
    description,
    symbol,
}: {
    label: string;
    value: string;
    description: string;
    symbol: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-sm font-bold text-slate-700">
                    {symbol}
                </span>
            </div>

            <p className="mt-4 text-3xl font-bold tracking-tight text-slate-950">
                {value}
            </p>

            <p className="mt-2 text-xs leading-5 text-slate-500">
                {description}
            </p>
        </div>
    );
}
