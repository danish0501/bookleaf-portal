import { connectDB, disconnectDB } from '../config/db.js';
import { User } from '../models/User.js';
import { Book } from '../models/Book.js';
import { Ticket } from '../models/Ticket.js';

async function verify() {
  await connectDB();
  const authors = await User.find({ role: 'AUTHOR' });
  const admins = await User.find({ role: 'ADMIN' });
  const books = await Book.find();
  const tickets = await Ticket.find();

  console.log('--- DATABASE INTEGRITY CHECK ---');
  console.log(`AUTHORS COUNT: ${authors.length}/10`);
  console.log(`ADMINS COUNT: ${admins.length}/1`);
  console.log(`BOOKS COUNT: ${books.length}/18`);
  console.log(`TICKETS COUNT: ${tickets.length}`);

  const bk013 = await Book.findOne({ book_id: 'BK013' });
  console.log('BK013 (In Production Edge Case):', {
    book_id: bk013?.book_id,
    title: bk013?.title,
    status: bk013?.status,
    publication_date: bk013?.publication_date,
    isbn: bk013?.isbn,
    mrp: bk013?.mrp,
    royalty_pending: bk013?.royalty_pending,
    available_on: bk013?.available_on,
  });

  const bk015 = await Book.findOne({ book_id: 'BK015' });
  console.log('BK015 (In Production Edge Case):', {
    book_id: bk015?.book_id,
    title: bk015?.title,
    status: bk015?.status,
    publication_date: bk015?.publication_date,
    isbn: bk015?.isbn,
    mrp: bk015?.mrp,
    royalty_pending: bk015?.royalty_pending,
    available_on: bk015?.available_on,
  });

  const totalEarned = books.reduce((acc, b) => acc + (b.total_royalty_earned || 0), 0);
  const totalPaid = books.reduce((acc, b) => acc + (b.royalty_paid || 0), 0);
  const totalPending = books.reduce((acc, b) => acc + (b.royalty_pending || 0), 0);

  console.log('ROYALTY SUMMARY:');
  console.log(`  Total Earned:  ₹${totalEarned.toLocaleString('en-IN')}`);
  console.log(`  Total Paid:    ₹${totalPaid.toLocaleString('en-IN')}`);
  console.log(`  Total Pending: ₹${totalPending.toLocaleString('en-IN')}`);
  console.log(`  Reconciled:    ${totalEarned === totalPaid + totalPending}`);

  // Check all author IDs
  const authorIds = authors.map((a) => a.author_id).sort();
  console.log('AUTHOR IDS:', authorIds);

  await disconnectDB();
}

verify().catch(console.error);
