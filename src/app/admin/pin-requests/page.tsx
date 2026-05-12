"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { redirect } from "next/navigation";
import { data, type PinResetRequest } from "@/lib/data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, XCircle, Clock, Key, ArrowLeft, ShieldCheck, History } from "lucide-react";
import AppHeader from "@/components/app-header";
import AdminSidebar from "@/components/admin-sidebar";
import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Timestamp } from "firebase/firestore";
import { ReadMoreDialog } from "@/components/ui/read-more-dialog";

export default function PinRequestsPage() {
    const { user, loading } = useAuth();
    const { toast } = useToast();
    const [requests, setRequests] = useState<PinResetRequest[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const fetchRequests = async () => {
        try {
            const requestData = user?.role === 'admin' 
                ? await data.pinResetRequests.list()
                : await data.pinResetRequests.list({ companyId: user?.companyId });
            setRequests(requestData);
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to fetch PIN requests." });
        }
    };

    useEffect(() => {
        if (user && (user.role === 'admin' || user.role === 'company_admin')) {
            fetchRequests();
        }
    }, [user]);

    if (loading) {
        return <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>;
    }

    if (!user || (user.role !== 'admin' && user.role !== 'company_admin')) {
        return redirect('/login');
    }

    const handleApprove = async (requestId: string, userId: string) => {
        setIsLoading(true);
        try {
            await data.users.resetPin(userId);
            
            await data.pinResetRequests.update(requestId, {
                status: 'approved',
                reviewedAt: Timestamp.now(),
                reviewedBy: user.id,
                reviewerName: user.name,
            });

            toast({ 
                title: "Request Approved", 
                description: "PIN has been reset. The user can now set a new PIN on their next login." 
            });
            
            fetchRequests();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to approve request." });
        } finally {
            setIsLoading(false);
        }
    };

    const handleReject = async (requestId: string) => {
        setIsLoading(true);
        try {
            await data.pinResetRequests.update(requestId, {
                status: 'rejected',
                reviewedAt: Timestamp.now(),
                reviewedBy: user.id,
                reviewerName: user.name,
            });

            toast({ 
                title: "Request Rejected", 
                description: "The PIN change request has been rejected." 
            });
            
            fetchRequests();
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Failed to reject request." });
        } finally {
            setIsLoading(false);
        }
    };

    const getStatusBadge = (status: PinResetRequest['status']) => {
        switch (status) {
            case 'pending':
                return <Badge variant="outline" className="border-amber-500/50 text-amber-400 bg-amber-500/10 shadow-[0_0_10px_rgba(245,158,11,0.1)] font-semibold"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
            case 'approved':
                return <Badge variant="outline" className="border-emerald-500/50 text-emerald-400 bg-emerald-500/10 shadow-[0_0_10px_rgba(16,185,129,0.1)] font-semibold"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
            case 'rejected':
                return <Badge variant="outline" className="border-red-500/50 text-red-400 bg-red-500/10 shadow-[0_0_10px_rgba(239,68,68,0.1)] font-semibold"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
            default:
                return <Badge variant="outline" className="border-zinc-700 text-zinc-400">Unknown</Badge>;
        }
    };

    const formatDate = (timestamp: Timestamp) => {
        return timestamp.toDate().toLocaleDateString() + ' at ' + timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const pendingRequests = requests.filter(r => r.status === 'pending');
    const processedRequests = requests.filter(r => r.status !== 'pending');

    return (
        <div className="flex min-h-screen w-full flex-col bg-[#09090b] text-zinc-100 selection:bg-amber-500/30">
            <AdminSidebar />
            <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-20">
                <AppHeader />
                <main className="flex-1 p-4 sm:p-6 lg:px-8 max-w-[1400px] mx-auto w-full">
                    <div className="space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Link href="/admin" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-amber-400 transition-colors font-medium">
                                    <ArrowLeft className="h-4 w-4" />
                                    <span>Back to Dashboard</span>
                                </Link>
                            </div>
                        </div>

                        {/* Pending Requests */}
                        <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800/80 shadow-2xl overflow-hidden rounded-xl">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 opacity-80"></div>
                            <CardHeader className="pb-6 border-b border-zinc-800/50 pt-8 px-8">
                                <CardTitle className="flex items-center gap-3 text-white text-3xl font-bold tracking-tight">
                                    <ShieldCheck className="h-8 w-8 text-amber-400 drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                                    Action Required: PIN Requests
                                    {pendingRequests.length > 0 && (
                                        <Badge className="ml-2 bg-amber-500 text-zinc-950 font-bold border-none shadow-[0_0_15px_rgba(245,158,11,0.4)] px-3 py-1 text-lg rounded-full">
                                            {pendingRequests.length}
                                        </Badge>
                                    )}
                                </CardTitle>
                                <CardDescription className="text-zinc-400 mt-2 text-base max-w-2xl">
                                    Review and manage employee requests to reset their secure PINs. Verify the identity and reason before approving to maintain platform security.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {pendingRequests.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-zinc-950/80 sticky top-0 backdrop-blur-md">
                                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                                <TableHead className="text-zinc-400 font-medium py-5 px-8">Employee Profile</TableHead>
                                                <TableHead className="text-zinc-400 font-medium py-5">Justification</TableHead>
                                                <TableHead className="text-zinc-400 font-medium py-5">Time Requested</TableHead>
                                                <TableHead className="text-zinc-400 font-medium text-right py-5 px-8">Resolution</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {pendingRequests.map((request) => (
                                                <TableRow key={request.id} className="border-zinc-800/50 hover:bg-zinc-800/40 transition-colors group">
                                                    <TableCell className="py-5 px-8">
                                                        <div className="flex flex-col">
                                                            <span className="font-bold text-zinc-100 text-base group-hover:text-amber-300 transition-colors">{request.userName}</span>
                                                            <span className="text-sm text-zinc-500 font-medium mt-1 flex items-center gap-1">
                                                                <Key className="w-3 h-3" /> {request.userEmail}
                                                            </span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-5">
                                                        <div className="max-w-[300px]">
                                                            <ReadMoreDialog title="PIN Reset Justification" content={request.reason} maxLength={50} />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-zinc-400 font-medium py-5">
                                                        {formatDate(request.requestedAt)}
                                                    </TableCell>
                                                    <TableCell className="text-right py-5 px-8">
                                                        <div className="flex justify-end gap-3 opacity-80 group-hover:opacity-100 transition-opacity">
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button size="sm" disabled={isLoading} className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30 transition-all shadow-[0_0_10px_rgba(16,185,129,0.05)] hover:shadow-[0_0_15px_rgba(16,185,129,0.1)]">
                                                                        <CheckCircle className="h-4 w-4 mr-1.5" />
                                                                        Approve
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle className="text-white text-xl flex items-center gap-2">
                                                                            <CheckCircle className="w-5 h-5 text-emerald-400" /> Approve PIN Reset
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription className="text-zinc-400 text-base mt-2">
                                                                            Are you sure you want to approve this PIN reset request for <strong className="text-white">{request.userName}</strong>? 
                                                                            This will immediately revoke their current PIN and require them to set a new one on their next login.
                                                                            
                                                                            <div className="mt-4 p-3 rounded-md bg-zinc-950 border border-zinc-800">
                                                                                <strong className="text-zinc-300 block mb-1 text-sm">Provided Reason:</strong> 
                                                                                <span className="text-zinc-400 italic">"{request.reason}"</span>
                                                                            </div>
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
                                                                        <AlertDialogCancel className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white">Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction 
                                                                            onClick={() => handleApprove(request.id, request.userId)}
                                                                            disabled={isLoading}
                                                                            className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold shadow-[0_0_15px_rgba(16,185,129,0.3)]"
                                                                        >
                                                                            Confirm Approval
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                            
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button variant="outline" size="sm" disabled={isLoading} className="border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all shadow-[0_0_10px_rgba(239,68,68,0.05)] hover:shadow-[0_0_15px_rgba(239,68,68,0.1)]">
                                                                        <XCircle className="h-4 w-4 mr-1.5" />
                                                                        Reject
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle className="text-white text-xl flex items-center gap-2">
                                                                            <XCircle className="w-5 h-5 text-red-500" /> Reject PIN Reset
                                                                        </AlertDialogTitle>
                                                                        <AlertDialogDescription className="text-zinc-400 text-base mt-2">
                                                                            Are you sure you want to reject this PIN reset request for <strong className="text-white">{request.userName}</strong>? 
                                                                            The employee will be notified and will need to submit a new request if they still need access.
                                                                            
                                                                            <div className="mt-4 p-3 rounded-md bg-zinc-950 border border-zinc-800">
                                                                                <strong className="text-zinc-300 block mb-1 text-sm">Provided Reason:</strong> 
                                                                                <span className="text-zinc-400 italic">"{request.reason}"</span>
                                                                            </div>
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter className="mt-6 gap-2 sm:gap-0">
                                                                        <AlertDialogCancel className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-white">Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction 
                                                                            onClick={() => handleReject(request.id)}
                                                                            disabled={isLoading}
                                                                            className="bg-red-500 text-white hover:bg-red-600 font-semibold shadow-[0_0_15px_rgba(239,68,68,0.4)]"
                                                                        >
                                                                            Confirm Rejection
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="flex flex-col items-center justify-center py-24 text-center border-b border-zinc-800/50">
                                        <div className="w-20 h-20 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
                                            <CheckCircle className="h-10 w-10 text-emerald-400" />
                                        </div>
                                        <h3 className="text-2xl font-bold mb-2 text-white">All Caught Up!</h3>
                                        <p className="text-zinc-400 max-w-md mx-auto text-lg">
                                            There are currently no pending PIN reset requests requiring your attention.
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Processed Requests History */}
                        <Card className="bg-zinc-900/60 backdrop-blur-sm border-zinc-800/50 shadow-xl overflow-hidden rounded-xl">
                            <CardHeader className="pb-6 pt-8 px-8">
                                <CardTitle className="text-white flex items-center gap-2 text-xl font-semibold">
                                    <History className="w-5 h-5 text-zinc-400" />
                                    Processed Request Log
                                </CardTitle>
                                <CardDescription className="text-zinc-400 mt-1">
                                    Historical record of previously approved and rejected PIN reset requests
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {processedRequests.length > 0 ? (
                                    <Table>
                                        <TableHeader className="bg-zinc-950/50">
                                            <TableRow className="border-zinc-800 hover:bg-transparent">
                                                <TableHead className="text-zinc-500 font-medium py-4 px-8">Employee</TableHead>
                                                <TableHead className="text-zinc-500 font-medium py-4">Justification</TableHead>
                                                <TableHead className="text-zinc-500 font-medium py-4">Status</TableHead>
                                                <TableHead className="text-zinc-500 font-medium py-4">Requested</TableHead>
                                                <TableHead className="text-zinc-500 font-medium py-4">Resolution Details</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {processedRequests.map((request) => (
                                                <TableRow key={request.id} className="border-zinc-800/30 hover:bg-zinc-800/40 transition-colors">
                                                    <TableCell className="py-4 px-8">
                                                        <div className="flex flex-col">
                                                            <span className="font-medium text-zinc-300">{request.userName}</span>
                                                            <span className="text-xs text-zinc-600">{request.userEmail}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="max-w-[250px] opacity-80">
                                                            <ReadMoreDialog title="Historical Reason" content={request.reason} maxLength={40} />
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="py-4">{getStatusBadge(request.status)}</TableCell>
                                                    <TableCell className="text-zinc-500 text-sm py-4">{formatDate(request.requestedAt)}</TableCell>
                                                    <TableCell className="py-4">
                                                        <div className="flex flex-col text-sm">
                                                            <span className="text-zinc-400">By {request.reviewerName || 'System'}</span>
                                                            <span className="text-zinc-600 text-xs mt-0.5">{request.reviewedAt ? formatDate(request.reviewedAt) : 'N/A'}</span>
                                                        </div>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                ) : (
                                    <div className="text-center py-16 border-t border-zinc-800/50">
                                        <History className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
                                        <p className="text-zinc-500 text-base font-medium">
                                            No historical logs available
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </main>
            </div>
        </div>
    );
}
