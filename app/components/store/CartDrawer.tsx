
"use client";

import type { StoreProduct } from "./ProductSection";

export type CartItem = StoreProduct & {
    quantity: number;
};

type CartDrawerProps = {
    open: boolean;
    items: CartItem[];
    onClose: () => void;
    onUpdateQuantity: (id: string, quantity: number) => void;
};

export default function CartDrawer({
    open,
    items,
    onClose,
    onUpdateQuantity,
}: CartDrawerProps) {
    if (!open) return null;

    const total = items.reduce(
        (sum, item) => sum + Number(item.price) * item.quantity,
        0
    );

    return (
        <div className="fixed inset-0 z-50">
            <button
                aria-label="Close cart"
                onClick={onClose}
                className="absolute inset-0 bg-black/40"
            />

            <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-2xl">
                <div className="flex items-center justify-between border-b p-5">
                    <div>
                        <h2 className="text-xl font-bold">Your Cart</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {items.reduce((sum, item) => sum + item.quantity, 0)} items
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="rounded-full px-3 py-2 text-gray-500 hover:bg-gray-100"
                        aria-label="Close cart"
                    >
                        ✕
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto p-5">
                    {items.length === 0 ? (
                        <div className="py-16 text-center">
                            <p className="text-lg font-semibold">Your cart is empty</p>
                            <p className="mt-2 text-sm text-gray-500">
                                Add a few products to get started.
                            </p>
                            <button
                                onClick={onClose}
                                className="mt-5 rounded-full bg-gray-900 px-5 py-3 text-white"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item._id} className="flex gap-4">
                                <div className="h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                                    {item.images?.[0] && (
                                        <img
                                            src={item.images[0]}
                                            alt={item.name}
                                            className="h-full w-full object-cover"
                                        />
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <h3 className="truncate font-semibold">{item.name}</h3>
                                    <p className="mt-1 font-bold">
                                        ₹{Number(item.price).toLocaleString("en-IN")}
                                    </p>

                                    <div className="mt-3 flex items-center gap-3">
                                        <button
                                            onClick={() =>
                                                onUpdateQuantity(item._id, item.quantity - 1)
                                            }
                                            className="h-8 w-8 rounded-full border"
                                            aria-label={`Decrease ${item.name} quantity`}
                                        >
                                            −
                                        </button>

                                        <span className="text-sm">{item.quantity}</span>

                                        <button
                                            onClick={() =>
                                                onUpdateQuantity(item._id, item.quantity + 1)
                                            }
                                            disabled={
                                                typeof item.stock === "number" &&
                                                item.quantity >= item.stock
                                            }
                                            className="h-8 w-8 rounded-full border disabled:opacity-40"
                                            aria-label={`Increase ${item.name} quantity`}
                                        >
                                            +
                                        </button>

                                        <button
                                            onClick={() => onUpdateQuantity(item._id, 0)}
                                            className="ml-auto text-sm text-red-600 hover:underline"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {items.length > 0 && (
                    <div className="border-t p-5">
                        <div className="mb-4 flex justify-between text-lg font-bold">
                            <span>Subtotal</span>
                            <span>₹{total.toLocaleString("en-IN")}</span>
                        </div>
                        <p className="mb-4 text-xs text-gray-500">
                            Shipping and taxes, if applicable, are calculated at checkout.
                        </p>
                        <button
                            onClick={() =>
                                alert("Checkout is not connected yet.")
                            }
                            className="w-full rounded-full bg-gray-900 py-3.5 font-semibold text-white hover:bg-orange-600"
                        >
                            Proceed to Checkout
                        </button>
                    </div>
                )}
            </aside>
        </div>
    );
}
