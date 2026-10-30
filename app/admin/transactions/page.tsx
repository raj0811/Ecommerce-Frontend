
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Transaction = {
    _id: string;
    orderId?: {
        _id?: string;
        orderNumber?: string;
        total?: number;
        status?: string;
        paymentStatus?: string;
        customer?: {
            firstName?: string;
            lastName?: string;
            email?: string;
            phone?: string;
        };
    } | null;
    userId?: string | null;
    guestId?: string | null;
    paymentMethod?: string;
    status?: string;
    amount: number;
    currency?: string;
    gatewayOrderId?: string | null;
    createdAt?: string;
    updatedAt?: string;
};

type Pagination = {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

type ApiResponse = {
    success: boolean;
    data: Transaction[];
    pagination: Pagination;
};

const initialPagination: Pagination = {
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNextPage: false,
    hasPreviousPage: false,
};

function formatMoney(amount: number, currency = "INR") {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 2,
    }).format(amount || 0);
}

function formatDate(value?: string) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";

    return new Intl.DateTimeFormat("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
}

function statusStyle(status?: string) {
    const value = status?.toUpperCase() || "UNKNOWN";

    if (
        ["SUCCESS", "COMPLETED", "PAID", "CAPTURED"].includes(value)
    ) {
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
    }

    if (
        ["FAILED", "CANCELLED", "CANCELED", "EXPIRED"].includes(value)
    ) {
        return "bg-red-50 text-red-700 ring-red-600/20";
    }

    if (
        ["REFUNDED", "PARTIALLY_REFUNDED"].includes(value)
    ) {
        return "bg-violet-50 text-violet-700 ring-violet-600/20";
    }

    return "bg-amber-50 text-amber-700 ring-amber-600/20";
}

function StatusBadge({ status }: { status?: string }) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${statusStyle(
                status
            )}`}
        >
            {(status || "UNKNOWN").replaceAll("_", " ")}
        </span>
    );
}

export default function TransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [pagination, setPagination] =
        useState<Pagination>(initialPagination);

    const [searchInput, setSearchInput] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [selected, setSelected] = useState<Transaction | null>(null);

    const fetchTransactions = useCallback(async () => {
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
                limit: String(limit),
            });

            if (search) params.set("search", search);
            if (status) params.set("status", status);
            if (paymentMethod) params.set("paymentMethod", paymentMethod);
            if (startDate) params.set("startDate", startDate);
            if (endDate) params.set("endDate", endDate);

            const token =
                typeof window !== "undefined"
                    ? localStorage.getItem("adminAccessToken")
                    : null;

            const response = await fetch(
                `${API_URL}/payments/transactions?${params.toString()}`,
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

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    result?.message || "Failed to fetch transactions."
                );
            }

            if (
                !result ||
                !Array.isArray(result.data) ||
                !result.pagination
            ) {
                throw new Error("Unexpected transactions API response.");
            }

            const payload = result as ApiResponse;
            setTransactions(payload.data);
            setPagination(payload.pagination);
        } catch (err) {
            setTransactions([]);
            setPagination(initialPagination);
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }, [
        page,
        limit,
        search,
        status,
        paymentMethod,
        startDate,
        endDate,
    ]);

    useEffect(() => {
        void fetchTransactions();
    }, [fetchTransactions]);

    function applySearch(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setPage(1);
        setSearch(searchInput.trim());
    }

    function resetFilters() {
        setSearchInput("");
        setSearch("");
        setStatus("");
        setPaymentMethod("");
        setStartDate("");
        setEndDate("");
        setPage(1);
    }

    const successfulCount = transactions.filter((item) =>
        ["SUCCESS", "COMPLETED", "PAID", "CAPTURED"].includes(
            item.status?.toUpperCase() || ""
        )
    ).length;

    const pendingCount = transactions.filter((item) =>
        ["PENDING", "PROCESSING", "CREATED"].includes(
            item.status?.toUpperCase() || ""
        )
    ).length;

    const failedCount = transactions.filter((item) =>
        ["FAILED", "CANCELLED", "CANCELED"].includes(
            item.status?.toUpperCase() || ""
        )
    ).length;

    return (
        <main className="min-h-screen bg-slate-50 p-4 text-slate-900 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-[1600px] space-y-6">
                {/* Header */}
                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-sm font-medium text-slate-500">
                            Admin / Payments
                        </p>
                        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
                            Transactions
                        </h1>
                        <p className="mt-2 text-sm text-slate-500">
                            Monitor payments, gateway references, and order status.
                        </p>
                    </div>

                    <button
                        onClick={() => void fetchTransactions()}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <svg
                            className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            aria-hidden="true"
                        >
                            <path d="M20 7v5h-5M4 17v-5h5" />
                            <path d="M5.5 9A7 7 0 0 1 18 6l2 6M4 12l2 6a7 7 0 0 0 12.5-3" />
                        </svg>
                        Refresh
                    </button>
                </div>

                {/* Summary cards: based on the currently loaded page */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    <SummaryCard
                        title="All transactions"
                        value={pagination.total.toLocaleString("en-IN")}
                        description="Matching your current filters"
                        icon="↗"
                    />
                    <SummaryCard
                        title="Successful"
                        value={String(successfulCount)}
                        description="On this page"
                        icon="✓"
                    />
                    <SummaryCard
                        title="Pending"
                        value={String(pendingCount)}
                        description="On this page"
                        icon="◷"
                    />
                    <SummaryCard
                        title="Failed"
                        value={String(failedCount)}
                        description="On this page"
                        icon="!"
                    />
                </div>

                {/* Filters */}
                <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                    <form onSubmit={applySearch} className="space-y-4">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-6">
                            <div className="sm:col-span-2 xl:col-span-2">
                                <label
                                    htmlFor="transaction-search"
                                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                    Search
                                </label>
                                <input
                                    id="transaction-search"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                    placeholder="Order number, transaction ID..."
                                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-500 focus:ring-2 focus:ring-slate-100"
                                />
                            </div>

                            <FilterSelect
                                label="Payment status"
                                value={status}
                                onChange={(value) => {
                                    setStatus(value);
                                    setPage(1);
                                }}
                                options={[
                                    { label: "All statuses", value: "" },
                                    { label: "Pending", value: "PENDING" },
                                    { label: "Success", value: "SUCCESS" },
                                    { label: "Failed", value: "FAILED" },
                                    { label: "Refunded", value: "REFUNDED" },
                                ]}
                            />

                            <FilterSelect
                                label="Payment method"
                                value={paymentMethod}
                                onChange={(value) => {
                                    setPaymentMethod(value);
                                    setPage(1);
                                }}
                                options={[
                                    { label: "All methods", value: "" },
                                    { label: "Razorpay", value: "RAZORPAY" },
                                ]}
                            />

                            <div>
                                <label
                                    htmlFor="start-date"
                                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                    From date
                                </label>
                                <input
                                    id="start-date"
                                    type="date"
                                    value={startDate}
                                    max={endDate || undefined}
                                    onChange={(e) => {
                                        setStartDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="end-date"
                                    className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
                                >
                                    To date
                                </label>
                                <input
                                    id="end-date"
                                    type="date"
                                    value={endDate}
                                    min={startDate || undefined}
                                    onChange={(e) => {
                                        setEndDate(e.target.value);
                                        setPage(1);
                                    }}
                                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                                />
                            </div>
                        </div>

                        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                            <p className="text-xs text-slate-500">
                                Showing {transactions.length} of{" "}
                                {pagination.total.toLocaleString("en-IN")} matching records
                            </p>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={resetFilters}
                                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold transition hover:bg-slate-50"
                                >
                                    Clear filters
                                </button>
                                <button
                                    type="submit"
                                    className="rounded-xl bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </form>
                </section>

                {/* Table */}
                <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                    <div className="flex flex-col justify-between gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:px-5">
                        <div>
                            <h2 className="font-semibold">All transactions</h2>
                            <p className="mt-1 text-xs text-slate-500">
                                Latest transactions appear first.
                            </p>
                        </div>

                        <label className="flex items-center gap-2 text-sm text-slate-500">
                            Rows
                            <select
                                value={limit}
                                onChange={(e) => {
                                    setLimit(Number(e.target.value));
                                    setPage(1);
                                }}
                                className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-800 outline-none focus:border-slate-500"
                            >
                                <option value={10}>10</option>
                                <option value={25}>25</option>
                                <option value={50}>50</option>
                                <option value={100}>100</option>
                            </select>
                        </label>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="m-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                        >
                            <p className="font-semibold">Unable to load transactions</p>
                            <p className="mt-1">{error}</p>
                            <button
                                onClick={() => void fetchTransactions()}
                                className="mt-3 font-semibold underline"
                            >
                                Try again
                            </button>
                        </div>
                    )}

                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[1050px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                                <tr>
                                    <th className="px-5 py-4 font-semibold">Transaction</th>
                                    <th className="px-5 py-4 font-semibold">Order</th>
                                    <th className="px-5 py-4 font-semibold">Payment method</th>
                                    <th className="px-5 py-4 font-semibold">Amount</th>
                                    <th className="px-5 py-4 font-semibold">Status</th>
                                    <th className="px-5 py-4 font-semibold">Date</th>
                                    <th className="px-5 py-4 text-right font-semibold">
                                        Action
                                    </th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading &&
                                    Array.from({ length: 5 }).map((_, index) => (
                                        <tr key={`skeleton-${index}`}>
                                            {Array.from({ length: 7 }).map((__, cell) => (
                                                <td key={cell} className="px-5 py-5">
                                                    <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}

                                {!loading && !error && transactions.length === 0 && (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-16 text-center">
                                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-xl">
                                                ↗
                                            </div>
                                            <p className="mt-3 font-semibold text-slate-800">
                                                No transactions found
                                            </p>
                                            <p className="mt-1 text-sm text-slate-500">
                                                Try changing your filters or search term.
                                            </p>
                                        </td>
                                    </tr>
                                )}

                                {!loading &&
                                    transactions.map((transaction) => (
                                        <tr
                                            key={transaction._id}
                                            className="transition hover:bg-slate-50/80"
                                        >
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">
                                                    #{transaction._id.slice(-8).toUpperCase()}
                                                </p>
                                                <p
                                                    className="mt-1 max-w-44 truncate text-xs text-slate-400"
                                                    title={transaction.gatewayOrderId || ""}
                                                >
                                                    Gateway: {transaction.gatewayOrderId || "—"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-800">
                                                    {transaction.orderId?.orderNumber || "—"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-400">
                                                    {transaction.orderId?.paymentStatus || "Payment status unavailable"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className="inline-flex rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-semibold">
                                                    {(transaction.paymentMethod || "UNKNOWN").replaceAll(
                                                        "_",
                                                        " "
                                                    )}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 font-semibold tabular-nums">
                                                {formatMoney(
                                                    transaction.amount,
                                                    transaction.currency
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <StatusBadge status={transaction.status} />
                                            </td>

                                            <td className="whitespace-nowrap px-5 py-4 text-slate-500">
                                                {formatDate(transaction.createdAt)}
                                            </td>

                                            <td className="px-5 py-4 text-right">
                                                <button
                                                    onClick={() => setSelected(transaction)}
                                                    className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold transition hover:border-slate-400 hover:bg-white"
                                                >
                                                    View details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex flex-col gap-4 border-t border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                        <p className="text-sm text-slate-500">
                            {pagination.total === 0
                                ? "No records"
                                : `Showing ${(page - 1) * limit + 1}–${Math.min(
                                    page * limit,
                                    pagination.total
                                )} of ${pagination.total.toLocaleString("en-IN")}`}
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                            <button
                                disabled={!pagination.hasPreviousPage || loading}
                                onClick={() => setPage((current) => current - 1)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <span className="px-2 text-sm font-medium text-slate-600">
                                Page {pagination.totalPages ? page : 0} of{" "}
                                {pagination.totalPages}
                            </span>

                            <button
                                disabled={!pagination.hasNextPage || loading}
                                onClick={() => setPage((current) => current + 1)}
                                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </section>
            </div>

            {/* Transaction details modal */}
            {selected && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm"
                    onClick={() => setSelected(null)}
                >
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="transaction-modal-title"
                        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                                    Transaction details
                                </p>
                                <h2
                                    id="transaction-modal-title"
                                    className="mt-1 text-xl font-bold"
                                >
                                    #{selected._id.slice(-8).toUpperCase()}
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    {formatDate(selected.createdAt)}
                                </p>
                            </div>

                            <button
                                onClick={() => setSelected(null)}
                                aria-label="Close details"
                                className="rounded-lg p-2 text-xl text-slate-400 hover:bg-slate-100 hover:text-slate-800"
                            >
                                ×
                            </button>
                        </div>

                        <div className="space-y-6 p-5 sm:p-6">
                            <div className="rounded-xl bg-slate-50 p-4">
                                <p className="text-sm text-slate-500">Transaction amount</p>
                                <p className="mt-1 text-3xl font-bold tracking-tight">
                                    {formatMoney(selected.amount, selected.currency)}
                                </p>
                                <div className="mt-3">
                                    <StatusBadge status={selected.status} />
                                </div>
                            </div>

                            <div>
                                <h3 className="mb-3 text-sm font-semibold">
                                    Payment information
                                </h3>
                                <DetailRow label="Transaction ID" value={selected._id} />
                                <DetailRow
                                    label="Order number"
                                    value={selected.orderId?.orderNumber}
                                />
                                <DetailRow
                                    label="Order ID"
                                    value={
                                        typeof selected.orderId === "object"
                                            ? selected.orderId?._id
                                            : selected.orderId
                                    }
                                />
                                <DetailRow
                                    label="Payment method"
                                    value={selected.paymentMethod}
                                />
                                <DetailRow
                                    label="Gateway order ID"
                                    value={selected.gatewayOrderId}
                                />
                                <DetailRow label="Currency" value={selected.currency} />
                                <DetailRow
                                    label="Order status"
                                    value={selected.orderId?.status}
                                />
                                <DetailRow
                                    label="Payment status"
                                    value={selected.orderId?.paymentStatus}
                                />
                                <DetailRow
                                    label="Created at"
                                    value={formatDate(selected.createdAt)}
                                />
                                <DetailRow
                                    label="Last updated"
                                    value={formatDate(selected.updatedAt)}
                                />
                            </div>

                            <div>
                                <h3 className="mb-3 text-sm font-semibold">
                                    Customer reference
                                </h3>
                                <DetailRow
                                    label="Customer"
                                    value={
                                        [
                                            selected.orderId?.customer?.firstName,
                                            selected.orderId?.customer?.lastName,
                                        ]
                                            .filter(Boolean)
                                            .join(" ") || undefined
                                    }
                                />
                                <DetailRow
                                    label="Email"
                                    value={selected.orderId?.customer?.email}
                                />
                                <DetailRow
                                    label="Phone"
                                    value={selected.orderId?.customer?.phone}
                                />
                                <DetailRow label="User ID" value={selected.userId} />
                                <DetailRow label="Guest ID" value={selected.guestId} />
                            </div>
                        </div>

                        <div className="border-t border-slate-100 p-5 text-right">
                            <button
                                onClick={() => setSelected(null)}
                                className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700"
                            >
                                Close
                            </button>
                        </div>
                    </section>
                </div>
            )}
        </main>
    );
}

function SummaryCard({
    title,
    value,
    description,
    icon,
}: {
    title: string;
    value: string;
    description: string;
    icon: string;
}) {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-slate-500">{title}</p>
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-lg font-semibold text-slate-700">
                    {icon}
                </span>
            </div>
            <p className="mt-4 text-2xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>
    );
}

function FilterSelect({
    label,
    value,
    onChange,
    options,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: { label: string; value: string }[];
}) {
    const id = label.toLowerCase().replaceAll(" ", "-");

    return (
        <div>
            <label
                htmlFor={id}
                className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500"
            >
                {label}
            </label>
            <select
                id={id}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-slate-500"
            >
                {options.map((option) => (
                    <option key={option.value} value={option.value}>
                        {option.label}
                    </option>
                ))}
            </select>
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
        <div className="flex flex-col gap-1 border-b border-slate-100 py-3 last:border-0 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <span className="shrink-0 text-sm text-slate-500">{label}</span>
            <span className="break-all text-left text-sm font-medium text-slate-800 sm:max-w-[65%] sm:text-right">
                {value === null || value === undefined || value === ""
                    ? "—"
                    : String(value)}
            </span>
        </div>
    );
}
