import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import MakeOfferPage from './page';
// Mock useRouter and useParams
const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
  useParams: () => ({ id: '123' }),
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

describe('MakeOfferPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = { id: 'provider1' };
    mockAuthLoading = false;
  });

  it('shows loading spinner while loading', () => {
    mockAuthLoading = true;
    render(<MakeOfferPage />);
    expect(screen.getByText(/loading task details/i)).toBeInTheDocument();
  });

  it('redirects to login if not authenticated', async () => {
    mockUser = null;
    render(<MakeOfferPage />);
    await waitFor(() => {
      expect(push).toHaveBeenCalledWith('/login');
    });
  });

  it('shows error if API fails', async () => {
    mockGet.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
    render(<MakeOfferPage />);
    await waitFor(() => {
      expect(screen.getByText(/api error/i)).toBeInTheDocument();
    });
  });

});