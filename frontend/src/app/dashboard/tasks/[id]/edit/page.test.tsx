import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditTaskPage from './page';

// Mock useRouter and useParams
const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ id: '123' }),
}));

// Mock api
const mockGet = jest.fn();
const mockPut = jest.fn();
jest.mock('../../../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

// Mock useAuth
let mockUser: any = { id: 'user1' };
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

describe('EditTaskPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'user1' };
    mockAuthLoading = false;
  });

  it('shows loading spinner while loading', () => {
    mockAuthLoading = true;
    render(<EditTaskPage />);
    expect(screen.getByText(/loading task details/i)).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', async () => {
    mockUser = null;
    render(<EditTaskPage />);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error if user is not the task owner', async () => {
    mockGet.mockResolvedValueOnce({
      data: {
        id: '123',
        userId: 'otherUser',
        category: 'Tutoring',
        taskName: 'Test Task',
        description: 'desc',
        expectedStartDate: new Date().toISOString(),
        expectedWorkingHours: 2,
        hourlyRateOffered: 50,
        rateCurrency: 'AUD',
        status: 'open',
      },
    });
    render(<EditTaskPage />);
    await waitFor(() => {
      expect(screen.getByText(/you are not authorized to edit this task/i)).toBeInTheDocument();
    });
  });

  it('shows error if API returns error', async () => {
    mockGet.mockRejectedValueOnce({
      response: { data: { message: 'API error' } },
    });
    render(<EditTaskPage />);
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });
});