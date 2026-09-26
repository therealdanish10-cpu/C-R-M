import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAdminLeadsData } from '@/lib/supabase/admin-queries';
import { DEMO_ADMIN_LEADS, DEMO_FREELANCERS } from '@/lib/supabase/admin-demo-data';
import { AdminLeadsClient } from './admin-leads-client';

export const dynamic = 'force-dynamic';

export default async function AdminLeadsPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabaseConfigured = Boolean(
    url && key && !url.includes('your-supabase-project') && !key.includes('your-supabase-anon-key')
  );

  let leads = DEMO_ADMIN_LEADS;
  let freelancers = DEMO_FREELANCERS;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const data = await getAdminLeadsData(supabase);
      leads = data.leads;
      freelancers = data.freelancers;
    } catch (err: any) {
      console.error('Error fetching admin leads:', err);
    }
  }

  return (
    <AdminLeadsClient
      initialLeads={leads}
      freelancers={freelancers}
      isSupabaseConfigured={isSupabaseConfigured}
    />
  );
}
