'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Users,
  Building2,
  DollarSign,
  Calendar,
  ShieldCheck,
} from 'lucide-react';

export function AdminNav() {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/admin', icon: BarChart3, exact: true },
    { label: 'Leads', href: '/admin/leads', icon: Building2 },
    { label: 'Freelancers', href: '/admin/freelancers', icon: Users },
    { label: 'Sales', href: '/admin/sales', icon: DollarSign },
    { label: 'Calendar', href: '/admin/calendar', icon: Calendar },
  ];

  return (
    <div className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 sm:py-0 sm:h-14">
          {/* Admin Tag */}
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
              <ShieldCheck className="w-3.5 h-3.5 mr-1 text-amber-600 dark:text-amber-400" />
              Admin Portal
            </span>
            <span className="hidden md:inline-block text-xs text-zinc-400">
              Cross-Freelancer Scope
            </span>
          </div>

          {/* Admin Navigation Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto pb-1 sm:pb-0">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = item.exact
                ? pathname === item.href
                : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-bold rounded-lg transition-all whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
