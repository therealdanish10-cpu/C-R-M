'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Filter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Phone,
  ExternalLink,
  Calendar,
  Building2,
  X,
  PhoneForwarded,
} from 'lucide-react';
import { Lead } from '@/lib/supabase/types';

interface LeadsTableProps {
  initialLeads: Lead[];
}

type SortField = 'created_at' | 'status' | 'last_call_date' | 'business_name';
type SortDirection = 'asc' | 'desc';

export function LeadsTable({ initialLeads }: LeadsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Handle column sort toggle
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      // For dates, default to descending when switched, for names default to ascending
      setSortDirection(field === 'business_name' ? 'asc' : 'desc');
    }
  };

  // Filtered and sorted leads
  const filteredLeads = useMemo(() => {
    return initialLeads
      .filter((lead) => {
        // Status filter
        if (statusFilter !== 'all' && lead.status.toLowerCase() !== statusFilter.toLowerCase()) {
          return false;
        }

        // Search term filter (business name or phone)
        if (searchTerm.trim() !== '') {
          const term = searchTerm.toLowerCase();
          const matchesName = lead.business_name?.toLowerCase().includes(term);
          const matchesPhone = lead.phone?.toLowerCase().includes(term);
          if (!matchesName && !matchesPhone) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        let valA: string | number = '';
        let valB: string | number = '';

        if (sortField === 'created_at') {
          valA = a.created_at ? new Date(a.created_at).getTime() : 0;
          valB = b.created_at ? new Date(b.created_at).getTime() : 0;
        } else if (sortField === 'last_call_date') {
          // If no calls, rank it lower or higher depending on direction
          valA = a.last_call_date ? new Date(a.last_call_date).getTime() : 0;
          valB = b.last_call_date ? new Date(b.last_call_date).getTime() : 0;
        } else if (sortField === 'business_name') {
          valA = (a.business_name || '').toLowerCase();
          valB = (b.business_name || '').toLowerCase();
        } else if (sortField === 'status') {
          valA = (a.status || '').toLowerCase();
          valB = (b.status || '').toLowerCase();
        }

        if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [initialLeads, searchTerm, statusFilter, sortField, sortDirection]);

  // Colored badge helper matching exact requirement:
  // new = gray, contacted = blue, interested = yellow, meeting_booked = purple, sold = green, not_interested/dead = red
  const getStatusBadge = (status: string) => {
    const s = (status || '').toLowerCase().trim();
    switch (s) {
      case 'new':
        return {
          label: 'New',
          classes:
            'bg-gray-100 text-gray-800 border-gray-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
        };
      case 'contacted':
        return {
          label: 'Contacted',
          classes:
            'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950/70 dark:text-blue-300 dark:border-blue-800',
        };
      case 'interested':
        return {
          label: 'Interested',
          classes:
            'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800',
        };
      case 'meeting_booked':
        return {
          label: 'Meeting Booked',
          classes:
            'bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-950/70 dark:text-purple-300 dark:border-purple-800',
        };
      case 'sold':
        return {
          label: 'Sold',
          classes:
            'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800',
        };
      case 'not_interested':
        return {
          label: 'Not Interested',
          classes:
            'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
        };
      case 'dead':
        return {
          label: 'Dead',
          classes:
            'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-950/70 dark:text-rose-300 dark:border-rose-800',
        };
      default:
        return {
          label: status,
          classes:
            'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700',
        };
    }
  };

  // Helper to format date
  const formatCallDate = (dateString?: string | null) => {
    if (!dateString) return 'No calls yet';
    try {
      const d = new Date(dateString);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return dateString;
    }
  };

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

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
      {/* Filters and Search Bar Header */}
      <div className="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by business name or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-sm bg-white dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Status Dropdown and Results Count */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 sm:flex-initial">
              <div className="flex items-center">
                <Filter className="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-9 pr-8 py-2 text-sm bg-white dark:bg-zinc-800/80 border border-zinc-300 dark:border-zinc-700 rounded-lg text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer font-medium"
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
            </div>

            <div className="hidden sm:block text-xs font-medium text-zinc-500 dark:text-zinc-400 whitespace-nowrap">
              Showing <span className="text-zinc-900 dark:text-zinc-200 font-semibold">{filteredLeads.length}</span> of {initialLeads.length}
            </div>
          </div>
        </div>

        {/* Active Filter Chips on Mobile */}
        <div className="mt-2 sm:hidden flex items-center justify-between text-xs text-zinc-500">
          <span>{filteredLeads.length} leads found</span>
          {(searchTerm || statusFilter !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              className="text-blue-600 dark:text-blue-400 hover:underline font-medium"
            >
              Reset filters
            </button>
          )}
        </div>
      </div>

      {/* Desktop & Tablet Table (Bordered & Striped) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
              <th
                onClick={() => handleSort('business_name')}
                className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
              >
                <div className="flex items-center">
                  <span>Business Name</span>
                  {renderSortIcon('business_name')}
                </div>
              </th>
              <th className="py-3.5 px-4">Phone</th>
              <th className="py-3.5 px-4">Category</th>
              <th
                onClick={() => handleSort('status')}
                className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
              >
                <div className="flex items-center">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>
              <th
                onClick={() => handleSort('last_call_date')}
                className="py-3.5 px-4 cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/80 transition-colors"
              >
                <div className="flex items-center">
                  <span>Last Call Date</span>
                  {renderSortIcon('last_call_date')}
                </div>
              </th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-zinc-500 dark:text-zinc-400">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Building2 className="w-8 h-8 text-zinc-300 dark:text-zinc-600" />
                    <p className="font-medium">No leads match your filter</p>
                    <p className="text-xs text-zinc-400">Try adjusting your search query or status dropdown.</p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead, idx) => {
                const badge = getStatusBadge(lead.status);
                const hasCalled = !!lead.last_call_date;
                return (
                  <tr
                    key={lead.id}
                    className={`transition-colors hover:bg-blue-50/40 dark:hover:bg-blue-950/20 ${
                      idx % 2 === 1 ? 'bg-zinc-50/50 dark:bg-zinc-900/40' : 'bg-white dark:bg-zinc-900'
                    }`}
                  >
                    {/* Business Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {lead.business_name}
                      </div>
                      {(lead.city || lead.state) && (
                        <div className="text-xs text-zinc-400 mt-0.5">
                          {[lead.city, lead.state].filter(Boolean).join(', ')}
                        </div>
                      )}
                    </td>

                    {/* Phone with click-to-call */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {lead.phone ? (
                        <a
                          href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                          className="inline-flex items-center text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 font-mono text-xs group"
                          title="Click to call"
                        >
                          <Phone className="w-3.5 h-3.5 mr-1.5 text-zinc-400 group-hover:text-blue-600 transition-colors" />
                          <span>{lead.phone}</span>
                        </a>
                      ) : (
                        <span className="text-zinc-400 text-xs italic">N/A</span>
                      )}
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {lead.category || 'General'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${badge.classes}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80"></span>
                        {badge.label}
                      </span>
                    </td>

                    {/* Last Call Date */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs ${
                          hasCalled
                            ? 'text-zinc-700 dark:text-zinc-300 font-medium'
                            : 'text-zinc-400 italic'
                        }`}
                      >
                        {formatCallDate(lead.last_call_date)}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-all shadow-xs hover:shadow"
                      >
                        View
                        <ExternalLink className="w-3 h-3 ml-1.5 opacity-90" />
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout (Optimized for Cold Calling on Mobile Phones) */}
      <div className="block md:hidden divide-y divide-zinc-200 dark:divide-zinc-800">
        {filteredLeads.length === 0 ? (
          <div className="p-8 text-center text-zinc-500 dark:text-zinc-400">
            <Building2 className="w-8 h-8 mx-auto text-zinc-300 dark:text-zinc-600 mb-2" />
            <p className="font-medium text-sm">No leads match your filter</p>
            <p className="text-xs text-zinc-400 mt-1">Try resetting search or filters.</p>
          </div>
        ) : (
          filteredLeads.map((lead) => {
            const badge = getStatusBadge(lead.status);
            return (
              <div
                key={lead.id}
                className="p-4 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-zinc-900 dark:text-zinc-100 text-base leading-snug">
                      {lead.business_name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded">
                        {lead.category || 'General'}
                      </span>
                      {(lead.city || lead.state) && (
                        <span className="text-xs text-zinc-400">
                          {[lead.city, lead.state].filter(Boolean).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold border shrink-0 ${badge.classes}`}
                  >
                    {badge.label}
                  </span>
                </div>

                {/* Last Call & Phone */}
                <div className="mt-3 flex flex-col gap-1.5 text-xs text-zinc-600 dark:text-zinc-400">
                  <div className="flex items-center justify-between">
                    <span className="text-zinc-500">Last call:</span>
                    <span className={lead.last_call_date ? 'font-medium text-zinc-800 dark:text-zinc-200' : 'italic text-zinc-400'}>
                      {formatCallDate(lead.last_call_date)}
                    </span>
                  </div>
                </div>

                {/* Mobile Action Buttons: Call & View */}
                <div className="mt-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-2">
                  {lead.phone && (
                    <a
                      href={`tel:${lead.phone.replace(/[^0-9+]/g, '')}`}
                      className="flex-1 inline-flex items-center justify-center py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 hover:bg-emerald-100 transition-colors"
                    >
                      <PhoneForwarded className="w-3.5 h-3.5 mr-1.5" />
                      Call {lead.phone}
                    </a>
                  )}
                  <Link
                    href={`/leads/${lead.id}`}
                    className="flex-1 inline-flex items-center justify-center py-2 px-3 text-xs font-semibold rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors shadow-xs"
                  >
                    View Details
                    <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Link>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer info */}
      <div className="p-3.5 sm:px-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 gap-2">
        <div>
          Sorted by: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{sortField.replace(/_/g, ' ')}</span> ({sortDirection === 'asc' ? 'ascending' : 'descending'})
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span> Live Leads
          </span>
        </div>
      </div>
    </div>
  );
}
