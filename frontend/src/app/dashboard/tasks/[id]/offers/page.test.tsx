import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import TaskOffersPage from './page';

// Mock OfferCard to just render offer status and action buttons for testing
jest.mock('../../../../../components/OfferCard', () => ({ offer, onAccept, onReject }: any) => (
    <div data-testid="offer-card">
        <span>{offer.offerStatus}</span>
        {onAccept && <button onClick={() => onAccept(offer.id)}>Accept</button>}
        {onReject && <button onClick={() => onReject(offer.id)}>Reject</button>}
    </div>
));

// Mock api
const mockGet = jest.fn();
const mockPut = jest.fn();
jest.mock('../../../../../lib/api', () => ({
    __esModule: true,
    default: {
        get: (...args: any[]) => mockGet(...args),
        put: (...args: any[]) => mockPut(...args),
    },
}));

// Mock useRouter and useParams
const push = jest.fn();
jest.mock('next/navigation', () => ({
    useRouter: () => ({ push }),
    useParams: () => ({ id: '123' }),
}));

// Mock useAuth
let mockUser: any = { id: 'user1' };
let mockAuthLoading = false;
jest.mock('../../../../../context/AuthContext', () => ({
    useAuth: () => ({
        user: mockUser,
        loading: mockAuthLoading,
    }),
}));

beforeAll(() => {
    jest.spyOn(console, 'error').mockImplementation(() => { });
    jest.spyOn(window, 'confirm').mockImplementation(() => true);
});
afterAll(() => {
    (console.error as jest.Mock).mockRestore();
    (window.confirm as jest.Mock).mockRestore();
});

describe('TaskOffersPage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUser = { id: 'user1' };
        mockAuthLoading = false;
    });

    it('shows loading state', () => {
        mockAuthLoading = true;
        render(<TaskOffersPage />);
        expect(screen.getByText(/loading offers/i)).toBeInTheDocument();
    });

    it('redirects to login if not authenticated', async () => {
        mockUser = null;
        render(<TaskOffersPage />);
        await waitFor(() => {
            expect(push).toHaveBeenCalledWith('/login');
        });
    });

    it('shows error if API fails', async () => {
        mockGet.mockRejectedValueOnce({ response: { data: { message: 'API error' } } });
        render(<TaskOffersPage />);
        await waitFor(() => {
            expect(screen.getByText(/api error/i)).toBeInTheDocument();
        });
    });

    it('shows permission error if not task owner', async () => {
        mockGet.mockResolvedValueOnce({
            data: { id: '123', userId: 'otherUser', taskName: 'Test Task', status: 'open' },
        });
        render(<TaskOffersPage />);
        await waitFor(() => {
            expect(screen.getByText(/you are not authorized to view offers for this task/i)).toBeInTheDocument();
        });
    });

    it('shows not found if task is missing', async () => {
        mockGet.mockRejectedValueOnce({ response: { status: 404 } });
        render(<TaskOffersPage />);
        await waitFor(() => {
            expect(screen.getByText(/failed to load offers for this task/i)).toBeInTheDocument();
        });
    });

    it('shows empty state if no offers', async () => {
        mockGet.mockResolvedValueOnce({
            data: { id: '123', userId: 'user1', taskName: 'Test Task', status: 'open' },
        });
        mockGet.mockResolvedValueOnce({ data: [] });
        render(<TaskOffersPage />);
        await waitFor(() => {
            expect(screen.getByText(/no offers received for this task yet/i)).toBeInTheDocument();
        });
    });

    it('renders offers and handles accept', async () => {
        mockGet.mockResolvedValueOnce({
            data: { id: '123', userId: 'user1', taskName: 'Test Task', status: 'open' },
        });
        mockGet.mockResolvedValueOnce({
            data: [
                { id: 'offer1', offerStatus: 'pending' },
                { id: 'offer2', offerStatus: 'pending' },
            ],
        });
        // Refetch after accept
        mockGet.mockResolvedValueOnce({
            data: [
                { id: 'offer1', offerStatus: 'accepted' },
                { id: 'offer2', offerStatus: 'pending' },
            ],
        });
        mockPut.mockResolvedValueOnce({});
        render(<TaskOffersPage />);
        await waitFor(() => {
            expect(screen.getAllByTestId('offer-card').length).toBe(2);
        });

        fireEvent.click(screen.getAllByText('Accept')[0]);
        await waitFor(() => {
            expect(mockPut).toHaveBeenCalledWith('tasks/offers/offer1/accept');
            expect(push).toHaveBeenCalledWith('/dashboard/my-tasks');
        });
    });
});