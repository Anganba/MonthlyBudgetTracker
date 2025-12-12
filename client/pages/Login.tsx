import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { Lock, ArrowRight } from "lucide-react"; // Added ArrowRight
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

    return (
        <div className="min-h-screen w-full grid lg:grid-cols-2">
            {/* Left Panel - Branding */}
            <div className="hidden lg:flex flex-col justify-between bg-zinc-900 border-r border-border p-12 relative overflow-hidden">
                {/* Abstract Background Decoration */}
                <div className="absolute top-0 left-0 w-full h-full bg-grid-white/[0.02] -z-10" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl opacity-20 pointer-events-none" />

                <div className="z-10">
                    <div className="flex items-center gap-2 text-primary font-bold text-xl font-serif">
                        <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                            <span className="text-primary text-lg">TK</span>
                        </div>
                        Amar TK Koi
                    </div>
                </div>

                <div className="z-10">
                    <h1 className="text-4xl font-bold font-serif tracking-tight text-white mb-4">
                        Master Your Money,<br />
                        <span className="text-primary">Amplify Your Future.</span>
                    </h1>
                    <p className="text-muted-foreground text-lg max-w-md">
                        Track expenses, set goals, and visualize your financial journey with our intuitive dashboard.
                    </p>
                </div>

                <div className="z-10 text-sm text-muted-foreground">
                    &copy; {new Date().getFullYear()} Monthly Budget Tracker
                </div>
            </div>

            {/* Right Panel - Form */}
            <div className="flex items-center justify-center p-8 bg-background">
                <div className="mx-auto w-full max-w-[350px] space-y-6">
                    <div className="text-center lg:text-left">
                        <h1 className="text-2xl font-bold font-serif tracking-tight">Welcome back</h1>
                        <p className="text-muted-foreground text-sm">
                            Enter your credentials to access your account
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username">Username</Label>
                            <Input
                                id="username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                                className="bg-background"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="bg-background"
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full font-bold group"
                            disabled={isLoading}
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                            {!isLoading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />}
                        </Button>
                    </form>

                    <div className="text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <button
                            type="button"
                            onClick={() => navigate('/register')}
                            className="font-medium text-primary hover:text-primary/90 underline-offset-4 hover:underline"
                        >
                            Sign up
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
