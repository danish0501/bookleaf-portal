export type UserRole = 'AUTHOR' | 'ADMIN';

export type TicketCategory =
  | 'Royalty & Payments'
  | 'ISBN & Metadata Issues'
  | 'Printing & Quality'
  | 'Distribution & Availability'
  | 'Book Status & Production Updates'
  | 'General Inquiry';

export type TicketPriority = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type AIAnalysisStatus = 'SUCCESS' | 'FALLBACK' | 'FAILED' | 'PENDING';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  author_id?: string;
  admin_id?: string;
  phone?: string;
  city?: string;
  joined_date?: string;
}

export interface Book {
  _id: string;
  book_id: string;
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
}

export interface TicketListItem {
  id: string;
  ticket_id: string;
  subject: string;
  status: TicketStatus;
  category: TicketCategory;
  priority: TicketPriority;
  aiCategory?: TicketCategory;
  aiPriority?: TicketPriority;
  overriddenCategory?: TicketCategory | null;
  overriddenPriority?: TicketPriority | null;
  aiAnalysisStatus?: AIAnalysisStatus;
  aiConfidence?: number;
  bookTitle?: string;
  bookId?: string | null;
  author?: {
    id: string;
    name: string;
    email: string;
    author_id?: string;
  };
  book?: {
    id: string;
    title: string;
    book_id: string;
  } | null;
  assignedAdmin?: {
    id: string;
    name: string;
    email: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  senderRole: UserRole;
  senderName: string;
  content: string;
  createdAt: string;
}

export interface InternalNote {
  id: string;
  adminName: string;
  content: string;
  createdAt: string;
}

export interface TicketDetail {
  ticket: {
    id: string;
    ticket_id: string;
    subject: string;
    description: string;
    status: TicketStatus;
    category: TicketCategory;
    priority: TicketPriority;
    aiCategory?: TicketCategory;
    aiPriority?: TicketPriority;
    overriddenCategory?: TicketCategory | null;
    overriddenPriority?: TicketPriority | null;
    aiConfidence?: number;
    aiReasoning?: string;
    aiAnalysisStatus?: AIAnalysisStatus;
    lastDraftResponse?: string | null;
    attachmentName?: string | null;
    createdAt: string;
    updatedAt: string;
    author?: User;
    book?: Book | null;
    assignedAdmin?: {
      _id: string;
      name: string;
      email: string;
      admin_id?: string;
    } | null;
  };
  messages: Message[];
  internalNotes?: InternalNote[];
  admins?: Array<{
    id: string;
    name: string;
    email: string;
    admin_id?: string;
  }>;
}

export interface AuthorDashboardStats {
  stats: {
    totalBooks: number;
    publishedBooks: number;
    inProductionBooks: number;
    totalCopiesSold: number;
    totalRoyaltyEarned: number;
    royaltyPaid: number;
    royaltyPending: number;
  };
  books: Array<{
    id: string;
    book_id: string;
    title: string;
    status: string;
    isbn: string | null;
    totalCopiesSold: number;
    royaltyEarned: number;
    royaltyPending: number;
  }>;
  recentTickets: Array<{
    id: string;
    ticket_id: string;
    subject: string;
    status: TicketStatus;
    category: TicketCategory;
    priority: TicketPriority;
    bookTitle: string;
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface AdminDashboardStats {
  stats: {
    totalTickets: number;
    openTickets: number;
    inProgressTickets: number;
    resolvedTickets: number;
    closedTickets: number;
    criticalAndHighTickets: number;
    criticalTickets: number;
    highTickets: number;
    awaitingResponse: number;
  };
  categoryDistribution: Array<{ name: string; count: number }>;
  priorityDistribution: Array<{ name: string; count: number }>;
  recentTickets: Array<{
    id: string;
    ticket_id: string;
    subject: string;
    status: TicketStatus;
    category: TicketCategory;
    priority: TicketPriority;
    authorName: string;
    bookTitle: string;
    createdAt: string;
  }>;
}
