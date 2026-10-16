import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { TicketPriority, TicketStatus } from '../types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatINR(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
}

export function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getPriorityBadge(priority: TicketPriority) {
  switch (priority) {
    case 'CRITICAL':
      return {
        label: 'Critical',
        bg: 'bg-red-50 text-red-700 border-red-200',
        dot: 'bg-red-500',
      };
    case 'HIGH':
      return {
        label: 'High',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'MEDIUM':
      return {
        label: 'Medium',
        bg: 'bg-blue-50 text-blue-700 border-blue-200',
        dot: 'bg-blue-500',
      };
    case 'LOW':
      return {
        label: 'Low',
        bg: 'bg-slate-50 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };
    default:
      return {
        label: priority,
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function getStatusBadge(status: TicketStatus) {
  switch (status) {
    case 'OPEN':
      return {
        label: 'Open',
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
      };
    case 'IN_PROGRESS':
      return {
        label: 'In Progress',
        bg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        dot: 'bg-indigo-500',
      };
    case 'RESOLVED':
      return {
        label: 'Resolved',
        bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        dot: 'bg-emerald-500',
      };
    case 'CLOSED':
      return {
        label: 'Closed',
        bg: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
      };
    default:
      return {
        label: status,
        bg: 'bg-slate-50 text-slate-700 border-slate-200',
        dot: 'bg-slate-400',
      };
  }
}

export function getCategoryBadge(category: string) {
  switch (category) {
    case 'Royalty & Payments':
      return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    case 'ISBN & Metadata Issues':
      return 'bg-purple-50 text-purple-800 border-purple-200';
    case 'Printing & Quality':
      return 'bg-rose-50 text-rose-800 border-rose-200';
    case 'Distribution & Availability':
      return 'bg-sky-50 text-sky-800 border-sky-200';
    case 'Book Status & Production Updates':
      return 'bg-amber-50 text-amber-800 border-amber-200';
    default:
      return 'bg-slate-100 text-slate-700 border-slate-200';
  }
}
