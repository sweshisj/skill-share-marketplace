// frontend/src/app/(dashboard)/tasks/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation'; // For dynamic routes
import api from '../../../../../lib/api';
import { UpdateTaskRequest, Task, TaskCategory, Currency } from '../../../../../types';
import { useAuth } from '../../../../../context/AuthContext';

export default function EditTaskPage() {
    const router = useRouter();
    const params = useParams();
    const taskId = params.id as string; // Get task ID from URL
    const { user, loading: authLoading } = useAuth();

    const [formData, setFormData] = useState<UpdateTaskRequest>({
        category: 'Tutoring',
        taskName: '',
        description: '',
        expectedStartDate: '',
        expectedWorkingHours: 0,
        hourlyRateOffered: 0,
        rateCurrency: 'AUD',
        status: 'open', // Default status for editing
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const taskCategories: TaskCategory[] = ['Tutoring', 'Handyman', 'Consulting'];
    const currencies: Currency[] = ['USD', 'AUD', 'SGD', 'INR'];
    const taskStatuses: Task['status'][] = ['open', 'in_progress', 'completed_pending_review', 'closed', 'cancelled'];


    useEffect(() => {
        if (authLoading) return;
        if (!user) {
            router.push('/login');
            return;
        }

        const fetchTask = async () => {
            try {
                const response = await api.get<Task>(`/tasks/${taskId}`);
                // Only allow editing if the logged-in user is the task owner
                if (response.data.userId !== user.id) {
                    setError('You are not authorized to edit this task.');
                    setLoading(false);
                    return;
                }
                setFormData({
                    category: response.data.category,
                    taskName: response.data.taskName,
                    description: response.data.description,
                    expectedStartDate: new Date(response.data.expectedStartDate).toISOString().split('T')[0], // Format date for input
                    expectedWorkingHours: response.data.expectedWorkingHours,
                    hourlyRateOffered: response.data.hourlyRateOffered,
                    rateCurrency: response.data.rateCurrency,
                    status: response.data.status,
                });
            } catch (err: any) {
                console.error('Failed to fetch task:', err);
                setError(err.response?.data?.message || 'Failed to load task for editing.');
            } finally {
                setLoading(false);
            }
        };

        if (taskId) {
            fetchTask();
        }
    }, [taskId, user, authLoading, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'expectedWorkingHours' || name === 'hourlyRateOffered' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        try {
            await api.put(`/tasks/${taskId}`, formData);
            setSuccess('Task updated successfully!');
            router.push('/dashboard/my-tasks'); // Redirect back to my tasks
        } catch (err: any) {
            console.error('Failed to update task:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to update task. Please try again.');
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

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-yellow-700">Edit Task: {formData.taskName}</h1>
            {success && <p className="text-green-500 bg-green-100 border border-green-400 p-3 rounded-md mb-4">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="taskName" className="block text-gray-700 text-sm font-bold mb-2">Task Name:</label>
                    <input type="text" id="taskName" name="taskName" value={formData.taskName} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Category:</label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                        {taskCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4}
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="expectedStartDate" className="block text-gray-700 text-sm font-bold mb-2">Expected Start Date:</label>
                    <input type="date" id="expectedStartDate" name="expectedStartDate" value={formData.expectedStartDate} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="expectedWorkingHours" className="block text-gray-700 text-sm font-bold mb-2">Expected Working Hours:</label>
                    <input type="number" id="expectedWorkingHours" name="expectedWorkingHours" value={formData.expectedWorkingHours} onChange={handleChange} required min="0.5" step="0.5"
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="hourlyRateOffered" className="block text-gray-700 text-sm font-bold mb-2">Hourly Rate Offered:</label>
                    <input type="number" id="hourlyRateOffered" name="hourlyRateOffered" value={formData.hourlyRateOffered} onChange={handleChange} required min="0" step="10"
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="rateCurrency" className="block text-gray-700 text-sm font-bold mb-2">Currency:</label>
                    <select id="rateCurrency" name="rateCurrency" value={formData.rateCurrency} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                        {currencies.map(curr => (
                            <option key={curr} value={curr}>{curr}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="status" className="block text-gray-700 text-sm font-bold mb-2">Task Status:</label>
                    <select id="status" name="status" value={formData.status} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                        {taskStatuses.map(status => (
                            <option key={status} value={status}>{status.replace(/_/g, ' ')}</option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 w-full"
                    disabled={loading}
                >
                    {loading ? 'Updating Task...' : 'Update Task'}
                </button>
            </form>
        </div>
    );
}