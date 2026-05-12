'use client';

import { motion } from 'framer-motion';
import { ArrowRight, ShieldCheck } from 'lucide-react';
import Link from "next/link";

export default function CTASection() {
  return (
    <section className="relative overflow-hidden bg-zinc-950 py-24 sm:py-32">
      {/* Dark Texture / Grid Background */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:2rem_2rem]" />
      
      {/* Glowing Accent */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="relative mx-auto max-w-5xl overflow-hidden rounded-[2.5rem] border border-zinc-800 bg-zinc-900/50 backdrop-blur-xl p-8 sm:p-16 lg:p-20 text-center shadow-2xl"
        >
          {/* Inner ambient glow */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
          
          <div className="relative z-10 space-y-8">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white tracking-tight leading-tight">
              Ready to lock down your <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                sensitive data?
              </span>
            </h2>
            
            <p className="text-zinc-400 text-lg sm:text-xl max-w-2xl mx-auto font-light">
              Deploy Beacon within minutes. Secure your communications, track every interaction, and gain unparalleled visibility.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link href="/login" className="w-full sm:w-auto">
                <button className="group relative flex w-full h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-emerald-500 px-8 font-semibold text-zinc-950 transition-all hover:bg-emerald-400 hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.2)]">
                  <ShieldCheck className="h-5 w-5" />
                  <span>Start Free Trial</span>
                </button>
              </Link>
              
              <Link href="/login" className="w-full sm:w-auto">
                <button className="flex w-full h-14 items-center justify-center gap-2 rounded-full border border-zinc-700 bg-zinc-800/50 px-8 font-medium text-white transition-all hover:bg-zinc-700 hover:border-zinc-600">
                  <span>View Documentation</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>

            <p className="text-zinc-500 text-sm font-medium tracking-wide">
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
