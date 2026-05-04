import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AR Cleaning AU - Premium Cleaning Services',
  description: 'Book trusted cleaners in your area with real-time tracking',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
