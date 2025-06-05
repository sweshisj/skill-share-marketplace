// backend/src/routes/skillRoutes.ts
import { Router } from 'express';
import { createSkillHandler, updateSkillHandler, getMySkillsHandler } from '../controllers/skillController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, authorizeRoles(['company', 'individual']), createSkillHandler);
router.put('/:id', protect, authorizeRoles(['company', 'individual']), updateSkillHandler);
router.get('/me', protect, authorizeRoles(['company', 'individual']), getMySkillsHandler);

export default router;