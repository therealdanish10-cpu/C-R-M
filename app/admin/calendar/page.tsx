import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getAdminCalendarData } from '@/lib/supabase/admin-queries';
import { DEMO_ADMIN_MEETINGS, DEMO_FREELANCERS } from '@/lib/supabase/admin-demo-data';
import { AdminCalendarClient } from './admin-calendar-client';

export const dynamic = 'force-dynamic';

export default async function AdminCalendarPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabaseConfigured = Boolean(
    url && key && !url.includes('your-supabase-project') && !key.includes('your-supabase-anon-key')
  );

  let meetings = DEMO_ADMIN_MEETINGS;
  let freelancers = DEMO_FREELANCERS;

  if (isSupabaseConfigured) {
    try {
      const supabase = await createClient();
      const data = await getAdminCalendarData(supabase);
      meetings = data.meetings;
      freelancers = data.freelancers;
    } catch (err: any) {
      console.error('Error fetching admin calendar:', err);
    }
  }

  return (
    <AdminCalendarClient
      initialMeetings={meetings}
      freelancers={freelancers}
      isSupabaseConfigured={isSupabaseConfigured}
    />
  );
}
