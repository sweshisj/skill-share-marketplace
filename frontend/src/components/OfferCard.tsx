// frontend/src/components/OfferCard.tsx
import React from 'react';
import { Offer, User } from '../types'; // Assuming User is also needed for provider info

interface OfferCardProps {
    offer: Offer;
    provider?: User; // Optional: To display provider details if available
    showActions?: boolean;
    onAccept?: (offerId: string) => void;
    onReject?: (offerId: string) => void;
    onViewProvider?: (providerId: string) => void; // Link to view provider profile (if implemented)
}

const OfferCard: React.FC<OfferCardProps> = ({ offer, provider, showActions = true, onAccept, onReject, onViewProvider }) => {
    const statusColor = {
        pending: 'bg-yellow-100 text-yellow-800',
        accepted: 'bg-green-100 text-green-800',
        rejected: 'bg-red-100 text-red-800',
        withdrawn: 'bg-gray-100 text-gray-600',
    };

    // Ensure offerStatus is a string before calling .replace()
    // Using nullish coalescing operator '??' to provide a default string if offer.offerStatus is null/undefined
    const displayStatus = offer.offerStatus?.replace(/_/g, ' ') ?? 'Unknown Status';

    return (
        <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <h3 className="text-lg font-bold mb-2 text-gray-800">
                Offer by {provider?.firstName || provider?.companyName || 'Unknown Provider'}
            </h3>
            <p className="text-gray-700 mb-2 text-sm">
                Offered Rate: <span className="font-semibold">{offer.offeredHourlyRate} {offer.offeredRateCurrency}/hr</span>
            </p>
            <p className="text-sm text-gray-600 mb-4">
                Status: <span className={`font-semibold py-1 px-2 rounded-full ${statusColor[offer.offerStatus]}`}>
                    {/* Use the safely formatted displayStatus */}
                    {displayStatus}
                </span>
            </p>
            {/* If you plan to display offer.message, ensure it's also handled safely */}
            {offer.message && (
                <p className="text-sm text-gray-600 mb-2">Message: {offer.message}</p>
            )}
            <p className="text-xs text-gray-500">
                Made on: {new Date(offer.createdAt).toLocaleDateString()}
            </p>

            {showActions && (offer.offerStatus === 'pending') && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {onAccept && (
                        <button
                            onClick={() => onAccept(offer.id)}
                            className="bg-green-500 hover:bg-green-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200"
                        >
                            Accept Offer
                        </button>
                    )}
                    {onReject && (
                        <button
                            onClick={() => onReject(offer.id)}
                            className="bg-red-500 hover:bg-red-600 text-white text-sm py-2 px-3 rounded-md transition-colors duration-200"
                        >
                            Reject Offer
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default OfferCard;