import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as loginApi, register as registerApi } from "@/integration/authIntegration";

type AuthContextData = {
    isAuthenticated: boolean;
    user: string | null;
    isLoading: boolean;
    signIn: (username: string, password: string) => Promise<{ ok: boolean; userId?: string }>;
    signUp: (username: string, password: string) => Promise<{ ok: boolean; userId?: string; error?: string }>;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData() {
            const storageUser = await AsyncStorage.getItem("@Auth:user");
            if (storageUser) {
                setUser(storageUser);
                setIsAuthenticated(true);
            }
            setIsLoading(false);
        }
        loadStorageData();
    }, []);

    async function signIn(username: string, password: string): Promise<{ ok: boolean; userId?: string }> {
        try {
            const response = await loginApi({ username, password });
            setUser(username.trim());
            setIsAuthenticated(true);
            await AsyncStorage.setItem("@Auth:user", username.trim());
            return { ok: true, userId: response.userId };
        } catch {
            return { ok: false };
        }
    }

    async function signUp(username: string, password: string): Promise<{ ok: boolean; userId?: string; error?: string }> {
        try {
            const response = await registerApi({ username, password });
            return { ok: true, userId: response.userId };
        } catch (err: any) {
            const message = err?.response?.data?.message ?? 'Não foi possível criar o usuário.';
            return { ok: false, error: message };
        }
    }

    async function signOut() {
        setUser(null);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem("@Auth:user");
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, signIn, signUp, signOut, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
