"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import GuardianMailLogo from "@/components/icons/logo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";


export default function LoginPage() {
    const { login, user: authUser, loading: authLoading } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);


    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await login(email, password);
            // Redirection is handled by the useEffect below
        } catch (error: any) {
            console.error("Login failed", error);
            toast({
                variant: "destructive",
                title: "Login Failed",
                description: error.message || "Invalid credentials. Please try again.",
            })
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading && authUser) {
            // Let the auth context handle redirection based on PIN status
            // This ensures users without PIN are sent to set-pin first
            if (authUser.pinSet) {
                if (authUser.role === 'admin') {
                    router.push('/admin');
                } else {
                    router.push('/company-dashboard');
                }
            }
            // If PIN is not set, auth context will redirect to /set-pin
        }
    }, [authUser, authLoading, router])

    if (authLoading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    // If user is already logged in, redirect them
    if (authUser) {
        return null; // Or a loading spinner while redirect happens
    }

    return (
        <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
            <Navbar />
            <main className="flex-1 flex flex-col items-center justify-center p-4 pt-32 pb-20 relative overflow-hidden">
                {/* Background glow effects */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
                <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

                <Card className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl relative z-10 overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                    <CardHeader className="pt-8 text-center pb-4">
                        <div className="mx-auto mb-4 bg-zinc-950 border border-zinc-800 p-3 rounded-2xl w-fit shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                            <GuardianMailLogo className="h-8 w-8 text-emerald-400" />
                        </div>
                        <CardTitle className="text-2xl text-white font-bold tracking-tight">Welcome Back</CardTitle>
                        <CardDescription className="text-zinc-400">
                            Enter your credentials to access Beacon
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="px-6 pb-8">
                        <form onSubmit={handleLogin} className="space-y-5">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-zinc-300 font-medium">Email Address</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    required
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-11"
                                />
                            </div>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="password" className="text-zinc-300 font-medium">Password</Label>
                                    <Link href="#" className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors">Forgot password?</Link>
                                </div>
                                <Input
                                    id="password"
                                    type="password"
                                    required
                                    value={password}
                                    placeholder="••••••••"
                                    onChange={e => setPassword(e.target.value)}
                                    className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-11"
                                />
                            </div>
                            <Button type="submit" className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all h-11" disabled={isLoading}>
                                {isLoading ? "Authenticating..." : "Sign In"}
                            </Button>

                            <div className="relative my-4">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-zinc-800"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-zinc-900 px-2 text-zinc-500 font-medium">Or</span>
                                </div>
                            </div>

                            <Button variant="outline" className="w-full border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors h-11" asChild>
                                <Link href="/signup">
                                    Create an account
                                </Link>
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    );
}
