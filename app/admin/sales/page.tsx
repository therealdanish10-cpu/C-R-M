import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAdminSalesData } from '@/lib/supabase/admin-queries';
import { DEMO_ADMIN_SALES, DEMO_FREELANCERS } from '@/lib/supabase/admin-demo-data';
import { AdminSalesClient } from './admin-sales-client';

export const dynamic = 'force-dynamic';

export default async function AdminSalesPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabaseConfigured = Boolean(
    url && key && !url.includes('your-supabase-project') && !key.includes('your-supabase-anon-key')
  );

  let sales = DEMO_ADMIN_SALES;
  let freelancers = DEMO_FREELANCERS;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const data = await getAdminSalesData(supabase);
      sales = data.sales;
      freelancers = data.freelancers;
    } catch (err: any) {
      console.error('Error fetching admin sales:', err);
    }
  }

  return (
    <AdminSalesClient
      initialSales={sales}
      freelancers={freelancers}
      isSupabaseConfigured={isSupabaseConfigured}
    />
  );
}
