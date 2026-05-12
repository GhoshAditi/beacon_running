"use client";

import { useEffect, useState } from "react";
import NextLink from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "./ui/card";
import { data, type Company, type User, type Email } from "@/lib/data";
import AppHeader from "./app-header";
import AdminSidebar from "./admin-sidebar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart, Bar, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Trash2, Building2, Users as UsersIcon, Mail as MailIcon, Activity, AlertTriangle, ShieldAlert, MonitorSmartphone } from "lucide-react";

export default function AdminDashboard() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [emails, setEmails] = useState<Email[]>([]);

  useEffect(() => {
    async function fetchData() {
        const [companyData, userData, emailData] = await Promise.all([
            data.companies.list(),
            data.users.list(),
            data.emails.list()
        ]);
        setCompanies(companyData);
        setUsers(userData);
        setEmails(emailData);
    }
    fetchData();
  }, [])

  const emailsPerDay = (() => {
    const map: Record<string, number> = {};
    emails.forEach(e => {
      const date = typeof e.createdAt === 'string' ? new Date(e.createdAt) : e.createdAt.toDate();
      const key = date.toLocaleDateString();
      map[key] = (map[key] || 0) + 1;
    });
    return Object.entries(map).map(([date, count]) => ({ date, count }));
  })();

  const userRoles = (() => {
    const map: Record<string, number> = {};
    users.forEach(u => {
      const role = u.role || 'unknown';
      map[role] = (map[role] || 0) + 1;
    });
    return Object.entries(map).map(([role, value]) => ({ name: role, value }));
  })();

  const pieColors = ['#10B981', '#06B6D4', '#6366F1', '#8B5CF6', '#F59E0B'];

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#09090b] text-zinc-100 selection:bg-emerald-500/30">
      <AdminSidebar />
      <div className="flex flex-col sm:gap-4 sm:py-4 sm:pl-20">
        <AppHeader />
        <main className="flex-1 p-4 sm:px-8 sm:py-4 md:gap-8 max-w-[1600px] mx-auto w-full">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6 flex flex-wrap gap-2 bg-zinc-900/80 backdrop-blur-md border border-zinc-800/80 rounded-xl p-1 shadow-lg w-fit">
              <TabsTrigger value="overview" className="data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-400 data-[state=active]:shadow-[0_0_15px_rgba(16,185,129,0.2)] text-zinc-400 rounded-lg transition-all px-6">Overview</TabsTrigger>
              <TabsTrigger value="alerts" className="data-[state=active]:bg-red-500/20 data-[state=active]:text-red-400 data-[state=active]:shadow-[0_0_15px_rgba(239,68,68,0.2)] text-zinc-400 rounded-lg transition-all px-6">Security Alerts</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-0 focus-visible:outline-none focus-visible:ring-0 space-y-6">
              {/* Dynamic Grid Layout for Top Metrics */}
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
                <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-emerald-500/30 transition-all duration-300 group shadow-lg">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Building2 className="w-16 h-16 text-emerald-500" />
                  </div>
                  <CardHeader className="pb-2 z-10 relative">
                    <CardDescription className="text-zinc-400 font-medium">Total Companies</CardDescription>
                    <CardTitle className="text-4xl text-white font-bold drop-shadow-sm">{companies.length}</CardTitle>
                  </CardHeader>
                  <CardContent className="z-10 relative pt-2">
                    <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium"><Activity className="w-3 h-3" /> System wide</p>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-emerald-500/0 via-emerald-500/50 to-emerald-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-cyan-500/30 transition-all duration-300 group shadow-lg">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <UsersIcon className="w-16 h-16 text-cyan-500" />
                  </div>
                  <CardHeader className="pb-2 z-10 relative">
                    <CardDescription className="text-zinc-400 font-medium">Total Users</CardDescription>
                    <CardTitle className="text-4xl text-white font-bold drop-shadow-sm">{users.length}</CardTitle>
                  </CardHeader>
                  <CardContent className="z-10 relative pt-2">
                    <p className="text-xs text-cyan-400 flex items-center gap-1 font-medium"><Activity className="w-3 h-3" /> Across all roles</p>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-cyan-500/0 via-cyan-500/50 to-cyan-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-indigo-500/30 transition-all duration-300 group shadow-lg">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <MailIcon className="w-16 h-16 text-indigo-500" />
                  </div>
                  <CardHeader className="pb-2 z-10 relative">
                    <CardDescription className="text-zinc-400 font-medium">Emails Sent</CardDescription>
                    <CardTitle className="text-4xl text-white font-bold drop-shadow-sm">{emails.length}</CardTitle>
                  </CardHeader>
                  <CardContent className="z-10 relative pt-2">
                    <p className="text-xs text-indigo-400 flex items-center gap-1 font-medium"><Activity className="w-3 h-3" /> Secured links</p>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Card>

                <Card className="relative overflow-hidden bg-gradient-to-br from-zinc-900 to-zinc-950 border-zinc-800 hover:border-violet-500/30 transition-all duration-300 group shadow-lg">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Activity className="w-16 h-16 text-violet-500" />
                  </div>
                  <CardHeader className="pb-2 z-10 relative">
                    <CardDescription className="text-zinc-400 font-medium">Recent Activity</CardDescription>
                    <CardTitle className="text-4xl text-white font-bold drop-shadow-sm">{emails.filter(e => {
                      const createdAt = typeof e.createdAt === 'string' ? new Date(e.createdAt) : e.createdAt.toDate();
                      const yesterday = new Date();
                      yesterday.setDate(yesterday.getDate() - 1);
                      return createdAt > yesterday;
                    }).length}</CardTitle>
                  </CardHeader>
                  <CardContent className="z-10 relative pt-2">
                    <p className="text-xs text-violet-400 flex items-center gap-1 font-medium"><Activity className="w-3 h-3" /> Past 24 hours</p>
                  </CardContent>
                  <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-violet-500/0 via-violet-500/50 to-violet-500/0 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                      <MailIcon className="w-5 h-5 text-emerald-400" />
                      Email Volume Trends
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={emailsPerDay}>
                        <XAxis dataKey="date" fontSize={12} stroke="#71717A" tickLine={false} axisLine={false} />
                        <YAxis allowDecimals={false} fontSize={12} stroke="#71717A" tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#FFF', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }} 
                          itemStyle={{ color: '#FFF', fontWeight: 500 }}
                          labelStyle={{ color: '#A1A1AA', marginBottom: '4px' }}
                          cursor={{ fill: '#27272A', opacity: 0.4 }}
                        />
                        <Bar dataKey="count" fill="#10B981" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl backdrop-blur-xl">
                  <CardHeader>
                    <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                      <UsersIcon className="w-5 h-5 text-cyan-400" />
                      User Roles Distribution
                    </CardTitle>
                  </CardHeader>
                  <CardContent style={{ height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={userRoles} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={100} paddingAngle={2} stroke="none">
                          {userRoles.map((entry, idx) => (
                            <Cell key={`cell-${idx}`} fill={pieColors[idx % pieColors.length]} />
                          ))}
                        </Pie>
                        <Legend wrapperStyle={{ color: '#A1A1AA', fontSize: '12px', paddingTop: '10px' }} iconType="circle" />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#FFF', borderRadius: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.5)' }} 
                          itemStyle={{ color: '#FFF', fontWeight: 600 }}
                          labelStyle={{ color: '#FFF' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Data Previews Section */}
              <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
                <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl backdrop-blur-xl flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50 pb-4">
                    <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-indigo-400" />
                      Onboarded Companies
                    </CardTitle>
                    <Button asChild size="sm" className="bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors">
                      <NextLink href="/admin/companies">Manage</NextLink>
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-3 pt-4 flex-1">
                    {companies.slice(0, 5).map(company => (
                      <div key={company.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                        <span className="text-zinc-200 font-medium">{company.name}</span>
                        <span className="text-xs text-zinc-500 font-mono">{company.id.substring(0, 8)}...</span>
                      </div>
                    ))}
                    {companies.length > 5 && (
                      <div className="mt-auto pt-2 text-center">
                        <p className="text-xs text-zinc-500 font-medium">...and {companies.length - 5} more</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/80 border-zinc-800 shadow-xl backdrop-blur-xl flex flex-col">
                  <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-800/50 pb-4">
                    <CardTitle className="text-white text-lg font-semibold flex items-center gap-2">
                      <MailIcon className="w-5 h-5 text-violet-400" />
                      Recent Emails
                    </CardTitle>
                    <Button asChild size="sm" className="bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 border border-violet-500/30 transition-colors">
                      <NextLink href="/admin/emails">View All</NextLink>
                    </Button>
                  </CardHeader>
                  <CardContent className="grid gap-3 pt-4 flex-1">
                    {emails.slice(0, 5).map(email => {
                      const createdAt = typeof email.createdAt === 'string' ? new Date(email.createdAt) : email.createdAt.toDate();
                      return (
                        <div key={email.id} className="flex flex-col gap-1.5 p-3 rounded-lg bg-zinc-950/50 border border-zinc-800/50 hover:border-zinc-700 transition-colors">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-zinc-200 truncate max-w-[200px]">{email.subject}</span>
                            <span className="text-[10px] uppercase tracking-wider font-medium text-zinc-500 bg-zinc-800 px-2 py-0.5 rounded-full">{createdAt.toLocaleDateString()}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                            <span className="truncate">{email.recipient}</span>
                          </div>
                        </div>
                      );
                    })}
                    {emails.length === 0 && (
                      <div className="flex items-center justify-center flex-1 h-full py-8 text-zinc-500 text-sm">
                        No emails sent yet
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="alerts" className="mt-0">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 py-4">
                <Card className="relative overflow-hidden border border-red-500/30 bg-gradient-to-br from-red-500/10 to-zinc-900 shadow-[0_0_20px_rgba(239,68,68,0.05)] hover:shadow-[0_0_25px_rgba(239,68,68,0.15)] transition-all">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                    <CardTitle className="text-base font-semibold text-red-400 flex items-center gap-2">
                      <ShieldAlert className="w-5 h-5" />
                      Security Breach Detected
                    </CardTitle>
                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-red-500/20 text-red-300 border border-red-500/30">2 min ago</span>
                  </CardHeader>
                  <CardContent className="z-10 relative">
                    <p className="text-sm text-red-200/80 leading-relaxed">Multiple failed login attempts detected from IP 192.168.1.101. User account locked for 30 minutes.</p>
                  </CardContent>
                </Card>
                
                <Card className="relative overflow-hidden border border-amber-500/30 bg-gradient-to-br from-amber-500/10 to-zinc-900 shadow-[0_0_20px_rgba(245,158,11,0.05)] hover:shadow-[0_0_25px_rgba(245,158,11,0.15)] transition-all">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                    <CardTitle className="text-base font-semibold text-amber-400 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5" />
                      Suspicious Activity
                    </CardTitle>
                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">10 min ago</span>
                  </CardHeader>
                  <CardContent className="z-10 relative">
                    <p className="text-sm text-amber-200/80 leading-relaxed">Unusual volume of outbound emails detected from user john.doe@company.com.</p>
                  </CardContent>
                </Card>

                <Card className="relative overflow-hidden border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-zinc-900 shadow-[0_0_20px_rgba(6,182,212,0.05)] hover:shadow-[0_0_25px_rgba(6,182,212,0.15)] transition-all">
                  <CardHeader className="flex flex-row items-center justify-between pb-2 z-10 relative">
                    <CardTitle className="text-base font-semibold text-cyan-400 flex items-center gap-2">
                      <MonitorSmartphone className="w-5 h-5" />
                      New Device Login
                    </CardTitle>
                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">30 min ago</span>
                  </CardHeader>
                  <CardContent className="z-10 relative">
                    <p className="text-sm text-cyan-200/80 leading-relaxed">User jane.smith@company.com logged in from a new device (Chrome, Windows 10).</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
}
