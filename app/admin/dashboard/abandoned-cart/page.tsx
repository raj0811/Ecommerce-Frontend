'use client';

import { useCallback, useEffect, useState } from 'react';

type CartItem = {
    _id?: string;
    productId?: string | { _id?: string; name?: string; title?: string; image?: string };
    name?: string;
    title?: string;
    image?: string;
    quantity?: number;
    price?: number;
    [key: string]: unknown;
};

type AbandonedCart = {
    cartId: string;
    user?: {
        userId?: string;
        name?: string;
        number?: string;
        email?: string;
    };
    items: CartItem[];
    updatedAt?: string;
    createdAt?: string;
};

type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
};

type ApiResponse = {
    data: AbandonedCart[];
    pagination: Pagination;
};

const PAGE_SIZE = 10;
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? '';

function getItemName(item: CartItem) {
    if (item.name) return item.name;
    if (item.title) return item.title;

    if (typeof item.productId === 'object' && item.productId) {
        return item.productId.name ?? item.productId.title ?? 'Product';
    }

    return 'Product';
}

function getItemImage(item: CartItem) {
    if (item.image) return item.image;

    if (typeof item.productId === 'object' && item.productId) {
        return item.productId.image;
    }

    return undefined;
}

function formatDate(value?: string) {
    if (!value) return '—';

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';

    return new Intl.DateTimeFormat(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(date);
}

function formatPrice(value?: number) {
    if (typeof value !== 'number' || !Number.isFinite(value)) return '—';

    return new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 2,
    }).format(value);
}

export default function AbandonedCartsPage() {
    const [carts, setCarts] = useState<AbandonedCart[]>([]);
    const [pagination, setPagination] = useState<Pagination>({
        page: 1,
        limit: PAGE_SIZE,
        total: 0,
        totalPages: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const loadCarts = useCallback(async (page: number) => {
        setLoading(true);
        setError('');

        try {
            const token =
                localStorage.getItem('adminAccessToken')
            const response = await fetch(
                `${API_BASE_URL}/cart/abandoned?page=${page}&limit=${PAGE_SIZE}`,
                {
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
                    cache: 'no-store',
                },
            );

            if (!response.ok) {
                throw new Error(`Could not load abandoned carts (${response.status}).`);
            }

            const result = await response.json();

            if (Array.isArray(result)) {
                // Supports a bare array, including an empty response: []
                setCarts(result);
                setPagination({
                    page,
                    limit: PAGE_SIZE,
                    total: result.length,
                    totalPages: Math.ceil(result.length / PAGE_SIZE),
                });
            } else if (Array.isArray(result?.data) && result?.pagination) {
                // Supports the paginated response: { data, pagination }
                setCarts(result.data);
                setPagination(result.pagination);
            } else {
                throw new Error('The abandoned carts response has an unexpected format.');
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Something went wrong.');
            setCarts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCarts(pagination.page);
    }, [loadCarts, pagination.page]);

    const goToPage = (page: number) => {
        if (page < 1 || page > pagination.totalPages || page === pagination.page) return;
        setPagination((current) => ({ ...current, page }));
    };

    return (
        <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-900 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-7xl">
                <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">
                            Admin
                        </p>
                        <h1 className="mt-2 text-3xl font-bold tracking-tight">Abandoned carts</h1>
                        <p className="mt-2 text-sm text-slate-600">
                            Customers with items remaining in their carts.
                        </p>
                    </div>

                    <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
                        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                            Total carts
                        </p>
                        <p className="mt-1 text-2xl font-semibold">
                            {loading ? '…' : pagination.total.toLocaleString()}
                        </p>
                    </div>
                </header>

                {error && (
                    <div
                        role="alert"
                        className="mb-6 flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800 sm:flex-row sm:items-center sm:justify-between"
                    >
                        <span>{error}</span>
                        <button
                            onClick={() => void loadCarts(pagination.page)}
                            className="w-fit rounded-lg border border-red-300 px-3 py-2 font-medium hover:bg-red-100"
                        >
                            Try again
                        </button>
                    </div>
                )}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                        <h2 className="font-semibold">Customers and cart items</h2>
                        <span className="text-sm text-slate-500">
                            {loading
                                ? 'Loading…'
                                : pagination.total === 0
                                    ? 'No carts'
                                    : `${(pagination.page - 1) * pagination.limit + 1}–${Math.min(
                                        pagination.page * pagination.limit,
                                        pagination.total,
                                    )} of ${pagination.total}`}
                        </span>
                    </div>

                    {loading ? (
                        <div className="space-y-4 p-5" aria-label="Loading carts">
                            {Array.from({ length: 4 }).map((_, index) => (
                                <div
                                    key={index}
                                    className="h-28 animate-pulse rounded-xl bg-slate-100"
                                />
                            ))}
                        </div>
                    ) : carts.length === 0 ? (
                        <div className="px-6 py-16 text-center">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-xl">
                                🛒
                            </div>
                            <h3 className="mt-4 font-semibold">No abandoned carts found</h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Carts with items will appear here.
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-200">
                            {carts.map((cart) => (
                                <article key={cart.cartId} className="p-5">
                                    <div className="grid gap-5 lg:grid-cols-[minmax(220px,0.8fr)_minmax(0,1.5fr)_180px]">
                                        <div className="min-w-0">
                                            <p className="truncate font-semibold">
                                                {cart.user?.name || 'Unknown customer'}
                                            </p>
                                            <p className="mt-2 break-all text-sm text-slate-600">
                                                {cart.user?.email || 'No email provided'}
                                            </p>
                                            <p className="mt-1 text-sm text-slate-600">
                                                {cart.user?.number || 'No phone provided'}
                                            </p>
                                            <p className="mt-3 text-xs text-slate-400">
                                                Cart ID: {cart.cartId}
                                            </p>
                                        </div>

                                        <div className="space-y-3">
                                            {(cart.items ?? []).map((item, index) => {
                                                const name = getItemName(item);
                                                const image = getItemImage(item);
                                                const quantity =
                                                    typeof item.quantity === 'number' ? item.quantity : 1;

                                                return (
                                                    <div
                                                        key={item._id ?? `${cart.cartId}-${index}`}
                                                        className="flex items-center gap-3"
                                                    >
                                                        {image ? (
                                                            // eslint-disable-next-line @next/next/no-img-element
                                                            <img
                                                                src={image}
                                                                alt=""
                                                                className="h-12 w-12 rounded-lg border border-slate-200 object-cover"
                                                            />
                                                        ) : (
                                                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                                                                <span aria-hidden="true">□</span>
                                                            </div>
                                                        )}
                                                        <div className="min-w-0 flex-1">
                                                            <p className="truncate text-sm font-medium">{name}</p>
                                                            <p className="text-xs text-slate-500">
                                                                Qty: {quantity}
                                                            </p>
                                                        </div>
                                                        <p className="whitespace-nowrap text-sm font-medium">
                                                            {formatPrice(item.price)}
                                                        </p>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div className="text-sm lg:text-right">
                                            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                                                Last activity
                                            </p>
                                            <p className="mt-1 font-medium">{formatDate(cart.updatedAt)}</p>
                                            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
                                                Created
                                            </p>
                                            <p className="mt-1 text-slate-600">{formatDate(cart.createdAt)}</p>
                                        </div>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <nav
                    aria-label="Cart pages"
                    className="mt-5 flex items-center justify-between gap-3"
                >
                    <button
                        onClick={() => goToPage(pagination.page - 1)}
                        disabled={loading || pagination.page <= 1}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Previous
                    </button>
                    <span className="text-sm text-slate-600">
                        Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
                    </span>
                    <button
                        onClick={() => goToPage(pagination.page + 1)}
                        disabled={loading || pagination.page >= pagination.totalPages}
                        className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        Next
                    </button>
                </nav>
            </div>
        </main>
    );
}