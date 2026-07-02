"use client";

import { Bookmark, Scale } from "lucide-react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useCompare } from "@/hooks/useCompare";

interface FloatingActionsProps {
  id: string;
  namespace?: "courses" | "professors";
}

export default function FloatingActions({ id, namespace = "courses" }: FloatingActionsProps) {
  const { isBookmarked, toggleBookmark } = useBookmarks(namespace);
  const { compareIds, toggleCompare } = useCompare(namespace);
  
  const bookmarked = isBookmarked(id);
  const isComparing = compareIds.includes(id);

  return (
    <div className="flex items-center gap-3">
      <button 
        onClick={() => toggleCompare(id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors border font-medium ${
          isComparing 
            ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/20 dark:hover:bg-indigo-500/30' 
            : 'bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        <Scale size={18} className={isComparing ? "text-indigo-600 dark:text-indigo-300" : ""} />
        {isComparing ? "Remove" : "Compare"}
      </button>
      
      <button 
        onClick={() => toggleBookmark(id)}
        className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors border font-medium ${
          bookmarked 
            ? 'bg-[var(--color-brand-primary)]/10 dark:bg-[var(--color-brand-primary)]/20 text-[#996e00] dark:text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/30 hover:bg-[var(--color-brand-primary)]/20 dark:hover:bg-[var(--color-brand-primary)]/30' 
            : 'bg-black/5 dark:bg-white/5 text-neutral-700 dark:text-neutral-300 border-black/10 dark:border-white/10 hover:bg-black/10 dark:hover:bg-white/10 hover:text-neutral-900 dark:hover:text-white'
        }`}
      >
        <Bookmark size={18} className={bookmarked ? "fill-[var(--color-brand-primary)] text-[#996e00] dark:text-[var(--color-brand-primary)]" : ""} />
        {bookmarked ? "Saved" : "Save"}
      </button>
    </div>
  );
}
