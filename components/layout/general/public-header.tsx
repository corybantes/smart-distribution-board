import { Zap } from "lucide-react";
import Link from "next/link";

export default function PublicHeader() {
  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center z-50 fixed top-0 left-0 bg-white/70 dark:bg-slate-950/70 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 transition-colors duration-300">
      <Link href="/" className="flex items-center gap-3 group">
        <div className="relative flex items-center justify-center w-8 h-8 rounded-lg bg-linear-to-br from-blue-600 to-indigo-600 text-white shadow-sm group-hover:shadow-md transition-all duration-300 group-hover:scale-105">
          <Zap size={18} fill="currentColor" strokeWidth={1.5} />
        </div>
        <div className="flex flex-col justify-center">
          <span className="font-extrabold text-lg leading-none tracking-tight text-slate-900 dark:text-white">
            SmartDB
          </span>
          <span className="text-[9px] font-bold tracking-[0.2em] text-slate-500 dark:text-slate-400 uppercase mt-1">
            EnerGenius
          </span>
        </div>
      </Link>
      <div className="flex items-center gap-6">
        <Link
          href="/login"
          className="text-sm font-semibold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
        >
          Log In
        </Link>
        <Link href="/signup">
          <button className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition-all shadow-sm">
            Get Started
          </button>
        </Link>
      </div>
    </nav>
  );
}
