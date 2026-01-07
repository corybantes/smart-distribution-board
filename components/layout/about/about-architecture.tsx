import { Activity, Cpu, Zap } from "lucide-react";

export default function AboutArchitecture() {
  return (
    <section className="bg-white/50 dark:bg-white/5 rounded-3xl p-8 md:p-12">
      <h2 className="text-2xl font-bold mb-8 text-center">How It Works</h2>
      <div className="flex flex-col md:flex-row items-center justify-between gap-8 text-center md:text-left">
        <div className="flex-1 space-y-2">
          <div className="mx-auto md:mx-0 w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center">
            <Cpu size={24} />
          </div>
          <h4 className="font-bold">1. The Hardware</h4>
          <p className="text-sm text-gray-500">
            ESP32 microcontrollers & sensors monitor voltage, current, and power
            factor in real-time, executing logic locally.
          </p>
        </div>

        <div className="hidden md:block text-gray-300">➜</div>

        <div className="flex-1 space-y-2">
          <div className="mx-auto md:mx-0 w-12 h-12 bg-green-100 text-green-600 rounded-full flex items-center justify-center">
            <Zap size={24} />
          </div>
          <h4 className="font-bold">2. The Cloud</h4>
          <p className="text-sm text-gray-500">
            Google Firebase acts as the real-time bridge, syncing commands,
            settings, and billing data instantly.
          </p>
        </div>

        <div className="hidden md:block text-gray-300">➜</div>

        <div className="flex-1 space-y-2">
          <div className="mx-auto md:mx-0 w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center">
            <Activity size={24} />
          </div>
          <h4 className="font-bold">3. The Dashboard</h4>
          <p className="text-sm text-gray-500">
            This Next.js Web App allows Admins to toggle modes, set priorities,
            and monitor every watt consumed.
          </p>
        </div>
      </div>
    </section>
  );
}
