import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { apiClient } from '../utils/api';
import type { LoginRequest, RegisterRequest } from '../utils/api';

interface User {
    id: string;
    email: string;
    name?: string;
    surname?: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    login: (data: LoginRequest) => Promise<void>;
    register: (data: RegisterRequest) => Promise<void>;
    logout: () => void;
    isAuthenticated: boolean;
    refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const storedUser = apiClient.getStoredUser();
        if (storedUser && apiClient.isAuthenticated()) {
            setUser(storedUser);
        }
        setLoading(false);
    }, []);

    const login = async (data: LoginRequest) => {
        const response = await apiClient.login(data);
        apiClient.setAuth(response.token, response.user);
        setUser(response.user);
    };

    const register = async (data: RegisterRequest) => {
        const response = await apiClient.register(data);
        apiClient.setAuth(response.token, response.user);
        setUser(response.user);
    };

    const logout = () => {
        apiClient.logout();
        setUser(null);
    };

    const refreshUser = async () => {
        try {
            const profile = await apiClient.getProfile() as {
                id: string;
                email: string;
                name?: string;
                surname?: string;
                role: string;
            };
            const updatedUser = {
                id: profile.id,
                email: profile.email,
                name: profile.name,
                surname: profile.surname,
                role: profile.role,
            };
            apiClient.setAuth(apiClient.getAuthToken()!, updatedUser);
            setUser(updatedUser);
        } catch (error) {
            console.error('Failed to refresh user:', error);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                loading,
                login,
                register,
                logout,
                isAuthenticated: !!user,
                refreshUser,
            }}
        >
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

