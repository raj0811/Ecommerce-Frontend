
"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import useCart from "@/hooks/useCart";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type PaymentMethod = "COD" | "RAZORPAY";

function getCheckoutRequestId() {
    const key = "alphaMaleCheckoutRequestId";
    let id = sessionStorage.getItem(key);

    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(key, id);
    }

    return id;
}

function getGuestId() {
    const key = "guestId";
    let id = localStorage.getItem(key);

    if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem(key, id);
    }

    return id;
}

export default function CheckoutPage() {
    const { items, loading, clearCart } = useCart();

    const [paymentMethod, setPaymentMethod] =
        useState<PaymentMethod>("COD");

    const [billingDifferent, setBillingDifferent] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    const [form, setForm] = useState({
        email: "",
        firstName: "",
        lastName: "",
        address: "",
        apartment: "",
        city: "",
        state: "",
        pincode: "",
        phone: "",
        billingAddress: "",
        billingCity: "",
        billingState: "",
        billingPincode: "",
    });

    useEffect(() => {
        setIsLoggedIn(Boolean(localStorage.getItem("accessToken")));
    }, []);

    const subtotal = items.reduce(
        (sum, item) =>
            sum + Number(item.price) * item.quantity,
        0,
    );

    // COD is allowed strictly below ₹3,000.
    const codBlocked = subtotal >= 3000;

    const onlineDiscount =
        paymentMethod === "RAZORPAY"
            ? subtotal * 0.05
            : 0;

    const total = Math.max(0, subtotal - onlineDiscount);

    const formatPrice = (amount: number) =>
        amount.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    function updateField(name: string, value: string) {
        setForm((previous) => ({
            ...previous,
            [name]: value,
        }));
    }

    useEffect(() => {
        if (codBlocked && paymentMethod === "COD") {
            setPaymentMethod("RAZORPAY");
        }
    }, [codBlocked, paymentMethod]);

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setError("");

        if (!items.length) {
            setError("Your cart is empty.");
            return;
        }

        if (!API_URL) {
            setError("NEXT_PUBLIC_API_URL is not configured.");
            return;
        }

        if (paymentMethod === "COD" && subtotal >= 3000) {
            setError(
                "Cash on Delivery is available only for orders below ₹3,000.",
            );
            return;
        }

        setSubmitting(true);

        try {
            const token = localStorage
                .getItem("accessToken")
                ?.trim();

            // Generate a guest ID if the customer is not logged in.
            const guestId = token ? null : getGuestId();

            const checkoutRequestId = getCheckoutRequestId();

            const headers = new Headers({
                "Content-Type": "application/json",
                "Idempotency-Key": checkoutRequestId,
            });

            // Logged-in customer.
            if (token) {
                headers.set("Authorization", `Bearer ${token}`);
            }

            const requestBody = {
                checkoutRequestId,

                // Guest identity is sent only for guest checkout.
                ...(!token && guestId ? { guestId } : {}),

                customer: {
                    email: form.email.trim(),
                    firstName: form.firstName.trim(),
                    lastName: form.lastName.trim(),
                    phone: form.phone.trim(),
                },

                shippingAddress: {
                    address: form.address.trim(),
                    apartment: form.apartment.trim() || undefined,
                    city: form.city.trim(),
                    state: form.state.trim(),
                    pincode: form.pincode.trim(),
                    country: "India",
                },

                billingAddress: billingDifferent
                    ? {
                        address: form.billingAddress.trim(),
                        city: form.billingCity.trim(),
                        state: form.billingState.trim(),
                        pincode: form.billingPincode.trim(),
                        country: "India",
                    }
                    : undefined,

                items: items.map((item) => ({
                    product_id: item._id,
                    qty: item.quantity,
                })),
            };

            // =====================================
            // COD CHECKOUT
            // =====================================

            if (paymentMethod === "COD") {
                const response = await fetch(
                    `${API_URL}/payments/create-cod-order`,
                    {
                        method: "POST",
                        headers,
                        body: JSON.stringify(requestBody),
                    },
                );

                const result = await response.json().catch(() => ({}));

                if (!response.ok) {
                    throw new Error(
                        Array.isArray(result.message)
                            ? result.message.join(", ")
                            : result.message ||
                            "Unable to place COD order.",
                    );
                }

                if (!result.orderId) {
                    throw new Error(
                        "COD order was created but order ID was not returned.",
                    );
                }

                clearCart();

                sessionStorage.removeItem(
                    "alphaMaleCheckoutRequestId",
                );

                window.location.href = `/orders/${result.orderId}`;

                return;
            }

            // =====================================
            // RAZORPAY CHECKOUT
            // =====================================

            const response = await fetch(
                `${API_URL}/payments/create-order`,
                {
                    method: "POST",
                    headers,
                    body: JSON.stringify(requestBody),
                },
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
                throw new Error(
                    Array.isArray(result.message)
                        ? result.message.join(", ")
                        : result.message ||
                        "Unable to create payment order.",
                );
            }

            if (!result.payment_url) {
                throw new Error(
                    "Payment URL was not returned by the server.",
                );
            }

            window.location.href = result.payment_url;

        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong. Please try again.",
            );

            setSubmitting(false);
        }
    }

    const inputClass =
        "w-full min-w-0 rounded-lg border border-gray-300 bg-white px-3 py-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600";

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center">
                Loading checkout...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white text-gray-900">
            <header className="border-b border-gray-200">
                <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
                    <Link href="/" className="text-xl font-bold">
                        Alpha Male
                    </Link>

                    <Link
                        href="/"
                        className="text-sm text-blue-700 hover:underline"
                    >
                        Continue shopping
                    </Link>
                </div>
            </header>

            <div className="mx-auto grid max-w-5xl grid-cols-1 lg:grid-cols-[1.15fr_0.85fr]">
                <section className="px-5 py-8 sm:px-8 lg:py-10">
                    <h1 className="mb-7 text-2xl font-semibold">
                        Checkout
                    </h1>

                    <form
                        onSubmit={handleSubmit}
                        className="space-y-8"
                    >
                        {/* Contact */}
                        <section>
                            <div className="mb-3 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">
                                    Contact
                                </h2>

                                {!isLoggedIn && (
                                    <Link
                                        href="/user/login?redirect=/checkout"
                                        className="text-sm text-blue-700 underline"
                                    >
                                        Sign in
                                    </Link>
                                )}
                            </div>

                            <input
                                required
                                type="email"
                                autoComplete="email"
                                placeholder="Email address"
                                value={form.email}
                                onChange={(e) =>
                                    updateField("email", e.target.value)
                                }
                                className={inputClass}
                            />

                            <label className="mt-3 flex items-center gap-2 text-sm">
                                <input
                                    type="checkbox"
                                    className="h-4 w-4 accent-blue-600"
                                />
                                Email me with news and offers
                            </label>
                        </section>

                        {/* Delivery */}
                        <section>
                            <h2 className="mb-4 text-lg font-semibold">
                                Delivery
                            </h2>

                            <p className="mb-3 rounded-lg border border-gray-200 px-3 py-3 text-sm">
                                Country / Region: India
                            </p>

                            <div className="grid grid-cols-2 gap-3">
                                <input
                                    required
                                    placeholder="First name"
                                    autoComplete="given-name"
                                    value={form.firstName}
                                    onChange={(e) =>
                                        updateField("firstName", e.target.value)
                                    }
                                    className={inputClass}
                                />

                                <input
                                    required
                                    placeholder="Last name"
                                    autoComplete="family-name"
                                    value={form.lastName}
                                    onChange={(e) =>
                                        updateField("lastName", e.target.value)
                                    }
                                    className={inputClass}
                                />
                            </div>

                            <input
                                required
                                placeholder="Address"
                                autoComplete="street-address"
                                value={form.address}
                                onChange={(e) =>
                                    updateField("address", e.target.value)
                                }
                                className={`${inputClass} mt-3`}
                            />

                            <input
                                placeholder="Apartment, suite, etc. (optional)"
                                autoComplete="address-line2"
                                value={form.apartment}
                                onChange={(e) =>
                                    updateField("apartment", e.target.value)
                                }
                                className={`${inputClass} mt-3`}
                            />

                            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                                <input
                                    required
                                    placeholder="City"
                                    autoComplete="address-level2"
                                    value={form.city}
                                    onChange={(e) =>
                                        updateField("city", e.target.value)
                                    }
                                    className={inputClass}
                                />

                                <input
                                    required
                                    placeholder="State"
                                    autoComplete="address-level1"
                                    value={form.state}
                                    onChange={(e) =>
                                        updateField("state", e.target.value)
                                    }
                                    className={inputClass}
                                />

                                <input
                                    required
                                    placeholder="PIN code"
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    autoComplete="postal-code"
                                    value={form.pincode}
                                    onChange={(e) =>
                                        updateField("pincode", e.target.value)
                                    }
                                    className={inputClass}
                                />
                            </div>

                            <input
                                required
                                type="tel"
                                placeholder="Phone number"
                                autoComplete="tel"
                                pattern="[0-9+\-\s]{10,15}"
                                value={form.phone}
                                onChange={(e) =>
                                    updateField("phone", e.target.value)
                                }
                                className={`${inputClass} mt-3`}
                            />
                        </section>

                        {/* Shipping method */}
                        <section>
                            <h2 className="mb-3 text-lg font-semibold">
                                Shipping method
                            </h2>

                            <div className="rounded-lg bg-gray-100 px-4 py-5 text-center text-sm text-gray-500">
                                Shipping charges will be confirmed based on
                                your delivery address.
                            </div>
                        </section>

                        {/* Payment */}
                        <section>
                            <h2 className="text-lg font-semibold">
                                Payment
                            </h2>

                            <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-4">
                                <p className="font-semibold text-green-800">
                                    Get 5% OFF with Online Payment!
                                </p>

                                <p className="mt-1 text-sm text-green-700">
                                    Pay online with Razorpay and save 5% on
                                    your order.
                                </p>
                            </div>

                            <p className="mt-3 text-sm text-gray-500">
                                All transactions are secure and encrypted.
                            </p>

                            <div className="mt-4 overflow-hidden rounded-xl border border-gray-300">
                                <label
                                    className={`flex items-center gap-3 border-b border-gray-200 p-4 ${codBlocked
                                            ? "cursor-not-allowed bg-gray-100 opacity-50"
                                            : "cursor-pointer bg-white"
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="COD"
                                        checked={paymentMethod === "COD"}
                                        disabled={codBlocked}
                                        onChange={() =>
                                            setPaymentMethod("COD")
                                        }
                                        className="h-4 w-4 accent-blue-600"
                                    />

                                    <span className="text-sm font-medium">
                                        Cash on Delivery (COD)
                                    </span>
                                </label>

                                <label className="flex cursor-pointer items-center gap-3 p-4">
                                    <input
                                        type="radio"
                                        name="paymentMethod"
                                        value="RAZORPAY"
                                        checked={paymentMethod === "RAZORPAY"}
                                        onChange={() =>
                                            setPaymentMethod("RAZORPAY")
                                        }
                                        className="h-4 w-4 accent-blue-600"
                                    />

                                    <span className="text-sm font-medium">
                                        Razorpay — 5% OFF
                                    </span>
                                </label>
                            </div>

                            {codBlocked && (
                                <p className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                                    Cash on Delivery is unavailable for
                                    orders of ₹3,000 or more. Please choose
                                    online payment.
                                </p>
                            )}

                            {paymentMethod === "COD" && (
                                <p className="mt-3 rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800">
                                    After placing your order, you'll receive
                                    a WhatsApp message to confirm your COD
                                    order.
                                </p>
                            )}

                            {paymentMethod === "RAZORPAY" && (
                                <p className="mt-3 rounded-lg bg-green-50 p-3 text-sm text-green-800">
                                    Estimated saving: ₹
                                    {formatPrice(onlineDiscount)}. Final
                                    pricing is calculated by the server.
                                </p>
                            )}
                        </section>

                        {/* Billing address */}
                        <section>
                            <h2 className="mb-3 text-lg font-semibold">
                                Billing address
                            </h2>

                            <div className="overflow-hidden rounded-xl border border-gray-300">
                                <label className="flex cursor-pointer items-center gap-3 border-b border-gray-200 p-4">
                                    <input
                                        type="radio"
                                        name="billing"
                                        checked={!billingDifferent}
                                        onChange={() =>
                                            setBillingDifferent(false)
                                        }
                                        className="h-4 w-4 accent-blue-600"
                                    />

                                    <span className="text-sm">
                                        Same as shipping address
                                    </span>
                                </label>

                                <label className="flex cursor-pointer items-center gap-3 p-4">
                                    <input
                                        type="radio"
                                        name="billing"
                                        checked={billingDifferent}
                                        onChange={() =>
                                            setBillingDifferent(true)
                                        }
                                        className="h-4 w-4 accent-blue-600"
                                    />

                                    <span className="text-sm">
                                        Use a different billing address
                                    </span>
                                </label>
                            </div>

                            {billingDifferent && (
                                <div className="mt-3 space-y-3">
                                    <input
                                        required
                                        placeholder="Billing address"
                                        value={form.billingAddress}
                                        onChange={(e) =>
                                            updateField(
                                                "billingAddress",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />

                                    <input
                                        required
                                        placeholder="City"
                                        value={form.billingCity}
                                        onChange={(e) =>
                                            updateField(
                                                "billingCity",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />

                                    <input
                                        required
                                        placeholder="State"
                                        value={form.billingState}
                                        onChange={(e) =>
                                            updateField(
                                                "billingState",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />

                                    <input
                                        required
                                        placeholder="PIN code"
                                        inputMode="numeric"
                                        pattern="[0-9]{6}"
                                        maxLength={6}
                                        value={form.billingPincode}
                                        onChange={(e) =>
                                            updateField(
                                                "billingPincode",
                                                e.target.value,
                                            )
                                        }
                                        className={inputClass}
                                    />
                                </div>
                            )}
                        </section>

                        {/* Error */}
                        {error && (
                            <p
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </p>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={submitting || !items.length}
                            className="w-full rounded-xl bg-blue-700 px-5 py-4 font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting
                                ? "Processing..."
                                : paymentMethod === "COD"
                                    ? "Place COD Order"
                                    : "Continue to payment"}
                        </button>
                    </form>
                </section>

                {/* Order summary */}
                <aside className="border-t border-gray-200 bg-gray-50 px-5 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:py-10">
                    <h2 className="mb-6 text-lg font-semibold">
                        Order summary
                    </h2>

                    <div className="space-y-5">
                        {items.map((item) => (
                            <div
                                key={item._id}
                                className="flex gap-4"
                            >
                                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border bg-white">
                                    {item.images?.[0] ? (
                                        <img
                                            src={item.images[0]}
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
                                    <p className="text-sm font-medium">
                                        {item.name}
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        ₹{formatPrice(Number(item.price))} each
                                    </p>

                                    <p className="mt-1 text-xs text-gray-500">
                                        Quantity: {item.quantity}
                                    </p>
                                </div>

                                <p className="whitespace-nowrap text-sm font-medium">
                                    ₹
                                    {formatPrice(
                                        Number(item.price) * item.quantity,
                                    )}
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 space-y-3 border-t border-gray-200 pt-5 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">
                                Subtotal (estimate)
                            </span>

                            <span>₹{formatPrice(subtotal)}</span>
                        </div>

                        {onlineDiscount > 0 && (
                            <div className="flex justify-between text-green-700">
                                <span>
                                    Online payment discount (5%, estimate)
                                </span>

                                <span>
                                    −₹{formatPrice(onlineDiscount)}
                                </span>
                            </div>
                        )}

                        <div className="flex justify-between">
                            <span className="text-gray-600">
                                Shipping
                            </span>

                            <span className="text-gray-500">
                                Calculated at checkout
                            </span>
                        </div>

                        <div className="flex justify-between border-t border-gray-200 pt-4 text-base font-semibold">
                            <span>Estimated total</span>
                            <span>₹{formatPrice(total)}</span>
                        </div>
                    </div>

                    <p className="mt-6 text-xs leading-5 text-gray-500">
                        Shop and place your order as a guest. No account
                        is required.
                    </p>
                </aside>
            </div>
        </main>
    );
}
