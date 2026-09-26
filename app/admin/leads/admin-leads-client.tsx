'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { AdminLeadWithDetails } from '@/lib/supabase/admin-queries';
import { Freelancer } from '@/lib/supabase/types';
import {
  Search,
  Filter,
  Users,
  CheckSquare,
  Square,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Phone,
  Building2,
  ArrowRight,
  UserCheck,
} from 'lucide-react';

interface AdminLeadsClientProps {
  initialLeads: AdminLeadWithDetails[];
  freelancers: Freelancer[];
  isSupabaseConfigured: boolean;
}

export function AdminLeadsClient({
  initialLeads,
  freelancers,
  isSupabaseConfigured,
}: AdminLeadsClientProps) {
  const [leads, setLeads] = useState<AdminLeadWithDetails[]>(initialLeads);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [freelancerFilter, setFreelancerFilter] = useState('all');

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkAssignTo, setBulkAssignTo] = useState<string>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Single row update loading
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    switch (s) {
      case 'new':
        return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
      case 'contacted':
        return 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800';
      case 'interested':
        return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800';
      case 'meeting_booked':
        return 'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800';
      case 'sold':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800';
      case 'not_interested':
      case 'dead':
        return 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700';
    }
  };

  // Filtered leads
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      if (statusFilter !== 'all' && lead.status.toLowerCase() !== statusFilter.toLowerCase()) {
        return false;
      }
      if (freelancerFilter !== 'all' && lead.assigned_to !== freelancerFilter) {
        return false;
      }
      if (searchTerm.trim() !== '') {
        const q = searchTerm.toLowerCase();
        const matchesName = lead.business_name?.toLowerCase().includes(q);
        const matchesPhone = lead.phone?.toLowerCase().includes(q);
        if (!matchesName && !matchesPhone) return false;
      }
      return true;
    });
  }, [leads, statusFilter, freelancerFilter, searchTerm]);

  // Toggle single selection
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Select all filtered leads
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredLeads.length && filteredLeads.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredLeads.map((l) => l.id)));
    }
  };

  // Assign single lead
  const handleAssignSingle = async (leadId: string, newFreelancerId: string) => {
    setUpdatingLeadId(leadId);
    const targetFreelancer = freelancers.find((f) => f.id === newFreelancerId);
    const newName = targetFreelancer?.name || 'Unassigned';

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('leads')
          .update({ assigned_to: newFreelancerId, updated_at: new Date().toISOString() })
          .eq('id', leadId);

        if (error) {
          showToast(`Error assigning lead: ${error.message}`, 'error');
        } else {
          setLeads((prev) =>
            prev.map((l) =>
              l.id === leadId ? { ...l, assigned_to: newFreelancerId, freelancerName: newName } : l
            )
          );
          showToast(`Lead reassigned to ${newName}`);
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to reassign lead', 'error');
      }
    } else {
      // Demo Mode
      setLeads((prev) =>
        prev.map((l) =>
          l.id === leadId ? { ...l, assigned_to: newFreelancerId, freelancerName: newName } : l
        )
      );
      showToast(`[Demo Mode] Lead reassigned to ${newName}`);
    }

    setUpdatingLeadId(null);
  };

  // Bulk reassign
  const handleBulkAssign = async () => {
    if (!bulkAssignTo) {
      showToast('Please select a freelancer to assign to', 'error');
      return;
    }
    if (selectedIds.size === 0) return;

    setIsBulkUpdating(true);
    const targetFreelancer = freelancers.find((f) => f.id === bulkAssignTo);
    const newName = targetFreelancer?.name || 'Unassigned';
    const idsArray = Array.from(selectedIds);

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('leads')
          .update({ assigned_to: bulkAssignTo, updated_at: new Date().toISOString() })
          .in('id', idsArray);

        if (error) {
          showToast(`Error bulk assigning leads: ${error.message}`, 'error');
        } else {
          setLeads((prev) =>
            prev.map((l) =>
              selectedIds.has(l.id)
                ? { ...l, assigned_to: bulkAssignTo, freelancerName: newName }
                : l
            )
          );
          setSelectedIds(new Set());
          showToast(`Reassigned ${idsArray.length} leads to ${newName}`);
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to bulk assign', 'error');
      }
    } else {
      // Demo Mode
      setLeads((prev) =>
        prev.map((l) =>
          selectedIds.has(l.id)
            ? { ...l, assigned_to: bulkAssignTo, freelancerName: newName }
            : l
        )
      );
      setSelectedIds(new Set());
      showToast(`[Demo Mode] Reassigned ${idsArray.length} leads to ${newName}`);
    }

    setIsBulkUpdating(false);
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

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Agency Lead Distribution
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Manage, assign, and distribute leads across all cold-calling freelancers.
          </p>
        </div>
      </div>

      {/* Filters & Bulk Action Bar */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl p-4 sm:p-5 shadow-sm border border-zinc-200 dark:border-zinc-800 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search business or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="new">New</option>
              <option value="contacted">Contacted</option>
              <option value="interested">Interested</option>
              <option value="meeting_booked">Meeting Booked</option>
              <option value="sold">Sold</option>
              <option value="not_interested">Not Interested</option>
              <option value="dead">Dead</option>
            </select>
          </div>

          {/* Freelancer Filter */}
          <div className="relative">
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

          {/* Leads Count */}
          <div className="flex items-center justify-end text-xs font-semibold text-zinc-500">
            Showing {filteredLeads.length} of {leads.length} leads
          </div>
        </div>

        {/* Bulk Assignment Bar */}
        {selectedIds.size > 0 && (
          <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
              <UserCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{selectedIds.size} lead{selectedIds.size === 1 ? '' : 's'} selected</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-zinc-600 dark:text-zinc-400 hidden sm:inline">Assign selected to:</span>
              <select
                value={bulkAssignTo}
                onChange={(e) => setBulkAssignTo(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg font-medium"
              >
                <option value="">Select Freelancer</option>
                {freelancers.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>

              <button
                onClick={handleBulkAssign}
                disabled={isBulkUpdating || !bulkAssignTo}
                className="px-3.5 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 shadow-xs"
              >
                {isBulkUpdating ? 'Assigning...' : 'Apply Bulk'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Leads Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                <th className="py-3 px-4 w-10">
                  <button
                    onClick={toggleSelectAll}
                    className="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 flex items-center"
                    title="Select / Deselect All"
                  >
                    {selectedIds.size > 0 && selectedIds.size === filteredLeads.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="py-3.5 px-4">Business Name</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Assigned Freelancer</th>
                <th className="py-3.5 px-4">Last Call Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-xs text-zinc-400">
                    <Building2 className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
                    No leads match your criteria.
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead, idx) => {
                  const isSelected = selectedIds.has(lead.id);
                  return (
                    <tr
                      key={lead.id}
                      className={`transition-colors hover:bg-blue-50/30 dark:hover:bg-blue-950/20 ${
                        isSelected
                          ? 'bg-blue-50/50 dark:bg-blue-950/30'
                          : idx % 2 === 1
                          ? 'bg-zinc-50/40 dark:bg-zinc-900/30'
                          : 'bg-white dark:bg-zinc-900'
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleSelect(lead.id)}
                          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 flex items-center"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>

                      {/* Business Name */}
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-zinc-900 dark:text-zinc-100">
                          {lead.business_name}
                        </div>
                        {(lead.city || lead.state) && (
                          <div className="text-xs text-zinc-400">
                            {[lead.city, lead.state].filter(Boolean).join(', ')}
                          </div>
                        )}
                      </td>

                      {/* Phone */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {lead.phone ? (
                          <a
                            href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                            className="inline-flex items-center text-zinc-700 dark:text-zinc-300 hover:text-blue-600 font-mono text-xs"
                          >
                            <Phone className="w-3 h-3 mr-1 text-zinc-400" />
                            {lead.phone}
                          </a>
                        ) : (
                          <span className="text-zinc-400 text-xs italic">N/A</span>
                        )}
                      </td>

                      {/* Category */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                          {lead.category || 'General'}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusBadge(lead.status)}`}
                        >
                          {lead.status}
                        </span>
                      </td>

                      {/* Assign Dropdown per row */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <select
                          value={lead.assigned_to || ''}
                          disabled={updatingLeadId === lead.id}
                          onChange={(e) => handleAssignSingle(lead.id, e.target.value)}
                          className="px-2.5 py-1 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-md font-medium text-zinc-900 dark:text-zinc-100 cursor-pointer disabled:opacity-50"
                        >
                          {freelancers.map((f) => (
                            <option key={f.id} value={f.id}>
                              {f.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Last Call Date */}
                      <td className="py-3.5 px-4 whitespace-nowrap text-xs text-zinc-500">
                        {lead.last_call_date
                          ? new Date(lead.last_call_date).toLocaleDateString()
                          : 'No calls yet'}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
                        >
                          <span>View</span>
                          <ExternalLink className="w-3 h-3 ml-1 opacity-70" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
