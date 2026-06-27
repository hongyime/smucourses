"use client";

import { useRouter } from "next/navigation";
import { User, BookOpen, ChevronRight, Bookmark, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useCompare } from "@/hooks/useCompare";

export interface ProfessorData {
  id: string;
  name: string;
  schools?: string[];
  levels?: string[];
  areas?: string[];
  tracks?: string[];
  history: Record<string, { termName: string; courses: { courseCode: string; courseName: string; sections: string[] }[] }>;
}

interface ProfessorCardProps {
  professor: ProfessorData;
}

export default function ProfessorCard({ professor }: ProfessorCardProps) {
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { compareIds, toggleCompare } = useCompare();
  
  const bookmarked = isBookmarked(professor.id);
  const isComparing = compareIds.includes(professor.id);

  // Calculate total courses taught
  let totalCourses = 0;
  const terms = Object.keys(professor.history);
  terms.forEach(term => {
    totalCourses += professor.history[term].courses.length;
  });

  const handleCardClick = () => {
    router.push(`/professors/${professor.id}`);
  };

  return (
    <motion.div 
      onClick={handleCardClick} 
      className="block group cursor-pointer h-full"
      whileHover={{ y: -6, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={{ scale: 0.98 }}
      layout
    >
      <div className="glass-panel p-6 h-full transition-colors duration-300 hover:border-[var(--color-brand-primary)]/40 hover:bg-white/10 relative overflow-hidden flex flex-col border-white/5 bg-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-brand-primary)]/20 rounded-full blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none duration-500"></div>
        
        <div className="flex justify-between items-start mb-4">
          <div className="p-3 rounded-xl bg-white/5 text-[var(--color-brand-primary)] border border-white/10">
            <User size={24} />
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(professor.id); }}
              className={`p-1.5 rounded-full transition-colors ${isComparing ? 'bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)]' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}
              title={isComparing ? "Remove from Compare" : "Add to Compare"}
            >
              <Scale size={18} />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(professor.id); }}
              className={`p-1.5 rounded-full transition-colors ${bookmarked ? 'bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)]' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}
              title={bookmarked ? "Remove Bookmark" : "Add Bookmark"}
            >
              <Bookmark size={18} className={bookmarked ? "fill-[var(--color-brand-primary)]" : ""} />
            </button>
            <div className="text-neutral-500 group-hover:text-white transition-colors pointer-events-none">
              <ChevronRight size={18} />
            </div>
          </div>
        </div>

        <h2 className="text-xl font-bold mb-3 text-white group-hover:text-[var(--color-brand-primary)] transition-colors leading-snug font-display">
          {professor.name}
        </h2>

        <div className="flex flex-wrap gap-3 text-sm text-neutral-400 mt-auto">
          <div className="flex items-center gap-1.5">
            <BookOpen size={16} className="text-neutral-500" />
            <span>{totalCourses} {totalCourses === 1 ? 'Class' : 'Classes'} Taught</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
