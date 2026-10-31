
'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

interface Product {
    _id: string;
    name: string;
    title?: string;
    slug?: string;
}

interface LandingPage {
    _id: string;
    title: string;
    slug: string;
    productId?: string | Product | null;
    isPublished: boolean;
    isDeleted?: boolean;
    createdAt?: string;
    content?: {
        heading?: string;
        tagline?: string;
        description?: string;
        subheading?: string;
        ctaText?: string;
        ctaLink?: string;
        heroImage?: string;
        bannerImage?: string;
        highlights?: string[];
        benefits?: string[];
    };
    seo?: {
        metaTitle?: string;
        metaDescription?: string;
        ogImage?: string;
        keywords?: string[];
    };
}

interface CampaignForm {
    title: string;
    slug: string;
    productId: string;
    isPublished: boolean;
    heading: string;
    tagline: string;
    description: string;
    subheading: string;
    ctaText: string;
    ctaLink: string;
    heroImage: string;
    bannerImage: string;
    highlights: string;
    benefits: string;
    metaTitle: string;
    metaDescription: string;
    ogImage: string;
    keywords: string;
}

const emptyForm: CampaignForm = {
    title: '',
    slug: '',
    productId: '',
    isPublished: false,
    heading: '',
    tagline: '',
    description: '',
    subheading: '',
    ctaText: 'Shop Now',
    ctaLink: '',
    heroImage: '',
    bannerImage: '',
    highlights: '',
    benefits: '',
    metaTitle: '',
    metaDescription: '',
    ogImage: '',
    keywords: '',
};

const inputClass =
    'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-purple-600 focus:ring-1 focus:ring-purple-600';

function getProductId(value: LandingPage['productId']): string {
    if (!value) return '';
    return typeof value === 'string' ? value : value._id;
}

function getProductName(product: Product): string {
    return product.name || product.title || product._id;
}

function lines(value: string): string[] {
    return value.split('\n').map((v) => v.trim()).filter(Boolean);
}

function toForm(page: LandingPage): CampaignForm {
    return {
        ...emptyForm,
        title: page.title ?? '',
        slug: page.slug ?? '',
        productId: getProductId(page.productId),
        isPublished: page.isPublished ?? false,
        heading: page.content?.heading ?? '',
        tagline: page.content?.tagline ?? '',
        description: page.content?.description ?? '',
        subheading: page.content?.subheading ?? '',
        ctaText: page.content?.ctaText ?? '',
        ctaLink: page.content?.ctaLink ?? '',
        heroImage: page.content?.heroImage ?? '',
        bannerImage: page.content?.bannerImage ?? '',
        highlights: (page.content?.highlights ?? []).join('\n'),
        benefits: (page.content?.benefits ?? []).join('\n'),
        metaTitle: page.seo?.metaTitle ?? '',
        metaDescription: page.seo?.metaDescription ?? '',
        ogImage: page.seo?.ogImage ?? '',
        keywords: (page.seo?.keywords ?? []).join(', '),
    };
}

function buildPayload(form: CampaignForm) {
    return {
        title: form.title.trim(),
        slug: form.slug.trim(),
        productId: form.productId,
        isPublished: form.isPublished,
        sections: [],
        content: {
            heading: form.heading.trim(),
            tagline: form.tagline.trim(),
            description: form.description.trim(),
            subheading: form.subheading.trim(),
            ctaText: form.ctaText.trim(),
            ctaLink: form.ctaLink.trim(),
            heroImage: form.heroImage.trim(),
            bannerImage: form.bannerImage.trim(),
            highlights: lines(form.highlights),
            benefits: lines(form.benefits),
        },
        seo: {
            metaTitle: form.metaTitle.trim(),
            metaDescription: form.metaDescription.trim(),
            ogImage: form.ogImage.trim(),
            keywords: form.keywords.split(',').map((v) => v.trim()).filter(Boolean),
        },
    };
}

export default function LandingPagesAdmin() {
    const [pages, setPages] = useState<LandingPage[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [productsLoading, setProductsLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState('');
    const [productSearch, setProductSearch] = useState('');
    const [editing, setEditing] = useState<LandingPage | null>(null);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState<CampaignForm>(emptyForm);
    const [error, setError] = useState('');
    const [notice, setNotice] = useState('');

    const request = useCallback(
        async (path: string, options: RequestInit = {}) => {
            if (!API_URL) {
                throw new Error('NEXT_PUBLIC_API_URL is missing from .env.local');
            }

            const token =
                localStorage.getItem('adminAccessToken')

            if (!token) {
                throw new Error('Admin token not found. Please log in again.');
            }

            const response = await fetch(`${API_URL}${path}`, {
                ...options,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                    ...options.headers,
                },
            });

            const data = await response.json().catch(() => null);

            if (!response.ok) {
                throw new Error(
                    data?.message || `Request failed (${response.status})`,
                );
            }

            return data;
        },
        [],
    );

    const loadPages = useCallback(async () => {
        setLoading(true);
        setError('');

        try {
            const data = await request('/landing-page/admin');
            const result = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.items)
                        ? data.items
                        : [];

            setPages(result.filter((page: LandingPage) => !page.isDeleted));
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load landing pages.');
        } finally {
            setLoading(false);
        }
    }, [request]);

    const loadProducts = useCallback(async () => {
        setProductsLoading(true);
        setError('');

        try {
            const data = await request('/product');
            const result = Array.isArray(data)
                ? data
                : Array.isArray(data?.data)
                    ? data.data
                    : Array.isArray(data?.products)
                        ? data.products
                        : Array.isArray(data?.items)
                            ? data.items
                            : [];

            setProducts(result);
        } catch (e) {
            setError(
                e instanceof Error
                    ? `Could not load products: ${e.message}`
                    : 'Failed to load products.',
            );
        } finally {
            setProductsLoading(false);
        }
    }, [request]);

    useEffect(() => {
        void loadPages();
    }, [loadPages]);

    function setField<K extends keyof CampaignForm>(
        key: K,
        value: CampaignForm[K],
    ) {
        setForm((previous) => ({ ...previous, [key]: value }));
    }

    function openCreate() {
        setEditing(null);
        setForm(emptyForm);
        setCreating(true);
        setError('');
        setNotice('');
        setProductSearch('');
        void loadProducts();
    }

    function openEdit(page: LandingPage) {
        setCreating(false);
        setEditing(page);
        setForm(toForm(page));
        setError('');
        setNotice('');
        setProductSearch('');
        void loadProducts();
    }

    function closeForm() {
        if (saving) return;
        setCreating(false);
        setEditing(null);
        setForm(emptyForm);
    }

    function selectProduct(productId: string) {
        const product = products.find((item) => item._id === productId);
        setField('productId', productId);

        if (product && !form.title.trim()) {
            const name = getProductName(product);
            setField('title', `${name} Campaign`);
            setField(
                'slug',
                name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
            );
            setField('heading', name);
            setField('ctaLink', product.slug ? `/products/${product.slug}` : '');
        }
    }

    async function saveCampaign(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        if (!form.productId) {
            setError('Please select a product for this campaign.');
            return;
        }

        if (!form.title.trim()) {
            setError('Campaign title is required.');
            return;
        }

        setSaving(true);
        setError('');
        setNotice('');

        try {
            const payload = buildPayload(form);

            if (creating) {
                await request('/landing-page/admin', {
                    method: 'POST',
                    body: JSON.stringify(payload),
                });
            } else if (editing) {
                await request(`/landing-page/admin/${editing._id}`, {
                    method: 'PATCH',
                    body: JSON.stringify(payload),
                });
            }

            setNotice(creating ? 'Campaign created successfully.' : 'Campaign updated successfully.');
            closeForm();
            await loadPages();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not save campaign.');
        } finally {
            setSaving(false);
        }
    }

    async function togglePublished(page: LandingPage) {
        setError('');
        setNotice('');

        try {
            await request(`/landing-page/admin/${page._id}`, {
                method: 'PATCH',
                body: JSON.stringify({ isPublished: !page.isPublished }),
            });

            setNotice(page.isPublished ? 'Campaign unpublished.' : 'Campaign published.');
            await loadPages();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not update status.');
        }
    }

    async function deletePage(page: LandingPage) {
        if (!window.confirm(`Delete "${page.title}"? This may be irreversible.`)) return;

        setError('');
        setNotice('');

        try {
            await request(`/landing-page/admin/${page._id}`, { method: 'DELETE' });
            setNotice('Campaign deleted successfully.');
            if (editing?._id === page._id) closeForm();
            await loadPages();
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Could not delete campaign.');
        }
    }

    const filteredPages = pages.filter((page) => {
        const q = search.toLowerCase();
        return (
            page.title.toLowerCase().includes(q) ||
            page.slug.toLowerCase().includes(q) ||
            getProductId(page.productId).toLowerCase().includes(q)
        );
    });

    const filteredProducts = products.filter((product) => {
        const q = productSearch.toLowerCase();
        return (
            getProductName(product).toLowerCase().includes(q) ||
            product._id.toLowerCase().includes(q) ||
            (product.slug ?? '').toLowerCase().includes(q)
        );
    });

    return (
        <main className="min-h-screen bg-gray-50 p-4 text-gray-900 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl space-y-6">
                <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                            Alpha Male / Admin
                        </p>
                        <h1 className="mt-2 text-3xl font-bold">Landing Pages & Campaigns</h1>
                        <p className="mt-1 text-sm text-gray-500">
                            Create product campaigns and manage their landing pages.
                        </p>
                    </div>
                    <button
                        onClick={openCreate}
                        className="rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-purple-700"
                    >
                        + Create Campaign
                    </button>
                </header>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Stat label="Total campaigns" value={pages.length} />
                    <Stat label="Published" value={pages.filter((p) => p.isPublished).length} />
                    <Stat label="Drafts" value={pages.filter((p) => !p.isPublished).length} />
                </div>

                {error && (
                    <Alert type="error" message={error} onClose={() => setError('')} />
                )}
                {notice && (
                    <Alert type="success" message={notice} onClose={() => setNotice('')} />
                )}

                <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                    <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                        <h2 className="font-semibold">All campaigns</h2>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search campaign, slug, product ID..."
                            className={`${inputClass} sm:max-w-sm`}
                        />
                    </div>

                    {loading ? (
                        <p className="p-12 text-center text-sm text-gray-500">Loading campaigns...</p>
                    ) : filteredPages.length === 0 ? (
                        <div className="p-12 text-center">
                            <p className="font-medium">No campaigns found</p>
                            <p className="mt-1 text-sm text-gray-500">
                                Create your first product campaign to get started.
                            </p>
                            <button
                                onClick={openCreate}
                                className="mt-4 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white"
                            >
                                Create Campaign
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px] text-left text-sm">
                                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                                    <tr>
                                        <th className="px-5 py-3">Campaign</th>
                                        <th className="px-5 py-3">Product</th>
                                        <th className="px-5 py-3">Status</th>
                                        <th className="px-5 py-3">Created</th>
                                        <th className="px-5 py-3 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {filteredPages.map((page) => {
                                        const product = products.find(
                                            (p) => p._id === getProductId(page.productId),
                                        );

                                        return (
                                            <tr key={page._id} className="hover:bg-gray-50">
                                                <td className="px-5 py-4">
                                                    <p className="font-semibold">{page.title}</p>
                                                    <p className="mt-1 text-xs text-gray-500">/{page.slug}</p>
                                                    {page.content?.tagline && (
                                                        <p className="mt-1 max-w-xs truncate text-xs text-gray-500">
                                                            {page.content.tagline}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <p className="font-medium">
                                                        {product ? getProductName(product) : 'Product linked'}
                                                    </p>
                                                    <p className="mt-1 max-w-[180px] truncate font-mono text-xs text-gray-500">
                                                        {getProductId(page.productId) || 'Not linked'}
                                                    </p>
                                                </td>
                                                <td className="px-5 py-4">
                                                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${page.isPublished ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {page.isPublished ? 'Published' : 'Draft'}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-4 text-gray-500">
                                                    {page.createdAt ? new Date(page.createdAt).toLocaleDateString() : '—'}
                                                </td>
                                                <td className="px-5 py-4">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => void togglePublished(page)}
                                                            className="rounded-md border px-3 py-1.5 text-xs font-semibold hover:bg-gray-100"
                                                        >
                                                            {page.isPublished ? 'Unpublish' : 'Publish'}
                                                        </button>
                                                        <button
                                                            onClick={() => openEdit(page)}
                                                            className="rounded-md bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white"
                                                        >
                                                            Edit
                                                        </button>
                                                        <button
                                                            onClick={() => void deletePage(page)}
                                                            className="rounded-md border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                                                        >
                                                            Delete
                                                        </button>
                                                        <Link
                                                            href={`/campaing/${encodeURIComponent(page.slug)}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            className="rounded-md border border-blue-200 px-3 py-1.5 text-xs font-semibold text-blue-600 hover:bg-blue-50"
                                                        >
                                                            View
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </section>
            </div>

            {(creating || editing) && (
                <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-3 sm:p-6">
                    <div className="my-auto w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
                        <div className="sticky top-0 z-10 flex items-center justify-between rounded-t-2xl border-b bg-white p-5">
                            <div>
                                <h2 className="text-lg font-bold">
                                    {creating ? 'Create Product Campaign' : 'Edit Campaign'}
                                </h2>
                                <p className="mt-1 text-xs text-gray-500">
                                    Select a product and customize its landing page.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={closeForm}
                                disabled={saving}
                                className="rounded-lg px-3 py-2 text-xl text-gray-500 hover:bg-gray-100"
                            >
                                ×
                            </button>
                        </div>

                        <form onSubmit={saveCampaign} className="space-y-6 p-5">
                            <section className="space-y-4">
                                <h3 className="border-b pb-2 text-sm font-bold">1. Select product</h3>

                                <input
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                    placeholder="Search products by name or ID..."
                                    className={inputClass}
                                />

                                <Field label="Product">
                                    <select
                                        required
                                        value={form.productId}
                                        onChange={(e) => selectProduct(e.target.value)}
                                        className={inputClass}
                                        disabled={productsLoading}
                                    >
                                        <option value="">
                                            {productsLoading ? 'Loading products...' : 'Select a product'}
                                        </option>
                                        {filteredProducts.map((product) => (
                                            <option key={product._id} value={product._id}>
                                                {getProductName(product)} — {product._id}
                                            </option>
                                        ))}
                                    </select>
                                </Field>

                                {products.length === 0 && !productsLoading && (
                                    <p className="text-xs text-amber-700">
                                        No products loaded. Verify the product API endpoint and response shape.
                                    </p>
                                )}

                                {form.productId && (
                                    <p className="break-all rounded-lg bg-purple-50 p-3 text-xs text-purple-800">
                                        Selected product ID: {form.productId}
                                    </p>
                                )}
                            </section>

                            <section className="space-y-4">
                                <h3 className="border-b pb-2 text-sm font-bold">2. Campaign details</h3>
                                <Field label="Campaign title">
                                    <input required value={form.title} onChange={(e) => setField('title', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="URL slug">
                                    <input required value={form.slug} onChange={(e) => setField('slug', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Heading">
                                    <input value={form.heading} onChange={(e) => setField('heading', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Tagline">
                                    <input value={form.tagline} onChange={(e) => setField('tagline', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Subheading">
                                    <input value={form.subheading} onChange={(e) => setField('subheading', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Description">
                                    <textarea rows={4} value={form.description} onChange={(e) => setField('description', e.target.value)} className={inputClass} />
                                </Field>

                                <div className="grid gap-4 sm:grid-cols-2">
                                    <Field label="CTA button text">
                                        <input value={form.ctaText} onChange={(e) => setField('ctaText', e.target.value)} className={inputClass} />
                                    </Field>
                                    <Field label="CTA link">
                                        <input value={form.ctaLink} onChange={(e) => setField('ctaLink', e.target.value)} className={inputClass} />
                                    </Field>
                                </div>

                                <Field label="Hero image URL">
                                    <input value={form.heroImage} onChange={(e) => setField('heroImage', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Banner image URL">
                                    <input value={form.bannerImage} onChange={(e) => setField('bannerImage', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Highlights (one per line)">
                                    <textarea rows={3} value={form.highlights} onChange={(e) => setField('highlights', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Benefits (one per line)">
                                    <textarea rows={3} value={form.benefits} onChange={(e) => setField('benefits', e.target.value)} className={inputClass} />
                                </Field>
                            </section>

                            <section className="space-y-4">
                                <h3 className="border-b pb-2 text-sm font-bold">3. SEO</h3>
                                <Field label="Meta title">
                                    <input value={form.metaTitle} onChange={(e) => setField('metaTitle', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Meta description">
                                    <textarea rows={3} value={form.metaDescription} onChange={(e) => setField('metaDescription', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Open Graph image URL">
                                    <input value={form.ogImage} onChange={(e) => setField('ogImage', e.target.value)} className={inputClass} />
                                </Field>
                                <Field label="Keywords (comma separated)">
                                    <input value={form.keywords} onChange={(e) => setField('keywords', e.target.value)} className={inputClass} />
                                </Field>
                            </section>

                            <label className="flex items-center gap-3 text-sm">
                                <input
                                    type="checkbox"
                                    checked={form.isPublished}
                                    onChange={(e) => setField('isPublished', e.target.checked)}
                                    className="h-4 w-4 accent-purple-600"
                                />
                                Publish immediately
                            </label>

                            {error && (
                                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>
                            )}

                            <div className="flex flex-col-reverse gap-3 border-t pt-5 sm:flex-row sm:justify-end">
                                <button
                                    type="button"
                                    onClick={closeForm}
                                    disabled={saving}
                                    className="rounded-lg border px-5 py-2.5 text-sm font-semibold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving || productsLoading}
                                    className="rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {saving ? 'Saving...' : creating ? 'Create Campaign' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </main>
    );
}

function Stat({ label, value }: { label: string; value: number }) {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">{label}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
        </div>
    );
}

function Field({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">{label}</label>
            {children}
        </div>
    );
}

function Alert({
    type,
    message,
    onClose,
}: {
    type: 'error' | 'success';
    message: string;
    onClose: () => void;
}) {
    return (
        <div
            role="alert"
            className={`flex items-start justify-between gap-3 rounded-lg border p-3 text-sm ${type === 'error'
                ? 'border-red-200 bg-red-50 text-red-700'
                : 'border-green-200 bg-green-50 text-green-700'
                }`}
        >
            <span>{message}</span>
            <button onClick={onClose} aria-label="Dismiss message">×</button>
        </div>
    );
}
