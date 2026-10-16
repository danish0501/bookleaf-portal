'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { StatCard } from '@/components/ui/StatCard';
import { CardSkeleton } from '@/components/ui/Skeleton';
import { fetchApi } from '@/lib/api';
import { formatDate, getStatusBadge, getPriorityBadge } from '@/lib/utils';
import { AdminDashboardStats } from '@/types';
import {
  Inbox,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function AdminDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState<AdminDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'ADMIN') {
      router.push('/author/dashboard');
    }
  }, [user, authLoading, router]);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/admin/dashboard');
      if (res?.success && res?.data) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Failed to load admin dashboard', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      loadDashboard();
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
  const categoryColors = ['#0c8fe9', '#8b5cf6', '#f43f5e', '#0ea5e9', '#f59e0b', '#64748b'];

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
                  Operations Command Center
                </h1>
                <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-100 text-purple-700 border border-purple-200">
                  Admin Level
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Real-time queue monitoring, AI domain classifications, and author query resolution.
              </p>
            </div>

            <Link
              href="/admin/tickets"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Inbox className="w-4 h-4 text-amber-400" />
              Manage Ticket Queue
            </Link>
          </div>

          {/* Metric Cards */}
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
                  title="Total Support Tickets"
                  value={stats?.totalTickets || 0}
                  subtext={`${stats?.openTickets || 0} Open • ${stats?.inProgressTickets || 0} In Progress`}
                  icon={Inbox}
                  color="brand"
                />
                <StatCard
                  title="Critical & High Priority"
                  value={stats?.criticalAndHighTickets || 0}
                  subtext={`${stats?.criticalTickets || 0} Critical • ${stats?.highTickets || 0} High`}
                  icon={AlertTriangle}
                  color="rose"
                />
                <StatCard
                  title="Awaiting Response"
                  value={stats?.awaitingResponse || 0}
                  subtext="Open or active author queries"
                  icon={Clock}
                  color="amber"
                />
                <StatCard
                  title="Resolved Tickets"
                  value={stats?.resolvedTickets || 0}
                  subtext={`${stats?.closedTickets || 0} closed archive`}
                  icon={CheckCircle2}
                  color="emerald"
                />
              </>
            )}
          </div>

          {/* Charts and Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Category Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-brand-600" />
                    Tickets by AI Category
                  </h2>
                  <p className="text-xs text-slate-500">Distribution across the 6 BookLeaf operational domains</p>
                </div>
              </div>

              {data?.categoryDistribution && data.categoryDistribution.length > 0 ? (
                <div className="h-64 w-full pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.categoryDistribution}
                      layout="vertical"
                      margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                      <YAxis
                        dataKey="name"
                        type="category"
                        width={130}
                        tick={{ fontSize: 10, fill: '#475569' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#ffffff',
                          borderRadius: '8px',
                          border: '1px solid #e2e8f0',
                          fontSize: '12px',
                        }}
                      />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {data.categoryDistribution.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={categoryColors[index % categoryColors.length]}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-48 flex items-center justify-center text-xs text-slate-400">
                  No ticket category data available.
                </div>
              )}
            </div>

            {/* Priority Distribution & SLA Cards */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
              <div>
                <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  Priority Distribution & SLA Matrix
                </h2>
                <p className="text-xs text-slate-500">AI-computed urgency levels & resolution guidelines</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {data?.priorityDistribution?.map((p) => {
                  const badge = getPriorityBadge(p.name as any);
                  return (
                    <div
                      key={p.name}
                      className={`p-3.5 rounded-xl border ${badge.bg} flex items-center justify-between`}
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${badge.dot}`} />
                          <span className="text-xs font-bold">{p.name}</span>
                        </div>
                        <p className="text-[10px] opacity-75 mt-0.5">
                          {p.name === 'CRITICAL' && 'Immediate response within 4 hours'}
                          {p.name === 'HIGH' && 'Resolution within 24 hours'}
                          {p.name === 'MEDIUM' && 'Resolution within 48 hours'}
                          {p.name === 'LOW' && 'General queue (3-5 business days)'}
                        </p>
                      </div>
                      <span className="text-xl font-bold">{p.count}</span>
                    </div>
                  );
                })}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-1">
                <p className="font-semibold text-slate-800">Operational Reminders:</p>
                <p className="text-[11px] leading-relaxed">
                  • ISBN errors must be escalated to production within 48h.
                  <br />
                  • Stock availability issues require triggering a 24–48h marketplace re-sync.
                  <br />
                  • Verified print defects qualify for a 100% free reprint via Delhi warehouse.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Queue Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Recent Incoming Tickets</h2>
                <p className="text-xs text-slate-500">Unresolved tickets prioritized by severity</p>
              </div>
              <Link
                href="/admin/tickets"
                className="text-xs font-semibold text-brand-600 hover:text-brand-800 flex items-center gap-1"
              >
                View Full Queue
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {data?.recentTickets?.map((t) => {
                const statusBadge = getStatusBadge(t.status);
                const priorityBadge = getPriorityBadge(t.priority);

                return (
                  <Link
                    key={t.id}
                    href={`/admin/tickets/${t.ticket_id}`}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 px-2 rounded-lg transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                          {t.ticket_id}
                        </span>
                        <span className="text-xs font-semibold text-slate-900 line-clamp-1">
                          {t.subject}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-1">
                        <span>Author: <strong>{t.authorName}</strong></span>
                        <span>•</span>
                        <span>{t.bookTitle}</span>
                        <span>•</span>
                        <span>{t.category}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                        {priorityBadge.label}
                      </span>
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
