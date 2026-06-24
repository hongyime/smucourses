"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { motion } from "framer-motion";
import stats from "@/data/stats.json";

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [daysAgo, setDaysAgo] = useState<number>(0);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    const lastUpdatedDate = new Date(stats.lastUpdated);
    const diffTime = Math.abs(new Date().getTime() - lastUpdatedDate.getTime());
    setDaysAgo(Math.floor(diffTime / (1000 * 60 * 60 * 24)));
  }, []);

  const navLinks = [
    { name: "Browse", href: "/courses" },
    { name: "Compare", href: "/compare" },
    { name: "Bookmarks", href: "/bookmarks" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full flex flex-col">
      {/* Sync Status Banner */}
      {isClient && (
        <div className="w-full bg-[#111]/90 backdrop-blur-xl border-b border-white/5 py-1.5 px-4 text-center text-xs text-neutral-400">
          <span className="font-medium text-neutral-300">Data last synced:</span> {stats.lastUpdated}
          {daysAgo > 10 && (
            <span className="ml-2 text-amber-500 font-medium">
              ⚠️ The data is outdated. Please contact the administrator to run a manual sync.
            </span>
          )}
        </div>
      )}

      <nav className="py-4 border-b border-white/5 bg-[#0a0a0a]/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 max-w-7xl flex flex-wrap justify-between items-center gap-y-4">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon.svg" alt="SMU Courses Logo" className="w-8 h-8" />
            <span className="font-display font-bold text-xl tracking-tight text-white">
              smu<span className="text-neutral-500 font-normal">courses</span>
            </span>
          </Link>
          
          {/* Desktop Nav */}
          <div className="hidden md:flex gap-4 md:gap-6 items-center flex-wrap">
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href} 
                className={`text-sm font-medium transition-colors hover:text-[var(--color-brand-primary)] ${
                  pathname.startsWith(link.href) ? "text-[var(--color-brand-primary)]" : "text-neutral-400"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Mobile Nav Toggle */}
          <div className="flex md:hidden items-center gap-4">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-white"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-t border-white/10 bg-[#0a0a0a]/95 backdrop-blur-xl px-4 py-4 space-y-4 shadow-2xl absolute w-full left-0"
          >
            {navLinks.map((link) => (
              <Link 
                key={link.name}
                href={link.href} 
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-lg font-medium transition-colors hover:text-[var(--color-brand-primary)] ${
                  pathname.startsWith(link.href) ? "text-[var(--color-brand-primary)]" : "text-neutral-300"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </motion.div>
        )}
      </nav>
    </header>
  );
}
