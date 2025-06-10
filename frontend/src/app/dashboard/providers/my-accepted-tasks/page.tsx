// frontend/src/app/(dashboard)/providers/my-accepted-tasks/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../../lib/api';
import { Offer, Task } from '../../../../types';
import TaskCard from '../../../../components/TaskCard';
import { useAuth } from '../../../../context/AuthContext';
import Link from 'next/link';

// Helper interface to combine task and offer data if needed
interface AcceptedTaskDisplay extends Task {
    acceptedOfferId?: string; // The ID of the offer that was accepted
    // Add other offer details if relevant for display
}

export default function MyAcceptedTasksPage() {
    const [acceptedTasks, setAcceptedTasks] = useState<AcceptedTaskDisplay[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        if (authLoading) return;

        if (!user) {
            router.push('/login');
            return;
        }

        const fetchAcceptedTasks = async () => {
            try {
                const response = await api.get<Task[]>(`/tasks/accepted-by-me`);
                setAcceptedTasks(response.data);
            } catch (err: any) {
                console.error('Failed to fetch accepted tasks:', err);
                setError(err.response?.data?.message || 'Failed to load your accepted tasks.');
            } finally {
                setLoading(false);
            }
        };

        fetchAcceptedTasks();
    }, [user, authLoading, router]);

    // Keep this for general viewing (e.g., for task owners, or if you still want a separate view progress)
    const handleViewProgress = (taskId: string) => {
        router.push(`/dashboard/tasks/${taskId}`); // Navigates to the general Task Details page
    };

    // This handler will now navigate to the NEW 'add-progress' page
    const handleAddTaskProgress = (taskId: string) => {
        router.push(`/dashboard/tasks/${taskId}/add-progress`); // Navigate to the new page
    };

    const handleUpdateTaskStatus = (taskId: string, status: 'completed_pending_review' | 'cancelled') => {
        if (!window.confirm(`Are you sure you want to mark this task as ${status.replace(/_/g, ' ')}?`)) {
            return;
        }
        api.put(`/tasks/${taskId}`, { status })
            .then(() => {
                alert(`Task status updated to ${status.replace(/_/g, ' ')}!`);
                setAcceptedTasks(prev => prev.map(task => task.id === taskId ? { ...task, status: status } : task));
            })
            .catch(err => {
                console.error('Failed to update task status:', err);
                setError(err.response?.data?.message || 'Failed to update task status.');
            });
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600">Loading accepted tasks...</div>;
    }

    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-green-700">My Accepted Tasks</h1>

            {acceptedTasks.length === 0 ? (
                <p className="text-gray-600 text-lg">You don't have any accepted tasks yet. <Link href="/dashboard/browse-tasks" className="text-blue-600 hover:underline">Browse open tasks</Link> to make an offer!</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {acceptedTasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            showActions={true}
                            onMakeOffer={undefined}
                            onEdit={undefined}
                            onViewOffers={undefined}
                            onViewProgress={undefined} // You can keep this or set to undefined if you only want the 'add progress' button
                            // Pass handleAddTaskProgress to the new prop, conditionally
                            onAddTaskProgress={task.status === 'in_progress' ? handleAddTaskProgress : undefined}
                        >
                            {/* The "Mark Completed" button remains here, ensure it's also provider-specific */}
                            {task.status === 'in_progress' && user?.id === task.providerId && (
                                <div className="mt-2 flex gap-2">
                                    <button
                                        onClick={() => handleUpdateTaskStatus(task.id, 'completed_pending_review')}
                                        className="bg-green-500 hover:bg-green-600 text-white text-sm py-1.5 px-3 rounded-md transition-colors duration-200"
                                    >
                                        Mark Completed (Pending Review)
                                    </button>
                                </div>
                            )}
                        </TaskCard>
                    ))}
                </div>
            )}
        </div>
    );
}