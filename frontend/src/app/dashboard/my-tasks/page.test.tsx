import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MyTasksPage from './page';

// Mock TaskCard to just render the task name and action buttons for testing
jest.mock('../../../components/TaskCard', () => ({ task, onEdit, onViewOffers, onViewProgress }: any) => (
  <div data-testid="task-card">
    <span>{task.taskName}</span>
    {onEdit && <button onClick={() => onEdit(task.id)}>Edit</button>}
    {onViewOffers && <button onClick={() => onViewOffers(task.id)}>View Offers</button>}
    {onViewProgress && <button onClick={() => onViewProgress(task.id)}>View Progress</button>}
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

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

describe('MyTasksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'user1' };
    mockAuthLoading = false;
  });

  it('shows loading state', () => {
    mockAuthLoading = true;
    render(<MyTasksPage />);
    expect(screen.getByText(/loading tasks/i)).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', async () => {
    mockUser = null;
    render(<MyTasksPage />);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error if api fails', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<MyTasksPage />);
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('shows empty state if no tasks', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<MyTasksPage />);
    await waitFor(() => {
      expect(screen.getByText(/you haven't posted any tasks yet/i)).toBeInTheDocument();
      expect(screen.getByText(/post a new task/i)).toBeInTheDocument();
    });
  });

  it('renders tasks and handles edit, view offers, and view progress', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { id: '1', taskName: 'Task One' },
        { id: '2', taskName: 'Task Two' },
      ],
    });
    render(<MyTasksPage />);
    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
      expect(screen.getByText('Task Two')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Edit')[0]);
    expect(push).toHaveBeenCalledWith('/dashboard/tasks/1/edit');

    fireEvent.click(screen.getAllByText('View Offers')[0]);
    expect(push).toHaveBeenCalledWith('/dashboard/tasks/1/offers');

    fireEvent.click(screen.getAllByText('View Progress')[0]);
    expect(push).toHaveBeenCalledWith('/dashboard/tasks/1/progress');
  });
});