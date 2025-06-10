// frontend/src/context/AuthContext.tsx
'use client'; // This directive marks the component as a Client Component

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import api from '../lib/api';
import { User, AuthResponse, LoginRequest, CreateUserRequest, UserRole, UserType } from '../types'; // Changed UserType to UserType

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    signup: (userData: CreateUserRequest) => Promise<void>;
    logout: () => void;
    isAuthenticated: () => boolean;
    // Renamed for clarity based on business logic:
    canPostTask: () => boolean; // Only requesters can post tasks
    canPostSkill: () => boolean; // Only providers can post skills
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // This effect runs only on the client side
        const storedToken = localStorage.getItem('token');
        const storedUserJson = localStorage.getItem('user'); // Get the JSON string

        if (storedToken && storedUserJson) {
            try {
                const storedUser: User = JSON.parse(storedUserJson);
                setToken(storedToken);
                // Set the token in Axios default headers immediately
                api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;

                // Instead of always fetching /auth/me, you can rely on storedUser
                // and optionally revalidate with /auth/me periodically or on specific actions.
                setUser(storedUser);

                // Optional: Revalidate token and fetch full user data from backend
                // This is good for keeping data fresh and validating tokens are still active.
                api.get<User>('/auth/me')
                    .then(response => {
                        // Update user in state and local storage if fresh data is different
                        if (JSON.stringify(response.data) !== storedUserJson) {
                            setUser(response.data);
                            localStorage.setItem('user', JSON.stringify(response.data));
                        }
                    })
                    .catch((error) => {
                        console.error('Failed to fetch user profile or token invalid:', error);
                        // Clear invalid data and reset state
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        setToken(null);
                        setUser(null);
                        delete api.defaults.headers.common['Authorization']; // Remove header
                        // Optionally, redirect to login if auto-reauth fails
                        // router.push('/login');
                    })
                    .finally(() => setLoading(false));

            } catch (error) {
                console.error("Error parsing stored user data:", error);
                // Clear invalid data if parsing fails
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                setToken(null);
                setUser(null);
                delete api.defaults.headers.common['Authorization']; // Remove header
                setLoading(false);
            }
        } else {
            setLoading(false);
        }
    }, []); // Empty dependency array means this runs once on mount

    const login = async (credentials: LoginRequest) => {
        setLoading(true);
        try {
            const res = await api.post<AuthResponse>('/auth/login', credentials);
            const { token: newToken, user: userData } = res.data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(userData)); // Store full user object
            setToken(newToken);
            setUser(userData);
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`; // Set Axios header

            router.push('/dashboard'); // Redirect to dashboard after successful login
        } catch (error) {
            console.error('Login failed:', error); // Log the error for debugging
            // Re-throw to allow component to catch and display specific error
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const signup = async (userData: CreateUserRequest) => {
        setLoading(true);
        try {
            const res = await api.post<AuthResponse>('/auth/signup', userData);
            const { token: newToken, user: newUser } = res.data;

            localStorage.setItem('token', newToken);
            localStorage.setItem('user', JSON.stringify(newUser)); // Store full user object
            setToken(newToken);
            setUser(newUser);
            api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`; // Set Axios header

            router.push('/dashboard'); // Redirect after successful signup
        } catch (error) {
            console.error('Signup failed:', error); // Log the error for debugging
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user'); // Clear user data from local storage
        setToken(null);
        setUser(null);
        delete api.defaults.headers.common['Authorization']; // Remove Axios header
        router.push('/login'); // Redirect to login page after logout
    };

    const isAuthenticated = () => !!token && !!user;

    // A requester can post tasks
    const canPostTask = () => isAuthenticated() && user?.role === UserRole.Requester;

    // A provider can post skills
    const canPostSkill = () => isAuthenticated() && user?.role === UserRole.Provider;

    return (
        <AuthContext.Provider value={{
            user,
            token,
            loading,
            login,
            signup,
            logout,
            isAuthenticated,
            canPostTask,
            canPostSkill
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};