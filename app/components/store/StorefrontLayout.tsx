
"use client";

import { useState } from "react";

import ConditionalNavbar from "./ConditionalNavbar";
import AnnouncementBar from "@/Components/AnnouncementBar";
import CartDrawer from "./CartDrawer";
import { CartProvider } from "@/hooks/useCart";
import useCart from "@/hooks/useCart";

function StorefrontContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const [cartOpen, setCartOpen] = useState(false);

    const { items, updateQuantity } = useCart();

    const cartCount = items.reduce(
        (total, item) => total + item.quantity,
        0
    );

    return (
        <>
            <AnnouncementBar
                messages={[
                    "Free discreet shipping over ₹999",
                    "Plain packaging, private billing",
                ]}
                interval={4000}
            />

            <ConditionalNavbar
                cartCount={cartCount}
                onCartClick={() => setCartOpen(true)}
            />

            {children}

            <CartDrawer
                open={cartOpen}
                items={items}
                onClose={() => setCartOpen(false)}
                onUpdateQuantity={updateQuantity}
            />
        </>
    );
}

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <CartProvider>
            <StorefrontContent>
                {children}
            </StorefrontContent>
        </CartProvider>
    );
}
