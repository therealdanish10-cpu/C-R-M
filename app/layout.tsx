import type { Metadata } from 'next';
import './globals.css';
import { AppHeader } from './app-header';

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
        <AppHeader />
        <main>{children}</main>
      </body>
    </html>
  );
}
