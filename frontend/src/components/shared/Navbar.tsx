'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { BookOpen, LogOut, User as UserIcon, Shield, ChevronDown, Sparkles } from 'lucide-react';
import { Badge } from '../ui/Badge';

export function Navbar() {
  const { user, logout, login } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSwitchModal, setShowSwitchModal] = useState(false);

  const demoAccounts = [
    { name: 'Admin (Operations)', email: 'admin@bookleaf.com', role: 'ADMIN', desc: 'Full operations dashboard, ticket queue, AI drafting' },
    { name: 'Priya Sharma (AUTH001)', email: 'priya.sharma@email.com', role: 'AUTHOR', desc: '2 published books, ₹3,570 pending royalty' },
    { name: 'Rohit Kapoor (AUTH002)', email: 'rohit.kapoor@email.com', role: 'AUTHOR', desc: 'High volume seller (2,079 copies), ₹5,280 pending' },
    { name: 'Sneha Kulkarni (AUTH007)', email: 'sneha.kulkarni@email.com', role: 'AUTHOR', desc: '3 books (1 in production: Cover Design)' },
    { name: 'Arjun Malhotra (AUTH006)', email: 'arjun.malhotra@email.com', role: 'AUTHOR', desc: '1 book, ₹2,464 pending, 1 open support ticket' },
  ];

  const handleQuickSwitch = async (email: string, role: string) => {
    setShowSwitchModal(false);
    const pwd = role === 'ADMIN' ? 'Admin@123' : 'Author@123';
    await login(email, pwd);
    window.location.href = role === 'ADMIN' ? '/admin/dashboard' : '/author/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center gap-3">
          <Link
            href={user?.role === 'ADMIN' ? '/admin/dashboard' : '/author/dashboard'}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-9 h-9 rounded-lg bg-brand-900 text-white flex items-center justify-center shadow-sm group-hover:bg-brand-800 transition-colors">
              <BookOpen className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-lg flex items-center gap-1.5">
                BookLeaf <span className="font-serif italic text-brand-700 font-normal">Publishing</span>
              </span>
            </div>
          </Link>

          {user && (
            <div className="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-slate-200">
              <Badge variant={user.role === 'ADMIN' ? 'purple' : 'info'} dot>
                {user.role === 'ADMIN' ? 'Operations Admin' : 'Author Portal'}
              </Badge>
              {user.author_id && (
                <span className="text-xs font-mono font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                  {user.author_id}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Right side controls */}
        <div className="flex items-center gap-3">
          {/* Quick Demo Switcher for hiring reviewers */}
          <button
            onClick={() => setShowSwitchModal(true)}
            className="hidden md:flex items-center gap-1.5 text-xs font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-3 py-1.5 rounded-lg transition-colors"
            title="Fast switch between author and admin demo accounts"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            Switch Demo Account
          </button>

          {/* User profile dropdown */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className={`flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 rounded-xl border transition-all text-left ${
                  showDropdown
                    ? 'border-brand-500 bg-brand-50/20 ring-2 ring-brand-500/20'
                    : 'border-transparent hover:border-slate-200 hover:bg-slate-100/80'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-semibold text-xs border border-slate-300 shrink-0">
                  {user.name.charAt(0)}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs font-medium text-slate-900 leading-tight">{user.name}</p>
                  <p className="text-[10px] text-slate-500 leading-tight">{user.email}</p>
                </div>
                {/* Down arrow shifted left with mr-1 / pr-3.5 and rotate on open */}
                <ChevronDown
                  className={`w-4 h-4 text-slate-400 transition-transform duration-200 ml-1.5 shrink-0 ${
                    showDropdown ? 'rotate-180 text-brand-600' : ''
                  }`}
                />
              </button>

              {showDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowDropdown(false)}
                  />
                  <div className="absolute right-0 mt-2 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl shadow-slate-200/80 border border-slate-200/90 py-1.5 z-20 animate-in fade-in-0 zoom-in-95 duration-150">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/60 rounded-t-xl">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-900 truncate pr-2">{user.name}</p>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-brand-100 text-brand-800 border border-brand-200/60 shrink-0">
                          {user.role}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate mt-0.5">{user.email}</p>
                      {user.city && (
                        <p className="text-[11px] text-slate-400 font-medium mt-1.5 flex items-center gap-1">
                          <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {user.city}
                        </p>
                      )}
                    </div>

                    <div className="p-1.5 space-y-1">
                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          setShowSwitchModal(true);
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-900 rounded-xl flex items-center gap-2.5 transition-colors group"
                      >
                        <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/60 group-hover:scale-105 transition-transform">
                          <Sparkles className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="leading-tight font-semibold">Switch Demo Persona</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">Quickly change roles or accounts</p>
                        </div>
                      </button>

                      <button
                        onClick={() => {
                          setShowDropdown(false);
                          logout();
                        }}
                        className="w-full text-left px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-xl flex items-center gap-2.5 transition-colors group border-t border-slate-100 pt-2"
                      >
                        <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-200/60 group-hover:scale-105 transition-transform">
                          <LogOut className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <p className="leading-tight font-semibold">Sign Out</p>
                          <p className="text-[10px] text-rose-400 mt-0.5">End active session</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : (
            <Link
              href="/login"
              className="text-xs font-medium bg-brand-900 text-white hover:bg-brand-800 px-4 py-2 rounded-lg transition-colors"
            >
              Sign In
            </Link>
          )}
        </div>
      </div>

      {/* Switch Demo Modal */}
      {showSwitchModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in-50">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <h3 className="text-base font-bold text-slate-900">Switch Demo Account</h3>
              </div>
              <button
                onClick={() => setShowSwitchModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm"
              >
                ✕
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Select an author or admin to test role-based access, book ownership isolation, and live ticket operations.
            </p>
            <div className="mt-4 space-y-2 max-h-80 overflow-y-auto pr-1">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.email}
                  onClick={() => handleQuickSwitch(acc.email, acc.role)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between hover:border-brand-500 hover:bg-brand-50/50 ${
                    user?.email === acc.email
                      ? 'border-brand-500 bg-brand-50/30'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{acc.name}</p>
                      <Badge variant={acc.role === 'ADMIN' ? 'purple' : 'info'}>
                        {acc.role}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">{acc.desc}</p>
                  </div>
                  {user?.email === acc.email && (
                    <span className="text-xs font-semibold text-brand-600">Active</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
