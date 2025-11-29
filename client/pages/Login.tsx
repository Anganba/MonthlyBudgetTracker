import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Lock } from "lucide-react";

export default function Login() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });

            const data = await res.json();

            if (res.ok) {
                login(data.user);
                toast({
                    title: "Welcome back!",
                    description: "You have successfully logged in.",
                });
                navigate("/");
            } else {
                toast({
                    variant: "destructive",
                    title: "Login failed",
                    description: data.message || "Invalid credentials",
                });
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Something went wrong. Please try again.",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                <div className="text-center">
                    <div className="mx-auto h-12 w-12 bg-budget-header/20 rounded-full flex items-center justify-center mb-4">
                        <Lock className="h-6 w-6 text-budget-header" />
                    </div>
                    <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                        Sign in to your account
                    </h2>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-sans">
                        Secure access to your budget dashboard
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-4">
                        <div>
                            <label
                                htmlFor="username"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans"
                            >
                                Username
                            </label>
                            <input
                                id="username"
                                name="username"
                                type="text"
                                required
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-budget-header focus:border-budget-header sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-sans"
                                placeholder="Enter your username"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-budget-header focus:border-budget-header sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-sans"
                                placeholder="Enter your password"
                                import React, {useState} from "react";
                            import {useAuth} from "@/lib/auth";
                            import {useToast} from "@/components/ui/use-toast";
                            import {useNavigate} from "react-router-dom";
                            import {Lock} from "lucide-react";

                            export default function Login() {
    const [username, setUsername] = useState("");
                            const [password, setPassword] = useState("");
                            const [isLoading, setIsLoading] = useState(false);
                            const {login} = useAuth();
                            const {toast} = useToast();
                            const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
                                e.preventDefault();
                            setIsLoading(true);

                            try {
            const res = await fetch("/api/login", {
                                method: "POST",
                            headers: {"Content-Type": "application/json" },
                            body: JSON.stringify({username, password}),
            });

                            const data = await res.json();

                            if (res.ok) {
                                login(data.user);
                            toast({
                                title: "Welcome back!",
                            description: "You have successfully logged in.",
                });
                            navigate("/");
            } else {
                                toast({
                                    variant: "destructive",
                                    title: "Login failed",
                                    description: data.message || "Invalid credentials",
                                });
            }
        } catch (error) {
                                toast({
                                    variant: "destructive",
                                    title: "Error",
                                    description: "Something went wrong. Please try again.",
                                });
        } finally {
                                setIsLoading(false);
        }
    };

                            return (
                            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
                                <div className="max-w-md w-full space-y-8 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                                    <div className="text-center">
                                        <div className="mx-auto h-12 w-12 bg-budget-header/20 rounded-full flex items-center justify-center mb-4">
                                            <Lock className="h-6 w-6 text-budget-header" />
                                        </div>
                                        <h2 className="text-3xl font-serif font-bold text-gray-900 dark:text-white">
                                            Sign in to your account
                                        </h2>
                                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 font-sans">
                                            Secure access to your budget dashboard
                                        </p>
                                    </div>
                                    <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                                        <div className="space-y-4">
                                            <div>
                                                <label
                                                    htmlFor="username"
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans"
                                                >
                                                    Username
                                                </label>
                                                <input
                                                    id="username"
                                                    name="username"
                                                    type="text"
                                                    required
                                                    value={username}
                                                    onChange={(e) => setUsername(e.target.value)}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-budget-header focus:border-budget-header sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-sans"
                                                    placeholder="Enter your username"
                                                />
                                            </div>
                                            <div>
                                                <label
                                                    htmlFor="password"
                                                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 font-sans"
                                                >
                                                    Password
                                                </label>
                                                <input
                                                    id="password"
                                                    name="password"
                                                    type="password"
                                                    required
                                                    value={password}
                                                    onChange={(e) => setPassword(e.target.value)}
                                                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-budget-header focus:border-budget-header sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-sans"
                                                    placeholder="Enter your password"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <button
                                                type="submit"
                                                disabled={isLoading}
                                                className={`group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-budget-header hover:bg-budget-header/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-budget-header transition-colors ${isLoading ? 'opacity-50 cursor-not-allowed' : ''
                                                    } font-sans`}
                                            >
                                                {isLoading ? "Signing in..." : "Sign in"}
                                            </button>
                                        </div>

                                        <div className="text-center">
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                Don't have an account?{" "}
                                                <button
                                                    type="button"
                                                    onClick={() => navigate('/register')}
                                                    className="font-medium text-budget-header hover:text-budget-header/90 dark:text-budget-header/70"
                                                >
                                                    Sign up
                                                </button>
                                            </p>
                                        </div>
                                    </form>
                                </div>
                            </div>
                            );
}
