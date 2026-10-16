import { Request, Response } from 'express';
import { Types } from 'mongoose';
import { Ticket, ITicketDocument } from '../models/Ticket.js';
import { Message } from '../models/Message.js';
import { InternalNote } from '../models/InternalNote.js';
import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { aiService } from '../services/aiService.js';
import { TICKET_CATEGORIES, TICKET_PRIORITIES } from '../types/index.js';

export async function getAdminDashboard(req: Request, res: Response): Promise<void> {
  const allTickets = await Ticket.find()
    .populate('author', 'name email author_id')
    .populate('book', 'title book_id')
    .sort({ createdAt: -1 });

  let openCount = 0;
  let inProgressCount = 0;
  let resolvedCount = 0;
  let closedCount = 0;
  let criticalCount = 0;
  let highCount = 0;

  const categoryDistribution: Record<string, number> = {};
  for (const cat of TICKET_CATEGORIES) {
    categoryDistribution[cat] = 0;
  }

  const priorityDistribution: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0,
  };

  for (const t of allTickets) {
    if (t.status === 'OPEN') openCount++;
    else if (t.status === 'IN_PROGRESS') inProgressCount++;
    else if (t.status === 'RESOLVED') resolvedCount++;
    else if (t.status === 'CLOSED') closedCount++;

    const effPriority = t.overriddenPriority || t.aiPriority;
    const effCategory = t.overriddenCategory || t.aiCategory;

    if (effPriority === 'CRITICAL') criticalCount++;
    if (effPriority === 'HIGH') highCount++;

    if (priorityDistribution[effPriority] !== undefined) {
      priorityDistribution[effPriority]++;
    }

    if (categoryDistribution[effCategory] !== undefined) {
      categoryDistribution[effCategory]++;
    } else {
      categoryDistribution[effCategory] = 1;
    }
  }

  // Count tickets awaiting response (open or in progress)
  const openOrInProgressTickets = allTickets.filter(
    (t) => t.status === 'OPEN' || t.status === 'IN_PROGRESS'
  );

  res.status(200).json({
    success: true,
    data: {
      stats: {
        totalTickets: allTickets.length,
        openTickets: openCount,
        inProgressTickets: inProgressCount,
        resolvedTickets: resolvedCount,
        closedTickets: closedCount,
        criticalAndHighTickets: criticalCount + highCount,
        criticalTickets: criticalCount,
        highTickets: highCount,
        awaitingResponse: openOrInProgressTickets.length,
      },
      categoryDistribution: Object.entries(categoryDistribution).map(([name, count]) => ({
        name,
        count,
      })),
      priorityDistribution: Object.entries(priorityDistribution).map(([name, count]) => ({
        name,
        count,
      })),
      recentTickets: allTickets.slice(0, 7).map((t) => ({
        id: t._id,
        ticket_id: t.ticket_id,
        subject: t.subject,
        status: t.status,
        category: t.overriddenCategory || t.aiCategory,
        priority: t.overriddenPriority || t.aiPriority,
        authorName: (t.author as any)?.name || 'Unknown Author',
        bookTitle: (t.book as any)?.title || 'General Account',
        createdAt: t.createdAt,
      })),
    },
  });
}

export async function getAdminTickets(req: Request, res: Response): Promise<void> {
  const {
    page = '1',
    limit = '10',
    status,
    category,
    priority,
    assignedAdmin,
    search,
    sortBy = 'default',
  } = req.query as Record<string, string>;

  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10)));

  const query: any = {};

  if (status && status !== 'ALL') {
    query.status = status;
  }

  if (assignedAdmin && assignedAdmin !== 'ALL') {
    if (assignedAdmin === 'UNASSIGNED') {
      query.assignedAdmin = null;
    } else if (Types.ObjectId.isValid(assignedAdmin)) {
      query.assignedAdmin = assignedAdmin;
    }
  }

  if (search && search.trim() !== '') {
    const searchRegex = new RegExp(search.trim(), 'i');
    query.$or = [{ ticket_id: searchRegex }, { subject: searchRegex }, { description: searchRegex }];
  }

  // Handle category and priority matching (accounting for overrides)
  if (category && category !== 'ALL') {
    query.$or = [
      { overriddenCategory: category },
      { overriddenCategory: null, aiCategory: category },
    ];
  }

  if (priority && priority !== 'ALL') {
    const priorityCondition = [
      { overriddenPriority: priority },
      { overriddenPriority: null, aiPriority: priority },
    ];
    if (query.$or) {
      query.$and = [{ $or: query.$or }, { $or: priorityCondition }];
      delete query.$or;
    } else {
      query.$or = priorityCondition;
    }
  }

  // Fetch all matching tickets to allow intelligent default sorting:
  // Critical and High priority unresolved tickets first, then oldest unresolved tickets.
  const rawTickets = await Ticket.find(query)
    .populate('author', 'name email author_id')
    .populate('book', 'title book_id')
    .populate('assignedAdmin', 'name email');

  // Priority weight mapping
  const priorityWeight: Record<string, number> = {
    CRITICAL: 4,
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
  };

  const statusWeight: Record<string, number> = {
    OPEN: 4,
    IN_PROGRESS: 3,
    RESOLVED: 2,
    CLOSED: 1,
  };

  let sortedTickets = [...rawTickets];

  if (sortBy === 'priority_desc') {
    sortedTickets.sort((a, b) => {
      const pA = priorityWeight[a.overriddenPriority || a.aiPriority] || 0;
      const pB = priorityWeight[b.overriddenPriority || b.aiPriority] || 0;
      return pB - pA;
    });
  } else if (sortBy === 'created_desc') {
    sortedTickets.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (sortBy === 'created_asc') {
    sortedTickets.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  } else if (sortBy === 'updated_desc') {
    sortedTickets.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  } else {
    // Default operational sorting: Unresolved Critical/High first, then oldest open tickets
    sortedTickets.sort((a, b) => {
      const isUnresolvedA = a.status === 'OPEN' || a.status === 'IN_PROGRESS';
      const isUnresolvedB = b.status === 'OPEN' || b.status === 'IN_PROGRESS';

      if (isUnresolvedA && !isUnresolvedB) return -1;
      if (!isUnresolvedA && isUnresolvedB) return 1;

      const pA = priorityWeight[a.overriddenPriority || a.aiPriority] || 0;
      const pB = priorityWeight[b.overriddenPriority || b.aiPriority] || 0;

      if (pA !== pB) return pB - pA; // High priority first

      // Then oldest first for unresolved
      if (isUnresolvedA && isUnresolvedB) {
        return a.createdAt.getTime() - b.createdAt.getTime();
      }

      return b.updatedAt.getTime() - a.updatedAt.getTime();
    });
  }

  const total = sortedTickets.length;
  const totalPages = Math.ceil(total / limitNum) || 1;
  const paginatedTickets = sortedTickets.slice((pageNum - 1) * limitNum, pageNum * limitNum);

  res.status(200).json({
    success: true,
    data: {
      tickets: paginatedTickets.map((t) => ({
        id: t._id,
        ticket_id: t.ticket_id,
        subject: t.subject,
        status: t.status,
        category: t.overriddenCategory || t.aiCategory,
        priority: t.overriddenPriority || t.aiPriority,
        aiCategory: t.aiCategory,
        aiPriority: t.aiPriority,
        overriddenCategory: t.overriddenCategory,
        overriddenPriority: t.overriddenPriority,
        aiAnalysisStatus: t.aiAnalysisStatus,
        aiConfidence: t.aiConfidence,
        author: {
          id: (t.author as any)?._id,
          name: (t.author as any)?.name || 'Unknown',
          email: (t.author as any)?.email,
          author_id: (t.author as any)?.author_id,
        },
        book: t.book
          ? {
              id: (t.book as any)?._id,
              title: (t.book as any)?.title,
              book_id: (t.book as any)?.book_id,
            }
          : null,
        assignedAdmin: t.assignedAdmin
          ? {
              id: (t.assignedAdmin as any)?._id,
              name: (t.assignedAdmin as any)?.name,
              email: (t.assignedAdmin as any)?.email,
            }
          : null,
        createdAt: t.createdAt,
        updatedAt: t.updatedAt,
      })),
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
      },
    },
  });
}

export async function getAdminTicketDetail(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const query = Types.ObjectId.isValid(id) ? { _id: id } : { ticket_id: id };
  const ticket = await Ticket.findOne(query)
    .populate('author', 'name email phone city joined_date author_id')
    .populate('book')
    .populate('assignedAdmin', 'name email admin_id');

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: 'Ticket not found',
    });
    return;
  }

  // Fetch chronological public conversation messages
  const messages = await Message.find({ ticket: ticket._id }).sort({ createdAt: 1 });

  // Fetch internal notes (available ONLY to admin)
  const internalNotes = await InternalNote.find({ ticket: ticket._id }).sort({ createdAt: 1 });

  // Fetch list of admin users for assignment dropdown
  const adminUsers = await User.find({ role: 'ADMIN' }, 'name email admin_id');

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
        aiCategory: ticket.aiCategory,
        aiPriority: ticket.aiPriority,
        overriddenCategory: ticket.overriddenCategory,
        overriddenPriority: ticket.overriddenPriority,
        aiConfidence: ticket.aiConfidence,
        aiReasoning: ticket.aiReasoning,
        aiAnalysisStatus: ticket.aiAnalysisStatus,
        lastDraftResponse: ticket.lastDraftResponse,
        attachmentName: ticket.attachmentName,
        createdAt: ticket.createdAt,
        updatedAt: ticket.updatedAt,
        author: ticket.author,
        book: ticket.book,
        assignedAdmin: ticket.assignedAdmin,
      },
      messages: messages.map((m) => ({
        id: m._id,
        senderRole: m.senderRole,
        senderName: m.senderName,
        content: m.content,
        createdAt: m.createdAt,
      })),
      internalNotes: internalNotes.map((n) => ({
        id: n._id,
        adminName: n.adminName,
        content: n.content,
        createdAt: n.createdAt,
      })),
      admins: adminUsers.map((a) => ({
        id: a._id,
        name: a.name,
        email: a.email,
        admin_id: a.admin_id,
      })),
    },
  });
}

export async function updateAdminTicket(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const { status, overriddenCategory, overriddenPriority, assignedAdmin } = req.body;

  const query = Types.ObjectId.isValid(id) ? { _id: id } : { ticket_id: id };
  const ticket = await Ticket.findOne(query);

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: 'Ticket not found',
    });
    return;
  }

  if (status !== undefined) ticket.status = status;
  if (overriddenCategory !== undefined) ticket.overriddenCategory = overriddenCategory;
  if (overriddenPriority !== undefined) ticket.overriddenPriority = overriddenPriority;

  if (assignedAdmin !== undefined) {
    if (assignedAdmin === null || assignedAdmin === '') {
      ticket.assignedAdmin = null;
    } else if (Types.ObjectId.isValid(assignedAdmin)) {
      ticket.assignedAdmin = new Types.ObjectId(assignedAdmin);
    }
  }

  ticket.updatedAt = new Date();
  await ticket.save();

  res.status(200).json({
    success: true,
    message: 'Ticket updated successfully',
    data: {
      id: ticket._id,
      ticket_id: ticket.ticket_id,
      status: ticket.status,
      category: ticket.overriddenCategory || ticket.aiCategory,
      priority: ticket.overriddenPriority || ticket.aiPriority,
      overriddenCategory: ticket.overriddenCategory,
      overriddenPriority: ticket.overriddenPriority,
      assignedAdmin: ticket.assignedAdmin,
      updatedAt: ticket.updatedAt,
    },
  });
}

export async function addAdminNote(req: Request, res: Response): Promise<void> {
  const admin = req.user!;
  const { id } = req.params;
  const { content } = req.body;

  const query = Types.ObjectId.isValid(id) ? { _id: id } : { ticket_id: id };
  const ticket = await Ticket.findOne(query);

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: 'Ticket not found',
    });
    return;
  }

  const note = await InternalNote.create({
    ticket: ticket._id,
    admin: admin._id,
    adminName: admin.name,
    content,
  });

  ticket.updatedAt = new Date();
  await ticket.save();

  res.status(201).json({
    success: true,
    message: 'Internal note added successfully',
    data: {
      id: note._id,
      adminName: note.adminName,
      content: note.content,
      createdAt: note.createdAt,
    },
  });
}

export async function assignAdminTicket(req: Request, res: Response): Promise<void> {
  const currentAdmin = req.user!;
  const { id } = req.params;
  const { adminId } = req.body;

  const query = Types.ObjectId.isValid(id) ? { _id: id } : { ticket_id: id };
  const ticket = await Ticket.findOne(query);

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: 'Ticket not found',
    });
    return;
  }

  const targetAdminId = adminId ? adminId : currentAdmin._id;
  ticket.assignedAdmin = targetAdminId;
  ticket.updatedAt = new Date();
  await ticket.save();

  const assignedUser = await User.findById(targetAdminId);

  res.status(200).json({
    success: true,
    message: `Ticket successfully assigned to ${assignedUser ? assignedUser.name : 'admin'}`,
    data: {
      assignedAdmin: {
        id: targetAdminId,
        name: assignedUser ? assignedUser.name : 'Operations Admin',
      },
    },
  });
}

export async function rerunAIClassification(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const query = Types.ObjectId.isValid(id) ? { _id: id } : { ticket_id: id };
  const ticket = await Ticket.findOne(query).populate('book');

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: 'Ticket not found',
    });
    return;
  }

  const bookDoc = ticket.book as any;

  try {
    const aiResult = await aiService.classifyTicket(
      ticket.subject,
      ticket.description,
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

    ticket.aiCategory = aiResult.category;
    ticket.aiPriority = aiResult.priority;
    ticket.aiConfidence = aiResult.confidence;
    ticket.aiReasoning = aiResult.reasoning;
    ticket.aiAnalysisStatus = aiResult.isFallback ? 'FALLBACK' : 'SUCCESS';
    ticket.updatedAt = new Date();
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'AI classification refreshed successfully',
      data: {
        category: ticket.aiCategory,
        priority: ticket.aiPriority,
        confidence: ticket.aiConfidence,
        reasoning: ticket.aiReasoning,
        analysisStatus: ticket.aiAnalysisStatus,
        isFallback: aiResult.isFallback,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to re-run AI classification: ' + (error as Error).message,
    });
  }
}

export async function generateAIDraft(req: Request, res: Response): Promise<void> {
  const { id } = req.params;

  const query = Types.ObjectId.isValid(id) ? { _id: id } : { ticket_id: id };
  const ticket = await Ticket.findOne(query).populate('author').populate('book');

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: 'Ticket not found',
    });
    return;
  }

  const author = ticket.author as any;
  const book = ticket.book as any;

  // Retrieve public conversation messages for contextual continuity
  const messages = await Message.find({ ticket: ticket._id }).sort({ createdAt: 1 });

  try {
    const draft = await aiService.generateDraftResponse(
      {
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.overriddenCategory || ticket.aiCategory,
        priority: ticket.overriddenPriority || ticket.aiPriority,
      },
      {
        name: author?.name || 'Author',
        email: author?.email || '',
        city: author?.city,
        joined_date: author?.joined_date,
      },
      book || null,
      messages.map((m) => ({
        senderRole: m.senderRole,
        senderName: m.senderName,
        content: m.content,
      }))
    );

    ticket.lastDraftResponse = draft;
    await ticket.save();

    res.status(200).json({
      success: true,
      message: 'AI draft response generated successfully',
      data: {
        draft,
        isLiveAI: aiService.isLiveAIAvailable(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to generate response draft: ' + (error as Error).message,
    });
  }
}

export async function sendAdminMessage(req: Request, res: Response): Promise<void> {
  const admin = req.user!;
  const { id } = req.params;
  const { content } = req.body;

  const query = Types.ObjectId.isValid(id) ? { _id: id } : { ticket_id: id };
  const ticket = await Ticket.findOne(query);

  if (!ticket) {
    res.status(404).json({
      success: false,
      error: 'Ticket not found',
    });
    return;
  }

  // Create public message
  const message = await Message.create({
    ticket: ticket._id,
    sender: admin._id,
    senderRole: 'ADMIN',
    senderName: admin.name,
    content,
  });

  // Automatically update ticket status from OPEN to IN_PROGRESS upon response
  if (ticket.status === 'OPEN') {
    ticket.status = 'IN_PROGRESS';
  }
  ticket.updatedAt = new Date();
  await ticket.save();

  res.status(201).json({
    success: true,
    message: 'Public reply sent to author successfully',
    data: {
      id: message._id,
      senderRole: message.senderRole,
      senderName: message.senderName,
      content: message.content,
      createdAt: message.createdAt,
      ticketStatus: ticket.status,
    },
  });
}
