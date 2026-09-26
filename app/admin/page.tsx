import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAdminOverviewData } from '@/lib/supabase/admin-queries';
import { DEMO_ADMIN_STATS, DEMO_ADMIN_PERFORMANCE } from '@/lib/supabase/admin-demo-data';
import { OverviewClient } from './overview-client';

export const dynamic = 'force-dynamic';

export default async function AdminOverviewPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabaseConfigured = Boolean(
    url && key && !url.includes('your-supabase-project') && !key.includes('your-supabase-anon-key')
  );

  let stats = DEMO_ADMIN_STATS;
  let performance = DEMO_ADMIN_PERFORMANCE;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const data = await getAdminOverviewData(supabase);
      stats = data.stats;
      performance = data.performance;
    } catch (err: any) {
      console.error('Error fetching admin overview data:', err);
    }
  }

  return <OverviewClient stats={stats} performance={performance} />;
}
