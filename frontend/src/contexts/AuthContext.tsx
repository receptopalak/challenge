import React, { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { apiClient, setAuthHeader, clearAuthHeader } from '../services/api';
import { toast } from 'react-hot-toast';

interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    is_staff: boolean;
}

interface AuthTokens {
    access: string;
    refresh: string;
}

interface AuthContextType {
    user: User | null;
    tokens: AuthTokens | null;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [tokens, setTokens] = useState<AuthTokens | null>(() => {
        const storedTokens = localStorage.getItem('authTokens');
        return storedTokens ? JSON.parse(storedTokens) : null;
    });
    const [isLoading, setIsLoading] = useState(true);

    const login = async (username: string, password: string) => {
        try {
            const response = await apiClient.post('/token/', { username, password });
            const data: AuthTokens = response.data;
            setTokens(data);
            localStorage.setItem('authTokens', JSON.stringify(data));
            setAuthHeader(data.access);
            await fetchUser();
            toast.success('Login successful!');
        } catch (error) {
            toast.error('Login failed. Invalid username or password.');
            throw new Error("Login failed");
        }
    };

    const logout = () => {
        setUser(null);
        setTokens(null);
        localStorage.removeItem('authTokens');
        clearAuthHeader();
        toast.success('Successfully logged out.');
    };

    const fetchUser = async () => {
        try {
            const { data } = await apiClient.get('/fleet/users/me/');
            setUser(data);
        } catch (error) {
            // Token may be invalid, end session
            logout();
        }
    };

    useEffect(() => {
        // This useEffect runs whenever `tokens` state changes.
        // This way apiClient's authorization header always stays current.
        if (tokens) {
            setAuthHeader(tokens.access);
        } else {
            clearAuthHeader();
        }
    }, [tokens]); // We add `tokens` as dependency.

    useEffect(() => {
        // This useEffect only runs when the application is first loaded.
        // Tries to fetch user with existing token.
        const initializeAuth = async () => {
            if (tokens) {
                // setAuthHeader already called by the useEffect above.
                await fetchUser();
            }
            setIsLoading(false);
        };
        initializeAuth();
    }, []); // Empty dependency array ensures it runs only on mount.


    const contextValue = {
        user,
        tokens,
        login,
        logout,
        isLoading
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}; 