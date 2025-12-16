import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface User {
    id: string;
    username: string;
    email?: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (username: string, password: string, email?: string) => Promise<void>;
    updateProfile: (data: { username?: string; email?: string }) => Promise<void>;
    updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();

    useEffect(() => {
        const checkSession = async () => {
            try {
                const res = await fetch("/api/me");
                const data = await res.json();
                if (data.success) {
                    setUser(data.user);
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
            setUser(null);
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    const updateProfile = async (data: { username?: string; email?: string }) => {
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
