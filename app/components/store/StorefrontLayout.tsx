
"use client";

import { useState } from "react";
import ConditionalNavbar from "./ConditionalNavbar";

export default function StorefrontLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [cartOpen, setCartOpen] = useState(false);
    const [cartCount] = useState(0);

    return (
        <>
            <ConditionalNavbar
                cartCount={cartCount}
                onCartClick={() => setCartOpen(true)}
            />

            {children}

            {cartOpen && (
                <div className="fixed inset-0 z-50 bg-black/50">
                    <div className="ml-auto h-full w-full max-w-md bg-white p-6">
                        <button
                            onClick={() => setCartOpen(false)}
                            className="mb-4"
                        >
                            Close
                        </button>
                        <p>Connect your existing CartDrawer here.</p>
                    </div>
                </div>
            )}
        </>
    );
}
