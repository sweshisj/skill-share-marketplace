// frontend/src/app/(dashboard)/layout.tsx
'use client';

import Navbar from '../../components/Navbar';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext'; // To check authentication status

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth(); // This now correctly accesses context from a higher-level AuthProvider

  useEffect(() => {
    // Redirect to login if not authenticated and not currently loading auth state
    if (!loading && !isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]); // Depend on isAuthenticated, loading, and router

  // Render a loading state or nothing while authentication status is being determined
  // or if the user is not authenticated and is about to be redirected.
  if (loading || !isAuthenticated()) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-600">Loading dashboard...</p>
      </div>
    );
  }

  // Render the dashboard layout once authenticated
  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <main className="container mx-auto p-4 md:p-8">
        {children}
      </main>
    </div>
  );
}