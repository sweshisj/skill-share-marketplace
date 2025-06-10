import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../Navbar';
import { LoginRequest, CreateUserRequest, UserRole, UserType } from '@/src/types';

// Mock next/link to render a regular anchor
jest.mock('next/link', () => ({ children, href, ...props }: any) => (
  <a href={href} {...props}>{children}</a>
));

// Mock useRouter
const push = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push }),
}));

// --- Mock useAuth with a variable ---
let mockUseAuthReturn: any = {};
jest.mock('../../context/AuthContext', () => ({
  useAuth: () => mockUseAuthReturn,
}));

const logout = jest.fn();
const canPostTask = jest.fn();
const canPostSkill = jest.fn();

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login and signup links when not authenticated', () => {
    mockUseAuthReturn = {
      user: null,
      logout,
      canPostTask,
      canPostSkill,
      token: null,
      loading: false,
      login: function (credentials: LoginRequest): Promise<void> {
        throw new Error('Function not implemented.');
      },
      signup: function (userData: CreateUserRequest): Promise<void> {
        throw new Error('Function not implemented.');
      },
      isAuthenticated: function (): boolean {
        throw new Error('Function not implemented.');
      }
    };
    render(<Navbar />);
    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Sign Up')).toBeInTheDocument();
  });

  it('renders requester links when user can post task', () => {
    mockUseAuthReturn = {
      user: {
        firstName: 'Alice', email: 'alice@example.com',
        id: '',
        role: UserRole.Requester,
        userType: UserType.Individual,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      logout,
      canPostTask: () => true,
      canPostSkill: () => false,
      token: null,
      loading: false,
      login: function (credentials: LoginRequest): Promise<void> {
        throw new Error('Function not implemented.');
      },
      signup: function (userData: CreateUserRequest): Promise<void> {
        throw new Error('Function not implemented.');
      },
      isAuthenticated: function (): boolean {
        throw new Error('Function not implemented.');
      }
    };
    render(<Navbar />);
    expect(screen.getByText('My Tasks')).toBeInTheDocument();
    expect(screen.getByText('Post Task')).toBeInTheDocument();
    expect(screen.getByText('Hello, Alice!')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
  });

  it('renders provider links when user can post skill', () => {
    mockUseAuthReturn = {
      user: {
        firstName: '', companyName: 'Acme Inc', email: 'acme@example.com',
        id: '',
        role: UserRole.Requester,
        userType: UserType.Individual,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      logout,
      canPostTask: () => false,
      canPostSkill: () => true,
      token: null,
      loading: false,
      login: function (credentials: LoginRequest): Promise<void> {
        throw new Error('Function not implemented.');
      },
      signup: function (userData: CreateUserRequest): Promise<void> {
        throw new Error('Function not implemented.');
      },
      isAuthenticated: function (): boolean {
        throw new Error('Function not implemented.');
      }
    };
    render(<Navbar />);
    expect(screen.getByText('Browse Tasks')).toBeInTheDocument();
    expect(screen.getByText('My Skills')).toBeInTheDocument();
    expect(screen.getByText('Add Skill')).toBeInTheDocument();
    expect(screen.getByText('Accepted Tasks')).toBeInTheDocument();
    expect(screen.getByText('Hello, Acme Inc!')).toBeInTheDocument();
  });

  it('calls logout and redirects on logout button click', () => {
    mockUseAuthReturn = {
      user: {
        firstName: 'Bob', email: 'bob@example.com',
        id: '',
        role: UserRole.Requester,
        userType: UserType.Individual,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      logout,
      canPostTask: () => true,
      canPostSkill: () => false,
      token: null,
      loading: false,
      login: function (credentials: LoginRequest): Promise<void> {
        throw new Error('Function not implemented.');
      },
      signup: function (userData: CreateUserRequest): Promise<void> {
        throw new Error('Function not implemented.');
      },
      isAuthenticated: function (): boolean {
        throw new Error('Function not implemented.');
      }
    };
    render(<Navbar />);
    fireEvent.click(screen.getByText('Logout'));
    expect(logout).toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith('/login');
  });
});