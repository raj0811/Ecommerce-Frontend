
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type Ticket = {
    _id: string;
    subject: string;
    description: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    status: string;
    priority: string;
    category: string;
    orderId?: string;
    orderNumber?: string;
    createdAt: string;
    assignedAgentName?: string;
};

type TicketResponse = {
    data?: Ticket[];
    tickets?: Ticket[];
    total?: number;
    totalPages?: number;
    page?: number;
};

const statuses = [
    "OPEN",
    "IN_PROGRESS",
    "WAITING_FOR_CUSTOMER",
    "RESOLVED",
    "CLOSED",
];

const priorities = ["LOW", "MEDIUM", "HIGH", "URGENT"];

const badgeClass = (value: string) => {
    const styles: Record<string, string> = {
        OPEN: "bg-blue-100 text-blue-700",
        IN_PROGRESS: "bg-indigo-100 text-indigo-700",
        WAITING_FOR_CUSTOMER: "bg-amber-100 text-amber-700",
        RESOLVED: "bg-green-100 text-green-700",
        CLOSED: "bg-gray-200 text-gray-700",
        LOW: "bg-gray-100 text-gray-700",
        MEDIUM: "bg-blue-100 text-blue-700",
        HIGH: "bg-orange-100 text-orange-700",
        URGENT: "bg-red-100 text-red-700",
    };

    return styles[value] || "bg-gray-100 text-gray-700";
};

export default function SupportTicketsPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [status, setStatus] = useState("");
    const [priority, setPriority] = useState("");
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const limit = 10;

    const fetchTickets = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const token = localStorage.getItem("adminAccessToken");

            if (!token) {
                throw new Error("Admin access token not found. Please log in again.");
            }

            if (!API_URL) {
                throw new Error("API URL is not configured.");
            }

            const params = new URLSearchParams({
                page: String(page),
                limit: String(limit),
            });

            if (status) params.set("status", status);
            if (priority) params.set("priority", priority);
            if (search.trim()) params.set("search", search.trim());

            const response = await fetch(
                `${API_URL}/support-tickets/admin/all?${params}`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.message || "Unable to fetch tickets.");
            }

            // Supports either an array or a paginated response.
            const list: Ticket[] = Array.isArray(result)
                ? result
                : result.tickets ?? result.data ?? [];

            setTickets(list);
            setTotal(result.total ?? list.length);
            setTotalPages(
                result.totalPages ??
                Math.max(1, Math.ceil((result.total ?? list.length) / limit))
            );
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }, [page, status, priority, search]);

    useEffect(() => {
        void fetchTickets();
    }, [fetchTickets]);

    const updateFilters = (
        setter: (value: string) => void,
        value: string
    ) => {
        setter(value);
        setPage(1);
    };

    return (
        <main className="min-h-screen bg-slate-100 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Support Tickets
                        </h1>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage customer queries, complaints and requests.
                        </p>
                    </div>

                    <button
                        onClick={fetchTickets}
                        disabled={loading}
                        className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-700 disabled:opacity-50"
                    >
                        Refresh
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                    <div className="rounded-xl border bg-white p-5">
                        <p className="text-sm text-slate-500">Total Tickets</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {total}
                        </p>
                    </div>

                    <div className="rounded-xl border bg-white p-5">
                        <p className="text-sm text-slate-500">Current Page</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {page} / {totalPages}
                        </p>
                    </div>

                    <div className="col-span-2 rounded-xl border bg-white p-5 sm:col-span-1">
                        <p className="text-sm text-slate-500">Loaded Tickets</p>
                        <p className="mt-2 text-2xl font-bold text-slate-900">
                            {tickets.length}
                        </p>
                    </div>
                </div>

                {/* Filters */}
                <div className="grid gap-3 rounded-xl border bg-white p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <input
                        value={search}
                        onChange={(e) => updateFilters(setSearch, e.target.value)}
                        placeholder="Search tickets..."
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-500"
                    />

                    <select
                        value={status}
                        onChange={(e) => updateFilters(setStatus, e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                    >
                        <option value="">All statuses</option>
                        {statuses.map((item) => (
                            <option key={item} value={item}>
                                {item.replaceAll("_", " ")}
                            </option>
                        ))}
                    </select>

                    <select
                        value={priority}
                        onChange={(e) => updateFilters(setPriority, e.target.value)}
                        className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900"
                    >
                        <option value="">All priorities</option>
                        {priorities.map((item) => (
                            <option key={item} value={item}>
                                {item}
                            </option>
                        ))}
                    </select>

                    <button
                        onClick={() => {
                            setSearch("");
                            setStatus("");
                            setPriority("");
                            setPage(1);
                        }}
                        className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                        Clear Filters
                    </button>
                </div>

                {error && (
                    <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Tickets table */}
                <div className="overflow-hidden rounded-xl border bg-white">
                    <div className="overflow-x-auto">
                        <table className="w-full min-w-[950px] text-left text-sm">
                            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                                <tr>
                                    <th className="px-5 py-4">Ticket</th>
                                    <th className="px-5 py-4">Customer</th>
                                    <th className="px-5 py-4">Category</th>
                                    <th className="px-5 py-4">Priority</th>
                                    <th className="px-5 py-4">Status</th>
                                    <th className="px-5 py-4">Created</th>
                                    <th className="px-5 py-4">Action</th>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-slate-500">
                                            Loading support tickets...
                                        </td>
                                    </tr>
                                ) : tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="p-12 text-center text-slate-500">
                                            No support tickets found.
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map((ticket) => (
                                        <tr key={ticket._id} className="hover:bg-slate-50">
                                            <td className="px-5 py-4">
                                                <p className="font-semibold text-slate-900">
                                                    {ticket.subject}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    #{ticket._id.slice(-8)}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4">
                                                <p className="font-medium text-slate-800">
                                                    {ticket.customerName || "Guest"}
                                                </p>
                                                <p className="mt-1 text-xs text-slate-500">
                                                    {ticket.customerEmail || "No email"}
                                                </p>
                                            </td>

                                            <td className="px-5 py-4 text-slate-600">
                                                {ticket.category}
                                                {ticket.orderNumber && (
                                                    <p className="mt-1 text-xs text-slate-400">
                                                        {ticket.orderNumber}
                                                    </p>
                                                )}
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(ticket.priority)}`}>
                                                    {ticket.priority}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4">
                                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${badgeClass(ticket.status)}`}>
                                                    {ticket.status.replaceAll("_", " ")}
                                                </span>
                                            </td>

                                            <td className="px-5 py-4 whitespace-nowrap text-slate-500">
                                                {ticket.createdAt
                                                    ? new Date(ticket.createdAt).toLocaleDateString("en-IN")
                                                    : "-"}
                                            </td>

                                            <td className="px-5 py-4">
                                                <a
                                                    href={`/admin/dashboard/support-tickets/${ticket._id}`}
                                                    className="font-semibold text-blue-700 hover:underline"
                                                >
                                                    View Ticket
                                                </a>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between border-t border-slate-100 p-4">
                        <p className="text-xs text-slate-500">
                            Page {page} of {totalPages}
                        </p>

                        <div className="flex gap-2">
                            <button
                                disabled={page <= 1 || loading}
                                onClick={() => setPage((p) => p - 1)}
                                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                            >
                                Previous
                            </button>

                            <button
                                disabled={page >= totalPages || loading}
                                onClick={() => setPage((p) => p + 1)}
                                className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 disabled:opacity-40"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
