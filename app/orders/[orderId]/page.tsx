
"use client";

import { Suspense, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type Address = {
    firstName?: string;
    lastName?: string;
    name?: string;
    address?: string;
    apartment?: string;
    city?: string;
    state?: string;
    pincode?: string;
    country?: string;
    phone?: string;
};

type OrderItem = {
    productId: string;
    name: string;
    sku?: string;
    image?: string;
    price: number;
    quantity: number;
    lineTotal?: number;
};

type Transaction = {
    _id: string;
    paymentMethod: string;
    status: string;
    amount: number;
    currency: string;
    gatewayOrderId?: string;
    gatewayPaymentId?: string;
    paidAt?: string;
    createdAt?: string;
};

type Order = {
    _id: string;
    orderNumber?: string;
    items: OrderItem[];
    customer?: {
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
    };
    shippingAddress?: Address;
    billingAddress?: Address;
    subtotal: number;
    discount: number;
    shippingCharge: number;
    total: number;
    status: string;
    paymentMethod: string;
    paymentStatus: string;
    createdAt?: string;
    paymentDetails?: Transaction[];
};

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

type TrackingData = {
    track_status?: number;
    shipment_status?: number;
    shipment_track?: ShipmentTrack[];
    shipment_track_activities?: Array<{
        date?: string;
        activity?: string;
        location?: string;
        status?: string;
    }> | null;
    track_url?: string;
    error?: string;
};

type TrackingResponse = Record<
    string,
    { tracking_data?: TrackingData }
>[];

function formatPrice(amount: number) {
    return `₹${Number(amount || 0).toLocaleString("en-IN", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    })}`;
}

function AddressCard({
    title,
    address,
}: {
    title: string;
    address?: Address;
}) {
    if (!address) {
        return (
            <section className="rounded-xl border bg-white p-5">
                <h2 className="font-semibold">{title}</h2>
                <p className="mt-3 text-sm text-gray-500">
                    No address information available.
                </p>
            </section>
        );
    }

    const fullName =
        address.name ||
        [address.firstName, address.lastName].filter(Boolean).join(" ");

    const location = [
        address.city,
        address.state,
        address.pincode,
    ].filter(Boolean).join(", ");

    return (
        <section className="rounded-xl border bg-white p-5">
            <h2 className="font-semibold">{title}</h2>
            <div className="mt-3 space-y-1 text-sm leading-6 text-gray-600">
                {fullName && (
                    <p className="font-medium text-gray-900">{fullName}</p>
                )}
                {address.address && <p>{address.address}</p>}
                {address.apartment && <p>{address.apartment}</p>}
                {location && <p>{location}</p>}
                {address.country && <p>{address.country}</p>}
                {address.phone && <p>Phone: {address.phone}</p>}
            </div>
        </section>
    );
}

export default function OrderDetailsPage() {
    return (
        <Suspense
            fallback={
                <main className="min-h-screen bg-gray-50 p-10 text-center text-gray-500">
                    Loading order details...
                </main>
            }
        >
            <OrderDetailsContent />
        </Suspense>
    );
}

function OrderDetailsContent() {
    const params = useParams<{ orderId: string }>();
    const orderId = params.orderId;

    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [tracking, setTracking] = useState<TrackingData | null>(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [trackingError, setTrackingError] = useState("");
    const [statusUpdating, setStatusUpdating] = useState(false);
    const [statusMessage, setStatusMessage] = useState("");

    useEffect(() => {
        if (!order?.orderNumber) return;

        const controller = new AbortController();

        async function fetchTracking() {
            try {
                setTrackingLoading(true);
                setTrackingError("");

                const response = await fetch(
                    `${API_URL}/ship-rocket/track?order_id=${encodeURIComponent(
                        order!.orderNumber!
                    )}`,
                    { signal: controller.signal }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to load tracking information."
                    );
                }

                const trackingData = (result as TrackingResponse)?.[0];
                const data = trackingData
                    ? Object.values(trackingData)[0]?.tracking_data
                    : undefined;

                setTracking(data ?? null);
            } catch (err) {
                if (controller.signal.aborted) return;

                setTrackingError(
                    err instanceof Error
                        ? err.message
                        : "Unable to load tracking information."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setTrackingLoading(false);
                }
            }
        }

        fetchTracking();

        return () => controller.abort();
    }, [order?.orderNumber]);

    useEffect(() => {
        if (!orderId) {
            setError("Invalid order ID.");
            setLoading(false);
            return;
        }

        const controller = new AbortController();

        async function fetchOrder() {
            setLoading(true);
            setError("");

            try {
                if (!API_URL) {
                    throw new Error("API URL is not configured.");
                }

                const accessToken = localStorage.getItem("accessToken");
                const guestId = localStorage.getItem("guestId");

                const headers: Record<string, string> = {};

                if (accessToken) {
                    headers.Authorization = `Bearer ${accessToken}`;
                }

                if (guestId) {
                    headers["x-guest-id"] = guestId;
                }

                const response = await fetch(
                    `${API_URL}/orders/info/${encodeURIComponent(orderId)}`,
                    {
                        headers,
                        signal: controller.signal,
                    }
                );

                const result = await response.json();

                if (!response.ok) {
                    throw new Error(
                        result.message || "Unable to load order details."
                    );
                }

                setOrder(result as Order);
            } catch (err) {
                if (controller.signal.aborted) return;

                setError(
                    err instanceof Error
                        ? err.message
                        : "Something went wrong."
                );
            } finally {
                if (!controller.signal.aborted) {
                    setLoading(false);
                }
            }
        }

        fetchOrder();

        return () => controller.abort();
    }, [orderId]);

    async function updateOrderStatus(status: string) {
        if (!order || statusUpdating) return;

        const isCancel = status === "CANCELLED";

        const confirmed = window.confirm(
            isCancel
                ? "Are you sure you want to cancel this order?"
                : "Do you want to request a return for this order?"
        );

        if (!confirmed) return;

        try {
            setStatusUpdating(true);
            setStatusMessage("");

            const accessToken = localStorage.getItem("accessToken");
            const guestId = localStorage.getItem("guestId");

            const headers: Record<string, string> = {
                "Content-Type": "application/json",
            };

            if (accessToken) {
                headers.Authorization = `Bearer ${accessToken}`;
            }

            if (guestId) {
                headers["x-guest-id"] = guestId;
            }

            const response = await fetch(
                `${API_URL}/orders/user/${encodeURIComponent(order._id)}/status`,
                {
                    method: "PATCH",
                    headers,
                    body: JSON.stringify({ status }),
                }
            );

            const result = await response.json();

            if (!response.ok) {
                throw new Error(
                    result.message || "Unable to update order status."
                );
            }

            setOrder((previous) =>
                previous ? { ...previous, status } : previous
            );

            setStatusMessage(
                isCancel
                    ? "Order cancelled successfully."
                    : "Return requested successfully."
            );
        } catch (err) {
            setStatusMessage(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setStatusUpdating(false);
        }
    }

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
                        All Orders
                    </Link>
                </div>
            </header>

            <section className="mx-auto max-w-5xl px-5 py-10">
                {loading && (
                    <p className="py-16 text-center text-gray-500">
                        Loading order details...
                    </p>
                )}

                {!loading && error && (
                    <div className="rounded-xl border border-red-200 bg-white p-6">
                        <h1 className="font-semibold">Unable to load order</h1>
                        <p className="mt-2 text-sm text-red-700">{error}</p>
                        <Link
                            href="/orders"
                            className="mt-4 inline-block text-sm text-blue-700 underline"
                        >
                            Return to My Orders
                        </Link>
                    </div>
                )}

                {!loading && !error && order && (
                    <>
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                            <div>
                                <h1 className="text-2xl font-bold">
                                    Order Details
                                </h1>
                                <p className="mt-2 break-all text-sm text-gray-500">
                                    Order #{order.orderNumber || order._id}
                                </p>
                                {order.createdAt && (
                                    <p className="mt-1 text-sm text-gray-500">
                                        Placed on{" "}
                                        {new Date(order.createdAt).toLocaleString("en-IN")}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-col items-start gap-3">
                                <div className="flex flex-wrap gap-2 text-xs font-medium">
                                    <span className="rounded-full bg-blue-50 px-3 py-2 text-blue-700">
                                        {order.status}
                                    </span>

                                    <span className="rounded-full bg-green-50 px-3 py-2 text-green-700">
                                        Payment: {order.paymentStatus}
                                    </span>
                                </div>

                                {order.status.toUpperCase() === "DELIVERED" ? (
                                    <button
                                        type="button"
                                        disabled={statusUpdating}
                                        onClick={() => updateOrderStatus("RETURN_REQUESTED")}
                                        className="rounded-lg border border-orange-300 px-4 py-2 text-sm font-semibold text-orange-700 hover:bg-orange-50 disabled:opacity-50"
                                    >
                                        {statusUpdating ? "Please wait..." : "Return Order"}
                                    </button>
                                ) : ![
                                    "CANCELLED",
                                    "CANCELLATION_REQUESTED",
                                    "DELIVERED",
                                    "SHIPPED",
                                    "OUT_FOR_DELIVERY",
                                    "RETURN_REQUESTED",
                                    "RETURN_INITIATED",
                                    "RETURN_COMPLETED",
                                ].includes(order.status.toUpperCase()) ? (
                                    <button
                                        type="button"
                                        disabled={statusUpdating}
                                        onClick={() => updateOrderStatus("CANCELLATION_REQUESTED")}
                                        className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
                                    >
                                        {statusUpdating ? "Please wait..." : "Cancel Order"}
                                    </button>
                                ) : null}

                                {statusMessage && (
                                    <p className="text-sm text-gray-600" role="status">
                                        {statusMessage}
                                    </p>
                                )}
                            </div>
                        </div>

                        <section className="mt-8 rounded-xl border bg-white p-5">
                            <h2 className="font-semibold">Items Ordered</h2>
                            <div className="mt-4 divide-y">
                                {order.items?.map((item, index) => (
                                    <div
                                        key={`${item.productId}-${index}`}
                                        className="flex gap-4 py-4"
                                    >
                                        <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-gray-50">
                                            {item.image ? (
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                                                    No image
                                                </div>
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="font-medium">{item.name}</h3>
                                            {item.sku && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    SKU: {item.sku}
                                                </p>
                                            )}
                                            <p className="mt-1 text-sm text-gray-500">
                                                {formatPrice(item.price)} × {item.quantity}
                                            </p>
                                        </div>

                                        <p className="whitespace-nowrap text-sm font-semibold">
                                            {formatPrice(
                                                item.lineTotal ?? item.price * item.quantity
                                            )}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <section className="mt-5 rounded-xl border bg-white p-5">
                            <h2 className="font-semibold">Price Summary</h2>
                            <div className="mt-4 space-y-3 text-sm">
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">Subtotal</span>
                                    <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">Discount</span>
                                    <span className="text-green-700">
                                        −{formatPrice(order.discount)}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-4">
                                    <span className="text-gray-500">Shipping</span>
                                    <span>{formatPrice(order.shippingCharge)}</span>
                                </div>
                                <div className="flex justify-between gap-4 border-t pt-4 text-base font-bold">
                                    <span>Total</span>
                                    <span>{formatPrice(order.total)}</span>
                                </div>
                            </div>
                        </section>

                        <section className="mt-5 grid gap-5 md:grid-cols-2">
                            <AddressCard
                                title="Shipping Address"
                                address={order.shippingAddress}
                            />
                            <AddressCard
                                title="Billing Address"
                                address={order.billingAddress}
                            />
                        </section>

                        <section className="mt-5 rounded-xl border bg-white p-5">
                            <h2 className="font-semibold">Payment Information</h2>
                            <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
                                <div>
                                    <p className="text-gray-500">Payment Method</p>
                                    <p className="mt-1 font-medium">{order.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-gray-500">Payment Status</p>
                                    <p className="mt-1 font-medium">{order.paymentStatus}</p>
                                </div>
                            </div>

                            {order.paymentDetails?.length ? (
                                <div className="mt-5 space-y-4 border-t pt-4">
                                    {order.paymentDetails.map((payment) => (
                                        <div
                                            key={payment._id}
                                            className="rounded-lg bg-gray-50 p-4 text-sm"
                                        >
                                            <div className="flex justify-between gap-3">
                                                <span className="text-gray-500">Transaction</span>
                                                <span className="font-medium">{payment.status}</span>
                                            </div>
                                            <div className="mt-2 flex justify-between gap-3">
                                                <span className="text-gray-500">Amount</span>
                                                <span>
                                                    {formatPrice(payment.amount)} {payment.currency}
                                                </span>
                                            </div>
                                            {payment.gatewayPaymentId && (
                                                <div className="mt-2">
                                                    <p className="text-gray-500">Payment ID</p>
                                                    <p className="mt-1 break-all">
                                                        {payment.gatewayPaymentId}
                                                    </p>
                                                </div>
                                            )}
                                            {payment.paidAt && (
                                                <div className="mt-2">
                                                    <p className="text-gray-500">Paid At</p>
                                                    <p className="mt-1">
                                                        {new Date(payment.paidAt).toLocaleString("en-IN")}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="mt-4 text-sm text-gray-500">
                                    No payment transaction details are available yet.
                                </p>
                            )}
                        </section>

                        <section className="mt-5 rounded-xl border bg-white p-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold">Shipment Tracking</h2>

                                {tracking?.track_url && (
                                    <a
                                        href={tracking.track_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-sm font-medium text-blue-700 hover:underline"
                                    >
                                        Track Shipment →
                                    </a>
                                )}
                            </div>

                            {trackingLoading && (
                                <p className="mt-4 text-sm text-gray-500">
                                    Loading tracking information...
                                </p>
                            )}

                            {!trackingLoading && trackingError && (
                                <p className="mt-4 text-sm text-red-600">
                                    {trackingError}
                                </p>
                            )}

                            {!trackingLoading && !trackingError && tracking && (() => {
                                const shipment = tracking.shipment_track?.[0];
                                const activities = tracking.shipment_track_activities ?? [];
                                const hasTracking =
                                    Boolean(shipment?.awb_code) ||
                                    Boolean(shipment?.current_status) ||
                                    activities.length > 0;

                                return (
                                    <div className="mt-4 space-y-4">
                                        <div>
                                            <p className="text-sm text-gray-500">Status</p>
                                            <p className="mt-1 font-semibold">
                                                {shipment?.current_status ||
                                                    (hasTracking ? "Shipment in progress" : "Tracking pending")}
                                            </p>
                                            {!hasTracking && (
                                                <p className="mt-1 text-sm text-gray-500">
                                                    Shiprocket has not received tracking activities yet.
                                                    Please check again later.
                                                </p>
                                            )}
                                        </div>

                                        {shipment?.courier_name && (
                                            <div>
                                                <p className="text-sm text-gray-500">Courier</p>
                                                <p className="mt-1 font-medium">
                                                    {shipment.courier_name}
                                                </p>
                                            </div>
                                        )}

                                        {shipment?.awb_code && (
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    AWB / Tracking Number
                                                </p>
                                                <p className="mt-1 break-all font-medium">
                                                    {shipment.awb_code}
                                                </p>
                                            </div>
                                        )}

                                        {(shipment?.origin || shipment?.destination) && (
                                            <div className="grid gap-4 sm:grid-cols-2">
                                                {shipment.origin && (
                                                    <div>
                                                        <p className="text-sm text-gray-500">Origin</p>
                                                        <p className="mt-1">{shipment.origin}</p>
                                                    </div>
                                                )}

                                                {shipment.destination && (
                                                    <div>
                                                        <p className="text-sm text-gray-500">
                                                            Destination
                                                        </p>
                                                        <p className="mt-1">
                                                            {shipment.destination}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {shipment?.edd && (
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    Estimated Delivery
                                                </p>
                                                <p className="mt-1 font-medium">
                                                    {shipment.edd}
                                                </p>
                                            </div>
                                        )}

                                        {shipment?.delivered_date && (
                                            <div>
                                                <p className="text-sm text-gray-500">
                                                    Delivered On
                                                </p>
                                                <p className="mt-1 font-medium">
                                                    {shipment.delivered_date}
                                                </p>
                                            </div>
                                        )}

                                        {activities.length > 0 && (
                                            <div className="border-t pt-4">
                                                <h3 className="font-medium">Tracking History</h3>

                                                <div className="mt-3 space-y-4">
                                                    {activities.map((activity, index) => (
                                                        <div
                                                            key={`${activity.date ?? "event"}-${index}`}
                                                            className="border-l-2 border-blue-200 pl-4"
                                                        >
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
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}

                            {!trackingLoading && !trackingError && !tracking && (
                                <p className="mt-4 text-sm text-gray-500">
                                    Tracking information is not available yet.
                                </p>
                            )}
                        </section>

                        <Link
                            href="/orders"
                            className="mt-6 inline-flex rounded-lg border bg-white px-5 py-3 text-sm font-semibold hover:bg-gray-100"
                        >
                            ← Back to My Orders
                        </Link>
                    </>
                )}
            </section>
        </main>
    );
}
