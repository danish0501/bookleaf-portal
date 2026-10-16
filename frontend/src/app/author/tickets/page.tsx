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
  LifeBuoy,
  PlusCircle,
  Search,
  Filter,
  ArrowRight,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function AuthorTicketsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [tickets, setTickets] = useState<TicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadTickets = useCallback(async (showIndicator = false) => {
    try {
      if (showIndicator) setIsRefreshing(true);
      const res = await fetchApi('/author/tickets');
      if (res?.success && res?.data) {
        setTickets(res.data);
      }
    } catch (err) {
      console.error('Failed to load tickets', err);
    } finally {
      setLoading(false);
      if (showIndicator) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (user && user.role === 'AUTHOR') {
      loadTickets();
    }
  }, [user, loadTickets]);

  // Background polling every 7 seconds for live ticket updates
  usePolling(
    () => {
      loadTickets(false);
    },
    { intervalMs: 7000, enabled: !!user && user.role === 'AUTHOR' }
  );

  const filteredTickets = tickets.filter((t) => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const matchesSearch =
      t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.ticket_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.bookTitle && t.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

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
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">Support Tickets</h1>
                {isRefreshing && (
                  <RefreshCw className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                )}
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time support thread with BookLeaf publishing operations. Auto-refreshes every few seconds.
              </p>
            </div>
            <Link
              href="/author/tickets/new"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              New Support Query
            </Link>
          </div>

          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search ticket ID, title, or book..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <CustomSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs min-w-[170px]"
              >
                <option value="ALL">All Statuses ({tickets.length})</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </CustomSelect>
            </div>
          </div>

          {/* Ticket Table / Cards */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 animate-pulse space-y-3">
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="h-4 bg-slate-100 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredTickets.length > 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-slate-100">
                {filteredTickets.map((t) => {
                  const statusBadge = getStatusBadge(t.status);
                  const priorityBadge = getPriorityBadge(t.priority);

                  return (
                    <Link
                      key={t.id}
                      href={`/author/tickets/${t.ticket_id}`}
                      className="block p-5 hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                            {t.ticket_id}
                          </span>
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                            {statusBadge.label}
                          </span>
                          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                            {priorityBadge.label}
                          </span>
                        </div>

                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>Last updated {formatDateTime(t.updatedAt || t.createdAt)}</span>
                        </div>
                      </div>

                      <div className="mt-2.5">
                        <h3 className="text-sm font-bold text-slate-900 hover:text-brand-700 transition-colors">
                          {t.subject}
                        </h3>
                        <div className="mt-1 flex items-center gap-2 text-xs text-slate-500">
                          <span className="font-medium text-slate-700">{t.bookTitle}</span>
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${getCategoryBadge(t.category)}`}>
                            {t.category}
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <LifeBuoy className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No support tickets found</h3>
              <p className="text-xs text-slate-500 mt-1">
                You currently have no support tickets matching the filter criteria.
              </p>
              <Link
                href="/author/tickets/new"
                className="inline-block mt-4 text-xs font-semibold text-brand-700 hover:underline"
              >
                Create a new ticket →
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
