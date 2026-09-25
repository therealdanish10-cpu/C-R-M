import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ArrowLeft, Phone, Mail, MapPin, Building2, Calendar, PhoneCall, DollarSign, Clock } from 'lucide-react';
import { Lead, Call, Meeting, Sale } from '@/lib/supabase/types';

export const dynamic = 'force-dynamic';

interface LeadDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function LeadDetailPage({ params }: LeadDetailPageProps) {
  const { id } = await params;
  const isSupabaseConfigured = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  let lead: Lead | null = null;
  let calls: Call[] = [];
  let meetings: Meeting[] = [];
  let sales: Sale[] = [];

  if (isSupabaseConfigured) {
    const supabase = await createClient();

    // Fetch lead
    const { data: leadData } = await supabase
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    lead = leadData as Lead | null;

    if (lead) {
      // Fetch associated calls, meetings, sales
      const [callsRes, meetingsRes, salesRes] = await Promise.all([
        supabase.from('calls').select('*').eq('lead_id', id).order('call_time', { ascending: false }),
        supabase.from('meetings').select('*').eq('lead_id', id).order('meeting_datetime', { ascending: false }),
        supabase.from('sales').select('*').eq('lead_id', id).order('sold_at', { ascending: false }),
      ]);

      calls = (callsRes.data || []) as Call[];
      meetings = (meetingsRes.data || []) as Meeting[];
      sales = (salesRes.data || []) as Sale[];
    }
  } else {
    // Demo Lead view
    lead = {
      id,
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
    };

    calls = [
      {
        id: 'call-1',
        lead_id: id,
        freelancer_id: 'fl-101-demo',
        call_time: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        outcome: 'Interested',
        notes: 'Spoke with Mike (Owner). Very keen on website redesign and SEO. Scheduled follow-up meeting for tomorrow.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      },
      {
        id: 'call-2',
        lead_id: id,
        freelancer_id: 'fl-101-demo',
        call_time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        outcome: 'Left Voicemail',
        notes: 'Brief introduction to Groundwork trades package. Left call-back number.',
        created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      },
    ];

    meetings = [
      {
        id: 'meet-1',
        lead_id: id,
        freelancer_id: 'fl-101-demo',
        meeting_datetime: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
        lead_timezone: 'America/Chicago',
        platform: 'Google Meet',
        meeting_link: 'https://meet.google.com/abc-defg-hij',
        status: 'scheduled',
        outcome_notes: null,
        created_at: new Date().toISOString(),
      },
    ];
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center bg-white dark:bg-zinc-900 p-8 rounded-xl border border-zinc-200 dark:border-zinc-800">
          <Building2 className="w-12 h-12 text-zinc-400 mx-auto mb-3" />
          <h2 className="text-xl font-bold mb-2">Lead Not Found</h2>
          <p className="text-zinc-500 text-sm mb-6">The requested lead record could not be found or you do not have permission to view it.</p>
          <Link
            href="/dashboard"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 transition"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation & Header */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Back to Leads Dashboard
          </Link>
        </div>

        {/* Lead Summary Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                  {lead.business_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {lead.category}
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-1">Lead ID: {lead.id}</p>
            </div>

            {/* Quick Call Button */}
            {lead.phone && (
              <a
                href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-lg shadow-sm transition-all"
              >
                <Phone className="w-4 h-4 mr-2" />
                Call {lead.phone}
              </a>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-sm">
            <div>
              <span className="text-xs text-zinc-400 block mb-1">Status</span>
              <span className="font-semibold uppercase tracking-wider text-xs px-2.5 py-1 rounded bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                {lead.status}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block mb-1">Email</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {lead.email || 'None provided'}
              </span>
            </div>
            <div>
              <span className="text-xs text-zinc-400 block mb-1">Location</span>
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {[lead.address, lead.city, lead.state].filter(Boolean).join(', ') || 'N/A'}
              </span>
            </div>
          </div>
        </div>

        {/* Tabbed Activity / Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calls History */}
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Call Logs ({calls.length})</h3>
              </div>
            </div>

            {calls.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center italic">No call logs recorded yet.</p>
            ) : (
              <div className="space-y-3">
                {calls.map((call) => (
                  <div key={call.id} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                        {call.outcome || 'Call'}
                      </span>
                      <span className="text-zinc-400">
                        {new Date(call.call_time).toLocaleString()}
                      </span>
                    </div>
                    {call.notes && <p className="text-zinc-600 dark:text-zinc-300 mt-1">{call.notes}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Meetings & Sales */}
          <div className="space-y-6">
            {/* Meetings Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-purple-500" />
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Meetings ({meetings.length})</h3>
                </div>
              </div>

              {meetings.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center italic">No meetings scheduled.</p>
              ) : (
                <div className="space-y-3">
                  {meetings.map((m) => (
                    <div key={m.id} className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-purple-700 dark:text-purple-300 capitalize">{m.status}</span>
                        <span className="text-zinc-400">{new Date(m.meeting_datetime).toLocaleString()}</span>
                      </div>
                      {m.meeting_link && (
                        <a href={m.meeting_link} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline mt-1 block">
                          {m.meeting_link}
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sales Card */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-100 dark:border-zinc-800">
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">Sales Closed ({sales.length})</h3>
                </div>
              </div>

              {sales.length === 0 ? (
                <p className="text-xs text-zinc-400 py-4 text-center italic">No closed sales recorded yet for this lead.</p>
              ) : (
                <div className="space-y-3">
                  {sales.map((s) => (
                    <div key={s.id} className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-700 dark:text-emerald-300">${s.sale_amount}</span>
                        <span className="text-zinc-400">{new Date(s.sold_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
