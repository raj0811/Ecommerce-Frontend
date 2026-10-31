
"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { loginUser } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");

type LoginResponse = {
    message: string;
    requiresOtp: boolean;
    accessToken?: string;
    challengeToken?: string;
    expiresIn?: number;
    user?: {
        id: string;
        name: string;
        email: string;
        number: string;
    };
};

type VerifyOtpResponse = {
    message: string;
    requiresOtp: false;
    accessToken: string;
    refreshToken?: string;
    user: {
        id: string;
        name: string;
        email: string;
        number: string;
    };
};

type ApiError = {
    message?: string | string[];
};

export default function LoginPage() {
    const router = useRouter();

    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [challengeToken, setChallengeToken] = useState("");
    const [otpExpiresIn, setOtpExpiresIn] = useState(300);

    const [step, setStep] = useState<"login" | "otp">("login");
    const [showPassword, setShowPassword] = useState(false);

    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    function getErrorMessage(result: ApiError) {
        return Array.isArray(result.message)
            ? result.message.join(", ")
            : result.message || "Something went wrong.";
    }

    async function saveLogin(result: VerifyOtpResponse | LoginResponse) {
        if (!result.accessToken || !result.user) {
            throw new Error("Invalid login response from server.");
        }

        localStorage.setItem("accessToken", result.accessToken);
        localStorage.setItem("user", JSON.stringify(result.user));

        if ("refreshToken" in result && result.refreshToken) {
            localStorage.setItem("refreshToken", result.refreshToken);
        }

        // Notify other components that authentication changed.
        window.dispatchEvent(new Event("storage"));

        router.replace("/");
        router.refresh();
    }

    // STEP 1: EMAIL + PASSWORD LOGIN
    async function handleLogin(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!email.trim() || !password) {
            setError("Please enter your email and password.");
            return;
        }

        setLoading(true);

        try {
            const result = await loginUser(
                email.trim(),
                password,
            ) as LoginResponse;

            if (result.requiresOtp) {
                if (!result.challengeToken) {
                    throw new Error("OTP challenge token missing.");
                }

                setChallengeToken(result.challengeToken);
                setOtpExpiresIn(result.expiresIn || 300);
                setStep("otp");

                setSuccess("A verification code has been sent to your registered email.");
                return;
            }

            await saveLogin(result);
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

    // STEP 2: VERIFY OTP
    async function handleVerifyOtp(event: FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError("");
        setSuccess("");

        if (!/^\d{6}$/.test(otp)) {
            setError("Please enter a valid 6-digit OTP.");
            return;
        }

        if (!API_URL) {
            setError("API URL is not configured.");
            return;
        }

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/user/verify-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    challengeToken,
                    otp,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(getErrorMessage(result));
            }

            await saveLogin(result as VerifyOtpResponse);
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "OTP verification failed.",
            );
        } finally {
            setLoading(false);
        }
    }

    // STEP 3: RESEND OTP
    async function handleResendOtp() {
        setError("");
        setSuccess("");

        if (!API_URL || !challengeToken) {
            setError("Login session expired. Please login again.");
            return;
        }

        setResending(true);

        try {
            const response = await fetch(`${API_URL}/user/resend-otp`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    challengeToken,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(getErrorMessage(result));
            }

            setOtp("");
            setOtpExpiresIn(result.expiresIn || 300);
            setSuccess(result.message || "A new OTP has been sent.");
        } catch (err) {
            setError(
                err instanceof Error
                    ? err.message
                    : "Unable to resend OTP.",
            );
        } finally {
            setResending(false);
        }
    }

    function backToLogin() {
        setStep("login");
        setOtp("");
        setChallengeToken("");
        setError("");
        setSuccess("");
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

                    {step === "login" ? (
                        <>
                            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                                Welcome back
                            </p>

                            <h1 className="text-3xl font-bold">
                                Sign in to your account
                            </h1>

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

                            <form onSubmit={handleLogin} className="mt-7 space-y-5">
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
                                        htmlFor="password"
                                        className="mb-2 block text-sm font-medium text-neutral-200"
                                    >
                                        Password
                                    </label>

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
                        </>
                    ) : (
                        <>
                            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-amber-400">
                                Two-factor authentication
                            </p>

                            <h1 className="text-3xl font-bold">
                                Verify your email
                            </h1>

                            <p className="mt-3 text-sm text-neutral-400">
                                Enter the 6-digit verification code sent to your registered email address.
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
                                    {success}
                                </div>
                            )}

                            <form onSubmit={handleVerifyOtp} className="mt-7 space-y-5">
                                <div>
                                    <label
                                        htmlFor="otp"
                                        className="mb-2 block text-sm font-medium text-neutral-200"
                                    >
                                        Verification code
                                    </label>

                                    <input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="one-time-code"
                                        maxLength={6}
                                        required
                                        value={otp}
                                        onChange={(event) =>
                                            setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))
                                        }
                                        placeholder="Enter 6-digit OTP"
                                        className="w-full rounded-lg border border-white/10 bg-neutral-950 px-4 py-4 text-center text-2xl font-bold tracking-[0.5em] outline-none transition placeholder:text-neutral-600 placeholder:text-base placeholder:tracking-normal focus:border-amber-400"
                                    />
                                </div>

                                <p className="text-xs text-neutral-500">
                                    OTP validity: {Math.ceil(otpExpiresIn / 60)} minutes.
                                </p>

                                <button
                                    type="submit"
                                    disabled={loading || otp.length !== 6}
                                    className="w-full rounded-lg bg-amber-400 px-4 py-3.5 font-bold text-neutral-950 transition hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {loading ? "Verifying..." : "Verify & Sign In"}
                                </button>
                            </form>

                            <button
                                type="button"
                                onClick={handleResendOtp}
                                disabled={resending || loading}
                                className="mt-5 w-full text-sm font-semibold text-amber-400 hover:text-amber-300 disabled:opacity-50"
                            >
                                {resending ? "Sending OTP..." : "Resend OTP"}
                            </button>

                            <button
                                type="button"
                                onClick={backToLogin}
                                disabled={loading || resending}
                                className="mt-4 w-full text-sm text-neutral-400 hover:text-white"
                            >
                                ← Back to login
                            </button>
                        </>
                    )}
                </div>

                <p className="mt-6 text-center text-xs text-neutral-500">
                    By signing in, you agree to our applicable terms and privacy policy.
                </p>
            </section>
        </main>
    );
}
