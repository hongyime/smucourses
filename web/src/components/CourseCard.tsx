"use client";

import { useRouter } from "next/navigation";
import { GraduationCap, Building2, ChevronRight, Bookmark, Scale } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useCompare } from "@/hooks/useCompare";
import { motion } from "framer-motion";

export interface CourseData {
  id: string;
  code: string;
  name: string;
  longName: string;
  level: string;
  school: {
    id: string;
    name: string;
  };
  description: string;
  areas?: string[];
  tracks?: string[];
}

interface CourseCardProps {
  course: CourseData;
}

export default function CourseCard({ course }: CourseCardProps) {
  const router = useRouter();
  const { isBookmarked, toggleBookmark } = useBookmarks();
  const { compareIds, toggleCompare } = useCompare();
  const bookmarked = isBookmarked(course.id);
  const isComparing = compareIds.includes(course.id);

  const truncatedDesc = course.description 
    ? (course.description.length > 150 ? course.description.substring(0, 150) + "..." : course.description)
    : "No description available.";

  const handleCardClick = () => {
    router.push(`/courses/${course.id}`);
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
        
        <div className="flex justify-between items-start mb-3">
          <div className="inline-flex items-center px-2.5 py-1 rounded-md bg-[var(--color-brand-primary)]/10 text-[var(--color-brand-primary)] text-xs font-semibold border border-[var(--color-brand-primary)]/20 shadow-inner">
            {course.code}
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleCompare(course.id); }}
              className={`p-1.5 rounded-full transition-colors ${isComparing ? 'bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)]' : 'text-neutral-500 hover:text-white hover:bg-white/10'}`}
              title={isComparing ? "Remove from Compare" : "Add to Compare"}
            >
              <Scale size={18} />
            </button>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleBookmark(course.id); }}
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

        <h2 className="text-xl font-bold mb-2 text-white group-hover:text-[var(--color-brand-primary)] transition-colors line-clamp-2 leading-snug font-display">
          {course.longName || course.name}
        </h2>

        <div className="flex flex-wrap gap-3 text-xs text-neutral-400 mb-4">
          {course.school?.name && (
            <div className="flex items-center gap-1.5">
              <Building2 size={14} className="text-neutral-500" />
              <span>{course.school.name}</span>
            </div>
          )}
          {course.level && (
            <div className="flex items-center gap-1.5">
              <GraduationCap size={14} className="text-neutral-500" />
              <span>{course.level}</span>
            </div>
          )}
        </div>

        <p className="text-sm text-neutral-400 mb-6 line-clamp-3 leading-relaxed flex-grow">
          {truncatedDesc}
        </p>

        {(course.areas?.length || course.tracks?.length) ? (
          <div className="mt-auto pt-4 border-t border-white/10 space-y-2">
            {course.areas && course.areas.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.areas.slice(0, 2).map((area, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20">
                    {area}
                  </span>
                ))}
                {course.areas.length > 2 && (
                  <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-neutral-400">
                    +{course.areas.length - 2} more
                  </span>
                )}
              </div>
            )}
            {course.tracks && course.tracks.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {course.tracks.slice(0, 1).map((track, idx) => (
                  <span key={idx} className="text-[10px] px-2 py-1 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 truncate max-w-[200px]">
                    {track}
                  </span>
                ))}
                {course.tracks.length > 1 && (
                  <span className="text-[10px] px-2 py-1 rounded bg-white/5 text-neutral-400">
                    +{course.tracks.length - 1}
                  </span>
                )}
              </div>
            )}
          </div>
        ) : null}
      </div>
    </motion.div>
  );
}
