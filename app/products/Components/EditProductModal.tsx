
"use client";

import type { FormEvent } from "react";
import { X } from "lucide-react";

export type EditProductForm = {
    name: string;
    sku: string;
    description: string;
    price: string;
    compareAtPrice: string;
    category: string;
    stock: string;
    isActive: boolean;
    isFeatured: boolean;
};

type EditProductModalProps = {
    productName: string;
    form: EditProductForm;
    setForm: React.Dispatch<React.SetStateAction<EditProductForm>>;
    loading: boolean;
    error: string;
    onClose: () => void;
    onSubmit: (e: FormEvent<HTMLFormElement>) => void;
};

export default function EditProductModal({
    productName,
    form,
    setForm,
    loading,
    error,
    onClose,
    onSubmit,
}: EditProductModalProps) {
    const inputClass =
        "mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100 disabled:text-slate-500";

    const labelClass = "block text-sm font-medium text-slate-700";

    const updateField = <K extends keyof EditProductForm>(
        field: K,
        value: EditProductForm[K]
    ) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    return (
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !loading) onClose();
            }}
        >
            <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900">
                            Edit Product
                        </h2>
                        <p className="mt-1 text-sm text-slate-500">
                            Update {productName}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        aria-label="Close modal"
                        className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={onSubmit}>
                    <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
                        <div>
                            <label className={labelClass}>
                                Product name <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                value={form.name}
                                onChange={(e) => updateField("name", e.target.value)}
                                className={inputClass}
                                placeholder="Enter product name"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                SKU <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                value={form.sku}
                                onChange={(e) => updateField("sku", e.target.value)}
                                className={inputClass}
                                placeholder="Enter SKU"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Price (₹) <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.price}
                                onChange={(e) => updateField("price", e.target.value)}
                                className={inputClass}
                                placeholder="Enter price"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Compare-at price (₹)</label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={form.compareAtPrice}
                                onChange={(e) =>
                                    updateField("compareAtPrice", e.target.value)
                                }
                                className={inputClass}
                                placeholder="Optional"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Category <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                value={form.category}
                                onChange={(e) => updateField("category", e.target.value)}
                                className={inputClass}
                                placeholder="Enter category"
                                disabled={loading}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>
                                Stock quantity <span className="text-red-500">*</span>
                            </label>
                            <input
                                required
                                type="number"
                                min="0"
                                step="1"
                                value={form.stock}
                                onChange={(e) => updateField("stock", e.target.value)}
                                className={inputClass}
                                placeholder="Enter stock"
                                disabled={loading}
                            />
                        </div>

                        <div className="sm:col-span-2">
                            <label className={labelClass}>Description</label>
                            <textarea
                                rows={3}
                                value={form.description}
                                onChange={(e) =>
                                    updateField("description", e.target.value)
                                }
                                className={`${inputClass} resize-y`}
                                placeholder="Enter product description"
                                disabled={loading}
                            />
                        </div>

                        <div className="flex flex-wrap gap-x-6 gap-y-3 sm:col-span-2">
                            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.isActive}
                                    onChange={(e) =>
                                        updateField("isActive", e.target.checked)
                                    }
                                    className="h-4 w-4 accent-blue-600"
                                    disabled={loading}
                                />
                                Active product
                            </label>

                            <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-slate-700">
                                <input
                                    type="checkbox"
                                    checked={form.isFeatured}
                                    onChange={(e) =>
                                        updateField("isFeatured", e.target.checked)
                                    }
                                    className="h-4 w-4 accent-blue-600"
                                    disabled={loading}
                                />
                                Featured product
                            </label>
                        </div>

                        {error && (
                            <div
                                role="alert"
                                className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-medium text-red-700 sm:col-span-2"
                            >
                                {error}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 border-t border-slate-200 bg-slate-50 px-5 py-4">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={loading}
                            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            disabled={loading}
                            className="rounded-lg bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
