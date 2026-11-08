
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useCart from "@/hooks/useCart";

type NavbarProps = {
    cartCount: number;
    onCartClick: () => void;
};;

const links = ["Shop", "Wellness", "Bundles", "Learn", "About"];

export default function Navbar({ cartCount, onCartClick }: NavbarProps) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    // Get live cart items from your existing cart hook.
    const { items, loading } = useCart();



    useEffect(() => {
        const checkLogin = () => {
            setIsLoggedIn(
                !!localStorage.getItem("accessToken")?.trim()
            );
        };

        checkLogin();

        window.addEventListener("storage", checkLogin);

        // Also update login state when another component dispatches this event.
        window.addEventListener("auth-change", checkLogin);

        return () => {
            window.removeEventListener("storage", checkLogin);
            window.removeEventListener("auth-change", checkLogin);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        setIsLoggedIn(false);
        window.dispatchEvent(new Event("auth-change"));

        router.push("/");
        router.refresh();
    };

    return (
        <header className="px-4 py-4 sm:px-8 lg:px-16 lg:py-5 bg-[#F6EEEA] text-gray-900">
            <div className="flex items-center justify-between gap-4 text-gray-900">

                <Link
                    href="/"
                    className="font-[family-name:var(--font-fraunces)] text-2xl lg:text-[28px] text-black-500"
                >
                    Alpha Male
                </Link>

                <nav
                    aria-label="Main"
                    className="hidden gap-8 text-[15px] font-medium md:flex"
                >

                    <Link
                        href="/"
                        className="hover:underline"
                    >
                        Shop
                    </Link>

                    <Link
                        href="/"
                        className="hover:underline"
                    >
                        About
                    </Link>
                    <Link
                        href="/"
                        className="hover:underline"
                    >
                        Contact
                    </Link>

                    <Link
                        href="/products"
                        className="hover:underline"
                    >
                        Products
                    </Link>

                </nav>

                <div className="flex items-center gap-4 text-[15px] md:gap-6">

                    {isLoggedIn ? (
                        <>
                            <Link
                                href="/orders"
                                className="text-gray-900 hover:text-orange-600"
                            >
                                My Orders
                            </Link>

                            <Link
                                href="/ticket"
                                className="text-gray-900 hover:text-orange-600"
                            >
                                Support Tickets
                            </Link>

                            <Link
                                href="/user/profile"
                                className="text-gray-900 hover:text-orange-600"
                            >
                                Profile
                            </Link>
                        </>
                    ) : (
                        <>
                            <Link
                                href="/user/login"
                                className="text-gray-900 hover:text-orange-600"
                            >
                                Login
                            </Link>

                            <Link
                                href="/user/register"
                                className="text-gray-900 hover:text-orange-600"
                            >
                                Register
                            </Link>
                        </>
                    )}



                    <button
                        type="button"
                        onClick={onCartClick}
                        className="relative rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold hover:border-orange-500"
                        aria-label={`Open cart, ${cartCount} items`}
                    >
                        Cart

                        <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-600 px-1 text-xs text-white">
                            {loading ? "…" : cartCount}
                        </span>
                    </button>

                </div>
            </div>
        </header>
    );
}
