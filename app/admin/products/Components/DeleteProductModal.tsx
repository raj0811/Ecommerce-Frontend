
"use client";

type Props = {
    productName: string;
    stock: number;
    confirmation: string;
    setConfirmation: (value: string) => void;
    loading: boolean;
    error: string;
    onClose: () => void;
    onConfirm: () => void;
};

export default function DeleteProductModal({
    productName,
    stock,
    confirmation,
    setConfirmation,
    loading,
    error,
    onClose,
    onConfirm,
}: Props) {
    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                <div className="border-b border-slate-100 p-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-xl font-bold text-red-600">
                        !
                    </div>

                    <h2 className="mt-4 text-xl font-bold text-slate-900">
                        Delete product?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-600">
                        Are you sure you want to delete{" "}
                        <strong>{productName}</strong>?
                    </p>

                    <div className="mt-4 rounded-lg bg-red-50 p-3 text-sm">
                        <p className="text-slate-700">
                            Product: <strong>{productName}</strong>
                        </p>
                        <p className="mt-1 text-slate-700">
                            Current stock quantity: <strong>{stock}</strong>
                        </p>
                        <p className="mt-2 text-red-700">
                            This action cannot be undone.
                        </p>
                    </div>
                </div>

                <div className="space-y-3 p-5">
                    <label
                        htmlFor="delete-confirmation"
                        className="block text-sm font-medium text-slate-700"
                    >
                        Type <span className="font-bold">delete</span> in lowercase to
                        confirm.
                    </label>

                    <input
                        id="delete-confirmation"
                        type="text"
                        autoComplete="off"
                        value={confirmation}
                        onChange={(e) => setConfirmation(e.target.value)}
                        placeholder="type delete"
                        className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 text-red-500"
                    />

                    {error && (
                        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
                            {error}
                        </p>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            type="button"
                            disabled={loading}
                            onClick={onClose}
                            className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                        >
                            Cancel
                        </button>

                        <button
                            type="button"
                            disabled={loading || confirmation !== "delete"}
                            onClick={onConfirm}
                            className="rounded-lg bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            {loading ? "Deleting..." : "Delete Product"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
