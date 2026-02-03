import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface User {
    id: string;
    username: string;
    email?: string;
    displayName?: string;
    bio?: string;
    avatarUrl?: string;
    createdAt?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (username: string, password: string, email?: string) => Promise<void>;
    updateProfile: (data: { username?: string; email?: string; displayName?: string; bio?: string; avatarUrl?: string }) => Promise<void>;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const cachedUser = localStorage.getItem("user_session");
            return cachedUser ? JSON.parse(cachedUser) : null;
        } catch {
            return null;
        }
    });

    // If we have a cached user, we can start as "already loaded" to show UI immediately
    // The fetch check will happen in background and redirect if actually invalid
    const [isLoading, setIsLoading] = useState(!user);
    const { toast } = useToast();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/me");
                const data = await res.json();
                if (data.success) {
                    setUser(data.user);
                    localStorage.setItem("user_session", JSON.stringify(data.user));
                } else {
                    // If session check fails but we had a cached user, clear it
                    if (user) {
                        setUser(null);
                        localStorage.removeItem("user_session");
                    }
                }
            } catch (error) {
                console.error("Session check failed", error);
            } finally {
                setIsLoading(false);
            }
        };
        checkSession();
    }, []);

    const login = async (username: string, password: string) => {
        const res = await fetch("/api/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setUser(data.user);
    };

    const register = async (username: string, password: string, email?: string) => {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password, email }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setUser(data.user);
    };

    const logout = async () => {
        try {
            await fetch("/api/logout", { method: "POST" });

            // Clear user-specific cached data from localStorage
            if (user?.id) {
                const keysToRemove: string[] = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    // Check if key contains the user ID (matches our cache key pattern)
                    if (key && key.includes(user.id)) {
                        keysToRemove.push(key);
                    }
                }
                keysToRemove.forEach(key => localStorage.removeItem(key));
            }

            localStorage.removeItem("user_session");
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const updateProfile = async (data: { username?: string; email?: string; displayName?: string; bio?: string; avatarUrl?: string }) => {
        const res = await fetch("/api/profile", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const resData = await res.json();
        if (!resData.success) throw new Error(resData.message);
        setUser(resData.user);
    };

    const updatePassword = async (currentPassword: string, newPassword: string) => {
        const res = await fetch("/api/profile/password", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ currentPassword, newPassword }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, register, updateProfile, updatePassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
};
