
"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import AdminSidebar from "./dashboard/Components/AdminSidebar";

function AdminLayoutContent({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    // Keep the login page free of the admin sidebar.
    if (pathname === "/admin/login") {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen bg-slate-100 md:flex">
            <AdminSidebar />

            <div className="min-w-0 flex-1">
                {children}
            </div>
        </div>
    );
}

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-100" />}>
            <AdminLayoutContent>{children}</AdminLayoutContent>
        </Suspense>
    );
}
