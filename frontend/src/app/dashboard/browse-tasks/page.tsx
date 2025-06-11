// frontend/src/app/(dashboard)/browse-tasks/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { Task } from '../../../types';
import TaskCard from '../../../components/TaskCard';
import { useAuth } from '../../../context/AuthContext';

export default function BrowseTasksPage() {
    const [tasks, setTasks] = useState<Task[]>([]);
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

        const fetchOpenTasks = async () => {
            try {
                const response = await api.get<Task[]>(`/tasks?status=open`);
                setTasks(response.data);
            } catch (err: any) {
                setError(err.response?.data?.message || 'Failed to load open tasks.');
            } finally {
                setLoading(false);
            }
        };

        fetchOpenTasks();
    }, [user, authLoading, router]);

    const handleMakeOffer = (taskId: string) => {
        router.push(`/dashboard/tasks/${taskId}/make-offer`);
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600">Loading tasks...</div>;
    }

    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-blue-700">Browse Open Tasks</h1>

            {tasks.length === 0 ? (
                <p className="text-gray-600 text-lg">No open tasks available at the moment.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {tasks.map(task => (
                        <TaskCard
                            key={task.id}
                            task={task}
                            showActions={true}
                            onMakeOffer={handleMakeOffer}
                            onEdit={undefined} // Not applicable for Browse tasks
                            onViewOffers={undefined} // Not applicable for Browse tasks
                            onViewProgress={undefined} // Not applicable for Browse tasks
                        />
                    ))}
                </div>
            )}
        </div>
    );
}