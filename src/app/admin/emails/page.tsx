"use client";

import { useAuth } from "@/context/auth-context";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Mail, ExternalLink, Eye, AlertTriangle, Clock, CheckCircle, XCircle, Copy, MoreVertical, Send, ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { data, type Email, type User, type Company, type AccessLog } from "@/lib/data";
import AppHeader from "@/components/app-header";
import AdminSidebar from "@/components/admin-sidebar";
import { ReadMoreDialog } from "@/components/ui/read-more-dialog";

type EmailWithRelatedData = Email & {
  senderName?: string;
  companyName?: string;
  accessLogs: AccessLog[];
  suspicious?: boolean;
};

export default function EmailsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [emails, setEmails] = useState<EmailWithRelatedData[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [companyFilter, setCompanyFilter] = useState<string>("all");

  useEffect(() => {
    async function fetchData() {
      if (!user || (user.role !== 'admin' && user.role !== 'company_admin')) return;

      setIsLoading(true);
      try {
        const [emailsData, usersData, companiesData, accessLogsData] = await Promise.all([
          data.emails.list(),
          data.users.list(),
          data.companies.list(),
          data.accessLogs.list()
        ]);

        let filteredEmailsData = emailsData;
        if (user.role === 'company_admin') {
          const companyUsers = usersData.filter(u => u.companyId === user.companyId).map(u => u.id);
          filteredEmailsData = emailsData.filter(email =>
            email.companyId === user.companyId && companyUsers.includes(email.senderId)
          );
        }

        const emailsWithData: EmailWithRelatedData[] = filteredEmailsData.map(email => {
          const sender = usersData.find(u => u.id === email.senderId);
          const company = companiesData.find(c => c.id === email.companyId);
          const relatedAccessLogs = accessLogsData.filter(log => log.emailId === email.id);

          return {
            ...email,
            senderName: sender?.name || 'Unknown',
            companyName: company?.name || (email.companyId === 'ADMIN' ? 'Admin' : 'Unknown'),
            accessLogs: relatedAccessLogs,
            suspicious: typeof (email as any).suspicious === 'boolean' ? (email as any).suspicious : false
          };
        });

        const sortedEmails = [...emailsWithData].sort((a, b) => {
          const aSuspicious = !!a.suspicious;
          const bSuspicious = !!b.suspicious;
          if (aSuspicious && !bSuspicious) return -1;
          if (!aSuspicious && bSuspicious) return 1;
          const aDate = typeof a.createdAt === 'string' ? new Date(a.createdAt) : a.createdAt.toDate();
          const bDate = typeof b.createdAt === 'string' ? new Date(b.createdAt) : b.createdAt.toDate();
          return bDate.getTime() - aDate.getTime();
        });

        setEmails(sortedEmails);
        setUsers(usersData);
        setCompanies(companiesData);
      } catch (error) {
        console.error('Failed to fetch emails data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load emails data."
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();
  }, [user, toast]);

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (!user || (user.role !== 'admin' && user.role !== 'company_admin')) {
    return redirect('/login');
  }

  const getEmailStatus = (email: EmailWithRelatedData) => {
    if (email.revoked) return 'revoked';

    const now = new Date();
    const expiresAt = email.expiresAt
      ? (typeof email.expiresAt === 'string' ? new Date(email.expiresAt) : email.expiresAt.toDate())
      : null;

    if (expiresAt && now > expiresAt) return 'expired';
    if (email.accessLogs.some(log => log.status === 'Success')) return 'accessed';
    if (email.accessLogs.length > 0) return 'opened';
    return 'sent';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-none shadow-none"><Send className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'opened':
        return <Badge className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"><Eye className="h-3 w-3 mr-1" />Opened</Badge>;
      case 'accessed':
        return <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Accessed</Badge>;
      case 'expired':
        return <Badge className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20"><Clock className="h-3 w-3 mr-1" />Expired</Badge>;
      case 'revoked':
        return <Badge className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20"><XCircle className="h-3 w-3 mr-1" />Revoked</Badge>;
      default:
        return <Badge className="bg-zinc-800 text-zinc-300 border-none shadow-none">Unknown</Badge>;
    }
  };

  const copySecureLink = (token: string) => {
    const link = `${window.location.origin}/secure/${token}`;
    navigator.clipboard.writeText(link);
    toast({
      title: "Link Copied",
      description: "Secure link has been copied to clipboard."
    });
  };

  const revokeEmail = async (emailId: string) => {
    try {
      await data.emails.revoke(emailId);
      setEmails(emails.map(email =>
        email.id === emailId ? { ...email, revoked: true } : email
      ));
      toast({
        title: "Email Revoked",
        description: "The secure link has been revoked successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to revoke email."
      });
    }
  };

  const filteredEmails = emails.filter(email => {
    const matchesSearch =
      email.recipient.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.senderName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.companyName?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || getEmailStatus(email) === statusFilter;
    const matchesCompany = companyFilter === 'all' || email.companyId === companyFilter;

    return matchesSearch && matchesStatus && matchesCompany;
  });

  const formatDate = (date: string | any) => {
    const d = typeof date === 'string' ? new Date(date) : date.toDate();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      <AdminSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-20 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        
        <AppHeader />
        <main className="flex-1 p-4 sm:px-8 sm:py-4 md:gap-8 max-w-[1600px] w-full mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-400 transition-colors font-medium">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Link>
          </div>

          <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl overflow-hidden rounded-xl">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
            <CardHeader className="pb-6 border-b border-zinc-800/50 pt-8 px-8">
              <CardTitle className="flex items-center gap-3 text-white text-3xl font-bold tracking-tight">
                <Mail className="h-8 w-8 text-emerald-400 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                All Secure Emails
              </CardTitle>
              <CardDescription className="text-zinc-400 mt-2 text-base max-w-2xl">
                Comprehensive overview of all secure links generated across the platform. Monitor status, track access, and immediately revoke suspicious activities.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="flex flex-col sm:flex-row gap-4 p-6 bg-zinc-950/50 border-b border-zinc-800/50">
                <Input
                  placeholder="Search emails, recipients, subjects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="sm:max-w-md bg-zinc-950/80 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-11"
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="sm:w-48 bg-zinc-950/80 border-zinc-800 text-white focus:ring-emerald-500 h-11">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100">
                    <SelectItem value="all" className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">All Status</SelectItem>
                    <SelectItem value="sent" className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">Sent</SelectItem>
                    <SelectItem value="opened" className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">Opened</SelectItem>
                    <SelectItem value="accessed" className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">Accessed</SelectItem>
                    <SelectItem value="expired" className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">Expired</SelectItem>
                    <SelectItem value="revoked" className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">Revoked</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={companyFilter} onValueChange={setCompanyFilter}>
                  <SelectTrigger className="sm:w-48 bg-zinc-950/80 border-zinc-800 text-white focus:ring-emerald-500 h-11">
                    <SelectValue placeholder="Filter by company" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-100 max-h-64">
                    <SelectItem value="all" className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">All Companies</SelectItem>
                    <SelectItem value="ADMIN" className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">Admin</SelectItem>
                    {companies.map(company => (
                      <SelectItem key={company.id} value={company.id} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">
                        {company.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-500 border-t-transparent"></div>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-zinc-950/80 sticky top-0 backdrop-blur-md">
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400 font-medium py-5 px-6">Recipient</TableHead>
                        <TableHead className="text-zinc-400 font-medium py-5">Subject</TableHead>
                        <TableHead className="text-zinc-400 font-medium py-5">Sender Details</TableHead>
                        <TableHead className="text-zinc-400 font-medium py-5">Status</TableHead>
                        <TableHead className="text-zinc-400 font-medium py-5">Sent Date</TableHead>
                        <TableHead className="text-zinc-400 font-medium py-5">Access activity</TableHead>
                        <TableHead className="text-zinc-400 font-medium text-right py-5 px-6">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEmails.map((email) => (
                        <TableRow key={email.id} className={`border-zinc-800/50 hover:bg-zinc-800/40 transition-colors group ${email.suspicious ? "bg-red-500/5 hover:bg-red-500/10" : ""}`}>
                          <TableCell className="py-4 px-6">
                            <div className="font-semibold text-zinc-100 flex items-center gap-2 group-hover:text-emerald-300 transition-colors">
                              <Mail className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 transition-colors" />
                              {email.recipient}
                              {email.suspicious && (
                                <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse ml-1" />
                              )}
                            </div>
                            {email.isGuest && (
                              <Badge variant="outline" className="border-zinc-700 text-zinc-400 bg-zinc-800/50 text-[10px] mt-1.5 font-medium uppercase tracking-wider">Guest Access</Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="max-w-[250px] text-zinc-300">
                              <ReadMoreDialog title="Email Subject" content={email.subject} maxLength={40} />
                            </div>
                            {email.attachmentFilename && (
                              <div className="text-xs text-emerald-400 font-medium mt-1.5 flex items-center gap-1">
                                <span className="text-lg leading-none">📎</span> {email.attachmentFilename}
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium text-zinc-200">{email.senderName}</span>
                              <span className="text-xs text-zinc-500">{email.companyName}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-1.5 items-start">
                              {getStatusBadge(getEmailStatus(email))}
                              {email.suspicious && (
                                <Badge className="border border-red-500/50 text-red-400 bg-red-500/10 text-[10px] font-bold uppercase tracking-wider shadow-[0_0_10px_rgba(239,68,68,0.2)]">High Risk</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-sm text-zinc-400 font-medium">
                            {formatDate(email.createdAt)}
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex gap-2">
                              {email.accessLogs.length > 0 && (
                                <div className="flex items-center gap-1 text-xs font-semibold text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(6,182,212,0.1)]" title={`${email.accessLogs.length} secure link access attempts`}>
                                  <Eye className="h-3.5 w-3.5" />
                                  {email.accessLogs.length}
                                </div>
                              )}
                              {email.accessLogs.filter((l) => l.status === 'Success').length > 0 && (
                                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-2 py-1 rounded-md shadow-[0_0_10px_rgba(16,185,129,0.1)]" title={`${email.accessLogs.filter((l) => l.status === 'Success').length} successful unlocks`}>
                                  <CheckCircle className="h-3.5 w-3.5" />
                                  {email.accessLogs.filter((l) => l.status === 'Success').length}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-4 px-6">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-zinc-400 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300 w-48 shadow-2xl">
                                <DropdownMenuItem onClick={() => copySecureLink(email.secureLinkToken)} className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer font-medium">
                                  <Copy className="h-4 w-4 mr-2 text-zinc-400" />
                                  Copy Secure Link
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer font-medium">
                                  <Link href={`/admin/emails/${email.id}`}>
                                    <Eye className="h-4 w-4 mr-2 text-zinc-400" />
                                    View details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => window.open(`/secure/${email.secureLinkToken}`, '_blank')}
                                  className="hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer font-medium"
                                >
                                  <ExternalLink className="h-4 w-4 mr-2 text-zinc-400" />
                                  Preview Content
                                </DropdownMenuItem>
                                {!email.revoked && (
                                  <DropdownMenuItem
                                    onClick={() => revokeEmail(email.id)}
                                    className="text-red-400 hover:bg-red-500/10 focus:bg-red-500/10 focus:text-red-300 cursor-pointer font-semibold mt-1 border-t border-zinc-800 pt-2"
                                  >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Revoke Access
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}

              {!isLoading && filteredEmails.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center border-t border-zinc-800/50">
                  <div className="w-16 h-16 rounded-full bg-zinc-950 border border-zinc-800 flex items-center justify-center mb-4 shadow-inner">
                    <Mail className="h-8 w-8 text-zinc-600" />
                  </div>
                  <h3 className="text-xl font-bold mb-2 text-zinc-200">No Secure Emails Found</h3>
                  <p className="text-zinc-500 max-w-md mx-auto">
                    {searchQuery || statusFilter !== 'all' || companyFilter !== 'all'
                      ? "Your current filters yielded no results. Try clearing them or adjusting your search parameters."
                      : "The system has not processed any secure emails yet."
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
