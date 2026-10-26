
import type { ReactNode } from "react";

export default function AdminLayout({
    children,
}: Readonly<{
    children: ReactNode;
}>) {
    return (
        <div className="min-h-screen bg-slate-100 text-slate-900">
            {children}
        </div>
    );
}
