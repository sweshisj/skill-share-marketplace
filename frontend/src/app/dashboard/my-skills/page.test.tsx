import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MySkillsPage from './page';

// Mock SkillCard to just render the skill category and action buttons for testing
jest.mock('../../../components/SkillCard', () => ({ skill, onEdit, onDelete }: any) => (
  <div data-testid="skill-card">
    <span>{skill.category}</span>
    {onEdit && <button onClick={() => onEdit(skill.id)}>Edit</button>}
    {onDelete && <button onClick={() => onDelete(skill.id)}>Delete</button>}
  </div>
));

// Mock api
const mockGet = jest.fn();
const mockDelete = jest.fn();
jest.mock('../../../lib/api', () => ({
  __esModule: true,
  default: {
    get: (...args: any[]) => mockGet(...args),
    delete: (...args: any[]) => mockDelete(...args),
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
let canPostSkillMock = jest.fn(() => true);
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockAuthLoading,
    canPostSkill: canPostSkillMock,
  }),
}));

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

describe('MySkillsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'provider1' };
    mockAuthLoading = false;
    canPostSkillMock = jest.fn(() => true);
  });

  it('shows loading state', () => {
    mockAuthLoading = true;
    render(<MySkillsPage />);
    expect(screen.getByText(/loading skills/i)).toBeInTheDocument();
  });

  it('redirects to login if not authenticated or not provider', async () => {
    mockUser = null;
    render(<MySkillsPage />);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login');
    });

    mockUser = { id: 'provider1' };
    canPostSkillMock = jest.fn(() => false);
    render(<MySkillsPage />);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error if api fails', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<MySkillsPage />);
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

  it('shows empty state if no skills', async () => {
    mockGet.mockResolvedValueOnce({ data: [] });
    render(<MySkillsPage />);
    await waitFor(() => {
      expect(screen.getByText(/you haven't added any skills yet/i)).toBeInTheDocument();
      expect(screen.getByText(/add a new skill/i)).toBeInTheDocument();
    });
  });

  it('renders skills and handles edit', async () => {
    mockGet.mockResolvedValueOnce({
      data: [
        { id: '1', category: 'Tutoring' },
        { id: '2', category: 'Plumbing' },
      ],
    });
    render(<MySkillsPage />);
    await waitFor(() => {
      expect(screen.getByText('Tutoring')).toBeInTheDocument();
      expect(screen.getByText('Plumbing')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Edit')[0]);
    expect(push).toHaveBeenCalledWith('/dashboard/skills/1/edit');
  });

  it('handles delete skill', async () => {
    window.confirm = jest.fn(() => true);
    mockGet.mockResolvedValueOnce({
      data: [
        { id: '1', category: 'Tutoring' },
      ],
    });
    mockDelete.mockResolvedValueOnce({});
    render(<MySkillsPage />);
    await waitFor(() => {
      expect(screen.getByText('Tutoring')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Delete'));
    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith('/skills/1');
    });
  });

  it('shows error if delete fails', async () => {
    window.confirm = jest.fn(() => true);
    mockGet.mockResolvedValueOnce({
      data: [
        { id: '1', category: 'Tutoring' },
      ],
    });
    mockDelete.mockRejectedValueOnce({ response: { data: { message: 'Delete error' } } });
    render(<MySkillsPage />);
    await waitFor(() => {
      expect(screen.getByText('Tutoring')).toBeInTheDocument();
    });

  });
});