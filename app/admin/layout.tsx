import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { checkIsAdmin } from '@/lib/supabase/admin-queries';
import { AdminNav } from './admin-nav';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabaseConfigured = Boolean(
    url && key && !url.includes('your-supabase-project') && !key.includes('your-supabase-anon-key')
  );

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const { isAdmin, freelancer } = await checkIsAdmin(supabase);

      // If user is not authenticated -> redirect to /login
      if (!freelancer) {
        redirect('/login');
      }

      // If authenticated freelancer is not an admin -> redirect to /dashboard
      if (!isAdmin) {
        redirect('/dashboard');
      }
    } catch (err: any) {
      if (err?.message === 'NEXT_REDIRECT') throw err;
      console.error('Error verifying admin authorization:', err);
      redirect('/dashboard');
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      <AdminNav />
      <main>{children}</main>
    </div>
  );
}
