
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

    const subtotal = items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
    );

    const formatPrice = (price: number) =>
        price.toLocaleString("en-IN", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                aria-label="Close cart"
                onClick={onClose}
                className="absolute inset-0 h-full w-full bg-black/50"
            />

            <aside
                role="dialog"
                aria-modal="true"
                aria-label="Shopping cart"
                className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl"
            >
                <header className="flex items-center justify-between border-b p-5">
                    <h2 className="text-xl font-semibold">
                        Your Cart ({items.reduce((sum, item) => sum + item.quantity, 0)})
                    </h2>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Close cart"
                        className="rounded p-2 text-2xl hover:bg-gray-100"
                    >
                        ×
                    </button>
                </header>

                <div className="flex-1 overflow-y-auto p-5">
                    {items.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-gray-600">Your cart is empty.</p>
                            <button
                                type="button"
                                onClick={onClose}
                                className="mt-4 font-medium text-blue-700 hover:underline"
                            >
                                Continue shopping
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-5">
                            {items.map((item) => (
                                <div key={item._id} className="flex gap-4">
                                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-gray-100">
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
                                        <h3 className="font-medium">{item.name}</h3>

                                        <p className="mt-1 text-sm text-gray-600">
                                            ₹{formatPrice(Number(item.price))}
                                        </p>

                                        <div className="mt-3 flex items-center gap-3">
                                            <button
                                                type="button"
                                                aria-label={`Decrease quantity of ${item.name}`}
                                                onClick={() =>
                                                    onUpdateQuantity(item._id, item.quantity - 1)
                                                }
                                                className="h-8 w-8 rounded border hover:bg-gray-100"
                                            >
                                                −
                                            </button>

                                            <span className="min-w-4 text-center text-sm">
                                                {item.quantity}
                                            </span>

                                            <button
                                                type="button"
                                                aria-label={`Increase quantity of ${item.name}`}
                                                disabled={
                                                    typeof item.stock === "number" &&
                                                    item.quantity >= item.stock
                                                }
                                                onClick={() =>
                                                    onUpdateQuantity(item._id, item.quantity + 1)
                                                }
                                                className="h-8 w-8 rounded border hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40"
                                            >
                                                +
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => onUpdateQuantity(item._id, 0)}
                                                className="ml-auto text-sm text-red-600 hover:underline"
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {items.length > 0 && (
                    <footer className="space-y-4 border-t p-5">
                        <div className="flex justify-between text-base font-semibold">
                            <span>Subtotal</span>
                            <span>₹{formatPrice(subtotal)}</span>
                        </div>

                        <p className="text-xs text-gray-500">
                            Shipping and discounts are calculated at checkout.
                        </p>

                        <Link
                            href="/checkout"
                            onClick={onClose}
                            className="block w-full rounded-lg bg-blue-700 px-4 py-3 text-center font-semibold text-white hover:bg-blue-800"
                        >
                            Checkout
                        </Link>

                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full text-center text-sm text-gray-600 hover:underline"
                        >
                            Continue shopping
                        </button>
                    </footer>
                )}
            </aside>
        </div>
    );
}
