// frontend/src/app/(dashboard)/my-skills/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../../lib/api';
import { Skill } from '../../../types';
import SkillCard from '../../../components/SkillCard'; // Import the SkillCard component
import { useAuth } from '../../../context/AuthContext';
import Link from 'next/link';

export default function MySkillsPage() {
    const [skills, setSkills] = useState<Skill[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();
    const { user, loading: authLoading, canPostSkill } = useAuth();


    useEffect(() => {
        if (authLoading) return;

        if (!user || !canPostSkill()) {
            router.push('/login'); // Redirect if not authenticated or not a provider
            return;
        }

        const fetchMySkills = async () => {
            try {
                // Assuming an endpoint to fetch skills posted by the authenticated provider
                const response = await api.get<Skill[]>(`/skills/my-posted-skills`);
                setSkills(response.data);
            } catch (err: any) {
                console.error('Failed to fetch my skills:', err);
                setError(err.response?.data?.message || 'Failed to load your skills.');
            } finally {
                setLoading(false);
            }
        };

        fetchMySkills();
    }, [user, authLoading, canPostSkill, router]);

    const handleEditSkill = (skillId: string) => {
        router.push(`/dashboard/skills/${skillId}/edit`);
    };

    const handleDeleteSkill = async (skillId: string) => {
        if (!window.confirm('Are you sure you want to delete this skill?')) {
            return;
        }
        setLoading(true); // Indicate loading while deleting
        try {
            await api.delete(`/skills/${skillId}`);
            setSkills(prevSkills => prevSkills.filter(skill => skill.id !== skillId));
            alert('Skill deleted successfully!');
        } catch (err: any) {
            console.error('Failed to delete skill:', err);
            setError(err.response?.data?.message || 'Failed to delete skill.');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="flex justify-center items-center h-64 text-gray-600">Loading skills...</div>;
    }

    if (error) {
        return <div className="text-red-500 bg-red-100 p-4 rounded-md">{error}</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-6 text-green-700">My Skills</h1>

            {skills.length === 0 ? (
                <p className="text-gray-600 text-lg">You haven't added any skills yet. <Link href="/dashboard/create-skill" className="text-green-600 hover:underline">Add a new skill</Link>.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {skills.map(skill => (
                        <SkillCard
                            key={skill.id}
                            skill={skill}
                            showActions={true}
                            onEdit={handleEditSkill}
                            onDelete={handleDeleteSkill}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}