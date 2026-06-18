"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { Sun, Moon, Menu, X } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: "Browse", href: "/courses" },
    { name: "Bookmarks", href: "/bookmarks" },
    { name: "Compare", href: "/compare" },
  ];

  return (
    <nav className="sticky top-0 z-50 py-4 border-b border-black/10 dark:border-white/10 bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-xl">
      <div className="container mx-auto px-4 max-w-7xl flex flex-wrap justify-between items-center gap-y-4">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <img src="/icon.svg" alt="SMU Courses Logo" className="w-8 h-8 dark:invert-0 invert" />
          <span className="font-display font-bold text-xl tracking-tight text-black dark:text-white">
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
                pathname.startsWith(link.href) ? "text-[var(--color-brand-primary)]" : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {link.name}
            </Link>
          ))}
          
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            {theme === "dark" ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-700" />}
          </button>
        </div>

        {/* Mobile Nav Toggle */}
        <div className="flex md:hidden items-center gap-4">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="p-2 rounded-full bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
          >
            {theme === "dark" ? <Sun size={18} className="text-yellow-400" /> : <Moon size={18} className="text-slate-700" />}
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-black dark:text-white"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-black/10 dark:border-white/10 bg-white dark:bg-[#0a0a0a] px-4 py-4 space-y-4 shadow-lg absolute w-full left-0 animate-fade-in">
          {navLinks.map((link) => (
            <Link 
              key={link.name}
              href={link.href} 
              onClick={() => setMobileMenuOpen(false)}
              className={`block text-lg font-medium transition-colors hover:text-[var(--color-brand-primary)] ${
                pathname.startsWith(link.href) ? "text-[var(--color-brand-primary)]" : "text-neutral-600 dark:text-neutral-300"
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
