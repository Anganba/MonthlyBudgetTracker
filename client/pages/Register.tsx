import React, { useState } from 'react';
import { useAuth } from '../lib/auth';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowRight, CheckCircle2, Sparkles, Coins, CreditCard, Banknote, CircleDollarSign } from "lucide-react";
import { motion } from "framer-motion";

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

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.05,
                delayChildren: 0.1,
            },
        },
    };

    const itemVariants = {
        hidden: { opacity: 0, x: -15 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: "spring" as const, stiffness: 350, damping: 25 },
        },
    };

    return (
        <div className="min-h-screen w-full bg-background overflow-hidden relative">
            {/* Desktop Layout */}
            <div className="hidden lg:grid lg:grid-cols-2 min-h-screen">
                {/* Left Panel - Premium Branding */}
                <div className="flex flex-col justify-between p-12 relative overflow-hidden">
                    {/* Animated gradient background */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />

                    {/* Decorative moving shapes */}
                    <motion.div
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.3, 0.5, 0.3],
                            rotate: [0, -90, 0]
                        }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                        className="absolute top-40 -right-20 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[100px]"
                    />
                    <motion.div
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.2, 0.4, 0.2],
                            y: [0, 50, 0]
                        }}
                        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                        className="absolute bottom-10 left-10 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[100px]"
                    />

                    {/* Grid pattern overlay */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:50px_50px]" />

                    {/* Floating Money Icons */}
                    <motion.div
                        animate={{ y: [0, -20, 0], rotate: [0, 10, 0] }}
                        transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
                        className="absolute top-32 right-32 text-primary/20 pointer-events-none"
                    >
                        <Coins className="w-16 h-16" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, 30, 0], x: [0, 15, 0], rotate: [0, -15, 0] }}
                        transition={{ duration: 15, repeat: Infinity, ease: "linear", delay: 1 }}
                        className="absolute bottom-40 left-20 text-primary/20 pointer-events-none"
                    >
                        <CircleDollarSign className="w-20 h-20" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, -25, 0], rotate: [0, 20, 0] }}
                        transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 2 }}
                        className="absolute top-1/3 left-1/4 text-primary/10 pointer-events-none"
                    >
                        <Banknote className="w-24 h-24" />
                    </motion.div>
                    <motion.div
                        animate={{ y: [0, 20, 0], x: [0, -20, 0], rotate: [0, -20, 0] }}
                        transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: 3 }}
                        className="absolute bottom-1/4 right-1/4 text-primary/15 pointer-events-none"
                    >
                        <CreditCard className="w-16 h-16" />
                    </motion.div>

                    {/* Large decorative rings */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] border border-primary/10 rounded-full"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] border border-primary/20 rounded-full"
                    />

                    {/* Logo */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="z-10"
                    >
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <motion.div
                                    animate={{ rotate: -360 }}
                                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-primary/20 rounded-full blur-md"
                                />
                                <img src="/logo.png" alt="Amar Taka Koi" className="w-12 h-12 object-contain relative z-10" />
                            </div>
                            <span className="text-2xl font-bold font-serif text-white tracking-wide">Amar Taka Koi</span>
                        </div>
                    </motion.div>

                    {/* Main content */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="z-10 space-y-10 mt-12"
                    >
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8 }}
                        >
                            <h1 className="text-5xl lg:text-5xl font-bold font-serif tracking-tight text-white leading-[1.1] mb-6">
                                Start Your
                                <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                                    Financial Journey.
                                </span>
                            </h1>
                            <p className="text-zinc-400 text-xl max-w-md leading-relaxed font-light">
                                Join thousands taking control of their finances with our intuitive budget tracker.
                            </p>
                        </motion.div>

                        {/* Benefits list */}
                        <motion.div variants={containerVariants} className="space-y-4 max-w-md">
                            {benefits.map((benefit, index) => (
                                <motion.div key={index} variants={itemVariants}>
                                    <div className="flex items-center gap-4 text-zinc-300 group transition-transform duration-150 ease-out hover:translate-x-1.5 cursor-default">
                                        <div className="p-1 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 transition-transform group-hover:scale-110" />
                                        </div>
                                        <span className="font-medium group-hover:text-white transition-colors">{benefit}</span>
                                    </div>
                                </motion.div>
                            ))}
                        </motion.div>
                    </motion.div>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1, duration: 1 }}
                        className="z-10 flex items-center gap-2 text-sm text-zinc-500 font-medium"
                    >
                        <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                        <span>&copy; {new Date().getFullYear()} Anganba Singha</span>
                    </motion.div>
                </div>

                {/* Right Panel - Register Form */}
                <div className="flex items-center justify-center p-8 bg-zinc-950 relative overflow-hidden">
                    {/* Subtle glow behind form */}
                    <motion.div
                        animate={{
                            opacity: [0.1, 0.15, 0.1],
                            scale: [1, 1.1, 1]
                        }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] pointer-events-none"
                    />

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.1 }}
                        className="mx-auto w-full max-w-[420px] space-y-8 relative z-10"
                    >
                        {/* Header */}
                        <div className="text-left space-y-3">
                            <motion.h2
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25, delay: 0.15 }}
                                className="text-4xl font-bold font-serif tracking-tight text-white inline-flex items-center gap-3"
                            >
                                Create account
                            </motion.h2>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-zinc-400 text-lg"
                            >
                                Get started in less than a minute
                            </motion.p>
                        </div>

                        {/* Form */}
                        <motion.form
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.25, type: "spring", stiffness: 350, damping: 25 }}
                            onSubmit={handleSubmit}
                            className="space-y-6 bg-zinc-900/40 p-8 rounded-3xl border border-white/5 backdrop-blur-xl shadow-2xl"
                        >
                            <div className="space-y-2.5">
                                <Label htmlFor="username" className="text-zinc-300 font-medium ml-1">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="h-14 bg-black/40 border-white/10 focus:border-primary focus:ring-primary/20 placeholder:text-zinc-600 rounded-xl text-base focus:bg-black/60"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="email" className="text-zinc-300 font-medium ml-1">Email (Optional)</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-14 bg-black/40 border-white/10 focus:border-primary focus:ring-primary/20 placeholder:text-zinc-600 rounded-xl text-base focus:bg-black/60"
                                />
                            </div>
                            <div className="space-y-2.5">
                                <Label htmlFor="password" className="text-zinc-300 font-medium ml-1">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="Choose a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-14 bg-black/40 border-white/10 focus:border-primary focus:ring-primary/20 placeholder:text-zinc-600 rounded-xl text-base focus:bg-black/60"
                                />
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-sm font-medium text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-14 font-bold text-lg group bg-primary hover:bg-primary/90 text-black shadow-[0_0_20px_rgba(190,242,100,0.3)] hover:shadow-[0_0_30px_rgba(190,242,100,0.5)] rounded-xl transition-all duration-300 ease-out relative overflow-hidden"
                                disabled={isLoading}
                            >
                                <span className="relative z-10 flex items-center justify-center">
                                    {isLoading ? 'Creating account...' : 'Create account'}
                                    {!isLoading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1.5 transition-transform duration-300 ease-out" />}
                                </span>
                                {/* Button shine effect */}
                                <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                            </Button>
                        </motion.form>

                        {/* Divider */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.35 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800/80" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase font-medium tracking-wider">
                                <span className="bg-zinc-950 px-3 text-zinc-500 rounded-full">Already a member?</span>
                            </div>
                        </motion.div>

                        {/* Sign in link */}
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45, type: "spring", stiffness: 300, damping: 25 }}
                            className="text-center"
                        >
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl border-2 border-zinc-800/80 text-zinc-300 hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all duration-300 ease-out font-medium"
                            >
                                Sign in to your account
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </motion.div>
                    </motion.div>
                </div>
            </div>

            {/* Mobile Layout */}
            <div className="lg:hidden min-h-screen flex flex-col overflow-hidden bg-black relative">
                {/* Mobile Background Elements */}
                <motion.div
                    animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.3, 0.4, 0.3],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/20 rounded-full blur-[80px] pointer-events-none"
                />
                <motion.div
                    animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.2, 0.3, 0.2],
                    }}
                    transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 2 }}
                    className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-primary/10 rounded-full blur-[80px] pointer-events-none"
                />

                {/* Mobile Hero Section - Compact */}
                <motion.div
                    initial={{ opacity: 0, y: -15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 350, damping: 25, delay: 0.05 }}
                    className="relative px-6 pt-10 pb-6 shrink-0 z-10"
                >
                    <div className="flex flex-col items-center justify-center gap-4 text-center">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 0.2, type: "spring" }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-primary/30 rounded-full blur-md animate-pulse" />
                            <img src="/logo.png" alt="Amar Taka Koi" className="w-14 h-14 object-contain relative z-10" />
                        </motion.div>

                        <div>
                            <h1 className="text-3xl font-bold font-serif tracking-tight text-white leading-tight mb-2">
                                Finance Journey
                            </h1>
                            <p className="text-zinc-400 text-sm max-w-[250px] mx-auto">
                                Join thousands taking control of their finances
                            </p>
                        </div>
                    </div>
                </motion.div>

                {/* Mobile Form Section - Scrollable */}
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.15 }}
                    className="flex-1 px-6 pb-8 pt-6 bg-zinc-950/80 backdrop-blur-2xl rounded-t-[40px] border-t border-white/10 z-10 overflow-y-auto"
                >
                    <div className="max-w-md mx-auto space-y-6">
                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-1.5">
                                <Label htmlFor="username-mobile" className="text-zinc-300 text-sm font-medium ml-1">Username</Label>
                                <Input
                                    id="username-mobile"
                                    type="text"
                                    placeholder="Choose a username"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required
                                    className="h-12 bg-black/50 border-white/10 focus:border-primary focus:ring-primary/20 placeholder:text-zinc-600 rounded-xl transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="email-mobile" className="text-zinc-300 text-sm font-medium ml-1">Email (Optional)</Label>
                                <Input
                                    id="email-mobile"
                                    type="email"
                                    placeholder="name@example.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="h-12 bg-black/50 border-white/10 focus:border-primary focus:ring-primary/20 placeholder:text-zinc-600 rounded-xl transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <Label htmlFor="password-mobile" className="text-zinc-300 text-sm font-medium ml-1">Password</Label>
                                <Input
                                    id="password-mobile"
                                    type="password"
                                    placeholder="Choose a strong password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="h-12 bg-black/50 border-white/10 focus:border-primary focus:ring-primary/20 placeholder:text-zinc-600 rounded-xl transition-all"
                                />
                            </div>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="text-xs font-medium text-red-400 bg-red-500/10 border border-red-500/20 p-3 rounded-xl"
                                >
                                    {error}
                                </motion.div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-12 mt-2 font-bold text-base group bg-primary hover:bg-primary/90 text-black shadow-[0_0_15px_rgba(190,242,100,0.3)] rounded-xl transition-all"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Creating account...' : 'Create account'}
                                {!isLoading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                            </Button>
                        </form>

                        {/* Divider */}
                        <div className="relative py-3">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-zinc-800" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase font-medium">
                                <span className="bg-zinc-950 px-3 text-zinc-500">Already a member?</span>
                            </div>
                        </div>

                        {/* Sign in link */}
                        <div className="text-center pb-6">
                            <button
                                type="button"
                                onClick={() => navigate('/login')}
                                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:text-primary transition-colors text-sm font-medium"
                            >
                                Sign in to your account
                                <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
};
export default Register;
