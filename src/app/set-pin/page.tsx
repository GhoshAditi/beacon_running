"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { data } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GuardianMailLogo from "@/components/icons/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LockKeyhole } from "lucide-react";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function SetPinPage() {
    const { user, refreshUser } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [pin, setPin] = useState("");
    const [confirmPin, setConfirmPin] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // Redirect users based on their setup status
    if (user) {
        if (user.setupToken) {
            // Users with setup tokens should go through onboarding flow instead
            router.push(`/onboarding/${user.setupToken}`);
            return null;
        } else if (!user.pinSet) {
            // Users without PIN and no setup token stay on this page for PIN setup
        } else {
            // Users with PIN already set go to appropriate dashboard
            if (user.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/company-dashboard');
            }
            return null;
        }
    }


    const handleSetPin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) {
            toast({ variant: "destructive", title: "Error", description: "You are not logged in." });
            return;
        }
        if (pin.length !== 6) {
            toast({ variant: "destructive", title: "Invalid PIN", description: "PIN must be exactly 6 digits." });
            return;
        }
        if (pin !== confirmPin) {
            toast({ variant: "destructive", title: "PINs Do Not Match", description: "Please ensure both PINs are the same." });
            return;
        }
        setIsLoading(true);
        try {
            // The `update` function in data.ts now handles hashing
            await data.users.update(user.id, { pinHash: pin, pinSet: true });
            await refreshUser(); // Refresh user state in context
            toast({ title: "PIN Set Successfully", description: "You can now access the dashboard." });

            // Redirect based on user role
            if (user.role === 'admin') {
                router.push('/admin');
            } else {
                router.push('/company-dashboard');
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to set PIN. Please try again." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
            <Navbar />
            <main className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-20 relative overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <Card className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl relative z-10 overflow-hidden mt-8 mb-8">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                    <CardHeader className="text-center pt-8 pb-4">
                        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-950 border border-zinc-800 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
                            <LockKeyhole className="h-6 w-6 text-emerald-400" />
                        </div>
                        <CardTitle className="text-2xl text-white font-bold tracking-tight">Set Security PIN</CardTitle>
                        <CardDescription className="text-zinc-400 mt-2">
                            Create a 6-digit secure PIN. You will use this PIN to authorize sending secure emails and decrypting sensitive data.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-8">
                        <form onSubmit={handleSetPin} className="space-y-6">
                            <div className="space-y-2">
                                <Label htmlFor="pin" className="text-zinc-300 font-medium">New 6-Digit PIN</Label>
                                <Input
                                    id="pin"
                                    type="password"
                                    maxLength={6}
                                    value={pin}
                                    onChange={e => setPin(e.target.value.replace(/\D/g, ''))} // Only allow digits
                                    required
                                    className="text-center text-2xl tracking-[0.7em] bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-700 focus-visible:ring-emerald-500 h-14 font-mono"
                                    placeholder="••••••"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirmPin" className="text-zinc-300 font-medium">Confirm PIN</Label>
                                <Input
                                    id="confirmPin"
                                    type="password"
                                    maxLength={6}
                                    value={confirmPin}
                                    onChange={e => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    required
                                    className="text-center text-2xl tracking-[0.7em] bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-700 focus-visible:ring-emerald-500 h-14 font-mono"
                                    placeholder="••••••"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all h-12 text-md mt-4" disabled={isLoading}>
                                {isLoading ? "Saving PIN..." : "Set PIN and Continue"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
