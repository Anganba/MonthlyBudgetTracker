import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wallet, TrendingUp, PiggyBank, BarChart3, Shield, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
            await login(username, password);
            toast({
                title: "Welcome back!",
                description: "You have successfully logged in.",
            });
            navigate("/");
        } catch (error: any) {
            toast({
                variant: "destructive",
                title: "Login failed",
                description: error.message || "Invalid credentials",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const features = [
        { icon: TrendingUp, text: "Track income & expenses" },
        { icon: PiggyBank, text: "Set savings goals" },
        { icon: BarChart3, text: "Visualize finances" },
        { icon: Shield, text: "Secure & private" },
    ];

    return (
        <div className="min-h-screen w-full bg-black">
            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-2 min-h-screen">
                {/* Left Panel - Premium Branding */}
                <div className="flex flex-col justify-between p-12 relative overflow-hidden">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />

                    {/* Decorative circles */}
                    <div className="absolute top-20 -left-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-20 right-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />

                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(190,242,100,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(190,242,100,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />

                    {/* Large decorative ring */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border-2 border-primary/20 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] border border-primary/10 rounded-full" />

                    {/* Logo */}
                    <div className="z-10">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                <Wallet className="w-6 h-6 text-black" />
                            </div>
                            <span className="text-2xl font-bold font-serif text-white">Amar Taka Koi</span>
                        </div>
                    </div>

                    {/* Main content */}
                    <div className="z-10 space-y-8">
                        <div>
                            <h1 className="text-5xl font-bold font-serif tracking-tight text-white leading-tight mb-4">
                                Master Your Money,
                                <br />
                                <span className="text-primary">Amplify Your Future.</span>
                            </h1>
                            <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                                Take control of your finances with powerful tracking, smart goals, and beautiful insights.
                            </p>
                        </div>

                        {/* Feature list */}
                        <div className="grid grid-cols-2 gap-4 max-w-md">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm"
                                >
                                    <div className="p-2 rounded-lg bg-primary/20">
                                        <feature.icon className="w-4 h-4 text-primary" />
                                    </div>
                                    <span className="text-sm text-gray-300">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="z-10 flex items-center gap-2 text-sm text-gray-500">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <span>&copy; {new Date().getFullYear()} Anganba Singha</span>
                    </div>
                </div>

                {/* Right Panel - Login Form */}
                <div className="flex items-center justify-center p-8 bg-zinc-950 relative">
                    {/* Subtle glow */}
                    <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

                    <div className="mx-auto w-full max-w-[400px] space-y-8 relative z-10">
                        {/* Header */}
                        <div className="text-left space-y-2">
                            <h1 className="text-3xl font-bold font-serif tracking-tight text-white">
                                Welcome back
                            </h1>
                            <p className="text-gray-400">
                                Enter your credentials to access your account
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-gray-300">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="h-12 bg-zinc-900 border-zinc-800 focus:border-primary focus:ring-primary/20 placeholder:text-gray-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-300">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 bg-zinc-900 border-zinc-800 focus:border-primary focus:ring-primary/20 placeholder:text-gray-600"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-12 font-bold text-base group bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20"
                                disabled={isLoading}
                            >
                                {isLoading ? "Signing in..." : "Sign in"}
                                {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-950 px-2 text-gray-500">New here?</span>
                            </div>
                        </div>

                        {/* Sign up link */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-800 text-gray-300 hover:text-primary hover:border-primary/50 transition-all duration-200"
                            >
                                Create an account
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden h-screen flex flex-col overflow-hidden">
                {/* Mobile Hero Section - Compact */}
                <div className="relative px-6 pt-6 pb-4 overflow-hidden shrink-0">
                    {/* Background elements */}
                    <div className="absolute inset-0 bg-gradient-to-b from-black via-zinc-900/50 to-zinc-950" />
                    <div className="absolute top-10 right-0 w-48 h-48 bg-primary/20 rounded-full blur-3xl" />
                    <div className="absolute top-5 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl" />

                    {/* Decorative ring */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 border border-primary/20 rounded-full" />

                    <div className="relative z-10">
                        {/* Logo */}
                        <div className="flex items-center justify-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                                <Wallet className="w-4 h-4 text-black" />
                            </div>
                            <span className="text-lg font-bold font-serif text-white">Amar Taka Koi</span>
                        </div>

                        {/* Heading */}
                        <div className="text-center mb-4">
                            <h1 className="text-2xl font-bold font-serif tracking-tight text-white leading-tight mb-1">
                                Master Your <span className="text-primary">Money</span>
                            </h1>
                            <p className="text-gray-400 text-xs">
                                Take control of your finances with powerful insights
                            </p>
                        </div>

                        {/* Features - Horizontal scroll on mobile */}
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-hide">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700 whitespace-nowrap shrink-0"
                                >
                                    <div className="p-1 rounded-md bg-primary/20 shrink-0">
                                        <feature.icon className="w-3 h-3 text-primary" />
                                    </div>
                                    <span className="text-[11px] text-gray-300">{feature.text}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Mobile Form Section - Scrollable if needed */}
                <div className="flex-1 px-6 pb-4 pt-3 bg-zinc-950 overflow-y-auto">
                    <div className="max-w-md mx-auto space-y-4">
                        {/* Header */}
                        <div className="text-center space-y-0.5">
                            <h2 className="text-xl font-bold font-serif text-white">
                                Welcome back
                            </h2>
                            <p className="text-gray-400 text-xs">
                                Enter your credentials to continue
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="username-mobile" className="text-gray-300 text-sm">Username</Label>
                                <Input
                                    id="username-mobile"
                                    type="text"
                                    placeholder="Enter your username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="h-10 bg-zinc-900 border-zinc-800 focus:border-primary focus:ring-primary/20 placeholder:text-gray-600"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="password-mobile" className="text-gray-300 text-sm">Password</Label>
                                <Input
                                    id="password-mobile"
                                    type="password"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-10 bg-zinc-900 border-zinc-800 focus:border-primary focus:ring-primary/20 placeholder:text-gray-600"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full h-10 font-bold text-sm group bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20"
                                disabled={isLoading}
                            >
                                {isLoading ? "Signing in..." : "Sign in"}
                                {!isLoading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-950 px-2 text-gray-500">New here?</span>
                            </div>
                        </div>

                        {/* Sign up link */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/register')}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-zinc-800 text-gray-300 hover:text-primary hover:border-primary/50 transition-all duration-200 text-sm"
                            >
                                Create an account
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 pt-2">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <span>&copy; {new Date().getFullYear()} Anganba Singha</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


