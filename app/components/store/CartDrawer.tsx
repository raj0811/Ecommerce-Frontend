
"use client";

import Link from "next/link";
import type { StoreProduct } from "./ProductSection";

export type CartItem = StoreProduct & {
    quantity: number;
};

type CartDrawerProps = {
    open: boolean;
    items: CartItem[];
    onClose: () => void;
    onUpdateQuantity: (
        productId: string,
        quantity: number
    ) => void | Promise<void>;
};

export default function CartDrawer({
    open,
    items,
    onClose,
    onUpdateQuantity,
}: CartDrawerProps) {
    if (!open) return null;

    const cartCount = items.reduce(
        (sum, item) => sum + item.quantity,
        0
    );

    const subtotal = items.reduce(
        (sum, item) =>
            sum + Number(item.price) * item.quantity,
        0
    );

    const onlineSavings = subtotal * 0.12;

    const formatPrice = (price: number) =>
        price.toLocaleString("en-IN", {
            minimumFractionDigits: 0,
            maximumFractionDigits: 2,
        });

    return (
        <div className="fixed inset-0 z-[100]">
            {/* Backdrop */}
            <button
                type="button"
                aria-label="Close cart"
                onClick={onClose}
                className="absolute inset-0 bg-black/50"
            />

            {/* Drawer */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Shopping cart"
                className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-[#fffdfa] text-gray-900 shadow-2xl"
            >
                {/* Header */}
                <header className="flex items-center justify-between border-b border-[#eee8e2] px-5 py-5">
                    <h2 className="text-lg font-semibold">
                        Your cart ({cartCount})
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        className="text-xl text-gray-500 hover:text-black"
                        aria-label="Close cart"
                    >
                        ×
                    </button>
                </header>

                {/* Items */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {items.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-gray-600">
                                Your cart is empty.
                            </p>

                            <button
                                onClick={onClose}
                                className="mt-4 text-sm font-semibold underline"
                            >
                                Continue shopping
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-5">
                                {items.map((item) => (
                                    <div
                                        key={item._id}
                                        className="flex gap-3 border-b border-[#eee8e2] pb-4"
                                    >
                                        {/* Image */}
                                        <div className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded-lg bg-gray-100">
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

                                        {/* Product details */}
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-start justify-between gap-2">
                                                <h3 className="text-sm font-semibold text-gray-900">
                                                    {item.name}
                                                </h3>

                                                <span className="whitespace-nowrap text-sm font-semibold">
                                                    ₹{formatPrice(
                                                        Number(item.price) *
                                                        item.quantity
                                                    )}
                                                </span>
                                            </div>

                                            <p className="mt-1 text-xs text-gray-500">
                                                ₹{formatPrice(Number(item.price))} each
                                            </p>

                                            <div className="mt-3 flex items-center justify-between">
                                                {/* Quantity */}
                                                <div className="flex items-center overflow-hidden rounded-full border border-[#e5ddd5]">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            onUpdateQuantity(
                                                                item._id,
                                                                item.quantity - 1
                                                            )
                                                        }
                                                        className="h-8 w-8 text-sm hover:bg-gray-100"
                                                        aria-label="Decrease quantity"
                                                    >
                                                        −
                                                    </button>

                                                    <span className="min-w-8 text-center text-xs font-medium">
                                                        {item.quantity}
                                                    </span>

                                                    <button
                                                        type="button"
                                                        disabled={
                                                            typeof item.stock === "number" &&
                                                            item.quantity >= item.stock
                                                        }
                                                        onClick={() =>
                                                            onUpdateQuantity(
                                                                item._id,
                                                                item.quantity + 1
                                                            )
                                                        }
                                                        className="h-8 w-8 text-sm hover:bg-gray-100 disabled:opacity-40"
                                                        aria-label="Increase quantity"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        onUpdateQuantity(item._id, 0)
                                                    }
                                                    className="text-xs text-red-600 hover:underline"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Online payment offer */}
                            <div className="mt-5 rounded-lg border border-dashed border-[#c6a78b] bg-[#faf3ec] p-3">
                                <div className="flex items-center gap-2">
                                    <span className="text-lg">✦</span>
                                    <p className="text-sm font-semibold text-[#704b32]">
                                        Exclusive online payment offer
                                    </p>
                                </div>

                                <p className="mt-1 text-xs text-gray-600">
                                    Save 12% OFF when you pay online with Razorpay.
                                </p>

                                <p className="mt-2 text-sm font-semibold text-green-700">
                                    You save ₹{formatPrice(onlineSavings)}
                                </p>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <footer className="border-t border-[#eee8e2] bg-white px-5 py-5">
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600">
                                    Subtotal
                                </span>
                                <span className="font-medium">
                                    ₹{formatPrice(subtotal)}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-green-700">
                                    Online payment savings (12%)
                                </span>
                                <span className="font-medium text-green-700">
                                    −₹{formatPrice(onlineSavings)}
                                </span>
                            </div>

                            <div className="border-t border-gray-200 pt-3">
                                <div className="flex justify-between text-base font-bold">
                                    <span>Estimated online total</span>
                                    <span>
                                        ₹{formatPrice(subtotal - onlineSavings)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="mt-3 text-xs text-gray-500">
                            Final discount is applied at checkout when online
                            payment is selected.
                        </p>

                        {/* Actions */}
                        <div className="mt-4 flex items-center gap-3">
                            <Link
                                href="/cart"
                                onClick={onClose}
                                className="rounded-lg border border-gray-300 px-4 py-3 text-center text-sm font-semibold text-gray-800 hover:bg-gray-50"
                            >
                                View Cart
                            </Link>

                            <Link
                                href="/checkout"
                                onClick={onClose}
                                className="flex-1 rounded-lg bg-[#171412] px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-[#382b24]"
                            >
                                Checkout · ₹{formatPrice(subtotal)}
                            </Link>
                        </div>

                        <p className="mt-4 text-center text-[10px] tracking-wide text-gray-500">
                            Secure payments · Plain packaging · Private billing
                        </p>
                    </footer>
                )}
            </aside>
        </div>
    );
}
