// Inside your Task Details Page (e.g., frontend/src/app/(dashboard)/tasks/[id]/page.tsx)

'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../lib/api';
import { Task, TaskProgressUpdate, CreateTaskProgressRequest } from '../../../../types'; // Ensure TaskProgressUpdate and CreateTaskProgressRequest are imported
import { useAuth } from '../../../../context/AuthContext';
// Import other components like LoadingSpinner, ErrorMessage

export default function TaskDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;
    const { user, loading: authLoading } = useAuth();

    const [task, setTask] = useState<Task | null>(null);
    const [progressUpdates, setProgressUpdates] = useState<TaskProgressUpdate[]>([]);
    const [newUpdateDescription, setNewUpdateDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchTaskDetails = async () => {
            try {
                // Fetch task details (assuming you have a GET /api/v1/tasks/:id endpoint)
                const taskResponse = await api.get<Task>(`/tasks/${taskId}`);
                setTask(taskResponse.data);

                // Fetch existing progress updates (assuming you have a GET /api/v1/tasks/:id/progress endpoint)
                const updatesResponse = await api.get<TaskProgressUpdate[]>(`/tasks/${taskId}/progress`);
                setProgressUpdates(updatesResponse.data);

            } catch (err: any) {
                console.error('Failed to fetch task details:', err);
                setError(err.response?.data?.message || 'Failed to load task details.');
            } finally {
                setLoading(false);
            }
        };

        if (taskId) {
            fetchTaskDetails();
        } else {
            setError('Task ID is missing.');
            setLoading(false);
        }
    }, [taskId, user, authLoading, router]);

    const handleUpdateSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsSubmitting(true);

        if (!newUpdateDescription.trim()) {
            setError('Update description cannot be empty.');
            setIsSubmitting(false);
            return;
        }
        if (!task || task.providerId !== user?.id) {
            setError('You are not authorized to update this task or it is not assigned to you.');
            setIsSubmitting(false);
            return;
        }
        if (task.status !== 'in_progress') {
             setError('Task status must be "in progress" to add updates.');
             setIsSubmitting(false);
             return;
        }


        try {
            // Send the new progress update to the backend
            const updatePayload: CreateTaskProgressRequest = {
                description: newUpdateDescription,
            };
            const response = await api.post<TaskProgressUpdate>(`/tasks/${taskId}/progress`, updatePayload);

            // Add the new update to the list and clear the input
            setProgressUpdates(prev => [...prev, response.data]);
            setNewUpdateDescription('');
            alert('Progress update submitted successfully!');

        } catch (err: any) {
            console.error('Failed to submit progress update:', err);
            setError(err.response?.data?.message || 'Failed to submit update. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600">Loading task...</div>;
    }

    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    if (!task) {
        return <div className="text-center text-gray-600">Task not found.</div>;
    }

    // Determine if the current user is the accepted provider
    const isAcceptedProvider = user && task.providerId === user.id;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-green-700">Task: {task.taskName}</h1>
            <p className="mb-4 text-gray-700">{task.description}</p>
            <p className="mb-2 text-gray-600">Status: <span className="font-semibold">{task.status.replace(/_/g, ' ')}</span></p>
            {/* ... other task details ... */}

            <h2 className="text-2xl font-bold mt-8 mb-4 text-green-700">Progress Updates</h2>
            {progressUpdates.length === 0 ? (
                <p className="text-gray-600 mb-4">No progress updates yet.</p>
            ) : (
                <div className="space-y-4 mb-6">
                    {progressUpdates.map(update => (
                        <div key={update.id} className="bg-gray-50 p-3 rounded-md border border-gray-200">
                            <p className="text-gray-800">{update.description}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(update.createdAt).toLocaleString()} (by {update.providerId})
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {isAcceptedProvider && task.status === 'in_progress' && (
                <div className="mt-8 p-4 border border-blue-200 rounded-lg bg-blue-50">
                    <h3 className="text-xl font-bold mb-4 text-blue-700">Submit New Progress Update</h3>
                    <form onSubmit={handleUpdateSubmit}>
                        <div className="mb-4">
                            <label htmlFor="newUpdateDescription" className="block text-gray-700 text-sm font-bold mb-2">
                                Your Update:
                            </label>
                            <textarea
                                id="newUpdateDescription"
                                value={newUpdateDescription}
                                onChange={(e) => setNewUpdateDescription(e.target.value)}
                                rows={4}
                                className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="Describe your progress..."
                                required
                                disabled={isSubmitting}
                            ></textarea>
                        </div>
                        <button
                            type="submit"
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Submitting...' : 'Submit Progress Update'}
                        </button>
                    </form>
                </div>
            )}
            {/* If task.status changes to completed, cancelled, or closed, the form should disappear */}
            {isAcceptedProvider && task.status !== 'in_progress' && (
                ['completed_pending_review', 'completed', 'cancelled', 'closed'].includes(task.status) && (
                    <p className="mt-8 text-gray-600 italic">This task is no longer in progress, so new updates cannot be submitted.</p>
                )
            )}

        </div>
    );
}