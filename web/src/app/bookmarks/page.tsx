"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Bookmark } from "lucide-react";
import CourseCard, { CourseData } from "@/components/CourseCard";
import ProfessorCard, { ProfessorData } from "@/components/ProfessorCard";
import rawCourses from "@/data/courses.json";
import rawProfessors from "@/data/professors.json";
import { useBookmarks } from "@/hooks/useBookmarks";

const coursesData = rawCourses as CourseData[];
const professorsData = rawProfessors as ProfessorData[];

export default function BookmarksPage() {
  const { bookmarks: courseBookmarks, isLoaded: coursesLoaded } = useBookmarks("courses");
  const { bookmarks: profBookmarks, isLoaded: profsLoaded } = useBookmarks("professors");
  const [searchType, setSearchType] = useState<"courses" | "professors">("courses");

  const bookmarkedCourses = useMemo(() => {
    if (!coursesLoaded) return [];
    return coursesData.filter((c) => courseBookmarks.includes(c.id));
  }, [courseBookmarks, coursesLoaded]);

  const bookmarkedProfessors = useMemo(() => {
    if (!profsLoaded) return [];
    return professorsData.filter((p) => profBookmarks.includes(p.id));
  }, [profBookmarks, profsLoaded]);

  const isLoaded = coursesLoaded && profsLoaded;

  if (!isLoaded) {
    return <div className="min-h-screen py-20 text-center text-neutral-400">Loading your bookmarks...</div>;
  }

  const currentItems = searchType === "courses" ? bookmarkedCourses : bookmarkedProfessors;

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <Link href="/browse" className="text-white hover:text-[var(--color-brand-primary)] transition-colors flex items-center gap-1 inline-flex">
            <ChevronLeft size={20} /> Back to Search
          </Link>
        </div>

        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
            <Bookmark className="text-[var(--color-brand-primary)]" />
            Your Bookmarks
          </h1>
          
          <div className="bg-black/20 dark:bg-white/5 p-1 rounded-full inline-flex border border-black/10 dark:border-white/10">
            <button
              onClick={() => setSearchType("courses")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                searchType === "courses"
                  ? "bg-[var(--color-brand-primary)] text-black shadow-lg"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Courses ({bookmarkedCourses.length})
            </button>
            <button
              onClick={() => setSearchType("professors")}
              className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
                searchType === "professors"
                  ? "bg-[var(--color-brand-primary)] text-black shadow-lg"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              Professors ({bookmarkedProfessors.length})
            </button>
          </div>
        </div>

        {currentItems.length === 0 ? (
          <div className="glass-panel p-16 text-center border-dashed border-2 border-black/10 dark:border-white/10 rounded-2xl mt-8">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-3">No {searchType} bookmarked</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
              Go back to the search and click the bookmark icon on any {searchType === "courses" ? "course" : "professor"} card to save it for later.
            </p>
            <Link href={`/browse?type=${searchType}`} className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-brand-primary)] hover:bg-[#c28e00] text-[#050a14] font-semibold rounded-full transition-colors">
              Browse {searchType === "courses" ? "Courses" : "Professors"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {searchType === "courses" 
              ? bookmarkedCourses.map((course) => <CourseCard key={course.id} course={course} />)
              : bookmarkedProfessors.map((prof) => <ProfessorCard key={prof.id} professor={prof} />)
            }
          </div>
        )}
      </div>
    </div>
  );
}
