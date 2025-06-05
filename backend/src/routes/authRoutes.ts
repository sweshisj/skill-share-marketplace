// backend/src/routes/authRoutes.ts
import { Router } from 'express';
import { registerUser, loginUser, getMyProfile } from '../controllers/authController';
import { protect } from '../middleware/authMiddleware';

const router = Router();

router.post('/signup', registerUser);
router.post('/login', loginUser);
router.get('/me', protect, getMyProfile);

export default router;