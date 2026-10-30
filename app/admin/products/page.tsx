
"use client";

import { useCallback, useEffect, useState, FormEvent } from "react";
import Link from "next/link";
import AddProductModal from "../dashboard/modals/AddProductModal";
import EditProductModal, {
    type EditProductForm,
} from "./Components/EditProductModal";

import DeleteProductModal from "./Components/DeleteProductModal"
import { Pencil, Trash2 } from "lucide-react";
const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Product {
    _id: string;
    name: string;
    sku: string;
    description: string;
    price: number;
    compareAtPrice?: number | null;
    images: string[];
    category: string;
    stock: number;
    isActive: boolean;
    isFeatured: boolean;
    createdAt: string;
}

interface Pagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [category, setCategory] = useState("");
    const [minPrice, setMinPrice] = useState("");
    const [maxPrice, setMaxPrice] = useState("");
    const [inStock, setInStock] = useState(false);
    const [page, setPage] = useState(1);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAddProduct, setShowAddProduct] = useState(false);

    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);

    const [editForm, setEditForm] = useState<EditProductForm>({
        name: "",
        sku: "",
        description: "",
        price: "",
        compareAtPrice: "",
        category: "",
        stock: "",
        isActive: true,
        isFeatured: false,
    });

    const [editLoading, setEditLoading] = useState(false);
    const [editError, setEditError] = useState("");

    const [deleteConfirmation, setDeleteConfirmation] = useState("");
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState("");

    const fetchProducts = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            if (!API_URL) {
                throw new Error("API URL is not configured.");
            }

            const token =
                typeof window !== "undefined"
                    ? localStorage.getItem("adminAccessToken")
                    : null;

            const params = new URLSearchParams({
                page: String(page),
                limit: String(pagination.limit),
            });

            if (search.trim()) params.set("search", search.trim());
            if (category.trim()) params.set("category", category.trim());
            if (minPrice !== "") params.set("minPrice", minPrice);
            if (maxPrice !== "") params.set("maxPrice", maxPrice);
            if (inStock) params.set("inStock", "true");

            const response = await fetch(
                `${API_URL}/product/admin/fetch-all-product?${params.toString()}`,
                {
                    headers: token
                        ? { Authorization: `Bearer ${token}` }
                        : {},
                    cache: "no-store",
                },
            );

            if (!response.ok) {
                throw new Error(
                    `Failed to load products (${response.status}).`,
                );
            }

            const result = await response.json();

            setProducts(result.products ?? []);
            setPagination((previous) => ({
                ...previous,
                ...(result.pagination ?? {}),
            }));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong while loading products.",
            );
        } finally {
            setLoading(false);
        }
    }, [
        page,
        pagination.limit,
        search,
        category,
        minPrice,
        maxPrice,
        inStock,
    ]);

    useEffect(() => {
        fetchProducts();
    }, [fetchProducts]);

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput);
    };

    const clearFilters = () => {
        setSearchInput("");
        setSearch("");
        setCategory("");
        setMinPrice("");
        setMaxPrice("");
        setInStock(false);
        setPage(1);
    };

    const formatPrice = (price: number) =>
        new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 0,
        }).format(price);

    const formatDate = (date: string) =>
        new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });


    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setEditError("");

        setEditForm({
            name: product.name || "",
            sku: product.sku || "",
            description: product.description || "",
            price: String(product.price ?? ""),
            compareAtPrice:
                product.compareAtPrice != null
                    ? String(product.compareAtPrice)
                    : "",
            category: product.category || "",
            stock: String(product.stock ?? 0),
            isActive: product.isActive,
            isFeatured: product.isFeatured,
        });
    };

    const handleEditSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!editingProduct) return;

        setEditLoading(true);
        setEditError("");

        try {
            const token = localStorage.getItem("adminAccessToken");

            const response = await fetch(
                `${API_URL}/product/${editingProduct._id}`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        name: editForm.name,
                        sku: editForm.sku,
                        description: editForm.description,
                        price: Number(editForm.price),
                        compareAtPrice:
                            editForm.compareAtPrice.trim() === ""
                                ? null
                                : Number(editForm.compareAtPrice),
                        category: editForm.category,
                        stock: Number(editForm.stock),
                        isActive: editForm.isActive,
                        isFeatured: editForm.isFeatured,
                    }),
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || "Failed to update product");
            }

            setEditingProduct(null);
            await fetchProducts();
        } catch (error) {
            setEditError(
                error instanceof Error ? error.message : "Something went wrong"
            );
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteProduct = async () => {
        if (!deletingProduct) return;
        if (deleteConfirmation !== "delete") return;

        setDeleteLoading(true);
        setDeleteError("");

        try {
            const token = localStorage.getItem("adminAccessToken");

            const response = await fetch(
                `${API_URL}/product/${deletingProduct._id}`,
                {
                    method: "DELETE",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                }
            );

            if (!response.ok) {
                const data = await response.json().catch(() => ({}));
                throw new Error(data.message || "Failed to delete product");
            }

            setDeletingProduct(null);
            setDeleteConfirmation("");
            await fetchProducts();
        } catch (error) {
            setDeleteError(
                error instanceof Error ? error.message : "Something went wrong"
            );
        } finally {
            setDeleteLoading(false);
        }
    };


    return (
        <main className="min-h-screen bg-slate-100">
            {/* Header */}
            <header className="border-b border-slate-200 bg-white">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
                    <div>
                        <Link
                            href="/admin/dashboard"
                            className="text-xl font-bold text-slate-900"
                        >
                            Alpha Male
                        </Link>
                        <p className="mt-1 text-xs uppercase tracking-wide text-slate-500">
                            Admin / Products
                        </p>
                    </div>

                    <Link
                        href="/admin/dashboard"
                        className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Page title */}
                <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Products
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage your product catalogue and inventory.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAddProduct(true)}
                        className="rounded-lg bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                    >
                        + Add Product
                    </button>
                </div>

                {/* Summary */}
                <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Matching products
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {pagination.total}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Current page
                        </p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {pagination.totalPages
                                ? `${pagination.page} / ${pagination.totalPages}`
                                : "0 / 0"}
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                        <p className="text-sm text-slate-500">
                            Products per page
                        </p>
                        <select
                            value={pagination.limit}
                            onChange={(event) => {
                                setPagination((previous) => ({
                                    ...previous,
                                    limit: Number(event.target.value),
                                }));
                                setPage(1);
                            }}
                            className="mt-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-slate-500"
                        >
                            <option value={10}>10</option>
                            <option value={12}>12</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                            <option value={100}>100</option>
                        </select>
                    </div>
                </div>

                {/* Search and filters */}
                <form
                    onSubmit={handleSearch}
                    className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5"
                >
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="sm:col-span-2">
                            <label
                                htmlFor="product-search"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Search products
                            </label>
                            <input
                                id="product-search"
                                value={searchInput}
                                onChange={(event) =>
                                    setSearchInput(event.target.value)
                                }
                                placeholder="Search name, SKU or description"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="category"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Category
                            </label>
                            <input
                                id="category"
                                value={category}
                                onChange={(event) => {
                                    setCategory(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="e.g. clothing"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            />
                        </div>

                        <div className="flex items-end">
                            <label className="flex cursor-pointer items-center gap-2 pb-3 text-sm text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={inStock}
                                    onChange={(event) => {
                                        setInStock(event.target.checked);
                                        setPage(1);
                                    }}
                                    className="h-4 w-4 rounded border-slate-300"
                                />
                                In-stock products only
                            </label>
                        </div>

                        <div>
                            <label
                                htmlFor="min-price"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Minimum price (₹)
                            </label>
                            <input
                                id="min-price"
                                type="number"
                                min="0"
                                value={minPrice}
                                onChange={(event) => {
                                    setMinPrice(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="Min price"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="max-price"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Maximum price (₹)
                            </label>
                            <input
                                id="max-price"
                                type="number"
                                min="0"
                                value={maxPrice}
                                onChange={(event) => {
                                    setMaxPrice(event.target.value);
                                    setPage(1);
                                }}
                                placeholder="Max price"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            />
                        </div>

                        <div className="flex flex-wrap items-end gap-2 sm:col-span-2">
                            <button
                                type="submit"
                                className="rounded-lg bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"
                            >
                                Search
                            </button>

                            <button
                                type="button"
                                onClick={clearFilters}
                                className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                            >
                                Clear filters
                            </button>
                        </div>
                    </div>
                </form>

                {/* Product list */}
                <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <div>
                            <h2 className="font-semibold text-slate-900">
                                All Products
                            </h2>
                            <p className="mt-1 text-sm text-slate-500">
                                {pagination.total} matching products
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={fetchProducts}
                            disabled={loading}
                            className="rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Refresh
                        </button>
                    </div>

                    {error && (
                        <div className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left">
                            <thead className="bg-slate-50">
                                <tr className="text-xs uppercase tracking-wide text-slate-500">
                                    <th className="px-5 py-4 font-semibold">Product</th>
                                    <th className="px-5 py-4 font-semibold">SKU</th>
                                    <th className="px-5 py-4 font-semibold">Category</th>
                                    <th className="px-5 py-4 font-semibold">Price</th>
                                    <th className="px-5 py-4 font-semibold">Stock</th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                    <th className="px-5 py-4 font-semibold">Added</th>
                                    <th className="px-5 py-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="px-5 py-16 text-center text-sm text-slate-500"
                                        >
                                            Loading products...
                                        </td>
                                    </tr>
                                ) : products.length === 0 ? (
                                    <tr>
                                        <td colSpan={8} className="px-5 py-16 text-center">
                                            <p className="font-semibold text-slate-800">
                                                No products found
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Try changing your search or filters.
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    products.map((product) => (
                                        <tr
                                            key={product._id}
                                            className="transition hover:bg-slate-50"
                                        >
                                            {/* Product */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-slate-200 bg-slate-100">
                                                        {product.images?.[0] ? (
                                                            <img
                                                                src={product.images[0]}
                                                                alt={product.name}
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-full items-center justify-center text-xs text-slate-400">
                                                                No image
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="max-w-[220px]">
                                                        <p className="truncate text-sm font-semibold text-slate-900">
                                                            {product.name}
                                                        </p>

                                                        {product.isFeatured && (
                                                            <span className="mt-1 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-700">
                                                                Featured
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* SKU */}
                                            <td className="px-5 py-4 text-sm text-slate-600">
                                                {product.sku}
                                            </td>

                                            {/* Category */}
                                            <td className="px-5 py-4 text-sm capitalize text-slate-600">
                                                {product.category}
                                            </td>

                                            {/* Price */}
                                            <td className="px-5 py-4 text-sm font-semibold text-slate-900">
                                                {formatPrice(product.price)}

                                                {product.compareAtPrice != null &&
                                                    product.compareAtPrice > product.price && (
                                                        <p className="mt-1 text-xs font-normal text-slate-400 line-through">
                                                            {formatPrice(product.compareAtPrice)}
                                                        </p>
                                                    )}
                                            </td>

                                            {/* Stock */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`text-sm font-medium ${product.stock === 0
                                                        ? "text-red-600"
                                                        : product.stock <= 5
                                                            ? "text-amber-600"
                                                            : "text-slate-700"
                                                        }`}
                                                >
                                                    {product.stock}
                                                </span>
                                            </td>

                                            {/* Status */}
                                            <td className="px-5 py-4">
                                                <span
                                                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${product.isActive
                                                        ? "bg-emerald-50 text-emerald-700"
                                                        : "bg-slate-100 text-slate-600"
                                                        }`}
                                                >
                                                    {product.isActive ? "Active" : "Inactive"}
                                                </span>
                                            </td>

                                            {/* Added */}
                                            <td className="whitespace-nowrap px-5 py-4 text-sm text-slate-500">
                                                {product.createdAt
                                                    ? formatDate(product.createdAt)
                                                    : "—"}
                                            </td>

                                            {/* Actions */}
                                            <td className="px-5 py-4">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => openEditModal(product)}
                                                        title="Edit product"
                                                        aria-label={`Edit ${product.name}`}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                                                    >
                                                        <Pencil size={16} />
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeletingProduct(product);
                                                            setDeleteConfirmation("");
                                                            setDeleteError("");
                                                        }}
                                                        title="Delete product"
                                                        aria-label={`Delete ${product.name}`}
                                                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <p className="text-sm text-slate-500">
                            {pagination.total === 0
                                ? "Showing 0 products"
                                : `Showing ${(pagination.page - 1) * pagination.limit + 1
                                }–${Math.min(
                                    pagination.page * pagination.limit,
                                    pagination.total,
                                )} of ${pagination.total} products`}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                disabled={loading || page <= 1}
                                onClick={() =>
                                    setPage((previous) => previous - 1)
                                }
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="px-2 text-sm text-slate-600">
                                {pagination.totalPages > 0 ? page : 0} /{" "}
                                {pagination.totalPages}
                            </span>

                            <button
                                type="button"
                                disabled={
                                    loading ||
                                    page >= pagination.totalPages
                                }
                                onClick={() =>
                                    setPage((previous) => previous + 1)
                                }
                                className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Add product modal */}
            {showAddProduct && (
                <AddProductModal
                    onClose={() => setShowAddProduct(false)}
                    onCreated={() => {
                        setShowAddProduct(false);
                        fetchProducts();
                    }}
                />
            )}


            {/* Edit Product Modal */}
            {editingProduct && (
                <EditProductModal
                    productName={editingProduct.name}
                    form={editForm}
                    setForm={setEditForm}
                    loading={editLoading}
                    error={editError}
                    onClose={() => {
                        setEditingProduct(null);
                        setEditError("");
                    }}
                    onSubmit={handleEditSubmit}
                />
            )}

            {/* Delete Product Modal */}
            {deletingProduct && (
                <DeleteProductModal
                    productName={deletingProduct.name}
                    stock={deletingProduct.stock}
                    confirmation={deleteConfirmation}
                    setConfirmation={setDeleteConfirmation}
                    loading={deleteLoading}
                    error={deleteError}
                    onClose={() => {
                        setDeletingProduct(null);
                        setDeleteConfirmation("");
                        setDeleteError("");
                    }}
                    onConfirm={handleDeleteProduct}
                />
            )}

        </main>
    );
}
