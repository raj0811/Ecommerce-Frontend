
"use client";

import { useEffect, useState } from "react";

const slides = [
    {
        eyebrow: "THE EVERYDAY EDIT",
        title: "Good finds. Better living.",
        description: "Discover products that make everyday life better.",
        image:
            "https://images.unsplash.com/photo-1490312278390-ab64016e0aa9?auto=format&fit=crop&w=1800&q=85",
        button: "Explore Collection",
    },
    {
        eyebrow: "STYLE YOUR SPACE",
        title: "Make room for better.",
        description: "Thoughtful essentials for your home and lifestyle.",
        image:
            "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1800&q=85",
        button: "Shop Products",
    },
    {
        eyebrow: "NEW SEASON. NEW FAVOURITES.",
        title: "Find your next favourite.",
        description: "Fresh picks, everyday essentials, and more.",
        image:
            "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1800&q=85",
        button: "Discover More",
    },
];

export default function HeroSlider() {
    const [active, setActive] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActive((current) => (current + 1) % slides.length);
        }, 5000);

        return () => clearInterval(timer);
    }, []);

    const slide = slides[active];

    return (
        <section className="relative isolate overflow-hidden bg-gray-900">
            <div
                className="absolute inset-0 bg-cover bg-center transition-all duration-700"
                style={{ backgroundImage: `url("${slide.image}")` }}
            />
            <div className="absolute inset-0 bg-black/45" />

            <div className="relative mx-auto flex min-h-[440px] max-w-7xl items-center px-6 py-20 sm:min-h-[520px] sm:px-12 lg:px-16">
                <div className="max-w-2xl text-white">
                    <p className="text-xs font-bold tracking-[0.25em] text-orange-300 sm:text-sm">
                        {slide.eyebrow}
                    </p>

                    <h1 className="mt-5 text-4xl font-black leading-tight sm:text-6xl">
                        {slide.title}
                    </h1>

                    <p className="mt-5 max-w-lg text-base text-white/85 sm:text-lg">
                        {slide.description}
                    </p>

                    <a
                        href="#products"
                        className="mt-8 inline-flex rounded-full bg-white px-7 py-3.5 text-sm font-bold text-gray-900 transition hover:bg-orange-500 hover:text-white"
                    >
                        {slide.button}
                    </a>
                </div>
            </div>

            <div className="absolute bottom-6 right-6 flex gap-2 sm:right-12">
                {slides.map((item, index) => (
                    <button
                        key={item.eyebrow}
                        onClick={() => setActive(index)}
                        aria-label={`Show slide ${index + 1}`}
                        className={`h-2.5 rounded-full transition-all ${active === index ? "w-9 bg-orange-400" : "w-2.5 bg-white/70"
                            }`}
                    />
                ))}
            </div>
        </section>
    );
}
