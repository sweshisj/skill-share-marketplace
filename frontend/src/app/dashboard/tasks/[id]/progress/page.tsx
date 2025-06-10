// Example: frontend/src/app/(dashboard)/tasks/[id]/page.tsx (or similar task details page)

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../../../lib/api';
import { Task, TaskProgressUpdate } from '../../../../../types'; // Import new types
import { useAuth } from '../../../../../context/AuthContext';
import moment from 'moment'; // For formatting dates

export default function TaskDetailsPage() {
    const params = useParams();
    const taskId = params.id as string;
    const { user, loading: authLoading } = useAuth(); // Assume user has role too

    const [task, setTask] = useState<Task | null>(null);
    const [progressUpdates, setProgressUpdates] = useState<TaskProgressUpdate[]>([]);
    const [progressDescription, setProgressDescription] = useState(''); // State for new progress input
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [submitLoading, setSubmitLoading] = useState(false); // For progress submission

    // Assume you have a way to determine if the current user is the accepted provider
    // This might come from the task data itself or from an accepted offer.
    const isAcceptedProvider = !authLoading && user && task?.providerId === user.id; // Simplified check
    const isTaskOwner = !authLoading && user && task?.userId === user.id;

    useEffect(() => {
        if (!taskId || authLoading) return;

        const fetchTaskAndProgress = async () => {
            try {
                setLoading(true);
                setError(null);

                const taskRes = await api.get<Task>(`/tasks/${taskId}`);
                setTask(taskRes.data);

                // Fetch progress updates only if user is owner or accepted provider
                if (user && (taskRes.data.userId === user.id || taskRes.data.providerId === user.id)) { // Simplified check
                     const progressRes = await api.get<TaskProgressUpdate[]>(`/tasks/${taskId}/progress`);
                     setProgressUpdates(progressRes.data);
                } else {
                     setError('You are not authorized to view progress for this task.');
                }

            } catch (err: any) {
                console.error('Error fetching task or progress:', err);
                setError(err.response?.data?.message || 'Failed to load task details or progress.');
            } finally {
                setLoading(false);
            }
        };

        fetchTaskAndProgress();
    }, [taskId, user, authLoading]);

    const handleSubmitProgress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!progressDescription.trim() || !taskId) return;

        setSubmitLoading(true);
        setError(null);
        try {
            const res = await api.post<TaskProgressUpdate>(`/tasks/${taskId}/progress`, { description: progressDescription });
            setProgressUpdates(prev => [res.data, ...prev]); // Add new update to top
            setProgressDescription(''); // Clear input
        } catch (err: any) {
            console.error('Error submitting progress:', err);
            setError(err.response?.data?.message || 'Failed to submit progress update.');
        } finally {
            setSubmitLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600">Loading task and progress...</div>;
    }

    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    if (!task) {
        return <div className="text-gray-600 text-lg">Task not found.</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-4 text-purple-700">Task: "{task.taskName}"</h1>
            <p className="text-gray-700 mb-2">Status: {task.status.replace(/_/g, ' ')}</p>
            <p className="text-gray-700 mb-4">Description: {task.description}</p>

            {/* Progress Update Form (for accepted provider) */}
            {isAcceptedProvider && task.status === 'in_progress' && (
                <div className="mt-8 p-4 border rounded-md bg-gray-50">
                    <h2 className="text-xl font-semibold mb-3">Submit Progress Update</h2>
                    <form onSubmit={handleSubmitProgress}>
                        <textarea
                            className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={4}
                            placeholder="Describe your progress here..."
                            value={progressDescription}
                            onChange={(e) => setProgressDescription(e.target.value)}
                            disabled={submitLoading}
                        ></textarea>
                        <button
                            type="submit"
                            className="mt-3 bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 disabled:opacity-50"
                            disabled={submitLoading}
                        >
                            {submitLoading ? 'Submitting...' : 'Add Progress Update'}
                        </button>
                    </form>
                </div>
            )}

            {/* Display Progress Updates */}
            <div className="mt-8">
                <h2 className="text-xl font-semibold mb-3">Task Progress History</h2>
                {progressUpdates.length === 0 ? (
                    <p className="text-gray-600">No progress updates yet.</p>
                ) : (
                    <div className="space-y-4">
                        {progressUpdates.map((update) => (
                            <div key={update.id} className="p-4 border rounded-md bg-gray-50">
                                <p className="text-sm text-gray-500 mb-1">
                                    {moment(update.createdAt).format('MMMM Do YYYY, h:mm:ss a')}
                                </p>
                                <p className="text-gray-800">{update.description}</p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* ... Other task details/actions ... */}
        </div>
    );
}