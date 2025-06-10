import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from './page';

// Mock next/link to render a regular anchor for testing
jest.mock('next/link', () => ({ children, href, className }: any) => (
  <a href={href} className={className}>{children}</a>
));

describe('HomePage', () => {
  it('renders the welcome heading and description', () => {
    render(<HomePage />);
    expect(screen.getByText(/welcome to skillshare marketplace/i)).toBeInTheDocument();
    expect(screen.getByText(/connect with skilled providers/i)).toBeInTheDocument();
  });

  it('renders login and signup links', () => {
    render(<HomePage />);
    const loginLink = screen.getByRole('link', { name: /login/i });
    const signupLink = screen.getByRole('link', { name: /sign up/i });
    expect(loginLink).toHaveAttribute('href', '/login');
    expect(signupLink).toHaveAttribute('href', '/signup');
  });
});