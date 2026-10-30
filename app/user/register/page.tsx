"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { registerUser } from "@/lib/api";

export default function RegisterPage() {
    const router = useRouter();

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [number, setNumber] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    async function handleSubmit(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (name.trim().length < 2) {
            setError("Please enter your full name.");
            return;
        }

        if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
            setError("Please enter a valid email address.");
            return;
        }

        if (!/^\d{10}$/.test(number)) {
            setError("Enter a valid 10-digit mobile number.");
            return;
        }

        if (password.length < 8) {
            setError("Your password must contain at least 8 characters.");
            return;
        }

        if (password !== confirmPassword) {
            setError("Passwords do not match.");
            return;
        }

        setLoading(true);

        try {
            const result = await registerUser({
                name: name.trim(),
                email: email.trim(),
                password,
                number,
            });

            setSuccess(result.message || "Registration successful!");

            // Registration does not return an access token.
            // Send the user to login after a short delay.
            setTimeout(() => {
                router.push("/user/login");
            }, 1200);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to create your account. Please try again.",
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
                        Join Alpha Male
                    </p>

                    <h1 className="text-3xl font-bold">Create your account</h1>

                    <p className="mt-3 text-sm text-neutral-400">
                        Create an account to manage your profile and orders.
                    </p>

                    {error && (
                        <div
                            role="alert"
                            className="mt-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
                        >
                            {error}
                        </div>
                    )}

                    {success && (
                        <div
                            role="status"
                            className="mt-6 rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-300"
                        >
                            {success} Redirecting to login...
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="mt-7 space-y-5">
                        <div>
                            <label
                                htmlFor="name"
                                className="mb-2 block text-sm font-medium text-neutral-200"
                            >
                                Full name
                            </label>

                            <input
                                id="name"
                                type="text"
                                autoComplete="name"
                                required
                                minLength={2}
                                value={name}
                                onChange={(event) => setName(event.target.value)}
                                placeholder="Enter your full name"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition placeholder:text-neutral-600 focus:border-amber-400"
                            />
                        </div>

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
                            <label
                                htmlFor="number"
                                className="mb-2 block text-sm font-medium text-neutral-200"
                            >
                                Mobile number
                            </label>

                            <input
                                id="number"
                                type="tel"
                                inputMode="numeric"
                                autoComplete="tel-national"
                                required
                                maxLength={10}
                                value={number}
                                onChange={(event) =>
                                    setNumber(event.target.value.replace(/\D/g, "").slice(0, 10))
                                }
                                placeholder="10-digit mobile number"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition placeholder:text-neutral-600 focus:border-amber-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="mb-2 block text-sm font-medium text-neutral-200"
                            >
                                Password
                            </label>

                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                minLength={8}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                placeholder="Create a password"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition placeholder:text-neutral-600 focus:border-amber-400"
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="mb-2 block text-sm font-medium text-neutral-200"
                            >
                                Confirm password
                            </label>

                            <input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(event) => setConfirmPassword(event.target.value)}
                                placeholder="Re-enter your password"
                                className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-3 outline-none transition placeholder:text-neutral-600 focus:border-amber-400"
                            />
                        </div>

                        <label className="flex items-center gap-2 text-sm text-neutral-400">
                            <input
                                type="checkbox"
                                checked={showPassword}
                                onChange={(event) => setShowPassword(event.target.checked)}
                                className="accent-amber-400"
                            />
                            Show passwords
                        </label>

                        <button
                            type="submit"
                            disabled={loading || Boolean(success)}
                            className="w-full rounded-lg bg-amber-400 px-4 py-3.5 font-bold text-neutral-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {loading ? "Creating account..." : "Create Account"}
                        </button>
                    </form>

                    <p className="mt-7 text-center text-sm text-neutral-400">
                        Already have an account?{" "}
                        <Link
                            href="/user/login"
                            className="font-semibold text-amber-400 hover:text-amber-300"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </section>
        </main>
    );
}