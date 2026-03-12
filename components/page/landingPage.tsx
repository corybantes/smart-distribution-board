"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Activity,
  ShieldAlert,
  Calculator,
  Cpu,
} from "lucide-react";
import PublicHeader from "../layout/general/public-header";

export default function LandingPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(`/${user.uid}`);
    }
  }, [user, loading, router]);

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-blue-200 dark:selection:bg-blue-900">
      <PublicHeader />

      <main className="flex-1 w-full flex flex-col items-center pt-28 pb-20 space-y-32 overflow-hidden">
        {/* 1. ASYMMETRIC HERO SECTION */}
        <section className="w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Side: Text Content */}
          <div className="space-y-8 z-10 flex flex-col items-center text-center lg:items-start lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-100/50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 rounded-full text-sm font-bold tracking-wide">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
              </span>
              EnerGenius Smart Board
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight leading-[1.1]">
              The future of <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-600 to-indigo-500">
                shared energy.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 max-w-2xl lg:max-w-lg leading-relaxed">
              Industrial-grade protection meets AI-powered billing. Experience
              precise outlet-level monitoring designed exclusively for co-living
              spaces.
            </p>

            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-4">
              <Link href="/signup">
                <button className="flex items-center gap-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-1">
                  Get Started <ArrowRight size={20} />
                </button>
              </Link>

              <Link href="/about">
                <button className="flex items-center gap-2 bg-white dark:bg-slate-900 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 px-8 py-4 rounded-xl font-bold text-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shadow-sm hover:-translate-y-1">
                  Learn More
                </button>
              </Link>
            </div>
          </div>

          {/* Right Side: CLEAN ABSTRACT UI REPRESENTATION */}
          <div className="relative w-full aspect-square md:aspect-video lg:aspect-square flex items-center justify-center group perspective-[1000px]">
            {/* Floating Dashboard Mockup (No Background Box) */}
            <div className="relative w-[90%] max-w-md bg-white/90 dark:bg-slate-900/90 backdrop-blur-2xl border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-2xl shadow-slate-200/50 dark:shadow-none transform -rotate-2 transition-all duration-700 group-hover:rotate-0 group-hover:scale-105 group-hover:shadow-3xl">
              {/* Mock Header */}
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center border border-blue-100 dark:border-blue-500/20">
                    <Activity
                      size={20}
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="w-28 h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full"></div>
                </div>
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                  <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-700"></div>
                </div>
              </div>

              {/* Mock Main Chart Area */}
              <div className="w-full bg-slate-50 dark:bg-slate-950/50 rounded-xl p-5 mb-5 border border-slate-100 dark:border-slate-800/50">
                <div className="w-24 h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full mb-3"></div>
                <div className="text-4xl font-black text-slate-800 dark:text-white mb-6 tracking-tight">
                  185.4{" "}
                  <span className="text-base text-slate-400 font-semibold">
                    kWh
                  </span>
                </div>

                {/* Animated Mock Bar Chart */}
                <div className="flex items-end justify-between h-24 gap-2 pt-2 border-b border-slate-200 dark:border-slate-800">
                  {[40, 65, 45, 80, 55, 95, 70].map((height, i) => (
                    <div
                      key={i}
                      className={`w-full rounded-t-sm transition-all duration-1000 ${i === 5 ? "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)] dark:shadow-[0_0_15px_rgba(59,130,246,0.2)]" : "bg-slate-200 dark:bg-slate-800 group-hover:bg-slate-300 dark:group-hover:bg-slate-700"}`}
                      style={{ height: `${height}%` }}
                    ></div>
                  ))}
                </div>
              </div>

              {/* Mock Bottom Cards */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-indigo-50/50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-500/20 rounded-xl p-4 flex flex-col justify-between">
                  <div className="w-16 h-2 bg-indigo-200 dark:bg-indigo-400/30 rounded-full mb-3"></div>
                  <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-300">
                    ₦39,000
                  </div>
                </div>
                <div className="bg-emerald-50/50 dark:bg-emerald-900/10 border border-emerald-100 dark:border-emerald-500/20 rounded-xl p-4 flex flex-col justify-between">
                  <div className="w-16 h-2 bg-emerald-200 dark:bg-emerald-400/30 rounded-full mb-3"></div>
                  <div className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                    -0.69%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. THE BENTO BOX FEATURES GRID */}
        <section className="w-full max-w-7xl mx-auto px-6">
          <div className="mb-12 text-center md:text-left">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
              Engineered for fairness.
            </h2>
            <p className="text-lg text-slate-500 dark:text-slate-400 max-w-2xl mx-auto md:mx-0">
              Traditional boards hide your data. We bring it to the surface with
              sub-circuit precision and automated financial logic.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 auto-rows-[280px] gap-6">
            {/* Large Card: Spans 2 Columns */}
            <div className="md:col-span-2 lg:col-span-2 row-span-1 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col justify-between overflow-hidden relative group">
              <div className="z-10 relative">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl flex items-center justify-center mb-4">
                  <Calculator size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  Predictive WMA Billing
                </h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-md">
                  Our integrated 3-Month Weighted Moving Average algorithm
                  accurately forecasts upcoming energy costs, automatically
                  deducting from digital wallets before budgets dry up.
                </p>
              </div>
              <div className="absolute -bottom-10 -right-10 opacity-5 dark:opacity-10 group-hover:scale-110 transition-transform duration-700">
                <Calculator size={200} />
              </div>
            </div>

            {/* Standard Card */}
            <div className="md:col-span-1 lg:col-span-1 row-span-1 rounded-3xl bg-slate-900 dark:bg-slate-800 border border-slate-800 dark:border-slate-700 p-8 shadow-sm text-white flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-slate-800 dark:bg-slate-700 text-white rounded-xl flex items-center justify-center mb-4">
                  <ShieldAlert size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">Thermal Isolation</h3>
                <p className="text-slate-400 text-sm">
                  Strict 2500W limits and automated 50°C cutoffs prevent
                  overloads from ever becoming a fire hazard.
                </p>
              </div>
            </div>

            {/* Standard Card */}
            <div className="md:col-span-1 lg:col-span-1 row-span-1 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 rounded-xl flex items-center justify-center mb-4">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold mb-2">
                  Sub-Circuit Precision
                </h3>
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Stop splitting the bill evenly. Track exact wattage drawn from
                  every individual outlet.
                </p>
              </div>
            </div>

            {/* Large Card: Removed Gradient for Cleaner Look */}
            <div className="md:col-span-2 lg:col-span-2 row-span-1 rounded-3xl bg-slate-100 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 p-8 shadow-sm flex items-center justify-between">
              <div className="max-w-md">
                <div className="w-12 h-12 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-center mb-4">
                  <Cpu size={24} />
                </div>
                <h3 className="text-2xl font-bold mb-2">
                  Dual-MCU Architecture
                </h3>
                <p className="text-slate-500 dark:text-slate-400">
                  Powered by the ATmega328P for high-fidelity analog sensing via
                  the ADS1115, seamlessly paired with the ESP32 for robust
                  Firebase cloud synchronization.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* 5. FOOTER */}
      <footer className="py-10 text-center border-t border-slate-200 dark:border-slate-800">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          © {new Date().getFullYear()} EnerGenius. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
