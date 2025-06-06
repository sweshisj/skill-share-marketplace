// frontend/src/app/(dashboard)/layout.tsx
'use client'; // This directive marks the component as a Client Component

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext'; // Use alias for easier import
import Navbar from '../../components/Navbar';

export default function DashboardLayout({ children }: { children: ReactNode }) {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // If not loading and not authenticated, redirect to login
        if (!loading && !isAuthenticated()) {
            router.push('/login');
        }
    }, [isAuthenticated, loading, router]); // Dependencies for the effect

    // Show a loading state or nothing while authentication is being checked
    if (loading || !isAuthenticated()) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-100">
                <p className="text-xl text-gray-700">Loading application...</p>
            </div>
        );
    }

    // Render the layout only if authenticated
    return (
        <div className="min-h-screen bg-gray-100 flex flex-col">
            <Navbar /> {/* Your navigation bar */}
            <main className="flex-grow p-4 md:p-8 max-w-7xl mx-auto w-full">
                {children} {/* Renders the page component */}
            </main>
        </div>
    );
}