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
          <div className="glass-panel p-12 text-center mt-8">
            <p className="text-xl text-neutral-400 mb-4">You haven't bookmarked any courses yet.</p>
            <Link href="/courses" className="inline-flex px-6 py-3 rounded-full bg-[var(--color-brand-primary)] text-[#050a14] font-semibold hover:bg-[#c28e00] transition-colors">
              Explore Courses
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
