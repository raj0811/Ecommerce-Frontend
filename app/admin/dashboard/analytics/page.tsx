
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type AnalyticsData = {
    period?: { from: string; to: string };
    overview: {
        totalOrders: number;
        totalSales: number;
        revenue: number;
        averageOrderValue: number;
        totalDiscount: number;
        totalShipping: number;
    };
    orders: {
        pending: number;
        confirmed: number;
        processing: number;
        shipped: number;
        outForDelivery: number;
        delivered: number;
        cancelled: number;
        returnCount: number;
        statusBreakdown: { _id: string; count: number }[];
    };
    payments: {
        breakdown: { _id: string; count: number; amount: number }[];
        methods: { _id: string; orders: number; amount: number }[];
    };
    returns: {
        total: number;
        breakdown: { _id: string; count: number; amount: number }[];
    };
    salesChart: {
        date: string;
        orders: number;
        revenue: number;
    }[];
    topProducts: {
        _id: string;
        name: string;
        quantitySold: number;
        revenue: number;
    }[];
};

const money = (value = 0) =>
    new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(value);

const number = (value = 0) =>
    new Intl.NumberFormat("en-IN").format(value);

const today = () => new Date().toISOString().slice(0, 10);

const firstDay = () => {
    const date = new Date();
    return new Date(date.getFullYear(), date.getMonth(), 1)
        .toISOString()
        .slice(0, 10);
};

function MetricCard({
    title,
    value,
    description,
}: {
    title: string;
    value: string;
    description?: string;
}) {
    return (
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">{title}</p>
            <h3 className="mt-3 text-2xl font-bold text-slate-900">
                {value}
            </h3>
            {description && (
                <p className="mt-2 text-xs text-slate-500">{description}</p>
            )}
        </div>
    );
}

function Bar({
    label,
    value,
    total,
    color = "bg-blue-600",
}: {
    label: string;
    value: number;
    total: number;
    color?: string;
}) {
    const percentage = total > 0 ? (value / total) * 100 : 0;

    return (
        <div className="space-y-2">
            <div className="flex justify-between gap-3 text-sm">
                <span className="text-slate-600">{label}</span>
                <span className="font-semibold text-slate-900">
                    {number(value)}
                </span>
            </div>
            <div className="h-2.5 overflow-hidden rounded-full bg-slate-100">
                <div
                    className={`h-full rounded-full ${color}`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                />
            </div>
        </div>
    );
}

function SalesChart({
    data,
}: {
    data: AnalyticsData["salesChart"];
}) {
    const maxRevenue = Math.max(...data.map((item) => item.revenue), 1);

    if (!data.length) {
        return (
            <div className="flex h-64 items-center justify-center text-sm text-slate-400">
                No sales data available for this period.
            </div>
        );
    }

    const points = data.map((item, index) => ({
        x: data.length === 1 ? 50 : 20 + (index / (data.length - 1)) * 560,
        y: 190 - (item.revenue / maxRevenue) * 160,
    }));

    const path = points
        .map((point, index) =>
            `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
        )
        .join(" ");

    return (
        <div className="w-full">
            <svg
                viewBox="0 0 600 220"
                className="h-64 w-full overflow-visible"
                preserveAspectRatio="none"
            >
                {[30, 70, 110, 150, 190].map((y) => (
                    <line
                        key={y}
                        x1="15"
                        x2="585"
                        y1={y}
                        y2={y}
                        stroke="#e2e8f0"
                        strokeDasharray="4 4"
                    />
                ))}

                <path
                    d={path}
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                />

                {points.map((point, index) => (
                    <circle
                        key={index}
                        cx={point.x}
                        cy={point.y}
                        r="4"
                        fill="#2563eb"
                    >
                        <title>
                            {data[index].date}: {money(data[index].revenue)}
                        </title>
                    </circle>
                ))}
            </svg>

            <div className="flex justify-between text-xs text-slate-400">
                <span>{data[0].date}</span>
                <span>{data[data.length - 1].date}</span>
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const [data, setData] = useState<AnalyticsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [from, setFrom] = useState(firstDay);
    const [to, setTo] = useState(today);

    const fetchAnalytics = useCallback(async () => {
        if (!API_URL) {
            setError("NEXT_PUBLIC_API_URL is not configured.");
            setLoading(false);
            return;
        }

        const token = localStorage.getItem("adminAccessToken");

        if (!token) {
            setError("Admin access token not found. Please log in again.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const params = new URLSearchParams({ from, to });

            const response = await fetch(
                `${API_URL}/admin/stats/overview?${params.toString()}`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`,
                        "Content-Type": "application/json",
                    },
                    cache: "no-store",
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to load analytics."
                );
            }

            setData(result as AnalyticsData);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }, [from, to]);

    useEffect(() => {
        void fetchAnalytics();
    }, [fetchAnalytics]);

    const orderTotal = data?.orders.statusBreakdown.reduce(
        (sum, item) => sum + item.count,
        0
    ) ?? 0;

    const orderStatuses = [
        { label: "Pending", value: data?.orders.pending ?? 0, color: "bg-amber-500" },
        { label: "Confirmed", value: data?.orders.confirmed ?? 0, color: "bg-indigo-500" },
        { label: "Processing", value: data?.orders.processing ?? 0, color: "bg-blue-500" },
        { label: "Shipped", value: data?.orders.shipped ?? 0, color: "bg-violet-500" },
        { label: "Out for delivery", value: data?.orders.outForDelivery ?? 0, color: "bg-cyan-500" },
        { label: "Delivered", value: data?.orders.delivered ?? 0, color: "bg-green-500" },
        { label: "Cancelled", value: data?.orders.cancelled ?? 0, color: "bg-red-500" },
    ];

    return (
        <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Store Analytics
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Monitor sales, orders, payments and store performance.
                        </p>
                    </div>

                    <button
                        onClick={fetchAnalytics}
                        disabled={loading}
                        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                        {loading ? "Refreshing..." : "Refresh Analytics"}
                    </button>
                </div>

                {/* Filters */}
                <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-end">
                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                            From
                        </label>
                        <input
                            type="date"
                            value={from}
                            max={to}
                            onChange={(e) => setFrom(e.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                    </div>

                    <div>
                        <label className="mb-1 block text-xs font-medium text-slate-500">
                            To
                        </label>
                        <input
                            type="date"
                            value={to}
                            min={from}
                            max={today()}
                            onChange={(e) => setTo(e.target.value)}
                            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
                        />
                    </div>

                    <button
                        onClick={fetchAnalytics}
                        disabled={loading || !from || !to}
                        className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                        Apply Filter
                    </button>
                </div>

                {error && (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {loading && !data && (
                    <div className="rounded-xl bg-white p-16 text-center text-slate-500">
                        Loading analytics...
                    </div>
                )}

                {data && (
                    <>
                        {/* Main KPIs */}
                        <section>
                            <h2 className="mb-3 text-lg font-bold text-slate-800">
                                Sales Overview
                            </h2>

                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                <MetricCard
                                    title="Paid Revenue"
                                    value={money(data.overview.revenue)}
                                    description="Revenue from orders marked PAID"
                                />
                                <MetricCard
                                    title="Total Orders"
                                    value={number(data.overview.totalOrders)}
                                />
                                <MetricCard
                                    title="Average Order Value"
                                    value={money(data.overview.averageOrderValue)}
                                />
                                <MetricCard
                                    title="Total Sales"
                                    value={money(data.overview.totalSales)}
                                    description="Includes all order payment statuses"
                                />
                                <MetricCard
                                    title="Discount Given"
                                    value={money(data.overview.totalDiscount)}
                                />
                                <MetricCard
                                    title="Shipping Charges"
                                    value={money(data.overview.totalShipping)}
                                />
                                <MetricCard
                                    title="Returns"
                                    value={number(data.returns.total)}
                                />
                                <MetricCard
                                    title="Cancelled Orders"
                                    value={number(data.orders.cancelled)}
                                />
                            </div>
                        </section>

                        {/* Revenue Chart */}
                        <section className="grid gap-5 xl:grid-cols-3">
                            <div className="rounded-xl border border-slate-200 bg-white p-5 xl:col-span-2">
                                <div className="mb-5">
                                    <h2 className="font-bold text-slate-900">
                                        Daily Revenue
                                    </h2>
                                    <p className="mt-1 text-xs text-slate-500">
                                        Paid revenue over the selected period
                                    </p>
                                </div>

                                <SalesChart data={data.salesChart} />
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                <h2 className="font-bold text-slate-900">
                                    Daily Orders
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Orders created each day
                                </p>

                                <div className="mt-6 space-y-4">
                                    {data.salesChart.slice(-7).map((item) => {
                                        const max = Math.max(
                                            ...data.salesChart.map((d) => d.orders),
                                            1
                                        );

                                        return (
                                            <Bar
                                                key={item.date}
                                                label={item.date}
                                                value={item.orders}
                                                total={max}
                                                color="bg-blue-600"
                                            />
                                        );
                                    })}

                                    {!data.salesChart.length && (
                                        <p className="text-sm text-slate-400">
                                            No order data available.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Order analytics */}
                        <section className="grid gap-5 lg:grid-cols-2">
                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                <h2 className="font-bold text-slate-900">
                                    Order Status Breakdown
                                </h2>

                                <div className="mt-6 space-y-5">
                                    {orderStatuses.map((status) => (
                                        <Bar
                                            key={status.label}
                                            label={status.label}
                                            value={status.value}
                                            total={orderTotal}
                                            color={status.color}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-5">
                                <h2 className="font-bold text-slate-900">
                                    Payment Status
                                </h2>

                                <div className="mt-6 space-y-4">
                                    {data.payments.breakdown.map((payment) => (
                                        <div
                                            key={payment._id || "unknown"}
                                            className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4"
                                        >
                                            <div>
                                                <p className="font-semibold text-slate-800">
                                                    {payment._id || "Unknown"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {number(payment.count)} orders
                                                </p>
                                            </div>
                                            <p className="font-semibold text-slate-900">
                                                {money(payment.amount)}
                                            </p>
                                        </div>
                                    ))}

                                    {!data.payments.breakdown.length && (
                                        <p className="text-sm text-slate-400">
                                            No payment data available.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </section>

                        {/* Payment methods */}
                        <section className="rounded-xl border border-slate-200 bg-white p-5">
                            <h2 className="font-bold text-slate-900">
                                Payment Methods
                            </h2>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                                {data.payments.methods.map((method) => (
                                    <div
                                        key={method._id || "unknown"}
                                        className="rounded-lg bg-slate-50 p-4"
                                    >
                                        <p className="text-sm text-slate-500">
                                            {method._id || "Unknown"}
                                        </p>
                                        <p className="mt-2 text-xl font-bold text-slate-900">
                                            {money(method.amount)}
                                        </p>
                                        <p className="mt-1 text-xs text-slate-500">
                                            {number(method.orders)} orders
                                        </p>
                                    </div>
                                ))}

                                {!data.payments.methods.length && (
                                    <p className="text-sm text-slate-400">
                                        No payment method data available.
                                    </p>
                                )}
                            </div>
                        </section>

                        {/* Returns */}
                        <section className="rounded-xl border border-slate-200 bg-white p-5">
                            <h2 className="font-bold text-slate-900">
                                Returns & Cancellations
                            </h2>

                            <div className="mt-5 grid gap-4 sm:grid-cols-2">
                                <MetricCard
                                    title="Return Requests"
                                    value={number(data.returns.total)}
                                />
                                <MetricCard
                                    title="Cancellation Requests / Completed"
                                    value={number(data.orders.cancelled)}
                                />
                            </div>

                            <div className="mt-6 space-y-4">
                                {data.returns.breakdown.map((item) => (
                                    <div
                                        key={item._id}
                                        className="flex justify-between gap-4 border-b border-slate-100 pb-3 text-sm"
                                    >
                                        <span className="text-slate-600">
                                            {item._id.replaceAll("_", " ")}
                                        </span>
                                        <span className="font-semibold">
                                            {number(item.count)} orders · {money(item.amount)}
                                        </span>
                                    </div>
                                ))}
                            </div>

                            <p className="mt-4 text-xs text-slate-400">
                                Refund amounts are not included because the current
                                analytics API does not return verified refund data.
                            </p>
                        </section>

                        {/* Top products */}
                        <section className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                            <div className="border-b border-slate-100 p-5">
                                <h2 className="font-bold text-slate-900">
                                    Best Selling Products
                                </h2>
                                <p className="mt-1 text-xs text-slate-500">
                                    Ranked by quantity sold
                                </p>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">Product</th>
                                            <th className="px-5 py-4">Quantity Sold</th>
                                            <th className="px-5 py-4">Revenue</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {data.topProducts.map((product) => (
                                            <tr key={product._id}>
                                                <td className="px-5 py-4 font-medium text-slate-800">
                                                    {product.name}
                                                </td>
                                                <td className="px-5 py-4 text-slate-800">
                                                    {number(product.quantitySold)}
                                                </td>
                                                <td className="px-5 py-4 font-semibold text-slate-800">
                                                    {money(product.revenue)}
                                                </td>
                                            </tr>
                                        ))}

                                        {!data.topProducts.length && (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-5 py-10 text-center text-slate-400"
                                                >
                                                    No product sales available.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    </>
                )}
            </div>
        </main>
    );
}
