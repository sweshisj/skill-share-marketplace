let mockUser: any = { id: 'guest1', role: 'guest' };

jest.mock('../../context/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    loading: false,
  }),
}));

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import TaskCard from '../TaskCard';
import type { Task, TaskCategory } from '../../types';

// Default mock task
const mockTask: Task = {
  id: '1',
  userId: 'user1', // owner is 'user1'
  taskName: 'Test Task',
  description: 'A test task description',
  category: 'Tutoring' as TaskCategory,
  hourlyRateOffered: 50,
  expectedStartDate: '2024-06-01',
  expectedWorkingHours: 10,
  rateCurrency: 'USD',
  status: 'open',
  createdAt: new Date('2024-05-01'),
  updatedAt: new Date('2024-05-02')
};

describe('TaskCard', () => {
  describe('as a guest (not requester, not provider)', () => {
    beforeEach(() => {
      mockUser = { id: 'guest1', role: 'guest' };
    });

    it('shows Make Offer button when callbacks are provided', () => {
      const onMakeOffer = jest.fn();
      render(
        <TaskCard
          task={mockTask}
          onMakeOffer={onMakeOffer}
        />
      );
      expect(screen.getByText('Make Offer')).toBeInTheDocument();
      fireEvent.click(screen.getByText('Make Offer'));
      expect(onMakeOffer).toHaveBeenCalledWith('1');
    });
  });

  describe('as a provider (not the owner)', () => {
    beforeEach(() => {
      mockUser = { id: 'provider1', role: 'provider' };
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
  });

  it('does not show action buttons if showActions is false', () => {
    mockUser = { id: 'provider1', role: 'provider' };
    render(<TaskCard task={mockTask} showActions={false} />);
    expect(screen.queryByText('Make Offer')).not.toBeInTheDocument();
    expect(screen.queryByText('View Offers')).not.toBeInTheDocument();
    expect(screen.queryByText('Edit Task')).not.toBeInTheDocument();
    expect(screen.queryByText('View Progress')).not.toBeInTheDocument();
    expect(screen.queryByText('Add New Progress')).not.toBeInTheDocument();
  });
});