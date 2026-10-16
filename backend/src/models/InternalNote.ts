import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IInternalNoteDocument extends Document {
  ticket: Types.ObjectId;
  admin: Types.ObjectId;
  adminName: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const InternalNoteSchema = new Schema<IInternalNoteDocument>(
  {
    ticket: {
      type: Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    admin: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    adminName: {
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

export const InternalNote = mongoose.models.InternalNote || mongoose.model<IInternalNoteDocument>('InternalNote', InternalNoteSchema);
