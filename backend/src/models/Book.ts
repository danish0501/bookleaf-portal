import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IBookDocument extends Document {
  book_id: string;
  author: Types.ObjectId;
  author_id: string;
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

const BookSchema = new Schema<IBookDocument>(
  {
    book_id: {
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
    author_id: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    isbn: {
      type: String,
      default: null,
      trim: true,
    },
    genre: {
      type: String,
      required: true,
      trim: true,
    },
    publication_date: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    mrp: {
      type: Number,
      default: null,
    },
    author_royalty_per_copy: {
      type: Number,
      default: null,
    },
    total_copies_sold: {
      type: Number,
      default: 0,
    },
    total_royalty_earned: {
      type: Number,
      default: 0,
    },
    royalty_paid: {
      type: Number,
      default: 0,
    },
    royalty_pending: {
      type: Number,
      default: 0,
    },
    last_royalty_payout_date: {
      type: String,
      default: null,
    },
    print_partner: {
      type: String,
      default: null,
    },
    available_on: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

export const Book = mongoose.models.Book || mongoose.model<IBookDocument>('Book', BookSchema);
