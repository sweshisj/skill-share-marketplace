// backend/src/controllers/taskController.ts
import { Request, Response } from 'express';
import { CreateTaskRequest, CreateTaskProgressRequest, UpdateTaskProgressRequest, UpdateTaskRequest, UserRole, UserType, OfferWithProvider, ProviderPublicDetails, Offer } from '../types';
import {
    createTask, findTaskById, updateTask, findTasksByUserId, findAllOpenTasks, findAllTasks,
    updateTaskStatus, findAcceptedTasksForProvider, createTaskProgressUpdate, getTaskProgressUpdates,
} from '../models/taskModel';
import { createOffer, findOfferById, updateOfferStatus, findOffersByTaskId, findAcceptedOfferForTask } from '../models/offerModel';
import { mapTaskDBToTask, mapOfferDBToOffer } from '../utils/mapper';
import { findOffersWithProviderDetailsByTaskId, findOfferByProviderIdAndTaskId } from '../models/offerModel';

interface AuthRequest extends Request {
    user?: { id: string; role: UserRole; userType: UserType; email: string };
    task?: any; // To hold task data from middleware, consider typing this more specifically as TaskDB
}

export const createTaskHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        // Ensure only requesters can create tasks
        if (!userId || req.user?.role !== UserRole.Requester) {
            res.status(403).json({ message: 'Forbidden: Only requesters can create tasks.' });
            return;
        }

        const taskData: CreateTaskRequest = req.body;
        if (!taskData.taskName || !taskData.category || !taskData.expectedStartDate || !taskData.hourlyRateOffered || !taskData.rateCurrency) {
            res.status(400).json({ message: 'Missing required task fields.' });
            return;
        }

        const newTask = await createTask(userId, taskData);
        res.status(201).json(newTask);
    } catch (error) {
        console.error('Create task error:', error);
        res.status(500).json({ message: 'Server error creating task', error: (error as Error).message });
    }
};

export const getTaskByIdController = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const taskDB = await findTaskById(id);

        if (!taskDB) {
            res.status(404).json({ message: 'Task not found.' });
            return;
        }

        res.json(mapTaskDBToTask(taskDB));
    } catch (error) {
        console.error('[getTaskByIdController] Error fetching task by ID:', error);
        res.status(500).json({ message: 'Server error fetching task.', error: (error as Error).message });
    }
};

export const markTaskCompletedByProviderHandler = async (req: AuthRequest, res: Response) => {
    try {
        const taskId = req.params.id;
       

        // 1. Basic validation: Check if task ID and authenticated user ID are present
        if (!taskId) {
           res.status(400).json({ message: 'Task ID and authenticated user ID are required.' });
            return;
        }

        // 2. Fetch the task details
        const task = await findTaskById(taskId);
        if (!task) {
            res.status(404).json({ message: 'Task not found.' });
            return;
        }

        // 4. Status Check: Ensure the task is currently 'in_progress'
        if (task.status !== 'in_progress') {
            res.status(400).json({ message: `Bad Request: Task status is '${task.status}'. Only 'in_progress' tasks can be marked as completed.` });
            return;
        }

        // 5. Update the task status
        const updatedTask = await updateTaskStatus(taskId, 'completed_pending_review');

        if (!updatedTask) {
            res.status(500).json({ message: 'Failed to update task status.' });
            return;
        }

        // 6. Success Response
        res.status(200).json({ message: 'Task marked as completed (pending review) successfully!', task: updatedTask });

    } catch (error) {
        console.error('Error in markTaskCompletedByProviderHandler:', error);
        res.status(500).json({ message: 'Server error marking task completed', error: (error as Error).message });
    }
};
export const getTaskOffersController = async (req: AuthRequest, res: Response) => {
    try {
        const { taskId } = req.params;
        // User requesting offers must be the task owner
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'User ID not found in token.' });
            return;
        }

        const task = await findTaskById(taskId);
        if (!task || task.user_id !== userId) {
            res.status(403).json({ message: 'Forbidden: You are not the owner of this task.' });
            return;
        }


        const offersWithProviders: OfferWithProvider[] = await findOffersWithProviderDetailsByTaskId(taskId);

        if (offersWithProviders.length === 0) {
            res.status(200).json([]);
            return;
        }

        res.json(offersWithProviders);

    } catch (error) {
        console.error('[getTaskOffersController] Error fetching offers and provider details for task:', error);
        res.status(500).json({ message: 'Server error fetching offers.', error: (error as Error).message });
    }
};

export const updateTaskHandler = async (req: AuthRequest, res: Response) => {
    try {
        const taskId = req.params.id;
        const userId = req.user?.id;

        // Only requesters can update tasks they own
        if (!userId || req.user?.role !== UserRole.Requester) {
            res.status(403).json({ message: 'Forbidden: Only requesters can update tasks.' });
            return;
        }
        if (!taskId) {
            res.status(400).json({ message: 'Task ID is required.' });
            return;
        }

        const taskData: UpdateTaskRequest = req.body;

        const existingTask = await findTaskById(taskId); // Always fetch to ensure ownership
        if (!existingTask || existingTask.user_id !== userId) {
            res.status(404).json({ message: 'Task not found or you do not own it.' });
            return;
        }
        if (existingTask.status !== 'open') {
            res.status(400).json({ message: 'Cannot update a task that is not in "open" status.' });
            return;
        }


        const updatedTask = await updateTask(taskId, userId, taskData);
        if (!updatedTask) {
            res.status(400).json({ message: 'No valid fields to update or task not found.' });
            return;
        }
        res.json(updatedTask);
    } catch (error) {
        console.error('Update task error:', error);
        res.status(500).json({ message: 'Server error updating task', error: (error as Error).message });
    }
};

export const getMyPostedTasksHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        // Ensure only requesters can view their posted tasks
        if (!userId || req.user?.role !== UserRole.Requester) {
            res.status(403).json({ message: 'Forbidden: Only requesters can view their posted tasks.' });
            return;
        }

        const tasks = await findTasksByUserId(userId);
        res.json(tasks);
    } catch (error) {
        console.error('Get my posted tasks error:', error);
        res.status(500).json({ message: 'Server error fetching tasks', error: (error as Error).message });
    }
};

export const getAllTasks = async (req: Request, res: Response) => {
    try {
        const { status } = req.query;

        let tasks;
        if (typeof status === 'string' && status) {
            tasks = await findAllTasks(status);
        } else {
            tasks = await findAllTasks();
        }
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching all tasks:', error);
        res.status(500).json({ message: 'Server error fetching tasks.', error: (error as Error).message });
    }
};

export const getAllOpenTasksHandler = async (req: Request, res: Response) => {
    try {
        const tasks = await findAllOpenTasks();
        res.json(tasks);
    } catch (error) {
        console.error('Get all open tasks error:', error);
        res.status(500).json({ message: 'Server error fetching open tasks', error: (error as Error).message });
    }
};

export const makeOfferHandler = async (req: AuthRequest, res: Response) => {
    try {
        const taskId = req.params.taskId;
        const providerId = req.user?.id;

        // Only providers can make offers
        if (!providerId || req.user?.role !== UserRole.Provider) {
            res.status(403).json({ message: 'Forbidden: Only providers can make offers.' });
            return;
        }
        if (!taskId) {
            res.status(400).json({ message: 'Task ID is required.' });
            return;
        }

        const offerData = req.body; // MakeOfferRequest
        if (!offerData.offeredHourlyRate || !offerData.offeredRateCurrency) {
            res.status(400).json({ message: 'Offer rate and currency are required.' });
            return;
        }

        const task = await findTaskById(taskId);
        if (!task || task.status !== 'open') {
            res.status(400).json({ message: 'Cannot make an offer on this task (not found or not open).' });
            return;
        }

        // Check if provider has already made an offer on this task (more robust check including accepted/pending)
        const existingOffer = await findOfferByProviderIdAndTaskId(providerId, taskId);
        if (existingOffer) {
            res.status(400).json({ message: 'You have already made an offer on this task.' });
            return;
        }

        const newOffer = await createOffer(taskId, providerId, offerData);
        res.status(201).json(newOffer);
    } catch (error) {
        console.error('Make offer error:', error);
        if ((error as any).code === '23505') { // PostgreSQL unique violation code (e.g., if a provider makes multiple offers)
            res.status(409).json({ message: 'You have already made an offer on this task.' });
            return;
        }
        res.status(500).json({ message: 'Server error making offer', error: (error as Error).message });
    }
};

export const acceptOfferHandler = async (req: AuthRequest, res: Response) => {
    try {
        const offerId = req.params.offerId;
        const userId = req.user?.id; // This is the Requester's ID

        // Only requesters can accept offers
        if (!userId || req.user?.role !== UserRole.Requester) {
            res.status(403).json({ message: 'Forbidden: Only requesters can accept offers.' });
            return;
        }
        if (!offerId) {
            res.status(400).json({ message: 'Offer ID is required.' });
            return;
        }

        const offer = await findOfferById(offerId);
        if (!offer) {
            res.status(404).json({ message: 'Offer not found.' });
            return;
        }

        const task = await findTaskById(offer.taskId);
        if (!task || task.user_id !== userId) {
            res.status(403).json({ message: 'Forbidden: You do not own this task or task not found.' });
            return;
        }
        if (task.status !== 'open') {
            res.status(400).json({ message: `Cannot accept offer: Task status is '${task.status}'. Only 'open' tasks can have offers accepted.` });
            return;
        }

        // Check if there's already an accepted offer for this task
        const existingAcceptedOffer = await findAcceptedOfferForTask(offer.taskId);
        if (existingAcceptedOffer) {
            res.status(400).json({ message: 'An offer for this task has already been accepted.' });
            return;
        }

        // Reject all other pending offers for this task
        const otherOffers = await findOffersByTaskId(offer.taskId);
        for (const o of otherOffers) {
            if (o.id !== offerId && o.offerStatus === 'pending') {
                await updateOfferStatus(o.id, 'rejected');
            }
        }

        // Accept the selected offer
        const acceptedOffer = await updateOfferStatus(offerId, 'accepted');
        if (!acceptedOffer) {
            res.status(500).json({ message: 'Failed to accept offer.' });
            return;
        }

        // Update task status to in_progress and assign provider_id
        const updatedTask = await updateTaskStatus(offer.taskId, 'in_progress');
        if (!updatedTask) {
             res.status(500).json({ message: 'Failed to update task status or assign provider.' });
             return;
        }


        res.json({ message: 'Offer accepted and task status updated.', offer: acceptedOffer, task: updatedTask });
    } catch (error) {
        console.error('Accept offer error:', error);
        res.status(500).json({ message: 'Server error accepting offer', error: (error as Error).message });
    }
};

export const rejectOfferHandler = async (req: AuthRequest, res: Response) => {
    try {
        const offerId = req.params.offerId;
        const userId = req.user?.id; // This is the Requester's ID

        // Only requesters can reject offers
        if (!userId || req.user?.role !== UserRole.Requester) {
            res.status(403).json({ message: 'Forbidden: Only requesters can reject offers.' });
            return;
        }
        if (!offerId) {
            res.status(400).json({ message: 'Offer ID is required.' });
            return;
        }

        const offer = await findOfferById(offerId);
        if (!offer) {
            res.status(404).json({ message: 'Offer not found.' });
            return;
        }

        const task = await findTaskById(offer.taskId);
        if (!task || task.user_id !== userId) {
            res.status(403).json({ message: 'Forbidden: You do not own this task or task not found.' });
            return;
        }
        if (offer.offerStatus !== 'pending') {
            res.status(400).json({ message: `Cannot reject an offer that is currently '${offer.offerStatus}'. Only 'pending' offers can be rejected.` });
            return;
        }

        const rejectedOffer = await updateOfferStatus(offerId, 'rejected');
        if (!rejectedOffer) {
            res.status(500).json({ message: 'Failed to reject offer.' });
            return;
        }

        res.json({ message: 'Offer rejected.', offer: rejectedOffer });
    } catch (error) {
        console.error('Reject offer error:', error);
        res.status(500).json({ message: 'Server error rejecting offer', error: (error as Error).message });
    }
};

/**
 * @desc Add a progress update to a task
 * @route POST /api/v1/tasks/:taskId/progress
 * @access Private (Accepted Provider)
 */
export const updateTaskProgressHandler = async (req: AuthRequest, res: Response) => {
    try {
        const { taskId } = req.params;
        const { description }: CreateTaskProgressRequest = req.body;
        const providerId = req.user?.id; // Authenticated user is the provider

        // Ensure only providers can add progress updates
        if (!providerId || req.user?.role !== UserRole.Provider) {
            res.status(403).json({ message: 'Forbidden: Only providers can add task progress updates.' });
            return;
        }
        if (!description) {
            res.status(400).json({ message: 'Description is required for a progress update.' });
            return;
        }


        const task = await findTaskById(taskId);
        if (!task) {
            res.status(404).json({ message: 'Task not found.' });
            return;
        }

        // Authorization: Ensure the logged-in user is the provider who accepted this task
        const acceptedOffer = await findOfferByProviderIdAndTaskId(providerId, taskId, 'accepted');
        if (!acceptedOffer) {
           res.status(403).json({ message: 'You are not the accepted provider for this task.' });
           return;
        }

        // Check if task is actually in progress
        if (task.status !== 'in_progress') {
            res.status(400).json({ message: 'Task is not in progress. Cannot add progress update.' });
            return;
        }

        const newProgress = await createTaskProgressUpdate(taskId, providerId, description);

        res.status(201).json({ message: 'Progress update added successfully.', progress: newProgress });

    } catch (error) {
        console.error('[updateTaskProgressHandler] Error adding task progress:', error);
        res.status(500).json({ message: 'Server error adding task progress.', error: (error as Error).message });
    }
};

/**
 * @desc Get all progress updates for a task
 * @route GET /api/v1/tasks/:taskId/progress
 * @access Private (Task Owner or Accepted Provider)
 */
export const getTaskProgressController = async (req: AuthRequest, res: Response) => {
    try {
        const { taskId } = req.params;
        const userId = req.user?.id;

        if (!userId) {
            res.status(401).json({ message: 'Not authenticated.' });
            return;
        }

        const task = await findTaskById(taskId);
        if (!task) {
            res.status(404).json({ message: 'Task not found.' });
            return;
        }

        // Authorization: Only task owner OR accepted provider can view progress
        const isTaskOwner = task.user_id === userId;
        const acceptedOffer = await findOfferByProviderIdAndTaskId(userId, taskId, 'accepted');
        const isAcceptedProvider = !!acceptedOffer;

        if (!isTaskOwner && !isAcceptedProvider) {
            res.status(403).json({ message: 'You are not authorized to view progress updates for this task.' });
            return;
        }

        const progressUpdates = await getTaskProgressUpdates(taskId);

        res.status(200).json(progressUpdates);

    } catch (error) {
        console.error('[getTaskProgressController] Error fetching task progress:', error);
        res.status(500).json({ message: 'Server error fetching task progress.', error: (error as Error).message });
    }
};


export const markTaskCompletedHandler = async (req: AuthRequest, res: Response) => {
    try {
        const taskId = req.params.id;
        const providerId = req.user?.id;

        // Only providers can mark tasks as completed
        if (!providerId || req.user?.role !== UserRole.Provider) {
            res.status(403).json({ message: 'Forbidden: Only providers can mark tasks as completed.' });
            return;
        }
        if (!taskId) {
            res.status(400).json({ message: 'Task ID is required.' });
            return;
        }

        const task = await findTaskById(taskId);
        if (!task) {
            res.status(404).json({ message: 'Task not found.' });
            return;
        }

        // Verify that the current provider is the one accepted for this task
        const acceptedOffer = await findAcceptedOfferForTask(taskId);
        if (!acceptedOffer || acceptedOffer.providerId !== providerId) {
            res.status(403).json({ message: 'Forbidden: You are not the accepted provider for this task.' });
            return;
        }

        // Only tasks in 'in_progress' status can be marked as completed
        if (task.status !== 'in_progress') {
            res.status(400).json({ message: `Bad Request: Task status is '${task.status}'. Only 'in_progress' tasks can be marked as completed.` });
            return;
        }

        // Update task status to 'completed_pending_review'
        const updatedTask = await updateTaskStatus(taskId, 'completed_pending_review');
        res.json({ message: 'Task marked as completed, pending user review.', task: updatedTask });
    } catch (error) {
        console.error('Mark task completed error:', error);
        res.status(500).json({ message: 'Server error marking task completed', error: (error as Error).message });
    }
};

export const acceptTaskCompletionHandler = async (req: AuthRequest, res: Response) => {
    try {
        const taskId = req.params.id;
        const userId = req.user?.id; // This is the Requester's ID

        // Only requesters can accept task completion
        if (!userId || req.user?.role !== UserRole.Requester) {
            res.status(403).json({ message: 'Forbidden: Only requesters can accept task completion.' });
            return;
        }
        if (!taskId) {
            res.status(400).json({ message: 'Task ID is required.' });
            return;
        }

        const task = await findTaskById(taskId);
        // Ensure the task exists and the user is the owner
        if (!task || task.user_id !== userId) {
            res.status(403).json({ message: 'Forbidden: You do not own this task or task not found.' });
            return;
        }
        // Task must be in 'completed_pending_review' status
        if (task.status !== 'completed_pending_review') {
            res.status(400).json({ message: `Bad Request: Task status is '${task.status}'. Only tasks pending review can be accepted.` });
            return;
        }

        // Update task status to 'closed'
        const updatedTask = await updateTaskStatus(taskId, 'closed');
        res.json({ message: 'Task completion accepted. Task closed.', task: updatedTask });
    } catch (error) {
        console.error('Accept task completion error:', error);
        res.status(500).json({ message: 'Server error accepting task completion', error: (error as Error).message });
    }
};

export const rejectTaskCompletionHandler = async (req: AuthRequest, res: Response) => {
    try {
        const taskId = req.params.id;
        const userId = req.user?.id; // This is the Requester's ID

        // Only requesters can reject task completion
        if (!userId || req.user?.role !== UserRole.Requester) {
            res.status(403).json({ message: 'Forbidden: Only requesters can reject task completion.' });
            return;
        }
        if (!taskId) {
            res.status(400).json({ message: 'Task ID is required.' });
            return;
        }

        const task = await findTaskById(taskId);
        // Ensure the task exists and the user is the owner
        if (!task || task.user_id !== userId) {
            res.status(403).json({ message: 'Forbidden: You do not own this task or task not found.' });
            return;
        }
        // Task must be in 'completed_pending_review' status
        if (task.status !== 'completed_pending_review') {
            res.status(400).json({ message: `Bad Request: Task status is '${task.status}'. Only tasks pending review can be rejected.` });
            return;
        }

        // Revert task status to 'in_progress'
        const updatedTask = await updateTaskStatus(taskId, 'in_progress');
        res.json({ message: 'Task completion rejected. Task status reverted to in progress.', task: updatedTask });
    } catch (error) {
        console.error('Reject task completion error:', error);
        res.status(500).json({ message: 'Server error rejecting task completion', error: (error as Error).message });
    }
};

export const getProviderAcceptedTasksHandler = async (req: AuthRequest, res: Response) => {
    try {
        const providerId = req.user?.id;
        // Ensure only providers can view their accepted tasks
        if (!providerId || req.user?.role !== UserRole.Provider) {
            res.status(403).json({ message: 'Forbidden: Only providers can view their accepted tasks.' });
            return;
        }

        const tasks = await findAcceptedTasksForProvider(providerId);
        res.json(tasks);
    } catch (error) {
        console.error('Get provider accepted tasks error:', error);
        res.status(500).json({ message: 'Server error fetching accepted tasks', error: (error as Error).message });
    }
};