// **************************************************************************** #
//                                                                              #
//                                                         :::      ::::::::    #
//    AuthContext.tsx                                    :+:      :+:    :+:    #
//                                                     +:+ +:+         +:+      #
//    By: lsouc <lsouc@student.42paris.fr>           +#+  +:+       +#+         #
//                                                 +#+#+#+#+#+   +#+            #
//    Created: 2026/06/06 22:50:23 by lsouc             #+#    #+#              #
//    Updated: 2026/06/06 22:50:26 by lsouc            ###   ########.fr        #
//                                                                              #
// **************************************************************************** #

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { API_BASE } from "../config";

interface User {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    createdAt: string;
    friendCount: number;
    totpEnabled: boolean;
}

type LoginResult =
    | { status: "ok" }
    | { status: "2fa"; intermediateToken: string }
    | { status: "error"; message: string };

type RegisterResult =
    | { status: "ok" }
    | { status: "error"; message: string };

interface AuthContextValue {
    user: User | null;
    accessToken: string | null;
    loading: boolean;
    login: (email: string, password: string) => Promise<LoginResult>;
    submitTotp: (intermediateToken: string, code: string) => Promise<LoginResult>;
    register: (username: string, email: string, password: string) => Promise<RegisterResult>;
    logout: () => Promise<void>;
    refreshUser: () => Promise<void>;
    authedFetch: (path: string, options?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface Props {
    children: React.ReactNode;
}

export function AuthProvider({ children }: Props) {
    const [user, setUser] = useState<User | null>(null);
    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const accessTokenRef = useRef<string | null>(null);
    const refreshPromiseRef = useRef<Promise<string | null> | null>(null);

    async function fetchMe(token: string): Promise<User | null> {
        const res = await fetch(`${API_BASE}/auth/me`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok)
            return null;
        return (await res.json()) as User;
    }

    function refreshAccessToken(): Promise<string | null> {
        if (refreshPromiseRef.current !== null)
            return refreshPromiseRef.current;

        const promise = (async (): Promise<string | null> => {
            try {
                const res = await fetch(`${API_BASE}/auth/refresh`, {
                    method: "POST",
                    credentials: "include",
                });
                if (!res.ok) {
                    applyAccessToken(null);
                    setUser(null);
                    return null;
                }
                const { accessToken: token } = (await res.json()) as { accessToken: string };
                applyAccessToken(token);
                return token;
            } catch {
                return null;
            } finally {
                refreshPromiseRef.current = null;
            }
        })();

        refreshPromiseRef.current = promise;
        return promise;
    }

    const hasBooted = useRef(false);

    useEffect(() => {
        if (hasBooted.current)
            return;
        hasBooted.current = true;
        async function boot() {
            try {
                const res = await fetch(`${API_BASE}/auth/refresh`, {
                    method: "POST",
                    credentials: "include",
                });
                if (res.status === 409)
                    return;
                if (!res.ok)
                    return;
                const { accessToken: token } = (await res.json()) as { accessToken: string };
                const me = await fetchMe(token);
                applyAccessToken(token);
                setUser(me);
            } catch {
                // network error -> stay logged out
            } finally {
                setLoading(false);
            }
        }
        boot();
    }, []);

    function applyAccessToken(token: string | null) {
        accessTokenRef.current = token;
        setAccessToken(token);
    }

    async function authedFetch(path: string, options: RequestInit = {}): Promise<Response> {
        function withAuth(token: string | null): RequestInit {
            const headers = new Headers(options.headers);
            if (token !== null)
                headers.set("Authorization", `Bearer ${token}`);
	    if (options.body !== undefined && !(options.body instanceof FormData))
                headers.set("Content-Type", "application/json");
            return { ...options, headers, credentials: "include" };
        }

        let res = await fetch(`${API_BASE}${path}`, withAuth(accessTokenRef.current));
        if (res.status !== 401)
            return res;

        const newToken = await refreshAccessToken();
        if (newToken === null)
            return res;

        return fetch(`${API_BASE}${path}`, withAuth(newToken));
    }

    async function login(email: string, password: string): Promise<LoginResult> {
        const res = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email, password }),
        });
        if (res.status === 401)
            return { status: "error", message: "Email ou mot de passe incorrect" };
        if (!res.ok)
            return { status: "error", message: "Une erreur est survenue" };
        const data = (await res.json()) as
            | { accessToken: string }
            | { requires2fa: true; intermediateToken: string };
        if ("requires2fa" in data)
            return { status: "2fa", intermediateToken: data.intermediateToken };
        const me = await fetchMe(data.accessToken);
        applyAccessToken(data.accessToken);
        setUser(me);
        return { status: "ok" };
    }
    
    async function submitTotp(intermediateToken: string, code: string): Promise<LoginResult> {
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (intermediateToken.length > 0)
            headers.Authorization = `Bearer ${intermediateToken}`;
        const res = await fetch(`${API_BASE}/auth/login/2fa`, {
            method: "POST",
            headers,
            credentials: "include",
            body: JSON.stringify({ code }),
        });
        if (res.status === 429)
            return { status: "error", message: "Trop de tentatives, réessayez plus tard" };
        if (res.status === 401)
            return { status: "error", message: "Code invalide" };
        if (!res.ok)
            return { status: "error", message: "Une erreur est survenue" };
        const data = (await res.json()) as { accessToken: string };
        const me = await fetchMe(data.accessToken);
        applyAccessToken(data.accessToken);
        setUser(me);
        return { status: "ok" };
    }

   
    async function register(username: string, email: string, password: string): Promise<RegisterResult> {
        const res = await fetch(`${API_BASE}/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, username, password }),
        });
        if (res.status === 409)
            return { status: "error", message: "Email ou pseudo déjà utilisé" };
        if (!res.ok)
            return { status: "error", message: "Une erreur est survenue" };
        return { status: "ok" };
    }

    async function logout(): Promise<void> {
        try {
            await fetch(`${API_BASE}/auth/logout`, {
                method: "POST",
                credentials: "include",
            });
        } finally {
            applyAccessToken(null);
            setUser(null);
        }
    }

    async function refreshUser(): Promise<void> {
        if (accessTokenRef.current === null)
            return;
        const me = await fetchMe(accessTokenRef.current);
        setUser(me);
    }	
 
    const value: AuthContextValue = { user, accessToken, loading, login, submitTotp, register, logout, refreshUser, authedFetch };
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (ctx === null)
        throw new Error("useAuth must be used within an AuthProvider");
    return ctx;
}
