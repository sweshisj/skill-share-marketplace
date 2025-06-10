import { describe, it, expect, afterEach, jest } from '@jest/globals';
import httpMocks from 'node-mocks-http';
import bcrypt from 'bcrypt';
import {
  registerUser,
  loginUser,
  getMyProfile,
} from '../authController';

// Mock model and utility functions
jest.mock('../../models/userModel', () => ({
  createUser: jest.fn(),
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
}));
jest.mock('../../utils/mapper', () => {
  const fn = jest.fn((user) => user);
  return {
    __esModule: true,
    default: fn,
    mapUserDBToUser: fn,
  };
});
jest.mock('bcrypt', () => {
  const actual = jest.requireActual('bcrypt') as object;
  return {
    ...(actual as object),
    genSalt: jest.fn(() => 'salt'),
    hash: jest.fn(() => 'hashed'),
    compare: jest.fn(() => true),
  };
});
jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    sign: jest.fn(() => 'mocked.jwt.token'),
  },
}));

import { createUser, findUserByEmail, findUserById } from '../../models/userModel';
import * as mapper from '../../utils/mapper';

describe('authController', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('returns 400 if required fields are missing', async () => {
      const req = httpMocks.createRequest({ body: { email: '', password: '', role: '', userType: '' } });
      const res = httpMocks.createResponse();

      await registerUser(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 if individual user missing fields', async () => {
      const req = httpMocks.createRequest({
        body: { email: 'a@b.com', password: 'pw', role: 'requester', userType: 'individual' },
      });
      const res = httpMocks.createResponse();

      await registerUser(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 if company user missing fields', async () => {
      const req = httpMocks.createRequest({
        body: { email: 'a@b.com', password: 'pw', role: 'provider', userType: 'company' },
      });
      const res = httpMocks.createResponse();

      await registerUser(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 if user already exists', async () => {
      (findUserByEmail as any).mockResolvedValue({ id: '1' });
      const req = httpMocks.createRequest({
        body: {
          email: 'a@b.com',
          password: 'pw',
          role: 'requester',
          userType: 'individual',
          firstName: 'A',
          lastName: 'B',
          address: 'Addr',
        },
      });
      const res = httpMocks.createResponse();

      await registerUser(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 201 and token for valid registration', async () => {
      (findUserByEmail as any).mockResolvedValue(null);
      (createUser as any).mockResolvedValue({
        id: '1',
        role: 'requester',
        userType: 'individual',
        email: 'a@b.com',
      });
      const req = httpMocks.createRequest({
        body: {
          email: 'a@b.com',
          password: 'pw',
          role: 'requester',
          userType: 'individual',
          firstName: 'A',
          lastName: 'B',
          address: 'Addr',
        },
      });
      const res = httpMocks.createResponse();

      await registerUser(req as any, res as any);

      expect(res.statusCode).toBe(201);
      expect(res._getJSONData()).toHaveProperty('token');
      expect(res._getJSONData()).toHaveProperty('user');
    });
  });

  describe('loginUser', () => {
    it('returns 400 if email or password missing', async () => {
      const req = httpMocks.createRequest({ body: { email: '', password: '' } });
      const res = httpMocks.createResponse();

      await loginUser(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 if user not found', async () => {
      (findUserByEmail as any).mockResolvedValue(null);
      const req = httpMocks.createRequest({ body: { email: 'a@b.com', password: 'pw' } });
      const res = httpMocks.createResponse();

      await loginUser(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns 400 if password does not match', async () => {
      (findUserByEmail as any).mockResolvedValue({ password_hash: 'hashed' });
      (bcrypt.compare as any).mockResolvedValue(false);
      const req = httpMocks.createRequest({ body: { email: 'a@b.com', password: 'wrong' } });
      const res = httpMocks.createResponse();

      await loginUser(req as any, res as any);

      expect(res.statusCode).toBe(400);
    });

    it('returns token and user on success', async () => {
      (findUserByEmail as any).mockResolvedValue({
        id: '1',
        password_hash: 'hashed',
        role: 'requester',
        user_type: 'individual',
        email: 'a@b.com',
      });
      (bcrypt.compare as any).mockResolvedValue(true);
      jest.mocked(mapper.mapUserDBToUser).mockImplementation((u: any) => u);
      const req = httpMocks.createRequest({ body: { email: 'a@b.com', password: 'pw' } });
      const res = httpMocks.createResponse();

      await loginUser(req as any, res as any);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toHaveProperty('token');
      expect(res._getJSONData()).toHaveProperty('user');
    });
  });

  describe('getMyProfile', () => {
    it('returns 401 if not authenticated', async () => {
      const req = httpMocks.createRequest();
      req.user = undefined;
      const res = httpMocks.createResponse();

      await getMyProfile(req as any, res as any);

      expect(res.statusCode).toBe(401);
    });

    it('returns 404 if user not found', async () => {
      (findUserById as any).mockResolvedValue(null);
      const req = httpMocks.createRequest();
      req.user = { id: '1' };
      const res = httpMocks.createResponse();

      await getMyProfile(req as any, res as any);

      expect(res.statusCode).toBe(404);
    });

    it('returns user profile on success', async () => {
      (findUserById as any).mockResolvedValue({ id: '1', email: 'a@b.com' });
      jest.mocked(mapper.mapUserDBToUser).mockImplementation((u: any) => u);
      const req = httpMocks.createRequest();
      req.user = { id: '1' };
      const res = httpMocks.createResponse();

      await getMyProfile(req as any, res as any);

      expect(res.statusCode).toBe(200);
      expect(res._getJSONData()).toHaveProperty('id', '1');
    });
  });
});