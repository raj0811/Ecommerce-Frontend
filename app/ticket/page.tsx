
"use client";
import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type Props = {
    onClose: () => void;
    orderId?: string;
    orderNumber?: string;
};

export default function RaiseTicketModal({
    onClose,
    orderId,
    orderNumber,
}: Props) {
    const [form, setForm] = useState({
        subject: "",
        description: "",
        category: "ORDER",
        priority: "MEDIUM",
        customerName: "",
        customerEmail: "",
        customerPhone: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("accessToken")?.trim()
            : null;

    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        const token = localStorage.getItem("accessToken")?.trim();
        setIsLoggedIn(Boolean(token));
    }, []);
    const inputClass =
        "w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 placeholder:text-gray-500 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

    const selectClass =
        "w-full rounded-lg border border-gray-300 bg-white p-3 text-sm text-gray-900 focus:border-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900";

    const updateField = (
        field: keyof typeof form,
        value: string
    ) => {
        setForm((previous) => ({
            ...previous,
            [field]: value,
        }));
    };


    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setLoading(true);
        setError("");
        setSuccess("");

        try {
            if (!API_URL) {
                throw new Error("API URL is not configured.");
            }

            // Get the latest authentication details
            const token = localStorage.getItem("accessToken")?.trim();
            const loggedIn = Boolean(token);
            const guestId = localStorage.getItem("guestId");

            // Validate guest session
            if (!loggedIn && !guestId) {
                throw new Error(
                    "Guest session not found. Please refresh the page."
                );
            }

            // Select endpoint based on authentication
            const endpoint = loggedIn
                ? "/support-tickets"
                : "/support-tickets/guest";

            // Prepare request body
            const body = loggedIn
                ? {
                    subject: form.subject,
                    description: form.description,
                    category: form.category,
                    priority: form.priority,
                    orderId,
                    orderNumber,
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
                    orderId,
                    orderNumber,
                };

            // Create support ticket
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
                    Array.isArray(result?.message)
                        ? result.message.join(", ")
                        : result?.message ||
                        "Unable to raise support ticket."
                );
            }

            setSuccess(
                "Your support ticket has been raised successfully!"
            );

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }


    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/60 p-4"
            onClick={onClose}
        >
            <div
                className="my-auto w-full max-w-lg rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl sm:p-7"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="mb-6">
                    <Link
                        href="/"
                        className="mb-4 inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 transition hover:border-gray-900 hover:bg-gray-50 hover:text-gray-900"
                    >
                        <span>←</span>
                        Back to Home
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900">
                                Raise Support Ticket
                            </h2>
                            <p className="mt-1 text-sm text-gray-500">
                                Tell us how we can help you.
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Close modal"
                            className="rounded-full p-2 text-xl font-semibold text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                        >
                            ×
                        </button>
                    </div>
                </div>

                {success ? (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-5 text-center">
                        <div className="text-3xl text-green-600">✓</div>

                        <h3 className="mt-2 font-semibold text-green-900">
                            Ticket Submitted
                        </h3>

                        <p className="mt-2 text-sm text-green-700">
                            {success}
                        </p>

                        <button
                            type="button"
                            onClick={onClose}
                            className="mt-5 rounded-lg bg-gray-900 px-6 py-3 text-sm font-semibold text-white hover:bg-gray-700"
                        >
                            Done
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {!isLoggedIn && (
                            <>
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                        Full Name
                                    </label>
                                    <input
                                        required
                                        placeholder="Enter your name"
                                        value={form.customerName}
                                        onChange={(e) =>
                                            updateField(
                                                "customerName",
                                                e.target.value
                                            )
                                        }
                                        className={inputClass}
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                        Email Address
                                    </label>
                                    <input
                                        required
                                        type="email"
                                        placeholder="Enter your email"
                                        value={form.customerEmail}
                                        onChange={(e) =>
                                            updateField(
                                                "customerEmail",
                                                e.target.value
                                            )
                                        }
                                        className={inputClass}
                                    />
                                </div>
                            </>
                        )}

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                Phone Number
                            </label>
                            <input
                                type="tel"
                                placeholder="Enter phone number"
                                value={form.customerPhone}
                                onChange={(e) =>
                                    updateField(
                                        "customerPhone",
                                        e.target.value
                                    )
                                }
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                Ticket Subject
                            </label>
                            <input
                                required
                                placeholder="What is the issue about?"
                                value={form.subject}
                                onChange={(e) =>
                                    updateField("subject", e.target.value)
                                }
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                Category
                            </label>
                            <select
                                value={form.category}
                                onChange={(e) =>
                                    updateField("category", e.target.value)
                                }
                                className={selectClass}
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
                            <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                Priority
                            </label>
                            <select
                                value={form.priority}
                                onChange={(e) =>
                                    updateField("priority", e.target.value)
                                }
                                className={selectClass}
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                                <option value="URGENT">Urgent</option>
                            </select>
                        </div>

                        <div>
                            <label className="mb-1.5 block text-sm font-medium text-gray-800">
                                Describe Your Issue
                            </label>
                            <textarea
                                required
                                rows={4}
                                placeholder="Please explain your issue in detail..."
                                value={form.description}
                                onChange={(e) =>
                                    updateField(
                                        "description",
                                        e.target.value
                                    )
                                }
                                className={`${inputClass} resize-y`}
                            />
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-gray-900 px-5 py-3 font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {loading ? "Submitting..." : "Submit Ticket"}
                        </button>

                        <p className="text-center text-xs text-gray-500">
                            Our support team will review your request.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
