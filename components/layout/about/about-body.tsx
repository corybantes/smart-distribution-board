import { Activity, Layers, ShieldCheck, Users } from "lucide-react";
import { GlassCard } from "../../ui/glass-card";

export default function AboutBody() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* MODE A: Multi-User */}
      <GlassCard className="p-8 border-t-4 border-t-blue-500 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-24 bg-blue-500/10 rounded-full blur-3xl -mr-12 -mt-12 transition group-hover:bg-blue-500/20"></div>
        <div className="w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
          <Users size={28} />
        </div>
        <h3 className="text-2xl font-bold mb-2">Mode 1: Multi-User</h3>
        <p className="text-sm font-semibold text-blue-600 mb-4 uppercase tracking-wide">
          For Co-Rentals & Apartments
        </p>
        <p className="text-gray-500 mb-6">
          Solves the "Who used the electricity?" conflict. The board splits
          power into distinct virtual meters for every room.
        </p>
        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex gap-2">
            <ShieldCheck size={18} className="text-green-500" /> Individual
            Billing & Wallets
          </li>
          <li className="flex gap-2">
            <ShieldCheck size={18} className="text-green-500" /> Auto-Cutoff
            when units finish
          </li>
          <li className="flex gap-2">
            <ShieldCheck size={18} className="text-green-500" /> Fair usage
            policy enforcement
          </li>
        </ul>
      </GlassCard>

      {/* MODE B: Single-User */}
      <GlassCard className="p-8 border-t-4 border-t-purple-500 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-24 bg-purple-500/10 rounded-full blur-3xl -mr-12 -mt-12 transition group-hover:bg-purple-500/20"></div>
        <div className="w-14 h-14 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center mb-6 relative z-10">
          <Layers size={28} />
        </div>
        <h3 className="text-2xl font-bold mb-2">Mode 2: Single-User</h3>
        <p className="text-sm font-semibold text-purple-600 mb-4 uppercase tracking-wide">
          For Smart Homes & Load Management
        </p>
        <p className="text-gray-500 mb-6">
          Prevents system overload using an intelligent{" "}
          <strong>Priority List</strong>. If you turn on a heavy appliance, less
          important ones turn off automatically.
        </p>
        <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          <li className="flex gap-2">
            <Activity size={18} className="text-purple-500" /> Priority-based
            Load Shedding
          </li>
          <li className="flex gap-2">
            <Activity size={18} className="text-purple-500" /> Overload
            Prevention Logic
          </li>
          <li className="flex gap-2">
            <Activity size={18} className="text-purple-500" /> Optional Billing
            Tracking
          </li>
        </ul>
      </GlassCard>
    </section>
  );
}
