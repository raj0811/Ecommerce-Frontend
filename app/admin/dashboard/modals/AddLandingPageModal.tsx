
"use client";

import { FormEvent, useState } from "react";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface AddLandingPageModalProps {
    onClose: () => void;
    onCreated: () => void;
}

export default function AddLandingPageModal({
    onClose,
    onCreated,
}: AddLandingPageModalProps) {
    const [title, setTitle] = useState("");
    const [slug, setSlug] = useState("");
    const [isPublished, setIsPublished] = useState(false);
    const [sectionsJson, setSectionsJson] = useState("[]");
    const [metaTitle, setMetaTitle] = useState("");
    const [metaDescription, setMetaDescription] = useState("");
    const [ogImage, setOgImage] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleTitleChange = (value: string) => {
        setTitle(value);

        // Generate a slug until the user edits it manually.
        setSlug((current) => {
            const generatedFromPreviousTitle = title
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");

            if (!current || current === generatedFromPreviousTitle) {
                return value
                    .trim()
                    .toLowerCase()
                    .replace(/[^a-z0-9]+/g, "-")
                    .replace(/^-|-$/g, "");
            }

            return current;
        });
    };

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");

        if (!title.trim()) {
            setError("Page title is required.");
            return;
        }

        let sections: Record<string, unknown>[];

        try {
            const parsed: unknown = JSON.parse(sectionsJson);

            if (
                !Array.isArray(parsed) ||
                !parsed.every(
                    (section) =>
                        section !== null &&
                        typeof section === "object" &&
                        !Array.isArray(section),
                )
            ) {
                setError("Sections must be a JSON array of objects.");
                return;
            }

            sections = parsed as Record<string, unknown>[];
        } catch {
            setError("Sections contains invalid JSON.");
            return;
        }

        try {
            setSubmitting(true);

            const token = localStorage.getItem("adminAccessToken");

            if (!token) {
                setError("Your admin session has expired. Please log in again.");
                return;
            }

            const response = await fetch(`${API_URL}/landing-page/admin`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    title: title.trim(),
                    ...(slug.trim() ? { slug: slug.trim() } : {}),
                    isPublished,
                    sections,
                    seo: {
                        metaTitle: metaTitle.trim(),
                        metaDescription: metaDescription.trim(),
                        ogImage: ogImage.trim(),
                    },
                }),
            });

            const result = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    result?.message || "Failed to create landing page.",
                );
            }

            onCreated();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-6"
            onMouseDown={(event) => {
                if (event.target === event.currentTarget && !submitting) {
                    onClose();
                }
            }}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="landing-modal-title"
                className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl"
            >
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div>
                        <h2
                            id="landing-modal-title"
                            className="text-lg font-bold text-slate-900"
                        >
                            Add Landing Page
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Configure your page and homepage sections.
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={submitting}
                        aria-label="Close modal"
                        className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                    >
                        ×
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5 p-5 sm:p-6">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                            <label
                                htmlFor="landing-title"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Page title *
                            </label>
                            <input
                                id="landing-title"
                                required
                                value={title}
                                onChange={(event) =>
                                    handleTitleChange(event.target.value)
                                }
                                placeholder="Home"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="landing-slug"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                URL slug
                            </label>
                            <input
                                id="landing-slug"
                                value={slug}
                                onChange={(event) =>
                                    setSlug(
                                        event.target.value
                                            .toLowerCase()
                                            .replace(/\s+/g, "-"),
                                    )
                                }
                                placeholder="home"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            />
                        </div>
                    </div>

                    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-slate-200 p-3">
                        <input
                            type="checkbox"
                            checked={isPublished}
                            onChange={(event) =>
                                setIsPublished(event.target.checked)
                            }
                            className="mt-1 h-4 w-4 rounded border-slate-300"
                        />
                        <span>
                            <span className="block text-sm font-semibold text-slate-800">
                                Publish immediately
                            </span>
                            <span className="mt-1 block text-xs text-slate-500">
                                Published pages can be fetched by the public
                                storefront.
                            </span>
                        </span>
                    </label>

                    <div>
                        <label
                            htmlFor="landing-sections"
                            className="mb-1.5 block text-sm font-medium text-slate-700"
                        >
                            Page sections (JSON)
                        </label>
                        <textarea
                            id="landing-sections"
                            rows={8}
                            value={sectionsJson}
                            onChange={(event) =>
                                setSectionsJson(event.target.value)
                            }
                            spellCheck={false}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 font-mono text-xs outline-none focus:border-slate-500"
                            placeholder='[{"type":"hero","title":"Welcome","isVisible":true,"order":1}]'
                        />
                        <p className="mt-1.5 text-xs text-slate-500">
                            Enter a JSON array. Each item represents a section
                            that your storefront knows how to render.
                        </p>
                    </div>

                    <div className="space-y-4 rounded-xl border border-slate-200 p-4">
                        <h3 className="text-sm font-semibold text-slate-800">
                            SEO settings
                        </h3>

                        <div>
                            <label
                                htmlFor="seo-title"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Meta title
                            </label>
                            <input
                                id="seo-title"
                                value={metaTitle}
                                onChange={(event) =>
                                    setMetaTitle(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="seo-description"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Meta description
                            </label>
                            <textarea
                                id="seo-description"
                                rows={2}
                                value={metaDescription}
                                onChange={(event) =>
                                    setMetaDescription(event.target.value)
                                }
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="seo-image"
                                className="mb-1.5 block text-sm font-medium text-slate-700"
                            >
                                Open Graph image URL
                            </label>
                            <input
                                id="seo-image"
                                type="url"
                                value={ogImage}
                                onChange={(event) =>
                                    setOgImage(event.target.value)
                                }
                                placeholder="https://example.com/og-image.jpg"
                                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-slate-500"
                            />
                        </div>
                    </div>

                    {error && (
                        <div
                            role="alert"
                            className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                        >
                            {error}
                        </div>
                    )}

                    <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-4 sm:flex-row sm:justify-end">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={submitting}
                            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={submitting}
                            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {submitting ? "Creating..." : "Create Landing Page"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
