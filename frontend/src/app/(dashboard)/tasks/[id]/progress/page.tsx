// frontend/src/app/(dashboard)/tasks/[taskId]/progress/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '../../../../../lib/api';
import { Task, TaskProgress, UpdateTaskProgressRequest } from '../../../../../types';
import { useAuth } from '../../../../../context/AuthContext';
import Link from 'next/link';

export default function TaskProgressPage() {
    const params = useParams();
    const taskId = params.taskId as string;
    const { user, loading: authLoading } = useAuth();

    const [task, setTask] = useState<Task | null>(null);
    const [progressUpdates, setProgressUpdates] = useState<TaskProgress[]>([]);
    const [newProgressDescription, setNewProgressDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false); // For new progress submission
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            // Redirect to login if not authenticated, or display a message
            // router.push('/login');
            setError('You must be logged in to view task progress.');
            setLoading(false);
            return;
        }

        const fetchTaskAndProgress = async () => {
            try {
                // Fetch task details
                const taskResponse = await api.get<Task>(`/tasks/${taskId}`);
                setTask(taskResponse.data);

                // Check if user is owner or an accepted provider
                // For simplicity, we'll allow owners and accepted providers to see progress.
                // A more robust check might involve fetching accepted offers first.
                // For now, let's assume if they land here, they might have access based on task status.
                // If not task owner, check if an accepted offer exists for this provider
                if (taskResponse.data.userId !== user.id) {
                     // In a real app, you'd fetch accepted offers for this task
                     // and check if the current user is the provider of an 'accepted' offer.
                     // For this example, if they are not the task owner, we'll assume they are a provider.
                     // If you need strict checking, add a backend endpoint like `/tasks/:id/is-provider`
                    // or fetch all offers and check status/providerId.
                }

                // Fetch progress updates
                const progressResponse = await api.get<TaskProgress[]>(`/tasks/${taskId}/progress`);
                // Sort by timestamp if not already sorted by backend
                setProgressUpdates(progressResponse.data.sort((a, b) => new Date(a.progressTimestamp).getTime() - new Date(b.progressTimestamp).getTime()));

            } catch (err: any) {
                console.error('Failed to fetch task progress:', err);
                setError(err.response?.data?.message || 'Failed to load task progress.');
            } finally {
                setLoading(false);
            }
        };

        if (taskId) {
            fetchTaskAndProgress();
        }
    }, [taskId, user, authLoading]);

    const handleAddProgress = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setSubmitting(true);

        if (!newProgressDescription.trim()) {
            setError('Progress description cannot be empty.');
            setSubmitting(false);
            return;
        }

        try {
            const request: UpdateTaskProgressRequest = { description: newProgressDescription };
            const response = await api.post<TaskProgress>(`/tasks/${taskId}/progress`, request);
            setProgressUpdates(prev => [...prev, response.data].sort((a, b) => new Date(a.progressTimestamp).getTime() - new Date(b.progressTimestamp).getTime()));
            setNewProgressDescription('');
            setSuccess('Progress update added!');
        } catch (err: any) {
            console.error('Failed to add progress:', err);
            setError(err.response?.data?.message || 'Failed to add progress update.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600">Loading task progress...</div>;
    }

    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    if (!task) {
        return <div className="text-gray-600 text-lg">Task not found.</div>;
    }

    // Determine if the current user is the task owner or the accepted provider
    const isTaskOwner = user && user.id === task.userId;
    // For provider, you'd check if any accepted offer for this task has current user as providerId.
    // For simplicity, let's assume if it's not the owner, it's a provider who can potentially add progress.
    const isProvider = user && !isTaskOwner && (task.status === 'in_progress' || task.status === 'completed_pending_review'); // Basic heuristic, refine with actual offer logic


    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-4 text-indigo-700">Progress for "{task.taskName}"</h1>
            <p className="mb-6 text-gray-600">Task Status: <span className={`font-semibold ${
                task.status === 'open' ? 'text-green-600' :
                task.status === 'in_progress' ? 'text-blue-600' :
                task.status === 'completed_pending_review' ? 'text-yellow-600' :
                'text-gray-600'
            }`}>{task.status.replace(/_/g, ' ')}</span></p>

            <h2 className="text-2xl font-semibold mb-4 text-indigo-800">Progress History</h2>
            {progressUpdates.length === 0 ? (
                <p className="text-gray-600 mb-6">No progress updates yet.</p>
            ) : (
                <div className="space-y-4 mb-6">
                    {progressUpdates.map((update) => (
                        <div key={update.id} className="bg-gray-50 p-4 rounded-md border border-gray-200">
                            <p className="text-gray-800">{update.description}</p>
                            <p className="text-sm text-gray-500 mt-1">
                                {new Date(update.progressTimestamp).toLocaleString()}
                                {isTaskOwner && update.providerId && ` (by Provider ${update.providerId.substring(0, 8)}...)`}
                            </p>
                        </div>
                    ))}
                </div>
            )}

            {(isProvider || isTaskOwner) && task.status === 'in_progress' && ( // Allow progress if task is in progress
                <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
                    <h2 className="text-2xl font-semibold mb-4 text-blue-800">Add New Progress Update</h2>
                    {success && <p className="text-green-500 bg-green-100 border border-green-400 p-3 rounded-md mb-4">{success}</p>}
                    <form onSubmit={handleAddProgress} className="space-y-4">
                        <div>
                            <label htmlFor="newProgressDescription" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
                            <textarea id="newProgressDescription" value={newProgressDescription} onChange={(e) => setNewProgressDescription(e.target.value)} rows={3} required
                                className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        <button
                            type="submit"
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 w-full"
                            disabled={submitting}
                        >
                            {submitting ? 'Adding...' : 'Add Progress Update'}
                        </button>
                    </form>
                </div>
            )}

            <div className="mt-8">
                {isTaskOwner && <Link href="/my-tasks" className="text-blue-600 hover:underline">Back to My Tasks</Link>}
                {isProvider && <Link href="/providers/my-accepted-tasks" className="text-blue-600 hover:underline">Back to My Accepted Tasks</Link>}
            </div>
        </div>
    );
}