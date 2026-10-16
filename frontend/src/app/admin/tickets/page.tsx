'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { fetchApi } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { formatDate, formatDateTime, getStatusBadge, getPriorityBadge, getCategoryBadge } from '@/lib/utils';
import { TicketListItem } from '@/types';
import {
  Inbox,
  Search,
  Filter,
  RefreshCw,
  Clock,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ArrowUpDown,
  XCircle,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function AdminTicketQueuePage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Pagination State
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalTickets, setTotalTickets] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('default');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'ADMIN') {
      router.push('/author/dashboard');
    }
  }, [user, authLoading, router]);

  const loadQueue = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsRefreshing(true);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        status: statusFilter,
        category: categoryFilter,
        priority: priorityFilter,
        search: search.trim(),
        sortBy,
      });

      const res = await fetchApi(`/admin/tickets?${params.toString()}`);
      if (res?.success && res?.data) {
        setTickets(res.data.tickets);
        setTotalPages(res.data.pagination.totalPages);
        setTotalTickets(res.data.pagination.total);
      }
    } catch (err) {
      console.error('Failed to load admin queue', err);
    } finally {
      setLoading(false);
      if (!isBackground) setIsRefreshing(false);
    }
  }, [page, statusFilter, categoryFilter, priorityFilter, search, sortBy]);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadQueue(false);
    }
  }, [user, loadQueue]);

  // Real-time polling every 6 seconds
  usePolling(
    () => {
      loadQueue(true);
    },
    { intervalMs: 6000, enabled: !!user && user.role === 'ADMIN' }
  );

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('ALL');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setSortBy('default');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Operational Ticket Queue
                </h1>
                {isRefreshing && (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Prioritized queue surfacing critical & high priority issues first. Auto-refreshes in real time.
              </p>
            </div>
            <div className="text-xs font-medium text-slate-600 bg-white border border-slate-200 px-3 py-1.5 rounded-xl shadow-2xs">
              Matching Records: <strong className="text-slate-900">{totalTickets}</strong>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {/* Search */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search Ticket ID, Subject or Description..."
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    setPage(1);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Status Filter */}
              <div>
                <CustomSelect
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </CustomSelect>
              </div>

              {/* Priority Filter */}
              <div>
                <CustomSelect
                  value={priorityFilter}
                  onChange={(e) => {
                    setPriorityFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="CRITICAL">Critical</option>
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                </CustomSelect>
              </div>

              {/* Category Filter */}
              <div>
                <CustomSelect
                  value={categoryFilter}
                  onChange={(e) => {
                    setCategoryFilter(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs"
                >
                  <option value="ALL">All Categories</option>
                  <option value="Royalty & Payments">Royalty & Payments</option>
                  <option value="ISBN & Metadata Issues">ISBN & Metadata</option>
                  <option value="Printing & Quality">Printing & Quality</option>
                  <option value="Distribution & Availability">Distribution & Availability</option>
                  <option value="Book Status & Production Updates">Book Status & Production</option>
                  <option value="General Inquiry">General Inquiry</option>
                </CustomSelect>
              </div>
            </div>

            {/* Sort & Clear Row */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 text-xs">
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="text-slate-500 font-medium shrink-0">Sort Order:</span>
                <CustomSelect
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="text-xs min-w-[260px]"
                >
                  <option value="default">Default (Urgent & Oldest Unresolved First)</option>
                  <option value="priority_desc">Highest Priority First</option>
                  <option value="created_desc">Newest Created First</option>
                  <option value="created_asc">Oldest Created First</option>
                  <option value="updated_desc">Recently Updated</option>
                </CustomSelect>
              </div>

              {(search || statusFilter !== 'ALL' || categoryFilter !== 'ALL' || priorityFilter !== 'ALL' || sortBy !== 'default') && (
                <button
                  onClick={handleResetFilters}
                  className="text-slate-500 hover:text-slate-800 text-xs flex items-center gap-1 font-medium"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Ticket Table */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-100 rounded w-3/4" />
                </div>
              ))}
            </div>
          ) : tickets.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-4">Ticket</th>
                      <th className="py-3.5 px-4">Author & Title</th>
                      <th className="py-3.5 px-4">Category</th>
                      <th className="py-3.5 px-4">Priority</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4">Assigned</th>
                      <th className="py-3.5 px-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {tickets.map((t) => {
                      const statusBadge = getStatusBadge(t.status);
                      const priorityBadge = getPriorityBadge(t.priority);

                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          {/* ID & Date */}
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                              {t.ticket_id}
                            </span>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {formatDateTime(t.createdAt)}
                            </p>
                          </td>

                          {/* Author & Subject */}
                          <td className="py-3.5 px-4 max-w-xs">
                            <p className="font-semibold text-slate-900 line-clamp-1">{t.subject}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                              <strong>{t.author?.name}</strong> •{' '}
                              <span className="font-mono text-slate-400">{t.author?.author_id}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 truncate">
                              {t.book ? t.book.title : 'General Inquiry'}
                            </p>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[11px] font-medium px-2 py-0.5 rounded border ${getCategoryBadge(
                                t.category
                              )}`}
                            >
                              {t.category}
                            </span>
                            {t.overriddenCategory && (
                              <p className="text-[9px] text-amber-600 font-semibold mt-0.5">
                                Overridden by admin
                              </p>
                            )}
                          </td>

                          {/* Priority */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}
                            >
                              {priorityBadge.label}
                            </span>
                            {t.overriddenPriority && (
                              <p className="text-[9px] text-amber-600 font-semibold mt-0.5">
                                Overridden
                              </p>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3.5 px-4">
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}
                            >
                              {statusBadge.label}
                            </span>
                          </td>

                          {/* Assigned Admin */}
                          <td className="py-3.5 px-4">
                            {t.assignedAdmin ? (
                              <span className="text-[11px] font-medium text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                                {t.assignedAdmin.name}
                              </span>
                            ) : (
                              <span className="text-[11px] text-slate-400 italic">Unassigned</span>
                            )}
                          </td>

                          {/* Action */}
                          <td className="py-3.5 px-4">
                            <Link
                              href={`/admin/tickets/${t.ticket_id}`}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 hover:text-brand-900 bg-brand-50 hover:bg-brand-100 border border-brand-200 px-2.5 py-1 rounded-lg transition-colors"
                            >
                              Manage
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Controls */}
              <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>
                  Page <strong className="text-slate-800">{page}</strong> of{' '}
                  <strong className="text-slate-800">{totalPages}</strong> ({totalTickets} total)
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No matching tickets in queue</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search criteria or reset filters.
              </p>
              <button
                onClick={handleResetFilters}
                className="mt-3 text-xs font-semibold text-brand-700 hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
