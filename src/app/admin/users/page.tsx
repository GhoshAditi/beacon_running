"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { redirect } from "next/navigation";
import {
  UserPlus,
  RefreshCcw,
  Trash2,
  Users as UsersIcon,
  ShieldAlert,
  Building2
} from "lucide-react";
import { data, type User, type Company } from "@/lib/data";
import AppHeader from "@/components/app-header";
import AdminSidebar from "@/components/admin-sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

function AddUserDialog({ companies, onUserAdded }: { companies: Company[], onUserAdded: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [companyId, setCompanyId] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!name || !email || !companyId) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all fields." });
            return;
        }
        setIsLoading(true);
        try {
            await data.users.createUser({
                name,
                email,
                role: 'company_admin',
                companyId,
            });
            toast({ title: "Success", description: "Company admin created and onboarding email sent." });
            onUserAdded();
            setIsOpen(false);
            setName("");
            setEmail("");
            setCompanyId("");
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create user." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-cyan-500 text-zinc-950 hover:bg-cyan-400 font-semibold shadow-[0_0_20px_rgba(6,182,212,0.3)] transition-all hover:scale-105 active:scale-95">
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add Company Admin
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl flex items-center gap-2">
                        <UsersIcon className="w-5 h-5 text-cyan-400" /> Add Company Admin
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Create a new company admin and assign them to a company. They will receive an onboarding email to set up their password and PIN.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-zinc-300 font-medium">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-cyan-500 h-11" placeholder="Jane Doe" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-zinc-300 font-medium">Email Address</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-cyan-500 h-11" placeholder="jane@example.com" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="company" className="text-zinc-300 font-medium">Assign Company</Label>
                        <Select onValueChange={setCompanyId} value={companyId}>
                            <SelectTrigger className="bg-zinc-950/50 border-zinc-800 text-white focus:ring-cyan-500 h-11">
                                <SelectValue placeholder="Select a company..." />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                {companies.map(c => <SelectItem key={c.id} value={c.id} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0 mt-2">
                    <DialogClose asChild><Button type="button" variant="outline" className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleSubmit} disabled={isLoading} className="bg-cyan-500 text-zinc-950 hover:bg-cyan-400 font-semibold shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                        {isLoading ? "Creating..." : "Create Admin User"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function AdminUsersPage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);

    const fetchData = async () => {
        const [userData, companyData] = await Promise.all([
            data.users.list(),
            data.companies.list()
        ]);
        setUsers(userData);
        setCompanies(companyData);
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleResetPin = async (userId: string) => {
        try {
            await data.users.resetPin(userId);
            toast({ title: "PIN Reset", description: "The user's PIN has been reset. They will be prompted to create a new one on their next login." });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to reset PIN." });
        }
    }

    const handleDeleteUser = async (userId: string, userName: string) => {
        if (!window.confirm(`Are you sure you want to delete user '${userName}'?`)) return;
        try {
            await data.users.delete(userId);
            toast({ title: "User Deleted", description: `User '${userName}' has been deleted.` });
            fetchData();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete user." });
        }
    }

    if (loading) {
        return <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    if (!user || user.role !== 'admin') {
        return redirect('/login');
    }
    
    const getCompanyName = (companyId?: string) => {
        if (!companyId) return 'N/A';
        return companies.find(c => c.id === companyId)?.name || 'Unknown';
    }

    return (
    <div className="flex min-h-screen w-full flex-col bg-[#09090b] text-zinc-100 selection:bg-cyan-500/30">
      <AdminSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-20">
        <AppHeader />
        <main className="flex-1 items-start gap-4 p-4 sm:px-8 sm:py-4 md:gap-8 max-w-[1400px] w-full mx-auto">
             <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 shadow-2xl overflow-hidden rounded-xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500 opacity-80"></div>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-zinc-800/50 pt-8 px-8">
                    <div>
                        <CardTitle className="text-white text-3xl font-bold tracking-tight flex items-center gap-3">
                            <UsersIcon className="w-8 h-8 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" /> 
                            User Management
                        </CardTitle>
                        <CardDescription className="text-zinc-400 mt-2 text-base max-w-2xl">
                            View and manage all users across the platform. You can onboard new company administrators or manage existing accounts and security PINs.
                        </CardDescription>
                    </div>
                    <AddUserDialog companies={companies} onUserAdded={fetchData} />
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                        <TableHeader className="bg-zinc-950/80 sticky top-0 backdrop-blur-md">
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead className="text-zinc-400 font-medium py-5 px-8">User Profile</TableHead>
                                <TableHead className="text-zinc-400 font-medium py-5">System Role</TableHead>
                                <TableHead className="text-zinc-400 font-medium py-5">Company</TableHead>
                                <TableHead className="text-zinc-400 font-medium py-5">Security PIN</TableHead>
                                <TableHead className="text-zinc-400 font-medium text-right py-5 px-8">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map(u => (
                                <TableRow key={u.id} className="border-zinc-800/50 hover:bg-zinc-800/40 transition-colors group">
                                    <TableCell className="py-4 px-8">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border-2 border-zinc-700 group-hover:border-cyan-500/50 transition-colors shadow-sm">
                                                <AvatarImage src={u.avatarUrl} alt={u.name} />
                                                <AvatarFallback className="bg-zinc-800 text-zinc-300 font-semibold">{u.name.charAt(0)}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-semibold text-zinc-100 group-hover:text-cyan-300 transition-colors">{u.name}</p>
                                                <p className="text-sm text-zinc-500 font-medium">{u.email}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Badge variant="outline" className={`border font-semibold tracking-wide ${u.role === 'admin' ? 'border-indigo-500/50 text-indigo-400 bg-indigo-500/10 shadow-[0_0_10px_rgba(99,102,241,0.1)]' : 'border-zinc-700 text-zinc-400 bg-zinc-800/50'}`}>
                                            {u.role.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <div className="flex items-center gap-2 text-zinc-400">
                                            <Building2 className="w-4 h-4 opacity-70" />
                                            {getCompanyName(u.companyId)}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-4">
                                        <Badge variant="outline" className={`border font-semibold ${u.pinSet ? 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)]' : 'border-red-500/50 text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.1)]'}`}>
                                            {u.pinSet ? 'Set Active' : 'Not Set'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-8">
                                        <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                            {u.role !== 'admin' && u.pinSet && (
                                                <Button variant="outline" size="sm" onClick={() => handleResetPin(u.id)} className="border-cyan-500/30 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:text-cyan-300 transition-all shadow-[0_0_10px_rgba(6,182,212,0.05)] hover:shadow-[0_0_15px_rgba(6,182,212,0.1)]">
                                                    <RefreshCcw className="mr-2 h-3.5 w-3.5" />
                                                    Reset PIN
                                                </Button>
                                            )}
                                            {u.role !== 'admin' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex items-center gap-1 border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all shadow-[0_0_10px_rgba(239,68,68,0.05)] hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                                                    title="Delete user"
                                                    onClick={() => handleDeleteUser(u.id, u.name || u.email)}
                                                >
                                                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {users.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-48 text-center text-zinc-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <UsersIcon className="w-12 h-12 text-zinc-700" />
                                            <p className="text-base">No users found. Create one to get started.</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
             </Card>
        </main>
      </div>
    </div>
    )
}
