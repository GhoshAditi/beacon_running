import React, { useState, useEffect } from "react";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import Link from "next/link";
import { Shield } from "lucide-react";

export const Navbar = () => {
  return (
    <section>
      <SimpleFloatingNav />
    </section>
  );
};

const SimpleFloatingNav = () => {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const previous = scrollY.getPrevious() || 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
    
    if (latest > 50) {
      setIsScrolled(true);
    } else {
      setIsScrolled(false);
    }
  });

  return (
    <motion.nav
      variants={{
        visible: { y: 0, opacity: 1 },
        hidden: { y: "-100%", opacity: 0 },
      }}
      animate={hidden ? "hidden" : "visible"}
      transition={{ duration: 0.35, ease: "easeInOut" }}
      className={`fixed top-6 left-0 right-0 z-50 mx-auto flex w-[90%] max-w-7xl items-center justify-between rounded-full border px-6 py-4 transition-all duration-300 ${
        isScrolled 
          ? "border-white/10 bg-zinc-950/80 shadow-[0_8px_32px_rgba(0,0,0,0.4)] backdrop-blur-md" 
          : "border-transparent bg-transparent"
      }`}
    >
      <Logo />

      <div className="hidden md:flex items-center gap-8">
        <NavLink href="#features">Features</NavLink>
        <NavLink href="#how-it-works">How it Works</NavLink>
        <NavLink href="#pricing">Pricing</NavLink>
      </div>

      <div className="flex items-center gap-4">
        <Link href="/login" className="hidden sm:block text-sm font-medium text-zinc-300 hover:text-white transition-colors">
          Sign In
        </Link>
        <JoinButton />
      </div>
    </motion.nav>
  );
};

const Logo = () => {
  return (
    <Link href="/" className="flex items-center gap-2 group">
      <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-[0_0_15px_rgba(16,185,129,0.5)] transition-all group-hover:shadow-[0_0_25px_rgba(16,185,129,0.7)]">
        <div className="absolute inset-[1px] rounded-[11px] bg-zinc-950 flex items-center justify-center">
          <Shield className="h-5 w-5 text-emerald-400" />
        </div>
      </div>
      <span className="font-bold text-white text-xl tracking-wide">Beacon</span>
    </Link>
  );
};

const NavLink = ({ children, href }: { children: string; href: string }) => {
  return (
    <Link href={href} className="relative group text-sm font-medium text-zinc-400 hover:text-white transition-colors">
      {children}
      <span className="absolute -bottom-1 left-0 h-[2px] w-0 bg-emerald-500 transition-all duration-300 group-hover:w-full"></span>
    </Link>
  );
};

const JoinButton = () => {
  return (
    <Link href="/login">
      <button className="relative overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-zinc-950">
        <span className="absolute inset-[-1000%] animate-[spin_2s_linear_infinite] bg-[conic-gradient(from_90deg_at_50%_50%,#000000_0%,#10B981_50%,#000000_100%)]" />
        <span className="inline-flex h-full w-full cursor-pointer items-center justify-center rounded-full bg-zinc-950 px-6 py-2 text-sm font-medium text-white backdrop-blur-3xl transition-all hover:bg-zinc-900">
          Get Started
        </span>
      </button>
    </Link>
  );
};
