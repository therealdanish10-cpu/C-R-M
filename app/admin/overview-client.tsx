'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
  PhoneCall,
  CalendarCheck,
  TrendingUp,
  DollarSign,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Globe,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { AdminOverviewStats, AdminFreelancerPerformance } from '@/lib/supabase/admin-queries';

interface OverviewClientProps {
  stats: AdminOverviewStats;
  performance: AdminFreelancerPerformance[];
}

type SortField =
  | 'name'
  | 'country'
  | 'leadsAssigned'
  | 'callsThisWeek'
  | 'meetingsBooked'
  | 'salesClosed'
  | 'commissionOwed';

type SortDirection = 'asc' | 'desc';

export function OverviewClient({ stats, performance }: OverviewClientProps) {
  const [sortField, setSortField] = useState<SortField>('salesClosed');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection(field === 'name' || field === 'country' ? 'asc' : 'desc');
    }
  };

  const sortedPerformance = useMemo(() => {
    return [...performance].sort((a, b) => {
      let valA: string | number = '';
      let valB: string | number = '';

      if (sortField === 'name') {
        valA = a.freelancer.name.toLowerCase();
        valB = b.freelancer.name.toLowerCase();
      } else if (sortField === 'country') {
        valA = (a.freelancer.country || '').toLowerCase();
        valB = (b.freelancer.country || '').toLowerCase();
      } else {
        valA = a[sortField];
        valB = b[sortField];
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [performance, sortField, sortDirection]);

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3.5 h-3.5 text-zinc-400 ml-1 inline-block" />;
    }
    return sortDirection === 'asc' ? (
      <ArrowUp className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-1 inline-block" />
    ) : (
      <ArrowDown className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 ml-1 inline-block" />
    );
  };

  const statCards = [
    {
      title: 'Total Leads',
      value: stats.totalLeads,
      subtitle: 'All assigned & unassigned',
      icon: Users,
      iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400',
      borderAccent: 'border-l-4 border-l-blue-500',
    },
    {
      title: 'Calls This Week',
      value: stats.callsThisWeek,
      subtitle: 'All freelancers past 7 days',
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
      title: 'Sales Closed',
      value: stats.salesClosedThisMonth,
      subtitle: 'Current calendar month',
      icon: TrendingUp,
      iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400',
      borderAccent: 'border-l-4 border-l-emerald-500',
    },
    {
      title: 'Commission Owed',
      value: `$${Number(stats.commissionOwedThisMonth).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      subtitle: 'Confirmed sales this month',
      icon: DollarSign,
      iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400',
      borderAccent: 'border-l-4 border-l-amber-500',
      isCurrency: true,
    },
  ];

  return (
    <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Agency Overview
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Performance metrics across all cold-calling freelancers and pipelines.
          </p>
        </div>
      </div>

      {/* 1. Top Stats Bar (5 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className={`bg-white dark:bg-zinc-900 rounded-xl p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-md ${card.borderAccent}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                  {card.title}
                </span>
                <div className={`p-2 rounded-lg ${card.iconBg}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </div>

              <div className="mt-3">
                <span className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  {card.isCurrency ? card.value : card.value.toLocaleString()}
                </span>
              </div>

              <p className="mt-1 text-[11px] text-zinc-400 dark:text-zinc-500">
                {card.subtitle}
              </p>
            </div>
          );
        })}
      </div>

      {/* 2. Freelancer Performance Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Freelancer Performance Leaderboard
            </h2>
            <p className="text-xs text-zinc-400">
              Click any column header to sort by activity, sales, or owed commission
            </p>
          </div>
          <span className="text-xs font-semibold text-zinc-500">
            {performance.length} Freelancer{performance.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                <th
                  onClick={() => handleSort('name')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
                >
                  <div className="flex items-center">
                    <span>Freelancer</span>
                    {renderSortIcon('name')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('country')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
                >
                  <div className="flex items-center">
                    <span>Country</span>
                    {renderSortIcon('country')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('leadsAssigned')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-right"
                >
                  <div className="flex items-center justify-end">
                    <span>Leads</span>
                    {renderSortIcon('leadsAssigned')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('callsThisWeek')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-right"
                >
                  <div className="flex items-center justify-end">
                    <span>Calls (Week)</span>
                    {renderSortIcon('callsThisWeek')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('meetingsBooked')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-right"
                >
                  <div className="flex items-center justify-end">
                    <span>Meetings</span>
                    {renderSortIcon('meetingsBooked')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('salesClosed')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-right"
                >
                  <div className="flex items-center justify-end">
                    <span>Sales Closed</span>
                    {renderSortIcon('salesClosed')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('commissionOwed')}
                  className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors text-right"
                >
                  <div className="flex items-center justify-end">
                    <span>Commission Owed</span>
                    {renderSortIcon('commissionOwed')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {sortedPerformance.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-xs text-zinc-400">
                    No freelancers found in database.
                  </td>
                </tr>
              ) : (
                sortedPerformance.map((row, idx) => (
                  <tr
                    key={row.freelancer.id}
                    className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/20 ${
                      idx % 2 === 1 ? 'bg-zinc-50/50 dark:bg-zinc-900/40' : 'bg-white dark:bg-zinc-900'
                    }`}
                  >
                    {/* Freelancer Name & Email */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {row.freelancer.name}
                        {row.freelancer.is_admin && (
                          <span className="ml-2 text-[10px] uppercase font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.5 rounded">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-zinc-400">{row.freelancer.email}</div>
                    </td>

                    {/* Country */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-zinc-600 dark:text-zinc-300">
                      {row.freelancer.country || 'Not specified'}
                    </td>

                    {/* Leads */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-semibold">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {row.leadsAssigned}
                      </span>
                    </td>

                    {/* Calls */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap text-xs font-semibold">
                      {row.callsThisWeek}
                    </td>

                    {/* Meetings */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap text-xs font-semibold">
                      {row.meetingsBooked}
                    </td>

                    {/* Sales Closed */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-emerald-600 dark:text-emerald-400">
                      {row.salesClosed}
                    </td>

                    {/* Commission Owed */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-extrabold text-zinc-900 dark:text-zinc-100">
                      ${Number(row.commissionOwed).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
