'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  BookOpen,
  LifeBuoy,
  PlusCircle,
  Inbox,
  ShieldCheck,
  FileText,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const authorNav = [
    { name: 'Dashboard', href: '/author/dashboard', icon: LayoutDashboard },
    { name: 'My Books', href: '/author/books', icon: BookOpen },
    { name: 'My Tickets', href: '/author/tickets', icon: LifeBuoy },
    { name: 'Raise Ticket', href: '/author/tickets/new', icon: PlusCircle },
  ];

  const adminNav = [
    { name: 'Ops Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Ticket Queue', href: '/admin/tickets', icon: Inbox },
    { name: 'Knowledge Base', href: '/admin/knowledge-base', icon: FileText },
  ];

  const links = user.role === 'ADMIN' ? adminNav : authorNav;

  return (
    <aside className="w-64 shrink-0 bg-white border-r border-slate-200 hidden md:flex flex-col justify-between p-4 min-h-[calc(100vh-4rem)]">
      <div className="space-y-6">
        <div>
          <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
            {user.role === 'ADMIN' ? 'Operations Console' : 'Author Workflows'}
          </p>
          <nav className="space-y-1">
            {links.map((item) => {
              const Icon = item.icon;
              const isActive =
                pathname === item.href ||
                (item.href !== '/author/dashboard' &&
                  item.href !== '/admin/dashboard' &&
                  pathname.startsWith(item.href));

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-brand-50 text-brand-900 font-semibold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  )}
                >
                  <Icon
                    className={cn(
                      'w-4 h-4',
                      isActive ? 'text-brand-600' : 'text-slate-400'
                    )}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Informational card */}
        <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-800">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>BookLeaf Policy</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            {user.role === 'ADMIN'
              ? 'AI suggestions are grounded strictly in the 80/20 royalty split, 48h ISBN SLA, and Delhi warehouse reprint policy.'
              : 'Royalties calculated quarterly. Minimum ₹1,000 threshold for automatic bank disbursement.'}
          </p>
        </div>
      </div>

      {/* Author/Admin Info footer */}
      <div className="pt-4 border-t border-slate-100 px-2">
        <p className="text-[11px] text-slate-400 font-medium">Logged in as</p>
        <p className="text-xs font-semibold text-slate-800 truncate">{user.name}</p>
        <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
      </div>
    </aside>
  );
}
