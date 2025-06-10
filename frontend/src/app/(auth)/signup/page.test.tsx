import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SignupPage from './page';

// Mock next/link to render a regular anchor
jest.mock('next/link', () => ({ children, href, ...props }: any) => (
  <a href={href} {...props}>{children}</a>
));

// Mock useAuth
const signup = jest.fn();
const useAuthMock = {
  signup,
  loading: false,
};
jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => useAuthMock,
}));

describe('SignupPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuthMock.loading = false;
  });

  it('renders signup form', () => {
    render(<SignupPage />);
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account/i)).toBeInTheDocument();
  });

  it('calls signup with correct data for individual', async () => {
    signup.mockResolvedValueOnce(undefined);
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'ind@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'longenough' } });
    fireEvent.change(screen.getByLabelText(/^first name:/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/^last name:/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/street number/i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/street name/i), { target: { value: 'Main St' } });
    fireEvent.change(screen.getByLabelText(/city\/suburb/i), { target: { value: 'Sydney' } });
    fireEvent.change(screen.getByLabelText(/^state:/i), { target: { value: 'NSW' } });
    fireEvent.change(screen.getByLabelText(/post code/i), { target: { value: '2000' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(signup).toHaveBeenCalled();
      expect(signup.mock.calls[0][0]).toMatchObject({
        email: 'ind@example.com',
        firstName: 'John',
        lastName: 'Doe',
        address: expect.objectContaining({
          streetNumber: '123',
          streetName: 'Main St',
          citySuburb: 'Sydney',
          state: 'NSW',
          postCode: '2000',
        }),
      });
    });
  });

  it('calls signup with correct data for company', async () => {
    signup.mockResolvedValueOnce(undefined);
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText(/account type/i), { target: { value: 'company' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'biz@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'longenough' } });
    fireEvent.change(screen.getByLabelText(/company name/i), { target: { value: 'Acme Inc' } });
    fireEvent.change(screen.getByLabelText(/business tax number/i), { target: { value: 'ABC1234567' } });
    fireEvent.change(screen.getByLabelText(/representative first name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/representative last name/i), { target: { value: 'Smith' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(signup).toHaveBeenCalled();
      expect(signup.mock.calls[0][0]).toMatchObject({
        email: 'biz@example.com',
        companyName: 'Acme Inc',
        businessTaxNumber: 'ABC1234567',
        firstName: 'Alice',
        lastName: 'Smith',
      });
    });
  });

  it('shows error message on signup failure', async () => {
    signup.mockRejectedValueOnce({ response: { data: { message: 'Email already exists' } } });
    render(<SignupPage />);
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'fail@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'longenough' } });
    fireEvent.change(screen.getByLabelText(/^first name:/i), { target: { value: 'John' } });
    fireEvent.change(screen.getByLabelText(/^last name:/i), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByLabelText(/street number/i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/street name/i), { target: { value: 'Main St' } });
    fireEvent.change(screen.getByLabelText(/city\/suburb/i), { target: { value: 'Sydney' } });
    fireEvent.change(screen.getByLabelText(/^state:/i), { target: { value: 'NSW' } });
    fireEvent.change(screen.getByLabelText(/post code/i), { target: { value: '2000' } });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  it('shows loading state on submit', () => {
    useAuthMock.loading = true;
    render(<SignupPage />);
    expect(screen.getByRole('button', { name: /signing up/i })).toBeDisabled();
  });
});