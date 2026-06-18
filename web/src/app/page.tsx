"use client";

import { useState } from "react";
import { Search, BookOpen, GraduationCap, Clock, Award } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Home() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div className="py-16">
      <div className="container mx-auto px-4 text-center max-w-[800px]">
        <div className="animate-fade-in">
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-6 bg-gradient-to-r from-[var(--color-brand-primary)] to-white bg-clip-text text-transparent">
            The course catalog SMU deserves.
          </h1>

          <form onSubmit={handleSearch} className="relative max-w-[600px] mx-auto mb-16">
            <div className="absolute top-1/2 -translate-y-1/2 left-5 text-neutral-500 z-10 pointer-events-none">
              <Search size={20} />
            </div>
            <input 
              type="text" 
              className="w-full bg-white/5 border border-white/10 text-white rounded-full h-16 pl-14 pr-32 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/50 transition-all placeholder:text-neutral-500"
              placeholder="Search by course code, name, or area (e.g., ACCT101, Marketing)" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <button type="submit" className="absolute top-2 right-2 bottom-2 bg-[var(--color-brand-primary)] hover:bg-[#c28e00] text-[#050a14] rounded-full px-6 transition-colors font-semibold">
              Search
            </button>
          </form>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            {[
              { icon: BookOpen, title: "4,700+ Syllabi", desc: "Access historical section-level PDFs", color: "#0ea5e9" },
              { icon: GraduationCap, title: "Requirement Tracking", desc: "Filter by AREA and TRCK easily", color: "#4f46e5" },
              { icon: Award, title: "Exam Weightages", desc: "Know exactly what you're bidding for", color: "#f59e0b" },
              { icon: Clock, title: "Historical Data", desc: "See exactly when a course is usually offered", color: "#10b981" }
            ].map((feature, i) => (
              <div key={i} className="glass-panel p-6 transition-transform hover:-translate-y-1 duration-200">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center mb-4" style={{ color: feature.color }}>
                  <feature.icon size={20} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-neutral-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
