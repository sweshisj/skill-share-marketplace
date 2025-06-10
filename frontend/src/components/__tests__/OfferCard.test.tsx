import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import OfferCard from '../OfferCard';
import { Offer, ProviderPublicDetails, UserType } from '../../types';

const mockOffer: Offer = {
  id: 'offer1',
  taskId: 'task1',
  providerId: 'provider1',
  offeredHourlyRate: 50,
  offeredRateCurrency: 'USD',
  offerStatus: 'pending',
  message: 'I am interested!',
  createdAt: new Date('2024-06-01'),
  updatedAt: new Date('2024-06-01'),
};

const mockProvider: ProviderPublicDetails = {
  id: 'provider1',
  firstName: 'John',
  lastName: 'Doe',
  companyName: '',
  email: 'john@example.com',
  userType: UserType.Individual
};

describe('OfferCard', () => {
  it('renders offer and provider details', () => {
    render(<OfferCard offer={mockOffer} provider={mockProvider} />);
    expect(screen.getByText(/Offer by John/)).toBeInTheDocument();
    expect(screen.getByText(/Offered Rate:/)).toBeInTheDocument();
    expect(screen.getByText(/50 USD\/hr/)).toBeInTheDocument();
    expect(screen.getByText(/Status:/)).toBeInTheDocument();
    expect(screen.getByText(/pending/i)).toBeInTheDocument();
    expect(screen.getByText(/I am interested!/)).toBeInTheDocument();
    expect(screen.getByText(/Made on:/)).toBeInTheDocument();
  });

  it('shows Accept and Reject buttons for pending offers', () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();
    render(
      <OfferCard
        offer={mockOffer}
        provider={mockProvider}
        onAccept={onAccept}
        onReject={onReject}
      />
    );
    expect(screen.getByText('Accept Offer')).toBeInTheDocument();
    expect(screen.getByText('Reject Offer')).toBeInTheDocument();
  });

  it('calls onAccept and onReject when buttons are clicked', () => {
    const onAccept = jest.fn();
    const onReject = jest.fn();
    render(
      <OfferCard
        offer={mockOffer}
        provider={mockProvider}
        onAccept={onAccept}
        onReject={onReject}
      />
    );
    fireEvent.click(screen.getByText('Accept Offer'));
    expect(onAccept).toHaveBeenCalledWith('offer1');
    fireEvent.click(screen.getByText('Reject Offer'));
    expect(onReject).toHaveBeenCalledWith('offer1');
  });

  it('does not show action buttons if showActions is false', () => {
    render(
      <OfferCard
        offer={mockOffer}
        provider={mockProvider}
        showActions={false}
      />
    );
    expect(screen.queryByText('Accept Offer')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject Offer')).not.toBeInTheDocument();
  });

  it('does not show action buttons if offer is not pending', () => {
    render(
      <OfferCard
        offer={{ ...mockOffer, offerStatus: 'accepted' }}
        provider={mockProvider}
      />
    );
    expect(screen.queryByText('Accept Offer')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject Offer')).not.toBeInTheDocument();
  });

  it('renders "Unknown Provider" if provider is missing', () => {
    render(<OfferCard offer={mockOffer} />);
    expect(screen.getByText(/Offer by Unknown Provider/)).toBeInTheDocument();
  });
});