"use client";

import { useEffect, useState } from "react";
import {
  Home,
  Shield,
  Users,
  UserPlus,
  Trash2,
  Settings,
  Key,
  Mail,
  TrendingUp,
  AlertTriangle,
  ShieldAlert,
  UserCheck,
  Building2,
  BarChart3
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import GuardianMailLogo from "./icons/logo";
import BeaconTracking from "./dashboard/beacon-tracking";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { useAuth } from "@/context/auth-context";
import { data, type User, type Company, type Email, type AccessLog, type BeaconLog, type PinResetRequest } from "@/lib/data";
import AppHeader from "./app-header";
import { useToast } from "@/hooks/use-toast";
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
import RealTimeAlerts from "@/components/dashboard/real-time-alerts";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";


function AddEmployeeDialog({ companyId, onEmployeeAdded }: { companyId: string, onEmployeeAdded: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async () => {
        if (!name || !email) {
            toast({ variant: "destructive", title: "Missing Fields", description: "Please fill out all fields." });
            return;
        }
        setIsLoading(true);
        try {
            await data.users.createUser({
                name,
                email,
                role: 'employee',
                companyId,
            });
            toast({ title: "Success", description: "Employee created and onboarding email sent." });
            onEmployeeAdded();
            setIsOpen(false);
            setName("");
            setEmail("");
        } catch (error: any) {
            toast({ variant: "destructive", title: "Error", description: error.message || "Failed to create employee." });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                 <Button className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all h-11">
                    <UserPlus className="mr-2 h-4 w-4"/>
                    Add Employee
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800 text-zinc-100">
                <DialogHeader>
                    <DialogTitle className="text-white text-xl flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-400" /> Add Employee
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Create a new employee for your company. They will receive an onboarding email to set up their password and PIN.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="name" className="text-zinc-300 font-medium">Full Name</Label>
                        <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-11" placeholder="Jane Doe" />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="email" className="text-zinc-300 font-medium">Email Address</Label>
                        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-11" placeholder="jane@company.com" />
                    </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0 mt-2">
                    <DialogClose asChild><Button type="button" variant="outline" className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">Cancel</Button></DialogClose>
                    <Button type="button" onClick={handleSubmit} disabled={isLoading} className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                        {isLoading ? "Creating..." : "Create Employee"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function CompanyDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [employees, setEmployees] = useState<User[]>([]);
  const [company, setCompany] = useState<Company | null>(null);
  const [companyEmails, setCompanyEmails] = useState<Email[]>([]);
  const [companyAccessLogs, setCompanyAccessLogs] = useState<AccessLog[]>([]);
  const [companyBeaconLogs, setCompanyBeaconLogs] = useState<BeaconLog[]>([]);
  const [pinRequests, setPinRequests] = useState<PinResetRequest[]>([]);

  const fetchData = async () => {
    if (!user || !user.companyId) return;
    const companyId = user.companyId;

     const [
            employeeData,
            companyData,
            emailData,
            accessLogData,
            beaconLogData,
            pinRequestData
        ] = await Promise.all([
            data.users.findByCompany(companyId),
            data.companies.findById(companyId),
            data.emails.list({ companyId }),
            data.accessLogs.list({ companyId }),
            data.beaconLogs.list({ companyId }),
            user.role === 'company_admin' ? data.pinResetRequests.list({ companyId }) : Promise.resolve([])
        ]);

        setEmployees(employeeData);
        setCompany(companyData ?? null);
        setCompanyEmails(emailData);
        setCompanyAccessLogs(accessLogData);
        setCompanyBeaconLogs(beaconLogData);
        setPinRequests(pinRequestData);
  };


  useEffect(() => {
    if (!user || !user.companyId) return;
    // Fetch company by companyId
    data.companies.findById(user.companyId).then(companyData => {
      setCompany(companyData ?? null);
    });
    fetchData();
  }, [user]);
  
  if (!user || !user.companyId) return null;
  if (user.role === 'employee') {
    if (typeof window !== 'undefined') {
      window.location.replace('/compose');
    }
    return null;
  }
  
  const suspiciousOpens = companyBeaconLogs.filter(l => l.status === 'Suspicious').length;
  const failedPinAttempts = companyAccessLogs.filter(l => l.status === 'Failed').length;
  const pendingPinRequests = pinRequests.filter(r => r.status === 'pending').length;

  const handleRemoveEmployee = async (employeeId: string) => {
    // In a real app, this would have a confirmation dialog
    await data.users.delete(employeeId);
    setEmployees(employees.filter(e => e.id !== employeeId));
    toast({ title: "Employee Removed", description: "The employee has been removed from the company."});
    fetchData(); // Refresh data
  }

  const isCompanyAdmin = user.role === 'company_admin';
  const teamMembers = employees.filter(e => e.id !== user.id);

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30">
      <aside className="fixed inset-y-0 left-0 z-20 hidden w-20 flex-col border-r border-zinc-800 bg-zinc-950 sm:flex shadow-[4px_0_24px_rgba(0,0,0,0.5)]">
        <nav className="flex flex-col items-center gap-6 px-2 sm:py-8">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="#"
                  className="group flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] md:h-10 md:w-10"
                >
                  <GuardianMailLogo className="h-6 w-6 transition-transform group-hover:scale-110" />
                  <span className="sr-only">Beacon</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-zinc-800 text-zinc-100 border-zinc-700">Home</TooltipContent>
            </Tooltip>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Link href="/company-dashboard" className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-colors md:h-10 md:w-10">
                  <Home className="h-5 w-5" />
                  <span className="sr-only">Dashboard</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-zinc-800 text-zinc-100 border-zinc-700">Dashboard</TooltipContent>
            </Tooltip>
            
            {isCompanyAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/users"
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors md:h-10 md:w-10"
                  >
                    <Users className="h-5 w-5" />
                    <span className="sr-only">Employees</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-zinc-800 text-zinc-100 border-zinc-700">Employees</TooltipContent>
              </Tooltip>
            )}
            
            {isCompanyAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/pin-requests"
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors md:h-10 md:w-10 relative"
                  >
                    <Key className="h-5 w-5" />
                    {pendingPinRequests > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 h-5 w-5 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border border-zinc-950 shadow-[0_0_10px_rgba(239,68,68,0.5)]">
                        {pendingPinRequests}
                      </span>
                    )}
                    <span className="sr-only">PIN Requests</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-zinc-800 text-zinc-100 border-zinc-700">PIN Requests</TooltipContent>
              </Tooltip>
            )}
            
            {isCompanyAdmin && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Link
                    href="/admin/emails"
                    className="flex h-12 w-12 items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors md:h-10 md:w-10"
                  >
                    <Mail className="h-5 w-5" />
                    <span className="sr-only">Emails</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-zinc-800 text-zinc-100 border-zinc-700">Emails</TooltipContent>
              </Tooltip>
            )}
          </TooltipProvider>
        </nav>
        <div className="flex-1" />
        <nav className="mb-6 flex flex-col items-center gap-6 px-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Link
                  href="/settings"
                  className="flex h-12 w-12 items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 transition-colors md:h-10 md:w-10"
                >
                  <Settings className="h-5 w-5" />
                  <span className="sr-only">Settings</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right" className="bg-zinc-800 text-zinc-100 border-zinc-700">Settings</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </nav>
      </aside>
      
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-20">
        <AppHeader companyName={company?.name || "Company Dashboard"} />
        <main className="flex-1 items-start gap-4 p-4 sm:px-8 sm:py-4 md:gap-8 max-w-[1600px] w-full mx-auto">
          {/* Company Name Card */}
          {company && (
            <Card className="mb-8 shadow-2xl bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 relative overflow-hidden rounded-xl">
               <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500 opacity-80"></div>
              <CardHeader className="pb-6 pt-8 px-8">
                <CardTitle className="flex items-center gap-4 text-3xl text-white font-bold tracking-tight">
                  <div className="p-3 rounded-2xl bg-zinc-950 border border-zinc-800 shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                    <Building2 className="h-8 w-8 text-emerald-400" />
                  </div>
                  {company.name}
                </CardTitle>
                <CardDescription className="mt-3 text-lg font-medium text-zinc-400 flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Company Admin Dashboard
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Stats Overview Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 hover:bg-zinc-800/50 transition-colors relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500/50 group-hover:bg-indigo-500 transition-colors"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300">Total Emails</CardTitle>
                <div className="p-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:border-indigo-500/40 transition-colors">
                    <Mail className="h-5 w-5 text-indigo-400 drop-shadow-[0_0_10px_rgba(99,102,241,0.5)]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{companyEmails.length}</div>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Sent this month</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 hover:bg-zinc-800/50 transition-colors relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-yellow-500/50 group-hover:bg-yellow-500 transition-colors"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300">Suspicious Opens</CardTitle>
                <div className="p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20 group-hover:border-yellow-500/40 transition-colors">
                    <AlertTriangle className="h-5 w-5 text-yellow-400 drop-shadow-[0_0_10px_rgba(234,179,8,0.5)]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{suspiciousOpens}</div>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Requires attention</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 hover:bg-zinc-800/50 transition-colors relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50 group-hover:bg-red-500 transition-colors"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300">Failed PIN Attempts</CardTitle>
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20 group-hover:border-red-500/40 transition-colors">
                    <ShieldAlert className="h-5 w-5 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{failedPinAttempts}</div>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Security incidents</p>
              </CardContent>
            </Card>

            <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 hover:bg-zinc-800/50 transition-colors relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500/50 group-hover:bg-emerald-500 transition-colors"></div>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-zinc-400 group-hover:text-zinc-300">Team Members</CardTitle>
                 <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                    <UserCheck className="h-5 w-5 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{employees.length}</div>
                <p className="text-xs text-zinc-500 mt-1 font-medium">Active employees</p>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
            {/* Beacon Tracking Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl shadow-inner">
                 <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30">
                  <BarChart3 className="h-5 w-5 text-cyan-400 drop-shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Beacon Tracking</h2>
              </div>
              <BeaconTracking companyId={user.companyId} isAdmin={false} />
            </div>

            {/* Real-Time Alerts Section */}
            <div className="space-y-6">
              <div className="flex items-center gap-3 bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl shadow-inner">
                <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/30">
                  <Shield className="h-5 w-5 text-red-400 drop-shadow-[0_0_10px_rgba(239,68,68,0.5)]" />
                </div>
                <h2 className="text-xl font-bold text-white tracking-tight">Real-Time Alerts</h2>
              </div>
              <RealTimeAlerts />
            </div>
          </div>

          {/* Additional Info Cards */}
          {isCompanyAdmin && (
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 shadow-2xl overflow-hidden rounded-xl">
                <CardHeader className="border-b border-zinc-800/50 pb-6 pt-6">
                  <CardTitle className="flex items-center gap-3 text-white text-xl">
                    <div className="p-2 rounded-lg bg-blue-500/10 border border-blue-500/30">
                        <Key className="h-5 w-5 text-blue-400" />
                    </div>
                    PIN Management
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Manage employee PIN reset requests
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between bg-zinc-950/50 p-4 rounded-lg border border-zinc-800">
                    <span className="text-zinc-300 font-medium">Pending Requests</span>
                    <span className="text-2xl font-bold text-blue-400">{pendingPinRequests}</span>
                  </div>
                  {pendingPinRequests > 0 && (
                    <Button asChild className="w-full mt-6 bg-blue-500 text-white hover:bg-blue-600 shadow-[0_0_15px_rgba(59,130,246,0.3)] h-11 transition-all">
                      <Link href="/admin/pin-requests">Review Requests</Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 shadow-2xl overflow-hidden rounded-xl">
                <CardHeader className="border-b border-zinc-800/50 pb-6 pt-6">
                  <CardTitle className="flex items-center gap-3 text-white text-xl">
                     <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                        <Users className="h-5 w-5 text-emerald-400" />
                    </div>
                    Team Management
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Add and manage team members
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between bg-zinc-950/50 p-4 rounded-lg border border-zinc-800 mb-6">
                    <span className="text-zinc-300 font-medium">Total Members</span>
                    <span className="text-2xl font-bold text-emerald-400">{teamMembers.length}</span>
                  </div>
                  <AddEmployeeDialog companyId={user.companyId} onEmployeeAdded={fetchData} />
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
