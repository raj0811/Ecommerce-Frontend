
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type ShipmentTrack = {
    awb_code?: string;
    courier_name?: string;
    current_status?: string;
    pickup_date?: string;
    delivered_date?: string;
    edd?: string | null;
    destination?: string;
    origin?: string;
};

type TrackingActivity = {
    date?: string;
    activity?: string;
    location?: string;
    status?: string;
};

type TrackingData = {
    track_status?: number;
    shipment_status?: number;
    shipment_track?: ShipmentTrack[];
    shipment_track_activities?: TrackingActivity[] | null;
    track_url?: string;
    error?: string;
};

type TrackingResponse = Record<
    string,
    { tracking_data?: TrackingData }
>[];

export default function TrackOrderPage() {
    const [orderId, setOrderId] = useState("");
    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [matchedOrder, setMatchedOrder] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleTrackOrder(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const id = orderId.trim();

        if (!id) {
            setError("Please enter your order number.");
            return;
        }

        if (!API_URL) {
            setError("API URL is not configured.");
            return;
        }

        setLoading(true);
        setError("");
        setTracking(null);
        setMatchedOrder("");

        try {
            const response = await fetch(
                `${API_URL}/ship-rocket/track?order_id=${encodeURIComponent(id)}`
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to retrieve tracking information."
                );
            }

            const responseData = result as TrackingResponse;
            const firstRecord = responseData?.[0];
            const orderKey = firstRecord
                ? Object.keys(firstRecord)[0]
                : undefined;
            const trackingData = orderKey
                ? firstRecord[orderKey]?.tracking_data
                : undefined;

            if (!trackingData) {
                throw new Error("No tracking information was returned.");
            }

            setTracking(trackingData);
            setMatchedOrder(orderKey || id);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again."
            );
        } finally {
            setLoading(false);
        }
    }

    const shipment = tracking?.shipment_track?.[0];
    const activities = tracking?.shipment_track_activities ?? [];

    const hasTracking =
        Boolean(shipment?.awb_code) ||
        Boolean(shipment?.current_status) ||
        activities.length > 0;

    const status = shipment?.current_status ||
        (hasTracking ? "Shipment in progress" : "Tracking pending");

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900">
            <header className="border-b bg-white">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
                    <Link href="/" className="text-xl font-bold">
                        Alpha Male
                    </Link>

                    <Link
                        href="/orders"
                        className="text-sm text-blue-700 hover:underline"
                    >
                        My Orders
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-3xl px-5 py-12">
                <div className="text-center">
                    <p className="text-sm font-semibold uppercase tracking-widest text-gray-500">
                        Alpha Male
                    </p>

                    <h1 className="mt-3 text-3xl font-bold sm:text-4xl">
                        Track Your Order
                    </h1>

                    <p className="mt-3 text-gray-500">
                        Enter your order number to check your shipment status.
                    </p>
                </div>

                <form
                    onSubmit={handleTrackOrder}
                    className="mt-8 rounded-2xl border bg-white p-5 shadow-sm sm:p-7"
                >
                    <label
                        htmlFor="orderId"
                        className="mb-2 block text-sm font-medium"
                    >
                        Order Number
                    </label>

                    <div className="flex flex-col gap-3 sm:flex-row">
                        <input
                            id="orderId"
                            type="text"
                            value={orderId}
                            onChange={(event) => setOrderId(event.target.value)}
                            placeholder="e.g. ORD-1793260829747-78CA1856"
                            className="min-w-0 flex-1 rounded-lg border px-4 py-3 outline-none focus:border-gray-900"
                            required
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Checking..." : "Track Order"}
                        </button>
                    </div>

                    {error && (
                        <p
                            role="alert"
                            className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </p>
                    )}
                </form>

                {tracking && (
                    <section className="mt-7 overflow-hidden rounded-2xl border bg-white shadow-sm">
                        <div className="border-b p-5 sm:p-7">
                            <div className="flex flex-wrap items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm text-gray-500">
                                        Order Number
                                    </p>
                                    <h2 className="mt-1 break-all text-lg font-bold">
                                        {matchedOrder}
                                    </h2>
                                </div>

                                <span
                                    className={`rounded-full px-3 py-1.5 text-sm font-semibold ${hasTracking
                                            ? "bg-green-50 text-green-700"
                                            : "bg-amber-50 text-amber-700"
                                        }`}
                                >
                                    {status}
                                </span>
                            </div>

                            {!hasTracking && (
                                <div className="mt-5 rounded-xl bg-amber-50 p-4">
                                    <p className="font-medium text-amber-900">
                                        Tracking updates are not available yet
                                    </p>
                                    <p className="mt-1 text-sm leading-6 text-amber-800">
                                        {tracking.error ||
                                            "The courier tracking activities have not been received yet. Please check again later."}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="grid gap-0 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                            <div className="p-5 sm:p-6">
                                <p className="text-sm text-gray-500">
                                    Courier Partner
                                </p>
                                <p className="mt-2 font-semibold">
                                    {shipment?.courier_name || "Not assigned yet"}
                                </p>
                            </div>

                            <div className="p-5 sm:p-6">
                                <p className="text-sm text-gray-500">
                                    AWB / Tracking Number
                                </p>
                                <p className="mt-2 break-all font-semibold">
                                    {shipment?.awb_code || "Not available yet"}
                                </p>
                            </div>

                            <div className="p-5 sm:p-6">
                                <p className="text-sm text-gray-500">
                                    Estimated Delivery
                                </p>
                                <p className="mt-2 font-semibold">
                                    {shipment?.edd || "Not available yet"}
                                </p>
                            </div>

                            <div className="p-5 sm:p-6">
                                <p className="text-sm text-gray-500">
                                    Delivery Date
                                </p>
                                <p className="mt-2 font-semibold">
                                    {shipment?.delivered_date || "Pending"}
                                </p>
                            </div>
                        </div>

                        {(shipment?.origin || shipment?.destination) && (
                            <div className="border-t p-5 sm:p-7">
                                <h3 className="font-semibold">Shipment Route</h3>

                                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">
                                            From
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {shipment?.origin || "Not available"}
                                        </p>
                                    </div>

                                    <div className="rounded-lg bg-gray-50 p-4">
                                        <p className="text-xs uppercase tracking-wide text-gray-500">
                                            To
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {shipment?.destination || "Not available"}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="border-t p-5 sm:p-7">
                            <h3 className="font-semibold">Tracking History</h3>

                            {activities.length > 0 ? (
                                <div className="mt-5 space-y-5">
                                    {activities.map((activity, index) => (
                                        <div
                                            key={`${activity.date || "activity"}-${index}`}
                                            className="relative border-l-2 border-gray-200 pb-1 pl-5 last:border-transparent"
                                        >
                                            <span className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-gray-900" />

                                            <p className="font-medium">
                                                {activity.activity ||
                                                    activity.status ||
                                                    "Shipment update"}
                                            </p>

                                            {activity.date && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    {activity.date}
                                                </p>
                                            )}

                                            {activity.location && (
                                                <p className="mt-1 text-sm text-gray-500">
                                                    {activity.location}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-3 text-sm leading-6 text-gray-500">
                                    No tracking events have been recorded yet.
                                    New updates will appear here when Shiprocket
                                    receives them.
                                </p>
                            )}

                            {tracking.track_url && (
                                <a
                                    href={tracking.track_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-6 inline-flex rounded-lg bg-gray-900 px-5 py-3 text-sm font-semibold text-white hover:bg-gray-700"
                                >
                                    View Courier Tracking →
                                </a>
                            )}
                        </div>
                    </section>
                )}

                <p className="mt-8 text-center text-sm text-gray-500">
                    Need help with your order?{" "}
                    <Link href="/contact" className="font-medium text-gray-900 underline">
                        Contact us
                    </Link>
                </p>
            </div>
        </main>
    );
}
