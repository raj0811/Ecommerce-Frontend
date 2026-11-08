
"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/Components/Navbar";

type ConditionalNavbarProps = {
    cartCount: number;
    onCartClick: () => void;
};

export default function ConditionalNavbar({
    cartCount,
    onCartClick,
}: ConditionalNavbarProps) {
    const pathname = usePathname();

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
