'use client';

import React, { useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { AdminSaleWithDetails } from '@/lib/supabase/admin-queries';
import { Freelancer } from '@/lib/supabase/types';
import {
  DollarSign,
  Filter,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  Building2,
} from 'lucide-react';

interface AdminSalesClientProps {
  initialSales: AdminSaleWithDetails[];
  freelancers: Freelancer[];
  isSupabaseConfigured: boolean;
}

export function AdminSalesClient({
  initialSales,
  freelancers,
  isSupabaseConfigured,
}: AdminSalesClientProps) {
  const [sales, setSales] = useState<AdminSaleWithDetails[]>(initialSales);
  const [statusFilter, setStatusFilter] = useState('all');
  const [freelancerFilter, setFreelancerFilter] = useState('all');
  const [updatingSaleId, setUpdatingSaleId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const filteredSales = useMemo(() => {
    return sales.filter((s) => {
      if (statusFilter !== 'all' && s.payment_status?.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (freelancerFilter !== 'all' && s.freelancer_id !== freelancerFilter) {
        return false;
      }
      return true;
    });
  }, [sales, statusFilter, freelancerFilter]);

  // Update payment status (e.g. pending -> confirmed)
  const handleUpdatePaymentStatus = async (saleId: string, newStatus: string) => {
    setUpdatingSaleId(saleId);

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('sales')
          .update({ payment_status: newStatus })
          .eq('id', saleId);

        if (error) {
          showToast(`Error updating payment status: ${error.message}`, 'error');
        } else {
          setSales((prev) =>
            prev.map((s) => (s.id === saleId ? { ...s, payment_status: newStatus } : s))
          );
          showToast(`Payment status updated to ${newStatus}`);
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to update payment status', 'error');
      }
    } else {
      // Demo Mode
      setSales((prev) =>
        prev.map((s) => (s.id === saleId ? { ...s, payment_status: newStatus } : s))
      );
      showToast(`[Demo Mode] Payment status updated to ${newStatus}`);
    }

    setUpdatingSaleId(null);
  };

  // Toggle credentials sent
  const handleToggleCredentials = async (saleId: string, currentVal: boolean) => {
    setUpdatingSaleId(saleId);
    const nextVal = !currentVal;

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('sales')
          .update({ credentials_sent: nextVal })
          .eq('id', saleId);

        if (error) {
          showToast(`Error updating credentials status: ${error.message}`, 'error');
        } else {
          setSales((prev) =>
            prev.map((s) => (s.id === saleId ? { ...s, credentials_sent: nextVal } : s))
          );
          showToast(nextVal ? 'Marked credentials as sent' : 'Marked credentials as not sent');
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to toggle credentials', 'error');
      }
    } else {
      // Demo Mode
      setSales((prev) =>
        prev.map((s) => (s.id === saleId ? { ...s, credentials_sent: nextVal } : s))
      );
      showToast(nextVal ? '[Demo Mode] Credentials sent' : '[Demo Mode] Credentials pending');
    }

    setUpdatingSaleId(null);
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
          Agency Sales & Commission Manager
        </h1>
        <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
          Review all closed transactions, confirm payments, and track client onboarding credentials.
        </p>
      </div>

      {/* Filters Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Payment Status Filter */}
          <div className="w-48">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium"
            >
              <option value="all">All Payment Statuses</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Freelancer Filter */}
          <div className="w-48">
            <select
              value={freelancerFilter}
              onChange={(e) => setFreelancerFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium"
            >
              <option value="all">All Freelancers</option>
              {freelancers.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-zinc-500 font-semibold self-end sm:self-auto">
          {filteredSales.length} sale{filteredSales.length === 1 ? '' : 's'} recorded
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                <th className="py-3.5 px-4">Business Name</th>
                <th className="py-3.5 px-4">Caller (Freelancer)</th>
                <th className="py-3.5 px-4">Sale Amount</th>
                <th className="py-3.5 px-4">Commission</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Payment Link</th>
                <th className="py-3.5 px-4">Credentials Sent</th>
                <th className="py-3.5 px-4">Sold Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-zinc-400">
                    <DollarSign className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    No sales matching the selected filters.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale, idx) => (
                  <tr
                    key={sale.id}
                    className={`transition-colors hover:bg-blue-50/30 dark:hover:bg-blue-950/20 ${
                      idx % 2 === 1 ? 'bg-zinc-50/40 dark:bg-zinc-900/30' : 'bg-white dark:bg-zinc-900'
                    }`}
                  >
                    {/* Business Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100">
                        {sale.businessName}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono">Lead: {sale.lead_id}</div>
                    </td>

                    {/* Freelancer Name */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {sale.freelancerName}
                    </td>

                    {/* Sale Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap font-black text-emerald-600 dark:text-emerald-400">
                      ${Number(sale.sale_amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Commission Amount */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs font-bold text-zinc-700 dark:text-zinc-300">
                      ${Number(sale.commission_amount || (sale.sale_amount * 0.15)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>

                    {/* Payment Status Dropdown */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <select
                        value={sale.payment_status?.toLowerCase() || 'pending'}
                        disabled={updatingSaleId === sale.id}
                        onChange={(e) => handleUpdatePaymentStatus(sale.id, e.target.value)}
                        className={`px-2.5 py-1 text-xs rounded-full font-bold uppercase tracking-wider border cursor-pointer ${
                          sale.payment_status?.toLowerCase() === 'confirmed'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-amber-50 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800'
                        }`}
                      >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="failed">Failed</option>
                      </select>
                    </td>

                    {/* Payment Link */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      {sale.payment_link ? (
                        <a
                          href={sale.payment_link}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center text-blue-600 dark:text-blue-400 hover:underline font-mono"
                        >
                          <span>Open</span>
                          <ExternalLink className="w-3 h-3 ml-1" />
                        </a>
                      ) : (
                        <span className="text-zinc-400 italic">None</span>
                      )}
                    </td>

                    {/* Credentials Sent Toggle */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleCredentials(sale.id, Boolean(sale.credentials_sent))}
                        disabled={updatingSaleId === sale.id}
                        className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold transition ${
                          sale.credentials_sent
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-200'
                            : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 hover:bg-zinc-200'
                        }`}
                      >
                        {sale.credentials_sent ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5 mr-1 text-blue-600" />
                            Sent
                          </>
                        ) : (
                          <>
                            <ShieldAlert className="w-3.5 h-3.5 mr-1 text-zinc-400" />
                            Pending
                          </>
                        )}
                      </button>
                    </td>

                    {/* Sold Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs text-zinc-500">
                      {new Date(sale.sold_at).toLocaleDateString()}
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
