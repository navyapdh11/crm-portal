import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "CRM Portal",
  description: "CRM & Invoice Portal with Multi-Tenant Architecture",
};

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contacts", label: "Contacts" },
  { href: "/deals", label: "Deals" },
  { href: "/invoices", label: "Invoices" },
  { href: "/projects", label: "Projects" },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen" style={{ background: 'var(--color-bg)' }}>
          <nav className="fixed top-0 left-0 right-0 z-50 glass" style={{ borderBottom: '1px solid var(--color-border)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center h-17">
                <Link href="/" className="flex items-center gap-3 group animate-fade-in-up">
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-hover) 100%)' }}>
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <span className="text-xl" style={{ fontFamily: 'var(--font-display)', fontWeight: 600, color: 'var(--color-text-primary)' }}>CRM Portal</span>
                </Link>
                
                <div className="flex items-center gap-1">
                  {navLinks.map((link, index) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="nav-link animate-fade-in-up"
                      style={{ animationDelay: `${0.1 + index * 0.05}s` }}
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
          
          <footer className="py-6 text-center text-sm animate-fade-in-up animate-stagger-6" style={{ color: 'var(--color-text-tertiary)' }}>
            <p>&copy; 2026 CRM Portal. Built with Next.js 14.</p>
          </footer>
        </div>
        
        </body>
    </html>
  );
}