// backend/src/routes/skillRoutes.ts
import { Router } from 'express';
import { createSkillHandler, getSkillHandler, updateSkillHandler, getMySkillsHandler, deleteUserSkillHandler } from '../controllers/skillController';
import { protect, authorizeRoles } from '../middleware/authMiddleware';
import { UserRole } from '../types'; 

const router = Router();

// Only 'provider' role can create, get, update, or delete skills
router.post('/', protect, authorizeRoles([UserRole.Provider]), createSkillHandler);
router.get('/my-posted-skills', protect, authorizeRoles([UserRole.Provider]), getMySkillsHandler);
router.get('/:id', protect, authorizeRoles([UserRole.Provider]), getSkillHandler); // Providers can view specific skills
router.put('/:id', protect, authorizeRoles([UserRole.Provider]), updateSkillHandler);
router.delete('/:id', protect, authorizeRoles([UserRole.Provider]), deleteUserSkillHandler);

export default router;