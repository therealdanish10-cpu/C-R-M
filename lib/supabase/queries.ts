import { SupabaseClient } from '@supabase/supabase-js';
import { Lead, DashboardStats, Freelancer, MeetingWithLead } from './types';

export async function getFreelancerProfile(supabase: SupabaseClient) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, freelancer: null, error: authError?.message || 'Not authenticated' };
  }

  const { data: freelancer, error: freelancerError } = await supabase
    .from('freelancers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (freelancerError) {
    return { user, freelancer: null, error: freelancerError.message };
  }

  return { user, freelancer: freelancer as Freelancer, error: null };
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  freelancerId: string
): Promise<DashboardStats> {
  const now = new Date();
  
  // 7 days ago in ISO format
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // Start of current month in ISO format
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // 1. Total leads assigned
  const leadsPromise = supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('assigned_to', freelancerId);

  // 2. Calls made this week (within last 7 days)
  const callsPromise = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .eq('freelancer_id', freelancerId)
    .gte('call_time', sevenDaysAgo);

  // 3. Meetings booked (status = 'scheduled')
  const meetingsPromise = supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true })
    .eq('freelancer_id', freelancerId)
    .eq('status', 'scheduled');

  // 4. Sales closed this month (sold_at within current month)
  const salesPromise = supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .eq('freelancer_id', freelancerId)
    .gte('sold_at', startOfMonth);

  const [leadsRes, callsRes, meetingsRes, salesRes] = await Promise.all([
    leadsPromise,
    callsPromise,
    meetingsPromise,
    salesPromise,
  ]);

  return {
    totalLeadsAssigned: leadsRes.count ?? 0,
    callsMadeThisWeek: callsRes.count ?? 0,
    meetingsBooked: meetingsRes.count ?? 0,
    salesClosedThisMonth: salesRes.count ?? 0,
  };
}

export async function getFreelancerLeads(
  supabase: SupabaseClient,
  freelancerId: string
): Promise<Lead[]> {
  // Query leads assigned to this freelancer
  const { data: leads, error: leadsError } = await supabase
    .from('leads')
    .select('*')
    .eq('assigned_to', freelancerId)
    .order('created_at', { ascending: false });

  if (leadsError || !leads || leads.length === 0) {
    return [];
  }

  // To efficiently get the most recent call_time for each lead,
  // fetch recent calls for this freelancer
  const leadIds = leads.map((l) => l.id);
  const { data: calls } = await supabase
    .from('calls')
    .select('lead_id, call_time')
    .eq('freelancer_id', freelancerId)
    .in('lead_id', leadIds)
    .order('call_time', { ascending: false });

  // Map latest call time by lead_id
  const latestCallMap = new Map<string, string>();
  if (calls) {
    for (const call of calls) {
      if (call.lead_id && !latestCallMap.has(call.lead_id)) {
        latestCallMap.set(call.lead_id, call.call_time);
      }
    }
  }

  return leads.map((lead) => ({
    ...lead,
    last_call_date: latestCallMap.get(lead.id) || null,
  }));
}

export async function getFreelancerMeetings(
  supabase: SupabaseClient,
  freelancerId: string
): Promise<MeetingWithLead[]> {
  const { data: meetings, error: meetingsError } = await supabase
    .from('meetings')
    .select('*')
    .eq('freelancer_id', freelancerId)
    .order('meeting_datetime', { ascending: true });

  if (meetingsError || !meetings || meetings.length === 0) {
    return [];
  }

  const leadIds = Array.from(new Set(meetings.map((m) => m.lead_id).filter(Boolean)));
  if (leadIds.length === 0) {
    return meetings.map((m) => ({ ...m, lead: null }));
  }

  const { data: leads } = await supabase
    .from('leads')
    .select('id, business_name, phone, category')
    .in('id', leadIds);

  const leadsMap = new Map<string, { id?: string; business_name: string; phone: string; category?: string }>();
  if (leads) {
    for (const lead of leads) {
      leadsMap.set(lead.id, lead);
    }
  }

  return meetings.map((m) => ({
    ...m,
    lead: leadsMap.get(m.lead_id) || null,
  }));
}

