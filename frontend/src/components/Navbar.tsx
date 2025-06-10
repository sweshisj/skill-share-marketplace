// frontend/src/components/Navbar.tsx
'use client'; // This directive marks the component as a Client Component

import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/navigation';
// No direct type import needed here as User type is correctly inferred from useAuth()

export default function Navbar() {
    const { user, logout, canPostTask, canPostSkill } = useAuth();
    const router = useRouter();

    const handleLogout = () => {
        logout(); // Logout logic handled by AuthContext
        router.push('/login'); // Ensure redirection to login page
    };

    return (
        <nav className="bg-blue-600 text-white p-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link href={user ? "/dashboard" : "/"} className="text-2xl font-bold">
                    SkillShare
                </Link>
                <div className="space-x-4 flex items-center">
                    {user ? (
                        <>
                            {/* Links for Requester role */}
                            {canPostTask() && (
                                <>
                                    <Link href="/dashboard/my-tasks" className="hover:text-blue-200 transition-colors duration-200">My Tasks</Link>
                                    <Link href="/dashboard/create-task" className="hover:text-blue-200 transition-colors duration-200">Post Task</Link>
                                </>
                            )}
                            {/* Links for Provider role */}
                            {canPostSkill() && (
                                <>
                                    <Link href="/dashboard/browse-tasks" className="hover:text-blue-200 transition-colors duration-200">Browse Tasks</Link>
                                    <Link href="/dashboard/my-skills" className="hover:text-blue-200 transition-colors duration-200">My Skills</Link>
                                    <Link href="/dashboard/create-skill" className="hover:text-blue-200 transition-colors duration-200">Add Skill</Link>
                                    <Link href="/dashboard/providers/my-accepted-tasks" className="hover:text-blue-200 transition-colors duration-200">Accepted Tasks</Link>
                                </>
                            )}
                            <span className="text-blue-200 text-lg font-medium ml-4">
                                Hello, {user.firstName || user.companyName || user.email}!
                            </span>
                            <button
                                onClick={handleLogout}
                                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                            >
                                Logout
                            </button>
                        </>
                    ) : (
                        // Links for unauthenticated users
                        <>
                            <Link href="/login" className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Login</Link>
                            <Link href="/signup" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200">Sign Up</Link>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
}