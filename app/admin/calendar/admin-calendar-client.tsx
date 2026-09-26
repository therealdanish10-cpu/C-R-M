'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminMeetingWithDetails } from '@/lib/supabase/admin-queries';
import { Freelancer } from '@/lib/supabase/types';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Phone,
  Video,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  Building2,
  CalendarDays,
  ListFilter,
  User,
} from 'lucide-react';

interface AdminCalendarClientProps {
  initialMeetings: AdminMeetingWithDetails[];
  freelancers: Freelancer[];
  isSupabaseConfigured: boolean;
}

type ViewMode = 'month' | 'week' | 'day';

const COLOR_PALETTE = [
  {
    chip: 'bg-blue-100 text-blue-900 border-blue-300 dark:bg-blue-950/80 dark:text-blue-200 dark:border-blue-800 hover:bg-blue-200',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300',
  },
  {
    chip: 'bg-purple-100 text-purple-900 border-purple-300 dark:bg-purple-950/80 dark:text-purple-200 dark:border-purple-800 hover:bg-purple-200',
    dot: 'bg-purple-500',
    badge: 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300',
  },
  {
    chip: 'bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-200 dark:border-emerald-800 hover:bg-emerald-200',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300',
  },
  {
    chip: 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-200 dark:border-amber-800 hover:bg-amber-200',
    dot: 'bg-amber-500',
    badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300',
  },
  {
    chip: 'bg-rose-100 text-rose-900 border-rose-300 dark:bg-rose-950/80 dark:text-rose-200 dark:border-rose-800 hover:bg-rose-200',
    dot: 'bg-rose-500',
    badge: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950 dark:text-rose-300',
  },
  {
    chip: 'bg-cyan-100 text-cyan-900 border-cyan-300 dark:bg-cyan-950/80 dark:text-cyan-200 dark:border-cyan-800 hover:bg-cyan-200',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-100 text-cyan-800 border-cyan-300 dark:bg-cyan-950 dark:text-cyan-300',
  },
];

export function AdminCalendarClient({
  initialMeetings,
  freelancers,
  isSupabaseConfigured,
}: AdminCalendarClientProps) {
  const [meetings, setMeetings] = useState<AdminMeetingWithDetails[]>(initialMeetings);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [selectedMeeting, setSelectedMeeting] = useState<AdminMeetingWithDetails | null>(null);

  // Edit meeting modal state
  const [editStatus, setEditStatus] = useState<string>('scheduled');
  const [editNotes, setEditNotes] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Assign each freelancer a distinct color style
  const freelancerColorMap = useMemo(() => {
    const map = new Map<string, typeof COLOR_PALETTE[0]>();
    freelancers.forEach((fl, idx) => {
      map.set(fl.id, COLOR_PALETTE[idx % COLOR_PALETTE.length]);
    });
    return map;
  }, [freelancers]);

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const parseMeetingDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const dateKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: tz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);

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

  const meetingsByDate = useMemo(() => {
    const map = new Map<string, Array<{ meeting: AdminMeetingWithDetails; timeFormatted: string; fullFormatted: string; rawDate: Date }>>();
    for (const m of meetings) {
      if (!m.meeting_datetime) continue;
      const parsed = parseMeetingDate(m.meeting_datetime);
      const list = map.get(parsed.dateKey) || [];
      list.push({ meeting: m, ...parsed });
      map.set(parsed.dateKey, list);
    }
    map.forEach((list) => list.sort((a, b) => a.rawDate.getTime() - b.rawDate.getTime()));
    return map;
  }, [meetings, tz]);

  // Navigation handlers
  const handlePrev = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') d.setMonth(d.getMonth() - 1);
      else if (viewMode === 'week') d.setDate(d.getDate() - 7);
      else d.setDate(d.getDate() - 1);
      return d;
    });
  };

  const handleNext = () => {
    setCurrentDate((prev) => {
      const d = new Date(prev);
      if (viewMode === 'month') d.setMonth(d.getMonth() + 1);
      else if (viewMode === 'week') d.setDate(d.getDate() + 7);
      else d.setDate(d.getDate() + 1);
      return d;
    });
  };

  const handleToday = () => setCurrentDate(new Date());

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
    const startOfWeek = new Date(currentDate);
    const day = startOfWeek.getDay();
    startOfWeek.setDate(startOfWeek.getDate() - day);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);

    const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
    const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
    return `${startMonth} ${startOfWeek.getDate()} – ${endMonth} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
  }, [viewMode, currentDate]);

  // Month days
  const monthDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startDayOfWeek = firstDay.getDay();
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

    const remaining = (7 - (days.length % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const d = new Date(year, month + 1, day);
      const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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

  const dayKey = useMemo(() => {
    return `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
  }, [currentDate]);

  const hasMeetingsInCurrentView = useMemo(() => {
    if (viewMode === 'month') {
      return monthDays.some((d) => (meetingsByDate.get(d.dateKey)?.length || 0) > 0);
    }
    if (viewMode === 'week') {
      return weekDays.some((d) => (meetingsByDate.get(d.dateKey)?.length || 0) > 0);
    }
    return (meetingsByDate.get(dayKey)?.length || 0) > 0;
  }, [viewMode, monthDays, weekDays, dayKey, meetingsByDate]);

  const currentPeriodMeetings = useMemo(() => {
    const list: Array<{ meeting: AdminMeetingWithDetails; timeFormatted: string; fullFormatted: string; dateKey: string; rawDate: Date }> = [];
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

  const handleOpenMeeting = (meeting: AdminMeetingWithDetails) => {
    setSelectedMeeting(meeting);
    setEditStatus(meeting.status || 'scheduled');
    setEditNotes(meeting.outcome_notes || '');
  };

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
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-6">
      {/* Toast */}
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

      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
          Agency Master Calendar
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          All client meetings across all freelancers. Color-coded by assigned caller.
        </p>
      </div>

      {/* Controls Bar & Freelancer Color Legend */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Navigation */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
            >
              Today
            </button>

            <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
              <button
                onClick={handlePrev}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handleNext}
                className="p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 ml-1">
              {periodTitle}
            </h2>
          </div>

          {/* View Toggles */}
          <div className="flex items-center bg-zinc-100 dark:bg-zinc-800/80 p-1 rounded-xl border border-zinc-200 dark:border-zinc-700/60 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'month'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'week'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                viewMode === 'day'
                  ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Day
            </button>
          </div>
        </div>

        {/* FREELANCER COLOR LEGEND */}
        <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-3 sm:gap-4 text-xs">
          <span className="font-semibold uppercase tracking-wider text-[11px] text-zinc-400">
            Caller Legend:
          </span>
          {freelancers.map((fl) => {
            const color = freelancerColorMap.get(fl.id) || COLOR_PALETTE[0];
            return (
              <div key={fl.id} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${color.dot}`}></span>
                <span className="font-medium text-zinc-700 dark:text-zinc-300">{fl.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty State */}
      {!hasMeetingsInCurrentView && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl p-8 sm:p-10 shadow-sm border border-zinc-200 dark:border-zinc-800 text-center">
          <CalendarDays className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-1">
            No meetings scheduled across agency for this {viewMode}
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mx-auto mb-4">
            No callers have meetings booked during this time period.
          </p>
          <button
            onClick={handleToday}
            className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 text-white rounded-lg"
          >
            Jump to Today
          </button>
        </div>
      )}

      {/* CALENDAR VIEWS CONTAINER */}
      {hasMeetingsInCurrentView && (
        <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
          {/* MONTH VIEW */}
          {viewMode === 'month' && (
            <div className="hidden md:block">
              <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-center text-xs font-bold text-zinc-500 uppercase tracking-wider py-3">
                <div>Sun</div>
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
              </div>

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

                      {/* Meeting Blocks color-coded by FREELANCER */}
                      <div className="flex-1 space-y-1 overflow-y-auto max-h-[85px] pr-0.5">
                        {dayMeetings.map(({ meeting, timeFormatted }) => {
                          const color = freelancerColorMap.get(meeting.freelancer_id) || COLOR_PALETTE[0];
                          return (
                            <button
                              key={meeting.id}
                              onClick={() => handleOpenMeeting(meeting)}
                              className={`w-full text-left px-2 py-1 rounded-md text-[11px] font-semibold border truncate transition-all block ${color.chip}`}
                              title={`${meeting.lead?.business_name || 'Meeting'} with ${meeting.freelancerName} at ${timeFormatted}`}
                            >
                              <span className="font-bold mr-1">{timeFormatted}</span>
                              <span className="font-extrabold mr-1">[{meeting.freelancerName}]</span>
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
              <div className="grid grid-cols-7 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-center py-3">
                {weekDays.map((col) => (
                  <div key={col.dateKey} className="px-2">
                    <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                      {col.dayName}
                    </div>
                    <div
                      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-extrabold mt-1 ${
                        col.isToday ? 'bg-blue-600 text-white shadow-xs' : 'text-zinc-900 dark:text-zinc-100'
                      }`}
                    >
                      {col.dayNumber}
                    </div>
                  </div>
                ))}
              </div>

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
                          const color = freelancerColorMap.get(meeting.freelancer_id) || COLOR_PALETTE[0];
                          return (
                            <button
                              key={meeting.id}
                              onClick={() => handleOpenMeeting(meeting)}
                              className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all shadow-2xs hover:shadow-xs ${color.chip}`}
                            >
                              <div className="flex items-center justify-between font-bold mb-1">
                                <span>{timeFormatted}</span>
                                <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-black/10">
                                  {meeting.freelancerName}
                                </span>
                              </div>
                              <div className="font-semibold truncate">
                                {meeting.lead?.business_name || 'Meeting'}
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
                    No meetings scheduled for this day across agency.
                  </div>
                ) : (
                  (meetingsByDate.get(dayKey) || []).map(({ meeting, timeFormatted }) => {
                    const color = freelancerColorMap.get(meeting.freelancer_id) || COLOR_PALETTE[0];
                    return (
                      <div
                        key={meeting.id}
                        onClick={() => handleOpenMeeting(meeting)}
                        className={`p-4 rounded-xl border flex items-center justify-between gap-4 cursor-pointer transition-all hover:shadow-sm ${color.chip}`}
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
                              <span className="font-semibold text-blue-600">Caller: {meeting.freelancerName}</span>
                              <span>• {meeting.platform === 'zoom' ? 'Zoom' : 'Google Meet'}</span>
                            </div>
                          </div>
                        </div>

                        <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded bg-black/10">
                          {meeting.status}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* MOBILE AGENDA VIEW */}
          <div className="block md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
            <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1.5">
              <ListFilter className="w-3.5 h-3.5" />
              <span>Agency Schedule ({currentPeriodMeetings.length})</span>
            </div>

            {currentPeriodMeetings.map(({ meeting, fullFormatted }) => {
              const color = freelancerColorMap.get(meeting.freelancer_id) || COLOR_PALETTE[0];
              return (
                <div key={meeting.id} className="p-4 hover:bg-zinc-50/70 transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div>
                      <h4 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                        {meeting.lead?.business_name || 'Scheduled Meeting'}
                      </h4>
                      <div className="text-xs text-purple-600 dark:text-purple-400 font-medium">
                        {fullFormatted}
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${color.badge}`}>
                      {meeting.freelancerName}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-end">
                    <button
                      onClick={() => handleOpenMeeting(meeting)}
                      className="px-3 py-1 rounded text-xs font-semibold bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200"
                    >
                      View & Edit
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MEETING POPUP MODAL (Same detail view & edit capability as freelancer calendar) */}
      {selectedMeeting && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95">
            <div className="flex items-start justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div>
                <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">
                  {selectedMeeting.lead?.business_name || 'Meeting Details'}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-zinc-400 font-mono">ID: {selectedMeeting.id.slice(0, 8)}</span>
                  <span className="text-xs font-semibold text-blue-600">• Assigned to {selectedMeeting.freelancerName}</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs sm:text-sm mb-5">
              <div className="flex items-center gap-2.5 p-3 rounded-xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200/80 dark:border-purple-800/50">
                <Clock className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
                <div>
                  <span className="text-[11px] uppercase font-bold text-purple-800 dark:text-purple-300 block">
                    Scheduled Time
                  </span>
                  <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                    {parseMeetingDate(selectedMeeting.meeting_datetime).fullFormatted}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
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

            {/* Status & Outcome Notes Form */}
            <form onSubmit={handleSaveMeeting} className="space-y-4 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Update Meeting Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium text-zinc-900 dark:text-zinc-100"
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
                  placeholder="Notes from meeting..."
                  className="w-full px-3 py-2 text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                {selectedMeeting.lead_id ? (
                  <Link
                    href={`/leads/${selectedMeeting.lead_id}`}
                    className="inline-flex items-center text-xs text-blue-600 hover:underline"
                  >
                    <Building2 className="w-3.5 h-3.5 mr-1" />
                    View Lead Page
                  </Link>
                ) : <div />}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMeeting(null)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
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
  );
}
