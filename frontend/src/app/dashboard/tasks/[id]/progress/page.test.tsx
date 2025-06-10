import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TaskDetailsPage from './page';

// Mock moment to just return the date string for simplicity
jest.mock('moment', () => (date: any) => ({
  format: (fmt: string) => typeof date === 'string' ? date : 'formatted-date',
}));

// Mock api
const mockGet = jest.fn();
const mockPost = jest.fn();
jest.mock('../../../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
  },
}));

// Mock useParams
jest.mock('next/navigation', () => ({
  useParams: () => ({ id: '123' }),
}));

// Mock useAuth
let mockUser: any = { id: 'provider1' };
let mockAuthLoading = false;
jest.mock('../../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockAuthLoading,
  }),
}));

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
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
    expect(screen.getByText(/loading task and progress/i)).toBeInTheDocument();
  });

  it('shows error if API fails', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('shows permission error if not owner or provider', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: '123', userId: 'someoneelse', providerId: 'other', taskName: 'Test Task', status: 'in_progress', description: 'desc' },
    });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/you are not authorized to view progress for this task/i)).toBeInTheDocument();
    });
  });

  it('shows not found if task is missing', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: 'not found' } } });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/not found/i)).toBeInTheDocument();
    });
  });

  it('shows task and no progress updates', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: '123', userId: 'provider1', providerId: 'provider1', taskName: 'Test Task', status: 'in_progress', description: 'desc' },
    });
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/task: "test task"/i)).toBeInTheDocument();
      expect(screen.getByText(/no progress updates yet/i)).toBeInTheDocument();
    });
  });

  it('shows task and progress updates', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: '123', userId: 'provider1', providerId: 'provider1', taskName: 'Test Task', status: 'in_progress', description: 'desc' },
    });
    mockGet.mockResolvedValueOnce({
      data: [
        { id: 'p1', createdAt: '2024-01-01T12:00:00Z', description: 'First update' },
        { id: 'p2', createdAt: '2024-01-02T13:00:00Z', description: 'Second update' },
      ],
    });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/task: "test task"/i)).toBeInTheDocument();
      expect(screen.getByText(/first update/i)).toBeInTheDocument();
      expect(screen.getByText(/second update/i)).toBeInTheDocument();
    });
  });

  it('allows accepted provider to submit progress', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: '123', userId: 'someoneelse', providerId: 'provider1', taskName: 'Test Task', status: 'in_progress', description: 'desc' },
    });
    mockGet.mockResolvedValueOnce({ data: [] });
    mockPost.mockResolvedValueOnce({
      data: { id: 'p3', createdAt: '2024-01-03T14:00:00Z', description: 'New progress' },
    });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/submit progress update/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/describe your progress here/i), { target: { value: 'New progress' } });
    fireEvent.click(screen.getByRole('button', { name: /add progress update/i }));
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/tasks/123/progress', { description: 'New progress' });
      expect(screen.getByText(/new progress/i)).toBeInTheDocument();
    });
  });

  it('shows error if progress submission fails', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: '123', userId: 'someoneelse', providerId: 'provider1', taskName: 'Test Task', status: 'in_progress', description: 'desc' },
    });
    mockGet.mockResolvedValueOnce({ data: [] });
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'Submit error' } } });
    render(<TaskDetailsPage />);
    await waitFor(() => {
      expect(screen.getByText(/submit progress update/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/describe your progress here/i), { target: { value: 'fail' } });
    fireEvent.click(screen.getByRole('button', { name: /add progress update/i }));
    await waitFor(() => {
      expect(screen.getByText(/submit error/i)).toBeInTheDocument();
    });
  });
});