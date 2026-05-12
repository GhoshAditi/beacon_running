"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Building,
  Users,
  Settings,
  Mail,
  Key,
} from "lucide-react";
import GuardianMailLogo from "./icons/logo";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function AdminSidebar() {
  const pathname = usePathname();

  const navItems = [
    { href: "/admin", icon: BarChart3, label: "Dashboard", exact: true },
    { href: "/admin/companies", icon: Building, label: "Companies" },
    { href: "/admin/users", icon: Users, label: "All Users" },
    { href: "/admin/emails", icon: Mail, label: "All Emails" },
    { href: "/admin/pin-requests", icon: Key, label: "PIN Requests" },
  ];

  return (
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

          {navItems.map((item) => {
            const isActive = item.exact 
                ? pathname === item.href 
                : pathname?.startsWith(item.href);
            
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link 
                    href={item.href} 
                    className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 md:h-10 md:w-10 ${
                        isActive 
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                            : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="sr-only">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right" className="bg-zinc-800 text-zinc-100 border-zinc-700">{item.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </nav>
      
      <div className="flex-1" />
      
      <nav className="mb-6 flex flex-col items-center gap-6 px-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/settings"
                className={`flex h-12 w-12 items-center justify-center rounded-xl transition-all duration-300 md:h-10 md:w-10 ${
                    pathname?.startsWith("/settings")
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-[0_0_15px_rgba(16,185,129,0.2)]" 
                        : "text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800"
                }`}
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
  );
}
