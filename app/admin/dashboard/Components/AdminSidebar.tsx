
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

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
        label: "Landing Pages",
        href: "/admin/landing-pages",
        icon: "▤",
    },
    {
        label: "View Storefront",
        href: "/",
        icon: "⌂",
    },
];

export default function AdminSidebar({
    adminName,
}: AdminSidebarProps) {
    const pathname = usePathname();
    const router = useRouter();

    function logout() {
        localStorage.removeItem("adminAccessToken");
        router.replace("/admin/login");
    }

    return (
        <>
            {/* Desktop sidebar */}
            <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
                <div className="border-b border-slate-100 px-6 py-6">
                    <Link href="/admin/dashboard" className="text-2xl font-black">
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
                        {navigation.map((item) => {
                            const active =
                                item.href === "/admin/dashboard"
                                    ? pathname === "/admin/dashboard"
                                    : item.href !== "/" && pathname.startsWith(item.href.split("#")[0]);

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
                    <Link href="/admin/dashboard" className="text-xl font-black">
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
                    {navigation.map((item) => {
                        const active =
                            item.href === "/admin/dashboard"
                                ? pathname === "/admin/dashboard"
                                : item.href !== "/" && pathname.startsWith(item.href.split("#")[0]);

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
