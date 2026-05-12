"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import GuardianMailLogo from "@/components/icons/logo";
import Link from "next/link";
import { Navbar } from "@/components/landing/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (password.length < 6) {
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: "Password must be at least 6 characters long.",
      });
      setIsLoading(false);
      return;
    }

    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, "users", user.uid), {
        name: name,
        email: email,
        role: "admin", // Default to admin as requested
        companyId: null, // Admins aren't tied to a company
        avatarUrl: "/logo.png",
        pinSet: false, // New users need to set up PIN
      });

      toast({
        title: "Signup Successful",
        description: "Account created successfully. Please set up your PIN.",
      });
      router.push("/set-pin");

    } catch (error: any) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Signup Failed",
        description: error.message || "An unknown error occurred.",
      });
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
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none"></div>

        <Card className="w-full max-w-sm bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl relative z-10 overflow-hidden mt-8 mb-8">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
          <CardHeader className="pt-8 text-center pb-4">
            <div className="mx-auto mb-4 bg-zinc-950 border border-zinc-800 p-3 rounded-2xl w-fit shadow-[0_0_15px_rgba(16,185,129,0.2)]">
              <GuardianMailLogo className="h-8 w-8 text-emerald-400" />
            </div>
            <CardTitle className="text-2xl text-white font-bold tracking-tight">Create Account</CardTitle>
            <CardDescription className="text-zinc-400">
              Enter your details to create a new admin account.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-6 pb-8">
            <form onSubmit={handleSignup} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300 font-medium">Full Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Tony Stark"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-zinc-300 font-medium">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-zinc-300 font-medium">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  placeholder="••••••••"
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-11"
                />
              </div>
              <Button type="submit" className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all h-11" disabled={isLoading}>
                {isLoading ? "Creating Account..." : "Create Account"}
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
                <Link href="/login">Already have an account? Login</Link>
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
}
