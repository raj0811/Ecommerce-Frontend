
"use client";

import { useCallback, useEffect, useState } from "react";
import AddLandingPageModal from "../modals/AddLandingPageModal";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface LandingPage {
    _id: string;
    title: string;
    slug: string;
    isPublished: boolean;
    isDeleted?: boolean;
    sections?: unknown[];
    createdAt?: string;
    updatedAt?: string;
}

export default function RecentLandingPages() {
    const [pages, setPages] = useState<LandingPage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [showAddModal, setShowAddModal] = useState(false);

    const fetchLandingPages = useCallback(async () => {
        setLoading(true);
        setError("");

        try {
            const token = localStorage.getItem("adminAccessToken");

            if (!token) {
                throw new Error("Admin session not found. Please log in again.");
            }

            const response = await fetch(
                `${API_URL}/landing-page/admin`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                    cache: "no-store",
                },
            );

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    result?.message || "Failed to load landing pages.",
                );
            }

            const pageList: LandingPage[] = Array.isArray(result.data)
                ? result.data
                : [];

            setPages(
                pageList
                    .filter((page) => !page.isDeleted)
                    .sort((a, b) => {
                        const dateA = new Date(
                            a.updatedAt || a.createdAt || 0,
                        ).getTime();

                        const dateB = new Date(
                            b.updatedAt || b.createdAt || 0,
                        ).getTime();

                        return dateB - dateA;
                    })
                    .slice(0, 5),
            );
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Failed to load landing pages.",
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchLandingPages();
    }, [fetchLandingPages]);

    const formatDate = (date?: string) => {
        if (!date) return "—";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) return "—";

        return parsedDate.toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
        });
    };

    return (
        <>
            <section className="mt-8 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                <div className="flex flex-col gap-3 border-b border-slate-200 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">
                            Recent Landing Pages
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Manage your homepage and other landing pages.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => setShowAddModal(true)}
                        className="inline-flex items-center justify-center gap-2 self-start rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 sm:self-auto"
                    >
                        <span className="text-lg leading-none">+</span>
                        Add Landing Page
                    </button>
                </div>

                {error && (
                    <div
                        role="alert"
                        className="m-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                    >
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={fetchLandingPages}
                            className="mt-2 font-semibold underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {loading ? (
                    <div className="px-5 py-12 text-center text-sm text-slate-500">
                        Loading landing pages...
                    </div>
                ) : pages.length === 0 && !error ? (
                    <div className="px-5 py-12 text-center">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-2xl text-slate-500">
                            +
                        </div>

                        <h3 className="mt-4 font-semibold text-slate-900">
                            No landing pages yet
                        </h3>

                        <p className="mt-2 text-sm text-slate-500">
                            Create your first landing page to configure your
                            storefront.
                        </p>

                        <button
                            type="button"
                            onClick={() => setShowAddModal(true)}
                            className="mt-5 rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800"
                        >
                            Create Landing Page
                        </button>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-100">
                        {pages.map((page) => (
                            <div
                                key={page._id}
                                className="flex flex-col gap-3 px-5 py-4 transition hover:bg-slate-50 sm:flex-row sm:items-center sm:justify-between sm:px-6"
                            >
                                <div className="min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h3 className="break-words font-semibold text-slate-900">
                                            {page.title}
                                        </h3>

                                        <span
                                            className={`rounded-full px-2.5 py-1 text-xs font-medium ${page.isPublished
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-amber-50 text-amber-700"
                                                }`}
                                        >
                                            {page.isPublished
                                                ? "Published"
                                                : "Draft"}
                                        </span>
                                    </div>

                                    <p className="mt-1 break-all text-sm text-slate-500">
                                        /{page.slug}
                                    </p>

                                    <p className="mt-2 text-xs text-slate-500">
                                        {(page.sections?.length ?? 0)} sections
                                        {" · "}
                                        Updated{" "}
                                        {formatDate(
                                            page.updatedAt || page.createdAt,
                                        )}
                                    </p>
                                </div>

                                <div className="shrink-0">
                                    <span className="text-xs font-medium text-slate-500">
                                        Landing page
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {!loading && pages.length > 0 && (
                    <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500 sm:px-6">
                        Showing the 5 most recently updated landing pages.
                    </div>
                )}
            </section>

            {showAddModal && (
                <AddLandingPageModal
                    onClose={() => setShowAddModal(false)}
                    onCreated={() => {
                        setShowAddModal(false);
                        fetchLandingPages();
                    }}
                />
            )}
        </>
    );
}
