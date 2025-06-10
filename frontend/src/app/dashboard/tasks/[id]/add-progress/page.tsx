'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../../lib/api';
import { Task, TaskProgressUpdate, CreateTaskProgressRequest } from '../../../../../types';
import { useAuth } from '../../../../../context/AuthContext';
import LoadingSpinner from '../../../../../components/LoadingSpinner';
import ErrorMessage from '../../../../../components/ErrorMessage';

export default function AddTaskProgressPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string;
    const { user, loading: authLoading } = useAuth();

    const [task, setTask] = useState<Task | null>(null);
    const [newUpdateDescription, setNewUpdateDescription] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchTaskDetails = async () => {
            try {
                const response = await api.get<Task>(`/tasks/${taskId}`);
                const fetchedTask = response.data;
                setTask(fetchedTask);

                // Crucial authorization check on the client-side as well for UI feedback
                if ( fetchedTask.status !== 'in_progress') {
                    setError('You are not able to add progress or mark this task complete because the task is not in progress.');
                    setLoading(false);
                    return;
                }

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
            setError('Task ID is missing from the URL.');
            setLoading(false);
        }
    }, [taskId, user, authLoading, router]);

    const handleAddProgressSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        if (!newUpdateDescription.trim()) {
            setError('Progress description cannot be empty.');
            setIsSubmitting(false);
            return;
        }
        if (!task || task.status !== 'in_progress') {
            setError('Unauthorized to add progress.');
            setIsSubmitting(false);
            return;
        }

        try {
            const updatePayload: CreateTaskProgressRequest = {
                description: newUpdateDescription,
            };
            await api.post<TaskProgressUpdate>(`/tasks/${taskId}/progress`, updatePayload);
            setNewUpdateDescription(''); // Clear the input field
            setSuccess('Progress update added successfully!');
            // Optionally refetch task details or progress updates if you display them on this page
        } catch (err: any) {
            console.error('Failed to submit progress update:', err);
            setError(err.response?.data?.message || 'Failed to submit progress update. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleMarkComplete = async () => {
        setError(null);
        setSuccess(null);
        setIsSubmitting(true);

        if (!window.confirm('Are you sure you want to mark this task as completed (pending review)?')) {
            setIsSubmitting(false);
            return;
        }
        if (!task || task.status !== 'in_progress') {
            setError('Unauthorized to mark task as complete.');
            setIsSubmitting(false);
            return;
        }

        try {
            // *** CALL THE NEW DEDICATED API ENDPOINT HERE ***
            // This endpoint specifically handles marking task as completed by the provider.
            await api.put(`/tasks/${taskId}/mark-completed-by-provider`);

            setSuccess('Task marked as completed (pending review) successfully!');
            setTimeout(() => {
                router.push('/dashboard/providers/my-accepted-tasks'); // Redirect after success
            }, 1000);
        } catch (err: any) {
            console.error('Failed to mark task as complete:', err);
            setError(err.response?.data?.message || 'Failed to mark task as complete. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <LoadingSpinner />;
    }

    if (error) {
        return <ErrorMessage message={error} />;
    }

    if (!task) {
        return <ErrorMessage message="Task data could not be loaded." />;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-teal-700">Add Progress & Complete Task</h1>
            <h2 className="text-2xl font-semibold mb-4 text-gray-800">Task: {task.taskName}</h2>
            <p className="text-gray-700 mb-6">Current Status: <span className="font-semibold">{task.status.replace(/_/g, ' ')}</span></p>

            {success && <p className="text-green-500 bg-green-100 border border-green-400 p-3 rounded-md mb-4">{success}</p>}

            {/* Section to Add Progress Update */}
            <div className="mb-8 p-4 border border-blue-200 rounded-lg bg-blue-50">
                <h3 className="text-xl font-bold mb-4 text-blue-700">Submit New Progress Update</h3>
                <form onSubmit={handleAddProgressSubmit}>
                    <div className="mb-4">
                        <label htmlFor="newUpdateDescription" className="block text-gray-700 text-sm font-bold mb-2">
                            Progress Description:
                        </label>
                        <textarea
                            id="newUpdateDescription"
                            value={newUpdateDescription}
                            onChange={(e) => setNewUpdateDescription(e.target.value)}
                            rows={4}
                            className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="Describe your progress..."
                            required
                            disabled={isSubmitting || task.status !== 'in_progress'}
                        ></textarea>
                    </div>
                    <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting || task.status !== 'in_progress'}
                    >
                        {isSubmitting ? 'Submitting...' : 'Add Progress Update'}
                    </button>
                </form>
            </div>

            {/* Section to Mark Task as Completed */}
            {task.status === 'in_progress' && (
                <div className="p-4 border border-green-200 rounded-lg bg-green-50">
                    <h3 className="text-xl font-bold mb-4 text-green-700">Mark Task as Completed</h3>
                    <p className="text-gray-700 mb-4">
                        Once you've finished the task, you can mark it as 'completed pending review'. The task owner will then review your work.
                    </p>
                    <button
                        onClick={handleMarkComplete}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Marking Complete...' : 'Mark Task Completed'}
                    </button>
                </div>
            )}
            {task.status !== 'in_progress' && (
                <p className="mt-8 text-gray-600 italic">This task is no longer in progress, so its status cannot be changed from this page.</p>
            )}
        </div>
    );
}