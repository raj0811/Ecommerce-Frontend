
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        const token = localStorage.getItem("adminAccessToken");

        if (token) {
            router.replace("/admin/dashboard");
        } else {
            router.replace("/admin/login");
        }
    }, [router]);

    return (
        <main className="flex min-h-screen items-center justify-center">
            <p className="text-gray-600">Checking admin session...</p>
        </main>
    );
}
