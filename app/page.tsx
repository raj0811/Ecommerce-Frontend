
"use client";

import { useEffect, useState } from "react";
import Navbar from "./components/store/Navbar";
import HeroSlider from "./components/store/HeroSlider";
import ProductSection, {
  StoreProduct,
} from "./components/store/ProductSection";
import CartDrawer, {
  CartItem,
} from "./components/store/CartDrawer";
import Footer from "./components/store/Footer";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export default function HomePage() {
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadProducts() {
      try {
        const response = await fetch(
          `${API_URL}/product?page=1&limit=12`
        );

        if (!response.ok) throw new Error("Failed to fetch products");

        const result = await response.json();

        // Supports your paginated API response and a plain array.
        const list = Array.isArray(result)
          ? result
          : result.products ?? result.data?.products ?? result.data ?? [];

        setProducts(
          list.filter(
            (product: StoreProduct) => product.isActive !== false
          )
        );
      } catch (error) {
        console.error("Could not load products:", error);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

  function addToCart(product: StoreProduct) {
    setCart((current) => {
      const existing = current.find((item) => item._id === product._id);

      if (existing) {
        return current.map((item) =>
          item._id === product._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...current, { ...product, quantity: 1 }];
    });

    setCartOpen(true);
  }

  function updateQuantity(id: string, quantity: number) {
    setCart((current) =>
      quantity <= 0
        ? current.filter((item) => item._id !== id)
        : current.map((item) =>
          item._id === id ? { ...item, quantity } : item
        )
    );
  }

  const cartCount = cart.reduce((total, item) => total + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <Navbar
        cartCount={cartCount}
        onCartClick={() => setCartOpen(true)}
      />

      <main>
        <HeroSlider />

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
                Our collection
              </p>
              <h2 className="mt-2 text-3xl font-bold sm:text-4xl">
                Featured Products
              </h2>
              <p className="mt-2 text-gray-500">
                Find something you'll love.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <div
                  key={index}
                  className="h-72 animate-pulse rounded-2xl bg-gray-100"
                />
              ))}
            </div>
          ) : (
            <ProductSection
              products={products}
              onAddToCart={addToCart}
            />
          )}
        </section>

        <section
          id="about"
          className="bg-orange-50 px-4 py-16 text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-orange-600">
            Made for everyday living
          </p>
          <h2 className="mt-3 text-3xl font-bold">
            Quality products. Simple shopping.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-gray-600">
            Discover products chosen with care, with a shopping experience
            designed to be simple and enjoyable.
          </p>
        </section>

        <section id="contact" className="px-4 py-12 text-center">
          <h2 className="text-2xl font-bold">Need help?</h2>
          <p className="mt-2 text-gray-600">
            Have a question about an order or product? Get in touch with us.
          </p>
          <a
            href="mailto:support@example.com"
            className="mt-5 inline-block rounded-full bg-gray-900 px-6 py-3 text-white hover:bg-orange-600"
          >
            Contact Us
          </a>
        </section>
      </main>

      <Footer />

      <CartDrawer
        open={cartOpen}
        items={cart}
        onClose={() => setCartOpen(false)}
        onUpdateQuantity={updateQuantity}
      />
    </div>
  );
}
