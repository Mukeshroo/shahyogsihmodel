import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Worker, UserRole } from '../types/index.ts';

interface AuthContextType {
  user: User | null;
  workerProfile: Worker | null;
  token: string | null;
  loading: boolean;
  login: (email: string) => Promise<boolean>;
  registerUser: (data: any) => Promise<boolean>;
  logout: () => void;
  switchRole: (role: UserRole) => Promise<void>;
  updateWorkerAvailability: (isAvailable: boolean) => Promise<void>;
  refreshUserData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Quick map of demo accounts for the 5 roles
const DEMO_ACCOUNTS: Record<UserRole, string> = {
  customer: 'priya.sharma@example.com',
  worker: 'ramesh.verma@example.com',
  secretary: 'secretary.kalyanpur@sahyog.coop',
  federation: 'director.upfed@sahyog.gov.in',
  admin: 'admin@sahyog.coop'
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [workerProfile, setWorkerProfile] = useState<Worker | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize with Customer by default
  useEffect(() => {
    const savedToken = localStorage.getItem('sahyog_token');
    const savedEmail = localStorage.getItem('sahyog_user_email') || DEMO_ACCOUNTS.customer;
    login(savedEmail).finally(() => setLoading(false));
  }, []);

  const login = async (email: string): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      if (!res.ok) {
        throw new Error('Login failed');
      }
      const data = await res.json();
      setUser(data.user);
      setWorkerProfile(data.workerProfile);
      setToken(data.token);
      localStorage.setItem('sahyog_token', data.token);
      localStorage.setItem('sahyog_user_email', email);
      return true;
    } catch (err) {
      console.error('Login error:', err);
      return false;
    }
  };

  const registerUser = async (formData: any): Promise<boolean> => {
    try {
      const res = await fetch('/api/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Registration failed');
      const data = await res.json();
      setUser(data.user);
      setWorkerProfile(data.workerProfile);
      setToken(data.token);
      localStorage.setItem('sahyog_token', data.token);
      localStorage.setItem('sahyog_user_email', formData.email);
      return true;
    } catch (err) {
      console.error('Registration error:', err);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setWorkerProfile(null);
    setToken(null);
    localStorage.removeItem('sahyog_token');
    localStorage.removeItem('sahyog_user_email');
  };

  const switchRole = async (targetRole: UserRole) => {
    setLoading(true);
    const targetEmail = DEMO_ACCOUNTS[targetRole];
    await login(targetEmail);
    setLoading(false);
  };

  const updateWorkerAvailability = async (isAvailable: boolean) => {
    if (!workerProfile) return;
    try {
      const res = await fetch(`/api/v1/workers/${workerProfile.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isAvailable })
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkerProfile(updated);
      }
    } catch (err) {
      console.error('Failed to update worker availability:', err);
    }
  };

  const refreshUserData = async () => {
    if (user?.email) {
      await login(user.email);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workerProfile,
        token,
        loading,
        login,
        registerUser,
        logout,
        switchRole,
        updateWorkerAvailability,
        refreshUserData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
