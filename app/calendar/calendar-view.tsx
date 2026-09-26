'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { MeetingWithLead } from '@/lib/supabase/types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Video,
  ExternalLink,
  Edit3,
  X,
  CheckCircle2,
  AlertCircle,
  Globe,
  User,
  Building2,
  CalendarDays,
  ListFilter,
  Check,
} from 'lucide-react';

interface CalendarViewProps {
  initialMeetings: MeetingWithLead[];
  freelancerTimezone: string;
  isSupabaseConfigured: boolean;
}

type ViewMode = 'month' | 'week' | 'day';

export function CalendarView({
  initialMeetings,
  freelancerTimezone,
  isSupabaseConfigured,
}: CalendarViewProps) {
  const [meetings, setMeetings] = useState<MeetingWithLead[]>(initialMeetings);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState<MeetingWithLead | null>(null);

  // Edit meeting modal state
  const [editStatus, setEditStatus] = useState<string>('scheduled');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Toast feedback
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const tz = freelancerTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  // Format meeting date into target timezone components
  const parseMeetingDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dateKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d); // "YYYY-MM-DD"

    const timeFormatted = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    const fullFormatted = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(d);

    return { dateKey, timeFormatted, fullFormatted, rawDate: d };
  };

  // Color mapping matching requirements:
  // scheduled = blue, completed = green, no_show = red, rescheduled = yellow, cancelled = gray
  const getStatusStyles = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    switch (s) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          chip: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800 hover:bg-blue-200 dark:hover:bg-blue-900',
          badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
          dot: 'bg-blue-500',
        };
      case 'completed':
        return {
          label: 'Completed',
          chip: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-200 dark:hover:bg-emerald-900',
          badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
          dot: 'bg-emerald-500',
        };
      case 'no_show':
        return {
          label: 'No Show',
          chip: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800 hover:bg-rose-200 dark:hover:bg-rose-900',
          badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300 dark:border-rose-800',
          dot: 'bg-rose-500',
        };
      case 'rescheduled':
        return {
          label: 'Rescheduled',
          chip: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-200 dark:hover:bg-amber-900',
          badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
          dot: 'bg-amber-500',
        };
      case 'cancelled':
        return {
          label: 'Cancelled',
          chip: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 hover:bg-zinc-200 dark:hover:bg-zinc-700',
          badge: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
          dot: 'bg-zinc-400',
        };
      default:
        return {
          label: status,
          chip: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
          badge: 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
          dot: 'bg-zinc-400',
        };
    }
  };

  // Group meetings by DateKey (YYYY-MM-DD in freelancer timezone)
  const meetingsByDate = useMemo(() => {
    const map = new Map<string, Array<{ meeting: MeetingWithLead; timeFormatted: string; fullFormatted: string; rawDate: Date }>>();
    for (const m of meetings) {
      if (!m.meeting_datetime) continue;
      const parsed = parseMeetingDate(m.meeting_datetime);
      const list = map.get(parsed.dateKey) || [];
      list.push({ meeting: m, ...parsed });
      map.set(parsed.dateKey, list);
    }
    // Sort meetings in each day chronologically
    map.forEach((list) => {
      list.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    });
    return map;
  }, [meetings, tz]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() - 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() - 7);
      } else {
        d.setDate(d.getDate() - 1);
      }
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') {
        d.setMonth(d.getMonth() + 1);
      } else if (viewMode === 'week') {
        d.setDate(d.getDate() + 7);
      } else {
        d.setDate(d.getDate() + 1);
      }
      return d;
    });
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Period title based on view
  const periodTitle = useMemo(() => {
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    }
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }
    // Week mode: get Sunday to Saturday range
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const startDay = startOfWeek.getDate();
    const endDay = endOfWeek.getDate();
    const year = endOfWeek.getFullYear();

    if (startMonth === endMonth) {
      return `${startMonth} ${startDay} – ${endDay}, ${year}`;
    }
    return `${startMonth} ${startDay} – ${endMonth} ${endDay}, ${year}`;
  }, [viewMode, currentDate]);

  // Generate calendar days for Month View
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: Array<{
      date: Date;
      dateKey: string;
      dayNumber: number;
      isCurrentMonth: boolean;
      isToday: boolean;
    }> = [];

    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      days.push({
        date: d,
        dateKey,
        dayNumber: daysInPrevMonth - i,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
      });
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: d,
        dateKey,
        dayNumber: day,
        isCurrentMonth: true,
        isToday: dateKey === todayStr,
      });
    }

    // Next month padding to reach 35 or 42 cells
    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push({
        date: d,
        dateKey,
        dayNumber: day,
        isCurrentMonth: false,
        isToday: dateKey === todayStr,
      });
    }

    return days;
  }, [currentDate, tz]);

  // Week days
  const weekDays = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);

    const todayStr = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date());

    return Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(d.getDate() + i);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return {
        date: d,
        dateKey,
        dayName: d.toLocaleDateString('en-US', { weekday: 'short' }),
        dayNumber: d.getDate(),
        isToday: dateKey === todayStr,
      };
    });
  }, [currentDate, tz]);

  // Day View data
  const dayKey = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  }, [currentDate]);

  // Check if current view has any meetings to display empty state
  const hasMeetingsInCurrentView = useMemo(() => {
    if (viewMode === 'month') {
      return monthDays.some((d) => (meetingsByDate.get(d.dateKey)?.length || 0) > 0);
    }
    if (viewMode === 'week') {
      return weekDays.some((d) => (meetingsByDate.get(d.dateKey)?.length || 0) > 0);
    }
    return (meetingsByDate.get(dayKey)?.length || 0) > 0;
  }, [viewMode, monthDays, weekDays, dayKey, meetingsByDate]);

  // All meetings in period for Agenda / List view (used for mobile and empty state fallback)
  const currentPeriodMeetings = useMemo(() => {
    const list: Array<{ meeting: MeetingWithLead; timeFormatted: string; fullFormatted: string; dateKey: string; rawDate: Date }> = [];
    const keys =
      viewMode === 'month'
        ? monthDays.map((d) => d.dateKey)
        : viewMode === 'week'
        ? weekDays.map((d) => d.dateKey)
        : [dayKey];

    const uniqueKeys = Array.from(new Set(keys));
    uniqueKeys.forEach((k) => {
      const dayMeetings = meetingsByDate.get(k);
      if (dayMeetings) {
        dayMeetings.forEach((m) => list.push({ ...m, dateKey: k }));
      }
    });

    list.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime());
    return list;
  }, [viewMode, monthDays, weekDays, dayKey, meetingsByDate]);

  // Handle open meeting popup
  const handleOpenMeeting = (meeting: MeetingWithLead) => {
    setSelectedMeeting(meeting);
    setEditStatus(meeting.status || 'scheduled');
    setEditNotes(meeting.outcome_notes || '');
  };

  // Handle save meeting changes (status + notes)
  const handleSaveMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMeeting) return;

    setIsSaving(true);

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('meetings')
          .update({
            status: editStatus,
            outcome_notes: editNotes.trim() || null,
          })
          .eq('id', selectedMeeting.id);

        if (error) {
          showToast(`Error saving meeting: ${error.message}`, 'error');
        } else {
          setMeetings((prev) =>
            prev.map((m) =>
              m.id === selectedMeeting.id
                ? { ...m, status: editStatus, outcome_notes: editNotes.trim() || null }
                : m
            )
          );
          setSelectedMeeting(null);
          showToast('Meeting updated successfully');
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to update meeting', 'error');
      }
    } else {
      // Demo Mode
      setMeetings((prev) =>
        prev.map((m) =>
          m.id === selectedMeeting.id
            ? { ...m, status: editStatus, outcome_notes: editNotes.trim() || null }
            : m
        )
      );
      setSelectedMeeting(null);
      showToast('[Demo Mode] Meeting updated successfully');
    }

    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Floating Toast */}
        {toast && (
          <div
            className={`fixed top-4 right-4 z-50 p-4 rounded-xl shadow-lg border flex items-center gap-3 text-sm transition-all animate-in fade-in slide-in-from-top-4 ${
              toast.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-medium">{toast.text}</span>
          </div>
        )}

        {/* Header with Title and Timezone */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <CalendarIcon className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
                  Meetings Calendar
                </h1>
                <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                  <Globe className="w-3.5 h-3.5" />
                  <span>Timezone: <strong className="font-semibold text-zinc-700 dark:text-zinc-300">{tz}</strong></span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick link to Dashboard */}
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors shadow-xs"
            >
              Leads Pipeline
            </Link>
          </div>
        </div>

        {/* 4. Controls Bar (Nav + View Toggles + Legend) */}
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Navigation: Prev / Next / Today / Current Title */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                Today
              </button>

              <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                <button
                  onClick={handlePrev}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition"
                  title="Previous Period"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleNext}
                  className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 transition"
                  title="Next Period"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 ml-1">
                {periodTitle}
              </h2>
            </div>

            {/* View Mode Toggle: Month / Week / Day */}
            <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/60 self-start sm:self-auto">
              <button
                onClick={() => setViewMode('month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'month'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Month
              </button>
              <button
                onClick={() => setViewMode('week')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'week'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setViewMode('day')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  viewMode === 'day'
                    ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'
                }`}
              >
                Day
              </button>
            </div>
          </div>

          {/* Status Color Legend */}
          <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-zinc-600 dark:text-zinc-400">
            <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-400">
              Legend:
            </span>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-100 dark:ring-blue-950"></span>
              <span>Scheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-emerald-100 dark:ring-emerald-950"></span>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 ring-2 ring-rose-100 dark:ring-rose-950"></span>
              <span>No Show</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-amber-100 dark:ring-amber-950"></span>
              <span>Rescheduled</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-zinc-400 ring-2 ring-zinc-200 dark:ring-zinc-800"></span>
              <span>Cancelled</span>
            </div>
          </div>
        </div>

        {/* 5. Empty State (Friendly Banner if no meetings in this period) */}
        {!hasMeetingsInCurrentView && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 sm:p-10 shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
            <div className="w-14 h-14 mx-auto mb-3.5 rounded-2xl bg-purple-50 dark:bg-purple-950/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <CalendarDays className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1">
              No meetings scheduled for this {viewMode}
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 max-w-md mx-auto mb-5 leading-relaxed">
              Your calendar is currently open for this period. As you book appointments with interested leads, they will appear automatically here.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleToday}
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white transition-all shadow-xs"
              >
                Go to Today
              </button>
              <Link
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition-colors"
              >
                View Leads to Call
              </Link>
            </div>
          </div>
        )}

        {/* CALENDAR VIEWS CONTAINER */}
        {hasMeetingsInCurrentView && (
          <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
            {/* MONTH VIEW (Desktop & Tablet) */}
            {viewMode === 'month' && (
              <div className="hidden md:block">
                {/* Day of Week Headers */}
                <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider py-3">
                  <div>Sun</div>
                  <div>Mon</div>
                  <div>Tue</div>
                  <div>Wed</div>
                  <div>Thu</div>
                  <div>Fri</div>
                  <div>Sat</div>
                </div>

                {/* 35 or 42 Month Grid Cells */}
                <div className="grid grid-cols-7 divide-x divide-y divide-zinc-200 dark:divide-zinc-800 border-b border-zinc-200 dark:border-zinc-800">
                  {monthDays.map((cell) => {
                    const dayMeetings = meetingsByDate.get(cell.dateKey) || [];
                    return (
                      <div
                        key={cell.dateKey}
                        className={`min-h-[110px] p-2 flex flex-col justify-between transition-colors ${
                          cell.isCurrentMonth
                            ? 'bg-white dark:bg-zinc-900 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40'
                            : 'bg-zinc-50/50 dark:bg-zinc-950/50 text-zinc-400'
                        }`}
                      >
                        {/* Day Number Header */}
                        <div className="flex items-center justify-between mb-1.5">
                          <span
                            className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-bold ${
                              cell.isToday
                                ? 'bg-blue-600 text-white shadow-xs'
                                : cell.isCurrentMonth
                                ? 'text-zinc-800 dark:text-zinc-200'
                                : 'text-zinc-400'
                            }`}
                          >
                            {cell.dayNumber}
                          </span>
                          {dayMeetings.length > 0 && (
                            <span className="text-[10px] font-semibold text-zinc-400">
                              {dayMeetings.length}
                            </span>
                          )}
                        </div>

                        {/* Meeting Blocks inside day cell */}
                        <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                          {dayMeetings.map(({ meeting, timeFormatted }) => {
                            const styles = getStatusStyles(meeting.status);
                            return (
                              <button
                                key={meeting.id}
                                onClick={() => handleOpenMeeting(meeting)}
                                className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold border truncate transition-all block ${styles.chip}`}
                                title={`${meeting.lead?.business_name || 'Meeting'} at ${timeFormatted} (${styles.label})`}
                              >
                                <span className="font-bold mr-1">{timeFormatted}</span>
                                <span>{meeting.lead?.business_name || 'Meeting'}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* WEEK VIEW */}
            {viewMode === 'week' && (
              <div className="hidden md:block">
                {/* 7 Column Headers */}
                <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-center py-3">
                  {weekDays.map((col) => (
                    <div key={col.dateKey} className="px-2">
                      <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {col.dayName}
                      </div>
                      <div
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-extrabold mt-1 ${
                          col.isToday
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'text-zinc-900 dark:text-zinc-100'
                        }`}
                      >
                        {col.dayNumber}
                      </div>
                    </div>
                  ))}
                </div>

                {/* 7 Columns Content */}
                <div className="grid grid-cols-7 divide-x divide-zinc-200 dark:divide-zinc-800 min-h-[380px]">
                  {weekDays.map((col) => {
                    const dayMeetings = meetingsByDate.get(col.dateKey) || [];
                    return (
                      <div
                        key={col.dateKey}
                        className={`p-2 space-y-2 ${
                          col.isToday ? 'bg-blue-50/20 dark:bg-blue-950/10' : 'bg-white dark:bg-zinc-900'
                        }`}
                      >
                        {dayMeetings.length === 0 ? (
                          <div className="h-full flex items-center justify-center text-zinc-300 dark:text-zinc-700 text-xs italic py-12">
                            —
                          </div>
                        ) : (
                          dayMeetings.map(({ meeting, timeFormatted }) => {
                            const styles = getStatusStyles(meeting.status);
                            return (
                              <button
                                key={meeting.id}
                                onClick={() => handleOpenMeeting(meeting)}
                                className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all shadow-2xs hover:shadow-xs ${styles.chip}`}
                              >
                                <div className="flex items-center gap-1 font-bold mb-1">
                                  <Clock className="w-3 h-3 shrink-0" />
                                  <span>{timeFormatted}</span>
                                </div>
                                <div className="font-semibold truncate">
                                  {meeting.lead?.business_name || 'Meeting'}
                                </div>
                                <div className="text-[10px] mt-1 capitalize opacity-80 flex items-center gap-1">
                                  <Video className="w-3 h-3" />
                                  <span>{meeting.platform === 'zoom' ? 'Zoom' : 'Google Meet'}</span>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DAY VIEW */}
            {viewMode === 'day' && (
              <div className="hidden md:block p-6">
                <div className="max-w-2xl mx-auto space-y-3">
                  {(meetingsByDate.get(dayKey) || []).length === 0 ? (
                    <div className="py-12 text-center text-zinc-400 text-sm">
                      No meetings scheduled for this day.
                    </div>
                  ) : (
                    (meetingsByDate.get(dayKey) || []).map(({ meeting, timeFormatted }) => {
                      const styles = getStatusStyles(meeting.status);
                      return (
                        <div
                          key={meeting.id}
                          onClick={() => handleOpenMeeting(meeting)}
                          className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-sm ${styles.chip}`}
                        >
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex flex-col items-center justify-center shrink-0">
                              <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                              <span className="text-[10px] font-bold mt-0.5">{timeFormatted}</span>
                            </div>
                            <div>
                              <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                                {meeting.lead?.business_name || 'Scheduled Meeting'}
                              </h4>
                              <div className="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                                <span>{meeting.platform === 'zoom' ? 'Zoom' : 'Google Meet'}</span>
                                {meeting.lead?.phone && <span>• {meeting.lead.phone}</span>}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${styles.badge}`}>
                              {styles.label}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* MOBILE AGENDA VIEW (Clean list view on small screens) */}
            <div className="block md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
                <ListFilter className="w-3.5 h-3.5" />
                <span>Scheduled Agenda ({currentPeriodMeetings.length})</span>
              </div>

              {currentPeriodMeetings.map(({ meeting, timeFormatted, fullFormatted }) => {
                const styles = getStatusStyles(meeting.status);
                return (
                  <div
                    key={meeting.id}
                    className="p-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                          {meeting.lead?.business_name || 'Scheduled Meeting'}
                        </h4>
                        <div className="flex items-center gap-1 text-xs text-purple-600 dark:text-purple-400 font-medium mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{fullFormatted}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${styles.badge}`}>
                        {styles.label}
                      </span>
                    </div>

                    {/* Contact & Platform Details */}
                    <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Video className="w-3.5 h-3.5" />
                        {meeting.platform === 'zoom' ? 'Zoom' : 'Google Meet'}
                      </span>
                      {meeting.lead?.phone && (
                        <a
                          href={`tel:${meeting.lead.phone.replace(/[^0-9+]/g, '')}`}
                          className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium hover:underline"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {meeting.lead.phone}
                        </a>
                      )}
                    </div>

                    {/* Action button */}
                    <div className="mt-3 pt-2.5 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-end">
                      <button
                        onClick={() => handleOpenMeeting(meeting)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
                      >
                        View & Update
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 3. MEETING DETAIL & UPDATE MODAL POPUP */}
        {selectedMeeting && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95">
              {/* Modal Header */}
              <div className="flex items-start justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800 mb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                      {selectedMeeting.lead?.business_name || 'Meeting Details'}
                    </h3>
                  </div>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Meeting ID: {selectedMeeting.id.slice(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedMeeting(null)}
                  className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Meeting Info Grid */}
              <div className="space-y-3.5 text-xs sm:text-sm mb-5">
                {/* Date & Time */}
                <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50">
                  <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                  <div>
                    <span className="text-[11px] uppercase font-bold text-purple-800 dark:text-purple-300 block">
                      Scheduled Time ({tz})
                    </span>
                    <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                      {parseMeetingDate(selectedMeeting.meeting_datetime).fullFormatted}
                    </span>
                  </div>
                </div>

                {/* Contact & Platform Details */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Phone */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                    <span className="text-[11px] uppercase font-semibold text-zinc-400 block mb-1">
                      Lead Phone
                    </span>
                    {selectedMeeting.lead?.phone ? (
                      <a
                        href={`tel:${selectedMeeting.lead.phone.replace(/[^0-9+]/g, '')}`}
                        className="inline-flex items-center text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                      >
                        <Phone className="w-3.5 h-3.5 mr-1" />
                        {selectedMeeting.lead.phone}
                      </a>
                    ) : (
                      <span className="text-zinc-400 italic">No phone recorded</span>
                    )}
                  </div>

                  {/* Platform & Link */}
                  <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700/60">
                    <span className="text-[11px] uppercase font-semibold text-zinc-400 block mb-1">
                      Platform
                    </span>
                    <div className="flex items-center gap-1 font-semibold text-zinc-800 dark:text-zinc-200 capitalize">
                      <Video className="w-3.5 h-3.5 text-purple-500" />
                      <span>{selectedMeeting.platform === 'zoom' ? 'Zoom' : 'Google Meet'}</span>
                    </div>
                  </div>
                </div>

                {/* Meeting Link (if present) */}
                {selectedMeeting.meeting_link && (
                  <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/60 text-xs">
                    <span className="text-[11px] uppercase font-semibold text-blue-800 dark:text-blue-300 block mb-1">
                      Meeting Link
                    </span>
                    <a
                      href={selectedMeeting.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-mono break-all"
                    >
                      <span>{selectedMeeting.meeting_link}</span>
                      <ExternalLink className="w-3 h-3 shrink-0" />
                    </a>
                  </div>
                )}
              </div>

              {/* Form to update Status & Outcome Notes */}
              <form onSubmit={handleSaveMeeting} className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                    Update Meeting Status
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
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
                    rows={3}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Enter notes on how the call/meeting went, client questions, objection handling, or next steps..."
                    className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-zinc-900 dark:text-zinc-100"
                  />
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2">
                  {selectedMeeting.lead_id ? (
                    <Link
                      href={`/leads/${selectedMeeting.lead_id}`}
                      className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <Building2 className="w-3.5 h-3.5 mr-1" />
                      View Lead Record
                    </Link>
                  ) : <div />}

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedMeeting(null)}
                      className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition disabled:opacity-50 shadow-xs"
                    >
                      {isSaving ? 'Saving...' : 'Save Updates'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
