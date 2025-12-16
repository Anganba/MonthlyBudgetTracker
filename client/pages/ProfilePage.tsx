import React, { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Settings, LogOut, Shield, CreditCard, Mail, Loader2, Edit, Save, Linkedin, Github } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
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
        return name
            .substring(0, 2)
            .toUpperCase();
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

    return (
        <div className="min-h-screen bg-background text-foreground p-8">
            <h1 className="text-3xl font-bold font-serif mb-8 text-white">Profile</h1>

            <div className="max-w-4xl mx-auto space-y-8">
                {/* User Info Card */}
                <Card className="bg-card border-white/10 shadow-md">
                    <CardContent className="pt-6">
                        <div className="flex flex-col md:flex-row items-center gap-6">
                            <Avatar className="h-24 w-24 border-2 border-primary">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary/20 text-primary text-2xl font-bold">
                                    {user?.username ? getInitials(user.username) : "U"}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 text-center md:text-left space-y-1">
                                <h2 className="text-2xl font-bold text-white flex items-center justify-center md:justify-start gap-2">
                                    {user?.username}
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-white" onClick={openEditProfile}>
                                        <Edit className="h-3 w-3" />
                                    </Button>
                                </h2>
                                <p className="text-muted-foreground flex items-center justify-center md:justify-start gap-2">
                                    <Mail className="h-4 w-4" /> {user?.email || "No email set"}
                                </p>
                                <div className="pt-2">
                                    <span className="inline-flex items-center rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2">
                                        Free Plan
                                    </span>
                                </div>
                            </div>
                            <Button variant="outline" className="border-white/10 hover:bg-white/5" onClick={handleLogout}>
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-8 md:grid-cols-2">
                    {/* General Settings */}
                    <Card className="bg-card border-white/10 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Settings className="h-5 w-5 text-primary" />
                                General Settings
                            </CardTitle>
                            <CardDescription>Manage your account preferences</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition" onClick={openEditProfile}>
                                <div className="space-y-0.5">
                                    <h4 className="font-medium text-white">Profile Information</h4>
                                    <p className="text-sm text-muted-foreground">Update your name and email</p>
                                </div>
                                <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Security & Notifications */}
                    <Card className="bg-card border-white/10 shadow-md">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                Security
                            </CardTitle>
                            <CardDescription>Keep your account safe</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-2 hover:bg-white/5 rounded-lg cursor-pointer transition" onClick={openChangePassword}>
                                <div className="space-y-0.5">
                                    <h4 className="font-medium text-white">Password</h4>
                                    <p className="text-sm text-muted-foreground">Change your password</p>
                                </div>
                                <Button variant="ghost" size="icon"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscription */}
                    <Card className="bg-card border-white/10 shadow-md md:col-span-2">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <CreditCard className="h-5 w-5 text-primary" />
                                Subscription
                            </CardTitle>
                            <CardDescription>Manage your plan and billing</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-white font-medium">Free Plan</p>
                                    <p className="text-sm text-muted-foreground">You are currently on the free plan.</p>
                                </div>
                                <Button
                                    className="bg-[#bef264] text-black hover:bg-[#a3e635]"
                                    onClick={() => toast({ title: "Coming Soon", description: "Pro plan is currently unavailable." })}
                                >
                                    Upgrade to Pro
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="text-center pt-8 border-t border-white/10 mt-12 pb-8">
                    <p className="text-muted-foreground mb-4 font-sans">&copy; {new Date().getFullYear()} Anganba Singha. All rights reserved.</p>
                    <div className="flex justify-center gap-6">
                        <a href="https://www.linkedin.com/in/anganbasingha/" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            <Linkedin className="h-6 w-6" />
                        </a>
                        <a href="https://github.com/anganba" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-primary transition-colors">
                            <Github className="h-6 w-6" />
                        </a>
                    </div>
                </div>

                {/* Edit Profile Dialog */}
                <Dialog open={isEditProfileOpen} onOpenChange={setIsEditProfileOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Edit Profile</DialogTitle>
                            <DialogDescription>Make changes to your profile here. Click save when you're done.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="username" className="text-right text-sm font-medium">Username</label>
                                <Input id="username" value={profileForm.username} onChange={e => setProfileForm({ ...profileForm, username: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="email" className="text-right text-sm font-medium">Email</label>
                                <Input id="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="col-span-3" type="email" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsEditProfileOpen(false)}>Cancel</Button>
                            <Button type="button" onClick={handleUpdateProfile} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Save changes
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Change Password Dialog */}
                <Dialog open={isChangePasswordOpen} onOpenChange={setIsChangePasswordOpen}>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>Enter your current password and a new password.</DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="current" className="text-right text-sm font-medium">Current</label>
                                <Input id="current" type="password" value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="new" className="text-right text-sm font-medium">New</label>
                                <Input id="new" type="password" value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} className="col-span-3" />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <label htmlFor="confirm" className="text-right text-sm font-medium">Confirm</label>
                                <Input id="confirm" type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} className="col-span-3" />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="secondary" onClick={() => setIsChangePasswordOpen(false)}>Cancel</Button>
                            <Button type="button" onClick={handleChangePassword} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Update Password
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}

function ChevronRight({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <path d="m9 18 6-6-6-6" />
        </svg>
    )
}
