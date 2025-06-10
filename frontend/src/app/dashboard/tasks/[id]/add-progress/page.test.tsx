import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import AddTaskProgressPage from './page';

// Mock useRouter and useParams
const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ id: '123' }),
}));

// Mock api
const mockGet = jest.fn();
const mockPost = jest.fn();
const mockPut = jest.fn();
jest.mock('../../../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    post: (...args: any[]) => mockPost(...args),
    put: (...args: any[]) => mockPut(...args),
  },
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

// Mock LoadingSpinner and ErrorMessage
jest.mock('../../../../../components/LoadingSpinner', () => () => <div>LoadingSpinner</div>);
jest.mock('../../../../../components/ErrorMessage', () => ({ message }: any) => <div>{message}</div>);

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(window, 'confirm').mockImplementation(() => true);
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
  (window.confirm as jest.Mock).mockRestore();
});

describe('AddTaskProgressPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'provider1' };
    mockAuthLoading = false;
  });

  it('shows loading spinner while loading', () => {
    mockAuthLoading = true;
    render(<AddTaskProgressPage />);
    expect(screen.getByText('LoadingSpinner')).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', async () => {
    mockUser = null;
    render(<AddTaskProgressPage />);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error if API fails', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<AddTaskProgressPage />);
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('shows error if task is not in progress', async () => {
    mockGet.mockResolvedValueOnce({
      data: { id: '123', taskName: 'Test Task', status: 'completed' },
    });
    render(<AddTaskProgressPage />);
    await waitFor(() => {
      expect(
        screen.getByText(/you are not able to add progress or mark this task complete because the task is not in progress/i)
      ).toBeInTheDocument();
    });
  });

it('shows error if task data is missing', async () => {
  mockGet.mockResolvedValueOnce({ data: null });
  render(<AddTaskProgressPage />);
  await waitFor(() => {
    expect(screen.getByText(/failed to load task details/i)).toBeInTheDocument();
  });
});
});