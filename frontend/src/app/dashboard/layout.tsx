// frontend/src/app/(dashboard)/layout.tsx
'use client'; // This is a client component as it uses AuthContext and Navbar

import { AuthProvider } from '../../context/AuthContext';
import Navbar from '../../components/Navbar'; // Ensure Navbar is imported and exists
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // To check authentication status

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth(); // Access auth state from context

  useEffect(() => {
    // Redirect to login if not authenticated and not currently loading auth state
    if (!loading && !isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]); // Depend on isAuthenticated, loading, and router

  // Only render content if authenticated or still loading (to prevent flickering)
  if (loading || !isAuthenticated()) {
    // You can render a loading spinner or null here
    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <p className="text-xl text-gray-600">Loading dashboard...</p>
        </div>
    );
  }

  return (
    <AuthProvider> {/* Ensure AuthProvider wraps content if AuthContext is used inside children */}
        <div className="min-h-screen bg-gray-100">
            <Navbar />
            <main className="container mx-auto p-4 md:p-8">
                {children}
            </main>
        </div>
    </AuthProvider>
  );
}