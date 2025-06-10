import { describe, it, expect, afterEach, jest } from '@jest/globals';
import httpMocks from 'node-mocks-http';
import {
  getTaskOffersController,
  createTaskHandler,
  updateTaskHandler,
} from '../taskController';

// Mock model functions
jest.mock('../../models/taskModel', () => ({
  findTaskById: jest.fn(),
  createTask: jest.fn(),
  updateTask: jest.fn(),
  findTasksByUserId: jest.fn(),
  findAllOpenTasks: jest.fn(),
  findAllTasks: jest.fn(),
  updateTaskStatus: jest.fn(),
  findAcceptedTasksForProvider: jest.fn(),
  createTaskProgressUpdate: jest.fn(),
  getTaskProgressUpdates: jest.fn(),
}));
jest.mock('../../models/offerModel', () => ({
  findOffersWithProviderDetailsByTaskId: jest.fn(),
  findOfferByProviderIdAndTaskId: jest.fn(),
  createOffer: jest.fn(),
  findOfferById: jest.fn(),
  updateOfferStatus: jest.fn(),
  findOffersByTaskId: jest.fn(),
  findAcceptedOfferForTask: jest.fn(),
}));

import {
  findTaskById,
  createTask,
  updateTask,
  findTasksByUserId,
} from '../../models/taskModel';
import { findOffersWithProviderDetailsByTaskId } from '../../models/offerModel';

describe('taskController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getTaskOffersController', () => {
    it('returns 401 if user is not authenticated', async () => {
      const req = httpMocks.createRequest({ params: { taskId: 'task1' } });
      req.user = undefined;
      const res = httpMocks.createResponse();

      await getTaskOffersController(req as any, res as any);

      expect(res.statusCode).toBe(401);
    });

    it('returns 403 if user is not the task owner', async () => {
      (findTaskById as any).mockResolvedValue({ user_id: 'otherUser' });
      const req = httpMocks.createRequest({ params: { taskId: 'task1' } });
      req.user = { id: 'user1' };
      const res = httpMocks.createResponse();

      await getTaskOffersController(req as any, res as any);

      expect(res.statusCode).toBe(403);
    });

    it('returns 200 with empty array if no offers', async () => {
      (findTaskById as any).mockResolvedValue({ user_id: 'user1' });
      (findOffersWithProviderDetailsByTaskId as any).mockResolvedValue([]);
      const req = httpMocks.createRequest({ params: { taskId: 'task1' } });
      req.user = { id: 'user1' };
      const res = httpMocks.createResponse();

      await getTaskOffersController(req as any, res as any);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual([]);
    });

    it('returns offers with providers', async () => {
      (findTaskById as any).mockResolvedValue({ user_id: 'user1' });
      (findOffersWithProviderDetailsByTaskId as any).mockResolvedValue([{ id: 'offer1' }]);
      const req = httpMocks.createRequest({ params: { taskId: 'task1' } });
      req.user = { id: 'user1' };
      const res = httpMocks.createResponse();

      await getTaskOffersController(req as any, res as any);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual([{ id: 'offer1' }]);
    });
  });

  describe('createTaskHandler', () => {
    it('returns 403 if not requester', async () => {
      const req = httpMocks.createRequest({ body: {} });
      req.user = { id: 'user1', role: 'provider' };
      const res = httpMocks.createResponse();

      await createTaskHandler(req as any, res as any);

      expect(res.statusCode).toBe(403);
    });

    it('returns 400 if required fields are missing', async () => {
      const req = httpMocks.createRequest({ body: {} });
      req.user = { id: 'user1', role: 'requester' };
      const res = httpMocks.createResponse();

      await createTaskHandler(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 201 and creates task', async () => {
      (createTask as any).mockResolvedValue({ id: 'task1' });
      const req = httpMocks.createRequest({
        body: {
          taskName: 'Test Task',
          category: 'Tutoring',
          expectedStartDate: '2024-06-01',
          hourlyRateOffered: 50,
          rateCurrency: 'USD',
        },
      });
      req.user = { id: 'user1', role: 'requester' };
      const res = httpMocks.createResponse();

      await createTaskHandler(req as any, res as any);

      expect(res.statusCode).toBe(201);
      expect(res._getJSONData()).toEqual({ id: 'task1' });
    });
  });

  describe('updateTaskHandler', () => {
    it('returns 403 if not requester', async () => {
      const req = httpMocks.createRequest({ params: { id: 'task1' }, body: {} });
      req.user = { id: 'user1', role: 'provider' };
      const res = httpMocks.createResponse();

      await updateTaskHandler(req as any, res as any);

      expect(res.statusCode).toBe(403);
    });

    it('returns 400 if taskId is missing', async () => {
      const req = httpMocks.createRequest({ params: {}, body: {} });
      req.user = { id: 'user1', role: 'requester' };
      const res = httpMocks.createResponse();

      await updateTaskHandler(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 404 if task not found or not owned', async () => {
      (findTaskById as any).mockResolvedValue(null);
      const req = httpMocks.createRequest({ params: { id: 'task1' }, body: {} });
      req.user = { id: 'user1', role: 'requester' };
      const res = httpMocks.createResponse();

      await updateTaskHandler(req as any, res as any);

      expect(res.statusCode).toBe(404);
    });

    it('returns 400 if task is not open', async () => {
      (findTaskById as any).mockResolvedValue({ user_id: 'user1', status: 'in_progress' });
      const req = httpMocks.createRequest({ params: { id: 'task1' }, body: {} });
      req.user = { id: 'user1', role: 'requester' };
      const res = httpMocks.createResponse();

      await updateTaskHandler(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 200 and updates task', async () => {
      (findTaskById as any).mockResolvedValue({ user_id: 'user1', status: 'open' });
      (updateTask as any).mockResolvedValue({ id: 'task1', updated: true });
      const req = httpMocks.createRequest({ params: { id: 'task1' }, body: { taskName: 'Updated' } });
      req.user = { id: 'user1', role: 'requester' };
      const res = httpMocks.createResponse();

      await updateTaskHandler(req as any, res as any);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ id: 'task1', updated: true });
    });
  });
});