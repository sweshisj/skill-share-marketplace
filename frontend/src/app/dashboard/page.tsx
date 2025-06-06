// frontend/src/app/(dashboard)/page.tsx
'use client'; // This is a client component as it resides within a client-side layout group

import { useAuth } from '../../context/AuthContext';
import Link from 'next/link';

export default function DashboardHomePage() {
    const { user, isAuthenticated } = useAuth(); // Access user info from context

    // Define UserType if not already imported
    type UserType = 'provider' | 'client'; // Adjust according to your actual types

    // Optionally, type user if possible:
    // interface User { firstName?: string; email: string; userType: UserType; }

    if (!isAuthenticated()) {
        // This case should ideally be handled by the layout redirect,
        // but it's good to have a fallback or a message.
        return <div className="p-6 text-center text-red-500">You must be logged in to view the dashboard.</div>;
    }

    return (
        <div className="p-6 bg-white rounded-lg shadow-md border border-gray-200 text-center">
            <h1 className="text-3xl font-bold mb-4 text-gray-800">Welcome to Your Dashboard, {user?.firstName || user?.email}!</h1>
            <p className="text-lg text-gray-600 mb-8">
                Manage your tasks and skills, or browse for new opportunities.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                <Link href="/my-tasks" className="block p-6 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors duration-200">
                    <h2 className="text-xl font-semibold mb-2">My Posted Tasks</h2>
                    <p className="text-sm">View and manage tasks you've created.</p>
                </Link>
                <Link href="/browse-tasks" className="block p-6 bg-green-500 text-white rounded-lg shadow-md hover:bg-green-600 transition-colors duration-200">
                    <h2 className="text-xl font-semibold mb-2">Browse Open Tasks</h2>
                    <p className="text-sm">Find tasks posted by others to offer your skills.</p>
                </Link>
                <Link href="/my-skills" className="block p-6 bg-purple-500 text-white rounded-lg shadow-md hover:bg-purple-600 transition-colors duration-200">
                    <h2 className="text-xl font-semibold mb-2">My Skills</h2>
                    <p className="text-sm">Manage the skills you offer as a provider.</p>
                </Link>
                <Link href="/create-task" className="block p-6 bg-yellow-500 text-white rounded-lg shadow-md hover:bg-yellow-600 transition-colors duration-200">
                    <h2 className="text-xl font-semibold mb-2">Post a New Task</h2>
                    <p className="text-sm">Need help? Describe your task and find a provider.</p>
                </Link>
                 {(user?.userType as UserType) === 'provider' && (
                    <Link href="/providers/my-accepted-tasks" className="block p-6 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-200">
                        <h2 className="text-xl font-semibold mb-2">My Accepted Tasks</h2>
                        <p className="text-sm">View tasks where your offer was accepted.</p>
                    </Link>
                )}
                 {(user?.userType as UserType) === 'provider' && (
                    <Link href="/providers/my-accepted-tasks" className="block p-6 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 transition-colors duration-200">
                        <h2 className="text-xl font-semibold mb-2">My Accepted Tasks</h2>
                        <p className="text-sm">View tasks where your offer was accepted.</p>
                    </Link>
                )}
            </div>
        </div>
    );
}