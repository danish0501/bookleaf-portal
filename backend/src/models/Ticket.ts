import mongoose, { Schema, Document, Types } from 'mongoose';
import {
  TicketCategory,
  TicketPriority,
  TicketStatus,
  AIAnalysisStatus,
  TICKET_CATEGORIES,
  TICKET_PRIORITIES,
  TICKET_STATUSES,
} from '../types/index.js';

export interface ITicketDocument extends Document {
  ticket_id: string;
  author: Types.ObjectId;
  book?: Types.ObjectId | null;
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
  assignedAdmin?: Types.ObjectId | null;
  attachmentName?: string | null;
  lastDraftResponse?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const TicketSchema = new Schema<ITicketDocument>(
  {
    ticket_id: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    book: {
      type: Schema.Types.ObjectId,
      ref: 'Book',
      default: null,
      index: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: TICKET_STATUSES,
      default: 'OPEN',
      required: true,
      index: true,
    },
    aiCategory: {
      type: String,
      enum: TICKET_CATEGORIES,
      default: 'General Inquiry',
      required: true,
      index: true,
    },
    aiPriority: {
      type: String,
      enum: TICKET_PRIORITIES,
      default: 'MEDIUM',
      required: true,
      index: true,
    },
    aiConfidence: {
      type: Number,
      default: 0.85,
    },
    aiReasoning: {
      type: String,
      default: '',
    },
    aiAnalysisStatus: {
      type: String,
      enum: ['SUCCESS', 'FALLBACK', 'FAILED', 'PENDING'],
      default: 'PENDING',
      index: true,
    },
    overriddenCategory: {
      type: String,
      enum: [...TICKET_CATEGORIES, null],
      default: null,
    },
    overriddenPriority: {
      type: String,
      enum: [...TICKET_PRIORITIES, null],
      default: null,
    },
    assignedAdmin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    attachmentName: {
      type: String,
      default: null,
    },
    lastDraftResponse: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

TicketSchema.virtual('effectiveCategory').get(function (this: ITicketDocument) {
  return this.overriddenCategory || this.aiCategory;
});

TicketSchema.virtual('effectivePriority').get(function (this: ITicketDocument) {
  return this.overriddenPriority || this.aiPriority;
});

// Composite indexes for queue filtering and sorting
TicketSchema.index({ status: 1, createdAt: -1 });
TicketSchema.index({ author: 1, createdAt: -1 });

export const Ticket = mongoose.models.Ticket || mongoose.model<ITicketDocument>('Ticket', TicketSchema);
