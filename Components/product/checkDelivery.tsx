
"use client";

import { useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type CheckPinCodesProps = {
    productId: string;
};

export default function CheckPinCodes({
    productId,
}: CheckPinCodesProps) {
    const [pincode, setPincode] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const [available, setAvailable] = useState<boolean | null>(null);

    const handleCheck = async () => {
        setMessage("");
        setAvailable(null);

        if (!/^[0-9]{6}$/.test(pincode)) {
            setMessage("Please enter a valid 6-digit PIN code.");
            return;
        }

        if (!API_URL) {
            setMessage("API URL is not configured.");
            return;
        }

        try {
            setLoading(true);

            const response = await fetch(
                `${API_URL}/product/check-pincode`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        productId,
                        pincode,
                    }),
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Unable to check delivery.");
            }

            setAvailable(Boolean(data.available));
            setMessage(
                data.message ||
                (data.available
                    ? "Delivery is available at your location."
                    : "Sorry, delivery is not available at this PIN code.")
            );
        } catch (error) {
            setMessage(
                error instanceof Error
                    ? error.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-5 rounded-xl bg-white p-4">
            <p className="mb-2 text-sm font-semibold text-[#211B18]">
                Check delivery
            </p>

            <div className="flex gap-2">
                <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="Enter PIN code"
                    value={pincode}
                    onChange={(e) =>
                        setPincode(e.target.value.replace(/\D/g, ""))
                    }
                    onKeyDown={(e) => {
                        if (e.key === "Enter") handleCheck();
                    }}
                    className="min-w-0 flex-1 rounded-lg border border-[#DED5CB] px-3 py-3 text-sm text-[#211B18] outline-none focus:border-[#176044]"
                />

                <button
                    type="button"
                    onClick={handleCheck}
                    disabled={loading}
                    className="rounded-lg border border-[#211B18] px-5 py-2 text-sm font-semibold text-[#211B18] transition hover:bg-[#211B18] hover:text-white disabled:opacity-50"
                >
                    {loading ? "Checking..." : "Check"}
                </button>
            </div>

            {message && (
                <p
                    className={`mt-3 text-xs font-medium ${available === true
                        ? "text-emerald-700"
                        : available === false
                            ? "text-red-600"
                            : "text-red-600"
                        }`}
                >
                    {message}
                </p>
            )}
        </div>
    );
}
