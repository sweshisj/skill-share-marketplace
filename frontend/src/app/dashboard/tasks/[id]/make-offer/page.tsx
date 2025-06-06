// frontend/src/app/(dashboard)/tasks/[id]/make-offer/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import api from '../../../../../lib/api';
import { Task, MakeOfferRequest, Currency } from '../../../../../types';
import { useAuth } from '../../../../../context/AuthContext';

export default function MakeOfferPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;
    const { user, loading: authLoading } = useAuth();

    const [task, setTask] = useState<Task | null>(null);
    const [formData, setFormData] = useState<MakeOfferRequest>({
        offeredHourlyRate: 0,
        offeredRateCurrency: 'AUD', // Default
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const currencies: Currency[] = ['USD', 'AUD', 'SGD', 'INR'];

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchTaskDetails = async () => {
            try {
                const response = await api.get<Task>(`/tasks/${taskId}`);
                setTask(response.data);
                // Optionally pre-fill offer rate with task's offered rate
                setFormData(prev => ({
                    ...prev,
                    offeredHourlyRate: response.data.hourlyRateOffered,
                    offeredRateCurrency: response.data.rateCurrency
                }));
            } catch (err: any) {
                console.error('Failed to fetch task details:', err);
                setError(err.response?.data?.message || 'Failed to load task details.');
            } finally {
                setLoading(false);
            }
        };

        if (taskId) {
            fetchTaskDetails();
        }
    }, [taskId, user, authLoading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'offeredHourlyRate' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        if (user?.id === task?.userId) {
            setError("You cannot make an offer on your own task.");
            setLoading(false);
            return;
        }

        try {
            await api.post(`/tasks/${taskId}/offers`, formData); // Endpoint to make an offer on a specific task
            setSuccess('Offer submitted successfully!');
            router.push('/dashboard/browse-tasks'); // Redirect back to browse tasks or to 'my offers' page
        } catch (err: any) {
            console.error('Failed to make offer:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to submit offer. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600">Loading task details...</div>;
    }

    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    if (!task) {
        return <div className="text-gray-600 text-lg">Task not found or inaccessible.</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-blue-700">Make an Offer for "{task.taskName}"</h1>

            <div className="mb-6 p-4 bg-blue-50 rounded-md border border-blue-200">
                <h2 className="text-xl font-semibold mb-2 text-blue-800">Task Details:</h2>
                <p><strong>Category:</strong> {task.category}</p>
                <p><strong>Description:</strong> {task.description}</p>
                <p><strong>Expected Start:</strong> {new Date(task.expectedStartDate).toLocaleDateString()}</p>
                <p><strong>Expected Hours:</strong> {task.expectedWorkingHours}</p>
                <p><strong>Hourly Rate Offered by Poster:</strong> {task.hourlyRateOffered} {task.rateCurrency}/hr</p>
                <p><strong>Status:</strong> {task.status.replace(/_/g, ' ')}</p>
            </div>

            {success && <p className="text-green-500 bg-green-100 border border-green-400 p-3 rounded-md mb-4">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="offeredHourlyRate" className="block text-gray-700 text-sm font-bold mb-2">Your Offered Hourly Rate:</label>
                    <input type="number" id="offeredHourlyRate" name="offeredHourlyRate" value={formData.offeredHourlyRate} onChange={handleChange} required min="0" step="0.01"
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="offeredRateCurrency" className="block text-gray-700 text-sm font-bold mb-2">Currency:</label>
                    <select id="offeredRateCurrency" name="offeredRateCurrency" value={formData.offeredRateCurrency} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {currencies.map(curr => (
                            <option key={curr} value={curr}>{curr}</option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full"
                    disabled={loading}
                >
                    {loading ? 'Submitting Offer...' : 'Submit Offer'}
                </button>
            </form>
        </div>
    );
}