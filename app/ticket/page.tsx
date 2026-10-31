
"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type Ticket = {
    _id: string;
    ticketNumber?: string;
    subject: string;
    description?: string;
    category?: string;
    priority?: string;
    status?: string;
    orderNumber?: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    createdAt?: string;
    updatedAt?: string;
    messages?: Array<{
        message: string;
        senderName?: string;
        createdAt?: string;
        isInternal?: boolean;
    }>;
};

type TicketForm = {
    subject: string;
    description: string;
    category: string;
    priority: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
};

const initialForm: TicketForm = {
    subject: "",
    description: "",
    category: "ORDER",
    priority: "MEDIUM",
    customerName: "",
    customerEmail: "",
    customerPhone: "",
};

const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/5";

function getErrorMessage(result: any, fallback: string) {
    if (Array.isArray(result?.message)) {
        return result.message.join(", ");
    }

    return result?.message || fallback;
}

function getTicketsFromResponse(result: any): Ticket[] {
    if (Array.isArray(result)) return result;

    if (Array.isArray(result?.tickets)) return result.tickets;
    if (Array.isArray(result?.data)) return result.data;
    if (Array.isArray(result?.items)) return result.items;
    if (Array.isArray(result?.results)) return result.results;

    if (Array.isArray(result?.data?.tickets)) {
        return result.data.tickets;
    }

    return [];
}

function formatDate(date?: string) {
    if (!date) return "Date unavailable";

    const parsed = new Date(date);

    if (Number.isNaN(parsed.getTime())) {
        return "Date unavailable";
    }

    return parsed.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function formatLabel(value?: string) {
    if (!value) return "Unknown";

    return value
        .replace(/_/g, " ")
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getStatusClass(status?: string) {
    switch (status?.toUpperCase()) {
        case "RESOLVED":
        case "CLOSED":
            return "bg-emerald-50 text-emerald-700 border-emerald-100";

        case "IN_PROGRESS":
        case "IN PROGRESS":
            return "bg-blue-50 text-blue-700 border-blue-100";

        case "OPEN":
            return "bg-amber-50 text-amber-700 border-amber-100";

        case "REOPENED":
            return "bg-violet-50 text-violet-700 border-violet-100";

        default:
            return "bg-slate-100 text-slate-600 border-slate-200";
    }
}

function getPriorityClass(priority?: string) {
    switch (priority?.toUpperCase()) {
        case "URGENT":
            return "text-red-600";

        case "HIGH":
            return "text-orange-600";

        case "MEDIUM":
            return "text-amber-600";

        case "LOW":
            return "text-slate-500";

        default:
            return "text-slate-500";
    }
}

export default function SupportTicketPage() {
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    const [showForm, setShowForm] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [form, setForm] = useState<TicketForm>(initialForm);

    const [page, setPage] = useState(1);

    const loadTickets = useCallback(async () => {
        if (!API_URL) {
            setError("API URL is not configured.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("accessToken")?.trim();
            const guestId = localStorage.getItem("guestId");

            setIsLoggedIn(Boolean(token));

            if (!token && !guestId) {
                setTickets([]);
                setLoading(false);
                return;
            }

            const endpoint = token
                ? `/support-tickets/my?page=${page}&limit=10`
                : `/support-tickets/guest/${encodeURIComponent(guestId!)}?page=${page}&limit=10`;

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                    ...(token
                        ? { Authorization: `Bearer ${token}` }
                        : {}),
                },
                cache: "no-store",
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Unable to load support tickets.")
                );
            }

            setTickets(getTicketsFromResponse(result));
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to load support tickets."
            );
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        loadTickets();
    }, [loadTickets]);

    function updateField(
        field: keyof TicketForm,
        value: string
    ) {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    }

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSubmitting(true);
        setError("");
        setSuccess("");

        try {
            if (!API_URL) {
                throw new Error("API URL is not configured.");
            }

            const token = localStorage.getItem("accessToken")?.trim();
            const guestId = localStorage.getItem("guestId");

            if (!token && !guestId) {
                throw new Error(
                    "Guest session not found. Please refresh the page."
                );
            }

            const endpoint = token
                ? "/support-tickets"
                : "/support-tickets/guest";

            const body = token
                ? {
                    subject: form.subject,
                    description: form.description,
                    category: form.category,
                    priority: form.priority,
                    customerPhone: form.customerPhone,
                }
                : {
                    guestId,
                    customerName: form.customerName,
                    customerEmail: form.customerEmail,
                    customerPhone: form.customerPhone,
                    subject: form.subject,
                    description: form.description,
                    category: form.category,
                    priority: form.priority,
                };

            const response = await fetch(`${API_URL}${endpoint}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...(token
                        ? { Authorization: `Bearer ${token}` }
                        : {}),
                },
                body: JSON.stringify(body),
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    getErrorMessage(result, "Unable to raise support ticket.")
                );
            }

            setSuccess("Your support ticket has been raised successfully!");
            setForm(initialForm);
            setShowForm(false);
            setSelectedTicket(null);
            setPage(1);

            await loadTickets();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setSubmitting(false);
        }
    }

    function openTicket(ticket: Ticket) {
        setSelectedTicket(ticket);
        setShowForm(false);
        setError("");
        setSuccess("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function openCreateForm() {
        setSelectedTicket(null);
        setShowForm(true);
        setError("");
        setSuccess("");
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    function closePanels() {
        setShowForm(false);
        setSelectedTicket(null);
        setError("");
    }

    return (
        <main className="min-h-screen bg-slate-50 pb-16">
            {/* Page header */}
            <section className="border-b border-slate-200 bg-white">
                <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6 lg:px-8">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <Link
                                href="/"
                                className="text-sm font-medium text-slate-500 transition hover:text-slate-900"
                            >
                                ← Back to Store
                            </Link>

                            <div className="mt-3 flex items-center gap-3">
                                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-xl text-white">
                                    <span>?</span>
                                </div>

                                <div>
                                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                                        Support Center
                                    </h1>
                                    <p className="mt-1 text-sm text-slate-500">
                                        We're here to help you.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-700"
                        >
                            <span className="text-lg">+</span>
                            Raise a Ticket
                        </button>
                    </div>
                </div>
            </section>

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                {/* Success message */}
                {success && (
                    <div className="mb-6 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-100 font-bold">
                            ✓
                        </span>
                        {success}
                        <button
                            type="button"
                            onClick={() => setSuccess("")}
                            className="ml-auto text-lg"
                        >
                            ×
                        </button>
                    </div>
                )}

                {/* Error message */}
                {error && (
                    <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                        {error}
                    </div>
                )}

                {/* Intro cards */}
                {!showForm && !selectedTicket && (
                    <div className="mb-8 grid gap-5 md:grid-cols-3">
                        <div className="rounded-2xl bg-slate-900 p-6 text-white md:col-span-2">
                            <p className="text-sm font-medium text-slate-300">
                                CUSTOMER SUPPORT
                            </p>

                            <h2 className="mt-3 max-w-xl text-2xl font-bold sm:text-3xl">
                                How can we help you today?
                            </h2>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-slate-300">
                                Have a question about an order, payment,
                                delivery or product? Raise a ticket and
                                our support team will assist you.
                            </p>

                            <button
                                type="button"
                                onClick={openCreateForm}
                                className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                            >
                                Create Support Ticket →
                            </button>
                        </div>

                        <div className="rounded-2xl border border-slate-200 bg-white p-6">
                            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-50 text-xl text-violet-700">
                                <span>▤</span>
                            </div>

                            <h3 className="mt-4 font-semibold text-slate-900">
                                Track your requests
                            </h3>

                            <p className="mt-2 text-sm leading-6 text-slate-500">
                                View your recent tickets and check their
                                current status anytime.
                            </p>

                            <button
                                type="button"
                                onClick={() =>
                                    document.getElementById("recent-tickets")
                                        ?.scrollIntoView({ behavior: "smooth" })
                                }
                                className="mt-4 text-sm font-semibold text-slate-900 hover:underline"
                            >
                                View recent tickets →
                            </button>
                        </div>
                    </div>
                )}

                {/* Raise ticket form */}
                {showForm && (
                    <section className="mb-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-5 sm:px-7">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    Raise a Support Ticket
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    Describe your issue and we'll get back to you.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={closePanels}
                                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
                            >
                                Cancel
                            </button>
                        </div>

                        <form
                            onSubmit={handleSubmit}
                            className="grid gap-6 p-5 sm:p-7 lg:grid-cols-3"
                        >
                            <div className="space-y-5 lg:col-span-2">
                                {!isLoggedIn && (
                                    <div className="grid gap-5 sm:grid-cols-2">
                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                Full Name
                                            </label>
                                            <input
                                                required
                                                className={inputClass}
                                                placeholder="Enter your name"
                                                value={form.customerName}
                                                onChange={(e) =>
                                                    updateField("customerName", e.target.value)
                                                }
                                            />
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-700">
                                                Email Address
                                            </label>
                                            <input
                                                required
                                                type="email"
                                                className={inputClass}
                                                placeholder="Enter your email"
                                                value={form.customerEmail}
                                                onChange={(e) =>
                                                    updateField("customerEmail", e.target.value)
                                                }
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Phone Number
                                    </label>
                                    <input
                                        type="tel"
                                        className={inputClass}
                                        placeholder="Enter phone number"
                                        value={form.customerPhone}
                                        onChange={(e) =>
                                            updateField("customerPhone", e.target.value)
                                        }
                                    />
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Ticket Subject
                                    </label>
                                    <input
                                        required
                                        className={inputClass}
                                        placeholder="What is your issue about?"
                                        value={form.subject}
                                        onChange={(e) =>
                                            updateField("subject", e.target.value)
                                        }
                                    />
                                </div>

                                <div className="grid gap-5 sm:grid-cols-2">
                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Category
                                        </label>
                                        <select
                                            className={inputClass}
                                            value={form.category}
                                            onChange={(e) =>
                                                updateField("category", e.target.value)
                                            }
                                        >
                                            <option value="ORDER">Order</option>
                                            <option value="PAYMENT">Payment</option>
                                            <option value="DELIVERY">Delivery</option>
                                            <option value="RETURN">Return</option>
                                            <option value="PRODUCT">Product</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="mb-2 block text-sm font-medium text-slate-700">
                                            Priority
                                        </label>
                                        <select
                                            className={inputClass}
                                            value={form.priority}
                                            onChange={(e) =>
                                                updateField("priority", e.target.value)
                                            }
                                        >
                                            <option value="LOW">Low</option>
                                            <option value="MEDIUM">Medium</option>
                                            <option value="HIGH">High</option>
                                            <option value="URGENT">Urgent</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm font-medium text-slate-700">
                                        Describe Your Issue
                                    </label>
                                    <textarea
                                        required
                                        rows={6}
                                        className={`${inputClass} resize-y`}
                                        placeholder="Please explain your issue in detail..."
                                        value={form.description}
                                        onChange={(e) =>
                                            updateField("description", e.target.value)
                                        }
                                    />
                                </div>
                            </div>

                            <aside className="h-fit rounded-2xl bg-slate-50 p-5">
                                <h3 className="font-semibold text-slate-900">
                                    Before submitting
                                </h3>

                                <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-600">
                                    <li>• Explain your issue clearly.</li>
                                    <li>• Select the correct category.</li>
                                    <li>• Choose priority according to urgency.</li>
                                    <li>• Include your phone number if you want us to contact you.</li>
                                </ul>

                                <div className="mt-6 border-t border-slate-200 pt-5">
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="w-full rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        {submitting
                                            ? "Submitting..."
                                            : "Submit Ticket"}
                                    </button>

                                    <p className="mt-3 text-center text-xs text-slate-500">
                                        Our support team will review your request.
                                    </p>
                                </div>
                            </aside>
                        </form>
                    </section>
                )}

                {/* Selected ticket details */}
                {selectedTicket && (
                    <section className="mb-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:p-7">
                            <div>
                                <button
                                    type="button"
                                    onClick={closePanels}
                                    className="mb-3 text-sm font-medium text-slate-500 hover:text-slate-900"
                                >
                                    ← Back to tickets
                                </button>

                                <h2 className="text-xl font-bold text-slate-900">
                                    {selectedTicket.subject}
                                </h2>

                                <p className="mt-1 text-sm text-slate-500">
                                    {selectedTicket.ticketNumber ||
                                        `Ticket #${selectedTicket._id}`}
                                </p>
                            </div>

                            <span
                                className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusClass(
                                    selectedTicket.status
                                )}`}
                            >
                                {formatLabel(selectedTicket.status)}
                            </span>
                        </div>

                        <div className="grid gap-6 p-5 sm:p-7 md:grid-cols-3">
                            <div className="md:col-span-2">
                                <h3 className="font-semibold text-slate-900">
                                    Issue Description
                                </h3>

                                <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-slate-600">
                                    {selectedTicket.description ||
                                        "No description available."}
                                </p>

                                {selectedTicket.orderNumber && (
                                    <div className="mt-5 rounded-xl bg-slate-50 p-4">
                                        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                                            Related Order
                                        </p>
                                        <p className="mt-1 text-sm font-semibold text-slate-900">
                                            {selectedTicket.orderNumber}
                                        </p>
                                    </div>
                                )}

                                <div className="mt-7">
                                    <h3 className="font-semibold text-slate-900">
                                        Conversation
                                    </h3>

                                    {selectedTicket.messages &&
                                        selectedTicket.messages.length > 0 ? (
                                        <div className="mt-4 space-y-4">
                                            {selectedTicket.messages
                                                .filter((message) => !message.isInternal)
                                                .map((message, index) => (
                                                    <div
                                                        key={index}
                                                        className="rounded-xl bg-slate-50 p-4"
                                                    >
                                                        <div className="flex flex-wrap justify-between gap-2">
                                                            <p className="text-sm font-semibold text-slate-900">
                                                                {message.senderName || "Support"}
                                                            </p>
                                                            <p className="text-xs text-slate-400">
                                                                {formatDate(message.createdAt)}
                                                            </p>
                                                        </div>

                                                        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                                            {message.message}
                                                        </p>
                                                    </div>
                                                ))}
                                        </div>
                                    ) : (
                                        <p className="mt-3 rounded-xl bg-slate-50 p-4 text-sm text-slate-500">
                                            No conversation messages available.
                                        </p>
                                    )}
                                </div>
                            </div>

                            <aside className="h-fit rounded-xl border border-slate-200 p-5">
                                <h3 className="font-semibold text-slate-900">
                                    Ticket Information
                                </h3>

                                <div className="mt-5 space-y-5">
                                    <div>
                                        <p className="text-xs text-slate-400">Category</p>
                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {formatLabel(selectedTicket.category)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">Priority</p>
                                        <p className={`mt-1 text-sm font-semibold ${getPriorityClass(selectedTicket.priority)}`}>
                                            {formatLabel(selectedTicket.priority)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">Created</p>
                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {formatDate(selectedTicket.createdAt)}
                                        </p>
                                    </div>

                                    <div>
                                        <p className="text-xs text-slate-400">Last Updated</p>
                                        <p className="mt-1 text-sm font-medium text-slate-800">
                                            {formatDate(selectedTicket.updatedAt)}
                                        </p>
                                    </div>
                                </div>
                            </aside>
                        </div>
                    </section>
                )}

                {/* Recent tickets */}
                {!showForm && !selectedTicket && (
                    <section id="recent-tickets">
                        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">
                                    Recent Tickets
                                </h2>
                                <p className="mt-1 text-sm text-slate-500">
                                    View and track your support requests.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={loadTickets}
                                disabled={loading}
                                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                            >
                                ↻ Refresh
                            </button>
                        </div>

                        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                            {loading ? (
                                <div className="space-y-4 p-6">
                                    {[1, 2, 3].map((item) => (
                                        <div
                                            key={item}
                                            className="h-20 animate-pulse rounded-xl bg-slate-100"
                                        />
                                    ))}
                                </div>
                            ) : tickets.length === 0 ? (
                                <div className="px-5 py-16 text-center">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-3xl">
                                        ▤
                                    </div>

                                    <h3 className="mt-5 text-lg font-semibold text-slate-900">
                                        No support tickets yet
                                    </h3>

                                    <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
                                        You haven't raised any support requests.
                                        Create your first ticket and our team
                                        will help you.
                                    </p>

                                    <button
                                        type="button"
                                        onClick={openCreateForm}
                                        className="mt-6 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-700"
                                    >
                                        Raise Your First Ticket
                                    </button>
                                </div>
                            ) : (
                                <>
                                    {/* Desktop table */}
                                    <div className="hidden overflow-x-auto md:block">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50">
                                                <tr>
                                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Ticket
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Category
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Priority
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Status
                                                    </th>
                                                    <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Created
                                                    </th>
                                                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">
                                                        Action
                                                    </th>
                                                </tr>
                                            </thead>

                                            <tbody className="divide-y divide-slate-100">
                                                {tickets.map((ticket) => (
                                                    <tr
                                                        key={ticket._id}
                                                        className="transition hover:bg-slate-50"
                                                    >
                                                        <td className="px-6 py-5">
                                                            <p className="max-w-xs truncate text-sm font-semibold text-slate-900">
                                                                {ticket.subject}
                                                            </p>
                                                            <p className="mt-1 text-xs text-slate-400">
                                                                {ticket.ticketNumber ||
                                                                    `#${ticket._id.slice(-8)}`}
                                                            </p>
                                                        </td>

                                                        <td className="px-6 py-5 text-sm text-slate-600">
                                                            {formatLabel(ticket.category)}
                                                        </td>

                                                        <td className={`px-6 py-5 text-sm font-semibold ${getPriorityClass(ticket.priority)}`}>
                                                            {formatLabel(ticket.priority)}
                                                        </td>

                                                        <td className="px-6 py-5">
                                                            <span
                                                                className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${getStatusClass(ticket.status)}`}
                                                            >
                                                                {formatLabel(ticket.status)}
                                                            </span>
                                                        </td>

                                                        <td className="px-6 py-5 text-sm text-slate-500">
                                                            {formatDate(ticket.createdAt)}
                                                        </td>

                                                        <td className="px-6 py-5 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => openTicket(ticket)}
                                                                className="text-sm font-semibold text-slate-900 hover:underline"
                                                            >
                                                                View Ticket →
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* Mobile cards */}
                                    <div className="divide-y divide-slate-100 md:hidden">
                                        {tickets.map((ticket) => (
                                            <div
                                                key={ticket._id}
                                                className="p-5"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <h3 className="break-words font-semibold text-slate-900">
                                                            {ticket.subject}
                                                        </h3>
                                                        <p className="mt-1 text-xs text-slate-400">
                                                            {ticket.ticketNumber ||
                                                                `#${ticket._id.slice(-8)}`}
                                                        </p>
                                                    </div>

                                                    <span
                                                        className={`shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(ticket.status)}`}
                                                    >
                                                        {formatLabel(ticket.status)}
                                                    </span>
                                                </div>

                                                <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
                                                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                                                        {formatLabel(ticket.category)}
                                                    </span>
                                                    <span className="rounded-lg bg-slate-100 px-2.5 py-1.5">
                                                        {formatLabel(ticket.priority)}
                                                    </span>
                                                    <span className="px-2 py-1.5">
                                                        {formatDate(ticket.createdAt)}
                                                    </span>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => openTicket(ticket)}
                                                    className="mt-4 w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                                >
                                                    View Ticket →
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>

                        {!loading && tickets.length > 0 && (
                            <div className="mt-5 flex items-center justify-between">
                                <p className="text-xs text-slate-500">
                                    Showing {tickets.length} ticket(s)
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        disabled={page <= 1}
                                        onClick={() => setPage((p) => p - 1)}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    <span className="flex items-center px-2 text-sm text-slate-500">
                                        {page}
                                    </span>

                                    <button
                                        type="button"
                                        disabled={tickets.length < 10}
                                        onClick={() => setPage((p) => p + 1)}
                                        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </section>
                )}

                {/* Help footer */}
                {!showForm && !selectedTicket && (
                    <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 sm:flex-row">
                        <div>
                            <h3 className="font-semibold text-slate-900">
                                Still need help?
                            </h3>
                            <p className="mt-1 text-sm text-slate-500">
                                Our support team is ready to assist you.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={openCreateForm}
                            className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                        >
                            Contact Support
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
