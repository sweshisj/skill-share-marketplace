// backend/src/controllers/taskController.ts
import { Request, Response } from 'express';
import { CreateTaskRequest, CreateTaskProgressRequest, UpdateTaskProgressRequest, UpdateTaskRequest, UserType, OfferWithProvider, ProviderPublicDetails, Offer } from '../types';
import {
    createTask, findTaskById, updateTask, findTasksByUserId, findAllOpenTasks, findAllTasks,
    updateTaskStatus, findAcceptedTasksForProvider, createTaskProgressUpdate, getTaskProgressUpdates,
} from '../models/taskModel';
import { createOffer, findOfferById, updateOfferStatus, findOffersByTaskId, findAcceptedOfferForTask } from '../models/offerModel';
import { mapTaskDBToTask, mapOfferDBToOffer } from '../utils/mapper';
import { findOffersWithProviderDetailsByTaskId, findOfferByProviderIdAndTaskId } from '../models/offerModel';
interface AuthRequest extends Request {
    user?: { id: string; userType: UserType; email: string };
    task?: any; // To hold task data from middleware
}

export const createTaskHandler = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            res.status(401).json({ message: 'User ID not found in token.' });
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
        const { id } = req.params; // Extract the ID from the URL parameter
        console.log(`[getTaskByIdController] Attempting to fetch task with ID: ${id}`); // DEBUG LOG

        const taskDB = await findTaskById(id); // Call your model function

        if (!taskDB) {
            console.log(`[getTaskByIdController] Task not found for ID: ${id}`); // DEBUG LOG
            res.status(404).json({ message: 'Task not found.' }); // Send 404 if not found
            return;
        }

        console.log(`[getTaskByIdController] Task found:`, taskDB); // DEBUG LOG
        res.json(mapTaskDBToTask(taskDB)); // Send the found task
    } catch (error) {
        console.error('[getTaskByIdController] Error fetching task by ID:', error); // DEBUG LOG
        res.status(500).json({ message: 'Server error fetching task.', error: (error as Error).message });
    }
};
export const getTaskOffersController = async (req: AuthRequest, res: Response) => {
    try {
        const { taskId } = req.params;
        console.log(`[getTaskOffersController] Attempting to fetch offers and provider details for Task ID: ${taskId}`);

        // Call the new model function to get offers with provider details
        const offersWithProviders: OfferWithProvider[] = await findOffersWithProviderDetailsByTaskId(taskId);

        if (offersWithProviders.length === 0) {
            console.log(`[getTaskOffersController] No offers found for Task ID: ${taskId}`);
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
        if (!taskId || !userId) {
            res.status(400).json({ message: 'Task ID and User ID are required.' });
            return;
        }

        const taskData: UpdateTaskRequest = req.body;

        const existingTask = req.task;
        if (!existingTask) {
            const fetchedTask = await findTaskById(taskId);
            if (!fetchedTask || fetchedTask.user_id !== userId) {
                res.status(404).json({ message: 'Task not found or you do not own it.' });
                return;
            }
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
        if (!userId) {
            res.status(401).json({ message: 'User ID not found in token.' });
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
        const { status } = req.query; // Get the 'status' query parameter

        let tasks;
        if (typeof status === 'string' && status) {
            // If status is provided, filter by it
            tasks = await findAllTasks(status);
        } else {
            // Otherwise, get all tasks
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
        if (!taskId || !providerId) {
            res.status(400).json({ message: 'Task ID and Provider ID are required.' });
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

        // Check if provider has already made an offer on this task
        const existingOffers = await findOffersByTaskId(taskId);
        const hasExistingOffer = existingOffers.some(offer => offer.providerId === providerId);
        if (hasExistingOffer) {
            res.status(400).json({ message: 'You have already made an offer on this task.' });
            return;
        }


        const newOffer = await createOffer(taskId, providerId, offerData);
        res.status(201).json(newOffer);
    } catch (error) {
        console.error('Make offer error:', error);
        if ((error as any).code === '23505') { // PostgreSQL unique violation code
            res.status(409).json({ message: 'You have already made an offer on this task.' });
            return;
        }
        res.status(500).json({ message: 'Server error making offer', error: (error as Error).message });
    }
};

export const acceptOfferHandler = async (req: AuthRequest, res: Response) => {
    try {
        const offerId = req.params.offerId;
        const userId = req.user?.id;
        if (!offerId || !userId) {
            res.status(400).json({ message: 'Offer ID and User ID are required.' });
            return;
        }

        const offer = await findOfferById(offerId);
        if (!offer) {
            res.status(404).json({ message: 'Offer not found.' });
            return;
        }

        const task = await findTaskById(offer.taskId);
        if (!task || task.user_id !== userId) {
            res.status(403).json({ message: 'Forbidden, you do not own this task or task not found.' });
            return;
        }
        if (task.status !== 'open') {
            res.status(400).json({ message: 'Task is no longer open for offers.' });
            return;
        }

        // Reject all other offers for this task
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

        // Update task status to in_progress
        await updateTaskStatus(offer.taskId, 'in_progress');

        res.json({ message: 'Offer accepted and task status updated.', offer: acceptedOffer });
    } catch (error) {
        console.error('Accept offer error:', error);
        res.status(500).json({ message: 'Server error accepting offer', error: (error as Error).message });
    }
};

export const rejectOfferHandler = async (req: AuthRequest, res: Response) => {
    try {
        const offerId = req.params.offerId;
        const userId = req.user?.id;
        if (!offerId || !userId) {
            res.status(400).json({ message: 'Offer ID and User ID are required.' });
            return;
        }

        const offer = await findOfferById(offerId);
        if (!offer) {
            res.status(404).json({ message: 'Offer not found.' });
            return;
        }

        const task = await findTaskById(offer.taskId);
        if (!task || task.user_id !== userId) {
            res.status(403).json({ message: 'Forbidden, you do not own this task or task not found.' });
            return;
        }
        if (offer.offerStatus !== 'pending') {
            res.status(400).json({ message: 'Cannot reject an offer that is not pending.' });
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

        if (!providerId || !description) {
            res.status(400).json({ message: 'Description and authenticated user ID are required.' });
            return
        }

        const task = await findTaskById(taskId);
        if (!task) {
            res.status(404).json({ message: 'Task not found.' });
            return;
        }

        // Authorization: Ensure the logged-in user is the provider who accepted this task
        // You'll need a way to check which provider accepted the task.
        // Assuming you have an 'acceptedOffer' field on the Task, or can query offers.
        // For simplicity, let's assume the task's 'providerId' is set when an offer is accepted.
        // If not, you might need to query `offers` table for the 'accepted' offer for this task.
        const acceptedOffer = await findOfferByProviderIdAndTaskId(providerId, taskId, 'accepted');

        if (!acceptedOffer) {
           res.status(403).json({ message: 'You are not the accepted provider for this task.' });
           return
        }

        // Check if task is actually in progress
        if (task.status !== 'in_progress') {
            res.status(400).json({ message: 'Task is not in progress. Cannot add progress update.' });
            return
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
        const isAcceptedProvider = !!acceptedOffer; // True if an accepted offer exists for this provider and task

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

        if (!taskId || !providerId) {
            res.status(400).json({ message: 'Task ID and Provider ID are required.' });
            return;
        }

        const task = await findTaskById(taskId);
        if (!task) {
            res.status(404).json({ message: 'Task not found.' });
            return;
        }

        const acceptedOffer = await findAcceptedOfferForTask(taskId);
        if (!acceptedOffer || acceptedOffer.providerId !== providerId) {
            res.status(403).json({ message: 'Forbidden, you are not the accepted provider for this task.' });
            return;
        }

        if (task.status !== 'in_progress') {
            res.status(400).json({ message: 'Task is not in progress. Cannot mark as completed.' });
            return;
        }

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
        const userId = req.user?.id;

        if (!taskId || !userId) {
            res.status(400).json({ message: 'Task ID and User ID are required.' });
            return;
        }

        const task = await findTaskById(taskId);
        if (!task || task.user_id !== userId) {
            res.status(403).json({ message: 'Forbidden, you do not own this task or task not found.' });
            return;
        }
        if (task.status !== 'completed_pending_review') {
            res.status(400).json({ message: 'Task is not pending completion review.' });
            return;
        }

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
        const userId = req.user?.id;

        if (!taskId || !userId) {
            res.status(400).json({ message: 'Task ID and User ID are required.' });
            return;
        }

        const task = await findTaskById(taskId);
        if (!task || task.user_id !== userId) {
            res.status(403).json({ message: 'Forbidden, you do not own this task or task not found.' });
            return;
        }
        if (task.status !== 'completed_pending_review') {
            res.status(400).json({ message: 'Task is not pending completion review.' });
            return;
        }

        const updatedTask = await updateTaskStatus(taskId, 'in_progress'); // Revert to in_progress
        res.json({ message: 'Task completion rejected. Task status reverted to in progress.', task: updatedTask });
    } catch (error) {
        console.error('Reject task completion error:', error);
        res.status(500).json({ message: 'Server error rejecting task completion', error: (error as Error).message });
    }
};

export const getProviderAcceptedTasksHandler = async (req: AuthRequest, res: Response) => {
    try {
        const providerId = req.user?.id;
        if (!providerId) {
            res.status(401).json({ message: 'Provider ID not found in token.' });
            return;
        }

        const tasks = await findAcceptedTasksForProvider(providerId);
        res.json(tasks);
    } catch (error) {
        console.error('Get provider accepted tasks error:', error);
        res.status(500).json({ message: 'Server error fetching accepted tasks', error: (error as Error).message });
    }
};