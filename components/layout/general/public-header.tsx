import { Zap } from "lucide-react";
import Link from "next/link";

export default function PublicHeader() {
  return (
    <nav className="w-full px-6 py-4 flex justify-between items-center z-50 bg-white/50 dark:bg-black/50 backdrop-blur-md border-b border-gray-200 dark:border-white/10 sticky top-0">
      <div className="flex items-center gap-2 text-primary font-bold text-xl">
        <Link href="/" className="flex items-center gap-2">
          <div className="p-2 bg-primary text-white rounded-lg">
            <Zap size={20} fill="currentColor" />
          </div>
          SmartDB
        </Link>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/login"
          className="text-sm font-semibold hover:text-primary transition"
        >
          Log In
        </Link>
        <Link href="/signup">
          <button className="bg-primary text-white px-5 py-2 rounded-full text-sm font-bold hover:bg-blue-700 transition">
            Get Started
          </button>
        </Link>
      </div>
    </nav>
  );
}
