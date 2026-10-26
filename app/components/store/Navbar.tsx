
"use client";

type NavbarProps = {
    cartCount: number;
    onCartClick: () => void;
};

export default function Navbar({
    cartCount,
    onCartClick,
}: NavbarProps) {
    return (
        <header className="sticky top-0 z-40 border-b border-gray-100 bg-white/95 backdrop-blur">
            <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <a href="/" className="text-2xl font-black tracking-tight">
                    store<span className="text-orange-600">.</span>
                </a>

                <div className="hidden items-center gap-8 text-sm font-medium md:flex">
                    <a href="/" className="hover:text-orange-600">Home</a>
                    <a href="/#about" className="hover:text-orange-600">About</a>
                    <a href="/#contact" className="hover:text-orange-600">Contact</a>
                </div>

                <button
                    onClick={onCartClick}
                    className="relative rounded-full border border-gray-200 px-4 py-2 text-sm font-semibold hover:border-orange-500"
                    aria-label={`Open cart, ${cartCount} items`}
                >
                    Cart
                    <span className="ml-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-orange-600 px-1 text-xs text-white">
                        {cartCount}
                    </span>
                </button>
            </nav>
        </header>
    );
}
