'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { Freelancer } from '@/lib/supabase/types';
import { ShieldCheck, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface DashboardViewSelectorProps {
  freelancers: Freelancer[];
  currentSelected: string;
  adminFreelancerId: string;
  totalLeadsCount: number;
}

export function DashboardViewSelector({
  freelancers,
  currentSelected,
  adminFreelancerId,
  totalLeadsCount,
}: DashboardViewSelectorProps) {
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === 'all') {
      router.push('/dashboard?freelancer=all');
    } else {
      router.push(`/dashboard?freelancer=${encodeURIComponent(val)}`);
    }
  };

  return (
    <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/30 border border-amber-200/80 dark:border-amber-800/60 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
              Admin Pipeline Control
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold bg-amber-200/60 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200">
              Agency View
            </span>
          </div>
          <p className="text-xs text-amber-800/80 dark:text-amber-300/80 mt-0.5">
            Switch pipeline view between all agency leads, specific freelancers, or unassigned leads.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400 hidden md:inline">
            Viewing:
          </span>
          <select
            value={currentSelected}
            onChange={handleChange}
            className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-amber-300 dark:border-amber-700 rounded-lg font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-2 focus:ring-amber-500 shadow-xs cursor-pointer"
          >
            <option value="all">All Agency Leads ({totalLeadsCount})</option>
            <option value={adminFreelancerId}>My Assigned Leads</option>
            <option value="unassigned">Unassigned Leads</option>
            {freelancers.length > 0 && (
              <optgroup label="Freelancer Queues">
                {freelancers
                  .filter((f) => f.id !== adminFreelancerId)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.status || 'active'})
                    </option>
                  ))}
              </optgroup>
            )}
          </select>
        </div>

        <Link
          href="/admin/leads"
          className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 hover:bg-amber-700 text-white transition shadow-xs"
        >
          <span>Distribute Leads</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>
    </div>
  );
}
