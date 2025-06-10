// frontend/src/app/(dashboard)/create-skill/page.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { CreateSkillRequest, SkillCategory, WorkNature, Currency } from '../../../types';
import { useAuth } from '../../../context/AuthContext';

export default function CreateSkillPage() {
    const router = useRouter();
    const { user, canPostSkill } = useAuth();

    const [formData, setFormData] = useState<CreateSkillRequest>({
        category: 'Tutoring', // Default category
        experience: '',
        natureOfWork: 'online', // Default
        hourlyRate: 0,
        rateCurrency: 'AUD', // Default currency
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const skillCategories: SkillCategory[] = ['Tutoring', 'Handyman', 'Consulting'];
    const workNatures: WorkNature[] = ['onsite', 'online'];
    const currencies: Currency[] = ['USD', 'AUD', 'SGD', 'INR'];

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'hourlyRate' ? parseFloat(value) : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        if (!canPostSkill()) {
            setError('You must be authorized to add a skill.');
            setLoading(false);
            return;
        }

        try {
            await api.post('/skills', formData);
            setSuccess('Skill added successfully!');
            setFormData({ // Reset form fields
                category: 'Tutoring',
                experience: '',
                natureOfWork: 'online',
                hourlyRate: 0,
                rateCurrency: 'AUD',
            });
            router.push('/dashboard/my-skills'); // Redirect to my skills page
        } catch (err: any) {
            console.error('Failed to create skill:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to add skill. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-green-700">Add a New Skill</h1>
            {error && <p className="text-red-500 bg-red-100 border border-red-400 p-3 rounded-md mb-4">{error}</p>}
            {success && <p className="text-green-500 bg-green-100 border border-green-400 p-3 rounded-md mb-4">{success}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Category:</label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        {skillCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="experience" className="block text-gray-700 text-sm font-bold mb-2">Experience (e.g., "5 years", "Advanced", "Beginner"):</label>
                    <input type="text" id="experience" name="experience" value={formData.experience} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="natureOfWork" className="block text-gray-700 text-sm font-bold mb-2">Nature of Work:</label>
                    <select id="natureOfWork" name="natureOfWork" value={formData.natureOfWork} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        {workNatures.map(nature => (
                            <option key={nature} value={nature}>{nature.charAt(0).toUpperCase() + nature.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="hourlyRate" className="block text-gray-700 text-sm font-bold mb-2">Hourly Rate You Charge:</label>
                    <input type="number" id="hourlyRate" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} required min="0" step="10"
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="rateCurrency" className="block text-gray-700 text-sm font-bold mb-2">Currency:</label>
                    <select id="rateCurrency" name="rateCurrency" value={formData.rateCurrency} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    >
                        {currencies.map(curr => (
                            <option key={curr} value={curr}>{curr}</option>
                        ))}
                    </select>
                </div>
                <button
                    type="submit"
                    className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 w-full"
                    disabled={loading}
                >
                    {loading ? 'Adding Skill...' : 'Add Skill'}
                </button>
            </form>
        </div>
    );
}