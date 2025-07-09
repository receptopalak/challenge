import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { User } from '../types';
import { api, setAuthToken } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (username: string, password: string) => {
    setIsLoading(true);
    try {
      const response = await api.post('/token/', { username, password });
      const accessToken = response.data.access;
      
      setToken(accessToken);
      setAuthToken(accessToken); // Set token for all subsequent API requests
      
      // After setting the token, fetch the user's details
      await fetchUser();

    } catch (error) {
      console.error("Login failed:", error);
      // Clear any partial state
      logout();
      // Rethrow the error so the UI can catch it
      throw new Error("Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUser = async () => {
    try {
        const { data } = await api.get('/fleet/users/me/');
        setUser(data);
    } catch (error) {
        console.error("Failed to fetch user:", error);
        // If fetching user fails, token is likely invalid. Log out.
        logout();
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setAuthToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
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