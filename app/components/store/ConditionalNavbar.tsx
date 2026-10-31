
"use client";

import { usePathname } from "next/navigation";
import Navbar from "./Navbar";

type ConditionalNavbarProps = {
    cartCount: number;
    onCartClick: () => void;
};

export default function ConditionalNavbar({
    cartCount,
    onCartClick,
}: ConditionalNavbarProps) {
    const pathname = usePathname();

    // Hide storefront navbar on all admin routes.
    if (pathname === "/admin" || pathname.startsWith("/admin/")) {
        return null;
    }

    return (
        <Navbar
            cartCount={cartCount}
            onCartClick={onCartClick}
        />
    );
}
