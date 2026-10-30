"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@/lib/api";

const API_URL =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

type ProfileUser = User & {
    _id?: string;
    createdAt?: string;
};

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<ProfileUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let active = true;

        async function fetchProfile() {
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

                if (active) setUser(data);
            } catch (err) {
                if (active) {
                    setError(
                        err instanceof Error
                            ? err.message
                            : "Something went wrong.",
                    );
                }
            } finally {
                if (active) setLoading(false);
            }
        }

        fetchProfile();

        return () => {
            active = false;
        };
    }, [router]);

    function handleLogout() {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("user");
        router.replace("/user/login");
    }

    if (loading) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-neutral-950 text-amber-400">
                Loading profile...
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-neutral-950 px-4 py-12 text-white">
            <div className="mx-auto max-w-3xl">
                <Link
                    href="/"
                    className="text-2xl font-black tracking-widest"
                >
                    ALPHA <span className="text-amber-400">MALE</span>
                </Link>

                <section className="mt-8 rounded-2xl border border-white/10 bg-neutral-900 p-6 sm:p-10">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p className="text-sm font-semibold uppercase tracking-widest text-amber-400">
                                My Account
                            </p>
                            <h1 className="mt-2 text-3xl font-bold">My Profile</h1>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="rounded-lg border border-white/15 px-4 py-2 text-sm transition hover:border-red-400 hover:text-red-400"
                        >
                            Logout
                        </button>
                    </div>

                    {error ? (
                        <div role="alert" className="mt-8 space-y-4">
                            <p className="text-red-400">{error}</p>
                            <button
                                onClick={() => window.location.reload()}
                                className="rounded-lg bg-amber-400 px-4 py-2 font-semibold text-neutral-950"
                            >
                                Try again
                            </button>
                        </div>
                    ) : user ? (
                        <div className="mt-8 space-y-5">
                            <div className="rounded-xl border border-white/10 bg-neutral-950 p-5">
                                <p className="text-sm text-neutral-400">Full name</p>
                                <p className="mt-1 text-lg font-medium">{user.name}</p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-neutral-950 p-5">
                                <p className="text-sm text-neutral-400">Email address</p>
                                <p className="mt-1 break-all text-lg font-medium">
                                    {user.email}
                                </p>
                            </div>

                            <div className="rounded-xl border border-white/10 bg-neutral-950 p-5">
                                <p className="text-sm text-neutral-400">Mobile number</p>
                                <p className="mt-1 text-lg font-medium">{user.number}</p>
                            </div>

                            {user.createdAt && (
                                <div className="rounded-xl border border-white/10 bg-neutral-950 p-5">
                                    <p className="text-sm text-neutral-400">Member since</p>
                                    <p className="mt-1 text-lg font-medium">
                                        {new Date(user.createdAt).toLocaleDateString("en-IN", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                            )}

                            <Link
                                href="/my-orders"
                                className="block rounded-lg bg-amber-400 px-4 py-3 text-center font-bold text-neutral-950 transition hover:bg-amber-300"
                            >
                                View My Orders
                            </Link>
                        </div>
                    ) : null}
                </section>
            </div>
        </main>
    );
}