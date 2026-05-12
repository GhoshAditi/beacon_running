"use client";

import { useAuth } from "@/context/auth-context";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { ArrowLeft, Mail, ExternalLink, Eye, AlertTriangle, Clock, CheckCircle, XCircle, Copy, MapPin, Calendar, User as UserIcon, Building2, Paperclip } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { data, type Email, type User, type AccessLog } from "@/lib/data";
import AppHeader from "@/components/app-header";

type EmailDetails = Email & {
  senderName?: string;
  companyName?: string;
  accessLogs: AccessLog[];
};

export default function EmailDetailPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const params = useParams();
  const emailId = params.id as string;
  const [email, setEmail] = useState<EmailDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchEmailDetails() {
      // Allow both admin and company_admin
      if (!user || (user.role !== 'admin' && user.role !== 'company_admin') || !emailId) return;
      
      setIsLoading(true);
      try {
        const [allEmails, usersData, companiesData, accessLogsData] = await Promise.all([
          data.emails.list(),
          data.users.list(),
          data.companies.list(),
          data.accessLogs.list()
        ]);

        const emailData = allEmails.find(e => e.id === emailId);
        if (!emailData) {
          toast({
            variant: "destructive",
            title: "Email Not Found",
            description: "The requested email could not be found."
          });
          return;
        }

        const relatedAccessLogs = accessLogsData.filter(log => log.emailId === emailId);

        // --- AGENTIC AI: Analyze for suspicious activity via API route ---
        if (!emailData.revoked && relatedAccessLogs.length > 0) {
          try {
            const res = await fetch('/api/analyze-email', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ beaconLogs: [], accessLogs: relatedAccessLogs })
            });
            if (res.ok) {
              const { shouldRevoke } = await res.json();
              if (shouldRevoke) {
                await data.emails.revoke(emailData.id);
                toast({
                  variant: "destructive",
                  title: "Email Auto-Revoked",
                  description: "This email was automatically revoked due to suspicious activity detected by AI."
                });
                emailData.revoked = true;
              }
            }
          } catch (aiErr) {
            console.error('AI analysis failed:', aiErr);
          }
        }
        // --- END AGENTIC AI ---

        const sender = usersData.find(u => u.id === emailData.senderId);
        const company = companiesData.find(c => c.id === emailData.companyId);

        setEmail({
          ...emailData,
          senderName: sender?.name || 'Unknown',
          companyName: company?.name || (emailData.companyId === 'ADMIN' ? 'Admin' : 'Unknown'),
          accessLogs: relatedAccessLogs
        });
      } catch (error) {
        console.error('Failed to fetch email details:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load email details."
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchEmailDetails();
  }, [user, emailId, toast]);

  if (loading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="flex items-center justify-center py-32 relative z-10">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
      </div>
    );
  }

  // Allow both admin and company_admin
  if (!user || (user.role !== 'admin' && user.role !== 'company_admin')) {
    return redirect('/login');
  }

  const getEmailStatus = (email: EmailDetails) => {
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
        return <Badge className="bg-zinc-800 text-zinc-300 hover:bg-zinc-700 border-none shadow-none"><Clock className="h-3 w-3 mr-1" />Sent</Badge>;
      case 'opened':
        return <Badge className="bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 border border-cyan-500/20"><Eye className="h-3 w-3 mr-1" />Opened</Badge>;
      case 'accessed':
        return <Badge className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/20"><CheckCircle className="h-3 w-3 mr-1" />Accessed</Badge>;
      case 'expired':
        return <Badge className="bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-500/20"><XCircle className="h-3 w-3 mr-1" />Expired</Badge>;
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

  const revokeEmail = async () => {
    if (!email) return;
    
    try {
      await data.emails.revoke(email.id);
      setEmail({ ...email, revoked: true });
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

  const unrevokeEmail = async () => {
    if (!email) return;
    try {
      await data.emails.unrevoke(email.id);
      setEmail({ ...email, revoked: false });
      toast({
        title: "Email Unrevoked",
        description: "The secure link has been restored successfully."
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to unrevoke email."
      });
    }
  };

  const formatDate = (date: string | any) => {
    const d = typeof date === 'string' ? new Date(date) : date.toDate();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString();
  };

  const formatDateShort = (date: string | any) => {
    const d = typeof date === 'string' ? new Date(date) : date.toDate();
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="flex items-center justify-center py-32 relative z-10">
            <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
      </div>
    );
  }

  if (!email) {
    return (
      <div className="flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
        <AppHeader />
        <main className="flex-1 p-4 sm:p-6 flex items-center justify-center relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-[100px] pointer-events-none"></div>
          
          <Card className="w-full max-w-md bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl relative z-10 overflow-hidden text-center">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
            <CardContent className="p-8">
              <div className="mx-auto mb-4 bg-zinc-950 border border-zinc-800 p-3 rounded-2xl w-fit shadow-[0_0_15px_rgba(16,185,129,0.2)]">
                <AlertTriangle className="h-8 w-8 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Email Not Found</h2>
              <p className="text-zinc-400 mb-6">The requested email could not be found or has been deleted.</p>
              <Button className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-semibold" asChild>
                <Link href="/admin/emails">Back to Emails</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-zinc-950 text-zinc-100 selection:bg-emerald-500/30">
      <AppHeader />
      <main className="flex-1 p-4 sm:p-6 relative overflow-hidden">
        {/* Background glow effects */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none"></div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="flex items-center gap-4 mb-6">
            <Link href="/admin/emails" className="flex items-center gap-2 text-sm text-zinc-400 hover:text-emerald-400 transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Back to All Emails</span>
            </Link>
            <div className="h-4 w-px bg-zinc-800"></div>
            <Link href={`/admin/emails/${emailId}`} className="text-xs text-emerald-500 hover:text-emerald-400 transition-colors flex items-center gap-1">
              View this email ({emailId}) <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Email Details */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                <CardHeader className="border-b border-zinc-800/50 pb-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="flex items-center gap-2 text-xl text-white">
                        <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800 shadow-[0_0_15px_rgba(16,185,129,0.15)]">
                          <Mail className="h-5 w-5 text-emerald-400" />
                        </div>
                        Email Details
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(getEmailStatus(email))}
                        {email.isGuest && (
                          <Badge className="bg-zinc-800 text-zinc-300 border-none shadow-none">Guest</Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline"
                        className="border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        size="sm"
                        onClick={() => copySecureLink(email.secureLinkToken)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy Link
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-zinc-700 bg-zinc-950/50 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        size="sm"
                        onClick={() => window.open(`/secure/${email.secureLinkToken}`, '_blank')}
                      >
                        <ExternalLink className="h-4 w-4 mr-1" />
                        View
                      </Button>
                      {!email.revoked && (
                        <Button 
                          className="bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30"
                          size="sm"
                          onClick={revokeEmail}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      )}
                      {email.revoked && (
                        <Button 
                          className="bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30"
                          size="sm"
                          onClick={unrevokeEmail}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Unrevoke
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-zinc-400">To</div>
                      <div className="font-medium text-zinc-200">{email.recipient}</div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-400">From</div>
                      <div className="font-medium text-zinc-200">{email.senderName}</div>
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-sm font-medium text-zinc-400">Subject</div>
                    <div className="font-medium text-zinc-200">{email.subject}</div>
                  </div>

                  <div>
                    <div className="text-sm font-medium text-zinc-400 mb-2">Body</div>
                    <div 
                      className="p-4 border border-zinc-800 rounded-lg bg-zinc-950/50 text-zinc-300 max-h-64 overflow-y-auto"
                      dangerouslySetInnerHTML={{ __html: email.body }}
                    />
                  </div>

                  {email.attachmentFilename && (
                    <div>
                      <div className="text-sm font-medium text-zinc-400 mb-2">Attachment</div>
                      <div className="flex items-center gap-2 p-3 border border-zinc-800 rounded-lg bg-zinc-950/50 text-emerald-400">
                        <Paperclip className="h-4 w-4" />
                        <span className="text-sm">{email.attachmentFilename}</span>
                      </div>
                    </div>
                  )}

                  <Separator className="bg-zinc-800 my-4" />

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm font-medium text-zinc-400 mb-1">Sent At</div>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Calendar className="h-4 w-4 text-emerald-500" />
                        {formatDate(email.createdAt)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-400 mb-1">Expires At</div>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Clock className="h-4 w-4 text-orange-500" />
                        {email.expiresAt 
                          ? formatDate(email.expiresAt)
                          : email.isGuest 
                            ? "24 hours (Guest)"
                            : "Never"
                        }
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-2">
                    <div>
                      <div className="text-sm font-medium text-zinc-400 mb-1">Company</div>
                      <div className="flex items-center gap-2 text-zinc-300">
                        <Building2 className="h-4 w-4 text-cyan-500" />
                        {email.companyName}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium text-zinc-400 mb-1">Secure Token</div>
                      <div className="font-mono text-xs bg-zinc-950 border border-zinc-800 text-zinc-400 p-2 rounded">
                        {email.secureLinkToken}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

            </div>

            {/* Access Logs Sidebar */}
            <div className="space-y-6">
              <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl relative overflow-hidden">
                <CardHeader className="border-b border-zinc-800/50 pb-4">
                  <CardTitle className="flex items-center gap-2 text-white">
                    <div className="p-2 rounded-lg bg-zinc-950 border border-zinc-800">
                      <ExternalLink className="h-5 w-5 text-indigo-400" />
                    </div>
                    Access Attempts ({email.accessLogs.length})
                  </CardTitle>
                  <CardDescription className="text-zinc-400">
                    Secure link access history
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  {email.accessLogs.length > 0 ? (
                    <div className="space-y-4">
                      {email.accessLogs.map((log) => {
                        return (
                          <div key={log.id} className="border border-zinc-800 bg-zinc-950/50 rounded-lg p-4 transition-colors hover:border-zinc-700">
                            <div className="flex items-start justify-between mb-3">
                              <Badge 
                                className={log.status === 'Success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'}
                              >
                                {log.status === 'Success' ? (
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                ) : (
                                  <XCircle className="h-3 w-3 mr-1" />
                                )}
                                {log.status}
                              </Badge>
                              <span className="text-xs text-zinc-500">
                                {formatDateShort(log.timestamp)}
                              </span>
                            </div>
                            <div className="space-y-2">
                              <div className="flex items-center gap-2 text-sm text-zinc-300">
                                <UserIcon className="h-4 w-4 text-zinc-500" />
                                {log.user}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-zinc-300">
                                <Mail className="h-4 w-4 text-zinc-500" />
                                {log.email}
                              </div>
                              <div className="flex items-center gap-2 text-sm text-zinc-300">
                                <MapPin className="h-4 w-4 text-zinc-500" />
                                <span className="font-mono text-xs">{log.ip}</span>
                              </div>
                              <Separator className="bg-zinc-800/50 my-2" />
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="flex flex-col gap-1 text-zinc-400">
                                  <span>Device</span>
                                  <span className="text-zinc-300 truncate">{log.device || 'N/A'}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 border border-dashed border-zinc-800 rounded-lg bg-zinc-950/30">
                      <div className="mx-auto mb-3 bg-zinc-900 border border-zinc-800 p-2 rounded-full w-fit">
                        <ExternalLink className="h-5 w-5 text-zinc-500" />
                      </div>
                      <h3 className="text-sm font-medium text-zinc-300 mb-1">No access attempts</h3>
                      <p className="text-xs text-zinc-500">
                        No one has attempted to access this secure link yet
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Stats */}
              <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-xl overflow-hidden">
                <CardHeader className="bg-zinc-950/50 border-b border-zinc-800 py-4">
                  <CardTitle className="text-base text-white">Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Access attempts</span>
                    <Badge className="bg-zinc-800 text-zinc-200 border-none">{email.accessLogs.length}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Successful access</span>
                    <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {email.accessLogs.filter(log => log.status === 'Success').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Failed access</span>
                    <Badge className="bg-red-500/10 text-red-400 border border-red-500/20">
                      {email.accessLogs.filter(log => log.status === 'Failed').length}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Unique IPs</span>
                    <span className="text-sm font-medium text-zinc-200">
                      {new Set(email.accessLogs.map(log => log.ip)).size}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-zinc-400">Unique devices</span>
                    <span className="text-sm font-medium text-zinc-200">
                      {new Set(email.accessLogs.map(log => `${log.device}-${log.ip}`)).size}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Email Links */}
              <Card className="bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-xl overflow-hidden">
                <CardHeader className="bg-zinc-950/50 border-b border-zinc-800 py-4">
                  <CardTitle className="text-base text-white">Direct Links</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Admin View</span>
                    <Link href={`/admin/emails/${emailId}`} className="block text-sm text-emerald-400 hover:text-emerald-300 transition-colors break-all bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                      /admin/emails/{emailId}
                    </Link>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">Secure Portal Link</span>
                    <Link href={`/secure/${email?.secureLinkToken}`} className="block text-sm text-cyan-400 hover:text-cyan-300 transition-colors break-all bg-zinc-950/50 p-2 rounded border border-zinc-800/50">
                      /secure/{email?.secureLinkToken}
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
