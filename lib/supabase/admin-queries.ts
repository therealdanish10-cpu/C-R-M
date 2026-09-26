import { SupabaseClient } from '@supabase/supabase-js';
import { Freelancer, Lead, Call, Meeting, Sale, MeetingWithLead } from './types';

export type AdminFreelancerPerformance = {
  freelancer: Freelancer;
  leadsAssigned: number;
  callsThisWeek: number;
  meetingsBooked: number;
  salesClosed: number;
  commissionOwed: number;
};

export type AdminOverviewStats = {
  totalLeads: number;
  callsThisWeek: number;
  meetingsBooked: number;
  salesClosedThisMonth: number;
  commissionOwedThisMonth: number;
};

export type AdminLeadWithDetails = Lead & {
  freelancerName?: string;
};

export type AdminSaleWithDetails = Sale & {
  businessName?: string;
  freelancerName?: string;
};

export type AdminMeetingWithDetails = MeetingWithLead & {
  freelancerName?: string;
};

// Check if currently authenticated user is an admin
export async function checkIsAdmin(supabase: SupabaseClient): Promise<{
  isAdmin: boolean;
  freelancer: Freelancer | null;
}> {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return { isAdmin: false, freelancer: null };
  }

  const { data: freelancer } = await supabase
    .from('freelancers')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (!freelancer) {
    return { isAdmin: false, freelancer: null };
  }

  return {
    isAdmin: Boolean(freelancer.is_admin),
    freelancer: freelancer as Freelancer,
  };
}

// 1. Overview Page Data
export async function getAdminOverviewData(supabase: SupabaseClient): Promise<{
  stats: AdminOverviewStats;
  performance: AdminFreelancerPerformance[];
}> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  // Fetch all core datasets across ALL freelancers
  const [freelancersRes, leadsRes, callsRes, meetingsRes, salesRes] = await Promise.all([
    supabase.from('freelancers').select('*').order('name', { ascending: true }),
    supabase.from('leads').select('id, assigned_to'),
    supabase.from('calls').select('id, freelancer_id, call_time').gte('call_time', sevenDaysAgo),
    supabase.from('meetings').select('id, freelancer_id, status').eq('status', 'scheduled'),
    supabase.from('sales').select('*').gte('sold_at', startOfMonth),
  ]);

  const freelancers = (freelancersRes.data || []) as Freelancer[];
  const leads = leadsRes.data || [];
  const calls = callsRes.data || [];
  const meetings = meetingsRes.data || [];
  const sales = (salesRes.data || []) as Sale[];

  // Calculate confirmed commission this month
  const totalCommission = sales
    .filter((s) => s.payment_status?.toLowerCase() === 'confirmed')
    .reduce((sum, s) => {
      const comm = s.commission_amount ?? (s.sale_amount ? s.sale_amount * 0.15 : 0);
      return sum + Number(comm);
    }, 0);

  const stats: AdminOverviewStats = {
    totalLeads: leads.length,
    callsThisWeek: calls.length,
    meetingsBooked: meetings.length,
    salesClosedThisMonth: sales.length,
    commissionOwedThisMonth: totalCommission,
  };

  // Build per-freelancer performance metrics
  const performance: AdminFreelancerPerformance[] = freelancers.map((fl) => {
    const flLeadsCount = leads.filter((l) => l.assigned_to === fl.id).length;
    const flCallsCount = calls.filter((c) => c.freelancer_id === fl.id).length;
    const flMeetingsCount = meetings.filter((m) => m.freelancer_id === fl.id).length;
    const flSales = sales.filter((s) => s.freelancer_id === fl.id);
    const flSalesClosed = flSales.length;

    const flCommissionOwed = flSales
      .filter((s) => s.payment_status?.toLowerCase() === 'confirmed')
      .reduce((sum, s) => {
        const rate = (fl.commission_rate ?? 15) / 100;
        const comm = s.commission_amount ?? (s.sale_amount * rate);
        return sum + Number(comm);
      }, 0);

    return {
      freelancer: fl,
      leadsAssigned: flLeadsCount,
      callsThisWeek: flCallsCount,
      meetingsBooked: flMeetingsCount,
      salesClosed: flSalesClosed,
      commissionOwed: flCommissionOwed,
    };
  });

  return { stats, performance };
}

// 2. Admin Leads Data
export async function getAdminLeadsData(supabase: SupabaseClient): Promise<{
  leads: AdminLeadWithDetails[];
  freelancers: Freelancer[];
}> {
  const [leadsRes, freelancersRes, callsRes] = await Promise.all([
    supabase.from('leads').select('*').order('created_at', { ascending: false }),
    supabase.from('freelancers').select('*').order('name', { ascending: true }),
    supabase.from('calls').select('lead_id, call_time').order('call_time', { ascending: false }),
  ]);

  const leads = (leadsRes.data || []) as Lead[];
  const freelancers = (freelancersRes.data || []) as Freelancer[];
  const calls = callsRes.data || [];

  const flMap = new Map<string, string>();
  freelancers.forEach((f) => flMap.set(f.id, f.name));

  const latestCallMap = new Map<string, string>();
  calls.forEach((c) => {
    if (c.lead_id && !latestCallMap.has(c.lead_id)) {
      latestCallMap.set(c.lead_id, c.call_time);
    }
  });

  const enrichedLeads: AdminLeadWithDetails[] = leads.map((lead) => ({
    ...lead,
    freelancerName: flMap.get(lead.assigned_to) || 'Unassigned',
    last_call_date: latestCallMap.get(lead.id) || null,
  }));

  return { leads: enrichedLeads, freelancers };
}

// 3. Admin Freelancers Data
export async function getAdminFreelancersData(supabase: SupabaseClient): Promise<Freelancer[]> {
  const { data } = await supabase.from('freelancers').select('*').order('created_at', { ascending: false });
  return (data || []) as Freelancer[];
}

// 4. Admin Sales Data
export async function getAdminSalesData(supabase: SupabaseClient): Promise<{
  sales: AdminSaleWithDetails[];
  freelancers: Freelancer[];
}> {
  const [salesRes, leadsRes, freelancersRes] = await Promise.all([
    supabase.from('sales').select('*').order('sold_at', { ascending: false }),
    supabase.from('leads').select('id, business_name'),
    supabase.from('freelancers').select('id, name').order('name', { ascending: true }),
  ]);

  const sales = (salesRes.data || []) as Sale[];
  const leads = leadsRes.data || [];
  const freelancers = (freelancersRes.data || []) as Freelancer[];

  const leadMap = new Map<string, string>();
  leads.forEach((l) => leadMap.set(l.id, l.business_name));

  const flMap = new Map<string, string>();
  freelancers.forEach((f) => flMap.set(f.id, f.name));

  const enrichedSales: AdminSaleWithDetails[] = sales.map((sale) => ({
    ...sale,
    businessName: leadMap.get(sale.lead_id) || 'Unknown Lead',
    freelancerName: flMap.get(sale.freelancer_id) || 'Unknown Freelancer',
  }));

  return { sales: enrichedSales, freelancers };
}

// 5. Admin Calendar Data (All freelancers combined)
export async function getAdminCalendarData(supabase: SupabaseClient): Promise<{
  meetings: AdminMeetingWithDetails[];
  freelancers: Freelancer[];
}> {
  const [meetingsRes, leadsRes, freelancersRes] = await Promise.all([
    supabase.from('meetings').select('*').order('meeting_datetime', { ascending: true }),
    supabase.from('leads').select('id, business_name, phone, category'),
    supabase.from('freelancers').select('*').order('name', { ascending: true }),
  ]);

  const meetings = (meetingsRes.data || []) as Meeting[];
  const leads = leadsRes.data || [];
  const freelancers = (freelancersRes.data || []) as Freelancer[];

  const leadMap = new Map<string, { id?: string; business_name: string; phone: string; category?: string }>();
  leads.forEach((l) => leadMap.set(l.id, l));

  const flMap = new Map<string, string>();
  freelancers.forEach((f) => flMap.set(f.id, f.name));

  const enrichedMeetings: AdminMeetingWithDetails[] = meetings.map((m) => ({
    ...m,
    lead: leadMap.get(m.lead_id) || null,
    freelancerName: flMap.get(m.freelancer_id) || 'Unassigned',
  }));

  return { meetings: enrichedMeetings, freelancers };
}
