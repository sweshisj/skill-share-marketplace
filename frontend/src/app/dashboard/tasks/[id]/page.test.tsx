jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useParams: jest.fn(),
}));

import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TaskDetailsPage from './page';
import { useParams } from 'next/navigation';

// Mock api
const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('../../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
  },
}));

// Mock useRouter and useParams
const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ id: '123' }),
}));

// Mock useAuth
let mockUser: any = { id: 'provider1' };
let mockAuthLoading = false;
jest.mock('../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockAuthLoading,
  }),
}));

beforeAll(() => {
  jest.spyOn(window, 'alert').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (window.alert as jest.Mock).mockRestore();
  (console.error as jest.Mock).mockRestore();
});

describe('TaskDetailsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'provider1' };
    mockAuthLoading = false;
  });

  it('shows loading state', () => {
    mockAuthLoading = true;
    render(<TaskDetailsPage />);
    expect(screen.getByText(/loading task/i)).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', async () => {
    mockUser = null;
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error if API fails', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('shows not found if task is missing', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: 'not found' } } });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/failed to load task details/i)).toBeInTheDocument();
    });
  });

  it('shows task and no progress updates', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: '123', userId: 'someoneelse', providerId: 'provider1', taskName: 'Test Task', status: 'in_progress', description: 'desc' },
    });
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/task: test task/i)).toBeInTheDocument();
      expect(screen.getByText(/no progress updates yet/i)).toBeInTheDocument();
    });
  });

  it('shows task and progress updates', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: '123', userId: 'someoneelse', providerId: 'provider1', taskName: 'Test Task', status: 'in_progress', description: 'desc' },
    });
    mockGet.mockResolvedValueOnce({
      data: [
        { id: 'p1', createdAt: '2024-01-01T12:00:00Z', description: 'First update', providerId: 'provider1' },
        { id: 'p2', createdAt: '2024-01-02T13:00:00Z', description: 'Second update', providerId: 'provider1' },
      ],
    });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/task: test task/i)).toBeInTheDocument();
      expect(screen.getByText(/first update/i)).toBeInTheDocument();
      expect(screen.getByText(/second update/i)).toBeInTheDocument();
    });
  });

  it('shows not authorized if user is not provider', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: '123', userId: 'someoneelse', providerId: 'other', taskName: 'Test Task', status: 'in_progress', description: 'desc' },
    });
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.queryByText(/submit progress update/i)).not.toBeInTheDocument();
    });
  });

  it('hides form if task is not in progress', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: '123', userId: 'someoneelse', providerId: 'provider1', taskName: 'Test Task', status: 'completed', description: 'desc' },
    });
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.queryByText(/submit progress update/i)).not.toBeInTheDocument();
      expect(screen.getByText(/this task is no longer in progress/i)).toBeInTheDocument();
    });
  });
});