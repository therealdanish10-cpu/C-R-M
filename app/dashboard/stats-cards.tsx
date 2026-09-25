'use client';

import React from 'react';
import { Users, PhoneCall, CalendarCheck, TrendingUp } from 'lucide-react';
import { DashboardStats } from '@/lib/supabase/types';

interface StatsCardsProps {
  stats: DashboardStats;
  loading?: boolean;
}

export function StatsCards({ stats, loading = false }: StatsCardsProps) {
  const cards = [
    {
      title: 'Total Leads Assigned',
      value: stats.totalLeadsAssigned,
      subtitle: 'All-time assigned pipeline',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      borderAccent: 'border-l-4 border-l-blue-500',
    },
    {
      title: 'Calls Made This Week',
      value: stats.callsMadeThisWeek,
      subtitle: 'Past 7 days activity',
      icon: PhoneCall,
      iconBg: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/60 dark:text-indigo-400',
      borderAccent: 'border-l-4 border-l-indigo-500',
    },
    {
      title: 'Meetings Booked',
      value: stats.meetingsBooked,
      subtitle: 'Scheduled appointments',
      icon: CalendarCheck,
      iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400',
      borderAccent: 'border-l-4 border-l-purple-500',
    },
    {
      title: 'Sales Closed This Month',
      value: stats.salesClosedThisMonth,
      subtitle: 'Current calendar month',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      borderAccent: 'border-l-4 border-l-emerald-500',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md ${card.borderAccent}`}
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {card.title}
              </span>
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <IconComponent className="w-5 h-5" />
              </div>
            </div>

            <div className="mt-3 flex items-baseline">
              {loading ? (
                <div className="h-9 w-20 bg-zinc-200 dark:bg-zinc-800 animate-pulse rounded"></div>
              ) : (
                <span className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {card.value.toLocaleString()}
                </span>
              )}
            </div>

            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
              {card.subtitle}
            </p>
          </div>
        );
      })}
    </div>
  );
}
