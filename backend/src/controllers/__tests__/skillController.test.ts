import { describe, it, expect, afterEach, jest } from '@jest/globals';
import httpMocks from 'node-mocks-http';
import {
  createSkillHandler,
  updateSkillHandler,
  getSkillHandler,
  getMySkillsHandler,
  deleteUserSkillHandler,
} from '../skillController';

// Mock model functions
jest.mock('../../models/skillModel', () => ({
  createSkill: jest.fn(),
  findSkillById: jest.fn(),
  updateSkill: jest.fn(),
  findSkillsByProviderId: jest.fn(),
  deleteUserSkill: jest.fn(),
  findSkillBySkillId: jest.fn(),
}));

import {
  createSkill,
  findSkillById,
  updateSkill,
  findSkillsByProviderId,
  deleteUserSkill,
  findSkillBySkillId,
} from '../../models/skillModel';

describe('Skill Controller', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createSkillHandler', () => {
    it('returns 401 if providerId is missing', async () => {
      const req = httpMocks.createRequest({ body: {} });
      const res = httpMocks.createResponse();
      req.user = undefined;

      await createSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(401);
    });

    it('returns 400 if required fields are missing', async () => {
      const req = httpMocks.createRequest({ body: { category: '' } });
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await createSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 201 and creates skill', async () => {
      (createSkill as any).mockResolvedValue({ id: 'skill1' });
      const req = httpMocks.createRequest({
        body: {
          category: 'Tutoring',
          experience: '2 years',
          natureOfWork: 'onsite',
          hourlyRate: 50,
          rateCurrency: 'USD',
        },
      });
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await createSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(201);
      expect(res._getJSONData()).toEqual({ id: 'skill1' });
    });
  });

  describe('updateSkillHandler', () => {
    it('returns 401 if providerId is missing', async () => {
      const req = httpMocks.createRequest({ params: { id: 'skill1' }, body: {} });
      req.user = undefined;
      const res = httpMocks.createResponse();

      await updateSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(401);
    });

    it('returns 400 if skillId is missing', async () => {
      const req = httpMocks.createRequest({ params: {}, body: {} });
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await updateSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 404 if skill not found', async () => {
      (findSkillById as any).mockResolvedValue(null);
      const req = httpMocks.createRequest({ params: { id: 'skill1' }, body: {} });
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await updateSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(404);
    });

    it('returns 403 if provider does not own skill', async () => {
      (findSkillById as any).mockResolvedValue({ provider_id: 'other' });
      const req = httpMocks.createRequest({ params: { id: 'skill1' }, body: {} });
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await updateSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(403);
    });

    it('returns 400 if update fails', async () => {
      (findSkillById as any).mockResolvedValue({ provider_id: 'provider1' });
      (updateSkill as any).mockResolvedValue(null);
      const req = httpMocks.createRequest({ params: { id: 'skill1' }, body: {} });
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await updateSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 200 and updated skill', async () => {
      (findSkillById as any).mockResolvedValue({ provider_id: 'provider1' });
      (updateSkill as any).mockResolvedValue({ id: 'skill1', updated: true });
      const req = httpMocks.createRequest({ params: { id: 'skill1' }, body: { hourlyRate: 60 } });
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await updateSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ id: 'skill1', updated: true });
    });
  });

  describe('getSkillHandler', () => {
    it('returns skill by id', async () => {
      (findSkillBySkillId as any).mockResolvedValue({ id: 'skill1' });
      const req = httpMocks.createRequest({ params: { id: 'skill1' } });
      const res = httpMocks.createResponse();

      await getSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ id: 'skill1' });
    });
  });

  describe('getMySkillsHandler', () => {
    it('returns 401 if providerId is missing', async () => {
      const req = httpMocks.createRequest();
      req.user = undefined;
      const res = httpMocks.createResponse();

      await getMySkillsHandler(req as any, res as any);

      expect(res.statusCode).toBe(401);
    });

    it('returns skills for provider', async () => {
      (findSkillsByProviderId as any).mockResolvedValue([{ id: 'skill1' }]);
      const req = httpMocks.createRequest();
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await getMySkillsHandler(req as any, res as any);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual([{ id: 'skill1' }]);
    });
  });

  describe('deleteUserSkillHandler', () => {
    it('returns 401 if not authenticated', async () => {
      const req = httpMocks.createRequest({ params: { id: 'skill1' } });
      req.user = undefined;
      const res = httpMocks.createResponse();

      await deleteUserSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(401);
    });

    it('returns 400 if skillId to delete is missing', async () => {
      const req = httpMocks.createRequest({ params: {} });
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await deleteUserSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 404 if skill not found or not authorized', async () => {
      (deleteUserSkill as any).mockResolvedValue(0);
      const req = httpMocks.createRequest({ params: { id: 'skill1' } });
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await deleteUserSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(404);
    });

    it('returns 200 if skill deleted', async () => {
      (deleteUserSkill as any).mockResolvedValue(1);
      const req = httpMocks.createRequest({ params: { id: 'skill1' } });
      req.user = { id: 'provider1' };
      const res = httpMocks.createResponse();

      await deleteUserSkillHandler(req as any, res as any);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toEqual({ message: 'User skill deleted successfully.' });
    });
  });
});