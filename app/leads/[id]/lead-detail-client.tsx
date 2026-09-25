'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Lead, Call, Meeting, Sale, LeadStatus } from '@/lib/supabase/types';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  PhoneCall,
  DollarSign,
  Clock,
  Video,
  Plus,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ChevronDown,
  Edit3,
  CalendarPlus,
  ShieldCheck,
  Building2,
  X,
} from 'lucide-react';

interface LeadDetailClientProps {
  initialLead: Lead;
  initialCalls: Call[];
  initialMeetings: Meeting[];
  initialSales: Sale[];
  freelancerId: string;
  isSupabaseConfigured: boolean;
}

export function LeadDetailClient({
  initialLead,
  initialCalls,
  initialMeetings,
  initialSales,
  freelancerId,
  isSupabaseConfigured,
}: LeadDetailClientProps) {
  const router = useRouter();
  const [lead, setLead] = useState<Lead>(initialLead);
  const [calls, setCalls] = useState<Call[]>(initialCalls);
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings);
  const [sales, setSales] = useState<Sale[]>(initialSales);

  // Status update state
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Call Log form state
  const [showCallForm, setShowCallForm] = useState(false);
  const [callOutcome, setCallOutcome] = useState<'no_answer' | 'not_interested' | 'callback_requested' | 'meeting_booked' | 'sold'>('no_answer');
  const [callNotes, setCallNotes] = useState('');
  const [isSubmittingCall, setIsSubmittingCall] = useState(false);

  // Meeting Schedule form state
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingDate, setMeetingDate] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [meetingPlatform, setMeetingPlatform] = useState<'zoom' | 'google_meet'>('google_meet');
  const [meetingLink, setMeetingLink] = useState('');
  const [isSubmittingMeeting, setIsSubmittingMeeting] = useState(false);

  // Meeting Edit Modal state
  const [editingMeeting, setEditingMeeting] = useState<Meeting | null>(null);
  const [editMeetingStatus, setEditMeetingStatus] = useState<string>('scheduled');
  const [editMeetingNotes, setEditMeetingNotes] = useState<string>('');
  const [isUpdatingMeeting, setIsUpdatingMeeting] = useState(false);

  // Sale form state
  const [showSaleForm, setShowSaleForm] = useState(false);
  const [saleAmount, setSaleAmount] = useState<string>('');
  const [paymentLink, setPaymentLink] = useState<string>('');
  const [isSubmittingSale, setIsSubmittingSale] = useState(false);

  const showNotification = (text: string, type: 'success' | 'error' = 'success') => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  // Helper for Status Badge styling
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    switch (s) {
      case 'new':
        return {
          label: 'New',
          classes: 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
        };
      case 'contacted':
        return {
          label: 'Contacted',
          classes: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
        };
      case 'interested':
        return {
          label: 'Interested',
          classes: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
        };
      case 'meeting_booked':
        return {
          label: 'Meeting Booked',
          classes: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
        };
      case 'sold':
        return {
          label: 'Sold',
          classes: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'not_interested':
        return {
          label: 'Not Interested',
          classes: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
        };
      case 'dead':
        return {
          label: 'Dead',
          classes: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
        };
      default:
        return {
          label: status,
          classes: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
        };
    }
  };

  // Helper for Call Outcome Badge styling
  const getCallOutcomeBadge = (outcome: string | null) => {
    const o = (outcome || '').toLowerCase().trim();
    switch (o) {
      case 'no_answer':
        return { label: 'No Answer', classes: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' };
      case 'not_interested':
        return { label: 'Not Interested', classes: 'bg-rose-100 text-rose-700 border-rose-300 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800' };
      case 'callback_requested':
        return { label: 'Callback Requested', classes: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800' };
      case 'meeting_booked':
        return { label: 'Meeting Booked', classes: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800' };
      case 'sold':
        return { label: 'Sold', classes: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800' };
      default:
        return { label: outcome || 'Call Logged', classes: 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800' };
    }
  };

  // Helper for Meeting Status Badge styling
  const getMeetingStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    switch (s) {
      case 'scheduled':
        return { label: 'Scheduled', classes: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800' };
      case 'completed':
        return { label: 'Completed', classes: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800' };
      case 'no_show':
        return { label: 'No Show', classes: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800' };
      case 'rescheduled':
        return { label: 'Rescheduled', classes: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800' };
      case 'cancelled':
        return { label: 'Cancelled', classes: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' };
      default:
        return { label: status, classes: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700' };
    }
  };

  // 1. Handle Status Change
  const handleStatusChange = async (newStatus: string) => {
    setIsUpdatingStatus(true);
    const previousStatus = lead.status;
    setLead((prev) => ({ ...prev, status: newStatus }));

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('leads')
          .update({ status: newStatus, updated_at: new Date().toISOString() })
          .eq('id', lead.id);

        if (error) {
          setLead((prev) => ({ ...prev, status: previousStatus }));
          showNotification(`Failed to update status: ${error.message}`, 'error');
        } else {
          showNotification(`Lead status updated to "${newStatus}"`);
        }
      } catch (err: any) {
        setLead((prev) => ({ ...prev, status: previousStatus }));
        showNotification(err?.message || 'Error updating status', 'error');
      }
    } else {
      showNotification(`[Demo Mode] Status updated to "${newStatus}"`);
    }

    setIsUpdatingStatus(false);
  };

  // 2. Handle Log a Call
  const handleLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingCall(true);

    const newCallData = {
      lead_id: lead.id,
      freelancer_id: freelancerId,
      call_time: new Date().toISOString(),
      outcome: callOutcome,
      notes: callNotes.trim() || null,
    };

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('calls')
          .insert(newCallData)
          .select()
          .single();

        if (error) {
          showNotification(`Failed to log call: ${error.message}`, 'error');
        } else {
          setCalls((prev) => [data as Call, ...prev]);
          setCallNotes('');
          setShowCallForm(false);
          showNotification('Call logged successfully');
        }
      } catch (err: any) {
        showNotification(err?.message || 'Error logging call', 'error');
      }
    } else {
      // Demo mode insertion
      const mockCall: Call = {
        id: `call-demo-${Date.now()}`,
        ...newCallData,
        created_at: new Date().toISOString(),
      };
      setCalls((prev) => [mockCall, ...prev]);
      setCallNotes('');
      setShowCallForm(false);
      showNotification('[Demo Mode] Call logged successfully');
    }

    setIsSubmittingCall(false);
  };

  // 3. Handle Schedule Meeting
  const handleScheduleMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!meetingDate || !meetingTime) {
      showNotification('Please select both a date and a time for the meeting', 'error');
      return;
    }

    setIsSubmittingMeeting(true);

    // Combine local date and time into UTC ISO timestamp
    const combinedDate = new Date(`${meetingDate}T${meetingTime}`);
    const meetingDatetime = combinedDate.toISOString();

    const newMeetingData = {
      lead_id: lead.id,
      freelancer_id: freelancerId,
      meeting_datetime: meetingDatetime,
      lead_timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      platform: meetingPlatform,
      meeting_link: meetingLink.trim() || null,
      status: 'scheduled',
      outcome_notes: null,
    };

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('meetings')
          .insert(newMeetingData)
          .select()
          .single();

        if (error) {
          showNotification(`Failed to schedule meeting: ${error.message}`, 'error');
        } else {
          setMeetings((prev) => [data as Meeting, ...prev]);
          setShowMeetingForm(false);
          setMeetingDate('');
          setMeetingTime('');
          setMeetingLink('');
          showNotification('Meeting scheduled successfully');
        }
      } catch (err: any) {
        showNotification(err?.message || 'Error scheduling meeting', 'error');
      }
    } else {
      const mockMeeting: Meeting = {
        id: `meet-demo-${Date.now()}`,
        ...newMeetingData,
        created_at: new Date().toISOString(),
      };
      setMeetings((prev) => [mockMeeting, ...prev]);
      setShowMeetingForm(false);
      setMeetingDate('');
      setMeetingTime('');
      setMeetingLink('');
      showNotification('[Demo Mode] Meeting scheduled successfully');
    }

    setIsSubmittingMeeting(false);
  };

  // 4. Handle Update Meeting (Status & Outcome Notes)
  const handleSaveMeetingUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMeeting) return;

    setIsUpdatingMeeting(true);

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('meetings')
          .update({
            status: editMeetingStatus,
            outcome_notes: editMeetingNotes.trim() || null,
          })
          .eq('id', editingMeeting.id);

        if (error) {
          showNotification(`Failed to update meeting: ${error.message}`, 'error');
        } else {
          setMeetings((prev) =>
            prev.map((m) =>
              m.id === editingMeeting.id
                ? { ...m, status: editMeetingStatus, outcome_notes: editMeetingNotes.trim() || null }
                : m
            )
          );
          setEditingMeeting(null);
          showNotification('Meeting updated successfully');
        }
      } catch (err: any) {
        showNotification(err?.message || 'Error updating meeting', 'error');
      }
    } else {
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === editingMeeting.id
            ? { ...m, status: editMeetingStatus, outcome_notes: editMeetingNotes.trim() || null }
            : m
        )
      );
      setEditingMeeting(null);
      showNotification('[Demo Mode] Meeting updated successfully');
    }

    setIsUpdatingMeeting(false);
  };

  // 5. Handle Record Sale
  const handleRecordSale = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNumber = parseFloat(saleAmount);
    if (isNaN(amountNumber) || amountNumber <= 0) {
      showNotification('Please enter a valid sale amount', 'error');
      return;
    }

    setIsSubmittingSale(true);

    const newSaleData = {
      freelancer_id: freelancerId,
      lead_id: lead.id,
      meeting_id: meetings.length > 0 ? meetings[0].id : null,
      sale_amount: amountNumber,
      commission_amount: null,
      payment_link: paymentLink.trim() || null,
      payment_screenshot_url: null,
      payment_status: 'pending',
      credentials_sent: false,
      sold_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('sales')
          .insert(newSaleData)
          .select()
          .single();

        if (error) {
          showNotification(`Failed to record sale: ${error.message}`, 'error');
        } else {
          setSales((prev) => [data as Sale, ...prev]);
          setShowSaleForm(false);
          setSaleAmount('');
          setPaymentLink('');
          showNotification('Sale recorded successfully');
        }
      } catch (err: any) {
        showNotification(err?.message || 'Error recording sale', 'error');
      }
    } else {
      const mockSale: Sale = {
        id: `sale-demo-${Date.now()}`,
        ...newSaleData,
      };
      setSales((prev) => [mockSale, ...prev]);
      setShowSaleForm(false);
      setSaleAmount('');
      setPaymentLink('');
      showNotification('[Demo Mode] Sale recorded successfully');
    }

    setIsSubmittingSale(false);
  };

  const statusBadge = getStatusBadge(lead.status);
  const showSaleSection = sales.length > 0 || lead.status.toLowerCase() === 'sold';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Floating Notification */}
        {feedbackMsg && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 text-sm transition-all animate-in fade-in slide-in-from-top-4 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{feedbackMsg.text}</span>
          </div>
        )}

        {/* Back Link */}
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-sm font-semibold text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-x-1" />
            Back to Leads Dashboard
          </Link>
          <span className="text-xs text-zinc-400 font-mono">Lead: {lead.id.slice(0, 8)}</span>
        </div>

        {/* 1. Header Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 sm:p-7 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {lead.business_name}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {lead.category || 'General'}
                </span>
              </div>
            </div>

            {/* Status Badge + Change Status Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              <span
                className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${statusBadge.classes}`}
              >
                <span className="w-2 h-2 rounded-full bg-current mr-2 opacity-80"></span>
                {statusBadge.label}
              </span>

              {/* Status Select */}
              <div className="relative inline-block">
                <select
                  value={lead.status}
                  disabled={isUpdatingStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="pl-3 pr-8 py-1.5 text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer disabled:opacity-50"
                >
                  <option value="new">Mark New</option>
                  <option value="contacted">Mark Contacted</option>
                  <option value="interested">Mark Interested</option>
                  <option value="meeting_booked">Mark Meeting Booked</option>
                  <option value="sold">Mark Sold</option>
                  <option value="not_interested">Mark Not Interested</option>
                  <option value="dead">Mark Dead</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Contact Details Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-xs sm:text-sm">
            {/* Phone */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 shrink-0">
                <Phone className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-semibold">Phone</span>
                {lead.phone ? (
                  <a
                    href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                    className="font-medium text-emerald-700 dark:text-emerald-400 hover:underline truncate block"
                  >
                    {lead.phone}
                  </a>
                ) : (
                  <span className="text-zinc-400 italic">No phone</span>
                )}
              </div>
            </div>

            {/* Email */}
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 shrink-0">
                <Mail className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-semibold">Email</span>
                {lead.email ? (
                  <a
                    href={`mailto:${lead.email}`}
                    className="font-medium text-zinc-800 dark:text-zinc-200 hover:text-blue-600 truncate block"
                  >
                    {lead.email}
                  </a>
                ) : (
                  <span className="text-zinc-400 italic">No email</span>
                )}
              </div>
            </div>

            {/* Address / Location */}
            <div className="flex items-center gap-2.5 sm:col-span-2">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <div className="overflow-hidden">
                <span className="text-[11px] uppercase tracking-wider text-zinc-400 block font-semibold">Location</span>
                <span className="font-medium text-zinc-800 dark:text-zinc-200 truncate block">
                  {[lead.address, lead.city, lead.state].filter(Boolean).join(', ') || 'No address provided'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Call Log Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 sm:p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <PhoneCall className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Call Logs
                </h2>
                <p className="text-xs text-zinc-500">
                  {calls.length} total call{calls.length === 1 ? '' : 's'} recorded
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCallForm(!showCallForm)}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white transition-all shadow-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Log a Call
            </button>
          </div>

          {/* Log Call Form Drawer / Inline Form */}
          {showCallForm && (
            <form
              onSubmit={handleLogCall}
              className="mb-6 p-4 sm:p-5 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800/60 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-900 dark:text-indigo-300">
                  New Call Record
                </h3>
                <button
                  type="button"
                  onClick={() => setShowCallForm(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Outcome
                  </label>
                  <select
                    value={callOutcome}
                    onChange={(e: any) => setCallOutcome(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-medium"
                  >
                    <option value="no_answer">No Answer</option>
                    <option value="not_interested">Not Interested</option>
                    <option value="callback_requested">Callback Requested</option>
                    <option value="meeting_booked">Meeting Booked</option>
                    <option value="sold">Sold</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Notes
                  </label>
                  <textarea
                    rows={2}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Details about what was discussed, objections, next steps..."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCallForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCall}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {isSubmittingCall ? 'Saving...' : 'Save Call'}
                </button>
              </div>
            </form>
          )}

          {/* Reverse-chronological timeline of past calls */}
          {calls.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs">
              <PhoneCall className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2 opacity-60" />
              <p className="font-medium text-zinc-500 dark:text-zinc-400">No calls logged yet</p>
              <p className="text-[11px] text-zinc-400">Click &quot;Log a Call&quot; to add your first cold-call outcome.</p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-zinc-200 dark:before:bg-zinc-800">
              {calls.map((call) => {
                const badge = getCallOutcomeBadge(call.outcome);
                return (
                  <div key={call.id} className="relative group">
                    {/* Timeline Node */}
                    <div className="absolute -left-6 top-1.5 w-2.5 h-2.5 rounded-full bg-indigo-500 border-2 border-white dark:border-zinc-900 ring-2 ring-indigo-200 dark:ring-indigo-950"></div>

                    <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 transition-colors">
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badge.classes}`}>
                          {badge.label}
                        </span>
                        <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                          <Clock className="w-3 h-3" />
                          {new Date(call.call_time).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      {call.notes ? (
                        <p className="text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed mt-1">
                          {call.notes}
                        </p>
                      ) : (
                        <p className="text-xs italic text-zinc-400">No additional notes</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 3. Meetings Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 sm:p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Meetings
                </h2>
                <p className="text-xs text-zinc-500">
                  {meetings.length} meeting{meetings.length === 1 ? '' : 's'} on schedule
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowMeetingForm(!showMeetingForm)}
              className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs"
            >
              <CalendarPlus className="w-3.5 h-3.5 mr-1.5" />
              Schedule Meeting
            </button>
          </div>

          {/* Schedule Meeting Form */}
          {showMeetingForm && (
            <form
              onSubmit={handleScheduleMeeting}
              className="mb-6 p-4 sm:p-5 rounded-xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/60 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-900 dark:text-purple-300">
                  Schedule New Meeting
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMeetingForm(false)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    required
                    value={meetingDate}
                    onChange={(e) => setMeetingDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    required
                    value={meetingTime}
                    onChange={(e) => setMeetingTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Platform
                  </label>
                  <select
                    value={meetingPlatform}
                    onChange={(e: any) => setMeetingPlatform(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-medium"
                  >
                    <option value="google_meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                    Meeting Link (Optional)
                  </label>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 placeholder-zinc-400"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowMeetingForm(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingMeeting}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-purple-600 text-white hover:bg-purple-700 transition disabled:opacity-50"
                >
                  {isSubmittingMeeting ? 'Scheduling...' : 'Save Meeting'}
                </button>
              </div>
            </form>
          )}

          {/* List of Meetings */}
          {meetings.length === 0 ? (
            <div className="py-8 text-center text-zinc-400 text-xs">
              <Calendar className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-700 mb-2 opacity-60" />
              <p className="font-medium text-zinc-500 dark:text-zinc-400">No meetings scheduled</p>
              <p className="text-[11px] text-zinc-400">Book a meeting after an interested cold call.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.map((m) => {
                const statusBadgeInfo = getMeetingStatusBadge(m.status);
                const localFormattedTime = new Date(m.meeting_datetime).toLocaleString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                return (
                  <div
                    key={m.id}
                    className="p-4 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          <Calendar className="w-4 h-4 text-purple-500" />
                          {localFormattedTime}
                        </span>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${statusBadgeInfo.classes}`}>
                          {statusBadgeInfo.label}
                        </span>
                        <span className="text-xs uppercase tracking-wider font-semibold text-zinc-500 dark:text-zinc-400 bg-zinc-200/60 dark:bg-zinc-700/60 px-2 py-0.5 rounded">
                          {m.platform === 'zoom' ? 'Zoom' : 'Google Meet'}
                        </span>
                      </div>

                      {m.meeting_link && (
                        <div className="text-xs">
                          <a
                            href={m.meeting_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-mono"
                          >
                            <Video className="w-3.5 h-3.5 mr-1" />
                            {m.meeting_link}
                            <ExternalLink className="w-3 h-3 ml-1" />
                          </a>
                        </div>
                      )}

                      {m.outcome_notes && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 italic pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                          Notes: {m.outcome_notes}
                        </p>
                      )}
                    </div>

                    {/* Button to update status & notes */}
                    <div className="shrink-0 flex items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                      <button
                        onClick={() => {
                          setEditingMeeting(m);
                          setEditMeetingStatus(m.status || 'scheduled');
                          setEditMeetingNotes(m.outcome_notes || '');
                        }}
                        className="inline-flex items-center px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-800 dark:text-zinc-200 transition"
                      >
                        <Edit3 className="w-3.5 h-3.5 mr-1" />
                        Update Meeting
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 4. Sale Section (Only show if a sale exists OR status = 'sold') */}
        {showSaleSection && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-5 sm:p-6 shadow-sm border border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    Sale & Payment
                  </h2>
                  <p className="text-xs text-zinc-500">
                    {sales.length > 0 ? 'Closed deal details' : 'Lead marked as Sold — record transaction'}
                  </p>
                </div>
              </div>

              {sales.length === 0 && (
                <button
                  onClick={() => setShowSaleForm(!showSaleForm)}
                  className="inline-flex items-center px-3.5 py-2 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-all shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  Record Sale
                </button>
              )}
            </div>

            {/* Record Sale Form */}
            {showSaleForm && sales.length === 0 && (
              <form
                onSubmit={handleRecordSale}
                className="mb-6 p-4 sm:p-5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900 dark:text-emerald-300">
                    Record Closed Sale
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowSaleForm(false)}
                    className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Sale Amount ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      placeholder="e.g. 500.00"
                      value={saleAmount}
                      onChange={(e) => setSaleAmount(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                      Payment Link (Optional)
                    </label>
                    <input
                      type="url"
                      placeholder="https://buy.stripe.com/..."
                      value={paymentLink}
                      onChange={(e) => setPaymentLink(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowSaleForm(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmittingSale}
                    className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition disabled:opacity-50"
                  >
                    {isSubmittingSale ? 'Saving...' : 'Save Sale'}
                  </button>
                </div>
              </form>
            )}

            {/* Existing Sales Display */}
            {sales.length > 0 ? (
              <div className="space-y-3">
                {sales.map((sale) => (
                  <div
                    key={sale.id}
                    className="p-5 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/60"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      {/* Sale Amount */}
                      <div>
                        <span className="text-xs uppercase tracking-wider text-emerald-800 dark:text-emerald-300 font-bold block mb-1">
                          Sale Amount
                        </span>
                        <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
                          ${Number(sale.sale_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </span>
                        <div className="text-[11px] text-zinc-400 mt-0.5">
                          Sold on {new Date(sale.sold_at).toLocaleDateString()}
                        </div>
                      </div>

                      {/* Payment Status */}
                      <div>
                        <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
                          Payment Status
                        </span>
                        <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700">
                          {sale.payment_status || 'Pending'}
                        </span>
                      </div>

                      {/* Payment Link */}
                      <div>
                        <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
                          Payment Link
                        </span>
                        {sale.payment_link ? (
                          <a
                            href={sale.payment_link}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center text-xs text-blue-600 dark:text-blue-400 hover:underline font-mono truncate max-w-full"
                          >
                            <span>Open Link</span>
                            <ExternalLink className="w-3 h-3 ml-1 shrink-0" />
                          </a>
                        ) : (
                          <span className="text-xs text-zinc-400 italic">None provided</span>
                        )}
                      </div>

                      {/* Credentials Sent */}
                      <div>
                        <span className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-400 font-semibold block mb-1">
                          Credentials Sent
                        </span>
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
                            sale.credentials_sent
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                          }`}
                        >
                          <ShieldCheck className="w-3 h-3 mr-1" />
                          {sale.credentials_sent ? 'Yes' : 'No'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-zinc-400 text-xs">
                <p className="font-medium text-zinc-600 dark:text-zinc-400">No sale record logged yet.</p>
                <p className="text-[11px] text-zinc-400 mt-1">Click &quot;Record Sale&quot; to log the transaction amount.</p>
              </div>
            )}
          </div>
        )}

        {/* Modal: Update Meeting Status & Outcome Notes */}
        {editingMeeting && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                <h3 className="font-bold text-base text-zinc-900 dark:text-zinc-100">
                  Update Meeting Status & Notes
                </h3>
                <button
                  onClick={() => setEditingMeeting(null)}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveMeetingUpdate} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Meeting Status
                  </label>
                  <select
                    value={editMeetingStatus}
                    onChange={(e) => setEditMeetingStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium"
                  >
                    <option value="scheduled">Scheduled</option>
                    <option value="completed">Completed</option>
                    <option value="no_show">No Show</option>
                    <option value="rescheduled">Rescheduled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Outcome Notes
                  </label>
                  <textarea
                    rows={4}
                    value={editMeetingNotes}
                    onChange={(e) => setEditMeetingNotes(e.target.value)}
                    placeholder="Summary of meeting discussion, client questions, agreements, etc."
                    className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setEditingMeeting(null)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingMeeting}
                    className="px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50"
                  >
                    {isUpdatingMeeting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
