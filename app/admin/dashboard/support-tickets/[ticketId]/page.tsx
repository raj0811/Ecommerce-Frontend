
"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type TicketMessage = {
    _id?: string;
    message: string;
    senderName?: string;
    senderType?: string;
    createdAt?: string;
};

type Ticket = {
    _id: string;
    subject: string;
    description: string;
    customerName?: string;
    customerEmail?: string;
    customerPhone?: string;
    category?: string;
    priority?: string;
    status?: string;
    orderNumber?: string;
    orderId?: string;
    createdAt?: string;
    updatedAt?: string;
    messages?: TicketMessage[];
};

export default function ViewSupportTicketPage() {
    const params = useParams<{ ticketId: string }>();
    const router = useRouter();

    const [ticket, setTicket] = useState<Ticket | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [reply, setReply] = useState("");
    const [error, setError] = useState("");

    const getHeaders = () => ({
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("adminAccessToken")}`,
    });

    const request = async (path: string, options: RequestInit = {}) => {
        const response = await fetch(`${API_URL}${path}`, {
            ...options,
            headers: {
                ...getHeaders(),
                ...options.headers,
            },
        });

        const result = await response.json().catch(() => null);

        if (!response.ok) {
            throw new Error(
                Array.isArray(result?.message)
                    ? result.message.join(", ")
                    : result?.message || "Something went wrong"
            );
        }

        return result;
    };

    const fetchTicket = useCallback(async () => {
        try {
            setLoading(true);
            setError("");

            const result = await request(
                `/support-tickets/admin/${params.ticketId}`
            );

            setTicket(result?.ticket ?? result?.data ?? result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load ticket");
        } finally {
            setLoading(false);
        }
    }, [params.ticketId]);

    useEffect(() => {
        fetchTicket();
    }, [fetchTicket]);

    const updateTicket = async (body: Record<string, unknown>) => {
        try {
            setSaving(true);
            await request(`/support-tickets/admin/${params.ticketId}`, {
                method: "PATCH",
                body: JSON.stringify(body),
            });
            await fetchTicket();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Update failed");
        } finally {
            setSaving(false);
        }
    };

    const performAction = async (
        action: "resolve" | "close" | "reopen"
    ) => {
        try {
            setSaving(true);
            await request(
                `/support-tickets/admin/${params.ticketId}/${action}`,
                { method: "PATCH" }
            );
            await fetchTicket();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Action failed");
        } finally {
            setSaving(false);
        }
    };

    const sendReply = async () => {
        if (!reply.trim()) return;

        try {
            setSaving(true);

            await request(
                `/support-tickets/admin/${params.ticketId}/messages`,
                {
                    method: "POST",
                    body: JSON.stringify({ message: reply.trim() }),
                }
            );

            setReply("");
            await fetchTicket();
        } catch (err) {
            alert(err instanceof Error ? err.message : "Failed to send reply");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 text-center text-gray-500">
                Loading ticket...
            </div>
        );
    }

    if (error || !ticket) {
        return (
            <div className="p-8">
                <p className="text-red-600">{error || "Ticket not found"}</p>
                <button
                    onClick={() => router.back()}
                    className="mt-4 rounded-lg border px-4 py-2"
                >
                    Go Back
                </button>
            </div>
        );
    }

    const statusColor: Record<string, string> = {
        OPEN: "bg-blue-100 text-blue-700",
        IN_PROGRESS: "bg-yellow-100 text-yellow-700",
        WAITING_FOR_CUSTOMER: "bg-purple-100 text-purple-700",
        RESOLVED: "bg-green-100 text-green-700",
        CLOSED: "bg-gray-200 text-gray-700",
    };

    const priorityColor: Record<string, string> = {
        LOW: "text-gray-600",
        MEDIUM: "text-blue-600",
        HIGH: "text-orange-600",
        URGENT: "text-red-600",
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="mx-auto max-w-6xl space-y-6">

                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <button
                            onClick={() => router.push("/admin/dashboard/support-tickets")}
                            className="mb-3 text-sm text-gray-500 hover:text-black"
                        >
                            ← Back to Tickets
                        </button>

                        <h1 className="text-2xl font-bold text-gray-900">
                            Support Ticket
                        </h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Ticket ID: {ticket._id}
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                        {ticket.status !== "RESOLVED" &&
                            ticket.status !== "CLOSED" && (
                                <button
                                    disabled={saving}
                                    onClick={() => performAction("resolve")}
                                    className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                                >
                                    Resolve
                                </button>
                            )}

                        {ticket.status !== "CLOSED" && (
                            <button
                                disabled={saving}
                                onClick={() => performAction("close")}
                                className="rounded-lg bg-gray-800 px-4 py-2 text-sm text-white disabled:opacity-50"
                            >
                                Close Ticket
                            </button>
                        )}

                        {ticket.status === "CLOSED" && (
                            <button
                                disabled={saving}
                                onClick={() => performAction("reopen")}
                                className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white disabled:opacity-50"
                            >
                                Reopen
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">

                    {/* Ticket details */}
                    <div className="space-y-6 lg:col-span-2">

                        <section className="rounded-xl border bg-white p-6 shadow-sm">
                            <div className="flex flex-wrap items-start justify-between gap-3">
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        {ticket.subject}
                                    </h2>
                                    <p className="mt-2 text-sm text-gray-500">
                                        Created{" "}
                                        {ticket.createdAt
                                            ? new Date(ticket.createdAt).toLocaleString()
                                            : "—"}
                                    </p>
                                </div>

                                <span
                                    className={`rounded-full px-3 py-1 text-xs font-semibold ${statusColor[ticket.status || ""] ||
                                        "bg-gray-100 text-gray-700"
                                        }`}
                                >
                                    {ticket.status?.replaceAll("_", " ") || "UNKNOWN"}
                                </span>
                            </div>

                            <div className="mt-6">
                                <h3 className="mb-2 text-sm font-semibold text-gray-700">
                                    Description
                                </h3>
                                <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                    {ticket.description}
                                </p>
                            </div>

                            {ticket.orderNumber && (
                                <div className="mt-5 border-t pt-4 text-sm">
                                    <span className="text-gray-500">Order number: </span>
                                    <span className="font-medium text-gray-900">
                                        {ticket.orderNumber}
                                    </span>
                                </div>
                            )}
                        </section>

                        {/* Conversation */}
                        <section className="rounded-xl border bg-white p-6 shadow-sm">
                            <h2 className="mb-5 text-lg font-semibold text-gray-900">
                                Conversation
                            </h2>

                            <div className="space-y-4">
                                {ticket.messages?.length ? (
                                    ticket.messages.map((item, index) => (
                                        <div
                                            key={item._id || index}
                                            className="rounded-lg border bg-gray-50 p-4"
                                        >
                                            <div className="mb-2 flex flex-wrap justify-between gap-2">
                                                <span className="text-sm font-semibold text-gray-900">
                                                    {item.senderName ||
                                                        (item.senderType === "ADMIN" ? "Admin" : "Customer")}
                                                </span>

                                                <span className="text-xs text-gray-500">
                                                    {item.createdAt
                                                        ? new Date(item.createdAt).toLocaleString()
                                                        : ""}
                                                </span>
                                            </div>

                                            <p className="whitespace-pre-wrap text-sm leading-6 text-gray-700">
                                                {item.message}
                                            </p>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-gray-500">
                                        No replies yet.
                                    </p>
                                )}
                            </div>

                            {ticket.status !== "CLOSED" && (
                                <div className="mt-6 border-t pt-5">
                                    <label className="mb-2 block text-sm font-semibold text-gray-700">
                                        Reply to customer
                                    </label>

                                    <textarea
                                        value={reply}
                                        onChange={(e) => setReply(e.target.value)}
                                        rows={4}
                                        placeholder="Write your reply..."
                                        className="w-full rounded-lg border border-gray-300 p-3 text-sm text-gray-900 outline-none focus:border-blue-500"
                                    />

                                    <button
                                        onClick={sendReply}
                                        disabled={saving || !reply.trim()}
                                        className="mt-3 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-medium text-white disabled:opacity-50"
                                    >
                                        {saving ? "Sending..." : "Send Reply"}
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* Customer and ticket properties */}
                    <div className="space-y-6">

                        <section className="rounded-xl border bg-white p-6 shadow-sm">
                            <h2 className="mb-4 font-semibold text-gray-900">
                                Customer Details
                            </h2>

                            <div className="space-y-4 text-sm">
                                <div>
                                    <p className="text-gray-500">Name</p>
                                    <p className="mt-1 font-medium text-gray-900">
                                        {ticket.customerName || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500">Email</p>
                                    <p className="mt-1 break-all font-medium text-gray-900">
                                        {ticket.customerEmail || "—"}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-gray-500">Phone</p>
                                    <p className="mt-1 font-medium text-gray-900">
                                        {ticket.customerPhone || "—"}
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-xl border bg-white p-6 shadow-sm">
                            <h2 className="mb-4 font-semibold text-gray-900">
                                Ticket Properties
                            </h2>

                            <div className="space-y-5">
                                <div>
                                    <label className="mb-2 block text-sm text-gray-500">
                                        Status
                                    </label>
                                    <select
                                        value={ticket.status || "OPEN"}
                                        disabled={saving}
                                        onChange={(e) =>
                                            updateTicket({ status: e.target.value })
                                        }
                                        className="w-full rounded-lg border p-2.5 text-sm text-gray-900"
                                    >
                                        {[
                                            "OPEN",
                                            "IN_PROGRESS",
                                            "WAITING_FOR_CUSTOMER",
                                            "RESOLVED",
                                            "CLOSED",
                                        ].map((status) => (
                                            <option key={status} value={status}>
                                                {status.replaceAll("_", " ")}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="mb-2 block text-sm text-gray-500">
                                        Priority
                                    </label>
                                    <select
                                        value={ticket.priority || "MEDIUM"}
                                        disabled={saving}
                                        onChange={(e) =>
                                            updateTicket({ priority: e.target.value })
                                        }
                                        className={`w-full rounded-lg border p-2.5 text-sm font-semibold ${priorityColor[ticket.priority || ""] || ""
                                            }`}
                                    >
                                        {["LOW", "MEDIUM", "HIGH", "URGENT"].map((priority) => (
                                            <option key={priority} value={priority}>
                                                {priority}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <p className="text-sm text-gray-500">Category</p>
                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                        {ticket.category || "—"}
                                    </p>
                                </div>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
}
