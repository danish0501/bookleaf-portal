'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { StatCard } from '@/components/ui/StatCard';
import { Badge } from '@/components/ui/Badge';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { fetchApi } from '@/lib/api';
import { formatINR, formatDate, getStatusBadge, getPriorityBadge } from '@/lib/utils';
import { AuthorDashboardStats } from '@/types';
import {
  BookOpen,
  CheckCircle,
  Clock,
  TrendingUp,
  DollarSign,
  AlertCircle,
  PlusCircle,
  ArrowRight,
  LifeBuoy,
} from 'lucide-react';

export default function AuthorDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AuthorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/author/dashboard');
      if (res?.success && res?.data) {
        setData(res.data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'AUTHOR') {
      fetchDashboard();
    }
  }, [user]);

  if (authLoading || (!user && loading)) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-brand-300 border-t-brand-700 rounded-full animate-spin" />
      </div>
    );
  }

  const stats = data?.stats;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-8 overflow-y-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                  Welcome back, {user?.name}
                </h1>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                  {user?.author_id}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Monitor your published titles, royalties, and communication tickets with BookLeaf.
              </p>
            </div>
            <Link
              href="/author/tickets/new"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <PlusCircle className="w-4 h-4 text-amber-400" />
              Raise Support Ticket
            </Link>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              <>
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
                <CardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  title="Total Books"
                  value={stats?.totalBooks || 0}
                  subtext={`${stats?.publishedBooks || 0} live • ${stats?.inProductionBooks || 0} in production`}
                  icon={BookOpen}
                  color="brand"
                />
                <StatCard
                  title="Copies Sold"
                  value={(stats?.totalCopiesSold || 0).toLocaleString('en-IN')}
                  subtext="Across Amazon, Flipkart & Store"
                  icon={TrendingUp}
                  color="purple"
                />
                <StatCard
                  title="Total Royalty"
                  value={formatINR(stats?.totalRoyaltyEarned)}
                  subtext={`Paid: ${formatINR(stats?.royaltyPaid)}`}
                  icon={DollarSign}
                  color="emerald"
                />
                <StatCard
                  title="Pending Royalty"
                  value={formatINR(stats?.royaltyPending)}
                  subtext={
                    (stats?.royaltyPending || 0) >= 1000
                      ? 'Queued for quarterly cycle'
                      : 'Rolls over (min ₹1,000 threshold)'
                  }
                  icon={Clock}
                  color="amber"
                />
              </>
            )}
          </div>

          {/* Recent Books & Tickets Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* My Books Overview */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Your Book Titles</h2>
                  <p className="text-xs text-slate-500">Live titles and active production pipeline</p>
                </div>
                <Link
                  href="/author/books"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                >
                  View All
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="space-y-3">
                {data?.books?.map((b) => (
                  <div
                    key={b.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{b.title}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-500 font-mono">
                          {b.isbn || 'ISBN Pending'}
                        </span>
                        <span className="text-slate-300">•</span>
                        <span className="text-[11px] text-slate-600 font-medium">
                          {b.totalCopiesSold} sold
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                          b.status === 'Published & Live'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {b.status}
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">
                        Pending: {formatINR(b.royaltyPending)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Support Tickets */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900">Recent Support Queries</h2>
                  <p className="text-xs text-slate-500">Track your open issues and admin replies</p>
                </div>
                <Link
                  href="/author/tickets"
                  className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
                >
                  All Tickets
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {data?.recentTickets && data.recentTickets.length > 0 ? (
                <div className="space-y-3">
                  {data.recentTickets.map((t) => {
                    const statusBadge = getStatusBadge(t.status);
                    return (
                      <Link
                        key={t.id}
                        href={`/author/tickets/${t.ticket_id}`}
                        className="block p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-brand-50/40 hover:border-brand-200 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-brand-700">
                            {t.ticket_id}
                          </span>
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusBadge.bg}`}
                          >
                            {statusBadge.label}
                          </span>
                        </div>
                        <p className="text-xs font-semibold text-slate-900 mt-1 line-clamp-1">
                          {t.subject}
                        </p>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5">
                          <span>{t.bookTitle}</span>
                          <span>{formatDate(t.createdAt)}</span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                  <LifeBuoy className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-medium text-slate-600">No support tickets submitted yet</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Have questions about royalties, printing or ISBNs?
                  </p>
                  <Link
                    href="/author/tickets/new"
                    className="inline-block mt-3 text-xs font-semibold text-brand-700 hover:underline"
                  >
                    Submit a query →
                  </Link>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
