// frontend/src/app/(dashboard)/page.tsx
'use client'; // This directive marks the component as a Client Component

import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function DashboardHome() {
    const { user, canPostTask, canPostSkill } = useAuth();

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Welcome to your Dashboard, {user?.firstName || user?.companyName || user?.email}!</h1>
            <p className="mb-8 text-gray-700 text-lg">What would you like to do today?</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {canPostTask() && ( // Check if the user can post tasks (currently any authenticated user)
                    <div className="bg-blue-50 p-6 rounded-lg shadow-sm border border-blue-200 transition-transform transform hover:scale-103 hover:shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4 text-blue-700">For Task Posters</h2>
                        <ul className="list-disc list-inside space-y-3 text-gray-700 text-base">
                            <li><Link href="/my-tasks" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">View My Posted Tasks</Link></li>
                            <li><Link href="/create-task" className="text-blue-600 hover:text-blue-800 hover:underline font-medium">Post a New Task</Link></li>
                        </ul>
                    </div>
                )}

                {canPostSkill() && ( // Check if the user can post skills (currently any authenticated user)
                    <div className="bg-green-50 p-6 rounded-lg shadow-sm border border-green-200 transition-transform transform hover:scale-103 hover:shadow-lg">
                        <h2 className="text-2xl font-semibold mb-4 text-green-700">For Skilled Providers</h2>
                        <ul className="list-disc list-inside space-y-3 text-gray-700 text-base">
                            <li><Link href="/browse-tasks" className="text-green-600 hover:text-green-800 hover:underline font-medium">Browse Open Tasks</Link></li>
                            <li><Link href="/my-skills" className="text-green-600 hover:text-green-800 hover:underline font-medium">View My Skills</Link></li>
                            <li><Link href="/create-skill" className="text-green-600 hover:text-green-800 hover:underline font-medium">Add a New Skill</Link></li>
                            <li><Link href="/providers/my-accepted-tasks" className="text-green-600 hover:text-green-800 hover:underline font-medium">View Accepted Tasks</Link></li>
                        </ul>
                    </div>
                )}
            </div>

            {/* You could add more sections here, e.g., recent activity, notifications */}
        </div>
    );
}