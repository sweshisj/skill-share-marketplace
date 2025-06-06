// backend/src/routes/taskRoutes.ts
import { Router } from 'express';
import {
    createTaskHandler, updateTaskHandler, getMyPostedTasksHandler,getAllTasks,
    getAllOpenTasksHandler, makeOfferHandler, acceptOfferHandler,getTaskByIdController,
    rejectOfferHandler, updateTaskProgressHandler, markTaskCompletedHandler,getTaskOffersController,
    acceptTaskCompletionHandler, rejectTaskCompletionHandler, getProviderAcceptedTasksHandler
} from '../controllers/taskController';
import { protect, authorizeRoles, isTaskOwner } from '../middleware/authMiddleware';

const router = Router();
router.get('/', getAllTasks);
router.post('/', protect, authorizeRoles(['individual', 'company']), createTaskHandler); // User can be individual or company

// Providers can only see tasks they have accepted
router.get('/accepted-by-me', protect, authorizeRoles(['individual', 'company']), getProviderAcceptedTasksHandler);
router.get('/my-posted-tasks', protect, authorizeRoles(['individual', 'company']), getMyPostedTasksHandler);

// User can post and update tasks
router.get('/:id', protect, getTaskByIdController); 
router.put('/:id', protect, authorizeRoles(['individual', 'company']), isTaskOwner, updateTaskHandler);

// Provider can view open tasks
// router.get('/open', protect, authorizeRoles(['individual', 'company']), getAllOpenTasksHandler);
// Provider can make an offer
router.get('/:taskId/offers', protect, getTaskOffersController);
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


export default router;