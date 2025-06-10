// frontend/src/app/dashboard/skills/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import api from '../../../../../lib/api';
import { UpdateSkillRequest, Skill, SkillCategory, WorkNature, Currency, UserRole } from '../../../../../types';
import { useAuth } from '../../../../../context/AuthContext';

export default function EditSkillPage() {
    const router = useRouter();
    const params = useParams();
    const skillId = params.id as string;
    const { user, loading: authLoading, isAuthenticated } = useAuth();

    // Initialize formData as null. The form will only render once this is populated.
    const [formData, setFormData] = useState<UpdateSkillRequest | null>(null);

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const skillCategories: SkillCategory[] = ['Tutoring', 'Handyman', 'Consulting'];
    const workNatures: WorkNature[] = ['onsite', 'online'];
    const currencies: Currency[] = ['USD', 'AUD', 'SGD', 'INR'];

    useEffect(() => {
        if (authLoading) return;

        if (!isAuthenticated()) {
            router.push('/login');
            return;
        }

        if (user && user.role !== UserRole.Provider) {
            setError('Access Denied: Only providers can edit skills.');
            setLoading(false);
            return;
        }

        const fetchSkill = async () => {
            try {
                // The API endpoint /skills/:id should ideally return a single object, not an array.
                // However, based on your console log, it returns an array containing a single object.
                // So, we'll access the first element of that array.
                const response = await api.get<Skill[]>(`/skills/${skillId}`); // Type assertion for array

                // Check if the array is not empty and get the first skill object
                const skillData = response.data[0] as Skill;

                if (!skillData) {
                    setError('Skill data not found in API response for ID: ' + skillId);
                    setLoading(false);
                    return;
                }

                setFormData({
                    category: skillData.category,
                    experience: skillData.experience,
                    natureOfWork: skillData.natureOfWork,
                    // Ensure hourlyRate is a number, handling potential string or null/undefined
                    hourlyRate: typeof skillData.hourlyRate === 'number' ? skillData.hourlyRate : parseFloat((skillData.hourlyRate as any)?.toString() || '0'),
                    rateCurrency: skillData.rateCurrency,
                });
          

            } catch (err: any) {
                console.error('Failed to fetch skill:', err);
                if (err.response?.status === 403 || (err.response?.data?.message && err.response.data.message.includes('permission'))) {
                    setError('You do not have permission to edit this skill.');
                } else if (err.response?.status === 404) {
                    setError('Skill not found.');
                } else {
                    setError(err.response?.data?.message || 'Failed to load skill for editing.');
                }
            } finally {
                setLoading(false);
            }
        };

        if (skillId) {
            fetchSkill();
        }
    }, [skillId, user, authLoading, isAuthenticated, router]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => {
            if (!prev) return null; // Should not happen with current loading checks

            return {
                ...prev,
                [name]: name === 'hourlyRate' ? parseFloat(value) : value
            };
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);
        setLoading(true);

        if (!formData) {
            setError('Skill data not loaded. Please try refreshing.');
            setLoading(false);
            return;
        }

        try {
            await api.put(`/skills/${skillId}`, formData);
            setSuccess('Skill updated successfully!');
            setTimeout(() => {
                router.push('/dashboard/my-skills');
            }, 1500);
        } catch (err: any) {
            console.error('Failed to update skill:', err.response?.data || err);
            setError(err.response?.data?.message || 'Failed to update skill. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Show loading spinner while fetching data or if formData is not yet populated
    if (loading || formData === null) {
        return <div className="flex justify-center items-center h-64 text-gray-600">Loading skill details...</div>;
    }

    // Show error message if an error occurred during fetch
    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-yellow-700">Edit Skill: {formData.category}</h1>
            {success && <p className="text-green-500 bg-green-100 border border-green-400 p-3 rounded-md mb-4">{success}</p>}

            {/* Added key={skillId} to the form */}
            <form onSubmit={handleSubmit} className="space-y-4" key={skillId}>
                <div>
                    <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Category:</label>
                    <select id="category" name="category" value={formData.category} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                        {skillCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="experience" className="block text-gray-700 text-sm font-bold mb-2">Experience:</label>
                    <input type="text" id="experience" name="experience" value={formData.experience} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    />
                </div>
                <div>
                    <label htmlFor="natureOfWork" className="block text-gray-700 text-sm font-bold mb-2">Nature of Work:</label>
                    <select id="natureOfWork" name="natureOfWork" value={formData.natureOfWork} onChange={handleChange} required
                        className="shadow-sm border border-gray-300 rounded-md w-full py-2 px-3 text-gray-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:border-transparent"
                    >
                        {workNatures.map(nature => (
                            <option key={nature} value={nature}>{nature.charAt(0).toUpperCase() + nature.slice(1)}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="hourlyRate" className="block text-gray-700 text-sm font-bold mb-2">Hourly Rate You Charge:</label>
                    <input type="number" id="hourlyRate" name="hourlyRate" value={formData.hourlyRate} onChange={handleChange} required min="0" step="10"
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
                <button
                    type="submit"
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2.5 px-4 rounded-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 w-full"
                    disabled={loading}
                >
                    {loading ? 'Updating Skill...' : 'Update Skill'}
                </button>
            </form>
        </div>
    );
}