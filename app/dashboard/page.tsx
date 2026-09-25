import React from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getFreelancerProfile, getDashboardStats, getFreelancerLeads } from '@/lib/supabase/queries';
import { StatsCards } from './stats-cards';
import { LeadsTable } from './leads-table';
import { Freelancer, Lead, DashboardStats } from '@/lib/supabase/types';
import { UserCheck, AlertCircle, PhoneCall, RefreshCw, LogOut } from 'lucide-react';

export const dynamic = 'force-dynamic';

// Fallback demo data in case Supabase is not yet connected or during local evaluation
const DEMO_FREELANCER: Freelancer = {
  id: 'fl-101-demo',
  user_id: 'usr-101',
  name: 'Sarah Connor',
  email: 'sarah.caller@crm.local',
  phone: '+1 (555) 234-5678',
  country: 'USA',
  timezone: 'America/New_York',
  status: 'active',
  commission_rate: 15.0,
  is_admin: false,
  created_at: new Date().toISOString(),
};

const DEMO_STATS: DashboardStats = {
  totalLeadsAssigned: 28,
  callsMadeThisWeek: 42,
  meetingsBooked: 7,
  salesClosedThisMonth: 3,
};

const DEMO_LEADS: Lead[] = [
  {
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
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    last_call_date: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
  },
  {
    id: 'lead-2',
    business_name: 'BrightSpark Electrical Co.',
    phone: '+1 (555) 834-9201',
    email: 'service@brightsparkelectric.com',
    address: '44 Elm Street',
    city: 'Dallas',
    state: 'TX',
    category: 'Electrical',
    status: 'meeting_booked',
    assigned_to: 'fl-101-demo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    last_call_date: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
  {
    id: 'lead-3',
    business_name: 'Vanguard Roofing Solutions',
    phone: '+1 (555) 438-1192',
    email: 'contact@vanguardroofing.com',
    address: '780 Summit Way',
    city: 'Houston',
    state: 'TX',
    category: 'Roofing',
    status: 'new',
    assigned_to: 'fl-101-demo',
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    last_call_date: null,
  },
  {
    id: 'lead-4',
    business_name: 'GreenValley HVAC Specialists',
    phone: '+1 (555) 772-4091',
    email: 'sales@greenvalleyhvac.com',
    address: '1240 Pinecrest Dr',
    city: 'Denver',
    state: 'CO',
    category: 'HVAC',
    status: 'sold',
    assigned_to: 'fl-101-demo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    last_call_date: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
  },
  {
    id: 'lead-5',
    business_name: 'Pinnacle Tree Care & Removal',
    phone: '+1 (555) 902-3312',
    email: 'support@pinnacletree.com',
    address: '91 Oakridge Ln',
    city: 'Boulder',
    state: 'CO',
    category: 'Landscaping',
    status: 'contacted',
    assigned_to: 'fl-101-demo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    last_call_date: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
  },
  {
    id: 'lead-6',
    business_name: 'Metro Glass & Window Repair',
    phone: '+1 (555) 231-9984',
    email: 'quotes@metroglass.com',
    address: '300 Commerce Blvd',
    city: 'Phoenix',
    state: 'AZ',
    category: 'Contractor',
    status: 'not_interested',
    assigned_to: 'fl-101-demo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 96).toISOString(),
    last_call_date: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'lead-7',
    business_name: 'Elite Foundation Waterproofing',
    phone: '+1 (555) 604-8833',
    email: 'info@elitefoundation.com',
    address: '522 Stone Ave',
    city: 'Scottsdale',
    state: 'AZ',
    category: 'Waterproofing',
    status: 'dead',
    assigned_to: 'fl-101-demo',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 120).toISOString(),
    last_call_date: new Date(Date.now() - 1000 * 60 * 60 * 80).toISOString(),
  },
];

export default async function DashboardPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
  const isSupabaseConfigured = Boolean(
    supabaseUrl &&
      supabaseKey &&
      !supabaseUrl.includes('your-supabase-project') &&
      !supabaseKey.includes('your-supabase-anon-key')
  );

  let freelancer: Freelancer | null = null;
  let stats: DashboardStats = {
    totalLeadsAssigned: 0,
    callsMadeThisWeek: 0,
    meetingsBooked: 0,
    salesClosedThisMonth: 0,
  };
  let leads: Lead[] = [];
  let isDemoMode = false;
  let errorMessage: string | null = null;

  if (!isSupabaseConfigured) {
    // Graceful fallback when credentials aren't supplied in .env
    freelancer = DEMO_FREELANCER;
    stats = DEMO_STATS;
    leads = DEMO_LEADS;
    isDemoMode = true;
  } else {
    try {
      const supabase = await createClient();
      const profileResult = await getFreelancerProfile(supabase);

      if (!profileResult.user) {
        // User is not signed in via Supabase Auth
        redirect('/login');
      }

      if (!profileResult.freelancer) {
        errorMessage = `No freelancer profile found for logged-in user (${profileResult.user.email}). Ensure a row exists in the 'freelancers' table with user_id = auth.uid().`;
      } else {
        freelancer = profileResult.freelancer;
        // Fetch real stats and leads assigned to this freelancer
        const [fetchedStats, fetchedLeads] = await Promise.all([
          getDashboardStats(supabase, freelancer.id),
          getFreelancerLeads(supabase, freelancer.id),
        ]);
        stats = fetchedStats;
        leads = fetchedLeads;
      }
    } catch (err: any) {
      if (err?.message === 'NEXT_REDIRECT') throw err;
      console.error('Error loading freelancer dashboard:', err);
      errorMessage = err?.message || 'Failed to fetch data from Supabase.';
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Banner if in Demo mode */}
        {isDemoMode && (
          <div className="mb-6 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-3 text-sm text-amber-900 dark:text-amber-200">
            <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Interactive Demo Mode Active:</span> Supabase environment variables (<code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_URL</code> & <code className="font-mono text-xs bg-amber-100 dark:bg-amber-900/60 px-1.5 py-0.5 rounded">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>) are not configured yet. Showing mock cold-calling pipeline data so you can test all features immediately.
            </div>
          </div>
        )}

        {/* Error Banner */}
        {errorMessage && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 flex items-start gap-3 text-sm text-rose-900 dark:text-rose-200">
            <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Notice:</span> {errorMessage}
            </div>
          </div>
        )}

        {/* Dashboard Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                Freelancer Dashboard
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                Cold-Calling Pipeline
              </span>
            </div>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Welcome back{freelancer ? `, ${freelancer.name}` : ''}. Here is your outreach pipeline overview and assigned leads.
            </p>
          </div>

          {/* Quick Actions & Profile Info */}
          <div className="flex items-center gap-3">
            {freelancer && (
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs">
                <UserCheck className="w-4 h-4 text-emerald-500" />
                <span className="font-medium text-zinc-700 dark:text-zinc-300">
                  {freelancer.email}
                </span>
                {freelancer.timezone && (
                  <span className="text-zinc-400 font-mono">({freelancer.timezone})</span>
                )}
              </div>
            )}
            <Link
              href="/login"
              className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5 text-zinc-400" />
              Auth
            </Link>
          </div>
        </div>

        {/* Top 4 Stats Bar */}
        <StatsCards stats={stats} />

        {/* Leads Table Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
              <span>Assigned Leads</span>
              <span className="text-xs px-2 py-0.5 rounded-md bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-semibold">
                {leads.length}
              </span>
            </h2>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              Click headers to sort • Tap phone to call
            </div>
          </div>

          <LeadsTable initialLeads={leads} />
        </div>
      </div>
    </div>
  );
}
