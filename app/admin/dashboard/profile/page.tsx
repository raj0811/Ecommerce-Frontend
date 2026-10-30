
"use client";

import { useCallback, useEffect, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

const ROLES = [
    "super_admin",
    "admin",
    "finance",
    "operations",
    "sales_support",
] as const;

type AdminRole = (typeof ROLES)[number];

type Admin = {
    _id?: string;
    id?: string;
    name: string;
    email: string;
    number: string;
    role: AdminRole;
    createdAt?: string;
};

type Pagination = {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
};

const emptyForm = {
    name: "",
    email: "",
    number: "",
    password: "",
    role: "admin" as AdminRole,
};

export default function AdminProfilePage() {
    const [profile, setProfile] = useState<Admin | null>(null);
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [pagination, setPagination] = useState<Pagination | null>(null);

    const [loading, setLoading] = useState(true);
    const [listLoading, setListLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [search, setSearch] = useState("");
    const [page, setPage] = useState(1);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [form, setForm] = useState(emptyForm);

    const token =
        typeof window !== "undefined"
            ? localStorage.getItem("adminAccessToken")
            : null;

    const isSuperAdmin = profile?.role === "super_admin";

    const getHeaders = useCallback(() => {
        const accessToken = localStorage.getItem("adminAccessToken");

        return {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
        };
    }, []);

    const handleResponse = async (response: Response) => {
        const result = await response.json().catch(() => ({}));

        if (!response.ok) {
            throw new Error(
                typeof result.message === "string"
                    ? result.message
                    : "Something went wrong",
            );
        }

        return result;
    };

    // Fetch logged-in admin profile
    const fetchProfile = useCallback(async () => {
        const response = await fetch(`${API_URL}/admin/profile`, {
            headers: getHeaders(),
        });

        const result = await handleResponse(response);

        setProfile(result);
    }, [getHeaders]);

    // Fetch paginated admins
    const fetchAdmins = useCallback(async () => {
        setListLoading(true);

        try {
            const params = new URLSearchParams({
                page: String(page),
                limit: "10",
                search,
            });

            const response = await fetch(
                `${API_URL}/admin/all?${params.toString()}`,
                {
                    headers: getHeaders(),
                },
            );

            const result = await handleResponse(response);

            setAdmins(result.admins || []);
            setPagination(result.pagination || null);
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to load admins",
            );
        } finally {
            setListLoading(false);
        }
    }, [getHeaders, page, search]);

    useEffect(() => {
        async function initialize() {
            try {
                if (!token) {
                    window.location.replace("/admin/login");
                    return;
                }

                await fetchProfile();
            } catch {
                localStorage.removeItem("adminAccessToken");
                localStorage.removeItem("adminId");
                localStorage.removeItem("adminRole");

                window.location.replace("/admin/login");
            } finally {
                setLoading(false);
            }
        }

        initialize();
    }, [fetchProfile, token]);

    useEffect(() => {
        if (isSuperAdmin) {
            fetchAdmins();
        }
    }, [isSuperAdmin, fetchAdmins]);

    function openAddForm() {
        setEditingId(null);
        setForm(emptyForm);
        setShowForm(true);
        setError("");
        setSuccess("");
    }

    function openEditForm(admin: Admin) {
        setEditingId(admin._id || admin.id || null);

        setForm({
            name: admin.name,
            email: admin.email,
            number: admin.number,
            password: "",
            role: admin.role,
        });

        setShowForm(true);
        setError("");
        setSuccess("");
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
    }

    async function saveAdmin(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        setSaving(true);
        setError("");
        setSuccess("");

        try {
            if (!editingId && form.password.length < 8) {
                throw new Error("Password must be at least 8 characters");
            }

            const payload: Record<string, string> = {
                name: form.name.trim(),
                email: form.email.trim(),
                number: form.number.trim(),
                role: form.role,
            };

            if (form.password) {
                payload.password = form.password;
            }

            const response = await fetch(
                editingId
                    ? `${API_URL}/admin/${editingId}`
                    : `${API_URL}/admin/register`,
                {
                    method: editingId ? "PATCH" : "POST",
                    headers: getHeaders(),
                    body: JSON.stringify(payload),
                },
            );

            await handleResponse(response);

            setSuccess(
                editingId
                    ? "Administrator updated successfully"
                    : "Administrator created successfully",
            );

            closeForm();
            await fetchAdmins();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to save admin",
            );
        } finally {
            setSaving(false);
        }
    }

    async function deleteAdmin(admin: Admin) {
        const id = admin._id || admin.id;

        if (!id) return;

        const confirmed = window.confirm(
            `Are you sure you want to delete ${admin.name}?`,
        );

        if (!confirmed) return;

        setError("");
        setSuccess("");

        try {
            const response = await fetch(`${API_URL}/admin/${id}`, {
                method: "DELETE",
                headers: getHeaders(),
            });

            await handleResponse(response);

            setSuccess("Administrator deleted successfully");
            await fetchAdmins();
        } catch (err) {
            setError(
                err instanceof Error ? err.message : "Unable to delete admin",
            );
        }
    }

    function updateForm(key: keyof typeof emptyForm, value: string) {
        setForm((previous) => ({
            ...previous,
            [key]: value,
        }));
    }

    function changeSearch(value: string) {
        setSearch(value);
        setPage(1);
    }

    function formatRole(role: string) {
        return role.replaceAll("_", " ");
    }

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-9 w-9 animate-spin rounded-full border-4 border-violet-600 border-t-transparent" />
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-7xl space-y-8 p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <div>
                <p className="text-sm font-semibold text-violet-600">
                    ACCOUNT SETTINGS
                </p>

                <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">
                    Profile & Administrators
                </h1>

                <p className="mt-2 text-sm text-slate-500">
                    Manage your account and administrator access.
                </p>
            </div>

            {/* Notifications */}
            {error && (
                <div
                    role="alert"
                    className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"
                >
                    {error}
                    <button
                        onClick={() => setError("")}
                        className="float-right font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            {success && (
                <div
                    role="status"
                    className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700"
                >
                    {success}
                    <button
                        onClick={() => setSuccess("")}
                        className="float-right font-bold"
                    >
                        ×
                    </button>
                </div>
            )}

            {/* Profile card */}
            <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-700 p-6 sm:p-8">
                    <div className="flex flex-wrap items-center gap-5">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-2xl font-bold text-violet-700">
                            {profile?.name?.charAt(0).toUpperCase() || "A"}
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-white">
                                {profile?.name}
                            </h2>

                            <p className="mt-1 text-sm text-slate-300">
                                {profile?.email}
                            </p>

                            <span className="mt-2 inline-flex rounded-full bg-violet-500/20 px-3 py-1 text-xs font-semibold capitalize text-violet-200">
                                {profile?.role && formatRole(profile.role)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
                    <ProfileField label="Full Name" value={profile?.name} />
                    <ProfileField label="Email Address" value={profile?.email} />
                    <ProfileField label="Phone Number" value={profile?.number} />
                    <ProfileField
                        label="Administrator ID"
                        value={profile?._id || profile?.id}
                    />
                    <ProfileField
                        label="Role"
                        value={profile?.role && formatRole(profile.role)}
                    />
                    <ProfileField
                        label="Account Created"
                        value={
                            profile?.createdAt
                                ? new Date(profile.createdAt).toLocaleDateString()
                                : "—"
                        }
                    />
                </div>
            </section>

            {/* Administrator management */}
            {isSuperAdmin && (
                <section className="space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900">
                                Administrator Management
                            </h2>

                            <p className="mt-1 text-sm text-slate-500">
                                Manage users who have access to your admin panel.
                            </p>
                        </div>

                        <button
                            onClick={openAddForm}
                            className="rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
                        >
                            + Add Administrator
                        </button>
                    </div>

                    {/* Search and count */}
                    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <input
                            type="search"
                            placeholder="Search name, email or phone..."
                            value={search}
                            onChange={(event) => changeSearch(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-violet-500 sm:max-w-md text-slate-700"
                        />

                        <p className="text-sm text-slate-500">
                            Total administrators:{" "}
                            <strong className="text-slate-900">
                                {pagination?.total ?? 0}
                            </strong>
                        </p>
                    </div>

                    {/* Admin table */}
                    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                        {listLoading ? (
                            <div className="p-12 text-center text-sm text-slate-500">
                                Loading administrators...
                            </div>
                        ) : admins.length === 0 ? (
                            <div className="p-12 text-center">
                                <p className="font-semibold text-slate-700">
                                    No administrators found
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                    Add an administrator to get started.
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[750px] text-left text-sm">
                                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                                        <tr>
                                            <th className="px-5 py-4">Admin</th>
                                            <th className="px-5 py-4">Phone</th>
                                            <th className="px-5 py-4">Role</th>
                                            <th className="px-5 py-4">Created</th>
                                            <th className="px-5 py-4 text-right">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody className="divide-y divide-slate-100">
                                        {admins.map((admin) => {
                                            const id = admin._id || admin.id;
                                            const isCurrentAdmin =
                                                id === profile?._id ||
                                                id === profile?.id;

                                            return (
                                                <tr
                                                    key={id}
                                                    className="transition hover:bg-slate-50"
                                                >
                                                    <td className="px-5 py-4">
                                                        <p className="font-semibold text-slate-900">
                                                            {admin.name}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {admin.email}
                                                        </p>
                                                        {isCurrentAdmin && (
                                                            <span className="mt-1 inline-block text-xs font-semibold text-violet-600">
                                                                You
                                                            </span>
                                                        )}
                                                    </td>

                                                    <td className="px-5 py-4 text-slate-600">
                                                        {admin.number}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold capitalize text-violet-700">
                                                            {formatRole(admin.role)}
                                                        </span>
                                                    </td>

                                                    <td className="px-5 py-4 text-slate-500">
                                                        {admin.createdAt
                                                            ? new Date(
                                                                admin.createdAt,
                                                            ).toLocaleDateString()
                                                            : "—"}
                                                    </td>

                                                    <td className="px-5 py-4">
                                                        <div className="flex justify-end gap-2">
                                                            <button
                                                                onClick={() =>
                                                                    openEditForm(admin)
                                                                }
                                                                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                                                            >
                                                                Edit
                                                            </button>

                                                            {!isCurrentAdmin && (
                                                                <button
                                                                    onClick={() =>
                                                                        deleteAdmin(admin)
                                                                    }
                                                                    className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                                >
                                                                    Delete
                                                                </button>
                                                            )}
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                        {/* Pagination */}
                        {pagination && pagination.totalPages > 1 && (
                            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 p-4">
                                <p className="text-xs text-slate-500">
                                    Page {pagination.page} of{" "}
                                    {pagination.totalPages}
                                </p>

                                <div className="flex gap-2">
                                    <button
                                        disabled={!pagination.hasPreviousPage}
                                        onClick={() =>
                                            setPage((current) => current - 1)
                                        }
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
                                    >
                                        Previous
                                    </button>

                                    <button
                                        disabled={!pagination.hasNextPage}
                                        onClick={() =>
                                            setPage((current) => current + 1)
                                        }
                                        className="rounded-lg border border-slate-200 px-4 py-2 text-sm disabled:opacity-40"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </section>
            )}

            {/* Add / Edit modal */}
            {showForm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/60 p-4">
                    <div className="my-auto w-full max-w-lg rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b border-slate-100 p-6">
                            <div>
                                <h3 className="text-xl font-bold text-slate-900">
                                    {editingId
                                        ? "Edit Administrator"
                                        : "Add Administrator"}
                                </h3>
                                <p className="mt-1 text-sm text-slate-500">
                                    Enter administrator account details.
                                </p>
                            </div>

                            <button
                                onClick={closeForm}
                                className="rounded-lg px-3 py-2 text-xl text-slate-400 hover:bg-slate-100"
                                aria-label="Close"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={saveAdmin} className="space-y-4 p-6 text-slate-700">
                            <FormField
                                label="Full Name"
                                value={form.name}
                                onChange={(value) => updateForm("name", value)}
                                required
                            />

                            <FormField
                                label="Email Address"
                                type="email"
                                value={form.email}
                                onChange={(value) => updateForm("email", value)}
                                required
                            />

                            <FormField
                                label="Phone Number"
                                value={form.number}
                                onChange={(value) => updateForm("number", value)}
                                required
                            />

                            <FormField
                                label={
                                    editingId
                                        ? "New Password (optional)"
                                        : "Password"
                                }
                                type="password"
                                value={form.password}
                                onChange={(value) =>
                                    updateForm("password", value)
                                }
                                required={!editingId}
                                placeholder={
                                    editingId
                                        ? "Leave blank to keep current password"
                                        : "Minimum 8 characters"
                                }
                            />

                            <div>
                                <label className="mb-2 block text-sm font-semibold text-slate-700">
                                    Administrator Role
                                </label>

                                <select
                                    value={form.role}
                                    onChange={(event) =>
                                        updateForm(
                                            "role",
                                            event.target.value,
                                        )
                                    }
                                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm outline-none focus:border-violet-500 text-slate-700"
                                >
                                    {ROLES.map((role) => (
                                        <option key={role} value={role}>
                                            {formatRole(role)}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex gap-3 pt-3">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    className="flex-1 rounded-lg border border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700 disabled:opacity-60"
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingId
                                            ? "Save Changes"
                                            : "Create Admin"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

function ProfileField({
    label,
    value,
}: {
    label: string;
    value?: string;
}) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                {label}
            </p>
            <p className="mt-2 break-all text-sm font-semibold text-slate-800">
                {value || "—"}
            </p>
        </div>
    );
}

function FormField({
    label,
    value,
    onChange,
    type = "text",
    required = false,
    placeholder,
}: {
    label: string;
    value: string;
    onChange: (value: string) => void;
    type?: string;
    required?: boolean;
    placeholder?: string;
}) {
    return (
        <div>
            <label className="mb-2 block text-sm font-semibold text-slate-700">
                {label}
            </label>

            <input
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                required={required}
                placeholder={placeholder}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-violet-500 focus:ring-2 focus:ring-violet-500/10 text-slate-700"
            />
        </div>
    );
}
