// backend/src/routes/taskRoutes.ts
import { Router } from 'express';
import {
    createTaskHandler, updateTaskHandler, getMyPostedTasksHandler,
    getAllOpenTasksHandler, makeOfferHandler, acceptOfferHandler,
    rejectOfferHandler, updateTaskProgressHandler, markTaskCompletedHandler,
    acceptTaskCompletionHandler, rejectTaskCompletionHandler, getProviderAcceptedTasksHandler
} from '../controllers/taskController';
import { protect, authorizeRoles, isTaskOwner } from '../middleware/authMiddleware';

const router = Router();

// User can post and update tasks
router.post('/', protect, authorizeRoles(['individual', 'company']), createTaskHandler); // User can be individual or company
router.put('/:id', protect, authorizeRoles(['individual', 'company']), isTaskOwner, updateTaskHandler);
router.get('/me', protect, authorizeRoles(['individual', 'company']), getMyPostedTasksHandler);

// Provider can view open tasks
router.get('/open', protect, authorizeRoles(['individual', 'company']), getAllOpenTasksHandler);

// Provider can make an offer
router.post('/:taskId/offers', protect, authorizeRoles(['individual', 'company']), makeOfferHandler);

// User can accept/reject offers for their tasks
router.put('/offers/:offerId/accept', protect, authorizeRoles(['individual', 'company']), acceptOfferHandler);
router.put('/offers/:offerId/reject', protect, authorizeRoles(['individual', 'company']), rejectOfferHandler);

// Provider updates task progress (only accepted provider)
router.post('/:taskId/progress', protect, authorizeRoles(['individual', 'company']), updateTaskProgressHandler);
router.put('/:id/complete', protect, authorizeRoles(['individual', 'company']), markTaskCompletedHandler);

// User accepts/rejects task completion (only task owner)
router.put('/:id/accept-completion', protect, authorizeRoles(['individual', 'company']), isTaskOwner, acceptTaskCompletionHandler);
router.put('/:id/reject-completion', protect, authorizeRoles(['individual', 'company']), isTaskOwner, rejectTaskCompletionHandler);

// Providers can only see tasks they have accepted
router.get('/providers/me/accepted-tasks', protect, authorizeRoles(['individual', 'company']), getProviderAcceptedTasksHandler);

export default router;