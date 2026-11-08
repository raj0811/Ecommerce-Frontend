"use client";

import { useEffect, useState } from "react";

type Props = {
    messages?: string[];
    /** ms each message stays visible */
    interval?: number;
    /** ms the flip itself takes */
    flipDuration?: number;
};

const DEFAULT_MESSAGES = [
    "Free discreet shipping over [AMOUNT]",
    "Plain packaging, private billing",
    "Body-safe materials, expert-reviewed"
];

// Bar height in px. The 3D faces need a fixed number to compute their depth.
const HEIGHT = 44;

export default function AnnouncementBar({
    messages = DEFAULT_MESSAGES,
    interval = 3500,
    flipDuration = 700,
}: Props) {
    const count = messages.length;
    // `step` only ever increases, so the cube keeps rotating forward
    // instead of spinning back to the start after the last message.
    const [step, setStep] = useState(0);
    const [paused, setPaused] = useState(false);
    const [reduceMotion, setReduceMotion] = useState(false);

    useEffect(() => {
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        setReduceMotion(mq.matches);
        const onChange = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
        mq.addEventListener("change", onChange);
        return () => mq.removeEventListener("change", onChange);
    }, []);

    useEffect(() => {
        if (count < 2 || paused) return;
        const id = setInterval(() => setStep((s) => s + 1), interval);
        return () => clearInterval(id);
    }, [count, interval, paused]);

    const current = messages[step % count];
    const angle = 360 / count;
    // Distance from the prism's centre to each face (4 faces => HEIGHT / 2).
    const depth = count > 1 ? HEIGHT / 2 / Math.tan(Math.PI / count) : 0;

    return (
        <div
            className="w-full bg-[#7A2E4A] text-white"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            onFocus={() => setPaused(true)}
            onBlur={() => setPaused(false)}
        >
            {/* Screen readers get the current message once, not every face */}
            <span className="sr-only" aria-live="polite">
                {current}
            </span>

            {reduceMotion || count < 2 ? (
                <p
                    className="flex items-center justify-center px-4 text-center text-xs leading-4 sm:text-sm"
                    style={{ height: HEIGHT }}
                >
                    {current}
                </p>
            ) : (
                <div
                    aria-hidden="true"
                    className="mx-auto overflow-hidden"
                    style={{ height: HEIGHT, perspective: "800px" }}
                >
                    <div
                        className="relative h-full w-full"
                        style={{
                            transformStyle: "preserve-3d",
                            transform: `translateZ(-${depth}px) rotateX(${-step * angle}deg)`,
                            transition: `transform ${flipDuration}ms cubic-bezier(0.65, 0, 0.35, 1)`,
                        }}
                    >
                        {messages.map((text, i) => (
                            <p
                                key={i}
                                className="absolute inset-0 flex items-center justify-center px-4 text-center text-xs leading-4 sm:text-sm"
                                style={{
                                    backfaceVisibility: "hidden",
                                    transform: `rotateX(${i * angle}deg) translateZ(${depth}px)`,
                                }}
                            >
                                {text}
                            </p>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
