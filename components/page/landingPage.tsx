"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  Zap,
  Shield,
  Smartphone,
  ArrowRight,
  LayoutDashboard,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { GlassCard } from "@/components/ui/glass-card";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push(`/${user.uid}`);
    }
  }, [user, loading, router]);

  // While checking auth status, show a simple loader or nothing
  //   if (loading || user) return null;

  return (
    <div className="min-h-screen flex flex-col">
      {/* 1. NAVBAR */}
      <nav className="w-full px-6 py-4 flex justify-between items-center z-50 fixed top-0 left-0 bg-white/10 backdrop-blur-md border-b border-white/20">
        <div className="flex items-center gap-2 text-primary font-bold text-xl">
          <div className="p-2 bg-primary text-white rounded-lg">
            <Zap size={20} fill="currentColor" />
          </div>
          SmartDB
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="text-sm font-semibold text-gray-600 hover:text-primary transition"
          >
            Log In
          </Link>
          <Link href="/signup">
            <button className="bg-primary text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-500/30">
              Get Started
            </button>
          </Link>
        </div>
      </nav>

      {/* 2. HERO SECTION */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-4 pt-32 pb-16 relative overflow-hidden">
        {/* Background Decoration */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-200 h-200 bg-blue-400/20 rounded-full blur-[120px] -z-10 pointer-events-none" />

        <div className="max-w-4xl mx-auto space-y-6 animate-in slide-in-from-bottom-10 fade-in duration-700">
          <span className="px-3 py-1 bg-blue-100 text-blue-600 rounded-full text-xs font-bold uppercase tracking-wider">
            Next Gen Energy Management
          </span>
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-slate-900 dark:text-white">
            Take Control of your <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-purple-600">
              Energy Consumption
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto">
            The smart distribution board that brings transparency to co-living
            spaces. Monitor usage, automate billing, and prevent overloads in
            real-time.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link href="/signup" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-slate-900 text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-slate-800 transition hover:scale-105 duration-200">
                Create Free Account <ArrowRight size={20} />
              </button>
            </Link>
            <Link href="/about" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white text-slate-900 border border-gray-200 px-8 py-4 rounded-full font-bold text-lg hover:bg-gray-50 transition">
                Learn More
              </button>
            </Link>
          </div>
        </div>

        {/* Hero Image / Mockup Placeholder */}
        <div className="mt-16 relative max-w-5xl mx-auto">
          <GlassCard className="p-2 bg-white/40 border-4 border-white/50 rounded-3xl shadow-2xl overflow-hidden">
            {/* Replace this with a screenshot of your actual dashboard later */}
            <div className="aspect-video bg-linear-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center overflow-hidden relative">
              <div className="absolute inset-0 bg-grid-slate-200 [linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25" />
              <div className="text-gray-400 font-medium z-10 flex flex-col items-center gap-2">
                <LayoutDashboard size={48} className="text-gray-300" />
                <span className="text-sm">Interactive Dashboard Preview</span>
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* 3. FEATURES GRID */}
      <section className="py-20 px-4 bg-white/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Why choose SmartDB?</h2>
            <p className="text-gray-500">
              Everything you need to manage electricity efficiently.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Real-time Analytics",
                desc: "Watch your consumption live. Identify heavy appliances and optimize usage patterns instantly.",
              },
              {
                icon: Shield,
                title: "Overload Protection",
                desc: "Automatic cutoff triggers when limits are exceeded, ensuring safety and fair usage for all tenants.",
              },
              {
                icon: Smartphone,
                title: "Remote Control",
                desc: "Control your outlets from anywhere in the world. Set timers, limits, and view history on the go.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="p-8 rounded-3xl bg-white border border-gray-100 hover:shadow-xl transition hover:-translate-y-1 duration-300"
              >
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-6">
                  <feature.icon size={28} />
                </div>
                <h3 className="text-xl font-bold mb-3">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. FOOTER */}
      <footer className="py-8 text-center text-sm text-gray-400 border-t border-gray-200">
        <p>
          © {new Date().getFullYear()} SmartDB Project. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
