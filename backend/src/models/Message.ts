import mongoose, { Schema, Document, Types } from 'mongoose';
import { UserRole } from '../types/index.js';

export interface IMessageDocument extends Document {
  ticket: Types.ObjectId;
  sender: Types.ObjectId;
  senderRole: UserRole;
  senderName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessageDocument>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    sender: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    senderRole: {
      type: String,
      enum: ['AUTHOR', 'ADMIN'],
      required: true,
    },
    senderName: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.models.Message || mongoose.model<IMessageDocument>('Message', MessageSchema);
