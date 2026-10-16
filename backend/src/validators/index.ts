import { z } from 'zod';
import { TICKET_CATEGORIES, TICKET_PRIORITIES, TICKET_STATUSES } from '../types/index.js';

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address').trim().toLowerCase(),
  password: z.string().min(1, 'Password is required'),
});

export const createTicketSchema = z.object({
  bookId: z.string().trim().nullable().optional(), // Mongo ObjectId or book_id
  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(150, 'Subject cannot exceed 150 characters')
    .trim(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(3000, 'Description cannot exceed 3000 characters')
    .trim(),
  attachmentName: z.string().trim().nullable().optional(),
});

export const addMessageSchema = z.object({
  content: z
    .string()
    .min(1, 'Message content cannot be empty')
    .max(3000, 'Message cannot exceed 3000 characters')
    .trim(),
});

export const addNoteSchema = z.object({
  content: z
    .string()
    .min(1, 'Note content cannot be empty')
    .max(3000, 'Note cannot exceed 3000 characters')
    .trim(),
});

export const updateTicketSchema = z.object({
  status: z.enum(TICKET_STATUSES as [string, ...string[]]).optional(),
  overriddenCategory: z
    .enum(TICKET_CATEGORIES as [string, ...string[]])
    .nullable()
    .optional(),
  overriddenPriority: z
    .enum(TICKET_PRIORITIES as [string, ...string[]])
    .nullable()
    .optional(),
  assignedAdmin: z.string().nullable().optional(),
});

export const assignAdminSchema = z.object({
  adminId: z.string().nullable().optional(), // User ObjectId or null to unassign
});
