
"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface Props {
    onClose: () => void;
    onCreated: () => void;
}

export default function AddProductModal({
    onClose,
    onCreated,
}: Props) {
    const router = useRouter();

    const [name, setName] = useState("");
    const [sku, setSku] = useState("");
    const [price, setPrice] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("");
    const [company, setCompany] = useState("Alpha Male");
    const [stock, setStock] = useState("0");
    const [images, setImages] = useState<string[]>([]);
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const inputClass =
        "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10";

    async function handleImageUpload(
        event: ChangeEvent<HTMLInputElement>,
    ) {
        const files = Array.from(event.target.files ?? []);
        event.target.value = "";

        if (!files.length) return;

        setError("");

        if (images.length + files.length > 5) {
            setError("You can upload a maximum of 5 images.");
            return;
        }

        const allowedTypes = [
            "image/jpeg",
            "image/png",
            "image/webp",
        ];

        const invalidFile = files.find(
            (file) =>
                !allowedTypes.includes(file.type) ||
                file.size > 5 * 1024 * 1024,
        );

        if (invalidFile) {
            setError("Use JPG, PNG or WebP images up to 5 MB each.");
            return;
        }

        const token = localStorage.getItem("adminAccessToken");

        if (!token) {
            router.replace("/admin/login");
            return;
        }

        setUploading(true);

        try {
            for (const file of files) {
                const base64 = await new Promise<string>(
                    (resolve, reject) => {
                        const reader = new FileReader();

                        reader.onload = () => {
                            if (typeof reader.result === "string") {
                                resolve(reader.result);
                            } else {
                                reject(new Error(`Could not read ${file.name}`));
                            }
                        };

                        reader.onerror = () =>
                            reject(new Error(`Could not read ${file.name}`));

                        reader.readAsDataURL(file);
                    },
                );

                const response = await fetch(
                    `${API_URL}/product/product-image`,
                    {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify({ base64 }),
                    },
                );

                const result = await response.json();

                if (response.status === 401 || response.status === 403) {
                    localStorage.removeItem("adminAccessToken");
                    router.replace("/admin/login");
                    return;
                }

                if (!response.ok || !result.data?.url) {
                    throw new Error(
                        typeof result.message === "string"
                            ? result.message
                            : `Failed to upload ${file.name}.`,
                    );
                }

                // Add the URL immediately so its image preview appears.
                setImages((previous) => [
                    ...previous,
                    result.data.url,
                ]);
            }
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Image upload failed.",
            );
        } finally {
            setUploading(false);
        }
    }

    function removeImage(indexToRemove: number) {
        setImages((previous) =>
            previous.filter((_, index) => index !== indexToRemove),
        );
    }

    async function handleSubmit(
        event: FormEvent<HTMLFormElement>,
    ) {
        event.preventDefault();
        setError("");

        if (uploading) {
            setError("Please wait for image uploads to finish.");
            return;
        }

        if (images.length === 0) {
            setError("Please upload at least one product image.");
            return;
        }

        if (!name.trim() || !sku.trim() || !category.trim() ||
            !description.trim()) {
            setError("Please fill in all required fields.");
            return;
        }

        const numericPrice = Number(price);
        const numericStock = Number(stock);

        if (!Number.isFinite(numericPrice) || numericPrice < 0) {
            setError("Enter a valid product price.");
            return;
        }

        if (!Number.isInteger(numericStock) || numericStock < 0) {
            setError("Stock must be a non-negative whole number.");
            return;
        }

        const token = localStorage.getItem("adminAccessToken");

        if (!token) {
            router.replace("/admin/login");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch(`${API_URL}/product`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: name.trim(),
                    sku: sku.trim().toUpperCase(),
                    price: numericPrice,
                    description: description.trim(),
                    category: category.trim().toLowerCase(),
                    company: company.trim(),
                    stock: numericStock,
                    images,
                }),
            });

            const result = await response.json();

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("adminAccessToken");
                router.replace("/admin/login");
                return;
            }

            if (!response.ok) {
                throw new Error(
                    typeof result.message === "string"
                        ? result.message
                        : "Could not create product.",
                );
            }

            onCreated();
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Product creation failed.",
            );
        } finally {
            setSubmitting(false);
        }
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-3 sm:p-6"
            onMouseDown={(event) => {
                if (
                    event.target === event.currentTarget &&
                    !uploading &&
                    !submitting
                ) {
                    onClose();
                }
            }}
        >
            <section
                role="dialog"
                aria-modal="true"
                aria-labelledby="add-product-title"
                className="flex max-h-[94dvh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
            >
                <header className="flex items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-6">
                    <div>
                        <h2
                            id="add-product-title"
                            className="text-xl font-bold text-slate-950"
                        >
                            Add Product
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Add product details and images.
                        </p>
                    </div>

                    <button
                        type="button"
                        aria-label="Close modal"
                        disabled={uploading || submitting}
                        onClick={onClose}
                        className="rounded-lg px-3 py-2 text-xl text-slate-500 hover:bg-slate-100 disabled:opacity-50"
                    >
                        ×
                    </button>
                </header>

                <form onSubmit={handleSubmit} className="overflow-y-auto">
                    <div className="space-y-5 p-5 sm:p-6">
                        {error && (
                            <div
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
                            >
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <label className="text-sm font-semibold text-slate-700">
                                Product name *
                                <input
                                    required
                                    maxLength={150}
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Classic Black T-Shirt"
                                    className={inputClass}
                                />
                            </label>

                            <label className="text-sm font-semibold text-slate-700">
                                SKU *
                                <input
                                    required
                                    value={sku}
                                    onChange={(e) => setSku(e.target.value)}
                                    placeholder="TSHIRT-BLK-001"
                                    className={inputClass}
                                />
                            </label>

                            <label className="text-sm font-semibold text-slate-700">
                                Price (₹) *
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={price}
                                    onChange={(e) => setPrice(e.target.value)}
                                    className={inputClass}
                                />
                            </label>

                            <label className="text-sm font-semibold text-slate-700">
                                Stock quantity *
                                <input
                                    required
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={stock}
                                    onChange={(e) => setStock(e.target.value)}
                                    className={inputClass}
                                />
                            </label>

                            <label className="text-sm font-semibold text-slate-700">
                                Category *
                                <input
                                    required
                                    value={category}
                                    onChange={(e) => setCategory(e.target.value)}
                                    placeholder="Clothing"
                                    className={inputClass}
                                />
                            </label>

                            <label className="text-sm font-semibold text-slate-700">
                                Brand
                                <input
                                    value={company}
                                    onChange={(e) => setCompany(e.target.value)}
                                    className={inputClass}
                                />
                            </label>
                        </div>

                        <label className="block text-sm font-semibold text-slate-700">
                            Description *
                            <textarea
                                required
                                rows={3}
                                maxLength={5000}
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Describe the product..."
                                className={inputClass}
                            />
                        </label>

                        {/* Uploaded images appear as square previews. */}
                        <div className="rounded-xl border border-slate-200 p-4">
                            <div className="flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-slate-800">
                                        Product images *
                                    </p>
                                    <p className="mt-1 text-xs text-slate-500">
                                        JPG, PNG or WebP · Maximum 5 MB each
                                    </p>
                                </div>

                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                                    {images.length}/5
                                </span>
                            </div>

                            <div className="mt-4 flex flex-wrap gap-3">
                                {images.map((url, index) => (
                                    <div
                                        key={`${url}-${index}`}
                                        className="group relative h-20 w-20 overflow-hidden rounded-lg border border-slate-200 bg-slate-100 sm:h-24 sm:w-24"
                                    >
                                        <img
                                            src={url}
                                            alt={`Product image ${index + 1}`}
                                            className="h-full w-full object-cover"
                                        />

                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            disabled={uploading || submitting}
                                            aria-label={`Remove image ${index + 1}`}
                                            className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/75 text-white hover:bg-red-600 disabled:opacity-50"
                                        >
                                            ×
                                        </button>
                                    </div>
                                ))}

                                {images.length < 5 && (
                                    <label className="flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 transition hover:border-slate-500 hover:bg-slate-50 sm:h-24 sm:w-24">
                                        <span className="text-2xl leading-none">+</span>
                                        <span className="mt-1 text-xs">Add image</span>
                                        <input
                                            type="file"
                                            accept="image/jpeg,image/png,image/webp"
                                            multiple
                                            disabled={uploading || images.length >= 5}
                                            onChange={handleImageUpload}
                                            className="hidden"
                                        />
                                    </label>
                                )}
                            </div>

                            {uploading && (
                                <p className="mt-3 text-sm text-blue-700">
                                    Uploading images...
                                </p>
                            )}
                        </div>

                        {/* Uploaded Images Gallery */}
                        {images.length > 0 && (
                            <div className="rounded-xl border border-slate-200 bg-white p-4">
                                <div className="flex items-center justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-slate-800">
                                            Uploaded Images
                                        </h3>
                                        <p className="mt-1 text-xs text-slate-500">
                                            All images uploaded for this product
                                        </p>
                                    </div>

                                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                                        {images.length} {images.length === 1 ? "image" : "images"}
                                    </span>
                                </div>

                                <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                                    {images.map((url, index) => (
                                        <div
                                            key={`${url}-${index}`}
                                            className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50"
                                        >
                                            <div className="aspect-square overflow-hidden">
                                                <img
                                                    src={url}
                                                    alt={`Uploaded product image ${index + 1}`}
                                                    className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                                                />
                                            </div>

                                            <div className="flex items-center justify-between gap-2 px-3 py-2">
                                                <span className="truncate text-xs font-medium text-slate-600">
                                                    Image {index + 1}
                                                </span>

                                                <button
                                                    type="button"
                                                    onClick={() => removeImage(index)}
                                                    disabled={uploading || submitting}
                                                    className="shrink-0 text-xs font-medium text-red-600 hover:text-red-800 disabled:opacity-50"
                                                >
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <footer className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4 sm:flex-row sm:justify-end sm:px-6">
                        <button
                            type="button"
                            disabled={uploading || submitting}
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={uploading || submitting}
                            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {submitting ? "Creating..." : "Create Product"}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}
