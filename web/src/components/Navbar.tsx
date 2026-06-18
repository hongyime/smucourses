"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 py-4 border-b border-white/10 bg-[#050a14]/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 max-w-7xl flex flex-wrap justify-between items-center gap-y-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/icon.svg" alt="SMU Courses Logo" className="w-8 h-8" />
          <span className="font-display font-bold text-xl tracking-tight text-white">
            smu<span className="text-neutral-400 font-normal">courses</span>
          </span>
        </Link>
        <div className="flex gap-4 md:gap-6 items-center flex-wrap">
          <Link 
            href="/courses" 
            className={`text-sm font-medium transition-colors hover:text-[var(--color-brand-primary)] ${
              pathname.startsWith("/courses") ? "text-[var(--color-brand-primary)]" : "text-neutral-300"
            }`}
          >
            Browse
          </Link>
          <Link 
            href="/bookmarks" 
            className={`text-sm font-medium transition-colors hover:text-[var(--color-brand-primary)] ${
              pathname.startsWith("/bookmarks") ? "text-[var(--color-brand-primary)]" : "text-neutral-300"
            }`}
          >
            Bookmarks
          </Link>
          <Link 
            href="/compare" 
            className={`text-sm font-medium transition-colors hover:text-[var(--color-brand-primary)] ${
              pathname.startsWith("/compare") ? "text-[var(--color-brand-primary)]" : "text-neutral-300"
            }`}
          >
            Compare
          </Link>
        </div>
      </div>
    </nav>
  );
}
