import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import Image from 'next/image';
import { LayoutDashboard } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Trelio CRM - Freelancer Cold-Calling',
  description: 'Outreach and lead management dashboard for cold-calling freelancers',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png', sizes: '192x192' },
    ],
    apple: '/apple-icon.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 antialiased">
        <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 p-1 flex items-center justify-center shadow-xs group-hover:border-blue-500 transition-colors shrink-0">
                <Image
                  src="/logo.png"
                  alt="Trelio CRM Logo"
                  width={36}
                  height={36}
                  className="w-full h-full object-contain rounded-lg"
                  priority
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-lg text-zinc-900 dark:text-zinc-50">
                  Trelio<span className="text-blue-600">CRM</span>
                </span>
                <span className="hidden sm:inline-block text-[10px] uppercase font-bold text-zinc-400 dark:text-zinc-500 tracking-wider px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800">
                  Freelancer
                </span>
              </div>
            </Link>

            <nav className="flex items-center gap-4">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60"
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </Link>
            </nav>
          </div>
        </header>
        <main>{children}</main>
      </body>
    </html>
  );
}
