import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getFreelancerProfile, getFreelancerMeetings } from '@/lib/supabase/queries';
import { CalendarView } from './calendar-view';
import { MeetingWithLead, Freelancer } from '@/lib/supabase/types';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Demo fallback meetings for testing without live Supabase credentials
const generateDemoMeetings = (): MeetingWithLead[] => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const date = now.getDate();

  return [
    {
      id: 'meet-demo-1',
      lead_id: 'lead-1',
      freelancer_id: 'fl-101-demo',
      meeting_datetime: new Date(year, month, date, 10, 30).toISOString(),
      lead_timezone: 'America/Chicago',
      platform: 'google_meet',
      meeting_link: 'https://meet.google.com/abc-defg-hij',
      status: 'scheduled',
      outcome_notes: 'Discuss website redesign, hosting plan, and lead capture form.',
      created_at: new Date().toISOString(),
      lead: {
        id: 'lead-1',
        business_name: 'Apex Plumbing & Heating',
        phone: '+1 (555) 019-2834',
        category: 'Plumbing',
      },
    },
    {
      id: 'meet-demo-2',
      lead_id: 'lead-2',
      freelancer_id: 'fl-101-demo',
      meeting_datetime: new Date(year, month, date + 2, 14, 0).toISOString(),
      lead_timezone: 'America/New_York',
      platform: 'zoom',
      meeting_link: 'https://zoom.us/j/9876543210',
      status: 'scheduled',
      outcome_notes: 'Demo contractor portfolio template and SEO service breakdown.',
      created_at: new Date().toISOString(),
      lead: {
        id: 'lead-2',
        business_name: 'BrightSpark Electrical Co.',
        phone: '+1 (555) 834-9201',
        category: 'Electrical',
      },
    },
    {
      id: 'meet-demo-3',
      lead_id: 'lead-3',
      freelancer_id: 'fl-101-demo',
      meeting_datetime: new Date(year, month, date - 3, 11, 15).toISOString(),
      lead_timezone: 'America/Denver',
      platform: 'google_meet',
      meeting_link: 'https://meet.google.com/xyz-uvw-rst',
      status: 'completed',
      outcome_notes: 'Great call. Client agreed to Build + Host package. Moving to proposal review.',
      created_at: new Date().toISOString(),
      lead: {
        id: 'lead-3',
        business_name: 'GreenValley HVAC Specialists',
        phone: '+1 (555) 772-4091',
        category: 'HVAC',
      },
    },
    {
      id: 'meet-demo-4',
      lead_id: 'lead-4',
      freelancer_id: 'fl-101-demo',
      meeting_datetime: new Date(year, month, date - 5, 16, 30).toISOString(),
      lead_timezone: 'America/Los_Angeles',
      platform: 'zoom',
      meeting_link: 'https://zoom.us/j/1234567890',
      status: 'no_show',
      outcome_notes: 'Client was on emergency job site. Followed up via SMS to reschedule.',
      created_at: new Date().toISOString(),
      lead: {
        id: 'lead-4',
        business_name: 'Vanguard Roofing Solutions',
        phone: '+1 (555) 438-1192',
        category: 'Roofing',
      },
    },
    {
      id: 'meet-demo-5',
      lead_id: 'lead-5',
      freelancer_id: 'fl-101-demo',
      meeting_datetime: new Date(year, month, date + 4, 13, 0).toISOString(),
      lead_timezone: 'America/Chicago',
      platform: 'google_meet',
      meeting_link: 'https://meet.google.com/tre-lio-crm',
      status: 'rescheduled',
      outcome_notes: 'Moved from Tuesday to Friday afternoon per owner request.',
      created_at: new Date().toISOString(),
      lead: {
        id: 'lead-5',
        business_name: 'Pinnacle Tree Care & Removal',
        phone: '+1 (555) 902-3312',
        category: 'Landscaping',
      },
    },
  ];
};

export default async function CalendarPage() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabaseConfigured = Boolean(
    url && key && !url.includes('your-supabase-project') && !key.includes('your-supabase-anon-key')
  );

  let meetings: MeetingWithLead[] = [];
  let freelancerTimezone = 'UTC';

  if (!isSupabaseConfigured) {
    // Demo Mode
    meetings = generateDemoMeetings();
    freelancerTimezone = 'America/New_York';
  } else {
    try {
      const supabase = await createClient();
      const profileResult = await getFreelancerProfile(supabase);

      if (!profileResult.user) {
        redirect('/login');
      }

      if (!profileResult.freelancer) {
        return (
          <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
              <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto mb-3" />
              <h2 className="text-xl font-bold mb-2">Freelancer Profile Required</h2>
              <p className="text-zinc-500 text-sm mb-6">
                Your authenticated user does not have a linked profile in the <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">freelancers</code> table.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Return to Dashboard
              </Link>
            </div>
          </div>
        );
      }

      const freelancer = profileResult.freelancer;
      freelancerTimezone = freelancer.timezone || 'UTC';

      // Query meetings for this freelancer with lead details
      meetings = await getFreelancerMeetings(supabase, freelancer.id);
    } catch (err: any) {
      if (err?.message === 'NEXT_REDIRECT') throw err;
      console.error('Error loading calendar:', err);
      meetings = [];
    }
  }

  return (
    <CalendarView
      initialMeetings={meetings}
      freelancerTimezone={freelancerTimezone}
      isSupabaseConfigured={isSupabaseConfigured}
    />
  );
}
