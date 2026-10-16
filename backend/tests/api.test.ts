import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { User } from '../src/models/User.js';
import { Book } from '../src/models/Book.js';
import { Ticket } from '../src/models/Ticket.js';
import { InternalNote } from '../src/models/InternalNote.js';

describe('BookLeaf Author Portal API Test Suite', () => {
  let app: any;
  let authorToken: string;
  let adminToken: string;
  let authorUser: any;
  let adminUser: any;
  let authorBook: any;
  let otherAuthorBook: any;
  let createdTicketId: string;

  beforeAll(async () => {
    await connectDB();
    app = createApp();

    // Retrieve seeded test users
    authorUser = await User.findOne({ email: 'arjun.malhotra@email.com' });
    adminUser = await User.findOne({ email: 'admin@bookleaf.com' });

    // Retrieve books
    authorBook = await Book.findOne({ book_id: 'BK010' }); // Belongs to Arjun (AUTH006)
    otherAuthorBook = await Book.findOne({ book_id: 'BK001' }); // Belongs to Priya (AUTH001)

    // Authenticate author
    const authorRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'arjun.malhotra@email.com', password: 'Author@123' });
    expect(authorRes.status).toBe(200);
    authorToken = authorRes.body.token;

    // Authenticate admin
    const adminRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'admin@bookleaf.com', password: 'Admin@123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;
  });

  afterAll(async () => {
    await disconnectDB();
  });

  describe('1. Health Check & Public Endpoints', () => {
    it('returns 200 on /api/health', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toContain('BookLeaf');
    });
  });

  describe('2. Authentication & Security', () => {
    it('rejects invalid password credentials with 401', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'admin@bookleaf.com', password: 'WrongPassword' });
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Invalid email or password');
    });

    it('rejects unauthenticated requests to protected author routes with 401', async () => {
      const res = await request(app).get('/api/v1/author/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('rejects unauthenticated requests to protected admin routes with 401', async () => {
      const res = await request(app).get('/api/v1/admin/dashboard');
      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('prevents authors from accessing admin-only routes with 403', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${authorToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Access denied');
    });

    it('prevents admins from accessing author routes with 403', async () => {
      const res = await request(app)
        .get('/api/v1/author/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe('3. Author Portal Data Isolation & Book Ownership', () => {
    it('returns author dashboard stats calculated strictly from own books', async () => {
      const res = await request(app)
        .get('/api/v1/author/dashboard')
        .set('Authorization', `Bearer ${authorToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.totalBooks).toBe(1); // Arjun has 1 book
      expect(res.body.data.stats.totalCopiesSold).toBe(88);
      expect(res.body.data.stats.totalRoyaltyEarned).toBe(2464);
    });

    it('rejects ticket creation when an author selects another author book with 403', async () => {
      const res = await request(app)
        .post('/api/v1/author/tickets')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          bookId: otherAuthorBook._id.toString(), // Belongs to Priya
          subject: 'Unauthorized query test',
          description: 'Attempting to create ticket on another author title',
        });
      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('does not belong to your account');
    });

    it('allows ticket creation with owned book and triggers auto-classification', async () => {
      const res = await request(app)
        .post('/api/v1/author/tickets')
        .set('Authorization', `Bearer ${authorToken}`)
        .send({
          bookId: authorBook._id.toString(),
          subject: 'Printing quality issue: blurred cover text',
          description: 'The author copies I received yesterday have blurred text on the front cover and misaligned pages.',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.ticket_id).toBeDefined();
      expect(res.body.data.category).toBe('Printing & Quality');
      createdTicketId = res.body.data.ticket_id;
    });

    it('strictly hides internal admin notes from author ticket view', async () => {
      // First, have admin add an internal note
      await request(app)
        .post(`/api/v1/admin/tickets/${createdTicketId}/notes`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ content: 'Confidential ops note: Print lab investigated and confirms re-run needed.' });

      // Author fetches ticket detail
      const res = await request(app)
        .get(`/api/v1/author/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${authorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      // Ensure internalNotes field is completely absent
      expect(res.body.data.internalNotes).toBeUndefined();
      // Ensure no internal note string is leaked in public messages
      const serialized = JSON.stringify(res.body.data);
      expect(serialized).not.toContain('Confidential ops note');
    });
  });

  describe('4. Admin Portal Management & Overrides', () => {
    it('returns admin dashboard with ticket counts and distributions', async () => {
      const res = await request(app)
        .get('/api/v1/admin/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.stats.totalTickets).toBeGreaterThanOrEqual(1);
      expect(res.body.data.categoryDistribution).toBeDefined();
    });

    it('returns internal notes on admin ticket detail view', async () => {
      const res = await request(app)
        .get(`/api/v1/admin/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.internalNotes).toBeDefined();
      expect(res.body.data.internalNotes.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.internalNotes[0].content).toContain('Confidential ops note');
    });

    it('allows admin to override category, priority, and update status', async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'IN_PROGRESS',
          overriddenCategory: 'Printing & Quality',
          overriddenPriority: 'HIGH',
        });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe('IN_PROGRESS');
      expect(res.body.data.overriddenPriority).toBe('HIGH');
    });

    it('allows admin to generate an AI draft response', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/tickets/${createdTicketId}/ai-draft`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.draft).toBeDefined();
      expect(res.body.data.draft.length).toBeGreaterThan(30);
    });

    it('allows admin to send a public reply and updates ticket status to IN_PROGRESS', async () => {
      const res = await request(app)
        .post(`/api/v1/admin/tickets/${createdTicketId}/messages`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          content: 'Dear Arjun, we have reviewed the print issue and have approved a 100% free reprint for you.',
        });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.senderRole).toBe('ADMIN');

      // Verify the author sees the reply in public thread
      const authorView = await request(app)
        .get(`/api/v1/author/tickets/${createdTicketId}`)
        .set('Authorization', `Bearer ${authorToken}`);
      expect(authorView.status).toBe(200);
      const lastMsg = authorView.body.data.messages.slice(-1)[0];
      expect(lastMsg.senderRole).toBe('ADMIN');
      expect(lastMsg.content).toContain('approved a 100% free reprint');
    });
  });
});
