import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { Ticket } from '../models/Ticket.js';
import { Message } from '../models/Message.js';
import { InternalNote } from '../models/InternalNote.js';

interface RawBook {
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

interface RawAuthor {
  author_id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  joined_date: string;
  books: RawBook[];
}

interface RawData {
  authors: RawAuthor[];
}

export async function runSeed() {
  console.log('--- Starting BookLeaf Database Seed ---');
  await connectDB();

  // Find sample data file
  const possiblePaths = [
    path.resolve(process.cwd(), '..', 'FULLSTACK-SAMPLEDATA.json'),
    path.resolve(process.cwd(), 'FULLSTACK-SAMPLEDATA.json'),
    path.resolve(process.cwd(), '..', 'FULLSTACK-SAMPLEDATA (1).json'),
  ];

  let rawDataPath = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      rawDataPath = p;
      break;
    }
  }

  if (!rawDataPath) {
    throw new Error('Could not locate FULLSTACK-SAMPLEDATA.json in workspace or parent directory');
  }

  console.log(`Reading dataset from: ${rawDataPath}`);
  const rawContent = fs.readFileSync(rawDataPath, 'utf-8');
  const dataset: RawData = JSON.parse(rawContent);

  const defaultAuthorPassword = 'Author@123';
  const defaultAdminPassword = 'Admin@123';
  const authorPasswordHash = await bcrypt.hash(defaultAuthorPassword, 10);
  const adminPasswordHash = await bcrypt.hash(defaultAdminPassword, 10);

  // 1. Seed / Update Admin Account
  const adminEmail = 'admin@bookleaf.com';
  let admin = await User.findOne({ email: adminEmail });
  if (!admin) {
    admin = await User.create({
      name: 'Operations Team Lead',
      email: adminEmail,
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
      admin_id: 'ADM001',
      phone: '+91-11-2345-6789',
      city: 'Delhi',
      joined_date: '2022-01-01',
    });
    console.log(`[Seed] Created admin account: ${adminEmail}`);
  } else {
    admin.role = 'ADMIN';
    admin.admin_id = 'ADM001';
    await admin.save();
    console.log(`[Seed] Verified existing admin account: ${adminEmail}`);
  }

  // 2. Seed Authors & Books
  let totalAuthorsCreated = 0;
  let totalAuthorsUpdated = 0;
  let totalBooksProcessed = 0;

  for (const rawAuthor of dataset.authors) {
    let authorUser = await User.findOne({ email: rawAuthor.email.toLowerCase() });

    if (!authorUser) {
      authorUser = await User.create({
        author_id: rawAuthor.author_id,
        name: rawAuthor.name,
        email: rawAuthor.email.toLowerCase(),
        passwordHash: authorPasswordHash,
        role: 'AUTHOR',
        phone: rawAuthor.phone,
        city: rawAuthor.city,
        joined_date: rawAuthor.joined_date,
      });
      totalAuthorsCreated++;
    } else {
      authorUser.author_id = rawAuthor.author_id;
      authorUser.name = rawAuthor.name;
      authorUser.phone = rawAuthor.phone;
      authorUser.city = rawAuthor.city;
      authorUser.joined_date = rawAuthor.joined_date;
      await authorUser.save();
      totalAuthorsUpdated++;
    }

    // Process Books for this author
    for (const rawBook of rawAuthor.books) {
      await Book.findOneAndUpdate(
        { book_id: rawBook.book_id },
        {
          book_id: rawBook.book_id,
          author: authorUser._id,
          author_id: rawAuthor.author_id,
          title: rawBook.title,
          isbn: rawBook.isbn,
          genre: rawBook.genre,
          publication_date: rawBook.publication_date,
          status: rawBook.status,
          mrp: rawBook.mrp,
          author_royalty_per_copy: rawBook.author_royalty_per_copy,
          total_copies_sold: rawBook.total_copies_sold,
          total_royalty_earned: rawBook.total_royalty_earned,
          royalty_paid: rawBook.royalty_paid,
          royalty_pending: rawBook.royalty_pending,
          last_royalty_payout_date: rawBook.last_royalty_payout_date,
          print_partner: rawBook.print_partner,
          available_on: rawBook.available_on,
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
      totalBooksProcessed++;
    }
  }

  console.log(`[Seed] Authors: ${totalAuthorsCreated} created, ${totalAuthorsUpdated} updated (Total: ${dataset.authors.length})`);
  console.log(`[Seed] Books processed: ${totalBooksProcessed} (Expected: 18)`);

  // 3. Seed Realistic Demo Support Tickets for test workflow
  const demoTicketsCount = await Ticket.countDocuments();
  if (demoTicketsCount === 0) {
    console.log('[Seed] Seeding realistic sample tickets...');

    const rohit = await User.findOne({ email: 'rohit.kapoor@email.com' });
    const arjun = await User.findOne({ email: 'arjun.malhotra@email.com' });
    const sneha = await User.findOne({ email: 'sneha.kulkarni@email.com' });
    const diya = await User.findOne({ email: 'diya.chatterjee@email.com' });

    const bk003 = await Book.findOne({ book_id: 'BK003' }); // Code & Karma
    const bk010 = await Book.findOne({ book_id: 'BK010' }); // Turban Tales
    const bk013 = await Book.findOne({ book_id: 'BK013' }); // Midnight in Mysore (In Production)
    const bk017 = await Book.findOne({ book_id: 'BK017' }); // Durga's Daughters

    // Ticket 1: Arjun - Royalty threshold question
    if (arjun && bk010) {
      const t1 = await Ticket.create({
        ticket_id: 'TKT-1001',
        author: arjun._id,
        book: bk010._id,
        subject: 'Inquiry regarding my first royalty payout date',
        description: 'Hello BookLeaf Team, I see that 88 copies of Turban Tales have been sold and my total earned royalty is ₹2,464. However, I have not received a payout yet. Could you clarify when this will be credited?',
        status: 'OPEN',
        aiCategory: 'Royalty & Payments',
        aiPriority: 'MEDIUM',
        aiConfidence: 0.94,
        aiReasoning: 'Author is inquiring about the timing of pending royalty disbursement for their published title.',
        aiAnalysisStatus: 'SUCCESS',
        assignedAdmin: admin._id,
        lastDraftResponse: 'Dear Arjun,\n\nThank you for reaching out to us. Congratulations on the steady sales of "Turban Tales"!\n\nAs per BookLeaf policy, royalties are calculated at the end of each calendar quarter and disbursed within 45 days. Since your pending royalty of ₹2,464 comfortably exceeds our minimum threshold of ₹1,000, your payment is scheduled for the upcoming quarterly payout cycle.\n\nPlease verify that your bank account details are fully up to date in your author profile. Feel free to reply if you need any assistance with this!\n\nWarm regards,\nBookLeaf Author Support Team',
      });

      await Message.create({
        ticket: t1._id,
        sender: arjun._id,
        senderRole: 'AUTHOR',
        senderName: arjun.name,
        content: 'Hello BookLeaf Team, I see that 88 copies of Turban Tales have been sold and my total earned royalty is ₹2,464. However, I have not received a payout yet. Could you clarify when this will be credited?',
      });

      await InternalNote.create({
        ticket: t1._id,
        admin: admin._id,
        adminName: admin.name,
        content: 'Arjun joined in June 2024. Next payout cycle is end of Q1 2026. Bank details are confirmed on file.',
      });
    }

    // Ticket 2: Sneha - Production progress
    if (sneha && bk013) {
      const t2 = await Ticket.create({
        ticket_id: 'TKT-1002',
        author: sneha._id,
        book: bk013._id,
        subject: 'Update on Cover Design for Midnight in Mysore',
        description: 'Hi team, Midnight in Mysore has been in Cover Design for almost two weeks. Could you provide an updated ETA or share the draft covers?',
        status: 'IN_PROGRESS',
        aiCategory: 'Book Status & Production Updates',
        aiPriority: 'MEDIUM',
        aiConfidence: 0.92,
        aiReasoning: 'Author is requesting status update on cover design stage of book in production.',
        aiAnalysisStatus: 'SUCCESS',
        assignedAdmin: admin._id,
      });

      await Message.create({
        ticket: t2._id,
        sender: sneha._id,
        senderRole: 'AUTHOR',
        senderName: sneha.name,
        content: 'Hi team, Midnight in Mysore has been in Cover Design for almost two weeks. Could you provide an updated ETA or share the draft covers?',
      });

      await Message.create({
        ticket: t2._id,
        sender: admin._id,
        senderRole: 'ADMIN',
        senderName: admin.name,
        content: 'Dear Sneha, thank you for checking in. Our design team has prepared three preliminary cover mockups. We are currently preparing them for your review and will email them to you within 24 hours for your feedback and approval.',
      });

      await InternalNote.create({
        ticket: t2._id,
        admin: admin._id,
        adminName: admin.name,
        content: 'Design team in Delhi completed 3 concepts. Sending to author tonight for approval.',
      });
    }

    // Ticket 3: Diya - Amazon Availability issue
    if (diya && bk017) {
      const t3 = await Ticket.create({
        ticket_id: 'TKT-1003',
        author: diya._id,
        book: bk017._id,
        subject: 'Urgent: Durga\'s Daughters showing "Currently Unavailable" on Amazon India',
        description: 'My readers in Kolkata are reporting that Durga\'s Daughters is showing as currently out of stock on Amazon India. Can you please check?',
        status: 'OPEN',
        aiCategory: 'Distribution & Availability',
        aiPriority: 'HIGH',
        aiConfidence: 0.95,
        aiReasoning: 'Published title reported out of stock / unavailable on major retail channel, impacting direct sales.',
        aiAnalysisStatus: 'SUCCESS',
      });

      await Message.create({
        ticket: t3._id,
        sender: diya._id,
        senderRole: 'AUTHOR',
        senderName: diya.name,
        content: 'My readers in Kolkata are reporting that Durga\'s Daughters is showing as currently out of stock on Amazon India. Can you please check?',
      });
    }

    console.log('[Seed] Demo tickets seeded successfully.');
  }

  console.log('--- Database Seeding Complete ---');
}

// Execute directly if run via CLI
if (process.argv[1]?.includes('seed.ts') || process.argv[1]?.includes('seed.js')) {
  runSeed()
    .then(async () => {
      await disconnectDB();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error('[Seed Error]:', err);
      await disconnectDB();
      process.exit(1);
    });
}
