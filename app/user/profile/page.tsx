
"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/api";

const API_URL = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"
).replace(/\/+$/, "");

type Address = {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    isDefault: boolean;
};

type ProfileUser = User & {
    _id?: string;
    createdAt?: string;
    addresses?: Address[];
    twoFactorEnabled?: boolean;
};

const emptyAddress: Address = {
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    isDefault: false,
};

export default function ProfilePage() {
    const router = useRouter();

    const [user, setUser] = useState<ProfileUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const [showAddressForm, setShowAddressForm] = useState(false);
    const [address, setAddress] = useState<Address>(emptyAddress);
    const [savingAddress, setSavingAddress] = useState(false);
    const [addressMessage, setAddressMessage] = useState("");
    const [addressError, setAddressError] = useState("");
    const [toggling2FA, setToggling2FA] = useState(false);
    const [twoFactorError, setTwoFactorError] = useState("");

    async function handleToggle2FA() {
        if (!user || toggling2FA) return;

        setToggling2FA(true);
        setTwoFactorError("");

        try {
            const token = localStorage.getItem("accessToken");

            const response = await fetch(`${API_URL}/user/toogle-auth`, {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`,
                    "Content-Type": "application/json",
                },
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to update two-factor authentication."
                );
            }

            setUser((previous) =>
                previous
                    ? {
                        ...previous,
                        twoFactorEnabled: data.twoFactorEnabled,
                    }
                    : previous
            );
        } catch (err) {
            setTwoFactorError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setToggling2FA(false);
        }
    }

    const fetchProfile = useCallback(async () => {
        const token = localStorage.getItem("accessToken");

        if (!token) {
            router.replace("/user/login");
            return;
        }

        try {
            const response = await fetch(`${API_URL}/user/profile/me`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                cache: "no-store",
            });

            if (response.status === 401 || response.status === 403) {
                localStorage.removeItem("accessToken");
                localStorage.removeItem("user");
                router.replace("/user/login");
                return;
            }

            if (!response.ok) {
                throw new Error("Unable to load your profile.");
            }

            const data: ProfileUser = await response.json();
            setUser(data);
            setError("");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Something went wrong."
            );
        } finally {
            setLoading(false);
        }
    }, [router]);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/user/login");
    }

    function updateAddress(
        field: keyof Address,
        value: string | boolean
    ) {
        setAddress((prev) => ({
            ...prev,
            [field]: value,
        }));
    }

    async function handleAddAddress(
        event: React.FormEvent<HTMLFormElement>
    ) {
        event.preventDefault();

        setSavingAddress(true);
        setAddressError("");
        setAddressMessage("");

        try {
            const token = localStorage.getItem("accessToken");

            const response = await fetch(`${API_URL}/user/address`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(address),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(
                    data.message || "Unable to save address."
                );
            }

            setAddressMessage(data.message || "Address saved successfully.");

            setAddress(emptyAddress);
            setShowAddressForm(false);

            await fetchProfile();
        } catch (err) {
            setAddressError(
                err instanceof Error
                    ? err.message
                    : "Unable to save address."
            );
        } finally {
            setSavingAddress(false);
        }
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white text-sm text-neutral-500">
                Loading your account...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-white text-neutral-900">
            {/* Header */}
            <header className="border-b border-neutral-200">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
                    <Link
                        href="/"
                        className="text-xl font-black tracking-widest"
                    >
                        ALPHA <span className="text-amber-500">MALE</span>
                    </Link>

                    <Link
                        href="/"
                        className="text-sm text-neutral-500 transition hover:text-black"
                    >
                        Back to store →
                    </Link>
                </div>
            </header>

            <div className="mx-auto max-w-5xl px-5 py-10 sm:py-14">
                {/* Page heading */}
                <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-600">
                            Account settings
                        </p>
                        <h1 className="mt-2 text-3xl font-semibold tracking-tight">
                            My Account
                        </h1>
                        <p className="mt-2 text-sm text-neutral-500">
                            Manage your personal details and saved addresses.
                        </p>
                    </div>

                    <button
                        onClick={handleLogout}
                        className="rounded-lg border border-neutral-200 px-4 py-2.5 text-sm font-medium transition hover:border-red-300 hover:text-red-600"
                    >
                        Logout
                    </button>
                </div>

                {error ? (
                    <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-600">
                        {error}
                        <button
                            onClick={() => {
                                setLoading(true);
                                fetchProfile();
                            }}
                            className="ml-3 font-semibold underline"
                        >
                            Retry
                        </button>
                    </div>
                ) : user ? (
                    <div className="grid gap-8 md:grid-cols-[1fr_1.2fr]">
                        {/* Personal details */}
                        <section>
                            <div className="mb-4 flex items-center justify-between">
                                <h2 className="text-lg font-semibold">
                                    Personal Information
                                </h2>
                            </div>

                            <div className="divide-y divide-neutral-100 rounded-xl border border-neutral-200">
                                <div className="p-5">
                                    <p className="text-xs text-neutral-500">
                                        Full name
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {user.name}
                                    </p>
                                </div>

                                <div className="p-5">
                                    <p className="text-xs text-neutral-500">
                                        Email address
                                    </p>
                                    <p className="mt-1 break-all font-medium">
                                        {user.email}
                                    </p>
                                </div>

                                <div className="p-5">
                                    <p className="text-xs text-neutral-500">
                                        Mobile number
                                    </p>
                                    <p className="mt-1 font-medium">
                                        {user.number}
                                    </p>
                                </div>

                                {user.createdAt && (
                                    <div className="p-5">
                                        <p className="text-xs text-neutral-500">
                                            Member since
                                        </p>
                                        <p className="mt-1 font-medium">
                                            {new Date(
                                                user.createdAt
                                            ).toLocaleDateString("en-IN", {
                                                day: "numeric",
                                                month: "long",
                                                year: "numeric",
                                            })}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <Link
                                href="/my-orders"
                                className="mt-5 flex items-center justify-between rounded-xl border border-neutral-200 p-5 transition hover:border-amber-400"
                            >
                                <div>
                                    <p className="font-semibold">
                                        My Orders
                                    </p>
                                    <p className="mt-1 text-xs text-neutral-500">
                                        View your order history
                                    </p>
                                </div>
                                <span className="text-lg">→</span>
                            </Link>
                        </section>
                        {/* Two Factor Authentication */}
                        <div className="mt-5 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6">
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex items-start gap-3">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-xl">
                                        🔐
                                    </div>

                                    <div>
                                        <h3 className="font-semibold text-neutral-900">
                                            Two-Factor Authentication
                                        </h3>

                                        <p className="mt-1 text-sm leading-5 text-neutral-500">
                                            Add an extra layer of security to your account
                                            with email OTP verification.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-neutral-50 p-4">
                                <div>
                                    <p className="text-sm font-semibold text-neutral-900">
                                        {user.twoFactorEnabled ? "Protection enabled" : "Protection disabled"}
                                    </p>

                                    <p className={`mt-1 text-xs font-medium ${user.twoFactorEnabled
                                        ? "text-emerald-600"
                                        : "text-neutral-500"
                                        }`}>
                                        {user.twoFactorEnabled
                                            ? "Your account has an additional security layer."
                                            : "Your account uses standard login verification."}
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    role="switch"
                                    aria-checked={Boolean(user.twoFactorEnabled)}
                                    aria-label="Toggle two-factor authentication"
                                    disabled={toggling2FA}
                                    onClick={handleToggle2FA}
                                    className={`relative flex h-8 w-[58px] shrink-0 items-center rounded-full p-1 transition-all duration-300 ease-in-out focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60 ${user.twoFactorEnabled
                                        ? "bg-emerald-500"
                                        : "bg-neutral-300"
                                        }`}
                                >
                                    <span
                                        className={`flex h-6 w-6 items-center justify-center rounded-full bg-white shadow-md transition-transform duration-300 ease-in-out ${user.twoFactorEnabled
                                            ? "translate-x-[26px]"
                                            : "translate-x-0"
                                            }`}
                                    >
                                        {toggling2FA ? (
                                            <span className="h-3 w-3 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-800" />
                                        ) : (
                                            <span className={`text-[10px] font-bold ${user.twoFactorEnabled
                                                ? "text-emerald-600"
                                                : "text-neutral-400"
                                                }`}>
                                                {user.twoFactorEnabled ? "✓" : ""}
                                            </span>
                                        )}
                                    </span>
                                </button>
                            </div>

                            {twoFactorError && (
                                <p className="mt-3 rounded-lg bg-red-50 p-3 text-xs text-red-600">
                                    {twoFactorError}
                                </p>
                            )}

                            <p className="mt-4 text-xs leading-5 text-neutral-400">
                                When enabled, you'll need to verify your identity using
                                an OTP sent to your registered email during login.
                            </p>
                        </div>
                        {/* Addresses */}
                        <section>
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <h2 className="text-lg font-semibold">
                                    Saved Addresses
                                </h2>

                                <button
                                    onClick={() => {
                                        setAddressError("");
                                        setAddressMessage("");
                                        setShowAddressForm(true);
                                    }}
                                    className="rounded-lg bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700"
                                >
                                    + Add Address
                                </button>
                            </div>

                            {addressMessage && (
                                <p className="mb-4 text-sm text-green-600">
                                    {addressMessage}
                                </p>
                            )}

                            {user.addresses?.length ? (
                                <div className="space-y-3">
                                    {user.addresses.map((item, index) => (
                                        <div
                                            key={index}
                                            className="rounded-xl border border-neutral-200 p-5"
                                        >
                                            <div className="flex items-start justify-between gap-3">
                                                <div>
                                                    <p className="font-semibold">
                                                        {item.fullName}
                                                    </p>
                                                    <p className="mt-1 text-sm text-neutral-500">
                                                        {item.phone}
                                                    </p>
                                                </div>

                                                {item.isDefault && (
                                                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                                                        Default
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-4 text-sm leading-6 text-neutral-600">
                                                {item.addressLine1}
                                                {item.addressLine2
                                                    ? `, ${item.addressLine2}`
                                                    : ""}
                                                <br />
                                                {item.city}, {item.state}
                                                {" - "}
                                                {item.pincode}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="rounded-xl border border-dashed border-neutral-300 px-5 py-12 text-center">
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-xl">
                                        +
                                    </div>
                                    <h3 className="mt-4 font-semibold">
                                        No saved addresses
                                    </h3>
                                    <p className="mt-2 text-sm text-neutral-500">
                                        Add an address for a faster checkout.
                                    </p>
                                    <button
                                        onClick={() =>
                                            setShowAddressForm(true)
                                        }
                                        className="mt-5 text-sm font-semibold text-amber-700 hover:text-amber-800"
                                    >
                                        Add your first address →
                                    </button>
                                </div>
                            )}
                        </section>
                    </div>
                ) : null}
            </div>

            {/* Add Address Modal */}
            {showAddressForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
                    <div className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-xl sm:p-8">
                        <div className="mb-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-semibold">
                                    Add New Address
                                </h2>
                                <p className="mt-1 text-sm text-neutral-500">
                                    Enter your delivery details.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setShowAddressForm(false)}
                                className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                            >
                                ✕
                            </button>
                        </div>

                        {addressError && (
                            <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                                {addressError}
                            </div>
                        )}

                        <form
                            onSubmit={handleAddAddress}
                            className="space-y-4"
                        >
                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Full Name
                                    </label>
                                    <input
                                        required
                                        value={address.fullName}
                                        onChange={(e) =>
                                            updateAddress("fullName", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-amber-500"
                                        placeholder="Your full name"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        Phone Number
                                    </label>
                                    <input
                                        required
                                        type="tel"
                                        pattern="[0-9]{10}"
                                        maxLength={10}
                                        value={address.phone}
                                        onChange={(e) =>
                                            updateAddress("phone", e.target.value.replace(/\D/g, ""))
                                        }
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-amber-500"
                                        placeholder="10-digit mobile number"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    Address Line 1
                                </label>
                                <input
                                    required
                                    value={address.addressLine1}
                                    onChange={(e) =>
                                        updateAddress("addressLine1", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-amber-500"
                                    placeholder="House number, street, area"
                                />
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    Address Line 2 (Optional)
                                </label>
                                <input
                                    value={address.addressLine2}
                                    onChange={(e) =>
                                        updateAddress("addressLine2", e.target.value)
                                    }
                                    className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-amber-500"
                                    placeholder="Apartment, landmark"
                                />
                            </div>

                            <div className="grid gap-4 sm:grid-cols-2">
                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        City
                                    </label>
                                    <input
                                        required
                                        value={address.city}
                                        onChange={(e) =>
                                            updateAddress("city", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-amber-500"
                                        placeholder="City"
                                    />
                                </div>

                                <div>
                                    <label className="mb-1.5 block text-sm font-medium">
                                        State
                                    </label>
                                    <input
                                        required
                                        value={address.state}
                                        onChange={(e) =>
                                            updateAddress("state", e.target.value)
                                        }
                                        className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-amber-500"
                                        placeholder="State"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="mb-1.5 block text-sm font-medium">
                                    Pincode
                                </label>
                                <input
                                    required
                                    inputMode="numeric"
                                    pattern="[0-9]{6}"
                                    maxLength={6}
                                    value={address.pincode}
                                    onChange={(e) =>
                                        updateAddress("pincode", e.target.value.replace(/\D/g, ""))
                                    }
                                    className="w-full rounded-lg border border-neutral-200 px-3 py-3 text-sm outline-none focus:border-amber-500"
                                    placeholder="6-digit pincode"
                                />
                            </div>

                            <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-600">
                                <input
                                    type="checkbox"
                                    checked={address.isDefault}
                                    onChange={(e) =>
                                        updateAddress("isDefault", e.target.checked)
                                    }
                                    className="h-4 w-4 accent-amber-500"
                                />
                                Set as default address
                            </label>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddressForm(false)}
                                    className="flex-1 rounded-lg border border-neutral-200 py-3 text-sm font-semibold hover:bg-neutral-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={savingAddress}
                                    className="flex-1 rounded-lg bg-neutral-900 py-3 text-sm font-semibold text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                    {savingAddress
                                        ? "Saving..."
                                        : "Save Address"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}
