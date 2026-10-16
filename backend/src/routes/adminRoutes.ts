import { Router } from 'express';
import {
  getAdminDashboard,
  getAdminTickets,
  getAdminTicketDetail,
  updateAdminTicket,
  addAdminNote,
  assignAdminTicket,
  rerunAIClassification,
  generateAIDraft,
  sendAdminMessage,
} from '../controllers/adminController.js';
import { authenticate, requireRole } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import {
  updateTicketSchema,
  addNoteSchema,
  assignAdminSchema,
  addMessageSchema,
} from '../validators/index.js';

const router = Router();

// Protect all admin routes
router.use(authenticate, requireRole('ADMIN'));

router.get('/dashboard', getAdminDashboard);
router.get('/tickets', getAdminTickets);
router.get('/tickets/:id', getAdminTicketDetail);
router.patch('/tickets/:id', validateBody(updateTicketSchema), updateAdminTicket);
router.post('/tickets/:id/notes', validateBody(addNoteSchema), addAdminNote);
router.post('/tickets/:id/assign', validateBody(assignAdminSchema), assignAdminTicket);
router.post('/tickets/:id/ai-classify', rerunAIClassification);
router.post('/tickets/:id/ai-draft', generateAIDraft);
router.post('/tickets/:id/messages', validateBody(addMessageSchema), sendAdminMessage);

export default router;
