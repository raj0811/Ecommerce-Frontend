// export const instant = false;
type Product = {
    _id: string;
    name?: string;
    title?: string;
    description?: string;
    price?: number;
    salePrice?: number;
    images?: string[];
    image?: string;
    slug?: string;
};

type LandingPageData = {
    _id: string;
    title: string;
    slug: string;
    productId?: string | Product | null;
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
};

const API_URL = process.env.NEXT_PUBLIC_API_URL;

async function getLandingPage(slug: string): Promise<LandingPageData | null> {
    if (!API_URL) {
        throw new Error('NEXT_PUBLIC_API_URL is not configured');
    }

    const response = await fetch(
        `${API_URL}/landing-page/public/${encodeURIComponent(slug)}`,
        { cache: 'no-store' },
    );

    if (response.status === 404) return null;

    if (!response.ok) {
        throw new Error('Unable to load landing page');
    }

    return response.json();
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const page = await getLandingPage(slug);

    return {
        title: page?.seo?.metaTitle || page?.title || 'Alpha Male',
        description:
            page?.seo?.metaDescription || page?.content?.description || '',
        openGraph: {
            title: page?.seo?.metaTitle || page?.title || 'Alpha Male',
            description: page?.seo?.metaDescription || page?.content?.description || '',
            images: page?.seo?.ogImage ? [page.seo.ogImage] : [],
        },
    };
}

export default async function LandingPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const page = await getLandingPage(slug);

    if (!page) {
        return (
            <main className="flex min-h-screen items-center justify-center bg-white px-6">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-gray-900">
                        Campaign not found
                    </h1>
                    <p className="mt-3 text-gray-600">
                        This landing page may be unpublished or no longer available.
                    </p>
                    <a
                        href="/"
                        className="mt-6 inline-block rounded-lg bg-black px-6 py-3 text-white"
                    >
                        Back to Home
                    </a>
                </div>
            </main>
        );
    }

    const product =
        page.productId && typeof page.productId === 'object'
            ? page.productId
            : null;

    const content = page.content ?? {};
    const heading = content.heading || page.title;
    const description = content.description || product?.description;
    const heroImage =
        content.heroImage || product?.images?.[0] || product?.image;
    const ctaLink =
        content.ctaLink ||
        (product?.slug ? `/products/${product._id}` : '/products');

    return (
        <main className="min-h-screen bg-white text-gray-900">
            <header className="border-b border-gray-100">
                <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
                    <a href="/" className="text-2xl font-black tracking-tight">
                        ALPHA <span className="text-purple-600">MALE</span>
                    </a>

                    <a
                        href="/products"
                        className="text-sm font-semibold hover:text-purple-600"
                    >
                        Shop All
                    </a>
                </div>
            </header>

            <section className="mx-auto grid max-w-7xl items-center gap-10 px-5 py-12 md:grid-cols-2 md:py-20">
                <div className="order-2 md:order-1">
                    {content.tagline && (
                        <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-purple-600">
                            {content.tagline}
                        </p>
                    )}

                    <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight sm:text-5xl lg:text-6xl">
                        {heading}
                    </h1>

                    {content.subheading && (
                        <h2 className="mt-5 text-xl font-semibold text-gray-700">
                            {content.subheading}
                        </h2>
                    )}

                    {description && (
                        <p className="mt-5 max-w-xl whitespace-pre-line text-base leading-7 text-gray-600 sm:text-lg">
                            {description}
                        </p>
                    )}

                    {content.highlights && content.highlights.length > 0 && (
                        <ul className="mt-7 space-y-3">
                            {content.highlights.map((highlight, index) => (
                                <li key={`${highlight}-${index}`} className="flex gap-3">
                                    <span className="font-bold text-purple-600">✓</span>
                                    <span className="text-gray-700">{highlight}</span>
                                </li>
                            ))}
                        </ul>
                    )}

                    <div className="mt-8 flex flex-wrap items-center gap-4">
                        <a
                            href={ctaLink}
                            className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-7 py-3.5 font-bold text-white transition hover:bg-purple-700"
                        >
                            {content.ctaText || 'Shop Now'}
                            <span className="ml-2">→</span>
                        </a>

                        {product?.price != null && (
                            <p className="text-xl font-bold">
                                ₹{Number(product.salePrice ?? product.price).toLocaleString('en-IN')}
                            </p>
                        )}
                    </div>

                    {product && (
                        <p className="mt-4 text-sm text-gray-500">
                            {product.name || product.title}
                        </p>
                    )}
                </div>

                <div className="order-1 md:order-2">
                    {heroImage ? (
                        <img
                            src={heroImage}
                            alt={heading}
                            className="max-h-[650px] w-full rounded-2xl bg-gray-100 object-cover"
                        />
                    ) : (
                        <div className="flex aspect-[4/5] items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
                            Campaign image
                        </div>
                    )}
                </div>
            </section>

            {content.benefits && content.benefits.length > 0 && (
                <section className="bg-gray-50 px-5 py-16">
                    <div className="mx-auto max-w-7xl">
                        <h2 className="text-center text-3xl font-bold">
                            Why Choose {product?.name || product?.title || 'Alpha Male'}?
                        </h2>

                        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                            {content.benefits.map((benefit, index) => (
                                <div
                                    key={`${benefit}-${index}`}
                                    className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                                >
                                    <span className="text-2xl text-purple-600">✦</span>
                                    <p className="mt-3 font-semibold">{benefit}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {content.bannerImage && (
                <section className="mx-auto max-w-7xl px-5 py-12">
                    <img
                        src={content.bannerImage}
                        alt={`${page.title} banner`}
                        className="max-h-[500px] w-full rounded-2xl object-cover"
                    />
                </section>
            )}

            <footer className="border-t border-gray-100 px-5 py-8 text-center text-sm text-gray-500">
                © {new Date().getFullYear()} Alpha Male. All rights reserved.
            </footer>
        </main>
    );
}
