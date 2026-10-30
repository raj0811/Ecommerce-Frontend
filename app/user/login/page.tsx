"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const result = await loginUser(email.trim(), password);

            // Used by the frontend for authenticated API requests.
            localStorage.setItem("accessToken", result.accessToken);
            localStorage.setItem("user", JSON.stringify(result.user));

            router.push("/");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to log in. Please try again.",
            );
        } finally {
            setLoading(false);
        }
    }

    return (
        <main className="flex min-h-screen items-center justify-center bg-neutral-950 px-4 py-10 text-white">
            <section className="w-full max-w-md">
                <Link
                    href="/"
                    className="mb-8 block text-center text-3xl font-black tracking-[0.2em]"
                >
                    ALPHA <span className="text-amber-400">MALE</span>
                </Link>

                <div className="rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl sm:p-9">
                    <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                        Welcome back
                    </p>

                    <h1 className="text-3xl font-bold">Sign in to your account</h1>

                    <p className="mt-3 text-sm text-neutral-400">
                        Access your account, orders, and shopping details.
                    </p>

                    {error && (
                        <div
                            role="alert"
                            className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                        >
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                        <div>
                            <label
                                htmlFor="email"
                                className="mb-2 block text-sm font-medium text-neutral-200"
                            >
                                Email address
                            </label>

                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(event) => setEmail(event.target.value)}
                                placeholder="you@example.com"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition placeholder:text-neutral-600 focus:border-amber-400"
                            />
                        </div>

                        <div>
                            <div className="mb-2 flex items-center justify-between gap-3">
                                <label
                                    htmlFor="password"
                                    className="text-sm font-medium text-neutral-200"
                                >
                                    Password
                                </label>
                            </div>

                            <div className="relative">
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(event) => setPassword(event.target.value)}
                                    placeholder="Enter your password"
                                    className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 pr-20 outline-none transition placeholder:text-neutral-600 focus:border-amber-400"
                                />

                                <button
                                    type="button"
                                    onClick={() => setShowPassword((current) => !current)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-amber-400 hover:text-amber-300"
                                >
                                    {showPassword ? "HIDE" : "SHOW"}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full rounded-lg bg-amber-400 px-4 py-3.5 font-bold text-neutral-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-neutral-400">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/user/register"
                            className="font-semibold text-amber-400 hover:text-amber-300"
                        >
                            Create account
                        </Link>
                    </p>
                </div>

                <p className="mt-6 text-center text-xs text-neutral-500">
                    By signing in, you agree to our applicable terms and privacy policy.
                </p>
            </section>
        </main>
    );
}