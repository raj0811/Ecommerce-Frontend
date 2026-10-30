export default function SlugPage() {
    return null;
}
// import { notFound } from "next/navigation";

// const API_URL =
//     process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

// type Section = {
//     type: string;
//     title?: string;
//     subtitle?: string;
//     buttonText?: string;
//     buttonLink?: string;
//     image?: string;
//     isVisible?: boolean;
//     order?: number;
// };

// type LandingPageData = {
//     title: string;
//     slug: string;
//     sections: Section[];
//     seo?: {
//         metaTitle?: string;
//         metaDescription?: string;
//     };
// };

// async function getLandingPage(
//     slug: string
// ): Promise<LandingPageData | null> {
//     try {
//         const response = await fetch(
//             `${API_URL}/landing-page/public/${encodeURIComponent(slug)}`,
//             { cache: "no-store" }
//         );

//         if (!response.ok) return null;

//         const result = await response.json();
//         return result.data ?? null;
//     } catch {
//         return null;
//     }
// }

// export async function generateMetadata({
//     params,
// }: {
//     params: Promise<{ slug: string }>;
// }) {
//     const { slug } = await params;
//     const page = await getLandingPage(slug);

//     return {
//         title: page?.seo?.metaTitle || page?.title || "Store",
//         description: page?.seo?.metaDescription || "",
//     };
// }

// export default async function LandingPage({
//     params,
// }: {
//     params: Promise<{ slug: string }>;
// }) {
//     const { slug } = await params;
//     const page = await getLandingPage(slug);

//     if (!page) notFound();

//     const sections = [...(page.sections || [])]
//         .filter((section) => section.isVisible !== false)
//         .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

//     return (
//         <main className="min-h-screen bg-white text-gray-900">
//             {sections.map((section, index) => {
//                 switch (section.type) {
//                     case "hero":
//                         return (
//                             <section
//                                 key={`${section.type}-${index}`}
//                                 className="bg-gray-100 px-6 py-24 text-center"
//                             >
//                                 {section.image && (
//                                     <img
//                                         src={section.image}
//                                         alt=""
//                                         className="mx-auto mb-8 max-h-80 w-full max-w-4xl rounded-xl object-cover"
//                                     />
//                                 )}

//                                 <h1 className="text-4xl font-bold md:text-6xl">
//                                     {section.title || page.title}
//                                 </h1>

//                                 {section.subtitle && (
//                                     <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-600">
//                                         {section.subtitle}
//                                     </p>
//                                 )}

//                                 {section.buttonText && (
//                                     <a
//                                         href={section.buttonLink || "/products"}
//                                         className="mt-8 inline-block rounded-lg bg-black px-6 py-3 font-medium text-white"
//                                     >
//                                         {section.buttonText}
//                                     </a>
//                                 )}
//                             </section>
//                         );

//                     case "featured-products":
//                     case "categories":
//                     case "promo-banner":
//                         return (
//                             <section
//                                 key={`${section.type}-${index}`}
//                                 className="px-6 py-16 text-center"
//                             >
//                                 <h2 className="text-3xl font-bold">
//                                     {section.title}
//                                 </h2>

//                                 {section.subtitle && (
//                                     <p className="mt-3 text-gray-600">
//                                         {section.subtitle}
//                                     </p>
//                                 )}

//                                 {section.type === "promo-banner" &&
//                                     section.buttonText && (
//                                         <a
//                                             href={section.buttonLink || "/products"}
//                                             className="mt-5 inline-block rounded-lg bg-black px-5 py-3 text-white"
//                                         >
//                                             {section.buttonText}
//                                         </a>
//                                     )}
//                             </section>
//                         );

//                     default:
//                         return null;
//                 }
//             })}
//         </main>
//     );
// }
