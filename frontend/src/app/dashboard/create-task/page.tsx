// frontend/src/app/(dashboard)/create-task/page.tsx
'use client'; // This directive marks the component as a Client Component

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { CreateTaskRequest, TaskCategory, Currency } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

export default function CreateTaskPage() {
    const router = useRouter();
    const { user, canPostTask } = useAuth(); // Ensure user is authenticated and can post tasks

    const [formData, setFormData] = useState<CreateTaskRequest>({
        category: 'Tutoring', // Default category
        taskName: '',
        description: '',
        expectedStartDate: new Date().toISOString().split('T')[0], // Default to today's date
        expectedWorkingHours: 1,
        hourlyRateOffered: 0,
        rateCurrency: 'AUD', // Default currency
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    // Hardcoded lists for dropdowns - these could be fetched from backend if dynamic
    const taskCategories: TaskCategory[] = ['Tutoring', 'Handyman', 'Consulting'];
    const currencies: Currency[] = ['USD', 'AUD', 'SGD', 'INR'];

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

        if (!canPostTask()) {
            setError('You must be authorized to post a task.');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/tasks', formData);
            setSuccess('Task posted successfully!');
            // Optionally clear form or redirect
            setFormData({ // Reset form fields
                category: 'Tutoring',
                taskName: '',
                description: '',
                expectedStartDate: new Date().toISOString().split('T')[0],
                expectedWorkingHours: 1,
                hourlyRateOffered: 0,
                rateCurrency: 'AUD',
            });
            router.push('/dashboard/my-tasks'); // Redirect to the user's posted tasks page
        } catch (err: any) {
            console.error('Failed to create task:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to create task. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-blue-700">Post a New Task</h1>
            {error && <p className="text-red-500 bg-red-100 border border-red-400 p-3 rounded-md mb-4">{error}</p>}
            {success && <p className="text-green-500 bg-green-100 border border-green-400 p-3 rounded-md mb-4">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="taskName" className="block text-gray-700 text-sm font-bold mb-2">Task Name:</label>
                    <input type="text" id="taskName" name="taskName" value={formData.taskName} onChange={handleChange} required
                        className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Category:</label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                        {taskCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={4}
                        className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="expectedStartDate" className="block text-gray-700 text-sm font-bold mb-2">Expected Start Date:</label>
                    <input type="date" id="expectedStartDate" name="expectedStartDate" value={formData.expectedStartDate} onChange={handleChange} required
                        className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="expectedWorkingHours" className="block text-gray-700 text-sm font-bold mb-2">Expected Working Hours:</label>
                    <input type="number" id="expectedWorkingHours" name="expectedWorkingHours" value={formData.expectedWorkingHours} onChange={handleChange} required min="0.5" step="0.5"
                        className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="hourlyRateOffered" className="block text-gray-700 text-sm font-bold mb-2">Hourly Rate Offered:</label>
                    <input type="number" id="hourlyRateOffered" name="hourlyRateOffered" value={formData.hourlyRateOffered} onChange={handleChange} required min="0" step="10"
                        className="shadow-sm appearance-none border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="rateCurrency" className="block text-gray-700 text-sm font-bold mb-2">Currency:</label>
                    <select id="rateCurrency" name="rateCurrency" value={formData.rateCurrency} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                    {loading ? 'Posting Task...' : 'Post Task'}
                </button>
            </form>
        </div>
    );
}