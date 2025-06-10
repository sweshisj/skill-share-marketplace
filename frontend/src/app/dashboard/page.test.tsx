import React from 'react';
import { render, screen } from '@testing-library/react';
import DashboardHomePage from './page';
import { UserRole } from '../../types';

// Mock next/link to render a regular anchor for testing
jest.mock('next/link', () => ({ children, href, className }: any) => (
  <a href={href} className={className}>{children}</a>
));

// Mock useAuth
let mockUser: any = null;
let mockIsAuthenticated = jest.fn();
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    isAuthenticated: mockIsAuthenticated,
  }),
}));

describe('DashboardHomePage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUser = null;
    mockIsAuthenticated = jest.fn();
  });

  it('shows login message if not authenticated', () => {
    mockIsAuthenticated.mockReturnValue(false);
    render(<DashboardHomePage />);
    expect(screen.getByText(/you must be logged in/i)).toBeInTheDocument();
  });

  it('shows requester links for requester role', () => {
    mockUser = { role: UserRole.Requester, firstName: 'Alice', email: 'alice@example.com' };
    mockIsAuthenticated.mockReturnValue(true);
    render(<DashboardHomePage />);
    expect(screen.getByText(/welcome to your dashboard, alice/i)).toBeInTheDocument();
    expect(screen.getByText(/my posted tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/post a new task/i)).toBeInTheDocument();
    // Should not show provider links
    expect(screen.queryByText(/my skills/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/my accepted tasks/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/browse open tasks/i)).not.toBeInTheDocument();
  });

  it('shows provider links for provider role', () => {
    mockUser = { role: UserRole.Provider, firstName: 'Bob', email: 'bob@example.com' };
    mockIsAuthenticated.mockReturnValue(true);
    render(<DashboardHomePage />);
    expect(screen.getByText(/welcome to your dashboard, bob/i)).toBeInTheDocument();
    expect(screen.getByText(/my skills/i)).toBeInTheDocument();
    expect(screen.getByText(/my accepted tasks/i)).toBeInTheDocument();
    expect(screen.getByText(/browse open tasks/i)).toBeInTheDocument();
    // Should not show requester links
    expect(screen.queryByText(/my posted tasks/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/post a new task/i)).not.toBeInTheDocument();
  });

  it('shows user email if firstName is missing', () => {
    mockUser = { role: UserRole.Requester, email: 'no-name@example.com' };
    mockIsAuthenticated.mockReturnValue(true);
    render(<DashboardHomePage />);
    expect(screen.getByText(/welcome to your dashboard, no-name@example.com/i)).toBeInTheDocument();
  });
});