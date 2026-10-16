'use client';

import React from 'react';
import { Navbar } from '@/components/shared/Navbar';
import { Sidebar } from '@/components/shared/Sidebar';
import { FileText, ShieldCheck, DollarSign, BookOpen, Printer, ShoppingBag, Layers, MessageSquare } from 'lucide-react';

export default function KnowledgeBasePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        <Sidebar />
        <main className="flex-1 p-6 lg:p-8 space-y-6 overflow-y-auto max-w-5xl">
          <div>
            <div className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-brand-600" />
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                BookLeaf Knowledge Base & Policy Reference
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Authoritative operational guidelines and rules that govern AI draft generation and author resolutions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Royalty Policy */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <DollarSign className="w-5 h-5" />
                <h2 className="text-sm font-bold text-slate-900">Royalty & Payout Policy</h2>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li>• <strong>80/20 Profit Split:</strong> Author receives 80% of net profit; BookLeaf receives 20%.</li>
                <li>• <strong>Net Profit:</strong> MRP minus printing cost, platform commission (Amazon/Flipkart), and shipping.</li>
                <li>• <strong>Quarterly Cycle:</strong> Reconciled quarterly; payouts made within <strong>45 days</strong> following quarter close.</li>
                <li>• <strong>₹1,000 Minimum Threshold:</strong> Amounts below ₹1,000 securely roll over to the subsequent quarter.</li>
                <li>• <strong>Payment Method:</strong> Direct NEFT/IMPS bank transfer to verified author bank account.</li>
              </ul>
            </div>

            {/* ISBN Policy */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-purple-700">
                <BookOpen className="w-5 h-5" />
                <h2 className="text-sm font-bold text-slate-900">ISBN & Imprint Policy</h2>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li>• <strong>Publisher Imprint:</strong> Unique ISBN assigned by BookLeaf registered under BookLeaf Publishing imprint.</li>
                <li>• <strong>Author Imprint:</strong> If author desires their own imprint, they must procure it independently.</li>
                <li>• <strong>ISBN Mismatch/Duplicate:</strong> Classified as <strong>HIGH PRIORITY</strong>. Must be escalated to catalog team for resolution within <strong>48 hours</strong>.</li>
              </ul>
            </div>

            {/* Printing & Quality Policy */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-rose-700">
                <Printer className="w-5 h-5" />
                <h2 className="text-sm font-bold text-slate-900">Printing & Quality SLA</h2>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li>• <strong>Facilities:</strong> In-house printing facility and main warehouse in Delhi. Overflow to Repro India & Epitome Books.</li>
                <li>• <strong>Turnaround:</strong> Standard print turnaround is <strong>5–7 business days</strong> from order confirmation.</li>
                <li>• <strong>Defect Guarantee:</strong> Verified quality issues (misprints, binding defects, blurry print) qualify for <strong>100% free reprint</strong> upon photo verification.</li>
              </ul>
            </div>

            {/* Distribution Policy */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-sky-700">
                <ShoppingBag className="w-5 h-5" />
                <h2 className="text-sm font-bold text-slate-900">Distribution & Availability</h2>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li>• <strong>Channels:</strong> Amazon India, Flipkart, Amazon US, Amazon UK, and BookLeaf Store.</li>
                <li>• <strong>Listing Window:</strong> New titles go live within <strong>7–10 business days</strong> post publication.</li>
                <li>• <strong>"Currently Unavailable":</strong> Indicates distributor inventory feed sync cycle. Ops team triggers manual re-sync taking <strong>24–48 hours</strong>.</li>
              </ul>
            </div>

            {/* Production Stages */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-amber-700">
                <Layers className="w-5 h-5" />
                <h2 className="text-sm font-bold text-slate-900">9-Stage Production Pipeline</h2>
              </div>
              <ol className="text-xs text-slate-600 space-y-1 list-decimal list-inside leading-relaxed">
                <li>Manuscript Received</li>
                <li>Editing (if opted in package)</li>
                <li>Cover Design (waiting on author review/approval)</li>
                <li>Typesetting & Interior Layout</li>
                <li>Proofreading (revision cycles)</li>
                <li>ISBN Assignment & Cataloging</li>
                <li>Proof Printing & Inspection</li>
                <li>Distribution Feeds Setup</li>
                <li>Published & Live</li>
              </ol>
            </div>

            {/* Communication Guidelines */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
              <div className="flex items-center gap-2 text-slate-800">
                <MessageSquare className="w-5 h-5 text-brand-600" />
                <h2 className="text-sm font-bold text-slate-900">Author Communication Standards</h2>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li>• <strong>Partner Mindset:</strong> Treat authors with empathy and respect, not as tickets to close.</li>
                <li>• <strong>Acknowledge First:</strong> Validate author concern before jumping into technical details.</li>
                <li>• <strong>No Hallucinated Actions:</strong> Never claim a reprint, refund, or sync has happened without proof.</li>
                <li>• <strong>Clear Next Step:</strong> Always specify a clear next milestone or timeline for both parties.</li>
              </ul>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
