'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { fetchApi } from '@/lib/api';
import { usePolling } from '@/hooks/usePolling';
import { formatDateTime, getStatusBadge, getPriorityBadge, getCategoryBadge, formatINR } from '@/lib/utils';
import { TicketDetail, Message } from '@/types';
import {
  ArrowLeft,
  LifeBuoy,
  BookOpen,
  Send,
  User as UserIcon,
  Shield,
  Clock,
  Paperclip,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

export default function AuthorTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [ticketData, setTicketData] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadTicketDetail = useCallback(async (isBackground = false) => {
    try {
      if (!isBackground) setIsRefreshing(true);
      const res = await fetchApi(`/author/tickets/${id}`);
      if (res?.success && res?.data) {
        setTicketData(res.data);
      }
    } catch (err: any) {
      if (!isBackground) {
        toast.error(err.message || 'Failed to load ticket details.');
      }
    } finally {
      setLoading(false);
      if (!isBackground) setIsRefreshing(false);
    }
  }, [id, toast]);

  useEffect(() => {
    if (user && user.role === 'AUTHOR' && id) {
      loadTicketDetail(false);
    }
  }, [user, id, loadTicketDetail]);

  // Polling every 6 seconds for new admin replies
  usePolling(
    () => {
      loadTicketDetail(true);
    },
    { intervalMs: 6000, enabled: !!user && user.role === 'AUTHOR' }
  );

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim()) return;

    setSubmittingReply(true);
    try {
      const res = await fetchApi(`/author/tickets/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: replyContent.trim() }),
      });

      if (res?.success && res?.data) {
        setReplyContent('');
        toast.success('Your reply was submitted successfully');
        loadTicketDetail(false);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSubmittingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-8 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-brand-300 border-t-brand-700 rounded-full animate-spin" />
          </main>
        </div>
      </div>
    );
  }

  if (!ticketData) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <Navbar />
        <div className="flex-1 flex max-w-7xl w-full mx-auto">
          <Sidebar />
          <main className="flex-1 p-8 text-center">
            <h2 className="text-base font-bold text-slate-800">Ticket not found</h2>
            <Link
              href="/author/tickets"
              className="inline-block mt-4 text-xs font-semibold text-brand-700 hover:underline"
            >
              Back to My Tickets
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const { ticket, messages } = ticketData;
  const statusBadge = getStatusBadge(ticket.status);
  const priorityBadge = getPriorityBadge(ticket.priority);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-5xl">
          {/* Back link */}
          <Link
            href="/author/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Tickets
          </Link>

          {/* Ticket Header Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded border border-brand-100">
                  {ticket.ticket_id}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                  {statusBadge.label}
                </span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                  {priorityBadge.label}
                </span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${getCategoryBadge(ticket.category)}`}>
                  {ticket.category}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                {isRefreshing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />}
                <Clock className="w-3.5 h-3.5" />
                <span>Opened {formatDateTime(ticket.createdAt)}</span>
              </div>
            </div>

            <div>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">{ticket.subject}</h1>
              {ticket.book && (
                <div className="mt-2 flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <BookOpen className="w-4 h-4 text-brand-600 shrink-0" />
                  <span>
                    Linked Title: <strong className="text-slate-800 font-semibold">{ticket.book.title}</strong>{' '}
                    ({ticket.book.book_id} • {ticket.book.status})
                  </span>
                </div>
              )}
            </div>

            {ticket.attachmentName && (
              <div className="flex items-center gap-2 text-xs text-slate-500 pt-2 border-t border-slate-100">
                <Paperclip className="w-3.5 h-3.5 text-slate-400" />
                <span>Attached File: <strong>{ticket.attachmentName}</strong></span>
              </div>
            )}
          </div>

          {/* Conversation Thread */}
          <div className="space-y-4">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-brand-600" />
              Conversation History ({messages.length})
            </h2>

            <div className="space-y-4">
              {messages.map((msg) => {
                const isAdmin = msg.senderRole === 'ADMIN';

                return (
                  <div
                    key={msg.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      isAdmin
                        ? 'bg-brand-50/50 border-brand-200 shadow-xs ml-0 sm:ml-6'
                        : 'bg-white border-slate-200 shadow-xs mr-0 sm:mr-6'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            isAdmin
                              ? 'bg-brand-900 text-white'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {isAdmin ? <Shield className="w-3 h-3 text-amber-400" /> : <UserIcon className="w-3 h-3" />}
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          {isAdmin ? 'BookLeaf Operations Team' : msg.senderName}
                        </span>
                        <span
                          className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                            isAdmin ? 'bg-purple-100 text-purple-700' : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {msg.senderRole}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {formatDateTime(msg.createdAt)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-800 leading-relaxed whitespace-pre-line font-sans">
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Reply Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Post a Follow-Up Reply
            </h3>
            <form onSubmit={handleSendReply} className="space-y-3">
              <textarea
                required
                rows={4}
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Type your message to the BookLeaf operations team..."
                className="w-full text-xs border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans"
              />
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  Replies are monitored by the BookLeaf author support team in Delhi.
                </span>
                <button
                  type="submit"
                  disabled={submittingReply || !replyContent.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submittingReply ? (
                    <>
                      <div className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Sending...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Reply</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
