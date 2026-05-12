"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { redirect } from "next/navigation";
import {
  PlusCircle,
  Trash2,
  Building2,
  Settings2
} from "lucide-react";
import { data, type Company } from "@/lib/data";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

function AddCompanyDialog({ onCompanyAdded }: { onCompanyAdded: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!name) {
            toast({ variant: "destructive", title: "Missing Name", description: "Please provide a name for the company." });
            return;
        }
        setIsLoading(true);
        try {
            await data.companies.create({ name });
            toast({ title: "Success", description: `Company "${name}" created successfully.` });
            onCompanyAdded();
            setIsOpen(false);
            setName("");
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create company." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-105 active:scale-95">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Company
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-emerald-400" /> Add New Company
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                       Enter the name for the new company.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-6">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-zinc-300 font-medium">Company Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-11" placeholder="e.g. Acme Corp" />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                    <DialogClose asChild><Button type="button" variant="outline" className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleSubmit} disabled={isLoading} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        {isLoading ? "Creating..." : "Create Company"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteCompanyDialog({ company, onCompanyDeleted }: { company: Company, onCompanyDeleted: () => void }) {
    const [isLoading, setIsLoading] = useState(false);
    const [userCount, setUserCount] = useState<number | null>(null);
    const { toast } = useToast();

    const fetchUserCount = async () => {
        try {
            const users = await data.users.findByCompany(company.id);
            setUserCount(users.length);
        } catch (error) {
            setUserCount(0);
        }
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            await data.companies.delete(company.id);
            toast({ 
                title: "Success", 
                description: `Company "${company.name}" and all its ${userCount || 0} employee(s) have been deleted.` 
            });
            onCompanyDeleted();
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to delete company." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AlertDialog>
            <AlertDialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="sm"
                    onClick={fetchUserCount}
                    className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-all shadow-[0_0_10px_rgba(239,68,68,0.05)] hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]"
                >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    Delete
                </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                <AlertDialogHeader>
                    <AlertDialogTitle className="text-white text-xl flex items-center gap-2">
                        <Trash2 className="w-5 h-5 text-red-500" /> Delete Company
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-zinc-400 text-base">
                        Are you sure you want to delete <strong className="text-white">"{company.name}"</strong>? 
                        {userCount !== null && (
                            <span className="block mt-3 p-3 rounded-md bg-zinc-950 border border-zinc-800 text-sm font-medium text-zinc-300">
                                This will permanently delete the company and all <strong className="text-white">{userCount}</strong> employee(s), 
                                along with their emails, logs, and alerts.
                            </span>
                        )}
                        <span className="block mt-4 text-red-400 font-semibold bg-red-500/10 p-3 rounded-md border border-red-500/20 text-sm">
                            ⚠️ This action is irreversible and cannot be undone.
                        </span>
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter className="mt-4 gap-2 sm:gap-0">
                    <AlertDialogCancel className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white">Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                        onClick={handleDelete} 
                        disabled={isLoading}
                        className="bg-red-500 text-white hover:bg-red-600 font-semibold shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                    >
                        {isLoading ? "Deleting..." : "Yes, Delete Company"}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}

export default function AdminCompaniesPage() {
    const { user, loading } = useAuth();
    const [companies, setCompanies] = useState<Company[]>([]);

    const fetchCompanies = async () => {
        const companyData = await data.companies.list();
        setCompanies(companyData);
    };

    useEffect(() => {
        fetchCompanies();
    }, []);
    
    if (loading) {
        return <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    if (!user || user.role !== 'admin') {
        return redirect('/login');
    }

    return (
    <div className="flex min-h-screen w-full flex-col bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30">
      <AdminSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-20">
        <AppHeader />
        <main className="flex-1 items-start gap-4 p-4 sm:px-8 sm:py-4 md:gap-8 max-w-[1400px] w-full mx-auto">
             <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 shadow-2xl overflow-hidden rounded-xl">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 opacity-80"></div>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-zinc-800/50 pt-8 px-8">
                    <div>
                        <CardTitle className="text-white text-3xl font-bold tracking-tight flex items-center gap-3">
                            <Building2 className="w-8 h-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" /> 
                            Company Management
                        </CardTitle>
                        <CardDescription className="text-zinc-400 mt-2 text-base max-w-2xl">
                            Oversee and manage client organizations on the Beacon platform. Add new tenants or remove existing ones and their associated data.
                        </CardDescription>
                    </div>
                    <AddCompanyDialog onCompanyAdded={fetchCompanies} />
                </CardHeader>
                <CardContent className="p-0">
                   <Table>
                        <TableHeader className="bg-zinc-950/80 sticky top-0 backdrop-blur-md">
                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                <TableHead className="text-zinc-400 font-medium py-5 px-8">Company Name</TableHead>
                                <TableHead className="text-zinc-400 font-medium py-5">Tenant ID</TableHead>
                                <TableHead className="text-zinc-400 font-medium text-right py-5 px-8">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {companies.map(c => (
                                <TableRow key={c.id} className="border-zinc-800/50 hover:bg-zinc-800/40 transition-colors group">
                                    <TableCell className="font-semibold text-zinc-100 py-4 px-8 text-base group-hover:text-emerald-300 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30 group-hover:text-emerald-400 transition-colors">
                                                <Building2 className="w-4 h-4" />
                                            </div>
                                            {c.name}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-zinc-500 font-mono text-xs py-4">
                                        <span className="bg-zinc-950 px-2 py-1 rounded border border-zinc-800">{c.id}</span>
                                    </TableCell>
                                    <TableCell className="text-right py-4 px-8">
                                        <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                            <Button variant="outline" size="sm" className="border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:text-indigo-300 transition-all shadow-[0_0_10px_rgba(99,102,241,0.05)] hover:shadow-[0_0_15px_rgba(99,102,241,0.1)]">
                                                <Settings2 className="w-3.5 h-3.5 mr-2" />
                                                Manage Users
                                            </Button>
                                            <DeleteCompanyDialog company={c} onCompanyDeleted={fetchCompanies} />
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {companies.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-48 text-center text-zinc-500">
                                        <div className="flex flex-col items-center justify-center gap-3">
                                            <Building2 className="w-12 h-12 text-zinc-700" />
                                            <p className="text-base">No companies found. Create one to get started.</p>
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
