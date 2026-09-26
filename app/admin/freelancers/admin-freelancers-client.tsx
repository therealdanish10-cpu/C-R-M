'use client';

import React, { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Freelancer } from '@/lib/supabase/types';
import {
  Users,
  UserPlus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  X,
  Globe,
  Clock,
  Percent,
  Mail,
  Phone,
  Shield,
} from 'lucide-react';

interface AdminFreelancersClientProps {
  initialFreelancers: Freelancer[];
  isSupabaseConfigured: boolean;
}

export function AdminFreelancersClient({
  initialFreelancers,
  isSupabaseConfigured,
}: AdminFreelancersClientProps) {
  const [freelancers, setFreelancers] = useState<Freelancer[]>(initialFreelancers);

  // Add Freelancer Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCountry, setNewCountry] = useState('United States');
  const [newTimezone, setNewTimezone] = useState('America/New_York');
  const [newCommissionRate, setNewCommissionRate] = useState('15');
  const [newUserId, setNewUserId] = useState('');
  const [newIsAdmin, setNewIsAdmin] = useState(false);
  const [isSubmittingNew, setIsSubmittingNew] = useState(false);

  // Edit Freelancer Modal
  const [editingFreelancer, setEditingFreelancer] = useState<Freelancer | null>(null);
  const [editRate, setEditRate] = useState<string>('15');
  const [editStatus, setEditStatus] = useState<string>('active');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToast({ text, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Add freelancer handler
  const handleAddFreelancer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newEmail) {
      showToast('Name and email are required', 'error');
      return;
    }

    setIsSubmittingNew(true);

    const payload = {
      name: newName.trim(),
      email: newEmail.trim().toLowerCase(),
      phone: newPhone.trim() || null,
      country: newCountry.trim() || null,
      timezone: newTimezone.trim() || null,
      status: 'active',
      commission_rate: parseFloat(newCommissionRate) || 15.0,
      user_id: newUserId.trim() || `placeholder-user-${Date.now()}`,
      is_admin: newIsAdmin,
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from('freelancers')
          .insert(payload)
          .select()
          .single();

        if (error) {
          showToast(`Error adding freelancer: ${error.message}`, 'error');
        } else {
          setFreelancers((prev) => [data as Freelancer, ...prev]);
          setShowAddModal(false);
          resetForm();
          showToast('Freelancer record created successfully');
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to add freelancer', 'error');
      }
    } else {
      // Demo Mode
      const mockRecord: Freelancer = {
        id: `fl-demo-${Date.now()}`,
        ...payload,
      };
      setFreelancers((prev) => [mockRecord, ...prev]);
      setShowAddModal(false);
      resetForm();
      showToast('[Demo Mode] Freelancer record created successfully');
    }

    setIsSubmittingNew(false);
  };

  const resetForm = () => {
    setNewName('');
    setNewEmail('');
    setNewPhone('');
    setNewCountry('United States');
    setNewTimezone('America/New_York');
    setNewCommissionRate('15');
    setNewUserId('');
    setNewIsAdmin(false);
  };

  // Edit freelancer handler
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFreelancer) return;

    setIsSavingEdit(true);
    const parsedRate = parseFloat(editRate) || 0;

    if (isSupabaseConfigured) {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('freelancers')
          .update({
            commission_rate: parsedRate,
            status: editStatus,
          })
          .eq('id', editingFreelancer.id);

        if (error) {
          showToast(`Error updating freelancer: ${error.message}`, 'error');
        } else {
          setFreelancers((prev) =>
            prev.map((f) =>
              f.id === editingFreelancer.id
                ? { ...f, commission_rate: parsedRate, status: editStatus }
                : f
            )
          );
          setEditingFreelancer(null);
          showToast('Freelancer updated successfully');
        }
      } catch (err: any) {
        showToast(err?.message || 'Failed to update freelancer', 'error');
      }
    } else {
      // Demo Mode
      setFreelancers((prev) =>
        prev.map((f) =>
          f.id === editingFreelancer.id
            ? { ...f, commission_rate: parsedRate, status: editStatus }
            : f
        )
      );
      setEditingFreelancer(null);
      showToast('[Demo Mode] Freelancer updated successfully');
    }

    setIsSavingEdit(false);
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

      {/* Title & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Freelancer Roster
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-zinc-500 dark:text-zinc-400">
            Manage agency callers, set commission rates, and maintain account statuses.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center px-4 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition shadow-xs self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 mr-1.5" />
          Add Freelancer
        </button>
      </div>

      {/* Freelancers List / Table */}
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider select-none">
                <th className="py-3.5 px-4">Freelancer Name</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Country & Timezone</th>
                <th className="py-3.5 px-4">Commission Rate</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {freelancers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-zinc-400">
                    No freelancers registered. Click &quot;Add Freelancer&quot; to create one.
                  </td>
                </tr>
              ) : (
                freelancers.map((fl, idx) => (
                  <tr
                    key={fl.id}
                    className={`transition-colors hover:bg-blue-50/30 dark:hover:bg-blue-950/20 ${
                      idx % 2 === 1 ? 'bg-zinc-50/40 dark:bg-zinc-900/30' : 'bg-white dark:bg-zinc-900'
                    }`}
                  >
                    {/* Name */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                        <span>{fl.name}</span>
                        {fl.is_admin && (
                          <span className="text-[10px] uppercase font-bold text-amber-600 bg-amber-100 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded border border-amber-200 dark:border-amber-800">
                            Admin
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 font-mono mt-0.5">ID: {fl.id}</div>
                    </td>

                    {/* Contact */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1 text-zinc-700 dark:text-zinc-300">
                        <Mail className="w-3 h-3 text-zinc-400" />
                        <span>{fl.email}</span>
                      </div>
                      {fl.phone && (
                        <div className="flex items-center gap-1 text-zinc-500 mt-0.5">
                          <Phone className="w-3 h-3 text-zinc-400" />
                          <span>{fl.phone}</span>
                        </div>
                      )}
                    </td>

                    {/* Country & Timezone */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                      <div className="flex items-center gap-1 text-zinc-800 dark:text-zinc-200">
                        <Globe className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{fl.country || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-zinc-400 text-[11px] mt-0.5">
                        <Clock className="w-3 h-3 text-zinc-400" />
                        <span>{fl.timezone || 'UTC'}</span>
                      </div>
                    </td>

                    {/* Commission Rate */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 dark:bg-amber-950/70 dark:text-amber-300 dark:border-amber-800">
                        {fl.commission_rate ?? 15}%
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                          fl.status?.toLowerCase() === 'active'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/70 dark:text-emerald-300 dark:border-emerald-800'
                            : 'bg-zinc-100 text-zinc-700 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                            fl.status?.toLowerCase() === 'active' ? 'bg-emerald-500' : 'bg-zinc-400'
                          }`}
                        ></span>
                        <span className="capitalize">{fl.status || 'Active'}</span>
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingFreelancer(fl);
                          setEditRate(String(fl.commission_rate ?? 15));
                          setEditStatus(fl.status || 'active');
                        }}
                        className="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 transition"
                      >
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: ADD FREELANCER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100">
                  Add New Freelancer
                </h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-[11px] text-blue-900 dark:text-blue-300">
              Note: To allow login, remember to also create their user in the Supabase Auth Dashboard and paste their Auth User UID into the user_id field below.
            </div>

            <form onSubmit={handleAddFreelancer} className="space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="alex@trelio.crm"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Commission Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    value={newCommissionRate}
                    onChange={(e) => setNewCommissionRate(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Country
                  </label>
                  <input
                    type="text"
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                    Timezone (IANA)
                  </label>
                  <input
                    type="text"
                    value={newTimezone}
                    onChange={(e) => setNewTimezone(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
                  Auth User ID (UUID / Placeholder)
                </label>
                <input
                  type="text"
                  placeholder="Paste Supabase auth.users ID or leave blank for placeholder"
                  value={newUserId}
                  onChange={(e) => setNewUserId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-mono"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="newIsAdmin"
                  checked={newIsAdmin}
                  onChange={(e) => setNewIsAdmin(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="newIsAdmin" className="text-xs text-zinc-700 dark:text-zinc-300 font-medium cursor-pointer">
                  Grant Administrator Privileges (is_admin = true)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNew}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {isSubmittingNew ? 'Creating...' : 'Create Freelancer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT FREELANCER */}
      {editingFreelancer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3.5 border-b border-zinc-100 dark:border-zinc-800 mb-4">
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Edit {editingFreelancer.name}
              </h3>
              <button
                onClick={() => setEditingFreelancer(null)}
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Commission Rate (%)
                </label>
                <div className="relative">
                  <Percent className="w-4 h-4 text-zinc-400 absolute right-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="100"
                    required
                    value={editRate}
                    onChange={(e) => setEditRate(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider mb-1.5">
                  Account Status
                </label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-zinc-50 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg font-semibold"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingFreelancer(null)}
                  className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                >
                  {isSavingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
