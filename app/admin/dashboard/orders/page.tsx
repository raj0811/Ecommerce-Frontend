
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const STATUSES = [
    "PENDING",
    "CONFIRMED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "CANCELLATION_REQUESTED",
    "RETURN_REQUESTED",
    "RETURN_INITIATED",
    "RETURNED",
    "COD_INITIATED",
    "REFUND_INITIATED",
] as const;

type OrderStatus = (typeof STATUSES)[number];

type Order = {
    _id: string;
    orderNumber: string;
    status: OrderStatus;
    paymentMethod: string;
    paymentStatus: string;
    subtotal: number;
    discount: number;
    shippingCharge: number;
    total: number;
    trackingNumber?: string | null;
    createdAt?: string;
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone: string;
    };
    shippingAddress: {
        address: string;
        apartment?: string;
        city: string;
        state: string;
        pincode: string;
        country?: string;
    };
    items: {
        name: string;
        sku?: string;
        image?: string;
        price: number;
        quantity: number;
        lineTotal: number;
    }[];
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

const currency = (amount: number) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
    }).format(amount ?? 0);

const statusStyle: Record<OrderStatus, string> = {
    PENDING: "bg-amber-100 text-amber-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    PROCESSING: "bg-indigo-100 text-indigo-800",
    SHIPPED: "bg-violet-100 text-violet-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    CANCELLATION_REQUESTED: "bg-orange-100 text-orange-800",
    RETURN_REQUESTED: "bg-orange-100 text-orange-800",
    RETURN_INITIATED: "bg-purple-100 text-purple-800",
    RETURNED: "bg-gray-200 text-gray-800",
    COD_INITIATED: "bg-yellow-100 text-yellow-800",
    REFUND_INITIATED: "bg-emerald-100 text-emerald-800",
};

export default function AdminOrdersPage() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalOrders, setTotalOrders] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [newStatus, setNewStatus] = useState<OrderStatus>("PENDING");
    const [trackingNumber, setTrackingNumber] = useState("");
    const [saving, setSaving] = useState(false);

    const [selectedOrderIds, setSelectedOrderIds] = useState<string[]>([]);
    const [showRefundDialog, setShowRefundDialog] = useState(false);
    const [refundAmount, setRefundAmount] = useState("");
    const [refundEntireAmount, setRefundEntireAmount] = useState(false);

    const selectedOrders = orders.filter((order) =>
        selectedOrderIds.includes(order._id)
    );

    const toggleOrderSelection = (orderId: string) => {
        setSelectedOrderIds((current) =>
            current.includes(orderId)
                ? current.filter((id) => id !== orderId)
                : [...current, orderId]
        );
    };

    const togglePageSelection = () => {
        const pageIds = orders.map((order) => order._id);
        const allSelected =
            pageIds.length > 0 &&
            pageIds.every((id) => selectedOrderIds.includes(id));

        setSelectedOrderIds((current) =>
            allSelected
                ? current.filter((id) => !pageIds.includes(id))
                : Array.from(new Set([...current, ...pageIds]))
        );
    };

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
            });

            if (statusFilter !== "ALL") {
                params.set("status", statusFilter);
            }

            const token = localStorage.getItem("adminAccessToken");
            const response = await fetch(
                `${API_URL}/orders/admin?${params.toString()}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                }
            );

            if (!response.ok) {
                throw new Error(
                    response.status === 401 || response.status === 403
                        ? "You are not authorized to view admin orders."
                        : "Failed to load orders."
                );
            }

            const result: OrdersResponse = await response.json();

            setOrders(result.data ?? []);
            setTotalOrders(result.pagination?.totalOrders ?? 0);
            setTotalPages(Math.max(result.pagination?.totalPages ?? 1, 1));
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }, [page, statusFilter]);

    useEffect(() => {
        void loadOrders();
    }, [loadOrders]);

    const openOrder = (order: Order) => {
        setSelectedOrder(order);
        setNewStatus(order.status);
        setTrackingNumber(order.trackingNumber ?? "");
        setNotice("");
    };

    const updateStatus = async () => {
        if (!selectedOrder) return;

        setSaving(true);
        setError("");
        setNotice("");

        try {
            const token = localStorage.getItem("adminAccessToken");
            const response = await fetch(
                `${API_URL}/orders/admin/${selectedOrder._id}/status`,
                {
                    method: "PATCH",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                        status: newStatus,
                        trackingNumber: trackingNumber.trim() || undefined,
                        ...(newStatus === "REFUND_INITIATED" && {
                            refundAmount: Number(refundAmount),
                        }),
                    }),
                }
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    result.message ?? "Failed to update order status."
                );
            }

            setNotice("Order status updated successfully.");
            setSelectedOrder(null);
            await loadOrders();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Could not update order."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-medium text-gray-500">
                            Admin dashboard
                        </p>
                        <h1 className="mt-1 text-3xl font-bold">Orders</h1>
                        <p className="mt-2 text-sm text-gray-500">
                            Manage customer orders, fulfillment and tracking.
                        </p>
                    </div>

                    <button
                        onClick={() => void loadOrders()}
                        disabled={loading}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-gray-100 disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "Refresh orders"}
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <StatCard label="Total orders" value={totalOrders} />
                    <StatCard
                        label="Showing"
                        value={orders.length}
                    />
                    <StatCard label="Current page" value={`${page} / ${totalPages}`} />
                </div>

                <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                    <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
                        <h2 className="text-lg font-semibold">All orders</h2>

                        <select
                            value={statusFilter}
                            onChange={(event) => {
                                setStatusFilter(event.target.value);
                                setPage(1);
                            }}
                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-black"
                        >
                            <option value="ALL">All statuses</option>
                            {STATUSES.map((status) => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                    </div>

                    {notice && (
                        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
                            {notice}
                        </p>
                    )}

                    {error && (
                        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    {loading ? (
                        <div className="py-16 text-center text-sm text-gray-500">
                            Loading orders...
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="font-medium">No orders found</p>
                            <p className="mt-1 text-sm text-gray-500">
                                Try another status filter or refresh the list.
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="mt-4 flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    disabled={selectedOrders.length === 0}
                                    onClick={() => printBulkInvoices(selectedOrders)}
                                    className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
                                >
                                    Print Invoices ({selectedOrders.length})
                                </button>

                                <button
                                    type="button"
                                    disabled={selectedOrders.length === 0}
                                    onClick={() => printPicklist(selectedOrders)}
                                    className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-40"
                                >
                                    Print Picklist
                                </button>

                                <button
                                    type="button"
                                    disabled={selectedOrders.length === 0}
                                    onClick={() => {
                                        selectedOrders.forEach((order, index) => {
                                            if (index === 0) printShippingLabel(order);
                                        });
                                        if (selectedOrders.length > 1) {
                                            setNotice("Printed the first selected shipping label. Select other orders individually to print their labels.");
                                        }
                                    }}
                                    className="rounded-lg border px-4 py-2 text-sm font-semibold disabled:opacity-40"
                                >
                                    Print First Shipping Label
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setSelectedOrderIds([])}
                                    disabled={selectedOrderIds.length === 0}
                                    className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
                                >
                                    Clear Selection
                                </button>
                            </div>
                            <div className="mt-5 overflow-x-auto">
                                <table className="w-full min-w-[850px] text-left text-sm">
                                    <thead className="border-y border-gray-200 bg-gray-50 text-xs uppercase text-gray-500">
                                        <tr>
                                            <th className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    aria-label="Select all orders on this page"
                                                    checked={
                                                        orders.length > 0 &&
                                                        orders.every((order) => selectedOrderIds.includes(order._id))
                                                    }
                                                    onChange={togglePageSelection}
                                                />
                                            </th>
                                            <th className="px-4 py-3">Order</th>
                                            <th className="px-4 py-3">Customer</th>
                                            <th className="px-4 py-3">Date</th>
                                            <th className="px-4 py-3">Payment</th>
                                            <th className="px-4 py-3">Total</th>
                                            <th className="px-4 py-3">Status</th>
                                            <th className="px-4 py-3">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {orders.map((order) => (
                                            <tr key={order._id} className="hover:bg-gray-50">
                                                <td className="px-4 py-4">
                                                    <input
                                                        type="checkbox"
                                                        aria-label={`Select order ${order.orderNumber}`}
                                                        checked={selectedOrderIds.includes(order._id)}
                                                        onChange={() => toggleOrderSelection(order._id)}
                                                    />
                                                </td>
                                                <td className="px-4 py-4 font-semibold">
                                                    {order.orderNumber}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p className="font-medium">
                                                        {order.customer?.firstName}{" "}
                                                        {order.customer?.lastName}
                                                    </p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {order.customer?.phone}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 text-gray-600">
                                                    {order.createdAt
                                                        ? new Date(order.createdAt).toLocaleDateString(
                                                            "en-IN"
                                                        )
                                                        : "—"}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <p>{order.paymentMethod}</p>
                                                    <p className="mt-1 text-xs text-gray-500">
                                                        {order.paymentStatus}
                                                    </p>
                                                </td>
                                                <td className="px-4 py-4 font-semibold">
                                                    {currency(order.total)}
                                                </td>
                                                <td className="px-4 py-4">
                                                    <StatusBadge status={order.status} />
                                                </td>
                                                <td className="px-4 py-4">
                                                    <button
                                                        onClick={() => openOrder(order)}
                                                        className="rounded-lg border border-gray-300 px-3 py-2 text-xs font-semibold hover:bg-gray-100"
                                                    >
                                                        Manage
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="mt-5 flex flex-col justify-between gap-3 border-t border-gray-100 pt-4 sm:flex-row sm:items-center">
                                <p className="text-sm text-gray-500">
                                    Page {page} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPage((current) => current - 1)}
                                        disabled={page <= 1 || loading}
                                        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setPage((current) => current + 1)}
                                        disabled={page >= totalPages || loading}
                                        className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </section>
            </div>

            {selectedOrder && (
                <div
                    className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center sm:p-4"
                    onMouseDown={(event) => {
                        if (event.target === event.currentTarget) {
                            setSelectedOrder(null);
                        }
                    }}
                >
                    <section className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Manage order</p>
                                <h2 className="mt-1 text-xl font-bold">
                                    {selectedOrder.orderNumber}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedOrder(null)}
                                aria-label="Close"
                                className="rounded-lg border px-3 py-1.5 hover:bg-gray-100"
                            >
                                ✕
                            </button>
                        </div>

                        <div className="mt-5 grid gap-4 sm:grid-cols-2">
                            <div className="rounded-lg bg-gray-50 p-4">
                                <h3 className="font-semibold">Customer</h3>
                                <p className="mt-2 text-sm">
                                    {selectedOrder.customer?.firstName}{" "}
                                    {selectedOrder.customer?.lastName}
                                </p>
                                <p className="mt-1 break-all text-sm text-gray-600">
                                    {selectedOrder.customer?.email}
                                </p>
                                <p className="mt-1 text-sm text-gray-600">
                                    {selectedOrder.customer?.phone}
                                </p>
                            </div>

                            <div className="rounded-lg bg-gray-50 p-4">
                                <h3 className="font-semibold">Payment summary</h3>
                                <p className="mt-2 text-sm">
                                    Method: {selectedOrder.paymentMethod}
                                </p>
                                <p className="mt-1 text-sm">
                                    Payment status: {selectedOrder.paymentStatus}
                                </p>
                                <p className="mt-2 text-lg font-bold">
                                    {currency(selectedOrder.total)}
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 rounded-lg border border-gray-200 p-4">
                            <h3 className="font-semibold">Shipping address</h3>
                            <p className="mt-2 text-sm leading-6 text-gray-600">
                                {selectedOrder.shippingAddress?.address}
                                {selectedOrder.shippingAddress?.apartment
                                    ? `, ${selectedOrder.shippingAddress.apartment}`
                                    : ""}
                                <br />
                                {selectedOrder.shippingAddress?.city},{" "}
                                {selectedOrder.shippingAddress?.state}{" "}
                                {selectedOrder.shippingAddress?.pincode}
                                <br />
                                {selectedOrder.shippingAddress?.country ?? "India"}
                            </p>
                        </div>

                        <div className="mt-4">
                            <h3 className="font-semibold">Items</h3>
                            <div className="mt-2 divide-y divide-gray-100 rounded-lg border border-gray-200">
                                {selectedOrder.items?.map((item, index) => (
                                    <div
                                        key={`${item.sku ?? item.name}-${index}`}
                                        className="flex items-center justify-between gap-4 p-3"
                                    >
                                        <div>
                                            <p className="text-sm font-medium">{item.name}</p>
                                            <p className="mt-1 text-xs text-gray-500">
                                                Qty: {item.quantity}
                                            </p>
                                        </div>
                                        <p className="text-sm font-semibold">
                                            {currency(item.lineTotal)}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="mt-5 flex flex-wrap gap-2 border-t pt-5">
                            <button
                                type="button"
                                onClick={() => printInvoice(selectedOrder)}
                                className="rounded-lg bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white"
                            >
                                Print Invoice
                            </button>

                            <button
                                type="button"
                                onClick={() => printShippingLabel(selectedOrder)}
                                className="rounded-lg border px-4 py-2.5 text-sm font-semibold"
                            >
                                Print Shipping Label
                            </button>
                        </div>
                        <div className="mt-5 space-y-4 border-t border-gray-200 pt-5">
                            <h3 className="font-semibold">Update order</h3>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Order status
                                </label>
                                <select
                                    value={newStatus}
                                    onChange={(event) => {
                                        const status = event.target.value as OrderStatus;

                                        setNewStatus(status);

                                        if (status === "REFUND_INITIATED") {
                                            setRefundAmount(String(selectedOrder.total));
                                            setRefundEntireAmount(true);
                                            setShowRefundDialog(true);
                                        }
                                    }}
                                    disabled={selectedOrder.status === "CANCELLED"}
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black disabled:bg-gray-100"
                                >
                                    {STATUSES.map((status) => (
                                        <option key={status} value={status}>
                                            {status}
                                        </option>
                                    ))}
                                </select>
                                {selectedOrder.status === "CANCELLED" && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        Cancelled orders cannot be updated.
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="mb-2 block text-sm font-medium">
                                    Tracking number
                                </label>
                                <input
                                    value={trackingNumber}
                                    onChange={(event) => setTrackingNumber(event.target.value)}
                                    placeholder="Enter courier tracking number"
                                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black"
                                />
                            </div>

                            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                                <button
                                    onClick={() => setSelectedOrder(null)}
                                    className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                                >
                                    Close
                                </button>
                                <button
                                    onClick={() => void updateStatus()}
                                    disabled={
                                        saving ||
                                        selectedOrder.status === "CANCELLED"
                                    }
                                    className="rounded-lg bg-black px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800 disabled:opacity-50"
                                >
                                    {saving ? "Saving..." : "Save changes"}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>
            )}
            {showRefundDialog && selectedOrder && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4">
                    <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                        <h2 className="text-xl font-bold">
                            Initiate Refund
                        </h2>

                        <p className="mt-2 text-sm text-gray-500">
                            Order: {selectedOrder.orderNumber}
                        </p>

                        <div className="mt-5 rounded-lg bg-gray-50 p-4">
                            <p className="text-sm text-gray-500">
                                Total order amount
                            </p>
                            <p className="mt-1 text-xl font-bold">
                                {currency(selectedOrder.total)}
                            </p>
                        </div>

                        <label className="mt-5 flex cursor-pointer items-center gap-2 text-sm font-medium">
                            <input
                                type="checkbox"
                                checked={refundEntireAmount}
                                onChange={(event) => {
                                    const checked = event.target.checked;

                                    setRefundEntireAmount(checked);
                                    setRefundAmount(
                                        checked ? String(selectedOrder.total) : ""
                                    );
                                }}
                                className="h-4 w-4"
                            />
                            Refund entire amount
                        </label>

                        <div className="mt-4">
                            <label className="mb-2 block text-sm font-medium">
                                Refund amount (₹)
                            </label>

                            <input
                                type="number"
                                min="0.01"
                                max={selectedOrder.total}
                                step="0.01"
                                value={refundAmount}
                                disabled={refundEntireAmount}
                                onChange={(event) => {
                                    setRefundAmount(event.target.value);
                                    setRefundEntireAmount(false);
                                }}
                                placeholder="Enter refund amount"
                                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 outline-none focus:border-black disabled:bg-gray-100"
                            />

                            <p className="mt-1 text-xs text-gray-500">
                                Maximum refundable amount: {currency(selectedOrder.total)}
                            </p>
                        </div>

                        <div className="mt-6 flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => {
                                    setShowRefundDialog(false);
                                    setNewStatus(selectedOrder.status);
                                    setRefundAmount("");
                                    setRefundEntireAmount(false);
                                }}
                                className="rounded-lg border px-4 py-2 text-sm font-semibold"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                disabled={
                                    saving ||
                                    !refundAmount ||
                                    !Number.isFinite(Number(refundAmount)) ||
                                    Number(refundAmount) <= 0 ||
                                    Number(refundAmount) > selectedOrder.total
                                }
                                onClick={() => {
                                    setShowRefundDialog(false);
                                    void updateStatus();
                                }}
                                className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
                            >
                                {saving ? "Processing..." : "Confirm Refund"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}

function StatCard({
    label,
    value,
}: {
    label: string;
    value: string | number;
}) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-2xl font-bold">{value}</p>
        </div>
    );
}

function StatusBadge({ status }: { status: OrderStatus }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[status] ?? "bg-gray-100 text-gray-700"
                }`}
        >
            {status}
        </span>
    );
}



function escapeHtml(value: unknown): string {
    return String(value ?? "").replace(/[&<>"']/g, (char) => {
        const entities: Record<string, string> = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;",
        };
        return entities[char];
    });
}

function printDocument(title: string, body: string) {
    const printWindow = window.open("", "_blank", "width=900,height=700");

    if (!printWindow) {
        alert("Please allow pop-ups to print.");
        return;
    }

    printWindow.document.open();
    printWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>${escapeHtml(title)}</title>
            <meta charset="utf-8" />
            <style>
                * { box-sizing: border-box; }
                body {
                    font-family: Arial, sans-serif;
                    color: #111;
                    margin: 0;
                    padding: 28px;
                    font-size: 12px;
                }
                h1 { font-size: 24px; margin: 0 0 8px; }
                h2 { font-size: 15px; margin: 20px 0 8px; }
                p { margin: 4px 0; line-height: 1.5; }
                .muted { color: #555; }
                .header {
                    display: flex;
                    justify-content: space-between;
                    gap: 24px;
                    border-bottom: 2px solid #111;
                    padding-bottom: 16px;
                }
                .grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 20px;
                    margin: 20px 0;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 12px;
                }
                th, td {
                    border: 1px solid #ccc;
                    padding: 9px;
                    text-align: left;
                }
                th { background: #f3f4f6; }
                .right { text-align: right; }
                .totals {
                    width: 300px;
                    margin-left: auto;
                }
                .totals td { border: 0; padding: 5px; }
                .grand-total {
                    border-top: 2px solid #111 !important;
                    font-size: 15px;
                    font-weight: bold;
                }
                .label {
                    border: 2px solid #111;
                    padding: 24px;
                    max-width: 520px;
                    margin: 20px auto;
                }
                .label h1 { font-size: 22px; }
                .label .order-number {
                    font-size: 18px;
                    font-weight: bold;
                    overflow-wrap: anywhere;
                }
                .page-break { page-break-after: always; }
                @media print {
                    body { padding: 0; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${body}
            <script>
                window.onload = function () {
                    setTimeout(function () {
                        window.print();
                    }, 250);
                };
            </script>
        </body>
        </html>
    `);
    printWindow.document.close();
}

function printInvoice(order: Order) {
    const customerName = [
        order.customer?.firstName,
        order.customer?.lastName,
    ].filter(Boolean).join(" ");

    const address = order.shippingAddress;

    const body = `
        <div class="header">
            <div>
                <h1>Alpha Male</h1>
                <p class="muted">Seller details and GST registration must be configured.</p>
            </div>
            <div>
                <h1>Invoice</h1>
                <p><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>
                <p><strong>Date:</strong> ${order.createdAt
            ? escapeHtml(new Date(order.createdAt).toLocaleDateString("en-IN"))
            : "—"
        }</p>
                <p><strong>Payment:</strong> ${escapeHtml(order.paymentStatus)}</p>
            </div>
        </div>

        <div class="grid">
            <div>
                <h2>Bill / Customer Details</h2>
                <p>${escapeHtml(customerName || "Customer")}</p>
                <p>${escapeHtml(order.customer?.email)}</p>
                <p>${escapeHtml(order.customer?.phone)}</p>
            </div>
            <div>
                <h2>Shipping Address</h2>
                <p>${escapeHtml(address?.address)}</p>
                <p>${escapeHtml(address?.apartment)}</p>
                <p>${escapeHtml([
            address?.city,
            address?.state,
            address?.pincode,
        ].filter(Boolean).join(", "))}</p>
                <p>${escapeHtml(address?.country || "India")}</p>
            </div>
        </div>

        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>SKU</th>
                    <th class="right">Qty</th>
                    <th class="right">Unit Price</th>
                    <th class="right">Line Total</th>
                </tr>
            </thead>
            <tbody>
                ${(order.items ?? []).map((item) => `
                    <tr>
                        <td>${escapeHtml(item.name)}</td>
                        <td>${escapeHtml(item.sku || "—")}</td>
                        <td class="right">${escapeHtml(item.quantity)}</td>
                        <td class="right">${escapeHtml(currency(item.price))}</td>
                        <td class="right">${escapeHtml(currency(item.lineTotal))}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>

        <table class="totals">
            <tr><td>Subtotal</td><td class="right">${escapeHtml(currency(order.subtotal))}</td></tr>
            <tr><td>Discount</td><td class="right">${escapeHtml(currency(order.discount))}</td></tr>
            <tr><td>Shipping</td><td class="right">${escapeHtml(currency(order.shippingCharge))}</td></tr>
            <tr class="grand-total"><td>Total</td><td class="right">${escapeHtml(currency(order.total))}</td></tr>
        </table>

        <p style="margin-top:24px" class="muted">
            This printout uses the order totals currently stored in the system.
            It is not a GST-compliant tax invoice until the required tax and seller
            details are supplied by the backend.
        </p>
    `;

    printDocument(`Invoice ${order.orderNumber}`, body);
}

function printShippingLabel(order: Order) {
    const address = order.shippingAddress;
    const customerName = [
        order.customer?.firstName,
        order.customer?.lastName,
    ].filter(Boolean).join(" ");

    const body = `
        <div class="label">
            <p class="muted">ALPHA MALE — SHIPPING LABEL</p>
            <h1>SHIP TO</h1>
            <h2>${escapeHtml(customerName || "Customer")}</h2>
            <p>${escapeHtml(order.customer?.phone)}</p>
            <p>${escapeHtml(address?.address)}</p>
            <p>${escapeHtml(address?.apartment)}</p>
            <p>${escapeHtml([
        address?.city,
        address?.state,
        address?.pincode,
    ].filter(Boolean).join(", "))}</p>
            <p>${escapeHtml(address?.country || "India")}</p>
            <hr />
            <p class="order-number">ORDER: ${escapeHtml(order.orderNumber)}</p>
            <p>Payment: ${escapeHtml(order.paymentStatus)}</p>
            <p>Courier: ${escapeHtml(order.trackingNumber || "Not assigned")}</p>
            <p class="muted">Carrier barcode / AWB label must come from the courier.</p>
        </div>
    `;

    printDocument(`Shipping Label ${order.orderNumber}`, body);
}

function printPicklist(orders: Order[]) {
    const products = new Map<
        string,
        { name: string; sku: string; quantity: number }
    >();

    for (const order of orders) {
        for (const item of order.items ?? []) {
            const key = item.sku || item.name;
            const existing = products.get(key);

            if (existing) {
                existing.quantity += Number(item.quantity || 0);
            } else {
                products.set(key, {
                    name: item.name,
                    sku: item.sku || "—",
                    quantity: Number(item.quantity || 0),
                });
            }
        }
    }

    const body = `
        <h1>Picklist</h1>
        <p>Generated: ${escapeHtml(new Date().toLocaleString("en-IN"))}</p>
        <p>Selected orders: ${orders.length}</p>

        <table>
            <thead>
                <tr>
                    <th>Picked</th>
                    <th>Product</th>
                    <th>SKU</th>
                    <th class="right">Total Quantity</th>
                </tr>
            </thead>
            <tbody>
                ${Array.from(products.values()).map((item) => `
                    <tr>
                        <td>□</td>
                        <td>${escapeHtml(item.name)}</td>
                        <td>${escapeHtml(item.sku)}</td>
                        <td class="right">${escapeHtml(item.quantity)}</td>
                    </tr>
                `).join("")}
            </tbody>
        </table>

        <h2>Orders Included</h2>
        <p>${orders.map((order) => escapeHtml(order.orderNumber)).join(", ")}</p>
    `;

    printDocument("Order Picklist", body);
}

function printBulkInvoices(orders: Order[]) {
    if (orders.length === 0) {
        alert("Select at least one order.");
        return;
    }

    const html = orders.map((order, index) => {
        const address = order.shippingAddress;
        const customerName = [
            order.customer?.firstName,
            order.customer?.lastName,
        ].filter(Boolean).join(" ");

        return `
            <section class="${index < orders.length - 1 ? "page-break" : ""}">
                <div class="header">
                    <div>
                        <h1>Alpha Male</h1>
                        <p class="muted">Seller GST details require configuration.</p>
                    </div>
                    <div>
                        <h1>Invoice</h1>
                        <p><strong>Order:</strong> ${escapeHtml(order.orderNumber)}</p>
                        <p><strong>Date:</strong> ${order.createdAt
                ? escapeHtml(new Date(order.createdAt).toLocaleDateString("en-IN"))
                : "—"
            }</p>
                    </div>
                </div>
                <div class="grid">
                    <div>
                        <h2>Customer</h2>
                        <p>${escapeHtml(customerName)}</p>
                        <p>${escapeHtml(order.customer?.email)}</p>
                        <p>${escapeHtml(order.customer?.phone)}</p>
                    </div>
                    <div>
                        <h2>Shipping Address</h2>
                        <p>${escapeHtml(address?.address)}</p>
                        <p>${escapeHtml(address?.apartment)}</p>
                        <p>${escapeHtml([
                address?.city,
                address?.state,
                address?.pincode,
            ].filter(Boolean).join(", "))}</p>
                        <p>${escapeHtml(address?.country || "India")}</p>
                    </div>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Item</th><th>SKU</th><th>Qty</th>
                            <th>Unit Price</th><th>Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${(order.items ?? []).map((item) => `
                            <tr>
                                <td>${escapeHtml(item.name)}</td>
                                <td>${escapeHtml(item.sku || "—")}</td>
                                <td>${escapeHtml(item.quantity)}</td>
                                <td>${escapeHtml(currency(item.price))}</td>
                                <td>${escapeHtml(currency(item.lineTotal))}</td>
                            </tr>
                        `).join("")}
                    </tbody>
                </table>
                <table class="totals">
                    <tr><td>Subtotal</td><td class="right">${escapeHtml(currency(order.subtotal))}</td></tr>
                    <tr><td>Discount</td><td class="right">${escapeHtml(currency(order.discount))}</td></tr>
                    <tr><td>Shipping</td><td class="right">${escapeHtml(currency(order.shippingCharge))}</td></tr>
                    <tr class="grand-total"><td>Total</td><td class="right">${escapeHtml(currency(order.total))}</td></tr>
                </table>
                <p class="muted" style="margin-top:20px">
                    Print copy from order data; not a GST-compliant tax invoice.
                </p>
            </section>
        `;
    }).join("");

    printDocument(`Invoices - ${orders.length} orders`, html);
}
