import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import EditSkillPage from './page';

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
let mockUser: any = { id: 'provider1', role: 'provider' };
let mockAuthLoading = false;
let mockIsAuthenticated = jest.fn(() => true);
jest.mock('../../../../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: mockAuthLoading,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

describe('EditSkillPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'provider1', role: 'provider' };
    mockAuthLoading = false;
    mockIsAuthenticated = jest.fn(() => true);
  });

  it('shows loading spinner while loading', () => {
    mockAuthLoading = true;
    render(<EditSkillPage />);
    expect(screen.getByText(/loading skill details/i)).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', async () => {
    mockIsAuthenticated = jest.fn(() => false);
    render(<EditSkillPage />);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login');
    });
  });

});