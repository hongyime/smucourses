"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ChevronLeft, Bookmark } from "lucide-react";
import CourseCard, { CourseData } from "@/components/CourseCard";
import rawCourses from "@/data/courses.json";
import { useBookmarks } from "@/hooks/useBookmarks";

const coursesData = rawCourses as CourseData[];

export default function BookmarksPage() {
  const { bookmarks, isLoaded } = useBookmarks();

  const bookmarkedCourses = useMemo(() => {
    if (!isLoaded) return [];
    return coursesData.filter((c) => bookmarks.includes(c.id));
  }, [bookmarks, isLoaded]);

  if (!isLoaded) {
    return <div className="min-h-screen py-20 text-center text-neutral-400">Loading your bookmarks...</div>;
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <Link href="/courses" className="text-white hover:text-[var(--color-brand-primary)] transition-colors flex items-center gap-1 inline-flex">
            <ChevronLeft size={20} /> Back to Search
          </Link>
        </div>



        {bookmarkedCourses.length === 0 ? (
          <div className="glass-panel p-16 text-center border-dashed border-2 border-black/10 dark:border-white/10 rounded-2xl mt-8">
            <h2 className="text-2xl font-bold text-black dark:text-white mb-3">No courses bookmarked</h2>
            <p className="text-neutral-600 dark:text-neutral-400 mb-8 max-w-md mx-auto">
              Go back to the course search and click the bookmark icon on any course card to save it for later.
            </p>
            <Link href="/courses" className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-brand-primary)] hover:bg-[#c28e00] text-[#050a14] font-semibold rounded-full transition-colors">
              Browse Courses
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {bookmarkedCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
