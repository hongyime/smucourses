"use client";

import { useState } from "react";
import { Search, BookOpen, GraduationCap, Clock, Award } from "lucide-react";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
  };

  return (
    <div className="py-16 overflow-hidden">
      <div className="container mx-auto px-4 text-center max-w-[800px]">
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          <motion.h1 
            variants={itemVariants}
            className="font-display text-5xl md:text-7xl font-bold leading-tight mb-6 bg-gradient-to-r from-[var(--color-brand-primary)] via-amber-400 to-[var(--color-brand-primary)] bg-clip-text text-transparent animate-gradient"
          >
            Discover your perfect courses.
          </motion.h1>

          <motion.form variants={itemVariants} onSubmit={handleSearch} className="relative max-w-[600px] mx-auto mb-20 group">
            <div className="absolute top-1/2 -translate-y-1/2 left-6 text-neutral-400 z-10 pointer-events-none group-focus-within:text-[var(--color-brand-primary)] transition-colors">
              <Search size={22} />
            </div>
            <input 
              type="text" 
              className="w-full bg-white/5 border border-white/10 text-white rounded-full h-16 pl-16 pr-36 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/50 transition-all placeholder:text-neutral-500 backdrop-blur-md shadow-2xl"
              placeholder="Search by code or area (e.g., ACCT101)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute top-2 right-2 bottom-2 bg-[var(--color-brand-primary)] hover:bg-[#c28e00] text-[#050a14] rounded-full px-8 transition-colors font-semibold">
              Search
            </button>
          </motion.form>

          <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { icon: BookOpen, title: "4,700+ Syllabi", desc: "Access historical section-level PDFs", color: "#0ea5e9" },
              { icon: GraduationCap, title: "Requirements", desc: "Filter by AREA and TRCK easily", color: "#4f46e5" },
              { icon: Award, title: "Weightages", desc: "Know exactly what you're bidding for", color: "#f59e0b" },
              { icon: Clock, title: "Historical Data", desc: "See when courses are usually offered", color: "#10b981" }
            ].map((feature, i) => (
              <motion.div key={i} variants={itemVariants} className="glass-panel p-6 hover:border-white/20 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4 border border-white/5 shadow-inner" style={{ color: feature.color }}>
                  <feature.icon size={20} />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">{feature.title}</h3>
                <p className="text-sm text-neutral-400">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
