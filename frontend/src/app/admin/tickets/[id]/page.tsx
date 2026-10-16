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
import {
  formatDate,
  formatDateTime,
  formatINR,
  getStatusBadge,
  getPriorityBadge,
  getCategoryBadge,
} from '@/lib/utils';
import { TicketDetail, TicketCategory, TicketPriority, TicketStatus } from '@/types';
import {
  ArrowLeft,
  LifeBuoy,
  BookOpen,
  User as UserIcon,
  Shield,
  Sparkles,
  Send,
  Lock,
  RefreshCw,
  Clock,
  Printer,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Paperclip,
  Edit3,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function AdminTicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [ticketData, setTicketData] = useState<TicketDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Overrides form state
  const [statusVal, setStatusVal] = useState<TicketStatus>('OPEN');
  const [categoryOverride, setCategoryOverride] = useState<string>('');
  const [priorityOverride, setPriorityOverride] = useState<string>('');
  const [assignedAdminVal, setAssignedAdminVal] = useState<string>('');
  const [savingOverrides, setSavingOverrides] = useState(false);

  // AI Draft Workspace state
  const [draftContent, setDraftContent] = useState('');
  const [generatingDraft, setGeneratingDraft] = useState(false);
  const [sendingPublicReply, setSendingPublicReply] = useState(false);

  // Internal Notes state
  const [newNoteContent, setNewNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // AI Classification rerun
  const [rerunningAI, setRerunningAI] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (user && user.role !== 'ADMIN') {
      router.push('/author/dashboard');
    }
  }, [user, authLoading, router]);

  const loadTicketDetail = useCallback(
    async (isBackground = false) => {
      try {
        if (!isBackground) setIsRefreshing(true);
        const res = await fetchApi(`/admin/tickets/${id}`);
        if (res?.success && res?.data) {
          setTicketData(res.data);
          const t = res.data.ticket;
          setStatusVal(t.status);
          setCategoryOverride(t.overriddenCategory || '');
          setPriorityOverride(t.overriddenPriority || '');
          setAssignedAdminVal(t.assignedAdmin?._id || '');

          if (t.lastDraftResponse && !draftContent) {
            setDraftContent(t.lastDraftResponse);
          }
        }
      } catch (err: any) {
        if (!isBackground) {
          toast.error(err.message || 'Failed to load ticket details.');
        }
      } finally {
        setLoading(false);
        if (!isBackground) setIsRefreshing(false);
      }
    },
    [id, toast, draftContent]
  );

  useEffect(() => {
    if (user && user.role === 'ADMIN' && id) {
      loadTicketDetail(false);
    }
  }, [user, id, loadTicketDetail]);

  // Polling every 6 seconds for updates
  usePolling(
    () => {
      loadTicketDetail(true);
    },
    { intervalMs: 6000, enabled: !!user && user.role === 'ADMIN' }
  );

  const handleSaveOverrides = async () => {
    setSavingOverrides(true);
    try {
      const payload: any = {
        status: statusVal,
        overriddenCategory: categoryOverride === '' ? null : categoryOverride,
        overriddenPriority: priorityOverride === '' ? null : priorityOverride,
        assignedAdmin: assignedAdminVal === '' ? null : assignedAdminVal,
      };

      const res = await fetchApi(`/admin/tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (res?.success) {
        toast.success('Ticket properties updated successfully');
        loadTicketDetail(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update ticket properties');
    } finally {
      setSavingOverrides(false);
    }
  };

  const handleAssignToMe = async () => {
    if (!user) return;
    setSavingOverrides(true);
    try {
      const res = await fetchApi(`/admin/tickets/${id}/assign`, {
        method: 'POST',
        body: JSON.stringify({ adminId: user.id }),
      });
      if (res?.success) {
        toast.success('Ticket assigned to you');
        setAssignedAdminVal(user.id);
        loadTicketDetail(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to assign ticket');
    } finally {
      setSavingOverrides(false);
    }
  };

  const handleGenerateDraft = async () => {
    setGeneratingDraft(true);
    try {
      const res = await fetchApi(`/admin/tickets/${id}/ai-draft`, {
        method: 'POST',
      });
      if (res?.success && res?.data?.draft) {
        setDraftContent(res.data.draft);
        toast.success(
          res.data.isLiveAI
            ? 'AI draft generated with Gemini'
            : 'Draft generated using BookLeaf Knowledge Base engine'
        );
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate draft');
    } finally {
      setGeneratingDraft(false);
    }
  };

  const handleSendPublicReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!draftContent.trim()) return;

    setSendingPublicReply(true);
    try {
      const res = await fetchApi(`/admin/tickets/${id}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content: draftContent.trim() }),
      });

      if (res?.success) {
        toast.success('Reply dispatched to author');
        setDraftContent('');
        loadTicketDetail(false);
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
    } finally {
      setSendingPublicReply(false);
    }
  };

  const handleAddInternalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteContent.trim()) return;

    setSubmittingNote(true);
    try {
      const res = await fetchApi(`/admin/tickets/${id}/notes`, {
        method: 'POST',
        body: JSON.stringify({ content: newNoteContent.trim() }),
      });

      if (res?.success) {
        toast.success('Internal note recorded');
        setNewNoteContent('');
        loadTicketDetail(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save internal note');
    } finally {
      setSubmittingNote(false);
    }
  };

  const handleRerunAIClassification = async () => {
    setRerunningAI(true);
    try {
      const res = await fetchApi(`/admin/tickets/${id}/ai-classify`, {
        method: 'POST',
      });
      if (res?.success) {
        toast.success('AI classification re-evaluated');
        loadTicketDetail(false);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to rerun AI analysis');
    } finally {
      setRerunningAI(false);
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
              href="/admin/tickets"
              className="inline-block mt-4 text-xs font-semibold text-brand-700 hover:underline"
            >
              Back to Ticket Queue
            </Link>
          </main>
        </div>
      </div>
    );
  }

  const { ticket, messages, internalNotes = [], admins = [] } = ticketData;
  const author = ticket.author;
  const book = ticket.book;
  const statusBadge = getStatusBadge(ticket.status);
  const priorityBadge = getPriorityBadge(ticket.priority);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-6xl">
          {/* Back link */}
          <Link
            href="/admin/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Queue
          </Link>

          {/* Ticket Header & Author Summary Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2.5 py-1 rounded border border-brand-100">
                  {ticket.ticket_id}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${statusBadge.bg}`}>
                  {statusBadge.label}
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${priorityBadge.bg}`}>
                  {priorityBadge.label}
                </span>
                <span className={`text-xs font-medium px-2.5 py-0.5 rounded border ${getCategoryBadge(ticket.category)}`}>
                  {ticket.category}
                </span>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                {isRefreshing && <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-600" />}
                <Clock className="w-3.5 h-3.5" />
                <span>Submitted {formatDateTime(ticket.createdAt)}</span>
              </div>
            </div>

            <h1 className="text-xl font-bold text-slate-900 tracking-tight">{ticket.subject}</h1>

            {/* Author & Book Context Pills */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {/* Author Info */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    Author Profile
                  </span>
                  <span className="font-mono text-slate-500 font-bold">{author?.author_id}</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{author?.name}</p>
                <p className="text-slate-500">{author?.email} • {author?.phone || 'No phone'}</p>
                <p className="text-slate-400 text-[11px]">{author?.city ? `${author.city} • ` : ''}Member since {author?.joined_date ? formatDate(author.joined_date) : '2023'}</p>
              </div>

              {/* Book Info */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                    Associated Title
                  </span>
                  {book && <span className="font-mono text-slate-500 font-bold">{book.book_id}</span>}
                </div>
                {book ? (
                  <>
                    <p className="text-sm font-bold text-slate-900 line-clamp-1">{book.title}</p>
                    <p className="text-slate-600">
                      ISBN: <span className="font-mono font-medium">{book.isbn || 'Pending'}</span> •{' '}
                      Status: <strong>{book.status}</strong>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Sold: <strong>{book.total_copies_sold}</strong> copies • Pending Royalty:{' '}
                      <strong className="text-amber-700">{formatINR(book.royalty_pending)}</strong>
                    </p>
                  </>
                ) : (
                  <p className="text-slate-500 italic mt-2">
                    General Account Level (No specific book attached to this inquiry)
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* AI Intelligence & Overrides Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AI Analysis Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-bold text-slate-900">AI Intelligence Analysis</h3>
                </div>
                <button
                  type="button"
                  onClick={handleRerunAIClassification}
                  disabled={rerunningAI}
                  className="text-xs text-brand-700 hover:text-brand-900 font-semibold flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${rerunningAI ? 'animate-spin' : ''}`} />
                  Re-evaluate AI
                </button>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Auto-Classified Category:</span>
                  <strong className="text-slate-800">{ticket.aiCategory || 'General Inquiry'}</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Computed Priority Score:</span>
                  <strong className="text-slate-800">{ticket.aiPriority || 'MEDIUM'}</strong>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-slate-500">Classification Confidence:</span>
                  <strong className="text-brand-700">
                    {ticket.aiConfidence ? `${Math.round(ticket.aiConfidence * 100)}%` : '85%'}
                  </strong>
                </div>

                {ticket.aiReasoning && (
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-slate-500 block mb-0.5">Model Reasoning:</span>
                    <p className="text-slate-700 italic text-[11px] leading-relaxed">
                      "{ticket.aiReasoning}"
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-400">
                  <span>Engine: <strong>Gemini / Knowledge Base Grounded</strong></span>
                  <span>•</span>
                  <span>
                    Status:{' '}
                    <strong className="text-slate-600">
                      {ticket.aiAnalysisStatus || 'SUCCESS'}
                    </strong>
                  </span>
                </div>
              </div>
            </div>

            {/* Admin Overrides & Assignment Panel */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Ticket Management & Overrides</h3>
                <button
                  type="button"
                  onClick={handleAssignToMe}
                  className="text-xs text-brand-700 hover:text-brand-900 font-semibold"
                >
                  Assign to Me
                </button>
              </div>

              <div className="space-y-3 text-xs">
                {/* Status Override */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Operational Status
                  </label>
                  <CustomSelect
                    value={statusVal}
                    onChange={(e) => setStatusVal(e.target.value as TicketStatus)}
                    className="w-full text-xs"
                  >
                    <option value="OPEN">OPEN (Awaiting Review)</option>
                    <option value="IN_PROGRESS">IN PROGRESS (Under Investigation)</option>
                    <option value="RESOLVED">RESOLVED (Author Action Complete)</option>
                    <option value="CLOSED">CLOSED (Archived)</option>
                  </CustomSelect>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Category Override */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Category Override
                    </label>
                    <CustomSelect
                      value={categoryOverride}
                      onChange={(e) => setCategoryOverride(e.target.value)}
                      className="w-full text-xs"
                    >
                      <option value="">Keep AI: {ticket.aiCategory}</option>
                      <option value="Royalty & Payments">Royalty & Payments</option>
                      <option value="ISBN & Metadata Issues">ISBN & Metadata</option>
                      <option value="Printing & Quality">Printing & Quality</option>
                      <option value="Distribution & Availability">Distribution & Availability</option>
                      <option value="Book Status & Production Updates">Book Status & Production</option>
                      <option value="General Inquiry">General Inquiry</option>
                    </CustomSelect>
                  </div>

                  {/* Priority Override */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Priority Override
                    </label>
                    <CustomSelect
                      value={priorityOverride}
                      onChange={(e) => setPriorityOverride(e.target.value)}
                      className="w-full text-xs"
                    >
                      <option value="">Keep AI: {ticket.aiPriority}</option>
                      <option value="CRITICAL">CRITICAL</option>
                      <option value="HIGH">HIGH</option>
                      <option value="MEDIUM">MEDIUM</option>
                      <option value="LOW">LOW</option>
                    </CustomSelect>
                  </div>
                </div>

                {/* Assigned Admin Dropdown */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Assigned Admin
                  </label>
                  <CustomSelect
                    value={assignedAdminVal}
                    onChange={(e) => setAssignedAdminVal(e.target.value)}
                    className="w-full text-xs"
                  >
                    <option value="">Unassigned</option>
                    {admins.map((adm) => (
                      <option key={adm.id} value={adm.id}>
                        {adm.name} ({adm.email})
                      </option>
                    ))}
                  </CustomSelect>
                </div>

                <div className="pt-1 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveOverrides}
                    disabled={savingOverrides}
                    className="px-4 py-2 rounded-lg bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                  >
                    {savingOverrides ? 'Saving...' : 'Save Overrides'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* AI-Drafted Response Workspace */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  AI-Assisted Public Response Draft
                </h3>
                <p className="text-xs text-slate-500">
                  Grounded in BookLeaf policies (80/20 royalty split, quarterly payouts, reprint warranty). Review & edit before sending.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateDraft}
                disabled={generatingDraft}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-amber-50 border border-amber-200 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
              >
                <Sparkles className={`w-3.5 h-3.5 ${generatingDraft ? 'animate-spin' : 'text-amber-600'}`} />
                {generatingDraft ? 'Generating Draft...' : 'Generate / Regenerate Draft'}
              </button>
            </div>

            <form onSubmit={handleSendPublicReply} className="space-y-3">
              <textarea
                rows={8}
                value={draftContent}
                onChange={(e) => setDraftContent(e.target.value)}
                placeholder="Click 'Generate Draft' above to draft an AI policy-grounded response, or write a custom reply to the author..."
                className="w-full text-xs border border-slate-200 rounded-xl p-3.5 focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <span className="text-[11px] text-slate-400">
                  Sending this message makes it visible to the author and automatically transitions ticket to IN_PROGRESS.
                </span>
                <button
                  type="submit"
                  disabled={sendingPublicReply || !draftContent.trim()}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {sendingPublicReply ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Sending to Author...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Approve & Send to Author</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Private Internal Notes Section (STRICTLY ADMIN ONLY) */}
          <div className="bg-slate-50/80 rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-purple-600" />
                <h3 className="text-sm font-bold text-slate-900">Private Internal Operations Notes</h3>
              </div>
              <span className="text-[11px] font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">
                Admin Eyes Only (Never Exposed to Author)
              </span>
            </div>

            {/* Notes List */}
            {internalNotes.length > 0 ? (
              <div className="space-y-2.5">
                {internalNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-2xs text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <strong className="text-slate-800 font-semibold">{note.adminName}</strong>
                      <span>{formatDateTime(note.createdAt)}</span>
                    </div>
                    <p className="text-slate-800 leading-relaxed">{note.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">
                No internal notes recorded for this ticket yet.
              </p>
            )}

            {/* Add Note Form */}
            <form onSubmit={handleAddInternalNote} className="space-y-2 pt-2">
              <input
                type="text"
                required
                value={newNoteContent}
                onChange={(e) => setNewNoteContent(e.target.value)}
                placeholder="Add confidential internal note (e.g. escalated to Repro India, waiting on Delhi warehouse report)..."
                className="w-full text-xs border border-slate-200 rounded-lg p-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={submittingNote || !newNoteContent.trim()}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-semibold shadow-2xs disabled:opacity-50"
                >
                  {submittingNote ? 'Saving...' : 'Add Private Note'}
                </button>
              </div>
            </form>
          </div>

          {/* Chronological Public Conversation History */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <LifeBuoy className="w-4 h-4 text-brand-600" />
              Public Author Conversation ({messages.length})
            </h3>

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
                        <span className="text-xs font-bold text-slate-900">{msg.senderName}</span>
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
        </main>
      </div>
    </div>
  );
}
