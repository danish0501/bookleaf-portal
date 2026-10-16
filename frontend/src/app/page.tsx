'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { BookOpen, ShieldCheck, ArrowRight, Sparkles } from 'lucide-react';

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      if (user.role === 'ADMIN') {
        router.push('/admin/dashboard');
      } else {
        router.push('/author/dashboard');
      }
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-3 border-brand-200 border-t-brand-700 rounded-full animate-spin" />
          <p className="text-xs text-slate-500 font-medium">Loading BookLeaf Portal...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-brand-900 text-white flex items-center justify-center shadow-sm">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <span className="font-bold text-slate-900 tracking-tight text-lg">
              BookLeaf <span className="font-serif italic text-brand-700 font-normal">Publishing</span>
            </span>
          </div>
          <Link
            href="/login"
            className="text-xs font-semibold bg-brand-900 text-white hover:bg-brand-800 px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
          >
            Portal Login
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200 text-brand-800 text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5 text-brand-600" />
          <span>Technical Hiring Assignment Evaluation</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
          Author Support & <br className="hidden sm:inline" />
          <span className="text-brand-700 font-serif italic">Communication Portal</span>
        </h1>
        <p className="mt-4 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Full-stack publishing communication suite featuring author book tracking, real-time ticket conversations, and Google Gemini AI-assisted response generation.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="w-full sm:w-auto px-6 py-3 rounded-xl bg-brand-900 hover:bg-brand-800 text-white font-medium text-sm transition-all shadow-sm hover:shadow flex items-center justify-center gap-2"
          >
            Access Portal Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-sm">Author Experience</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Real-time royalty tracking, published vs in-production book management, and responsive support queries.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-sm">Operations Queue</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Prioritized ticket queues, server-side filtering, private internal notes, and administrative overrides.
            </p>
          </div>
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
            <h3 className="font-semibold text-slate-900 text-sm">AI Response Intelligence</h3>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Automated classification into 6 BookLeaf domains, priority scoring, and knowledge-base grounded draft generation.
            </p>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-200 py-6 text-center text-xs text-slate-400">
        BookLeaf Publishing © {new Date().getFullYear()} — Confidential Candidate Submission
      </footer>
    </div>
  );
}
