'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { Badge } from '@/components/ui/Badge';
import { fetchApi } from '@/lib/api';
import { formatINR, formatDate } from '@/lib/utils';
import { Book } from '@/types';
import {
  BookOpen,
  Search,
  PlusCircle,
  ExternalLink,
  Printer,
  ShoppingBag,
  HelpCircle,
} from 'lucide-react';
import { CustomSelect } from '@/components/ui/CustomSelect';

export default function AuthorBooksPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const res = await fetchApi('/author/books');
      if (res?.success && res?.data) {
        setBooks(res.data);
      }
    } catch (err) {
      console.error('Failed to load books:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.role === 'AUTHOR') {
      loadBooks();
    }
  }, [user]);

  const filteredBooks = books.filter((b) => {
    const matchesSearch =
      b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (b.isbn && b.isbn.toLowerCase().includes(searchTerm.toLowerCase())) ||
      b.genre.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' ||
      (statusFilter === 'PUBLISHED' && b.status === 'Published & Live') ||
      (statusFilter === 'IN_PRODUCTION' && b.status.startsWith('In Production'));

    return matchesSearch && matchesStatus;
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
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Books</h1>
              <p className="text-xs text-slate-500 mt-1">
                Catalog of your registered manuscripts, ISBN assignments, sales, and distribution channels.
              </p>
            </div>
            <Link
              href="/author/tickets/new"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-sm transition-colors"
            >
              <HelpCircle className="w-4 h-4 text-brand-600" />
              Query Regarding a Book
            </Link>
          </div>

          {/* Search & Filter Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by title, genre, or ISBN..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-slate-500 font-medium shrink-0">Status:</span>
              <CustomSelect
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs min-w-[170px]"
              >
                <option value="ALL">All Titles ({books.length})</option>
                <option value="PUBLISHED">Published & Live</option>
                <option value="IN_PRODUCTION">In Production</option>
              </CustomSelect>
            </div>
          </div>

          {/* Books List Cards */}
          {loading ? (
            <div className="space-y-4">
              {[1, 2].map((i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 p-6 animate-pulse space-y-4">
                  <div className="h-5 bg-slate-200 rounded w-1/3" />
                  <div className="h-4 bg-slate-200 rounded w-1/4" />
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                    <div className="h-10 bg-slate-100 rounded" />
                    <div className="h-10 bg-slate-100 rounded" />
                    <div className="h-10 bg-slate-100 rounded" />
                    <div className="h-10 bg-slate-100 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredBooks.length > 0 ? (
            <div className="space-y-4">
              {filteredBooks.map((b) => (
                <div
                  key={b._id}
                  className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-shadow space-y-5"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <span className="text-xs font-mono font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-100">
                          {b.book_id}
                        </span>
                        <h2 className="text-lg font-bold text-slate-900">{b.title}</h2>
                        <span
                          className={`text-xs font-medium px-2.5 py-0.5 rounded-full border ${
                            b.status === 'Published & Live'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-800 border-amber-200'
                          }`}
                        >
                          {b.status}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-slate-500">
                        <span>Genre: <strong className="text-slate-700 font-medium">{b.genre}</strong></span>
                        <span>•</span>
                        <span>
                          ISBN:{' '}
                          <strong className="text-slate-700 font-mono font-medium">
                            {b.isbn || 'Pending Assignment'}
                          </strong>
                        </span>
                        <span>•</span>
                        <span>
                          Published:{' '}
                          <strong className="text-slate-700 font-medium">
                            {b.publication_date ? formatDate(b.publication_date) : 'In Production'}
                          </strong>
                        </span>
                      </div>
                    </div>

                    <Link
                      href={`/author/tickets/new?bookId=${b.book_id}`}
                      className="text-xs font-semibold text-brand-700 hover:text-brand-900 border border-slate-200 hover:border-brand-300 px-3 py-1.5 rounded-lg transition-colors inline-flex items-center gap-1.5 self-start shrink-0"
                    >
                      <HelpCircle className="w-3.5 h-3.5" />
                      Ask About This Book
                    </Link>
                  </div>

                  {/* Financial & Distribution Metrics Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 pt-4 border-t border-slate-100 bg-slate-50/50 p-4 rounded-xl">
                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">MRP</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {b.mrp !== null ? `₹${b.mrp}` : '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Royalty / Copy</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {b.author_royalty_per_copy !== null ? `₹${b.author_royalty_per_copy}` : '—'}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Copies Sold</p>
                      <p className="text-sm font-bold text-slate-800 mt-0.5">
                        {b.total_copies_sold.toLocaleString('en-IN')}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Earned Royalty</p>
                      <p className="text-sm font-bold text-emerald-700 mt-0.5">
                        {formatINR(b.total_royalty_earned)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Royalty Paid</p>
                      <p className="text-sm font-bold text-slate-700 mt-0.5">
                        {formatINR(b.royalty_paid)}
                      </p>
                    </div>

                    <div>
                      <p className="text-[10px] uppercase font-semibold text-slate-400">Royalty Pending</p>
                      <p className="text-sm font-bold text-amber-700 mt-0.5">
                        {formatINR(b.royalty_pending)}
                      </p>
                    </div>
                  </div>

                  {/* Print Partner & Available Platforms Footer */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <Printer className="w-3.5 h-3.5 text-slate-400" />
                      <span>
                        Print Partner:{' '}
                        <strong className="text-slate-700 font-medium">
                          {b.print_partner || 'Pending Production Assignment'}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                      <span className="font-medium text-slate-600">Available Channels:</span>
                      {b.available_on && b.available_on.length > 0 ? (
                        b.available_on.map((channel) => (
                          <span
                            key={channel}
                            className="bg-white border border-slate-200 text-slate-700 text-[11px] px-2 py-0.5 rounded shadow-2xs font-medium"
                          >
                            {channel}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">
                          Distribution setup in progress
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-slate-800">No matching books found</h3>
              <p className="text-xs text-slate-500 mt-1">
                Try adjusting your search query or status filter.
              </p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
