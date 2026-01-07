import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PublicFooter() {
  return (
    <footer className="py-8 text-center border-t border-gray-200 dark:border-white/10">
      <Link
        href="/"
        className="text-sm text-gray-500 hover:text-primary flex items-center justify-center gap-2"
      >
        <ArrowLeft size={16} /> Back to Home
      </Link>
    </footer>
  );
}
