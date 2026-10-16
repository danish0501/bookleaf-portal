import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Book } from '../models/Book.js';
import { Ticket } from '../models/Ticket.js';
import { Message } from '../models/Message.js';
import { aiService } from '../services/aiService.js';

export async function getAuthorDashboard(req: Request, res: Response): Promise<void> {
  const authorId = req.user!._id;

  const books = await Book.find({ author: authorId });
  const recentTickets = await Ticket.find({ author: authorId })
    .populate('book', 'title book_id status')
    .sort({ createdAt: -1 })
    .limit(5);

  let totalCopiesSold = 0;
  let totalRoyaltyEarned = 0;
  let royaltyPaid = 0;
  let royaltyPending = 0;
  let publishedBooksCount = 0;
  let inProductionBooksCount = 0;

  for (const b of books) {
    totalCopiesSold += b.total_copies_sold || 0;
    totalRoyaltyEarned += b.total_royalty_earned || 0;
    royaltyPaid += b.royalty_paid || 0;
    royaltyPending += b.royalty_pending || 0;

    if (b.status === 'Published & Live') {
      publishedBooksCount++;
    } else {
      inProductionBooksCount++;
    }
  }

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalBooks: books.length,
        publishedBooks: publishedBooksCount,
        inProductionBooks: inProductionBooksCount,
        totalCopiesSold,
        totalRoyaltyEarned,
        royaltyPaid,
        royaltyPending,
      },
      books: books.map((b) => ({
        id: b._id,
        book_id: b.book_id,
        title: b.title,
        status: b.status,
        isbn: b.isbn,
        totalCopiesSold: b.total_copies_sold,
        royaltyEarned: b.total_royalty_earned,
        royaltyPending: b.royalty_pending,
      })),
      recentTickets: recentTickets.map((t) => ({
        id: t._id,
        ticket_id: t.ticket_id,
        subject: t.subject,
        status: t.status,
        category: t.overriddenCategory || t.aiCategory,
        priority: t.overriddenPriority || t.aiPriority,
        bookTitle: (t.book as any)?.title || 'General Account Level',
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
    },
  });
}

export async function getAuthorBooks(req: Request, res: Response): Promise<void> {
  const authorId = req.user!._id;
  const books = await Book.find({ author: authorId }).sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: books,
  });
}

export async function getAuthorTickets(req: Request, res: Response): Promise<void> {
  const authorId = req.user!._id;
  const tickets = await Ticket.find({ author: authorId })
    .populate('book', 'title book_id status')
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    data: tickets.map((t) => ({
      id: t._id,
      ticket_id: t.ticket_id,
      subject: t.subject,
      status: t.status,
      category: t.overriddenCategory || t.aiCategory,
      priority: t.overriddenPriority || t.aiPriority,
      bookTitle: (t.book as any)?.title || 'General / Account Level',
      bookId: (t.book as any)?.book_id || null,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  });
}

export async function createAuthorTicket(req: Request, res: Response): Promise<void> {
  const author = req.user!;
  const { bookId, subject, description, attachmentName } = req.body;

  let bookDoc = null;
  if (bookId && bookId !== 'GENERAL' && bookId !== '') {
    // Validate that book belongs to this author
    if (Types.ObjectId.isValid(bookId)) {
      bookDoc = await Book.findOne({ _id: bookId, author: author._id });
    } else {
      bookDoc = await Book.findOne({ book_id: bookId, author: author._id });
    }

    if (!bookDoc) {
      res.status(403).json({
        success: false,
        error: 'Invalid book selection: the chosen book does not belong to your account.',
      });
      return;
    }
  }

  // Generate unique Ticket ID
  const totalCount = await Ticket.countDocuments();
  const ticketId = `TKT-${1000 + totalCount + 1}`;

  // Save ticket first to guarantee persistence before AI
  const newTicket = await Ticket.create({
    ticket_id: ticketId,
    author: author._id,
    book: bookDoc ? bookDoc._id : null,
    subject,
    description,
    status: 'OPEN',
    attachmentName: attachmentName || null,
    aiCategory: 'General Inquiry',
    aiPriority: 'MEDIUM',
    aiAnalysisStatus: 'PENDING',
  });

  // Create initial public message
  await Message.create({
    ticket: newTicket._id,
    sender: author._id,
    senderRole: 'AUTHOR',
    senderName: author.name,
    content: description,
  });

  // Run AI classification & priority scoring asynchronously / safely
  try {
    const aiResult = await aiService.classifyTicket(
      subject,
      description,
      bookDoc
        ? {
            title: bookDoc.title,
            status: bookDoc.status,
            total_copies_sold: bookDoc.total_copies_sold,
            royalty_pending: bookDoc.royalty_pending,
            isbn: bookDoc.isbn,
          }
        : undefined
    );

    newTicket.aiCategory = aiResult.category;
    newTicket.aiPriority = aiResult.priority;
    newTicket.aiConfidence = aiResult.confidence;
    newTicket.aiReasoning = aiResult.reasoning;
    newTicket.aiAnalysisStatus = aiResult.isFallback ? 'FALLBACK' : 'SUCCESS';
    await newTicket.save();
  } catch (aiErr) {
    console.error('[TicketCreation] AI analysis error, retained ticket:', aiErr);
    newTicket.aiAnalysisStatus = 'FAILED';
    await newTicket.save();
  }

  res.status(201).json({
    success: true,
    message: 'Support ticket submitted successfully',
    data: {
      id: newTicket._id,
      ticket_id: newTicket.ticket_id,
      subject: newTicket.subject,
      status: newTicket.status,
      category: newTicket.aiCategory,
      priority: newTicket.aiPriority,
      createdAt: newTicket.createdAt,
    },
  });
}

export async function getAuthorTicketDetail(req: Request, res: Response): Promise<void> {
  const authorId = req.user!._id;
  const { id } = req.params;

  const query = Types.ObjectId.isValid(id) ? { _id: id } : { ticket_id: id };
  const ticket = await Ticket.findOne({ ...query, author: authorId }).populate(
    'book',
    'title book_id isbn status genre mrp total_copies_sold total_royalty_earned royalty_paid royalty_pending'
  );

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: 'Support ticket not found or does not belong to your account.',
    });
    return;
  }

  // Get chronological public messages only (internal notes are STRICTLY EXCLUDED)
  const messages = await Message.find({ ticket: ticket._id }).sort({ createdAt: 1 });

  res.status(200).json({
    success: true,
    data: {
      ticket: {
        id: ticket._id,
        ticket_id: ticket.ticket_id,
        subject: ticket.subject,
        description: ticket.description,
        status: ticket.status,
        category: ticket.overriddenCategory || ticket.aiCategory,
        priority: ticket.overriddenPriority || ticket.aiPriority,
        attachmentName: ticket.attachmentName,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        book: ticket.book,
      },
      messages: messages.map((m) => ({
        id: m._id,
        senderRole: m.senderRole,
        senderName: m.senderName,
        content: m.content,
        createdAt: m.createdAt,
      })),
    },
  });
}

export async function addAuthorMessage(req: Request, res: Response): Promise<void> {
  const author = req.user!;
  const { id } = req.params;
  const { content } = req.body;

  const query = Types.ObjectId.isValid(id) ? { _id: id } : { ticket_id: id };
  const ticket = await Ticket.findOne({ ...query, author: author._id });

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: 'Ticket not found or does not belong to your account.',
    });
    return;
  }

  const message = await Message.create({
    ticket: ticket._id,
    sender: author._id,
    senderRole: 'AUTHOR',
    senderName: author.name,
    content,
  });

  // Re-open if resolved or closed
  if (ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') {
    ticket.status = 'IN_PROGRESS';
  }
  ticket.updatedAt = new Date();
  await ticket.save();

  res.status(201).json({
    success: true,
    data: {
      id: message._id,
      senderRole: message.senderRole,
      senderName: message.senderName,
      content: message.content,
      createdAt: message.createdAt,
    },
  });
}
