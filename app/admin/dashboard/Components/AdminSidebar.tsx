
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AdminSidebarProps = {
    adminName?: string;
};

const navigation = [
    {
        label: "Dashboard",
        href: "/admin/dashboard",
        icon: "▦",
    },
    {
        label: "Products",
        href: "/admin/products",
        icon: "▣",
    },
    {
        label: "Orders",
        href: "/admin/dashboard/orders",
        icon: "⌂",
    },
    {
        label: "Ship Rocket Orders",
        href: "/admin/dashboard/ship-rocket/orders",
        icon: "⌂",
    },
    {
        label: "Transactions",
        href: "/admin/transactions",
        icon: "⌂",
    },
    {
        label: "Landing Pages",
        href: "/admin/dashboard/landing-pages",
        icon: "▤",
    },
    {
        label: "Analytics",
        href: "/admin/dashboard/analytics",
        icon: "▤",
    },
    {
        label: "Abandoned Cart",
        href: "/admin/dashboard/abandoned-cart",
        icon: "⌂",
    },
    {
        label: "Support Tickets",
        href: "/admin/dashboard/support-tockets",
        icon: "✉",
    },
    {
        label: "Profile",
        href: "/admin/dashboard/profile",
        icon: "◉",
    },

];

const allowedProductRoles = [
    "super_admin",
    "admin",
    "operations",
    "sales_support",
];

export default function AdminSidebar({
    adminName,
}: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    const [adminRole, setAdminRole] = useState<string | null>(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        const role = localStorage.getItem("adminRole");

        setAdminRole(role);
        setIsMounted(true);
    }, []);

    function logout() {
        localStorage.removeItem("adminAccessToken");
        localStorage.removeItem("adminId");
        localStorage.removeItem("adminRole");

        router.replace("/admin/login");
    }

    // Filter navigation according to the logged-in admin's role.
    const filteredNavigation = navigation.filter((item) => {
        if (!isMounted || !adminRole) return false;

        // Sales support can access only Orders and Support Tickets.
        if (adminRole === "sales_support") {
            return ["Orders", "Support Tickets", "Profile"].includes(item.label);
        }

        // Product access for other permitted roles.
        if (item.label === "Products") {
            return allowedProductRoles.includes(adminRole);
        }

        return true;
    });

    const renderNavigation = isMounted ? filteredNavigation : [];

    // Prevent server/client hydration mismatch.
    // Products appears only after the role has been read from localStorage.
    // const renderNavigation = (isMounted ? filteredNavigation : navigation.filter(
    //     (item) => item.label !== "Products"
    // ));

    function isActive(href: string) {
        if (href === "/admin/dashboard") {
            return pathname === "/admin/dashboard";
        }

        if (href === "/") {
            return false;
        }

        return pathname === href || pathname.startsWith(`${href}/`);
    }

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
                <div className="border-b border-slate-100 px-6 py-6">
                    <Link
                        href="/admin/dashboard"
                        className="text-2xl font-black"
                    >
                        Alpha <span className="text-violet-600">Male</span>
                    </Link>

                    <p className="mt-1 text-xs font-semibold tracking-[0.18em] text-slate-400">
                        ADMIN PANEL
                    </p>
                </div>

                <div className="px-4 py-6">
                    <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Main Menu
                    </p>

                    <nav className="space-y-1">
                        {renderNavigation.map((item) => {
                            const active = isActive(item.href);

                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${active
                                        ? "bg-violet-600 text-white shadow-sm"
                                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                                        }`}
                                >
                                    <span className="w-5 text-center text-lg">
                                        {item.icon}
                                    </span>

                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="mt-auto border-t border-slate-100 p-4">
                    <div className="mb-3 truncate px-2 text-sm text-slate-500">
                        {adminName || "Administrator"}
                    </div>

                    <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-sm font-semibold text-red-600 transition hover:bg-red-50"
                    >
                        <span className="w-5 text-center">↪</span>
                        Logout
                    </button>
                </div>
            </aside>

            {/* Mobile navigation */}
            <div className="sticky top-0 z-40 border-b border-slate-200 bg-white p-3 md:hidden">
                <div className="mb-3 flex items-center justify-between">
                    <Link
                        href="/admin/dashboard"
                        className="text-xl font-black"
                    >
                        Alpha <span className="text-violet-600">Male</span>
                    </Link>

                    <button
                        type="button"
                        onClick={logout}
                        className="rounded-lg px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                    >
                        Logout
                    </button>
                </div>

                <nav className="flex gap-2 overflow-x-auto pb-1">
                    {renderNavigation.map((item) => {
                        const active = isActive(item.href);

                        return (
                            <Link
                                key={item.label}
                                href={item.href}
                                className={`shrink-0 rounded-lg px-3 py-2 text-sm font-medium ${active
                                    ? "bg-violet-600 text-white"
                                    : "bg-slate-100 text-slate-600"
                                    }`}
                            >
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </>
    );
}
