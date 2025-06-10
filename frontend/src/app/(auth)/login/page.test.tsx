import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPage from './page';

// Mock next/link to render a regular anchor
jest.mock('next/link', () => ({ children, href, ...props }: any) => (
  <a href={href} {...props}>{children}</a>
));

// Mock useAuth
const login = jest.fn();
const useAuthMock = {
  login,
  loading: false,
};
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock,
}));

describe('LoginPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.loading = false;
  });

  it('renders login form', () => {
    render(<LoginPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account/i)).toBeInTheDocument();
  });

  it('calls login with email and password', async () => {
    login.mockResolvedValueOnce(undefined);
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pw123' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(login).toHaveBeenCalledWith({ email: 'test@example.com', password: 'pw123' });
    });
  });

  it('shows error message on login failure', async () => {
    login.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } });
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'fail@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpw' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });

  it('shows generic error message if error response is missing', async () => {
    login.mockRejectedValueOnce({});
    render(<LoginPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'fail@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpw' } });
    fireEvent.click(screen.getByRole('button', { name: /login/i }));
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
  });

  it('shows loading state on submit', () => {
    useAuthMock.loading = true;
    render(<LoginPage />);
    expect(screen.getByRole('button', { name: /logging in/i })).toBeDisabled();
  });
});