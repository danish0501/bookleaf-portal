import { GoogleGenAI } from '@google/genai';
import { z } from 'zod';
import { env } from '../config/env.js';
import { BOOKLEAF_KNOWLEDGE_BASE } from '../config/knowledgeBase.js';
import {
  TicketCategory,
  TicketPriority,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  IAIClassificationResult,
} from '../types/index.js';

// Zod validation schema for Gemini JSON output
const aiClassificationSchema = z.object({
  category: z.enum(TICKET_CATEGORIES as [string, ...string[]]),
  priority: z.enum(TICKET_PRIORITIES as [string, ...string[]]),
  confidence: z.number().min(0).max(1).default(0.85),
  reasoning: z.string().min(5).max(300),
});

export class AIService {
  private client: GoogleGenAI | null = null;
  private hasApiKey: boolean = false;

  constructor() {
    if (env.GEMINI_API_KEY && env.GEMINI_API_KEY.trim() !== '') {
      try {
        this.client = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
        this.hasApiKey = true;
        console.log(`[AIService] Initialized Google Gemini client with model: ${env.GEMINI_MODEL}`);
      } catch (err) {
        console.warn('[AIService] Failed to initialize GoogleGenAI client, fallback engine will be used:', err);
        this.client = null;
        this.hasApiKey = false;
      }
    } else {
      console.log('[AIService] No GEMINI_API_KEY configured. Utilizing BookLeaf Knowledge Base Heuristics Engine.');
    }
  }

  public isLiveAIAvailable(): boolean {
    return this.hasApiKey && this.client !== null;
  }

  /**
   * Classifies ticket category and assesses priority score.
   */
  public async classifyTicket(
    subject: string,
    description: string,
    bookContext?: {
      title?: string;
      status?: string;
      total_copies_sold?: number;
      royalty_pending?: number;
      isbn?: string | null;
    }
  ): Promise<IAIClassificationResult> {
    if (!this.isLiveAIAvailable() || !this.client) {
      return this.fallbackClassification(subject, description, bookContext);
    }

    try {
      const prompt = `
You are the AI Support Intelligence Engine for BookLeaf Publishing.
Analyze the following author support query and classify it into EXACTLY ONE category and assign an operational priority.

Permitted Categories:
1. "Royalty & Payments" (payouts, quarterly cycles, net profit, threshold ₹1,000, bank transfers, statements)
2. "ISBN & Metadata Issues" (duplicate ISBN, wrong book linked, barcode errors, title/author metadata updates)
3. "Printing & Quality" (misprints, page misalignment, binding issues, cover finish, paper quality, author copy orders)
4. "Distribution & Availability" (Amazon/Flipkart listing, stock status "Currently Unavailable", global distribution)
5. "Book Status & Production Updates" (manuscript received, cover design, typesetting, proofreading, delays)
6. "General Inquiry" (marketing questions, author bio updates, general policies, package queries)

Permitted Priorities:
- "CRITICAL": Duplicate/incorrect ISBN blocking sales, repeated overdue royalties past payout window with large balance, severe printing defects on full batch.
- "HIGH": Book showing "Currently Unavailable" on retail platforms, first-time report of physical defect, ISBN data error.
- "MEDIUM": Routine royalty inquiry, payout timeline question, production stage status update, typesetting feedback.
- "LOW": General inquiries, author profile/bio questions, informational questions without financial or print impact.

Author Query:
Subject: "${subject}"
Description: "${description}"
${bookContext ? `Related Book: Title="${bookContext.title || 'N/A'}", Status="${bookContext.status || 'N/A'}", Copies Sold=${bookContext.total_copies_sold ?? 'N/A'}, Pending Royalty=₹${bookContext.royalty_pending ?? 'N/A'}` : 'Query Type: General / Account-Level (No book linked)'}

Instructions:
Respond ONLY with a valid JSON object with no markdown formatting and no extra text:
{
  "category": "Exact category string from the 6 permitted categories",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief 1-2 sentence explanation of your decision"
}
`;

      const response = await this.client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
      });

      const responseText = response.text || '';
      const cleanJson = responseText
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      const parsed = JSON.parse(cleanJson);
      const validated = aiClassificationSchema.parse(parsed);

      return {
        category: validated.category as TicketCategory,
        priority: validated.priority as TicketPriority,
        confidence: Number(validated.confidence.toFixed(2)),
        reasoning: validated.reasoning,
        isFallback: false,
      };
    } catch (error) {
      console.warn('[AIService] Gemini API call or validation failed, applying fallback engine:', (error as Error).message);
      return this.fallbackClassification(subject, description, bookContext);
    }
  }

  /**
   * Generates a grounded, empathetic support draft for the admin to review and edit.
   */
  public async generateDraftResponse(
    ticket: {
      subject: string;
      description: string;
      category: TicketCategory;
      priority: TicketPriority;
    },
    author: {
      name: string;
      email: string;
      city?: string;
      joined_date?: string;
    },
    book?: {
      title?: string;
      status?: string;
      isbn?: string | null;
      mrp?: number | null;
      author_royalty_per_copy?: number | null;
      total_copies_sold?: number;
      total_royalty_earned?: number;
      royalty_paid?: number;
      royalty_pending?: number;
      last_royalty_payout_date?: string | null;
      print_partner?: string | null;
      available_on?: string[];
    } | null,
    conversationHistory?: Array<{ senderRole: string; senderName: string; content: string }>
  ): Promise<string> {
    if (!this.isLiveAIAvailable() || !this.client) {
      return this.fallbackDraftResponse(ticket, author, book);
    }

    try {
      const recentMessages = (conversationHistory || [])
        .slice(-4)
        .map((m) => `[${m.senderRole} - ${m.senderName}]: ${m.content}`)
        .join('\n');

      const prompt = `
You are the Senior Author Support Lead at BookLeaf Publishing.
Draft a professional, empathetic, and highly accurate email response for an admin to send to the author.

AUTHOR PROFILE:
- Name: ${author.name}
- Email: ${author.email}
- City: ${author.city || 'India'}
- Member Since: ${author.joined_date || 'N/A'}

BOOK CONTEXT:
${
  book
    ? `- Title: "${book.title}"
- ISBN: ${book.isbn || 'Pending Assignment'}
- Current Status: ${book.status}
- MRP: ${book.mrp ? `₹${book.mrp}` : 'Not set'}
- Author Royalty per Copy: ${book.author_royalty_per_copy ? `₹${book.author_royalty_per_copy}` : 'N/A'}
- Total Copies Sold: ${book.total_copies_sold ?? 0}
- Total Royalty Earned: ₹${book.total_royalty_earned ?? 0}
- Royalty Already Paid: ₹${book.royalty_paid ?? 0}
- Royalty Pending: ₹${book.royalty_pending ?? 0}
- Last Payout Date: ${book.last_royalty_payout_date || 'No payouts yet'}
- Print Partner: ${book.print_partner || 'In-House (Delhi)'}
- Platforms: ${(book.available_on || []).join(', ') || 'Catalog setup in progress'}`
    : '- General Account Level Query (No specific book attached)'
}

TICKET DETAILS:
- Subject: "${ticket.subject}"
- Query: "${ticket.description}"
- Category: ${ticket.category}
- Priority: ${ticket.priority}

${recentMessages ? `RECENT CONVERSATION HISTORY:\n${recentMessages}\n` : ''}

AUTHORITATIVE BOOKLEAF POLICIES & KNOWLEDGE BASE:
${BOOKLEAF_KNOWLEDGE_BASE}

STRICT COMMUNICATION GUIDELINES:
1. Address the author warmly by first name (${author.name.split(' ')[0]}).
2. Acknowledge and validate their specific concern immediately before explaining procedures.
3. Be specific: Quote exact book title, copies sold, royalty amounts, and status where relevant.
4. If it's a royalty question: Explain the quarterly cycle (paid within 45 days after quarter end) and ₹1,000 threshold.
5. If it's an ISBN error: Treat with high urgency, own the data correction, and commit to a 48-hour escalation.
6. If it's a print defect: Apologize sincerely, confirm that verified defects qualify for a 100% free reprint, and ask for clear photos.
7. If it's a distribution availability issue: Explain distributor stock sync and confirm a 24-48 hour catalog re-sync.
8. If it's a production timeline question: Explain the current stage and give realistic next steps.
9. NEVER claim an action has already taken place (such as refund already processed or re-sync already completed) unless explicitly noted in the records.
10. End with a clear next step and a professional sign-off ("Warm regards,\nBookLeaf Author Support Team").

Draft the message now:
`;

      const response = await this.client.models.generateContent({
        model: env.GEMINI_MODEL,
        contents: prompt,
      });

      const draft = response.text?.trim();
      if (!draft || draft.length < 20) {
        throw new Error('Received empty draft from Gemini API');
      }

      return draft;
    } catch (error) {
      console.warn('[AIService] Failed to generate AI draft via Gemini, falling back to Knowledge Base generator:', (error as Error).message);
      return this.fallbackDraftResponse(ticket, author, book);
    }
  }

  /**
   * Deterministic rule-based fallback classification when Gemini is unavailable.
   */
  public fallbackClassification(
    subject: string,
    description: string,
    bookContext?: any
  ): IAIClassificationResult {
    const text = `${subject} ${description}`.toLowerCase();

    // 1. ISBN & Metadata
    if (/(isbn|imprint|barcode|metadata|wrong book|duplicate isbn)/i.test(text)) {
      return {
        category: 'ISBN & Metadata Issues',
        priority: /(duplicate|wrong|mismatch|error)/i.test(text) ? 'HIGH' : 'MEDIUM',
        confidence: 0.88,
        reasoning: 'Fallback Rule: Detected ISBN or metadata keywords. Prioritized based on data integrity impact.',
        isFallback: true,
      };
    }

    // 2. Printing & Quality
    if (/(print|binding|misprint|blurry|page|paper|defective|damaged|quality|bleed|cover cut)/i.test(text)) {
      return {
        category: 'Printing & Quality',
        priority: /(defective|terrible|misaligned|blurry|unusable|torn)/i.test(text) ? 'HIGH' : 'MEDIUM',
        confidence: 0.9,
        reasoning: 'Fallback Rule: Detected physical print or binding quality keywords.',
        isFallback: true,
      };
    }

    // 3. Distribution & Availability
    if (/(unavailable|out of stock|amazon|flipkart|listing|live|distribut|not showing|buy link)/i.test(text)) {
      return {
        category: 'Distribution & Availability',
        priority: /(unavailable|out of stock|can't buy|missing)/i.test(text) ? 'HIGH' : 'MEDIUM',
        confidence: 0.89,
        reasoning: 'Fallback Rule: Query relates to commercial distribution or platform retail availability.',
        isFallback: true,
      };
    }

    // 4. Royalty & Payments
    if (/(royalt|payment|payout|bank|threshold|earning|unpaid|net profit|quarter|statement|sales money)/i.test(text)) {
      const isUrgent = /(haven't received|months|delayed|overdue|where is my|zero|why low)/i.test(text);
      return {
        category: 'Royalty & Payments',
        priority: isUrgent ? 'HIGH' : 'MEDIUM',
        confidence: 0.92,
        reasoning: 'Fallback Rule: Author is inquiring regarding royalties, payments, or sales reconciliation.',
        isFallback: true,
      };
    }

    // 5. Book Status & Production Updates
    if (/(typeset|proofread|manuscript|production stage|in production|status of my book|cover design|when will it be published)/i.test(text)) {
      return {
        category: 'Book Status & Production Updates',
        priority: 'MEDIUM',
        confidence: 0.86,
        reasoning: 'Fallback Rule: Identified manuscript processing or production pipeline milestone query.',
        isFallback: true,
      };
    }

    // 6. Default General Inquiry
    return {
      category: 'General Inquiry',
      priority: 'LOW',
      confidence: 0.75,
      reasoning: 'Fallback Rule: General account or publishing information query.',
      isFallback: true,
    };
  }

  /**
   * Deterministic knowledge-base grounded draft template when Gemini API is unavailable.
   */
  public fallbackDraftResponse(
    ticket: { subject: string; description: string; category: TicketCategory },
    author: { name: string },
    book?: any
  ): string {
    const firstName = author.name.split(' ')[0] || author.name;
    const bookTitle = book?.title ? `"${book.title}"` : 'your account';

    switch (ticket.category) {
      case 'Royalty & Payments': {
        const pending = book?.royalty_pending ?? 0;
        const totalSold = book?.total_copies_sold ?? 0;
        return `Dear ${firstName},

Thank you for reaching out to BookLeaf Author Support regarding royalties for ${bookTitle}.

Under BookLeaf's 80/20 royalty policy, authors receive 80% of net profits (MRP minus printing costs, distributor fees, and shipping). Royalties are reconciled on a quarterly calendar basis and paid within 45 days after the quarter closes.

Our records indicate:
- Total copies sold to date: ${totalSold}
- Pending royalty balance: ₹${pending.toLocaleString('en-IN')}
${pending < 1000 ? `- Note: The minimum disbursement threshold is ₹1,000. Balances under ₹1,000 securely roll forward to the next quarter.\n` : `- Your pending balance meets the ₹1,000 threshold and is queued for processing in the upcoming quarterly payout window.\n`}
Please confirm that your bank account details are linked in your author dashboard so the transfer can proceed smoothly.

Warm regards,
BookLeaf Author Support Team`;
      }

      case 'Distribution & Availability':
        return `Dear ${firstName},

Thank you for bringing the availability of ${bookTitle} to our attention.

When a published book appears as "Currently Unavailable" on Amazon or Flipkart, it typically indicates a stock synchronization refresh cycle between our Delhi distribution hub and the marketplace API.

We are flagging this to our distribution operations team to trigger a manual catalog re-sync. These re-sync updates typically resolve marketplace availability within 24–48 hours.

We will keep you updated once the listing status reflects active stock.

Warm regards,
BookLeaf Author Support Team`;

      case 'Printing & Quality':
        return `Dear ${firstName},

Please accept our sincere apologies for the print quality issues you encountered with your copies of ${bookTitle}. We hold our physical production standards to the highest caliber.

BookLeaf guarantees a 100% free reprint for verified defects, including misprints, binding issues, text blurriness, and page misalignments.

To help our production team expedite your reprint:
1. Please reply to this ticket or share clear photos of the defective copies showing the defect and the copyright page.
2. Confirm the number of defective copies received.

Upon photo verification, our print facility in Delhi will prioritize a replacement batch with standard 5–7 business days turnaround.

Warm regards,
BookLeaf Author Support Team`;

      case 'ISBN & Metadata Issues':
        return `Dear ${firstName},

Thank you for flagging this ISBN/metadata inquiry regarding ${bookTitle}.

We treat any ISBN link or catalog metadata discrepancy with high operational priority. Every title published through BookLeaf receives a unique ISBN registered under the BookLeaf publisher imprint.

Our catalog team is investigating this issue directly with the National ISBN Agency and retail marketplace metadata feeds. We anticipate resolving this discrepancy within 48 hours.

Warm regards,
BookLeaf Author Support Team`;

      case 'Book Status & Production Updates':
        return `Dear ${firstName},

Thank you for reaching out regarding the production timeline of ${bookTitle}.

${book?.status ? `Your book is currently in the "${book.status}" stage of our publishing pipeline.` : 'Your book is actively progressing through our production pipeline.'}

Our production workflow progresses through Manuscript Review → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup. Stages requiring author sign-off (such as cover approvals and proof reviews) will be delivered directly to your registered email.

Our production team is reviewing your file and will share an updated milestone delivery date within 2 business days.

Warm regards,
BookLeaf Author Support Team`;

      default:
        return `Dear ${firstName},

Thank you for contacting BookLeaf Author Support.

We have received your query regarding "${ticket.subject}" and our team is reviewing the details. We are committed to supporting our author partners and will provide a comprehensive answer within 24–48 business hours.

If there is any additional context you would like to provide in the meantime, please feel free to reply directly to this ticket.

Warm regards,
BookLeaf Author Support Team`;
    }
  }
}

export const aiService = new AIService();
