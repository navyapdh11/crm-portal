import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";
import { ThemeProvider } from "../src/components/themes/ThemeProvider";

export const metadata: Metadata = {
  title: "Nepal Store",
  description: "Ecommerce Platform with Multi-Brand Architecture",
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/bazaar", label: "Bazaar" },
  { href: "/booking", label: "Booking" },
  { href: "/contacts", label: "Contacts" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-canvas text-body font-body">
        <ThemeProvider>
          <div className="min-h-screen">
            <nav className="fixed top-0 left-0 right-0 z-50 bg-canvas border-b border-hairline">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                  <Link href="/" className="flex items-center gap-3">
                    <span className="text-xl font-display font-bold text-ink">Nepal Store</span>
                  </Link>
                  
                  <div className="flex items-center gap-1">
                    {navLinks.map((link) => (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="px-4 py-2 font-body text-ink hover:text-primary transition-colors"
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            </nav>
            
            <main className="pt-20 pb-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}