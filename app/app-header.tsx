'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Calendar, ShieldCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function AppHeader() {
  const pathname = usePathname();

  // Initialize isAdmin from localStorage or active pathname
  const [isAdmin, setIsAdmin] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname.startsWith('/admin')) {
        return true;
      }
      return localStorage.getItem('trelio_is_admin') === 'true';
    }
    return false;
  });

  useEffect(() => {
    let isMounted = true;

    // If current route is within /admin, immediately mark as admin
    if (pathname.startsWith('/admin')) {
      setIsAdmin(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem('trelio_is_admin', 'true');
      }
    }

    async function checkFreelancerAdmin() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
          // If in demo mode and on admin page, preserve admin view
          const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
          const isDemo = !url || url.includes('your-supabase-project');
          if (isDemo && pathname.startsWith('/admin')) {
            if (isMounted) setIsAdmin(true);
          }
          return;
        }

        const { data: freelancer, error } = await supabase
          .from('freelancers')
          .select('is_admin')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!error && freelancer && isMounted) {
          const admin = Boolean(freelancer.is_admin);
          setIsAdmin(admin);
          if (typeof window !== 'undefined') {
            localStorage.setItem('trelio_is_admin', admin ? 'true' : 'false');
          }
        }
      } catch (err) {
        console.error('Error verifying admin status in header:', err);
      }
    }

    checkFreelancerAdmin();

    // Listen for auth state changes (login / logout)
    try {
      const supabase = createClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          const { data: freelancer } = await supabase
            .from('freelancers')
            .select('is_admin')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (isMounted && freelancer) {
            const admin = Boolean(freelancer.is_admin);
            setIsAdmin(admin);
            if (typeof window !== 'undefined') {
              localStorage.setItem('trelio_is_admin', admin ? 'true' : 'false');
            }
          }
        } else {
          if (isMounted) {
            setIsAdmin(false);
            if (typeof window !== 'undefined') {
              localStorage.removeItem('trelio_is_admin');
            }
          }
        }
      });

      return () => {
        isMounted = false;
        subscription.unsubscribe();
      };
    } catch {
      // Ignore if supabase client setup is not available
    }

    return () => {
      isMounted = false;
    };
  }, [pathname]);

  // Target destination for logo:
  // If is_admin = true, link to /admin. If is_admin = false, link to /dashboard.
  const logoHref = isAdmin ? '/admin' : '/dashboard';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Dynamic Logo Link: /admin for admins, /dashboard for freelancers */}
        <Link
          href={logoHref}
          className="flex items-center gap-3 group"
          title={isAdmin ? 'Go to Admin Portal' : 'Go to Freelancer Dashboard'}
        >
          <div className="w-10 h-10 rounded-xl bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 p-1 flex items-center justify-center shadow-xs group-hover:border-blue-500 transition-colors shrink-0">
            <Image
              src="/logo.png"
              alt="Trelio CRM Logo"
              width={36}
              height={36}
              className="w-full h-full object-contain rounded-lg"
              priority
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-tight text-lg text-zinc-900 dark:text-zinc-50">
              Trelio<span className="text-blue-600">CRM</span>
            </span>
            <span
              className={`hidden sm:inline-block text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded border transition-colors ${
                isAdmin
                  ? 'bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                  : 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
              }`}
            >
              {isAdmin ? 'Admin' : 'Freelancer'}
            </span>
          </div>
        </Link>

        {/* Global Navigation Links */}
        <nav className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors ${
              pathname === '/dashboard' || pathname.startsWith('/leads')
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/calendar"
            className={`flex items-center gap-1.5 text-xs sm:text-sm font-semibold px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors ${
              pathname === '/calendar'
                ? 'bg-purple-50 text-purple-600 dark:bg-purple-950/60 dark:text-purple-400'
                : 'text-zinc-700 dark:text-zinc-300 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            <Calendar className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Calendar</span>
          </Link>

          {/* Admin Portal Nav Item (shown when user is admin) */}
          {isAdmin && (
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 text-xs sm:text-sm font-bold px-2.5 sm:px-3 py-1.5 rounded-lg transition-colors ${
                pathname.startsWith('/admin')
                  ? 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300'
                  : 'text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50'
              }`}
            >
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>Admin</span>
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
