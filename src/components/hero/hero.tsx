'use client';

import { useEffect, useState } from 'react';
import { motion, useAnimation } from 'framer-motion';
import { ArrowRight, ShieldCheck, Activity, LockKeyhole } from 'lucide-react';
import Link from 'next/link';

export default function AppHero() {
  const [stats, setStats] = useState({
    secureLinks: 0,
    autoExpiry: 0,
    monitoring: 0,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setStats((prev) => {
        const newSecureLinks = prev.secureLinks >= 10000 ? 10000 : prev.secureLinks + 412;
        const newAutoExpiry = prev.autoExpiry >= 7 ? 7 : prev.autoExpiry + 1;
        const newMonitoring = prev.monitoring >= 24 ? 24 : prev.monitoring + 1;

        if (newSecureLinks === 10000 && newAutoExpiry === 7 && newMonitoring === 24) {
          clearInterval(interval);
        }

        return {
          secureLinks: newSecureLinks,
          autoExpiry: newAutoExpiry,
          monitoring: newMonitoring,
        };
      });
    }, 40);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative flex min-h-[100dvh] w-full flex-col items-center justify-center overflow-hidden bg-zinc-950 px-4 sm:px-6 lg:px-8 pt-24 pb-16">
      {/* Dark Cyber Background Elements */}
      <div className="absolute inset-0 z-0 flex items-center justify-center">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] translate-x-1/2 translate-y-1/2 rounded-full bg-cyan-500/10 blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 h-[800px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/5 blur-[150px]" />
      </div>

      {/* Grid Pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Main Content */}
      <div className="relative z-10 mx-auto w-full max-w-7xl">
        <div className="flex flex-col items-center justify-center gap-12 text-center lg:gap-16">
          
          {/* Top Badge */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.15)] backdrop-blur-md"
          >
            <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Beacon Security 2.0 Now Live
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="max-w-4xl space-y-6"
          >
            <h1 className="text-5xl font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl xl:text-[5rem] leading-[1.1]">
              Secure Communication, <br className="hidden sm:block" />
              <span className="relative inline-block mt-2">
                <span className="absolute -inset-1 block -skew-y-2 bg-gradient-to-r from-emerald-600 to-cyan-600" aria-hidden="true"></span>
                <span className="relative text-white">Monitored in Real-Time.</span>
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-zinc-400 sm:text-xl font-light leading-relaxed">
              Encrypt your most sensitive messages, embed invisible tracking beacons, and gain absolute visibility over every access attempt. Zero-trust security meets effortless design.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-center w-full sm:w-auto"
          >
            <Link href="/login" className="w-full sm:w-auto">
              <button className="group relative flex w-full h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-emerald-500 px-8 font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:scale-105 shadow-[0_0_40px_rgba(16,185,129,0.3)]">
                <ShieldCheck className="h-5 w-5" />
                <span>Start Securing Data</span>
                <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </Link>

            <Link href="#features" className="w-full sm:w-auto">
              <button className="flex w-full h-14 items-center justify-center rounded-full border border-zinc-700 bg-zinc-900/50 px-8 font-medium text-zinc-300 backdrop-blur-md transition-all hover:bg-zinc-800 hover:text-white">
                Explore Features
              </button>
            </Link>
          </motion.div>

          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
            className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3 max-w-4xl mx-auto w-full"
          >
            <StatCard 
              icon={<LockKeyhole className="h-6 w-6 text-emerald-400" />}
              value={`${stats.secureLinks.toLocaleString()}+`}
              label="Secured Links"
            />
            <StatCard 
              icon={<Activity className="h-6 w-6 text-cyan-400" />}
              value={`${stats.monitoring}/7`}
              label="Active Monitoring"
            />
            <StatCard 
              icon={<ShieldCheck className="h-6 w-6 text-indigo-400" />}
              value={`${stats.autoExpiry} Days`}
              label="Auto-Destruct"
            />
          </motion.div>
        </div>
      </div>

      {/* Decorative Bottom Gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-transparent z-10 pointer-events-none" />
    </section>
  );
}

function StatCard({ icon, value, label }: { icon: React.ReactNode, value: string, label: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-6 backdrop-blur-sm transition-all hover:border-zinc-700 hover:bg-zinc-800/50 flex flex-col items-center justify-center text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-950 border border-zinc-800 shadow-inner group-hover:scale-110 transition-transform duration-300">
        {icon}
      </div>
      <h3 className="text-3xl font-bold text-white tracking-tight">{value}</h3>
      <p className="mt-1 text-sm text-zinc-400 font-medium">{label}</p>
    </div>
  );
}
