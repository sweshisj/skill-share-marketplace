import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import SkillCard from '../SkillCard';
import type { Skill } from '../../types';

const mockSkill: Skill = {
  id: 'skill1',
  category: 'Tutoring',
  experience: '3 years',
  natureOfWork: 'online',
  hourlyRate: 40,
  rateCurrency: 'USD',
  providerId: 'user1',
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-02'),
};

describe('SkillCard', () => {
  it('renders skill details', () => {
    render(<SkillCard skill={mockSkill} />);
    expect(screen.getByText('Tutoring')).toBeInTheDocument();
    expect(screen.getByText(/Experience:/)).toBeInTheDocument();
    expect(screen.getByText('3 years')).toBeInTheDocument();
    expect(screen.getByText(/Nature of Work:/)).toBeInTheDocument();
    expect(screen.getByText('online')).toBeInTheDocument();
    expect(screen.getByText(/Rate:/)).toBeInTheDocument();
    expect(screen.getByText(/40 USD\/hr/)).toBeInTheDocument();
  });

  it('shows Edit and Delete buttons when callbacks are provided', () => {
    const onEdit = jest.fn();
    const onDelete = jest.fn();
    render(<SkillCard skill={mockSkill} onEdit={onEdit} onDelete={onDelete} />);
    expect(screen.getByText('Edit Skill')).toBeInTheDocument();
    expect(screen.getByText('Delete Skill')).toBeInTheDocument();
  });

  it('calls onEdit when Edit Skill button is clicked', () => {
    const onEdit = jest.fn();
    render(<SkillCard skill={mockSkill} onEdit={onEdit} />);
    fireEvent.click(screen.getByText('Edit Skill'));
    expect(onEdit).toHaveBeenCalledWith('skill1');
  });

  it('calls onDelete when Delete Skill button is clicked', () => {
    const onDelete = jest.fn();
    render(<SkillCard skill={mockSkill} onDelete={onDelete} />);
    fireEvent.click(screen.getByText('Delete Skill'));
    expect(onDelete).toHaveBeenCalledWith('skill1');
  });

  it('does not show action buttons if showActions is false', () => {
    render(<SkillCard skill={mockSkill} showActions={false} />);
    expect(screen.queryByText('Edit Skill')).not.toBeInTheDocument();
    expect(screen.queryByText('Delete Skill')).not.toBeInTheDocument();
  });
});