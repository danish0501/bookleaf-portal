'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { fetchApi } from '@/lib/api';
import { Book } from '@/types';
import {
  LifeBuoy,
  Paperclip,
  Send,
  AlertCircle,
  Sparkles,
  Info,
  ArrowLeft,
  CheckCircle2,
} from 'lucide-react';
import Link from 'next/link';
import { CustomSelect } from '@/components/ui/CustomSelect';

function SubmitQueryForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedBookId = searchParams.get('bookId');

  const { user, loading: authLoading } = useAuth();
  const toast = useToast();

  const [books, setBooks] = useState<Book[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>(preselectedBookId || 'GENERAL');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const res = await fetchApi('/author/books');
        if (res?.success && res?.data) {
          setBooks(res.data);
          if (preselectedBookId) {
            const found = res.data.find(
              (b: Book) => b.book_id === preselectedBookId || b._id === preselectedBookId
            );
            if (found) setSelectedBookId(found._id);
          }
        }
      } catch (err) {
        console.error('Failed to load author books for dropdown', err);
      }
    };

    if (user && user.role === 'AUTHOR') {
      loadBooks();
    }
  }, [user, preselectedBookId]);

  const handleSimulatedAttachment = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachmentName(e.target.files[0].name);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (subject.trim().length < 5) {
      setErrorMessage('Subject must be at least 5 characters long.');
      return;
    }

    if (description.trim().length < 10) {
      setErrorMessage('Please provide a detailed description (at least 10 characters).');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        bookId: selectedBookId === 'GENERAL' ? null : selectedBookId,
        subject: subject.trim(),
        description: description.trim(),
        attachmentName: attachmentName,
      };

      const res = await fetchApi('/author/tickets', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (res?.success && res?.data) {
        toast.success(`Support ticket ${res.data.ticket_id} created successfully!`);
        router.push(`/author/tickets/${res.data.ticket_id}`);
      } else {
        setErrorMessage(res?.error || 'Failed to submit support ticket.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while submitting your ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-3xl">
          {/* Back link */}
          <Link
            href="/author/tickets"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to My Tickets
          </Link>

          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Submit a Support Query</h1>
            <p className="text-xs text-slate-500 mt-1">
              Connect directly with BookLeaf Operations regarding royalties, print quality, distribution, or publishing updates.
            </p>
          </div>

          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Book Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Select Associated Title
                </label>
                <p className="text-[11px] text-slate-500 mb-1.5">
                  Select the specific book this issue concerns, or General / Account Level.
                </p>
                <CustomSelect
                  value={selectedBookId}
                  onChange={(e) => setSelectedBookId(e.target.value)}
                  className="w-full text-xs"
                >
                  <option value="GENERAL">General / Account Level (No specific title)</option>
                  {books.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.title} ({b.book_id} • {b.status})
                    </option>
                  ))}
                </CustomSelect>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Subject Line <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question regarding Amazon stock availability or Q4 royalty statement"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Detailed Query Description <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={6}
                  placeholder="Please provide full details, including any dates, defect descriptions, marketplace links, or quantities..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 w-full text-xs border border-slate-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans"
                />
              </div>

              {/* Attachment UI (Simulation Disclaimer per Assignment) */}
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  Attachment (Optional)
                </label>
                <div className="mt-1.5 p-3.5 rounded-xl border border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-center">
                  <Paperclip className="w-5 h-5 text-slate-400 mb-1" />
                  <p className="text-xs text-slate-600 font-medium">
                    {attachmentName ? (
                      <span className="text-brand-700 font-semibold">{attachmentName}</span>
                    ) : (
                      'Attach screenshot, photo of defective copy, or royalty document'
                    )}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <label className="cursor-pointer text-xs font-medium text-brand-700 hover:text-brand-800 bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs hover:bg-slate-50 transition-colors">
                      Choose File
                      <input
                        type="file"
                        onChange={handleSimulatedAttachment}
                        className="hidden"
                      />
                    </label>
                    {attachmentName && (
                      <button
                        type="button"
                        onClick={() => setAttachmentName(null)}
                        className="text-xs text-slate-400 hover:text-slate-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-2">
                    <Info className="w-3 h-3 inline mr-1 text-slate-400" />
                    UI preview: File metadata simulated for evaluation assignment requirements.
                  </p>
                </div>
              </div>

              {/* AI Auto-Processing Note */}
              <div className="p-3.5 rounded-xl bg-brand-50/70 border border-brand-100 flex items-start gap-2.5 text-xs text-brand-900">
                <Sparkles className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  Upon submission, your query is analyzed and auto-classified using BookLeaf AI intelligence to ensure it reaches the right department and receives the appropriate operational priority.
                </p>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-900 hover:bg-brand-800 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      <span>Classifying & Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Support Ticket</span>
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

export default function SubmitQueryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-50 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-brand-300 border-t-brand-700 rounded-full animate-spin" />
        </div>
      }
    >
      <SubmitQueryForm />
    </Suspense>
  );
}

