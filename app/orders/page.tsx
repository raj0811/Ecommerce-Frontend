"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type Order = {
    _id: string;
    orderNumber?: string;
    total: number;
    subtotal?: number;
    discount?: number;
    status: string;
    paymentStatus: string;
    createdAt?: string;
    items?: Array<{
        productId: string;
        name: string;
        image?: string;
        price: number;
        quantity: number;
    }>;
};

type OrdersResponse = {
    data: Order[];
    pagination: {
        totalOrders: number;
        currentPage: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPreviousPage: boolean;
    };
};

export default function MyOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        async function fetchOrders() {
            setLoading(true);
            setError("");

            try {
                if (!API_URL) {
                    throw new Error("API URL is not configured.");
                }

                const token = localStorage.getItem("accessToken")?.trim();
                const guestId = localStorage.getItem("guestId");

                let url: string;
                const headers: HeadersInit = {
                    "Content-Type": "application/json",
                };

                if (token) {
                    // Logged-in user
                    url = `${API_URL}/orders/my-orders?page=${page}&limit=10`;
                    headers.Authorization = `Bearer ${token}`;
                } else if (guestId) {
                    // Guest user
                    url = `${API_URL}/orders/guest/${encodeURIComponent(
                        guestId
                    )}?page=${page}&limit=10`;
                } else {
                    setOrders([]);
                    setTotalPages(1);
                    setError(
                        "No user session found. Please log in or place an order first."
                    );
                    return;
                }

                const response = await fetch(url, { headers });
                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to load orders."
                    );
                }

                if (!cancelled) {
                    setOrders(result.data ?? []);
                    setTotalPages(result.pagination?.totalPages ?? 1);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Something went wrong."
                    );
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchOrders();

        return () => {
            cancelled = true;
        };
    }, [page]);

    const formatPrice = (amount: number) =>
        `₹${Number(amount || 0).toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;

    const formatDate = (date?: string) =>
        date
            ? new Date(date).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
            })
            : "Date unavailable";

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900">
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
                    <Link href="/" className="text-xl font-bold">
                        Alpha Male
                    </Link>
                    <Link href="/" className="text-sm text-blue-700 hover:underline">
                        Continue shopping
                    </Link>
                </div>
            </header>

            <section className="mx-auto max-w-5xl px-5 py-10">
                <h1 className="text-2xl font-bold">My Orders</h1>
                <p className="mt-2 text-sm text-gray-500">
                    View your orders, payment details, and delivery information.
                </p>

                {loading && (
                    <div className="py-16 text-center text-gray-500">
                        Loading your orders...
                    </div>
                )}

                {!loading && error && (
                    <div className="mt-8 rounded-xl border border-red-200 bg-white p-6">
                        <p className="text-sm text-red-700">{error}</p>
                        <button
                            onClick={() => setPage((current) => current)}
                            className="mt-4 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {!loading && !error && orders.length === 0 && (
                    <div className="mt-8 rounded-xl border bg-white p-10 text-center">
                        <h2 className="text-lg font-semibold">No orders yet</h2>
                        <p className="mt-2 text-sm text-gray-500">
                            Your orders will appear here after you place one.
                        </p>
                        <Link
                            href="/"
                            className="mt-6 inline-block rounded-lg bg-blue-700 px-5 py-3 text-sm font-semibold text-white"
                        >
                            Start Shopping
                        </Link>
                    </div>
                )}

                {!loading && !error && orders.length > 0 && (
                    <>
                        <div className="mt-8 space-y-4">
                            {orders.map((order) => (
                                <article
                                    key={order._id}
                                    className="rounded-xl border border-gray-200 bg-white p-5"
                                >
                                    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                                        <div>
                                            <p className="font-semibold">
                                                Order #{order.orderNumber || order._id}
                                            </p>
                                            <p className="mt-1 text-sm text-gray-500">
                                                Placed on {formatDate(order.createdAt)}
                                            </p>
                                        </div>

                                        <div className="flex flex-wrap gap-2 text-xs font-medium">
                                            <span className="rounded-full bg-blue-50 px-3 py-1 text-blue-700">
                                                {order.status}
                                            </span>
                                            <span
                                                className={`rounded-full px-3 py-1 ${order.paymentStatus === "PAID"
                                                    ? "bg-green-50 text-green-700"
                                                    : order.paymentStatus === "FAILED"
                                                        ? "bg-red-50 text-red-700"
                                                        : "bg-amber-50 text-amber-700"
                                                    }`}
                                            >
                                                Payment: {order.paymentStatus}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex flex-col justify-between gap-4 border-t pt-4 sm:flex-row sm:items-center">
                                        <div>
                                            <p className="text-sm text-gray-500">
                                                {order.items?.length ?? 0} product types
                                            </p>
                                            <p className="mt-1 text-lg font-bold">
                                                {formatPrice(order.total)}
                                            </p>
                                        </div>

                                        <Link
                                            href={`/orders/${encodeURIComponent(order._id)}`}
                                            className="inline-flex justify-center rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
                                        >
                                            View Details
                                        </Link>
                                    </div>
                                </article>
                            ))}
                        </div>

                        <div className="mt-6 flex items-center justify-between">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((current) => current - 1)}
                                className="rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="text-sm text-gray-500">
                                Page {page} of {Math.max(totalPages, 1)}
                            </span>

                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((current) => current + 1)}
                                className="rounded-lg border bg-white px-4 py-2 text-sm disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </>
                )}
            </section>
        </main>
    );
}