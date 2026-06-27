"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Fuse from "fuse.js";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import SearchFilter, { FilterState } from "@/components/SearchFilter";
import CourseCard, { CourseData } from "@/components/CourseCard";
import rawCourses from "@/data/courses.json";
import rawProfessors from "@/data/professors.json";
import ProfessorCard, { ProfessorData } from "@/components/ProfessorCard";

const coursesData = rawCourses as CourseData[];
const professorsData = rawProfessors as ProfessorData[];

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

// Create Fuse instances outside component so they aren't recreated
const courseFuse = new Fuse(coursesData, {
  keys: [
    { name: "code", weight: 3 },
    { name: "name", weight: 2 },
    { name: "longName", weight: 2 },
    { name: "subjectCode", weight: 1 },
    { name: "description", weight: 0.5 },
  ],
  threshold: 0.4, // Increased threshold for more fuzzy/forgiving search
  ignoreLocation: true,
});

const professorFuse = new Fuse(professorsData, {
  keys: [
    { name: "name", weight: 3 },
    { name: "id", weight: 1 }
  ],
  threshold: 0.4,
  ignoreLocation: true,
});

function CoursesSearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [filters, setFilters] = useState<FilterState>({
    query: searchParams.get("q") || "",
    searchType: (searchParams.get("type") as "courses" | "professors") || "courses",
    school: searchParams.get("school") || "",
    level: searchParams.get("level") || "",
    area: searchParams.get("area") || "",
    track: searchParams.get("track") || "",
  });

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (filters.query) params.set("q", filters.query);
    if (filters.searchType === "professors") params.set("type", "professors");
    if (filters.school) params.set("school", filters.school);
    if (filters.level) params.set("level", filters.level);
    if (filters.area) params.set("area", filters.area);
    if (filters.track) params.set("track", filters.track);
    
    // Use replace to avoid filling up browser history with every keystroke
    router.replace(`/courses?${params.toString()}`);
  }, [filters, router]);

  // Compute filtered courses
  const filteredCourses = useMemo(() => {
    if (filters.searchType !== "courses") return [];
    
    let result = coursesData;

    if (filters.query.trim()) {
      const queryLower = filters.query.trim().toLowerCase();
      const exactMatch = coursesData.find(c => c.code.toLowerCase() === queryLower);
      
      if (exactMatch) {
        result = [exactMatch];
      } else {
        result = courseFuse.search(filters.query).map((res) => res.item);
      }
    }

    result = result.filter((course) => {
      if (filters.school && course.school?.name !== filters.school) return false;
      if (filters.level && course.level !== filters.level) return false;
      if (filters.area && (!course.areas || !course.areas.includes(filters.area))) return false;
      if (filters.track && (!course.tracks || !course.tracks.includes(filters.track))) return false;
      return true;
    });

    return result;
  }, [filters]);

  // Compute filtered professors
  const filteredProfessors = useMemo(() => {
    if (filters.searchType !== "professors") return [];
    
    let result = professorsData;

    if (filters.query.trim()) {
      result = professorFuse.search(filters.query).map((res) => res.item);
    }

    return result;
  }, [filters]);

  const [page, setPage] = useState(1);
  const itemsPerPage = 20;
  
  const currentResults = filters.searchType === "courses" ? filteredCourses : filteredProfessors;
  const totalPages = Math.ceil(currentResults.length / itemsPerPage);
  
  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setPage(1);
  };

  const displayedResults = currentResults.slice(0, page * itemsPerPage);

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
          onFilterChange={handleFilterChange}
          availableSchools={availableSchools}
          availableLevels={availableLevels}
          availableAreas={availableAreas}
          availableTracks={availableTracks}
        />

        <div className="mb-6 flex justify-between items-end">
          <h2 className="text-xl font-semibold">
            {currentResults.length} {currentResults.length === 1 ? "Result" : "Results"}
          </h2>
        </div>

        {currentResults.length === 0 ? (
          <div className="glass-panel p-12 text-center">
            <p className="text-xl text-neutral-400 mb-2">No {filters.searchType} found matching your criteria.</p>
            <button 
              onClick={() => setFilters({ query: "", searchType: filters.searchType, school: "", level: "", area: "", track: "" })}
              className="text-[var(--color-brand-primary)] hover:opacity-80 font-medium transition-opacity"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filters.searchType === "courses" 
                ? (displayedResults as CourseData[]).map((course) => (
                    <CourseCard key={course.id} course={course} />
                  ))
                : (displayedResults as ProfessorData[]).map((prof) => (
                    <ProfessorCard key={prof.id} professor={prof} />
                  ))
              }
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
