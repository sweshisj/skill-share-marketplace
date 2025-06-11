// frontend/src/app/(dashboard)/my-tasks/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react'; // Import useCallback
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { Task } from '../../../types';
import TaskCard from '../../../components/TaskCard'; // Import the TaskCard component
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function MyTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    // Memoize fetchMyTasks to prevent unnecessary re-creations
    const fetchMyTasks = useCallback(async () => {
        setLoading(true); // Set loading to true before fetching
        setError(null); // Clear any previous errors
        try {
            const response = await api.get<Task[]>(`/tasks/my-posted-tasks`); // Backend endpoint to get tasks posted by current user
            setTasks(response.data);
        } catch (err: any) {
            console.error('Failed to fetch my tasks:', err);
            setError(err.response?.data?.message || 'Failed to load your tasks.');
        } finally {
            setLoading(false);
        }
    }, []); // No dependencies for this specific useCallback, it will be called from useEffect

    useEffect(() => {
        if (authLoading) return; // Wait for auth status to be determined

        if (!user) {
            router.push('/login'); // Redirect if not authenticated
            return;
        }

        fetchMyTasks(); // Call the memoized fetch function
    }, [user, authLoading, router, fetchMyTasks]); // Add fetchMyTasks to dependencies

    const handleEditTask = (taskId: string) => {
        router.push(`/dashboard/tasks/${taskId}/edit`);
    };

    const handleViewOffers = (taskId: string) => {
        router.push(`/dashboard/tasks/${taskId}/offers`);
    };

    const handleViewProgress = (taskId: string) => {
        router.push(`/dashboard/tasks/${taskId}/progress`);
    };

    // --- New Handlers for Task Completion ---
    const handleAcceptCompletion = async (taskId: string) => {
        try {
            await api.put(`/tasks/${taskId}/accept-completion`);
            // Optionally, show a success message
            alert('Task completion accepted!');
            fetchMyTasks(); // Re-fetch tasks to update status on the page
        } catch (err: any) {
            console.error('Failed to accept task completion:', err);
            alert(err.response?.data?.message || 'Failed to accept completion.');
        }
    };

    const handleRejectCompletion = async (taskId: string) => {
        try {
            await api.put(`/tasks/${taskId}/reject-completion`);
            // Optionally, show a success message
            alert('Task completion rejected!');
            fetchMyTasks(); // Re-fetch tasks to update status on the page
        } catch (err: any) {
            console.error('Failed to reject task completion:', err);
            alert(err.response?.data?.message || 'Failed to reject completion.');
        }
    };
    // --- End New Handlers ---

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600">Loading tasks...</div>;
    }

    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-blue-700">My Posted Tasks</h1>

            {tasks.length === 0 ? (
                <p className="text-gray-600 text-lg">You haven't posted any tasks yet. <Link href="/dashboard/create-task" className="text-blue-600 hover:underline">Post a new task</Link>.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            showActions={true}
                            onEdit={handleEditTask}
                            onViewOffers={handleViewOffers}
                            onViewProgress={handleViewProgress}
                            onMakeOffer={undefined} // Task owner cannot make offer on their own task
                            // --- Pass new handlers here ---
                            onAcceptCompletion={handleAcceptCompletion}
                            onRejectCompletion={handleRejectCompletion}
                            // --- End passing new handlers ---
                        />
                    ))}
                </div>
            )}
        </div>
    );
}