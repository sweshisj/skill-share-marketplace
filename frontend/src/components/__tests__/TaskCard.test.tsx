import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../TaskCard';
import type { Task, TaskCategory } from '../../types';

const mockTask: Task = {
  id: '1',
  userId: 'user1',
  taskName: 'Test Task',
  description: 'A test task description',
  category: 'Tutoring' as TaskCategory, // Valid TaskCategory
  hourlyRateOffered: 50,
  expectedStartDate: '2024-06-01',
  expectedWorkingHours: 10,
  rateCurrency: 'USD',
  status: 'open',
  createdAt: new Date('2024-05-01'),
  updatedAt: new Date('2024-05-02')
};

describe('TaskCard', () => {
  it('renders task details', () => {
    render(<TaskCard task={mockTask} />);
    expect(screen.getByText('Test Task')).toBeInTheDocument();
    expect(screen.getByText(/Tutoring/)).toBeInTheDocument();
    expect(screen.getByText(/A test task description/)).toBeInTheDocument();
    expect(screen.getByText(/Starts:/)).toBeInTheDocument();
    expect(screen.getByText(/Hours:/)).toBeInTheDocument();
    expect(screen.getByText(/Rate:/)).toBeInTheDocument();
    expect(screen.getByText(/Status:/)).toBeInTheDocument();
  });

  it('shows action buttons when callbacks are provided', () => {
    const onMakeOffer = jest.fn();
    const onViewOffers = jest.fn();
    const onEdit = jest.fn();
    const onViewProgress = jest.fn();
    render(
      <TaskCard
        task={mockTask}
        onMakeOffer={onMakeOffer}
        onViewOffers={onViewOffers}
        onEdit={onEdit}
        onViewProgress={onViewProgress}
      />
    );
    expect(screen.getByText('Make Offer')).toBeInTheDocument();
    expect(screen.getByText('View Offers')).toBeInTheDocument();
    expect(screen.getByText('Edit Task')).toBeInTheDocument();
    expect(screen.getByText('View Progress')).toBeInTheDocument();
  });

  it('calls the correct callback when action buttons are clicked', () => {
    const onMakeOffer = jest.fn();
    const onViewOffers = jest.fn();
    const onEdit = jest.fn();
    const onViewProgress = jest.fn();
    render(
      <TaskCard
        task={mockTask}
        onMakeOffer={onMakeOffer}
        onViewOffers={onViewOffers}
        onEdit={onEdit}
        onViewProgress={onViewProgress}
      />
    );
    fireEvent.click(screen.getByText('Make Offer'));
    expect(onMakeOffer).toHaveBeenCalledWith('1');
    fireEvent.click(screen.getByText('View Offers'));
    expect(onViewOffers).toHaveBeenCalledWith('1');
    fireEvent.click(screen.getByText('Edit Task'));
    expect(onEdit).toHaveBeenCalledWith('1');
    fireEvent.click(screen.getByText('View Progress'));
    expect(onViewProgress).toHaveBeenCalledWith('1');
  });

  it('shows Add New Progress button only for in_progress status', () => {
    const onAddTaskProgress = jest.fn();
    render(
      <TaskCard
        task={{ ...mockTask, status: 'in_progress' }}
        onAddTaskProgress={onAddTaskProgress}
      />
    );
    expect(screen.getByText('Add New Progress')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Add New Progress'));
    expect(onAddTaskProgress).toHaveBeenCalledWith('1');
  });

  it('does not show action buttons if showActions is false', () => {
    render(<TaskCard task={mockTask} showActions={false} />);
    expect(screen.queryByText('Make Offer')).not.toBeInTheDocument();
    expect(screen.queryByText('View Offers')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit Task')).not.toBeInTheDocument();
    expect(screen.queryByText('View Progress')).not.toBeInTheDocument();
    expect(screen.queryByText('Add New Progress')).not.toBeInTheDocument();
  });
});