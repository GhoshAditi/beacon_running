"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { MailPlus, PanelLeft, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
  } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/auth-context";
import { data, type User } from "@/lib/data";
import GuardianMailLogo from "./icons/logo";
import { useRouter } from "next/navigation";

interface AppHeaderProps {
    companyName?: string;
}

export default function AppHeader({ companyName }: AppHeaderProps) {
    const { user, logout, switchUser } = useAuth();
    const router = useRouter();
    const [allUsers, setAllUsers] = useState<User[]>([]);

    useEffect(() => {
        data.users.list().then(setAllUsers);
    }, []);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    }
    
    const handleSwitchUser = async (email: string) => {
        await switchUser(email);
    }

    return (
        <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-xl px-4 shadow-[0_4px_30px_rgba(0,0,0,0.5)] sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6 sm:py-4">
            <Sheet>
                <SheetTrigger asChild>
                    <Button size="icon" variant="outline" className="sm:hidden border-zinc-700 bg-zinc-900 text-zinc-300 hover:bg-zinc-800 hover:text-white">
                        <PanelLeft className="h-5 w-5" />
                        <span className="sr-only">Toggle Menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="sm:max-w-xs bg-zinc-950 border-r border-zinc-800 text-zinc-300">
                    <nav className="grid gap-6 text-lg font-medium">
                        <Link
                            href="#"
                            className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full bg-zinc-900 border border-zinc-800 text-emerald-400 md:text-base"
                        >
                            <GuardianMailLogo className="h-5 w-5 transition-transform group-hover:scale-110" />
                            <span className="sr-only">Beacon</span>
                        </Link>
                        <Link href="/compose" className="flex items-center gap-4 px-2.5 text-zinc-400 hover:text-emerald-400 transition-colors">
                            <MailPlus className="h-5 w-5" />
                            Compose Email
                        </Link>
                        <Link href="/settings" className="flex items-center gap-4 px-2.5 text-zinc-400 hover:text-emerald-400 transition-colors">
                            <Settings className="h-5 w-5" />
                            Settings
                        </Link>
                    </nav>
                </SheetContent>
            </Sheet>

            <div className="flex-1 flex flex-col items-center justify-center md:items-start md:justify-center">
                <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white drop-shadow-sm text-center md:text-left">
                    {user?.role === 'admin' ? 'Admin Dashboard' : companyName || 'Dashboard'}
                </h1>
                <span className="hidden md:block text-sm text-zinc-400 font-medium mt-1">
                    Welcome{user?.name ? `, ${user.name}` : ''}!
                </span>
            </div>

            <div className="flex items-center gap-2 md:gap-4 ml-auto">
                <Button asChild className="hidden sm:flex font-semibold bg-emerald-500 text-zinc-950 hover:bg-emerald-400 transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                    <Link href="/compose">
                        <MailPlus className="mr-2 h-4 w-4" />
                        Compose Email
                    </Link>
                </Button>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            variant="outline"
                            size="icon"
                            className="overflow-hidden rounded-full border-2 border-zinc-700 bg-zinc-900 shadow-sm hover:border-emerald-500 hover:shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all"
                        >
                            <img
                                src={ "/logo.png"}
                                width={36}
                                height={36}
                                alt="Avatar"
                                className="h-full w-full object-cover"
                            />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800 text-zinc-300">
                        <DropdownMenuLabel className="font-bold text-white">{user?.name || 'My Account'}</DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuSub>
                            <DropdownMenuSubTrigger className="hover:bg-zinc-800 focus:bg-zinc-800">Switch User</DropdownMenuSubTrigger>
                            <DropdownMenuPortal>
                                <DropdownMenuSubContent className="bg-zinc-900 border-zinc-800">
                                    {allUsers.map((u: User) => (
                                        <DropdownMenuItem key={u.id} onClick={() => handleSwitchUser(u.email)} disabled={u.id === user?.id} className="font-medium hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-300">
                                            {u.name} <span className="ml-1 text-xs text-zinc-500">({u.role})</span>
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuSubContent>
                            </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuItem asChild className="hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-300 cursor-pointer">
                            <Link href="/settings">Settings</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="hover:bg-zinc-800 focus:bg-zinc-800 text-zinc-300 cursor-pointer">Support</DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem onClick={handleLogout} className="text-red-400 font-semibold hover:bg-zinc-800 focus:bg-zinc-800 cursor-pointer">Logout</DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
