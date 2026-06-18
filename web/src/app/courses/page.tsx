"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Fuse from "fuse.js";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SearchFilter, { FilterState } from "@/components/SearchFilter";
import CourseCard, { CourseData } from "@/components/CourseCard";
import rawCourses from "@/data/courses.json";

const coursesData = rawCourses as CourseData[];

// Pre-compute options to avoid recomputing on every render
const availableSchools = Array.from(new Set(coursesData.map((c) => c.school?.name).filter(Boolean))).sort();
const availableLevels = Array.from(new Set(coursesData.map((c) => c.level).filter(Boolean))).sort();

const allAreas = new Set<string>();
const allTracks = new Set<string>();
coursesData.forEach((c) => {
  if (c.areas) c.areas.forEach((a) => allAreas.add(a));
  if (c.tracks) c.tracks.forEach((t) => allTracks.add(t));
});
const availableAreas = Array.from(allAreas).sort();
const availableTracks = Array.from(allTracks).sort();

// Create Fuse instance outside component so it's not recreated
const fuse = new Fuse(coursesData, {
  keys: [
    { name: "code", weight: 3 },
    { name: "name", weight: 2 },
    { name: "longName", weight: 2 },
    { name: "subjectCode", weight: 1 },
    { name: "description", weight: 0.5 },
  ],
  threshold: 0.3,
  ignoreLocation: true,
});

function CoursesSearchContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get("q") || "";

  const [filters, setFilters] = useState<FilterState>({
    query: initialQuery,
    school: "",
    level: "",
    area: "",
    track: "",
  });

  // Update query if URL changes and we haven't synced
  useEffect(() => {
    if (initialQuery && filters.query === "") {
      setFilters((prev) => ({ ...prev, query: initialQuery }));
    }
  }, [initialQuery]);

  const filteredCourses = useMemo(() => {
    let result = coursesData;

    // Search
    if (filters.query.trim()) {
      const queryLower = filters.query.trim().toLowerCase();
      // Check for exact course code match first
      const exactMatch = coursesData.find(c => c.code.toLowerCase() === queryLower);
      
      if (exactMatch) {
        result = [exactMatch];
      } else {
        result = fuse.search(filters.query).map((res) => res.item);
      }
    }

    // Filter
    result = result.filter((course) => {
      if (filters.school && course.school?.name !== filters.school) return false;
      if (filters.level && course.level !== filters.level) return false;
      if (filters.area && (!course.areas || !course.areas.includes(filters.area))) return false;
      if (filters.track && (!course.tracks || !course.tracks.includes(filters.track))) return false;
      return true;
    });

    return result;
  }, [filters]);

  // Pagination for performance (rendering 5000 cards is bad)
  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredCourses.length / itemsPerPage);
  
  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [filters]);

  const displayedCourses = filteredCourses.slice(0, page * itemsPerPage);

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 flex items-center">
          <Link href="/" className="text-white hover:text-[var(--color-brand-primary)] transition-colors flex items-center gap-1">
            <ChevronLeft size={20} /> Back to Home
          </Link>
        </div>
        


        <SearchFilter
          filters={filters}
          onFilterChange={setFilters}
          availableSchools={availableSchools}
          availableLevels={availableLevels}
          availableAreas={availableAreas}
          availableTracks={availableTracks}
        />

        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-xl font-semibold">
            {filteredCourses.length} {filteredCourses.length === 1 ? "Result" : "Results"}
          </h2>
        </div>

        {filteredCourses.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <p className="text-xl text-neutral-400 mb-2">No courses found matching your criteria.</p>
            <button 
              onClick={() => setFilters({ query: "", school: "", level: "", area: "", track: "" })}
              className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {displayedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            
            {page < totalPages && (
              <div className="mt-12 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-6 py-3 rounded-full bg-[var(--color-brand-primary)] hover:bg-[#c28e00] text-[#050a14] font-semibold transition-colors inline-flex items-center gap-2"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default function CoursesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-neutral-400">Loading catalog...</div>}>
      <CoursesSearchContent />
    </Suspense>
  );
}
