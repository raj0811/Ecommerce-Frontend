
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
    items?: ApiCartItem[];
};

function getGuestId(): string {
    let guestId = localStorage.getItem("guestId");

    if (!guestId) {
        guestId = `guest_${crypto.randomUUID()}`;
        localStorage.setItem("guestId", guestId);
    }

    return guestId;
}

function getHeaders(options?: RequestInit): Headers {
    const headers = new Headers(options?.headers);

    if (!headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
    }

    // Read the latest token for every request.
    const token = localStorage.getItem("accessToken")?.trim();

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        headers.delete("x-guest-id");
    } else {
        headers.delete("Authorization");
        headers.set("x-guest-id", getGuestId());
    }

    return headers;
}

function normalizeCart(cart: ApiCart): CartItem[] {
    return (cart.items ?? [])
        .filter(
            (item) =>
                typeof item.productId === "object" &&
                item.productId !== null,
        )
        .map((item) => ({
            ...(item.productId as StoreProduct),
            quantity: item.quantity,
        }));
}

function extractCart(data: unknown): ApiCart {
    if (!data || typeof data !== "object") {
        return { items: [] };
    }

    const response = data as {
        items?: ApiCartItem[];
        cart?: ApiCart;
    };

    if (response.cart && typeof response.cart === "object") {
        return response.cart;
    }

    return response;
}

async function requestCart(
    path: string,
    options: RequestInit = {},
): Promise<unknown> {
    if (!API_URL) {
        throw new Error("NEXT_PUBLIC_API_URL is not configured");
    }

    const headers = getHeaders(options);

    // Debug without exposing the token itself.
    console.log("[Cart API]", {
        path: `/cart${path}`,
        hasAccessToken: headers.has("Authorization"),
        usingGuestId: headers.has("x-guest-id"),
    });

    const response = await fetch(`${API_URL}/cart${path}`, {
        ...options,
        headers,
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
        const message = Array.isArray(data?.message)
            ? data.message.join(", ")
            : data?.message;

        throw new Error(message || `Cart request failed (${response.status})`);
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
            const result = await requestCart("");
            setItems(normalizeCart(extractCart(result)));
        } catch (error) {
            setCartError(
                error instanceof Error
                    ? error.message
                    : "Unable to load cart",
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
            const result = await requestCart("/items", {
                method: "POST",
                body: JSON.stringify({
                    productId: product._id,
                    quantity: 1,
                }),
            });

            setItems(normalizeCart(extractCart(result)));
        } catch (error) {
            setCartError(
                error instanceof Error
                    ? error.message
                    : "Unable to add product",
            );
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
                        { method: "DELETE" },
                    );

                    setItems(normalizeCart(extractCart(result)));
                    return;
                }

                if (!Number.isInteger(quantity)) {
                    throw new Error("Quantity must be a positive integer");
                }

                const result = await requestCart(
                    `/items/${encodeURIComponent(productId)}`,
                    {
                        method: "PATCH",
                        body: JSON.stringify({ quantity }),
                    },
                );

                setItems(normalizeCart(extractCart(result)));
            } catch (error) {
                setCartError(
                    error instanceof Error
                        ? error.message
                        : "Unable to update cart",
                );
                throw error;
            }
        },
        [],
    );

    const clearCart = useCallback(async () => {
        setCartError("");

        try {
            const result = await requestCart("", {
                method: "DELETE",
            });

            setItems(normalizeCart(extractCart(result)));
        } catch (error) {
            setCartError(
                error instanceof Error
                    ? error.message
                    : "Unable to clear cart",
            );
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
