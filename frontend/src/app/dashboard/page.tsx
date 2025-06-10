// frontend/src/app/(dashboard)/page.tsx
'use client'; // This is a client component as it resides within a client-side layout group

import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';
// Import UserRole from your types
import { UserRole } from '../../types';

export default function DashboardHomePage() {
    const { user, isAuthenticated } = useAuth(); // Access user info from context

    if (!isAuthenticated()) {
        // This case should ideally be handled by the layout redirect.
        // It's a fallback for when the AuthContext hasn't fully loaded or redirected yet.
        return <div className="p-6 text-center text-red-500">You must be logged in to view the dashboard.</div>;
    }

    // Now, we correctly check the user's 'role'
    const currentUserRole = user?.role;

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Welcome to Your Dashboard, {user?.firstName || user?.email}!</h1>
            <p className="text-lg text-gray-600 mb-8">
                Manage your tasks and skills, or browse for new opportunities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">

                {/* --- Links for 'Requester' role --- */}
                {currentUserRole === UserRole.Requester && (
                    <>
                        <Link href="/dashboard/my-tasks" className="block p-6 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200">
                            <h2 className="text-xl font-semibold mb-2">My Posted Tasks</h2>
                            <p className="text-sm">View and manage tasks you've created.</p>
                        </Link>
                        <Link href="/dashboard/create-task" className="block p-6 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200">
                            <h2 className="text-xl font-semibold mb-2">Post a New Task</h2>
                            <p className="text-sm">Need help? Describe your task and find a provider.</p>
                        </Link>
                    </>
                )}

                {/* --- Links for 'Provider' role --- */}
                {currentUserRole === UserRole.Provider && (
                    <>
                        <Link href="/dashboard/my-skills" className="block p-6 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 transition-colors duration-200">
                            <h2 className="text-xl font-semibold mb-2">My Skills</h2>
                            <p className="text-sm">Manage the skills you offer as a provider.</p>
                        </Link>
                        <Link href="/dashboard/providers/my-accepted-tasks" className="block p-6 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-200">
                            <h2 className="text-xl font-semibold mb-2">My Accepted Tasks</h2>
                            <p className="text-sm">View tasks where your offer was accepted.</p>
                        </Link>
                        <Link href="/dashboard/browse-tasks" className="block p-6 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200">
                            <h2 className="text-xl font-semibold mb-2">Browse Open Tasks</h2>
                            <p className="text-sm">Find tasks posted by others to offer your skills.</p>
                        </Link>
                    </>
                )}

                {/* You can add common links here that apply to ALL user types,
                    e.g., "Profile Settings", "Help", etc. */}
            </div>
        </div>
    );
}