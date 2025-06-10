import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CreateTaskPage from './page';

// Mock useRouter
const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// Mock api
const mockPost = jest.fn();
jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    post: (...args: any[]) => mockPost(...args),
  },
}));

// Mock useAuth
let canPostTaskMock = jest.fn(() => true);
let mockUser = { id: 'user1' };
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    canPostTask: canPostTaskMock,
  }),
}));

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

describe('CreateTaskPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    canPostTaskMock = jest.fn(() => true);
    mockUser = { id: 'user1' };
  });

  it('renders form fields', () => {
    render(<CreateTaskPage />);
    expect(screen.getByLabelText(/task name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/description/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expected start date/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/expected working hours/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hourly rate offered/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /post task/i })).toBeInTheDocument();
  });

  it('shows error if not authorized', async () => {
    canPostTaskMock = jest.fn(() => false);
    render(<CreateTaskPage />);
    fireEvent.change(screen.getByLabelText(/task name/i), { target: { value: 'Test Task' } });
    fireEvent.click(screen.getByRole('button', { name: /post task/i }));
    await waitFor(() => {
      expect(screen.getByText(/you must be authorized to post a task/i)).toBeInTheDocument();
    });
  });

  it('submits form and shows success, then redirects', async () => {
    mockPost.mockResolvedValueOnce({});
    render(<CreateTaskPage />);
    fireEvent.change(screen.getByLabelText(/task name/i), { target: { value: 'Test Task' } });
    fireEvent.change(screen.getByLabelText(/description/i), { target: { value: 'A test task' } });
    fireEvent.change(screen.getByLabelText(/expected working hours/i), { target: { value: '2' } });
    fireEvent.change(screen.getByLabelText(/hourly rate offered/i), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /post task/i }));
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/tasks', expect.objectContaining({
        taskName: 'Test Task',
        description: 'A test task',
        expectedWorkingHours: 2,
        hourlyRateOffered: 50,
      }));
      expect(screen.getByText(/task posted successfully/i)).toBeInTheDocument();
      expect(push).toHaveBeenCalledWith('/dashboard/my-tasks');
    });
  });

  it('shows API error message', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<CreateTaskPage />);
    fireEvent.change(screen.getByLabelText(/task name/i), { target: { value: 'Test Task' } });
    fireEvent.click(screen.getByRole('button', { name: /post task/i }));
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('shows generic error if API error is not detailed', async () => {
    mockPost.mockRejectedValueOnce({});
    render(<CreateTaskPage />);
    fireEvent.change(screen.getByLabelText(/task name/i), { target: { value: 'Test Task' } });
    fireEvent.click(screen.getByRole('button', { name: /post task/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed to create task/i)).toBeInTheDocument();
    });
  });

  it('shows loading state on submit', async () => {
    let resolvePromise: any;
    mockPost.mockImplementation(
      () => new Promise(res => { resolvePromise = res; })
    );
    render(<CreateTaskPage />);
    fireEvent.change(screen.getByLabelText(/task name/i), { target: { value: 'Test Task' } });
    fireEvent.click(screen.getByRole('button', { name: /post task/i }));
    expect(screen.getByRole('button', { name: /posting task/i })).toBeDisabled();
    // Finish the promise to avoid act() warning
    act(() => resolvePromise({}));
  });
});