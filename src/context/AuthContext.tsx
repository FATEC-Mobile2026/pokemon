import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { login as loginApi, register as registerApi } from "@/integration/authIntegration";

type AuthContextData = {
    isAuthenticated: boolean;
    user: string | null;
    token: string | null;
    userId: string | null;
    isLoading: boolean;
    signIn: (username: string, password: string) => Promise<{ ok: boolean; userId?: string }>;
    signUp: (username: string, password: string) => Promise<{ ok: boolean; userId?: string; error?: string }>;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        async function loadStorageData() {
            const storageUser = await AsyncStorage.getItem("@Auth:user");
            const storageToken = await AsyncStorage.getItem("@Auth:token");
            const storageUserId = await AsyncStorage.getItem("@Auth:userId");
            if (storageUser) {
                setUser(storageUser);
                setIsAuthenticated(true);
            }
            if (storageToken) setToken(storageToken);
            if (storageUserId) setUserId(storageUserId);
            setIsLoading(false);
        }
        loadStorageData();
    }, []);

    async function signIn(username: string, password: string): Promise<{ ok: boolean; userId?: string }> {
        try {
            const response = await loginApi({ username, password });
            setUser(username.trim());
            setIsAuthenticated(true);
            setToken(response.token);
            setUserId(response.userId);
            await AsyncStorage.setItem("@Auth:user", username.trim());
            await AsyncStorage.setItem("@Auth:token", response.token);
            await AsyncStorage.setItem("@Auth:userId", response.userId);
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
        setToken(null);
        setUserId(null);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem("@Auth:user");
        await AsyncStorage.removeItem("@Auth:token");
        await AsyncStorage.removeItem("@Auth:userId");
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, userId, signIn, signUp, signOut, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
