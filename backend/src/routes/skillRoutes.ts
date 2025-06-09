// backend/src/routes/skillRoutes.ts
import { Router } from 'express';
import { createSkillHandler, getSkillHandler, updateSkillHandler, getMySkillsHandler, deleteUserSkillHandler } from '../controllers/skillController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';

const router = Router();

router.post('/', protect, authorizeRoles(['company', 'individual']), createSkillHandler);
router.get('/my-posted-skills', protect, authorizeRoles(['company', 'individual']), getMySkillsHandler);
router.get('/:id', protect, authorizeRoles(['company', 'individual']), getSkillHandler);
router.put('/:id', protect, authorizeRoles(['company', 'individual']), updateSkillHandler);
router.delete('/:id', protect, authorizeRoles(['individual', 'company']), deleteUserSkillHandler); // <-- ADD THIS ROUTE
export default router;