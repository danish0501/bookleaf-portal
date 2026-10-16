import { Router } from 'express';
import {
  getAuthorDashboard,
  getAuthorBooks,
  getAuthorTickets,
  createAuthorTicket,
  getAuthorTicketDetail,
  addAuthorMessage,
} from '../controllers/authorController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { createTicketSchema, addMessageSchema } from '../validators/index.js';

const router = Router();

// Protect all author routes
router.use(authenticate, requireRole('AUTHOR'));

router.get('/dashboard', getAuthorDashboard);
router.get('/books', getAuthorBooks);
router.get('/tickets', getAuthorTickets);
router.post('/tickets', validateBody(createTicketSchema), createAuthorTicket);
router.get('/tickets/:id', getAuthorTicketDetail);
router.post('/tickets/:id/messages', validateBody(addMessageSchema), addAuthorMessage);

export default router;
