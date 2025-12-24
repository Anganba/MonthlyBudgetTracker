import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    User, Settings, LogOut, Shield, CreditCard, Mail, Loader2, Edit,
    ChevronRight, Linkedin, Github, Sparkles, Crown, Key, UserCircle,
    Zap, Heart, ExternalLink
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";

export default function ProfilePage() {
    const { user, logout, updateProfile, updatePassword } = useAuth();
    const { toast } = useToast();

    // Dialog States
    const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);

    // Form States
    const [profileForm, setProfileForm] = useState({ username: "", email: "" });
    const [passwordForm, setPasswordForm] = useState({ current: "", new: "", confirm: "" });
    const [isLoading, setIsLoading] = useState(false);

    const handleLogout = async () => {
        await logout();
    };

    const getInitials = (name: string) => {
        return name.substring(0, 2).toUpperCase();
    };

    // Open Helpers
    const openEditProfile = () => {
        setProfileForm({ username: user?.username || "", email: user?.email || "" });
        setIsEditProfileOpen(true);
    };

    const openChangePassword = () => {
        setPasswordForm({ current: "", new: "", confirm: "" });
        setIsChangePasswordOpen(true);
    };

    // Handlers
    const handleUpdateProfile = async () => {
        if (!profileForm.username) return;
        setIsLoading(true);
        try {
            await updateProfile({ username: profileForm.username, email: profileForm.email });
            toast({ title: "Profile updated", description: "Your details have been saved." });
            setIsEditProfileOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChangePassword = async () => {
        if (passwordForm.new !== passwordForm.confirm) {
            toast({ title: "Error", description: "Passwords do not match", variant: "destructive" });
            return;
        }
        setIsLoading(true);
        try {
            await updatePassword(passwordForm.current, passwordForm.new);
            toast({ title: "Success", description: "Password updated successfully." });
            setIsChangePasswordOpen(false);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const proFeatures = [
        "Unlimited wallets & transactions",
        "Advanced analytics & reports",
        "Data export (CSV, PDF)",
        "Priority support",
    ];

    return (
        <div className="min-h-screen bg-black text-white p-6 md:p-8 relative overflow-hidden">
            {/* Background decorations */}
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="relative z-10 mb-8">
                <h1 className="text-4xl font-bold font-serif text-white">Profile</h1>
                <p className="text-gray-400 mt-1">Manage your account settings and preferences</p>
            </div>

            <div className="max-w-5xl mx-auto space-y-8 relative z-10">
                {/* Profile Header Card */}
                <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-800 border border-white/10 p-8">
                    {/* Decorative elements */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
                    <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-primary/5 rounded-full blur-2xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8">
                        {/* Avatar */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-primary/30 rounded-full blur-xl scale-110" />
                            <Avatar className="h-32 w-32 border-4 border-primary/50 relative shadow-2xl">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-4xl font-bold">
                                    {user?.username ? getInitials(user.username) : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                onClick={openEditProfile}
                                className="absolute bottom-0 right-0 p-2 bg-primary rounded-full text-black hover:scale-110 transition-transform shadow-lg"
                            >
                                <Edit className="h-4 w-4" />
                            </button>
                        </div>

                        {/* User Info */}
                        <div className="flex-1 text-center lg:text-left space-y-3">
                            <div>
                                <h2 className="text-3xl font-bold font-serif text-white">
                                    {user?.username}
                                </h2>
                                <p className="text-gray-400 flex items-center justify-center lg:justify-start gap-2 mt-1">
                                    <Mail className="h-4 w-4" />
                                    {user?.email || "No email set"}
                                </p>
                            </div>

                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3">
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/20 border border-primary/30 px-4 py-1.5 text-sm font-semibold text-primary">
                                    <Sparkles className="h-4 w-4" />
                                    Free Plan
                                </span>
                                <span className="text-sm text-gray-500">
                                    Member since {new Date().getFullYear()}
                                </span>
                            </div>
                        </div>

                        {/* Logout Button */}
                        <Button
                            variant="outline"
                            className="border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 hover:text-red-300"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </div>
                </div>

                {/* Settings Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Account Settings */}
                    <div className="rounded-2xl bg-zinc-900/50 border border-white/5 p-6 space-y-4 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/20">
                                <UserCircle className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Account Settings</h3>
                                <p className="text-sm text-gray-500">Manage your profile information</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={openEditProfile}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <User className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                                    <div className="text-left">
                                        <p className="font-medium text-white">Profile Information</p>
                                        <p className="text-sm text-gray-500">Update username and email</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>

                    {/* Security */}
                    <div className="rounded-2xl bg-zinc-900/50 border border-white/5 p-6 space-y-4 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-primary/20">
                                <Shield className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-white">Security</h3>
                                <p className="text-sm text-gray-500">Keep your account safe</p>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <button
                                onClick={openChangePassword}
                                className="w-full flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-primary/10 border border-transparent hover:border-primary/30 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <Key className="h-5 w-5 text-gray-400 group-hover:text-primary transition-colors" />
                                    <div className="text-left">
                                        <p className="font-medium text-white">Password</p>
                                        <p className="text-sm text-gray-500">Change your password</p>
                                    </div>
                                </div>
                                <ChevronRight className="h-5 w-5 text-gray-500 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Subscription Card */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border border-white/10 p-8">
                    {/* Background glow */}
                    <div className="absolute top-0 right-0 w-72 h-72 bg-yellow-500/10 rounded-full blur-3xl" />

                    <div className="relative z-10 flex flex-col lg:flex-row gap-8">
                        <div className="flex-1 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-yellow-500/20">
                                    <Crown className="h-6 w-6 text-yellow-500" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-white">Subscription</h3>
                                    <p className="text-sm text-gray-400">Manage your plan and billing</p>
                                </div>
                            </div>

                            <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-lg font-semibold text-white">Free Plan</p>
                                        <p className="text-sm text-gray-400">You're on the free plan</p>
                                    </div>
                                    <span className="text-2xl font-bold text-primary">$0</span>
                                </div>
                            </div>
                        </div>

                        <div className="lg:w-80 space-y-4">
                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/30">
                                <p className="text-sm font-semibold text-primary mb-3 flex items-center gap-2">
                                    <Zap className="h-4 w-4" /> Pro Features
                                </p>
                                <ul className="space-y-2">
                                    {proFeatures.map((feature, i) => (
                                        <li key={i} className="text-sm text-gray-300 flex items-center gap-2">
                                            <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                                            {feature}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <Button
                                className="w-full h-12 bg-gradient-to-r from-primary to-lime-400 text-black font-bold shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-shadow"
                                onClick={() => toast({ title: "Coming Soon", description: "Pro plan is currently unavailable." })}
                            >
                                <Crown className="mr-2 h-5 w-5" />
                                Upgrade to Pro
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="text-center pt-8 border-t border-white/5 space-y-4">
                    <p className="text-gray-500 flex items-center justify-center gap-2">
                        <Heart className="h-4 w-4 text-red-500" />
                        Made with love by Anganba Singha
                    </p>
                    <div className="flex justify-center gap-4">
                        <a
                            href="https://www.linkedin.com/in/anganbasingha/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
                        >
                            <Linkedin className="h-5 w-5" />
                        </a>
                        <a
                            href="https://github.com/anganba"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-3 rounded-xl bg-white/5 text-gray-400 hover:text-primary hover:bg-primary/10 transition-all"
                        >
                            <Github className="h-5 w-5" />
                        </a>
                    </div>
                    <p className="text-xs text-gray-600">
                        &copy; {new Date().getFullYear()} Amar Taka Koi. All rights reserved.
                    </p>
                </div>
            </div>

            {/* Edit Profile Dialog */}
            <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif">Edit Profile</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Update your profile information
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-gray-300">Username</Label>
                            <Input
                                id="username"
                                value={profileForm.username}
                                onChange={e => setProfileForm({ ...profileForm, username: e.target.value })}
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-300">Email</Label>
                            <Input
                                id="email"
                                value={profileForm.email}
                                onChange={e => setProfileForm({ ...profileForm, email: e.target.value })}
                                type="email"
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
                        <Button onClick={handleUpdateProfile} disabled={isLoading} className="bg-primary text-black hover:bg-primary/90">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Change Password Dialog */}
            <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-white/10">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-serif">Change Password</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Enter your current password and choose a new one
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="current" className="text-gray-300">Current Password</Label>
                            <Input
                                id="current"
                                type="password"
                                value={passwordForm.current}
                                onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })}
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="new" className="text-gray-300">New Password</Label>
                            <Input
                                id="new"
                                type="password"
                                value={passwordForm.new}
                                onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirm" className="text-gray-300">Confirm New Password</Label>
                            <Input
                                id="confirm"
                                type="password"
                                value={passwordForm.confirm}
                                onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                                className="h-12 bg-zinc-800 border-zinc-700 focus:border-primary"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                        <Button onClick={handleChangePassword} disabled={isLoading} className="bg-primary text-black hover:bg-primary/90">
                            {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Update Password
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
