export type UserRole = 'AUTHOR' | 'ADMIN';

export type TicketCategory =
  | 'Royalty & Payments'
  | 'ISBN & Metadata Issues'
  | 'Printing & Quality'
  | 'Distribution & Availability'
  | 'Book Status & Production Updates'
  | 'General Inquiry';

export const TICKET_CATEGORIES: TicketCategory[] = [
  'Royalty & Payments',
  'ISBN & Metadata Issues',
  'Printing & Quality',
  'Distribution & Availability',
  'Book Status & Production Updates',
  'General Inquiry',
];

export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export const TICKET_PRIORITIES: TicketPriority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export const TICKET_STATUSES: TicketStatus[] = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

export type AIAnalysisStatus = 'SUCCESS' | 'FALLBACK' | 'FAILED' | 'PENDING';

export interface IUser {
  _id: string;
  author_id?: string;
  admin_id?: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  phone?: string;
  city?: string;
  joined_date?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface IBook {
  _id: string;
  book_id: string;
  author: string; // User ObjectId
  author_id: string; // AUTH001
  title: string;
  isbn: string | null;
  genre: string;
  publication_date: string | null;
  status: string;
  mrp: number | null;
  author_royalty_per_copy: number | null;
  total_copies_sold: number;
  total_royalty_earned: number;
  royalty_paid: number;
  royalty_pending: number;
  last_royalty_payout_date: string | null;
  print_partner: string | null;
  available_on: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ITicket {
  _id: string;
  ticket_id: string;
  author: string; // User ObjectId
  book?: string | null; // Book ObjectId or null for general
  subject: string;
  description: string;
  status: TicketStatus;
  aiCategory: TicketCategory;
  aiPriority: TicketPriority;
  aiConfidence?: number;
  aiReasoning?: string;
  aiAnalysisStatus: AIAnalysisStatus;
  overriddenCategory?: TicketCategory | null;
  overriddenPriority?: TicketPriority | null;
  effectiveCategory: TicketCategory;
  effectivePriority: TicketPriority;
  assignedAdmin?: string | null; // User ObjectId
  attachmentName?: string | null;
  lastDraftResponse?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IMessage {
  _id: string;
  ticket: string; // Ticket ObjectId
  sender: string; // User ObjectId
  senderRole: UserRole;
  senderName: string;
  content: string;
  createdAt: Date;
}

export interface IInternalNote {
  _id: string;
  ticket: string; // Ticket ObjectId
  admin: string; // User ObjectId
  adminName: string;
  content: string;
  createdAt: Date;
}

export interface IAIClassificationResult {
  category: TicketCategory;
  priority: TicketPriority;
  confidence: number;
  reasoning: string;
  isFallback?: boolean;
}
