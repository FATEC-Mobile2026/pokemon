import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { login as loginApi, register as registerApi, RegisterRequest } from "@/integration/authIntegration";
import { setUnauthorizedHandler } from "@/integration/httpClient";
import { decodeToken, isTokenExpired } from "@/utils/jwt";

type AuthContextData = {
    isAuthenticated: boolean;
    user: string | null;
    token: string | null;
    userId: string | null;
    roles: string[];
    isLoading: boolean;
    signIn: (username: string, password: string) => Promise<{ ok: boolean; userId?: string }>;
    signUp: (data: RegisterRequest) => Promise<{ ok: boolean; error?: string }>;
    signOut: () => void;
};

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<string | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    async function persistSession(newToken: string) {
        const payload = decodeToken(newToken);
        setUser(payload.sub);
        setUserId(payload.sub);
        setRoles(payload.roles ?? []);
        setToken(newToken);
        setIsAuthenticated(true);
        await AsyncStorage.setItem("@Auth:user", payload.sub);
        await AsyncStorage.setItem("@Auth:token", newToken);
        await AsyncStorage.setItem("@Auth:userId", payload.sub);
    }

    async function clearSession() {
        setUser(null);
        setToken(null);
        setUserId(null);
        setRoles([]);
        setIsAuthenticated(false);
        await AsyncStorage.removeItem("@Auth:user");
        await AsyncStorage.removeItem("@Auth:token");
        await AsyncStorage.removeItem("@Auth:userId");
    }

    useEffect(() => {
        async function loadStorageData() {
            const storageToken = await AsyncStorage.getItem("@Auth:token");
            if (storageToken && !isTokenExpired(storageToken)) {
                await persistSession(storageToken);
            } else if (storageToken) {
                await clearSession();
            }
            setIsLoading(false);
        }
        loadStorageData();
    }, []);

    useEffect(() => {
        setUnauthorizedHandler(() => {
            clearSession();
            router.replace("/");
        });
    }, []);

    async function signIn(username: string, password: string): Promise<{ ok: boolean; userId?: string }> {
        try {
            const response = await loginApi({ username, password });
            await persistSession(response.token);
            return { ok: true, userId: decodeToken(response.token).sub };
        } catch {
            return { ok: false };
        }
    }

    async function signUp(data: RegisterRequest): Promise<{ ok: boolean; error?: string }> {
        try {
            await registerApi(data);
            return { ok: true };
        } catch (err: any) {
            const message = err?.response?.data?.message ?? 'Não foi possível criar o usuário.';
            return { ok: false, error: message };
        }
    }

    async function signOut() {
        await clearSession();
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, user, token, userId, roles, signIn, signUp, signOut, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
