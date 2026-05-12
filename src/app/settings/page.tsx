"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { data } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LockKeyhole, ArrowLeft, Settings, Shield, User } from "lucide-react";
import AppHeader from "@/components/app-header";
import Link from "next/link";
import AdminSidebar from "@/components/admin-sidebar"; // Assumes we use this for admins

export default function SettingsPage() {
    const { user, refreshUser, loading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [currentPin, setCurrentPin] = useState("");
    const [newPin, setNewPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPinSection, setShowPinSection] = useState(false);
    const [showPinRequestSection, setShowPinRequestSection] = useState(false);
    const [pinRequestReason, setPinRequestReason] = useState("");

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
                <AppHeader />
                <main className="flex-1 p-4 sm:p-6 flex items-center justify-center">
                    <Card className="max-w-md w-full mx-auto bg-zinc-900 border-zinc-800 shadow-xl">
                        <CardContent className="p-8 text-center">
                            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20">
                                <Shield className="h-8 w-8 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">Authentication Required</h2>
                            <p className="text-zinc-400 mb-6">You must be logged in to access settings.</p>
                            <Button 
                                onClick={() => router.push('/login')}
                                className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold"
                            >
                                Sign In
                            </Button>
                        </CardContent>
                    </Card>
                </main>
            </div>
        );
    }

    // All authenticated users can access settings
    const dashboardHref = user.role === 'admin' ? '/admin' : '/company-dashboard';

    const handleSetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "You are not logged in." });
            return;
        }

        // For users who already have a PIN, verify current PIN first
        if (user.pinSet) {
            if (!currentPin) {
                toast({ variant: "destructive", title: "Current PIN Required", description: "Please enter your current PIN to update it." });
                return;
            }
            try {
                const isCurrentPinValid = await data.users.verifyPin(user.id, currentPin);
                if (!isCurrentPinValid) {
                    toast({ variant: "destructive", title: "Invalid Current PIN", description: "The current PIN you entered is incorrect." });
                    return;
                }
            } catch (error) {
                toast({ variant: "destructive", title: "Error", description: "Failed to verify current PIN." });
                return;
            }
        }

        if (newPin.length !== 6) {
            toast({ variant: "destructive", title: "Invalid PIN", description: "PIN must be exactly 6 digits." });
            return;
        }
        if (newPin !== confirmPin) {
            toast({ variant: "destructive", title: "PINs Do Not Match", description: "Please ensure both PINs are the same." });
            return;
        }

        setIsLoading(true);
        try {
            // The `update` function in data.ts handles hashing
            await data.users.update(user.id, { pinHash: newPin, pinSet: true });
            await refreshUser(); // Refresh user state in context
            toast({ title: "PIN Updated Successfully", description: "Your PIN has been updated." });
            setCurrentPin("");
            setNewPin("");
            setConfirmPin("");
            setShowPinSection(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update PIN. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleResetPin = async () => {
        if (!user) return;
        
        setIsLoading(true);
        try {
            await data.users.resetPin(user.id);
            await refreshUser();
            toast({ title: "PIN Reset Successfully", description: "Your PIN has been reset. You can now set a new one." });
            setCurrentPin("");
            setNewPin("");
            setConfirmPin("");
            setShowPinSection(true);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to reset PIN. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    const handlePinRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !user.companyId) {
            toast({ variant: "destructive", title: "Error", description: "Missing user information." });
            return;
        }

        if (pinRequestReason.trim().length < 10) {
            toast({ variant: "destructive", title: "Invalid Reason", description: "Please provide a detailed reason (at least 10 characters)." });
            return;
        }

        setIsLoading(true);
        try {
            await data.pinResetRequests.create({
                userId: user.id,
                userName: user.name,
                userEmail: user.email,
                companyId: user.companyId,
                reason: pinRequestReason.trim(),
                status: 'pending',
            });
            toast({ title: "Request Submitted", description: "Your PIN change request has been submitted for admin approval." });
            setPinRequestReason("");
            setShowPinRequestSection(false);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to submit PIN change request. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30">
            {user.role === 'admin' && <AdminSidebar />}
            <div className={`flex flex-col flex-1 ${user.role === 'admin' ? 'sm:pl-20' : ''}`}>
                <AppHeader />
                <main className="flex-1 p-4 sm:p-8 max-w-[1200px] mx-auto w-full">
                    <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 shadow-2xl overflow-hidden rounded-xl">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 opacity-80"></div>
                        <CardHeader className="border-b border-zinc-800/50 pb-6 pt-8 px-8">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                                        <Settings className="h-6 w-6 text-emerald-400" />
                                    </div>
                                    <h1 className="text-3xl font-bold text-white tracking-tight">Account Settings</h1>
                                </div>
                                <Link href={dashboardHref} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-emerald-400 transition-colors">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back to Dashboard</span>
                                </Link>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-10 p-8">
                            {/* Profile Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                                        <User className="h-5 w-5 text-cyan-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Profile Information</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 bg-zinc-950/50 p-6 rounded-xl border border-zinc-800">
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Name</Label>
                                        <p className="text-lg text-zinc-200 font-medium">{user.name}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</Label>
                                        <p className="text-lg text-zinc-200 font-medium">{user.email}</p>
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Role</Label>
                                        <p className="text-lg text-emerald-400 font-medium capitalize">{user.role.replace('_', ' ')}</p>
                                    </div>
                                    {user.companyId && (
                                        <div className="space-y-1.5">
                                            <Label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Company ID</Label>
                                            <p className="text-lg text-zinc-400 font-medium font-mono bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 inline-block">{user.companyId}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="h-px w-full bg-zinc-800/50"></div>

                            {/* Security Section */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-orange-500/10 border border-orange-500/30">
                                        <Shield className="h-5 w-5 text-orange-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Security Settings</h2>
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-6 rounded-xl border border-zinc-800 bg-zinc-950/50 hover:bg-zinc-900/50 transition-colors gap-4">
                                        <div className="flex items-center gap-4">
                                            <div className="p-3 rounded-full bg-zinc-900 border border-zinc-800">
                                                <LockKeyhole className="h-6 w-6 text-orange-400" />
                                            </div>
                                            <div>
                                                <p className="text-lg font-semibold text-white">Secure PIN</p>
                                                <p className="text-sm text-zinc-400 mt-1 flex items-center gap-2">
                                                    {user.pinSet 
                                                        ? <><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span> PIN is currently set and active</>
                                                        : <><span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse"></span> No PIN set - required for sending secure emails</>
                                                    }
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-3 w-full sm:w-auto">
                                            {user.role !== 'employee' && user.pinSet && (
                                                <Button 
                                                    variant="outline" 
                                                    onClick={handleResetPin}
                                                    disabled={isLoading}
                                                    className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 w-full sm:w-auto"
                                                >
                                                    Reset PIN
                                                </Button>
                                            )}
                                            {user.role === 'employee' ? (
                                                <Button 
                                                    onClick={() => setShowPinRequestSection(!showPinRequestSection)}
                                                    disabled={isLoading}
                                                    className="bg-orange-500 text-zinc-950 hover:bg-orange-400 font-semibold shadow-[0_0_15px_rgba(249,115,22,0.3)] w-full sm:w-auto"
                                                >
                                                    Request PIN Change
                                                </Button>
                                            ) : (
                                                <Button 
                                                    onClick={() => setShowPinSection(!showPinSection)}
                                                    disabled={isLoading}
                                                    className="bg-cyan-500 text-zinc-950 hover:bg-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)] w-full sm:w-auto"
                                                >
                                                    {user.pinSet ? "Change PIN" : "Set PIN"}
                                                </Button>
                                            )}
                                        </div>
                                    </div>

                                    {showPinSection && (
                                        <Card className="border-cyan-500/20 bg-cyan-500/5 shadow-inner mt-4 overflow-hidden rounded-xl animate-in slide-in-from-top-4 duration-300">
                                            <CardHeader className="bg-zinc-950/50 border-b border-zinc-800">
                                                <CardTitle className="text-xl text-white flex items-center gap-2">
                                                    <LockKeyhole className="h-5 w-5 text-cyan-400" />
                                                    {user.pinSet ? "Update Your PIN" : "Set Your PIN"}
                                                </CardTitle>
                                                <CardDescription className="text-zinc-400">
                                                    {user.pinSet 
                                                        ? "Enter your current PIN and choose a new 6-digit PIN."
                                                        : "Choose a secure 6-digit PIN for authorizing email operations."
                                                    }
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <form onSubmit={handleSetPin} className="space-y-6">
                                                    {user.pinSet && (
                                                        <div className="space-y-3 max-w-sm">
                                                            <Label htmlFor="currentPin" className="text-sm font-semibold text-zinc-300">Current PIN</Label>
                                                            <Input
                                                                id="currentPin"
                                                                type="password"
                                                                maxLength={6}
                                                                value={currentPin}
                                                                onChange={e => setCurrentPin(e.target.value.replace(/\D/g, ''))}
                                                                required={user.pinSet}
                                                                className="text-center text-3xl tracking-[0.8em] h-14 bg-zinc-950 border-zinc-800 text-white focus-visible:ring-cyan-500 font-mono"
                                                                placeholder="••••••"
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="space-y-3 max-w-sm">
                                                        <Label htmlFor="newPin" className="text-sm font-semibold text-zinc-300">New 6-Digit PIN</Label>
                                                        <Input
                                                            id="newPin"
                                                            type="password"
                                                            maxLength={6}
                                                            value={newPin}
                                                            onChange={e => setNewPin(e.target.value.replace(/\D/g, ''))}
                                                            required
                                                            className="text-center text-3xl tracking-[0.8em] h-14 bg-zinc-950 border-zinc-800 text-white focus-visible:ring-cyan-500 font-mono"
                                                            placeholder="••••••"
                                                        />
                                                    </div>
                                                    <div className="space-y-3 max-w-sm">
                                                        <Label htmlFor="confirmPin" className="text-sm font-semibold text-zinc-300">Confirm New PIN</Label>
                                                        <Input 
                                                            id="confirmPin" 
                                                            type="password" 
                                                            maxLength={6}
                                                            value={confirmPin}
                                                            onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                                            required
                                                            className="text-center text-3xl tracking-[0.8em] h-14 bg-zinc-950 border-zinc-800 text-white focus-visible:ring-cyan-500 font-mono"
                                                            placeholder="••••••"
                                                        />
                                                    </div>
                                                    <div className="flex gap-4 pt-4 max-w-sm">
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            onClick={() => setShowPinSection(false)}
                                                            disabled={isLoading}
                                                            className="flex-1 h-11 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button 
                                                            type="submit" 
                                                            disabled={isLoading}
                                                            className="flex-1 h-11 bg-cyan-500 text-zinc-950 hover:bg-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                                                        >
                                                            {isLoading ? "Saving..." : user.pinSet ? "Update PIN" : "Set PIN"}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {showPinRequestSection && user.role === 'employee' && (
                                        <Card className="border-orange-500/20 bg-orange-500/5 shadow-inner mt-4 overflow-hidden rounded-xl animate-in slide-in-from-top-4 duration-300">
                                            <CardHeader className="bg-zinc-950/50 border-b border-zinc-800">
                                                <CardTitle className="text-xl text-white flex items-center gap-2">
                                                    <User className="h-5 w-5 text-orange-400" />
                                                    Request PIN Change
                                                </CardTitle>
                                                <CardDescription className="text-zinc-400">
                                                    Please provide a reason for the PIN change request. This will be sent to your admin for approval.
                                                </CardDescription>
                                            </CardHeader>
                                            <CardContent className="p-6">
                                                <form onSubmit={handlePinRequest} className="space-y-6">
                                                    <div className="space-y-3">
                                                        <Label htmlFor="pinRequestReason" className="text-sm font-semibold text-zinc-300">Reason for PIN Change</Label>
                                                        <Textarea
                                                            id="pinRequestReason"
                                                            value={pinRequestReason}
                                                            onChange={e => setPinRequestReason(e.target.value)}
                                                            required
                                                            maxLength={250}
                                                            className="text-base min-h-[120px] bg-zinc-950 border-zinc-800 text-white focus-visible:ring-orange-500"
                                                            placeholder="Please provide a detailed reason for your PIN change request..."
                                                        />
                                                        <p className="text-xs text-orange-400 font-medium">
                                                            {pinRequestReason.length}/250 characters (minimum 10 required)
                                                        </p>
                                                    </div>
                                                    <div className="flex gap-4 pt-4 max-w-sm">
                                                        <Button 
                                                            type="button" 
                                                            variant="outline" 
                                                            onClick={() => setShowPinRequestSection(false)}
                                                            disabled={isLoading}
                                                            className="flex-1 h-11 border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button 
                                                            type="submit" 
                                                            disabled={isLoading}
                                                            className="flex-1 h-11 bg-orange-500 text-zinc-950 hover:bg-orange-400 font-semibold shadow-[0_0_15px_rgba(249,115,22,0.3)]"
                                                        >
                                                            {isLoading ? "Submitting..." : "Submit Request"}
                                                        </Button>
                                                    </div>
                                                </form>
                                            </CardContent>
                                        </Card>
                                    )}
                                </div>
                            </div>

                            <div className="h-px w-full bg-zinc-800/50"></div>

                            {/* Additional Settings Placeholder */}
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/30">
                                        <Settings className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <h2 className="text-xl font-bold text-white tracking-tight">Preferences</h2>
                                </div>
                                <div className="bg-zinc-950/50 border border-zinc-800 rounded-xl p-8 text-center">
                                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20">
                                        <Settings className="h-8 w-8 text-indigo-400" />
                                    </div>
                                    <p className="text-lg text-zinc-400 font-medium">
                                        Additional settings and preferences will be available here in future updates.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </main>
            </div>
        </div>
    );
}
