// frontend/src/app/(dashboard)/tasks/[id]/offers/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import api from '../../../../../lib/api';
import { Task, Offer, User } from '../../../../../types';
import OfferCard from '../../../../../components/OfferCard';
import { useAuth } from '../../../../../context/AuthContext';
import Link from 'next/link';

// Interface to combine Offer with its Provider's User data
interface OfferWithProvider extends Offer {
    providerDetails?: User;
}

export default function TaskOffersPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;
    const { user, loading: authLoading } = useAuth();

    const [task, setTask] = useState<Task | null>(null);
    const [offers, setOffers] = useState<OfferWithProvider[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

       const fetchTaskAndOffers = async () => {
            try {
                // Fetch task details
                const taskResponse = await api.get<Task>(`/tasks/${taskId}`);
                setTask(taskResponse.data);

                // Check if the logged-in user is the task owner
                if (taskResponse.data.userId !== user.id) {
                    setError('You are not authorized to view offers for this task.');
                    setLoading(false);
                    return;
                }
                const offersResponse = await api.get<OfferWithProvider[]>(`/tasks/${taskId}/offers`);

             
                setOffers(offersResponse.data);

            } catch (err: any) {
                console.error('Failed to fetch task or offers:', err);
                setError(err.response?.data?.message || 'Failed to load offers for this task.');
            } finally {
                setLoading(false);
            }
        };

        if (taskId) {
            fetchTaskAndOffers();
        }
    }, [taskId, user, authLoading, router]);

    const handleAcceptOffer = async (offerId: string) => {
        if (!window.confirm('Are you sure you want to accept this offer? This will close other pending offers and set the task to "in_progress".')) {
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            // Backend endpoint to accept an offer
            await api.put(`tasks/offers/${offerId}/accept`);
            setSuccess('Offer accepted successfully! Task status updated.');
            router.push('/dashboard/my-tasks'); // Redirect back to my tasks, as task status will change
        } catch (err: any) {
            console.error('Failed to accept offer:', err);
            setError(err.response?.data?.message || 'Failed to accept offer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleRejectOffer = async (offerId: string) => {
        if (!window.confirm('Are you sure you want to reject this offer?')) {
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            // Backend endpoint to reject an offer
            await api.put(`tasks/offers/${offerId}/reject`);
            setSuccess('Offer rejected successfully.');
            // Update the local state to reflect the rejection
            setOffers(prevOffers => prevOffers.map(offer =>
                offer.id === offerId ? { ...offer, offerStatus: 'rejected' } : offer
            ));
        } catch (err: any) {
            console.error('Failed to reject offer:', err);
            setError(err.response?.data?.message || 'Failed to reject offer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600">Loading offers...</div>;
    }

    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    if (!task) {
        return <div className="text-gray-600 text-lg">Task not found or inaccessible.</div>;
    }

    return (
        
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-4 text-purple-700">Offers for "{task.taskName}"</h1>
            <p className="mb-6 text-gray-600">Task Status: <span className={`font-semibold ${
                task.status === 'open' ? 'text-green-600' :
                task.status === 'in_progress' ? 'text-blue-600' :
                task.status === 'completed_pending_review' ? 'text-yellow-600' :
                'text-gray-600'
            }`}>{task.status.replace(/_/g, ' ')}</span></p>

            {success && <p className="text-green-500 bg-green-100 border border-green-400 p-3 rounded-md mb-4">{success}</p>}

            {offers.length === 0 ? (
                <p className="text-gray-600 text-lg">No offers received for this task yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {offers.map(offer => (
                        <OfferCard
                            key={offer.id}
                            offer={offer}
                            provider={offer.providerDetails}
                            showActions={true}
                            onAccept={handleAcceptOffer}
                            onReject={handleRejectOffer}
                        />
                    ))}
                </div>
            )}
            <div className="mt-8">
                <Link href="/dashboard/my-tasks" className="text-blue-600 hover:underline">Back to My Tasks</Link>
            </div>
        </div>
    );
}