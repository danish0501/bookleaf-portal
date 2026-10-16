import mongoose, { Schema, Document } from 'mongoose';
import { UserRole } from '../types/index.js';

export interface IUserDocument extends Document {
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

const UserSchema = new Schema<IUserDocument>(
  {
    author_id: {
      type: String,
      sparse: true,
      trim: true,
      index: true,
    },
    admin_id: {
      type: String,
      sparse: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['AUTHOR', 'ADMIN'],
      default: 'AUTHOR',
      required: true,
      index: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    city: {
      type: String,
      trim: true,
    },
    joined_date: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation in hot reloading
export const User = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
