import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface User {
    id: string;
    username: string;
}
import React, { createContext, useContext, useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";

interface User {
    id: string;
    username: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (username: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    register: (username: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    // The useToast hook is no longer used in the provided change for login/logout,
    // but keeping it here as it was in the original document and not explicitly removed.
    // If the intent is to remove it, it should be explicitly stated.
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

    const register = async (username: string, password: string) => {
        const res = await fetch("/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });
        const data = await res.json();
        if (!data.success) throw new Error(data.message);
        setUser(data.user);
    };

    const logout = async () => {
        try {
            await fetch("/api/logout", { method: "POST" });
            setUser(null);
            // The toast call was removed in the provided change, but keeping it commented
            // in case it was an oversight and should be re-added.
            // toast({
            //     title: "Logged out",
            //     description: "You have been successfully logged out.",
            // });
        } catch (error) {
            console.error("Logout failed", error);
        }
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
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
