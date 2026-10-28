
"use client";

import { useCallback, useEffect, useState } from "react";
import type { CartItem } from "@/app/components/store/CartDrawer";
import type { StoreProduct } from "@/app/components/store/ProductSection";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type ApiCartItem = {
    productId: StoreProduct | string;
    quantity: number;
};

type ApiCart = {
    items: ApiCartItem[];
};

function getGuestId() {
    let guestId = localStorage.getItem("guestId");

    if (!guestId) {
        guestId = `guest_${crypto.randomUUID()}`;
        localStorage.setItem("guestId", guestId);
    }

    return guestId;
}

function getHeaders(): HeadersInit {
    return {
        "Content-Type": "application/json",
        "x-guest-id": getGuestId(),
    };
}

function normalizeCart(cart: ApiCart): CartItem[] {
    return (cart.items ?? [])
        .filter(
            (item) =>
                typeof item.productId === "object" &&
                item.productId !== null
        )
        .map((item) => ({
            ...(item.productId as StoreProduct),
            quantity: item.quantity,
        }));
}

async function requestCart(
    path: string,
    options: RequestInit = {}
) {
    if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const response = await fetch(`${API_URL}/cart${path}`, {
        ...options,
        headers: {
            ...getHeaders(),
            ...options.headers,
        },
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message = Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message;

        throw new Error(message || "Cart request failed");
    }

    return data;
}

export default function useCart() {
    const [items, setItems] = useState<CartItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [cartError, setCartError] = useState("");

    const loadCart = useCallback(async () => {
        setLoading(true);
        setCartError("");

        try {
            const cart: ApiCart = await requestCart("");
            setItems(normalizeCart(cart));
        } catch (error) {
            setCartError(
                error instanceof Error ? error.message : "Unable to load cart"
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void loadCart();
    }, [loadCart]);

    const addToCart = useCallback(async (product: StoreProduct) => {
        setCartError("");

        try {
            const cart: ApiCart = await requestCart("/items", {
                method: "POST",
                body: JSON.stringify({
                    productId: product._id,
                    quantity: 1,
                }),
            });

            setItems(normalizeCart(cart));
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unable to add product";

            setCartError(message);
            throw error;
        }
    }, []);

    const updateQuantity = useCallback(
        async (productId: string, quantity: number) => {
            setCartError("");

            try {
                if (quantity <= 0) {
                    const result = await requestCart(
                        `/items/${encodeURIComponent(productId)}`,
                        { method: "DELETE" }
                    );

                    setItems(normalizeCart(result.cart));
                    return;
                }

                const cart: ApiCart = await requestCart(
                    `/items/${encodeURIComponent(productId)}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({ quantity }),
                    }
                );

                setItems(normalizeCart(cart));
            } catch (error) {
                const message =
                    error instanceof Error
                        ? error.message
                        : "Unable to update cart";

                setCartError(message);
                throw error;
            }
        },
        []
    );

    const clearCart = useCallback(async () => {
        setCartError("");

        try {
            const result = await requestCart("", {
                method: "DELETE",
            });

            setItems(normalizeCart(result.cart));
        } catch (error) {
            const message =
                error instanceof Error ? error.message : "Unable to clear cart";

            setCartError(message);
            throw error;
        }
    }, []);

    return {
        items,
        loading,
        cartError,
        addToCart,
        updateQuantity,
        clearCart,
        refreshCart: loadCart,
    };
}
