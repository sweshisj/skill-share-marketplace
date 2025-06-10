import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import BrowseTasksPage from './page';

// Mock TaskCard to just render the task name and a button for testing
jest.mock('../../../components/TaskCard', () => ({ task, onMakeOffer }: any) => (
  <div data-testid="task-card">
    <span>{task.taskName}</span>
    {onMakeOffer && (
      <button onClick={() => onMakeOffer(task.id)}>Make Offer</button>
    )}
  </div>
));

// Mock api
const mockGet = jest.fn();
jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
  },
}));

// Mock useRouter
const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// Mock useAuth
let mockUser: any = { id: 'user1' };
let mockAuthLoading = false;
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockAuthLoading,
  }),
}));

describe('BrowseTasksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'user1' };
    mockAuthLoading = false;
  });

  it('shows loading state', () => {
    mockAuthLoading = true;
    render(<BrowseTasksPage />);
    expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', async () => {
    mockUser = null;
    render(<BrowseTasksPage />);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error if api fails', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<BrowseTasksPage />);
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('shows empty state if no tasks', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<BrowseTasksPage />);
    await waitFor(() => {
      expect(screen.getByText(/no open tasks available/i)).toBeInTheDocument();
    });
  });

  it('renders tasks and handles Make Offer', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { id: '1', taskName: 'Task One' },
        { id: '2', taskName: 'Task Two' },
      ],
    });
    render(<BrowseTasksPage />);
    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
      expect(screen.getByText('Task Two')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Make Offer')[0]);
    expect(push).toHaveBeenCalledWith('/dashboard/tasks/1/make-offer');
  });
});