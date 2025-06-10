import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MyAcceptedTasksPage from './page';

// Mock TaskCard to render task name and action buttons for testing
jest.mock('../../../../components/TaskCard', () => ({
  __esModule: true,
  default: ({ task, onAddTaskProgress, children }: any) => (
    <div data-testid="task-card">
      <span>{task.taskName || task.category || task.id}</span>
      {onAddTaskProgress && (
        <button onClick={() => onAddTaskProgress(task.id)}>Add Progress</button>
      )}
      {children}
    </div>
  ),
}));

// Mock api
const mockGet = jest.fn();
const mockPut = jest.fn();
jest.mock('../../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    put: (...args: any[]) => mockPut(...args),
  },
}));

// Mock useRouter
const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
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
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(window, 'confirm').mockImplementation(() => true);
  jest.spyOn(window, 'alert').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
  (window.confirm as jest.Mock).mockRestore();
  (window.alert as jest.Mock).mockRestore();
});

describe('MyAcceptedTasksPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'provider1' };
    mockAuthLoading = false;
  });

  it('shows loading state', () => {
    mockAuthLoading = true;
    render(<MyAcceptedTasksPage />);
    expect(screen.getByText(/loading accepted tasks/i)).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', async () => {
    mockUser = null;
    render(<MyAcceptedTasksPage />);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error if api fails', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<MyAcceptedTasksPage />);
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('shows empty state if no accepted tasks', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<MyAcceptedTasksPage />);
    await waitFor(() => {
      expect(screen.getByText(/you don't have any accepted tasks yet/i)).toBeInTheDocument();
      expect(screen.getByText(/browse open tasks/i)).toBeInTheDocument();
    });
  });

  it('renders accepted tasks and handles Add Progress', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { id: '1', taskName: 'Task One', status: 'in_progress', providerId: 'provider1' },
        { id: '2', taskName: 'Task Two', status: 'completed_pending_review', providerId: 'provider1' },
      ],
    });
    render(<MyAcceptedTasksPage />);
    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
      expect(screen.getByText('Task Two')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Add Progress'));
    expect(push).toHaveBeenCalledWith('/dashboard/tasks/1/add-progress');
  });

  it('handles Mark Completed action', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { id: '1', taskName: 'Task One', status: 'in_progress', providerId: 'provider1' },
      ],
    });
    mockPut.mockResolvedValueOnce({});
    render(<MyAcceptedTasksPage />);
    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/mark completed/i));
    await waitFor(() => {
      expect(mockPut).toHaveBeenCalledWith('/tasks/1', { status: 'completed_pending_review' });
      expect(window.alert).toHaveBeenCalledWith('Task status updated to completed pending review!');
    });
  });

  it('shows error if Mark Completed fails', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { id: '1', taskName: 'Task One', status: 'in_progress', providerId: 'provider1' },
      ],
    });
    mockPut.mockRejectedValueOnce({ response: { data: { message: 'Update error' } } });
    render(<MyAcceptedTasksPage />);
    await waitFor(() => {
      expect(screen.getByText('Task One')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText(/mark completed/i));
    await waitFor(() => {
      expect(screen.getByText(/update error/i)).toBeInTheDocument();
    });
  });
});