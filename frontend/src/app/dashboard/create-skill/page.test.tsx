import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import CreateSkillPage from './page';
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});
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
let canPostSkillMock = jest.fn(() => true);
let mockUser = { id: 'user1' };
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    canPostSkill: canPostSkillMock,
  }),
}));

describe('CreateSkillPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    canPostSkillMock = jest.fn(() => true);
    mockUser = { id: 'user1' };
  });

  it('renders form fields', () => {
    render(<CreateSkillPage />);
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/experience/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/nature of work/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/hourly rate/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/currency/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add skill/i })).toBeInTheDocument();
  });

  it('shows error if not authorized', async () => {
    canPostSkillMock = jest.fn(() => false);
    render(<CreateSkillPage />);
    fireEvent.change(screen.getByLabelText(/experience/i), { target: { value: '2 years' } });
    fireEvent.change(screen.getByLabelText(/hourly rate/i), { target: { value: '50' } });
    fireEvent.click(screen.getByRole('button', { name: /add skill/i }));
    await waitFor(() => {
      expect(screen.getByText(/you must be authorized to add a skill/i)).toBeInTheDocument();
    });
  });

  it('submits form and shows success, then redirects', async () => {
    mockPost.mockResolvedValueOnce({});
    render(<CreateSkillPage />);
    fireEvent.change(screen.getByLabelText(/experience/i), { target: { value: '5 years' } });
    fireEvent.change(screen.getByLabelText(/hourly rate/i), { target: { value: '100' } });
    fireEvent.click(screen.getByRole('button', { name: /add skill/i }));
    await waitFor(() => {
      expect(mockPost).toHaveBeenCalledWith('/skills', expect.objectContaining({
        experience: '5 years',
        hourlyRate: 100,
      }));
      expect(screen.getByText(/skill added successfully/i)).toBeInTheDocument();
      expect(push).toHaveBeenCalledWith('/dashboard/my-skills');
    });
  });

  it('shows API error message', async () => {
    mockPost.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<CreateSkillPage />);
    fireEvent.change(screen.getByLabelText(/experience/i), { target: { value: '1 year' } });
    fireEvent.change(screen.getByLabelText(/hourly rate/i), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /add skill/i }));
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('shows generic error if API error is not detailed', async () => {
    mockPost.mockRejectedValueOnce({});
    render(<CreateSkillPage />);
    fireEvent.change(screen.getByLabelText(/experience/i), { target: { value: '1 year' } });
    fireEvent.change(screen.getByLabelText(/hourly rate/i), { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: /add skill/i }));
    await waitFor(() => {
      expect(screen.getByText(/failed to add skill/i)).toBeInTheDocument();
    });
  });

  it('shows loading state on submit', async () => {
    let resolvePromise: any;
    mockPost.mockImplementation(
      () => new Promise(res => { resolvePromise = res; })
    );
    render(<CreateSkillPage />);
    fireEvent.change(screen.getByLabelText(/experience/i), { target: { value: '3 years' } });
    fireEvent.change(screen.getByLabelText(/hourly rate/i), { target: { value: '30' } });
    fireEvent.click(screen.getByRole('button', { name: /add skill/i }));
    expect(screen.getByRole('button', { name: /adding skill/i })).toBeDisabled();
    // Finish the promise to avoid act() warning
    act(() => resolvePromise({}));
  });
});

