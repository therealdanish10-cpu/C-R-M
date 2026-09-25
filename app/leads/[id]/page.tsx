import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getFreelancerProfile } from '@/lib/supabase/queries';
import { LeadDetailClient } from './lead-detail-client';
import { ShieldAlert, ArrowLeft, Building2 } from 'lucide-react';
import { Lead, Call, Meeting, Sale, Freelancer } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

// Demo fallback data if Supabase credentials are not configured
const DEMO_LEAD: Lead = {
  id: 'lead-1',
  business_name: 'Apex Plumbing & Heating',
  phone: '+1 (555) 019-2834',
  email: 'info@apexplumbing.com',
  address: '102 Industrial Pkwy',
  city: 'Austin',
  state: 'TX',
  category: 'Plumbing',
  status: 'interested',
  assigned_to: 'fl-101-demo',
  created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  last_call_date: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
};

const DEMO_CALLS: Call[] = [
  {
    id: 'call-1',
    lead_id: 'lead-1',
    freelancer_id: 'fl-101-demo',
    call_time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    outcome: 'meeting_booked',
    notes: 'Spoke with Mike (Owner). Very interested in redesigning their plumbing service site and local SEO. Scheduled video walkthrough.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
  },
  {
    id: 'call-2',
    lead_id: 'lead-1',
    freelancer_id: 'fl-101-demo',
    call_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    outcome: 'callback_requested',
    notes: 'Brief intro to the service. Mike asked to call back in afternoon.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'call-3',
    lead_id: 'lead-1',
    freelancer_id: 'fl-101-demo',
    call_time: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    outcome: 'no_answer',
    notes: 'First attempt, rang out.',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
  },
];

const DEMO_MEETINGS: Meeting[] = [
  {
    id: 'meet-1',
    lead_id: 'lead-1',
    freelancer_id: 'fl-101-demo',
    meeting_datetime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    lead_timezone: 'America/Chicago',
    platform: 'google_meet',
    meeting_link: 'https://meet.google.com/abc-defg-hij',
    status: 'scheduled',
    outcome_notes: 'Walk through website template and lead capture setup.',
    created_at: new Date().toISOString(),
  },
];

const DEMO_SALES: Sale[] = [];

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabaseConfigured = Boolean(
    url && key && !url.includes('your-supabase-project') && !key.includes('your-supabase-anon-key')
  );

  let lead: Lead | null = null;
  let calls: Call[] = [];
  let meetings: Meeting[] = [];
  let sales: Sale[] = [];
  let currentFreelancerId = 'fl-101-demo';

  if (!isSupabaseConfigured) {
    // Demo Mode
    lead = { ...DEMO_LEAD, id };
    calls = DEMO_CALLS.map((c) => ({ ...c, lead_id: id }));
    meetings = DEMO_MEETINGS.map((m) => ({ ...m, lead_id: id }));
    sales = DEMO_SALES;
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
                Your authenticated account does not have a linked profile in the <code className="font-mono text-xs bg-zinc-100 dark:bg-zinc-800 px-1 py-0.5 rounded">freelancers</code> table.
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
      currentFreelancerId = freelancer.id;

      // Fetch lead row
      const { data: leadData, error: leadError } = await supabase
        .from('leads')
        .select('*')
        .eq('id', id)
        .single();

      if (leadError || !leadData) {
        lead = null;
      } else {
        // Enforce ownership: only allow access if leads.assigned_to matches current freelancer's id
        if (leadData.assigned_to !== freelancer.id) {
          lead = null;
        } else {
          lead = leadData as Lead;

          // Fetch related calls, meetings, and sales
          const [callsRes, meetingsRes, salesRes] = await Promise.all([
            supabase
              .from('calls')
              .select('*')
              .eq('lead_id', id)
              .order('call_time', { ascending: false }),
            supabase
              .from('meetings')
              .select('*')
              .eq('lead_id', id)
              .order('meeting_datetime', { ascending: false }),
            supabase
              .from('sales')
              .select('*')
              .eq('lead_id', id)
              .order('sold_at', { ascending: false }),
          ]);

          calls = (callsRes.data || []) as Call[];
          meetings = (meetingsRes.data || []) as Meeting[];
          sales = (salesRes.data || []) as Sale[];
        }
      }
    } catch (err: any) {
      if (err?.message === 'NEXT_REDIRECT') throw err;
      console.error('Error fetching lead detail:', err);
      lead = null;
    }
  }

  // Graceful "Not found / not yours" UI
  if (!lead) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
            <Building2 className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Lead Not Found or Not Assigned
          </h2>
          <p className="text-zinc-500 text-sm mb-6 leading-relaxed">
            This lead record could not be found, or it is not assigned to your freelancer account.
          </p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition shadow-sm"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <LeadDetailClient
      initialLead={lead}
      initialCalls={calls}
      initialMeetings={meetings}
      initialSales={sales}
      freelancerId={currentFreelancerId}
      isSupabaseConfigured={isSupabaseConfigured}
    />
  );
}
