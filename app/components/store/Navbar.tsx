"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type NavbarProps = {
    cartCount: number;
    onCartClick: () => void;
};

export default function Navbar({
    cartCount,
    onCartClick,
}: NavbarProps) {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const checkLogin = () => {
            setIsLoggedIn(
                !!localStorage.getItem("accessToken")?.trim()
            );
        };

        checkLogin();

        window.addEventListener("storage", checkLogin);

        return () => {
            window.removeEventListener("storage", checkLogin);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");

        setIsLoggedIn(false);
        router.push("/");
        router.refresh();
    };

    return (
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white text-gray-900 backdrop-blur">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link href="/" className="text-2xl font-black tracking-tight">
                    store<span className="text-2xl font-black tracking-tight text-gray-900">.</span>
                </Link>

                <div className="hidden items-center gap-8 text-sm font-medium md:flex">
                    <Link href="/" className="text-gray-900 hover:text-orange-600">
                        Home
                    </Link>

                    <Link href="/#about" className="text-gray-900 hover:text-orange-600">
                        About
                    </Link>

                    <Link href="/#contact" className="text-gray-900 hover:text-orange-600">
                        Contact
                    </Link>

                    <Link href="/track-order" className="text-gray-900 hover:text-orange-600">
                        Track
                    </Link>

                    {isLoggedIn && (
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


                    )}

                    {!isLoggedIn && (
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


                </div>

                <div className="flex items-center gap-3">
                    {isLoggedIn && (
                        <Link
                            href="/orders"
                            className="text-sm font-semibold hover:text-orange-600 md:hidden"
                        >
                            Orders
                        </Link>
                    )}

                    <button
                        onClick={onCartClick}
                        className="relative rounded-full border border-gray-200 px-3 py-2 text-sm font-semibold hover:border-orange-500"
                        aria-label={`Open cart, ${cartCount} items`}
                    >
                        Cart
                        <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-600 px-1 text-xs text-white">
                            {cartCount}
                        </span>
                    </button>

                    {isLoggedIn && (
                        <button
                            onClick={handleLogout}
                            className="rounded-full bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
                        >
                            Logout
                        </button>
                    )}
                </div>
            </nav>
        </header>
    );
}