import { SupabaseClient } from '@supabase/supabase-js';
import { Lead, DashboardStats, Freelancer, MeetingWithLead } from './types';
import { isExplicitAdminEmail } from './admin-queries';

export async function getFreelancerProfile(supabase: SupabaseClient) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { user: null, freelancer: null, error: authError?.message || 'Not authenticated' };
  }

  const userEmail = (user.email || '').trim().toLowerCase();
  const isExplicitAdmin = isExplicitAdminEmail(userEmail);

  let { data: freelancer, error: freelancerError } = await supabase
    .from('freelancers')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  // Fallback by email if not linked by user_id
  if (!freelancer && userEmail) {
    const { data: byEmail } = await supabase
      .from('freelancers')
      .select('*')
      .ilike('email', userEmail)
      .maybeSingle();

    if (byEmail) {
      freelancer = byEmail;
      // Self-heal: link authenticated user_id to this profile
      await supabase
        .from('freelancers')
        .update({ user_id: user.id })
        .eq('id', byEmail.id);
    }
  }

  // Handle explicit admin (therealdanish12@gmail.com)
  if (isExplicitAdmin) {
    if (!freelancer) {
      const newAdminPayload = {
        user_id: user.id,
        name: user.user_metadata?.full_name || user.user_metadata?.name || 'Danish (Admin)',
        email: user.email!,
        country: 'Pakistan',
        timezone: 'Asia/Karachi',
        status: 'active',
        commission_rate: 15.0,
        is_admin: true,
      };

      try {
        const { data: created } = await supabase
          .from('freelancers')
          .insert(newAdminPayload)
          .select()
          .maybeSingle();

        if (created) {
          freelancer = created;
        }
      } catch (insertErr) {
        console.error('Error auto-creating admin profile:', insertErr);
      }

      if (!freelancer) {
        freelancer = {
          id: user.id,
          ...newAdminPayload,
          created_at: new Date().toISOString(),
        } as Freelancer;
      }
    } else {
      freelancer.is_admin = true;
      try {
        await supabase
          .from('freelancers')
          .update({ is_admin: true, user_id: user.id })
          .eq('id', freelancer.id);
      } catch (updateErr) {
        console.error('Error updating admin profile in DB:', updateErr);
      }
    }

    return { user, freelancer: freelancer as Freelancer, error: null };
  }

  if (freelancerError && !freelancer) {
    return { user, freelancer: null, error: freelancerError.message };
  }

  if (freelancer && !isExplicitAdmin) {
    // If user is edoxe, guarantee freelancer status (is_admin = false)
    const nameLower = (freelancer.name || '').toLowerCase();
    const emailLower = (freelancer.email || '').toLowerCase();
    if (nameLower.includes('edoxe') || emailLower.includes('edoxe')) {
      if (freelancer.is_admin) {
        await supabase
          .from('freelancers')
          .update({ is_admin: false })
          .eq('id', freelancer.id);
        freelancer.is_admin = false;
      }
    }
  }

  return { user, freelancer: freelancer as Freelancer, error: null };
}

export async function getDashboardStats(
  supabase: SupabaseClient,
  freelancerId?: string
): Promise<DashboardStats> {
  const now = new Date();
  
  // 7 days ago in ISO format
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  
  // Start of current month in ISO format
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  let leadsPromise = supabase
    .from('leads')
    .select('*', { count: 'exact', head: true });

  let callsPromise = supabase
    .from('calls')
    .select('*', { count: 'exact', head: true })
    .gte('call_time', sevenDaysAgo);

  let meetingsPromise = supabase
    .from('meetings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'scheduled');

  let salesPromise = supabase
    .from('sales')
    .select('*', { count: 'exact', head: true })
    .gte('sold_at', startOfMonth);

  if (freelancerId === 'unassigned') {
    leadsPromise = leadsPromise.is('assigned_to', null);
  } else if (freelancerId && freelancerId !== 'all') {
    leadsPromise = leadsPromise.eq('assigned_to', freelancerId);
    callsPromise = callsPromise.eq('freelancer_id', freelancerId);
    meetingsPromise = meetingsPromise.eq('freelancer_id', freelancerId);
    salesPromise = salesPromise.eq('freelancer_id', freelancerId);
  }

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
  freelancerId?: string
): Promise<Lead[]> {
  let leadsQuery = supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false });

  if (freelancerId === 'unassigned') {
    leadsQuery = leadsQuery.is('assigned_to', null);
  } else if (freelancerId && freelancerId !== 'all') {
    leadsQuery = leadsQuery.eq('assigned_to', freelancerId);
  }

  const { data: leads, error: leadsError } = await leadsQuery;

  if (leadsError || !leads || leads.length === 0) {
    if (leadsError) console.error('Error in getFreelancerLeads:', leadsError);
    return [];
  }

  // To efficiently get the most recent call_time for each lead,
  // fetch recent calls for these leads
  const leadIds = leads.map((l) => l.id);
  let callsQuery = supabase
    .from('calls')
    .select('lead_id, call_time')
    .in('lead_id', leadIds)
    .order('call_time', { ascending: false });

  if (freelancerId && freelancerId !== 'all' && freelancerId !== 'unassigned') {
    callsQuery = callsQuery.eq('freelancer_id', freelancerId);
  }

  const { data: calls, error: callsError } = await callsQuery;
  if (callsError) console.error('Error fetching calls for leads:', callsError);

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

