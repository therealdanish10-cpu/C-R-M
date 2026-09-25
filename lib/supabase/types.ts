export type Freelancer = {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone: string | null;
  country: string | null;
  timezone: string | null;
  status: string;
  commission_rate: number | null;
  is_admin: boolean;
  created_at: string;
};

export type LeadStatus =
  | 'new'
  | 'contacted'
  | 'interested'
  | 'meeting_booked'
  | 'sold'
  | 'not_interested'
  | 'dead';

export type Lead = {
  id: string;
  business_name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  category: string;
  status: LeadStatus | string;
  assigned_to: string; // freelancer_id
  created_at: string;
  updated_at?: string;
  last_call_date?: string | null;
};

export type Call = {
  id: string;
  lead_id: string;
  freelancer_id: string;
  call_time: string;
  outcome: string | null;
  notes: string | null;
  created_at: string;
};

export type Meeting = {
  id: string;
  lead_id: string;
  freelancer_id: string;
  meeting_datetime: string;
  lead_timezone: string | null;
  platform: string | null;
  meeting_link: string | null;
  status: string; // 'scheduled' etc.
  outcome_notes: string | null;
  created_at: string;
};

export type Sale = {
  id: string;
  lead_id: string;
  freelancer_id: string;
  meeting_id: string | null;
  sale_amount: number;
  commission_amount: number | null;
  payment_link: string | null;
  payment_screenshot_url: string | null;
  payment_status: string;
  credentials_sent: boolean;
  sold_at: string;
};

export type DashboardStats = {
  totalLeadsAssigned: number;
  callsMadeThisWeek: number;
  meetingsBooked: number;
  salesClosedThisMonth: number;
};
