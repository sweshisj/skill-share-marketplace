// frontend/src/context/AuthContext.tsx
'use client'; // This directive marks the component as a Client Component

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation'; // Use next/navigation for App Router
import api from '../lib/api';
import { User, AuthResponse, LoginRequest, CreateUserRequest } from '../types';

interface AuthContextType {
    user: User | null;
    token: string | null;
    loading: boolean;
    login: (credentials: LoginRequest) => Promise<void>;
    signup: (userData: CreateUserRequest) => Promise<void>;
    logout: () => void;
    isAuthenticated: () => boolean;
    // Renamed for clarity based on business logic:
    canPostTask: () => boolean;
    canPostSkill: () => boolean;
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
        if (storedToken) {
            setToken(storedToken);
            // Validate token and fetch user data
            api.get<User>('/auth/me')
                .then(response => {
                    setUser(response.data);
                })
                .catch((error) => {
                    console.error('Failed to fetch user profile:', error);
                    localStorage.removeItem('token'); // Clear invalid token
                    setToken(null);
                    setUser(null);
                    // Optionally, redirect to login if auto-reauth fails
                    // router.push('/login');
                })
                .finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, []);

    const login = async (credentials: LoginRequest) => {
        setLoading(true);
        try {
            const res = await api.post<AuthResponse>('/auth/login', credentials);
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            setUser(res.data.user);
            router.push('/dashboard'); // Redirect to dashboard after successful login
        } catch (error) {
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
            localStorage.setItem('token', res.data.token);
            setToken(res.data.token);
            setUser(res.data.user);
            router.push('/dashboard'); // Redirect after successful signup
        } catch (error) {
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        router.push('/login'); // Redirect to login page after logout
    };

    const isAuthenticated = () => !!token && !!user;

    // Both 'individual' and 'company' user types can post tasks and skills
    // based on the problem statement's implied flexibility.
    const canPostTask = () => isAuthenticated();
    const canPostSkill = () => isAuthenticated();


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