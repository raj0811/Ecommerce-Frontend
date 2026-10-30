
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Shipment = {
    id?: number;
    awb?: string | null;
    courier?: string;
    sr_courier_name?: string;
    etd?: string;
    status?: number;
    shipped_date?: string | null;
    delivered_date?: string | null;
    weight?: string;
    dimensions?: string;
};

type Product = {
    id?: number;
    name?: string;
    channel_sku?: string;
    quantity?: number;
    price?: string | number;
    selling_price?: string | number;
};

type ShiprocketOrder = {
    id: number;
    channel_order_id?: string;
    channel_name?: string;
    customer_name?: string;
    customer_email?: string;
    customer_phone?: string;
    customer_address?: string;
    customer_address_2?: string;
    customer_city?: string;
    customer_state?: string;
    customer_pincode?: string;
    customer_country?: string;
    pickup_location?: string;
    payment_method?: string;
    payment_status?: string;
    total?: string | number;
    status?: string;
    status_code?: number;
    created_at?: string;
    updated_at?: string;
    shipments?: Shipment[];
    products?: Product[];
};

type ApiResponse = {
    data: ShiprocketOrder[];
    meta?: {
        pagination?: {
            total?: number;
            count?: number;
            per_page?: number;
            current_page?: number;
            total_pages?: number;
        };
    };
};

function money(value?: string | number) {
    const amount = Number(value ?? 0);

    return Number.isFinite(amount)
        ? new Intl.NumberFormat("en-IN", {
            style: "currency",
            currency: "INR",
            maximumFractionDigits: 2,
        }).format(amount)
        : "—";
}

function formatDate(value?: string) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return value;

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function statusClass(status?: string) {
    const value = status?.toUpperCase() ?? "";

    if (
        ["DELIVERED", "COMPLETED"].includes(value)
    ) {
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    }

    if (
        ["CANCELED", "CANCELLED", "FAILED", "LOST"].includes(value)
    ) {
        return "bg-red-50 text-red-700 ring-red-600/20";
    }

    if (
        ["SHIPPED", "IN TRANSIT", "OUT FOR DELIVERY", "PICKUP SCHEDULED"].includes(
            value
        )
    ) {
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
    }

    return "bg-amber-50 text-amber-700 ring-amber-600/20";
}

function Badge({ status }: { status?: string }) {
    return (
        <span
            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusClass(
                status
            )}`}
        >
            {(status || "UNKNOWN").replaceAll("_", " ")}
        </span>
    );
}

export default function ShiprocketOrdersPage() {
    const [orders, setOrders] = useState<ShiprocketOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");

    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(15);
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    const [selected, setSelected] = useState<ShiprocketOrder | null>(null);

    const fetchOrders = useCallback(async () => {
        if (!API_URL) {
            setError("NEXT_PUBLIC_API_URL is not configured.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                page: String(page),
                per_page: String(perPage),
                sort: "DESC",
                sort_by: "id",
            });

            if (search.trim()) {
                params.set("search", search.trim());
            }

            if (status) {
                params.set("filter_by", "status");
                params.set("filter", status);
            }

            const token =
                localStorage.getItem("adminAccessToken") ||
                localStorage.getItem("accessToken");

            const response = await fetch(
                `${API_URL}/ship-rocket/orders?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        ...(token
                            ? { Authorization: `Bearer ${token}` }
                            : {}),
                    },
                    cache: "no-store",
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result?.message || "Unable to fetch Shiprocket orders."
                );
            }

            if (!Array.isArray(result?.data)) {
                throw new Error("Unexpected Shiprocket API response.");
            }

            const payload = result as ApiResponse;

            setOrders(payload.data);
            setTotal(payload.meta?.pagination?.total ?? payload.data.length);
            setTotalPages(
                payload.meta?.pagination?.total_pages ??
                (payload.data.length < perPage ? page : page + 1)
            );
        } catch (err) {
            setOrders([]);
            setTotal(0);
            setTotalPages(0);
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }, [page, perPage, search, status]);

    useEffect(() => {
        void fetchOrders();
    }, [fetchOrders]);

    function submitSearch(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    }

    function clearFilters() {
        setSearchInput("");
        setSearch("");
        setStatus("");
        setPage(1);
    }

    const newCount = orders.filter(
        (order) => order.status?.toUpperCase() === "NEW"
    ).length;

    const cancelledCount = orders.filter((order) =>
        ["CANCELED", "CANCELLED"].includes(
            order.status?.toUpperCase() ?? ""
        )
    ).length;

    const shippedCount = orders.filter((order) =>
        ["SHIPPED", "IN TRANSIT", "OUT FOR DELIVERY"].includes(
            order.status?.toUpperCase() ?? ""
        )
    ).length;

    return (
        <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px] space-y-6">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm text-slate-500">
                            Admin / Shipping / Shiprocket
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                            Shiprocket Orders
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            View orders directly from your Shiprocket account.
                        </p>
                    </div>

                    <button
                        onClick={() => void fetchOrders()}
                        disabled={loading}
                        className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:bg-slate-100 disabled:opacity-50"
                    >
                        {loading ? "Loading..." : "↻ Refresh orders"}
                    </button>
                </header>

                <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="Total orders"
                        value={total.toLocaleString("en-IN")}
                        description="Orders matching current filters"
                    />
                    <SummaryCard
                        title="New orders"
                        value={String(newCount)}
                        description="On the current page"
                    />
                    <SummaryCard
                        title="In transit"
                        value={String(shippedCount)}
                        description="On the current page"
                    />
                    <SummaryCard
                        title="Cancelled"
                        value={String(cancelledCount)}
                        description="On the current page"
                    />
                </section>

                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <form onSubmit={submitSearch}>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-[1fr_220px_auto] md:items-end">
                            <div>
                                <label
                                    htmlFor="order-search"
                                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                    Search orders
                                </label>
                                <input
                                    id="order-search"
                                    value={searchInput}
                                    onChange={(event) => setSearchInput(event.target.value)}
                                    placeholder="Channel order ID, e.g. ORD-1793..."
                                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="order-status"
                                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                    Order status
                                </label>
                                <select
                                    id="order-status"
                                    value={status}
                                    onChange={(event) => {
                                        setStatus(event.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                                >
                                    <option value="">All statuses</option>
                                    <option value="NEW">New</option>
                                    <option value="PROCESSING">Processing</option>
                                    <option value="PICKUP SCHEDULED">Pickup scheduled</option>
                                    <option value="SHIPPED">Shipped</option>
                                    <option value="DELIVERED">Delivered</option>
                                    <option value="CANCELED">Canceled</option>
                                </select>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                                >
                                    Search
                                </button>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold hover:bg-slate-50"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>
                    </form>
                </section>

                {error && (
                    <div
                        role="alert"
                        className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <p className="font-semibold">Could not load Shiprocket orders</p>
                        <p className="mt-1">{error}</p>
                        <button
                            onClick={() => void fetchOrders()}
                            className="mt-2 font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-5">
                        <div>
                            <h2 className="font-semibold">Order list</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Order and shipment details returned by Shiprocket.
                            </p>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-500">
                            Rows per page
                            <select
                                value={perPage}
                                onChange={(event) => {
                                    setPerPage(Number(event.target.value));
                                    setPage(1);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2 py-2 text-sm text-slate-800"
                            >
                                <option value={10}>10</option>
                                <option value={15}>15</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                            </select>
                        </label>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1100px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Shiprocket ID</th>
                                    <th className="px-5 py-4 font-semibold">Channel order</th>
                                    <th className="px-5 py-4 font-semibold">Customer</th>
                                    <th className="px-5 py-4 font-semibold">Products</th>
                                    <th className="px-5 py-4 font-semibold">Total</th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                    <th className="px-5 py-4 font-semibold">Shipment</th>
                                    <th className="px-5 py-4 font-semibold">Created</th>
                                    <th className="px-5 py-4 text-right font-semibold">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading &&
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={index}>
                                            {Array.from({ length: 9 }).map((__, cell) => (
                                                <td key={cell} className="px-5 py-5">
                                                    <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && !error && orders.length === 0 && (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-16 text-center">
                                            <p className="font-semibold">No orders found</p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Try another search or status filter.
                                            </p>
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    orders.map((order) => {
                                        const shipment = order.shipments?.[0];
                                        const awb = shipment?.awb;

                                        return (
                                            <tr key={order.id} className="hover:bg-slate-50/80">
                                                <td className="px-5 py-4 font-semibold">
                                                    #{order.id}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-medium">
                                                        {order.channel_order_id || "—"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {order.channel_name || "—"}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-medium">
                                                        {order.customer_name || "—"}
                                                    </p>
                                                    <p className="mt-1 text-xs text-slate-500">
                                                        {[order.customer_city, order.customer_pincode]
                                                            .filter(Boolean)
                                                            .join(" · ") || "—"}
                                                    </p>
                                                </td>

                                                <td className="px-5 py-4">
                                                    <p className="font-medium">
                                                        {order.products?.length ?? 0} product(s)
                                                    </p>
                                                    <p className="mt-1 max-w-44 truncate text-xs text-slate-500">
                                                        {order.products
                                                            ?.map((product) => product.name)
                                                            .filter(Boolean)
                                                            .join(", ") || "—"}
                                                    </p>
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 font-semibold">
                                                    {money(order.total)}
                                                </td>

                                                <td className="px-5 py-4">
                                                    <Badge status={order.status} />
                                                </td>

                                                <td className="px-5 py-4">
                                                    {awb ? (
                                                        <>
                                                            <p className="font-medium">{awb}</p>
                                                            <p className="mt-1 text-xs text-slate-500">
                                                                {shipment?.sr_courier_name ||
                                                                    shipment?.courier ||
                                                                    "Courier not assigned"}
                                                            </p>
                                                        </>
                                                    ) : (
                                                        <span className="text-xs text-slate-400">
                                                            AWB not assigned
                                                        </span>
                                                    )}
                                                </td>

                                                <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                                                    {formatDate(order.created_at)}
                                                </td>

                                                <td className="px-5 py-4 text-right">
                                                    <button
                                                        onClick={() => setSelected(order)}
                                                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold hover:bg-white"
                                                    >
                                                        View
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex flex-col gap-3 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <p className="text-sm text-slate-500">
                            {total === 0
                                ? "No records"
                                : `Showing ${(page - 1) * perPage + 1}–${Math.min(
                                    (page - 1) * perPage + orders.length,
                                    total
                                )} of ${total.toLocaleString("en-IN")} orders`}
                        </p>

                        <div className="flex items-center gap-2">
                            <button
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((value) => value - 1)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="px-2 text-sm text-slate-600">
                                Page {page} of {totalPages}
                            </span>

                            <button
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage((value) => value + 1)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium hover:bg-slate-50 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {selected && (
                <OrderDetailsModal
                    order={selected}
                    onClose={() => setSelected(null)}
                />
            )}
        </main>
    );
}

function SummaryCard({
    title,
    value,
    description,
}: {
    title: string;
    value: string;
    description: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <p className="mt-3 text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
    );
}

function OrderDetailsModal({
    order,
    onClose,
}: {
    order: ShiprocketOrder;
    onClose: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="shiprocket-details-title"
                className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                            Shiprocket order #{order.id}
                        </p>
                        <h2
                            id="shiprocket-details-title"
                            className="mt-1 text-xl font-bold"
                        >
                            {order.channel_order_id || "Order details"}
                        </h2>
                        <div className="mt-3">
                            <Badge status={order.status} />
                        </div>
                    </div>

                    <button
                        onClick={onClose}
                        aria-label="Close"
                        className="rounded-lg p-2 text-xl text-slate-400 hover:bg-slate-100"
                    >
                        ×
                    </button>
                </div>

                <div className="space-y-6 p-5 sm:p-6">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Order total</p>
                            <p className="mt-1 text-2xl font-bold">{money(order.total)}</p>
                            <p className="mt-2 text-xs text-slate-500">
                                Payment: {order.payment_method || "—"}
                            </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                            <p className="text-sm text-slate-500">Shipment AWB</p>
                            <p className="mt-1 break-all text-lg font-bold">
                                {order.shipments?.[0]?.awb || "Not assigned"}
                            </p>
                            <p className="mt-2 text-xs text-slate-500">
                                Courier:{" "}
                                {order.shipments?.[0]?.sr_courier_name ||
                                    order.shipments?.[0]?.courier ||
                                    "Not assigned"}
                            </p>
                        </div>
                    </div>

                    <div>
                        <h3 className="mb-3 font-semibold">Customer details</h3>
                        <DetailRow label="Name" value={order.customer_name} />
                        <DetailRow label="Email" value={order.customer_email} />
                        <DetailRow label="Phone" value={order.customer_phone} />
                        <DetailRow
                            label="Address"
                            value={[
                                order.customer_address,
                                order.customer_address_2,
                                order.customer_city,
                                order.customer_state,
                                order.customer_pincode,
                                order.customer_country,
                            ]
                                .filter(Boolean)
                                .join(", ")}
                        />
                        <DetailRow label="Pickup location" value={order.pickup_location} />
                        <DetailRow label="Channel" value={order.channel_name} />
                        <DetailRow label="Payment status" value={order.payment_status} />
                        <DetailRow label="Created" value={formatDate(order.created_at)} />
                        <DetailRow label="Updated" value={formatDate(order.updated_at)} />
                    </div>

                    <div>
                        <h3 className="mb-3 font-semibold">
                            Products ({order.products?.length ?? 0})
                        </h3>

                        <div className="overflow-x-auto rounded-xl border border-slate-200">
                            <table className="w-full min-w-[480px] text-left text-sm">
                                <thead className="bg-slate-50 text-xs text-slate-500">
                                    <tr>
                                        <th className="px-4 py-3">Product</th>
                                        <th className="px-4 py-3">SKU</th>
                                        <th className="px-4 py-3">Qty</th>
                                        <th className="px-4 py-3">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {order.products?.map((product, index) => (
                                        <tr key={product.id ?? index}>
                                            <td className="px-4 py-3 font-medium">
                                                {product.name || "—"}
                                            </td>
                                            <td className="px-4 py-3 text-slate-500">
                                                {product.channel_sku || "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {product.quantity ?? "—"}
                                            </td>
                                            <td className="px-4 py-3">
                                                {money(product.price)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {order.shipments?.map((shipment, index) => (
                        <div key={shipment.id ?? index}>
                            <h3 className="mb-3 font-semibold">
                                Shipment {index + 1}
                            </h3>
                            <DetailRow label="AWB" value={shipment.awb} />
                            <DetailRow
                                label="Courier"
                                value={shipment.sr_courier_name || shipment.courier}
                            />
                            <DetailRow label="Estimated delivery" value={shipment.etd} />
                            <DetailRow label="Weight" value={shipment.weight ? `${shipment.weight} kg` : undefined} />
                            <DetailRow label="Dimensions" value={shipment.dimensions} />
                            <DetailRow
                                label="Shipped date"
                                value={formatDate(shipment.shipped_date ?? undefined)}
                            />
                            <DetailRow
                                label="Delivered date"
                                value={formatDate(shipment.delivered_date ?? undefined)}
                            />
                        </div>
                    ))}
                </div>

                <div className="border-t border-slate-100 p-5 text-right">
                    <button
                        onClick={onClose}
                        className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                    >
                        Close
                    </button>
                </div>
            </section>
        </div>
    );
}

function DetailRow({
    label,
    value,
}: {
    label: string;
    value?: string | number | null;
}) {
    return (
        <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:justify-between sm:gap-6">
            <span className="shrink-0 text-sm text-slate-500">{label}</span>
            <span className="break-words text-sm font-medium text-slate-800 sm:max-w-[70%] sm:text-right">
                {value === undefined || value === null || value === ""
                    ? "—"
                    : String(value)}
            </span>
        </div>
    );
}
