import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAdminFreelancersData } from '@/lib/supabase/admin-queries';
import { DEMO_FREELANCERS } from '@/lib/supabase/admin-demo-data';
import { AdminFreelancersClient } from './admin-freelancers-client';

export const dynamic = 'force-dynamic';

export default async function AdminFreelancersPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabaseConfigured = Boolean(
    url && key && !url.includes('your-supabase-project') && !key.includes('your-supabase-anon-key')
  );

  let freelancers = DEMO_FREELANCERS;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      freelancers = await getAdminFreelancersData(supabase);
    } catch (err: any) {
      console.error('Error fetching admin freelancers:', err);
    }
  }

  return (
    <AdminFreelancersClient
      initialFreelancers={freelancers}
      isSupabaseConfigured={isSupabaseConfigured}
    />
  );
}
