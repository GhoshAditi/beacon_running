"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Bold, Italic, Underline, Paperclip, X, Sparkles, Send, ChevronDown, Check, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { composeAndSendEmail } from "@/ai/flows/compose-email-flow";
import { useAuth } from "@/context/auth-context";
import AppHeader from "@/components/app-header";
import { data, type User } from "@/lib/data";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import AdminSidebar from "@/components/admin-sidebar"; // Assuming we want sidebar here if it's an app page


const MAX_FILE_SIZE_MB = 25;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function ComposePage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [recipient, setRecipient] = useState("");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [attachment, setAttachment] = useState<File | null>(null);
  const [linkExpires, setLinkExpires] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const bodyRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const allUsers = await data.users.list();
        setUsers(allUsers);
      } catch (error) {
        console.error('Failed to load users:', error);
      }
    };
    loadUsers();
  }, []);

  const filteredUsers = users.filter(u => 
    u.id !== user?.id && // Don't show current user
    (u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) || 
     u.email.toLowerCase().includes(userSearchQuery.toLowerCase()))
  );

  const handleUserSelect = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    setRecipient(selectedUser.email);
    setUserDropdownOpen(false);
    setUserSearchQuery("");
  };

  const handleBodyChange = () => {
    if (bodyRef.current) {
        setBody(bodyRef.current.innerHTML);
    }
  }

  const handleFormat = (command: string) => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    document.execCommand(command, false);
    bodyRef.current?.focus();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > MAX_FILE_SIZE_BYTES) {
        toast({
          variant: "destructive",
          title: "File Too Large",
          description: `The selected file exceeds the ${MAX_FILE_SIZE_MB}MB limit.`,
        });
        return;
      }
      setAttachment(file);
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    if (!user) {
        toast({
            variant: "destructive",
            title: "Authentication Error",
            description: "You must be logged in to send emails. Please sign in first.",
        });
        return;
    }
    
    if (user.role !== 'admin' && !user.companyId) {
        toast({
            variant: "destructive",
            title: "Company Association Required",
            description: `Your account (${user.role}) is not associated with a company. Please contact your administrator.`,
        });
        return;
    }
    if (!recipient || !subject || !body) {
        toast({
            variant: "destructive",
            title: "Missing Fields",
            description: "Please fill out the recipient, subject, and body.",
        });
        return;
    }

    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "Invalid Recipient",
        description: "Please select a user from the database.",
      });
      return;
    }

    setIsLoading(true);
    let attachmentDataUri: string | undefined = undefined;
    if (attachment) {
      attachmentDataUri = await fileToDataUri(attachment);
    }

    try {
      const emailData: any = {
        recipient,
        subject,
        body,
        companyId: user.companyId || 'ADMIN',
        senderId: user.id,
        linkExpires,
        isGuest: false,
      };
      if (attachment && attachmentDataUri) {
        emailData.attachmentDataUri = attachmentDataUri;
        emailData.attachmentFilename = attachment.name;
      }

      const result = await composeAndSendEmail(emailData);

      if (result.success) {
        toast({
          title: "Email Sent",
          description: result.message,
        });
        window.dispatchEvent(new Event('refresh-logs'));
        router.push(user.role === 'admin' ? '/admin' : '/company-dashboard');
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: result.message,
        });
      }
    } catch (error) {
       toast({
        variant: "destructive",
        title: "Error",
        description: "An unexpected error occurred.",
      });
    } finally {
        setIsLoading(false);
    }
  };
  
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
                <h2 className="text-xl font-bold mb-2 text-white">Authentication Required</h2>
                <p className="text-zinc-400 mb-6">You must be logged in to compose secure emails.</p>
                <Button onClick={() => router.push('/login')} className="w-full bg-emerald-500 text-zinc-950 hover:bg-emerald-400">Sign In</Button>
              </CardContent>
            </Card>
          </main>
        </div>
      );
  }
  
  const dashboardHref = user.role === 'admin' ? '/admin' : '/company-dashboard';

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30">
        {user.role === 'admin' && <AdminSidebar />}
        <div className={`flex flex-col flex-1 ${user.role === 'admin' ? 'sm:pl-20' : ''}`}>
            <AppHeader />
            <main className="flex-1 p-4 sm:p-8 flex items-center justify-center">
                <Card className="max-w-4xl w-full mx-auto bg-zinc-900/80 backdrop-blur-xl border-zinc-800 shadow-2xl relative overflow-hidden rounded-xl">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
                    
                    <CardHeader className="flex flex-row items-center justify-between pb-6 pt-8 px-8 border-b border-zinc-800/50">
                        <Link href={dashboardHref} className="flex items-center gap-2 text-sm font-medium text-zinc-400 hover:text-emerald-400 transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                            <span>Back to Dashboard</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Mail className="h-5 w-5 text-emerald-500" />
                            <CardTitle className="text-xl text-white">New Secure Message</CardTitle>
                        </div>
                    </CardHeader>

                    <CardContent className="p-8">
                        <form onSubmit={handleSubmit} className="flex flex-col gap-6">

                            <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                                <Label htmlFor="recipient" className="text-right text-zinc-400 font-medium">To</Label>
                                <Popover open={userDropdownOpen} onOpenChange={setUserDropdownOpen}>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant="outline"
                                    role="combobox"
                                    aria-expanded={userDropdownOpen}
                                    className="w-full justify-between bg-zinc-950/50 border border-zinc-800 hover:bg-zinc-800 hover:text-white transition-colors h-11"
                                    >
                                    {selectedUser ? (
                                        <span className="flex items-center gap-2 text-white">
                                        <span>{selectedUser.name}</span>
                                        <span className="text-zinc-500 text-sm">({selectedUser.email})</span>
                                        </span>
                                    ) : (
                                        <span className="text-zinc-500">Select a secure recipient...</span>
                                    )}
                                    <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-zinc-900 border-zinc-800 shadow-2xl">
                                    <div className="p-2">
                                    <Input
                                        placeholder="Search users..."
                                        value={userSearchQuery}
                                        onChange={(e) => setUserSearchQuery(e.target.value)}
                                        className="mb-2 bg-zinc-950 border-zinc-800 text-white focus-visible:ring-emerald-500"
                                    />
                                    <div className="max-h-60 overflow-y-auto">
                                        {filteredUsers.length === 0 ? (
                                        <div className="p-4 text-sm text-zinc-500 text-center">
                                            No users found
                                        </div>
                                        ) : (
                                        filteredUsers.map((u) => (
                                            <Button
                                            key={u.id}
                                            variant="ghost"
                                            className="w-full justify-start p-3 h-auto hover:bg-zinc-800 hover:text-white"
                                            onClick={() => handleUserSelect(u)}
                                            >
                                            <div className="flex flex-col items-start gap-1 w-full">
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-medium text-white">{u.name}</span>
                                                        <span className="text-[10px] uppercase tracking-wider font-bold bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded">
                                                            {u.role.replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                    {selectedUser?.id === u.id && (
                                                        <Check className="h-4 w-4 text-emerald-500" />
                                                    )}
                                                </div>
                                                <span className="text-sm text-zinc-500">{u.email}</span>
                                            </div>
                                            </Button>
                                        ))
                                        )}
                                    </div>
                                    </div>
                                </PopoverContent>
                                </Popover>
                            </div>
                            
                            <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                                <Label htmlFor="subject" className="text-right text-zinc-400 font-medium">Subject</Label>
                                <Input 
                                    id="subject" 
                                    name="subject" 
                                    required 
                                    placeholder="Confidential: Q2 Financial Report" 
                                    value={subject} 
                                    onChange={e => setSubject(e.target.value)} 
                                    className="bg-zinc-950/50 border border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-emerald-500 h-11"
                                />
                            </div>
                            
                            <div className="grid grid-cols-[80px_1fr] items-center gap-4">
                                <div />
                                <div className="flex items-center space-x-3">
                                    <Switch id="link-expires" checked={linkExpires} onCheckedChange={setLinkExpires} className="data-[state=checked]:bg-emerald-500" />
                                    <Label htmlFor="link-expires" className="text-sm font-medium text-zinc-400">Secure link will automatically expire in 7 days</Label>
                                </div>
                            </div>

                            <div className="border border-zinc-800 rounded-lg overflow-hidden mt-2 bg-zinc-950/30">
                                <div className="p-0 border-b border-zinc-800 relative">
                                    <div
                                        ref={bodyRef}
                                        contentEditable
                                        onInput={handleBodyChange}
                                        className="min-h-[300px] w-full bg-transparent p-4 text-sm text-zinc-200 focus-visible:outline-none empty:before:content-['Type_your_secure_message_here...'] empty:before:text-zinc-600"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-3 bg-zinc-900/50">
                                    <div className="flex items-center gap-1">
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={() => handleFormat('bold')}><Bold className="h-4 w-4" /></Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={() => handleFormat('italic')}><Italic className="h-4 w-4" /></Button>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-800" onClick={() => handleFormat('underline')}><Underline className="h-4 w-4" /></Button>
                                        <div className="w-px h-4 bg-zinc-800 mx-2"></div>
                                        <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-zinc-400 hover:text-emerald-400 hover:bg-emerald-500/10" onClick={() => fileInputRef.current?.click()}>
                                            <Paperclip className="h-4 w-4" />
                                        </Button>
                                        <Input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                                    </div>
                                    <Button type="submit" className="bg-emerald-500 text-zinc-950 hover:bg-emerald-400 font-bold shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all" disabled={isLoading}>
                                        {isLoading ? <Sparkles className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                        {isLoading ? 'Encrypting...' : 'Send Secure Email'}
                                    </Button>
                                </div>
                            </div>

                            {attachment && (
                                <div className="flex items-center gap-3 p-3 rounded-lg border border-indigo-500/30 bg-indigo-500/10 text-sm mt-2 shadow-[0_0_10px_rgba(99,102,241,0.05)]">
                                    <div className="p-2 rounded bg-indigo-500/20">
                                        <Paperclip className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="font-medium text-zinc-200">{attachment.name}</span>
                                        <span className="text-xs text-indigo-400">{(attachment.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 ml-auto text-zinc-400 hover:text-red-400 hover:bg-red-500/10" onClick={() => setAttachment(null)}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                        </form>
                    </CardContent>
                </Card>
            </main>
        </div>
    </div>
  );
}