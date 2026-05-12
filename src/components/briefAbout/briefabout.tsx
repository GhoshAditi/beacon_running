import { motion } from "framer-motion";
import { useState } from "react";
import { IconType } from "react-icons";
import {
  FiShield,
  FiChevronLeft,
  FiChevronRight,
  FiLock,
  FiActivity,
  FiZap,
  FiUsers,
} from "react-icons/fi";

const CollapseCardFeatures = () => {
  const [position, setPosition] = useState(0);

  const shiftLeft = () => {
    if (position > 0) {
      setPosition((pv) => pv - 1);
    }
  };

  const shiftRight = () => {
    if (position < features.length - 1) {
      setPosition((pv) => pv + 1);
    }
  };

  return (
    <section id="features" className="relative overflow-hidden bg-zinc-950 px-6 py-24 lg:py-32">
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-1/3 h-1/2 bg-emerald-500/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-cyan-500/5 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="mx-auto max-w-7xl relative z-10">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          viewport={{ once: true }}
          className="text-center mb-16 lg:mb-24"
        >
          <div className="inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/50 px-5 py-2 mb-8 backdrop-blur-sm">
            <FiShield className="mr-2 h-4 w-4 text-emerald-400" />
            <span className="text-sm font-medium text-zinc-300 tracking-wide uppercase text-xs">Platform Capabilities</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 text-white leading-tight">
            Security. Intelligence. <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              Total Control.
            </span>
          </h2>
          
          <p className="text-zinc-400 text-lg max-w-2xl mx-auto leading-relaxed font-light">
            Enterprise-grade protection fused with real-time analytics. See exactly what happens to your data after you hit send.
          </p>
        </motion.div>

        {/* Navigation Controls */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center gap-6 p-2 rounded-full bg-zinc-900/80 backdrop-blur-xl border border-zinc-800 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
            <button
              className="group relative flex h-12 w-12 items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all duration-300 rounded-full disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-700"
              onClick={shiftLeft}
              disabled={position === 0}
            >
              <FiChevronLeft className="text-xl" />
            </button>
            
            {/* Progress Indicators */}
            <div className="flex items-center gap-3 px-4">
              {features.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setPosition(index)}
                  className={`h-1.5 rounded-full transition-all duration-500 ${
                    index === position 
                      ? "bg-emerald-400 w-8 shadow-[0_0_10px_rgba(16,185,129,0.5)]" 
                      : "bg-zinc-700 w-2 hover:bg-zinc-500"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
            
            <button
              className="group relative flex h-12 w-12 items-center justify-center bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all duration-300 rounded-full disabled:opacity-30 disabled:cursor-not-allowed border border-zinc-700"
              onClick={shiftRight}
              disabled={position === features.length - 1}
            >
              <FiChevronRight className="text-xl" />
            </button>
          </div>
        </div>

        {/* Feature Cards Carousel */}
        <div className="relative overflow-hidden py-4 -mx-4 px-4 sm:mx-0 sm:px-0">
          <div className="flex gap-6 sm:gap-8 transition-transform duration-500 ease-in-out">
            {features.map((feat, index) => (
              <Feature {...feat} key={index} position={position} index={index} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

interface FeatureProps {
  position: number;
  index: number;
  title: string;
  description: string;
  Icon: IconType;
  metric?: string;
  color: string;
}

const Feature = ({
  position,
  index,
  title,
  description,
  Icon,
  metric,
  color,
}: FeatureProps) => {
  const translateAmt =
    position >= index ? index * 100 : index * 100 - 100 * (index - position);

  return (
    <motion.div
      animate={{ x: `calc(-${translateAmt}% - ${position * 2}rem)` }}
      transition={{
        type: "spring",
        stiffness: 200,
        damping: 25,
      }}
      className="relative flex min-h-[400px] w-[85vw] sm:w-[400px] shrink-0 flex-col justify-between overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-900/40 p-8 backdrop-blur-md group hover:border-zinc-600 hover:bg-zinc-900/60 transition-all duration-300"
    >
      {/* Decorative Gradient Overlay */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{
          background: `radial-gradient(circle at 80% 0%, ${color}15, transparent 50%)`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-center justify-between mb-8">
          <div 
            className="flex items-center justify-center w-14 h-14 rounded-2xl border border-zinc-700 bg-zinc-800/50 shadow-inner group-hover:scale-110 transition-transform duration-500"
          >
            <Icon className="text-2xl" style={{ color }} />
          </div>
          
          {metric && (
            <div className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1 shadow-sm">
              <span className="text-xs font-semibold tracking-wide uppercase" style={{ color }}>{metric}</span>
            </div>
          )}
        </div>
        
        <div className="mb-4">
          <h3 className="text-2xl font-bold text-white mb-4 leading-tight">
            {title}
          </h3>
        </div>
        
        <p className="text-zinc-400 text-base leading-relaxed flex-grow font-light">
          {description}
        </p>
        
        {/* Bottom Accent */}
        <div className="mt-8 pt-6 border-t border-zinc-800/80">
          <div className="flex items-center text-sm font-medium text-zinc-300">
            <div 
              className="w-2 h-2 rounded-full mr-3 animate-pulse"
              style={{ backgroundColor: color, boxShadow: `0 0 10px ${color}` }}
            />
            System Active
          </div>
        </div>
      </div>
      
      {/* Bottom glowing line */}
      <div 
        className="absolute bottom-0 left-0 right-0 h-1 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" 
        style={{ backgroundColor: color }}
      />
    </motion.div>
  );
};

export default CollapseCardFeatures;

const features = [
  {
    title: "Military-Grade Encryption",
    Icon: FiLock,
    metric: "End-to-End",
    color: "#10B981", // emerald-500
    description:
      "Every message is fortified with state-of-the-art encryption algorithms. Sensitive payloads remain mathematically unreadable to unauthorized entities.",
  },
  {
    title: "Invisible Beacon Tech",
    Icon: FiActivity,
    metric: "Live Tracking",
    color: "#06B6D4", // cyan-500
    description:
      "Embed stealth trackers within communications. Monitor precise access times, device fingerprints, and geolocation coordinates the moment your data is opened.",
  },
  {
    title: "Autonomous Defense",
    Icon: FiShield,
    metric: "AI-Powered",
    color: "#6366F1", // indigo-500
    description:
      "Our heuristics engine analyzes access patterns in real-time. Anomalous behaviors trigger immediate lockdown protocols to prevent data exfiltration.",
  },
  {
    title: "Command Center",
    Icon: FiUsers,
    metric: "Centralized",
    color: "#8B5CF6", // violet-500
    description:
      "A comprehensive tactical dashboard for administrators. Revoke access instantly, audit compliance logs, and manage user permissions from a single pane of glass.",
  },
  {
    title: "Threat Intelligence",
    Icon: FiZap,
    metric: "Smart Reports",
    color: "#F59E0B", // amber-500
    description:
      "Synthesize raw telemetry into actionable intelligence. Identify vulnerabilities, train your workforce, and stay one step ahead of potential breaches.",
  },
];
