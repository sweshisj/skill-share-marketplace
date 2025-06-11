// backend/src/routes/taskRoutes.ts
import { Router } from 'express';
import {
    createTaskHandler, updateTaskHandler, getMyPostedTasksHandler,getAllTasks,
    getAllOpenTasksHandler, makeOfferHandler, acceptOfferHandler,getTaskByIdController,
    rejectOfferHandler, updateTaskProgressHandler, markTaskCompletedHandler,getTaskOffersController,
    acceptTaskCompletionHandler, rejectTaskCompletionHandler, getProviderAcceptedTasksHandler,
    getTaskProgressController, markTaskCompletedByProviderHandler
} from '../controllers/taskController';
import { protect, authorizeRoles, isTaskOwner } from '../middleware/authMiddleware';
import { UserRole } from '../types'; 

const router = Router();
router.get('/', getAllTasks);
router.post('/', protect, authorizeRoles([UserRole.Requester]), createTaskHandler); // User can be individual or company

// Providers can only see tasks they have accepted
router.get('/accepted-by-me', protect, authorizeRoles([UserRole.Provider]), getProviderAcceptedTasksHandler);
router.get('/my-posted-tasks', protect, authorizeRoles([UserRole.Requester]), getMyPostedTasksHandler);
router.put('/:id/mark-completed-by-provider', markTaskCompletedByProviderHandler);

// User can post and update tasks
router.get('/:id', protect, getTaskByIdController); 
router.put('/:id', protect, authorizeRoles([UserRole.Requester]), isTaskOwner, updateTaskHandler);

// Provider can make an offer
router.get('/:taskId/offers', protect, getTaskOffersController);
router.post('/:taskId/offers', protect, authorizeRoles([UserRole.Provider]), makeOfferHandler);

// User can accept/reject offers for their tasks
router.put('/offers/:offerId/accept', protect, authorizeRoles([UserRole.Requester]), acceptOfferHandler);
router.put('/offers/:offerId/reject', protect, authorizeRoles([UserRole.Requester]), rejectOfferHandler);

// Provider updates task progress (only accepted provider)
router.post('/:taskId/progress', protect, authorizeRoles([UserRole.Provider]), updateTaskProgressHandler);
router.get('/:taskId/progress', protect, getTaskProgressController); 
router.put('/:id/complete', protect, authorizeRoles([UserRole.Provider]), markTaskCompletedHandler);

// User accepts/rejects task completion (only task owner)
router.put('/:id/accept-completion', protect, authorizeRoles([UserRole.Requester]), isTaskOwner, acceptTaskCompletionHandler);
router.put('/:id/reject-completion', protect, authorizeRoles([UserRole.Requester]), isTaskOwner, rejectTaskCompletionHandler);


export default router;