import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, Wallet, CheckCircle2, Sparkles } from "lucide-react";

const Register = () => {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            await register(username, password, email);
            navigate('/');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    const benefits = [
        "Track all your income & expenses",
        "Set and achieve savings goals",
        "Multiple wallet management",
        "Beautiful analytics & insights",
        "Recurring transaction support",
        "100% free, no hidden costs",
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
                    <div className="absolute top-40 -right-20 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                    <div className="absolute bottom-10 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse delay-1000" />

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
                                Start Your
                                <br />
                                <span className="text-primary">Financial Journey.</span>
                            </h1>
                            <p className="text-gray-400 text-lg max-w-md leading-relaxed">
                                Join thousands taking control of their finances with our intuitive budget tracker.
                            </p>
                        </div>

                        {/* Benefits list */}
                        <div className="space-y-3 max-w-md">
                            {benefits.map((benefit, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-3 text-gray-300"
                                >
                                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                                    <span>{benefit}</span>
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

                {/* Right Panel - Register Form */}
                <div className="flex items-center justify-center p-8 bg-zinc-950 relative">
                    {/* Subtle glow */}
                    <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

                    <div className="mx-auto w-full max-w-[400px] space-y-8 relative z-10">
                        {/* Header */}
                        <div className="text-left space-y-2">
                            <h1 className="text-3xl font-bold font-serif tracking-tight text-white">
                                Create your account
                            </h1>
                            <p className="text-gray-400">
                                Get started in less than a minute
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="username" className="text-gray-300">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="h-12 bg-zinc-900 border-zinc-800 focus:border-primary focus:ring-primary/20 placeholder:text-gray-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-gray-300">Email (Optional)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 bg-zinc-900 border-zinc-800 focus:border-primary focus:ring-primary/20 placeholder:text-gray-600"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-gray-300">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Choose a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 bg-zinc-900 border-zinc-800 focus:border-primary focus:ring-primary/20 placeholder:text-gray-600"
                                />
                            </div>

                            {error && (
                                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 font-bold text-base group bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating account...' : 'Create account'}
                                {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-950 px-2 text-gray-500">Already a member?</span>
                            </div>
                        </div>

                        {/* Sign in link */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-zinc-800 text-gray-300 hover:text-primary hover:border-primary/50 transition-all duration-200"
                            >
                                Sign in to your account
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
                                Start Your <span className="text-primary">Financial Journey</span>
                            </h1>
                            <p className="text-gray-400 text-xs">
                                Join thousands taking control of their finances
                            </p>
                        </div>

                        {/* Benefits - Horizontal scroll on mobile */}
                        <div className="flex gap-2 overflow-x-auto pb-1 -mx-6 px-6 scrollbar-hide">
                            {benefits.slice(0, 4).map((benefit, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-zinc-800/50 border border-zinc-700 whitespace-nowrap shrink-0"
                                >
                                    <CheckCircle2 className="w-3 h-3 text-primary shrink-0" />
                                    <span className="text-[11px] text-gray-300">{benefit}</span>
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
                                Create your account
                            </h2>
                            <p className="text-gray-400 text-xs">
                                Get started in less than a minute
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-3">
                            <div className="space-y-1">
                                <Label htmlFor="username-mobile" className="text-gray-300 text-sm">Username</Label>
                                <Input
                                    id="username-mobile"
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="h-10 bg-zinc-900 border-zinc-800 focus:border-primary focus:ring-primary/20 placeholder:text-gray-600"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="email-mobile" className="text-gray-300 text-sm">Email (Optional)</Label>
                                <Input
                                    id="email-mobile"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-10 bg-zinc-900 border-zinc-800 focus:border-primary focus:ring-primary/20 placeholder:text-gray-600"
                                />
                            </div>
                            <div className="space-y-1">
                                <Label htmlFor="password-mobile" className="text-gray-300 text-sm">Password</Label>
                                <Input
                                    id="password-mobile"
                                    type="password"
                                    placeholder="Choose a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-10 bg-zinc-900 border-zinc-800 focus:border-primary focus:ring-primary/20 placeholder:text-gray-600"
                                />
                            </div>

                            {error && (
                                <div className="text-xs text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl">
                                    {error}
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-10 font-bold text-sm group bg-primary hover:bg-primary/90 text-black shadow-lg shadow-primary/20"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating account...' : 'Create account'}
                                {!isLoading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative py-2">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-zinc-950 px-2 text-gray-500">Already a member?</span>
                            </div>
                        </div>

                        {/* Sign in link */}
                        <div className="text-center">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl border border-zinc-800 text-gray-300 hover:text-primary hover:border-primary/50 transition-all duration-200 text-sm"
                            >
                                Sign in to your account
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
};
export default Register;

