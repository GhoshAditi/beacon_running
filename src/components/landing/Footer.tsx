import React from 'react';
import Link from 'next/link';
import { Shield, Lock, Users, Mail, Phone, MapPin, Github, Twitter, Linkedin } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="bg-zinc-950 border-t border-zinc-800 pt-16 pb-8">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 max-w-7xl mx-auto">
          {/* Brand Section */}
          <div className="space-y-6 md:col-span-1">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all group-hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]">
                <Shield className="h-5 w-5 text-emerald-400" />
              </div>
              <span className="font-bold text-white text-xl tracking-wide">Beacon</span>
            </Link>
            <p className="text-zinc-400 text-sm leading-relaxed font-light">
              Military-grade encryption. Real-time threat intelligence. Total data control.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <SocialLink href="#" icon={<Twitter className="h-4 w-4" />} />
              <SocialLink href="#" icon={<Github className="h-4 w-4" />} />
              <SocialLink href="#" icon={<Linkedin className="h-4 w-4" />} />
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-sm tracking-wide uppercase">Platform</h3>
            <div className="flex flex-col space-y-3">
              <FooterLink href="#features">Features</FooterLink>
              <FooterLink href="#pricing">Pricing</FooterLink>
              <FooterLink href="#security">Security</FooterLink>
              <FooterLink href="#compliance">Compliance</FooterLink>
            </div>
          </div>

          {/* Resources */}
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-sm tracking-wide uppercase">Resources</h3>
            <div className="flex flex-col space-y-3">
              <FooterLink href="/docs">Documentation</FooterLink>
              <FooterLink href="/api">API Reference</FooterLink>
              <FooterLink href="/blog">Blog</FooterLink>
              <FooterLink href="/support">Support Center</FooterLink>
            </div>
          </div>

          {/* Contact Us */}
          <div className="space-y-6">
            <h3 className="text-white font-semibold text-sm tracking-wide uppercase">Contact Us</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-zinc-400 text-sm">
                <MapPin className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                <span>Global Headquarters<br/>San Francisco, CA</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400 text-sm">
                <Phone className="h-4 w-4 text-emerald-500" />
                <span>+1 (800) 555-0199</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-400 text-sm">
                <Mail className="h-4 w-4 text-emerald-500" />
                <span>secure@beacon.dev</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-16 pt-8 border-t border-zinc-800/50 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-zinc-500 text-sm">
            © {new Date().getFullYear()} Beacon Security Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-6">
            <Link href="/privacy" className="text-zinc-500 hover:text-emerald-400 text-sm transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="text-zinc-500 hover:text-emerald-400 text-sm transition-colors">Terms of Service</Link>
            <Link href="/cookies" className="text-zinc-500 hover:text-emerald-400 text-sm transition-colors">Cookie Settings</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

function FooterLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <Link href={href} className="text-zinc-400 hover:text-emerald-400 text-sm transition-colors duration-200 w-fit">
      {children}
    </Link>
  );
}

function SocialLink({ href, icon }: { href: string, icon: React.ReactNode }) {
  return (
    <a 
      href={href} 
      className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:bg-emerald-500 hover:text-zinc-950 hover:border-emerald-500 transition-all duration-300"
      target="_blank" 
      rel="noopener noreferrer"
    >
      {icon}
    </a>
  );
}