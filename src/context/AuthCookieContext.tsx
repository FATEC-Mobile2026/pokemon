import React, { createContext, useState, useContext } from "react";
import { router } from "expo-router";
import { login as loginApi, register as registerApi, logout as logoutApi, RegisterRequest } from "@/integration/authCookieIntegration";
import { setUnauthorizedHandlerCookie } from "@/integration/httpClientCookie";

type AuthCookieContextData = {
    isAuthenticated: boolean;
    user: string | null;
    userId: string | null;
    roles: string[];
    isLoading: boolean;
    signIn: (username: string, password: string) => Promise<{ ok: boolean; userId?: string }>;
    signUp: (data: RegisterRequest) => Promise<{ ok: boolean; error?: string }>;
    signOut: () => void;
};

const AuthCookieContext = createContext<AuthCookieContextData>({} as AuthCookieContextData);

export const AuthCookieProvider = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState<string | null>(null);
    const [userId, setUserId] = useState<string | null>(null);
    const [roles, setRoles] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    function clearSession() {
        setUser(null);
        setUserId(null);
        setRoles([]);
        setIsAuthenticated(false);
    }

    React.useEffect(() => {
        setUnauthorizedHandlerCookie(() => {
            clearSession();
            router.replace("/");
        });
    }, []);

    async function signIn(username: string, password: string): Promise<{ ok: boolean; userId?: string }> {
        try {
            const response = await loginApi({ username, password });
            setUser(response.username);
            setUserId(response.userId);
            setRoles(response.roles ?? []);
            setIsAuthenticated(true);
            return { ok: true, userId: response.userId };
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
        try {
            await logoutApi();
        } finally {
            clearSession();
        }
    }

    return (
        <AuthCookieContext.Provider value={{ isAuthenticated, user, userId, roles, signIn, signUp, signOut, isLoading }}>
            {children}
        </AuthCookieContext.Provider>
    );
};

export const useAuthCookie = () => useContext(AuthCookieContext);
