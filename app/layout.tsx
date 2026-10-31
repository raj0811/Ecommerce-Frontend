
import type { Metadata } from "next";
import "./globals.css";
import StorefrontLayout from "./components/store/StorefrontLayout";

export const metadata: Metadata = {
  title: "Alpha Male",
  description: "Alpha Male online store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen">
        <StorefrontLayout>
          {children}
        </StorefrontLayout>
      </body>
    </html>
  );
}
