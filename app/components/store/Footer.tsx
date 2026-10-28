
"use client";

import { useEffect, useState } from "react";

export default function Footer() {
    const [year, setYear] = useState<number | null>(null);

    useEffect(() => {
        setYear(new Date().getFullYear());
    }, []);

    return (
        <footer className="border-t border-gray-100 bg-gray-50">
            <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-gray-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
                <a href="/" className="text-xl font-black text-gray-900">
                    store<span className="text-orange-600">.</span>
                </a>

                <p>
                    © {year ?? "2026"} Store. All rights reserved.
                </p>

                <div className="flex gap-5">
                    <a href="/#about" className="hover:text-orange-600">
                        About
                    </a>
                    <a href="/#contact" className="hover:text-orange-600">
                        Contact
                    </a>
                </div>
            </div>
        </footer>
    );
}
