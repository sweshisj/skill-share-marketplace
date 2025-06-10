import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import ErrorMessage from '../ErrorMessage';

describe('ErrorMessage', () => {
  it('renders the error message with correct text and role', () => {
    render(<ErrorMessage message="Something went wrong!" />);
    const alert = screen.getByRole('alert');
    expect(alert).toBeInTheDocument();
    expect(alert).toHaveTextContent('Error:');
    expect(alert).toHaveTextContent('Something went wrong!');
  });

  it('applies the correct classes', () => {
    render(<ErrorMessage message="Network error" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('bg-red-100');
    expect(alert).toHaveClass('border-red-400');
    expect(alert).toHaveClass('text-red-700');
  });

  it('renders different messages', () => {
    render(<ErrorMessage message="Custom error" />);
    expect(screen.getByText('Custom error')).toBeInTheDocument();
  });
});