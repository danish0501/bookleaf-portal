import { Router } from 'express';
import { login, logout, getCurrentUser } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { validateBody } from '../middleware/validate.js';
import { loginSchema } from '../validators/index.js';

const router = Router();

router.post('/login', validateBody(loginSchema), login);
router.post('/logout', logout);
router.get('/me', authenticate, getCurrentUser);

export default router;
