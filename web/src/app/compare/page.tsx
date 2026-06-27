"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Scale, Trash2, CheckCircle2, XCircle, User, BookOpen, Calendar } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import coursesData from "@/data/courses.json";
import rawProfessors from "@/data/professors.json";
import { ProfessorData } from "@/components/ProfessorCard";

const professorsData = rawProfessors as ProfessorData[];

export default function ComparePage() {
  const { compareIds: courseIds, clearCompare: clearCourses, toggleCompare: toggleCourse } = useCompare("courses");
  const { compareIds: profIds, clearCompare: clearProfs, toggleCompare: toggleProf } = useCompare("professors");
  const [searchType, setSearchType] = useState<"courses" | "professors">("courses");

  const courses = useMemo(() => {
    return coursesData.filter(c => courseIds.includes(c.id));
  }, [courseIds]);

  const professors = useMemo(() => {
    return professorsData.filter(p => profIds.includes(p.id));
  }, [profIds]);

  const currentItems = searchType === "courses" ? courses : professors;
  const handleClear = searchType === "courses" ? clearCourses : clearProfs;

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <Link href="/browse" className="inline-flex items-center text-white hover:text-[var(--color-brand-primary)] transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Search
          </Link>
        </div>
        
        {currentItems.length > 0 && (
          <button 
            onClick={handleClear}
            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-full flex items-center gap-2 transition-all"
          >
            <Trash2 size={18} />
            Clear Comparison
          </button>
        )}
      </div>

      <div className="flex flex-col items-center mb-10">
        <h1 className="text-3xl font-bold text-white mb-6 flex items-center gap-3">
          <Scale className="text-[var(--color-brand-primary)]" />
          Compare {searchType === "courses" ? "Courses" : "Professors"}
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
            Courses ({courses.length})
          </button>
          <button
            onClick={() => setSearchType("professors")}
            className={`px-6 py-2 rounded-full text-sm font-semibold transition-all ${
              searchType === "professors"
                ? "bg-[var(--color-brand-primary)] text-black shadow-lg"
                : "text-neutral-500 hover:text-neutral-300"
            }`}
          >
            Professors ({professors.length})
          </button>
        </div>
      </div>

      {currentItems.length === 0 ? (
        <div className="glass-panel p-16 text-center border-dashed border-2 border-white/10 rounded-2xl">
          <Scale size={64} className="mx-auto text-neutral-600 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">No {searchType} selected</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">
            Go back to the search and click the scale icon on any {searchType === "courses" ? "course" : "professor"} card to add it to your comparison tool.
          </p>
          <Link href={`/browse?type=${searchType}`} className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-brand-primary)] hover:bg-[#c28e00] text-[#050a14] font-semibold rounded-full transition-colors">
            Browse {searchType === "courses" ? "Courses" : "Professors"}
          </Link>
        </div>
      ) : searchType === "courses" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {courses.map(course => (
            <div key={course.id} className="glass-panel flex flex-col relative group">
              <button 
                onClick={() => toggleCourse(course.id)}
                className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-full transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 z-10"
                title="Remove from comparison"
              >
                <XCircle size={20} />
              </button>
              
              <div className="p-6 border-b border-white/10 bg-white/5 rounded-t-2xl">
                <div className="text-indigo-400 font-bold mb-2">{course.code}</div>
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{course.longName || course.name}</h2>
                <div className="text-sm text-neutral-400">{course.school?.name} • {course.level}</div>
              </div>
              
              <div className="p-6 border-b border-white/5 flex-grow">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Description</h3>
                <p className="text-sm text-neutral-300 leading-relaxed line-clamp-6 hover:line-clamp-none transition-all">{course.description || "N/A"}</p>
              </div>

              <div className="p-6 border-b border-white/5">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Credits & Component</h3>
                <div className="text-lg font-medium text-white">{course.credits?.units || 1} Units</div>
                <div className="text-sm text-neutral-400 mt-1">{course.component?.type || "Seminar"}</div>
              </div>

              <div className="p-6 border-b border-white/5 bg-white/[0.02]">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Final Exam</h3>
                <div className="flex items-center gap-2 text-lg font-medium">
                  {course.component?.hasFinalExam ? (
                    <><CheckCircle2 className="text-red-400" /> <span className="text-red-100">Yes</span></>
                  ) : (
                    <><XCircle className="text-emerald-400" /> <span className="text-emerald-100">No</span></>
                  )}
                </div>
              </div>

              <div className="p-6 border-b border-white/5">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Prerequisites</h3>
                {course.requisites?.prerequisites?.length > 0 ? (
                  <ul className="list-disc pl-4 space-y-1">
                    {course.requisites.prerequisites.map((req: { name: string }, i: number) => (
                      <li key={i} className="text-sm text-amber-200/80">{req.name}</li>
                    ))}
                  </ul>
                ) : (
                  <span className="text-sm text-neutral-500 italic">None</span>
                )}
              </div>

              <div className="p-6 bg-white/[0.02] rounded-b-2xl">
                <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Areas / Tracks</h3>
                <div className="flex flex-wrap gap-2">
                  {course.areas?.map((a: string, i: number) => (
                    <span key={`a-${i}`} className="text-xs px-2 py-1 bg-blue-500/10 text-blue-300 rounded border border-blue-500/20">{a}</span>
                  ))}
                  {course.tracks?.map((t: string, i: number) => (
                    <span key={`t-${i}`} className="text-xs px-2 py-1 bg-emerald-500/10 text-emerald-300 rounded border border-emerald-500/20">{t}</span>
                  ))}
                  {(!course.areas?.length && !course.tracks?.length) && <span className="text-sm text-neutral-500 italic">None</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {professors.map(prof => {
            const terms = Object.keys(prof.history).sort((a, b) => b.localeCompare(a));
            let totalCourses = 0;
            terms.forEach(term => totalCourses += prof.history[term].courses.length);
            
            return (
              <div key={prof.id} className="glass-panel flex flex-col relative group">
                <button 
                  onClick={() => toggleProf(prof.id)}
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-full transition-colors opacity-100 md:opacity-0 group-hover:opacity-100 z-10"
                  title="Remove from comparison"
                >
                  <XCircle size={20} />
                </button>
                
                <div className="p-8 border-b border-white/10 bg-white/5 rounded-t-2xl text-center">
                  <div className="p-4 rounded-full bg-white/5 text-[var(--color-brand-primary)] border border-white/10 inline-flex mb-4">
                    <User size={32} />
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{prof.name}</h2>
                  <Link href={`/professors/${prof.id}`} className="text-xs text-[var(--color-brand-primary)] hover:underline">View Full Profile</Link>
                </div>
                
                <div className="p-6 border-b border-white/5">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Teaching Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><BookOpen size={16} className="text-[var(--color-brand-primary)]"/>{totalCourses}</div>
                      <div className="text-xs text-neutral-400">Total Courses</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-white mb-1 flex items-center gap-2"><Calendar size={16} className="text-[var(--color-brand-primary)]"/>{terms.length}</div>
                      <div className="text-xs text-neutral-400">Active Semesters</div>
                    </div>
                  </div>
                </div>

                <div className="p-6 border-b border-white/5">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Schools</h3>
                  <div className="flex flex-wrap gap-2">
                    {prof.schools?.map((s, i) => (
                      <span key={`s-${i}`} className="text-xs px-2 py-1 bg-white/5 text-neutral-300 rounded border border-white/10">{s}</span>
                    )) || <span className="text-sm text-neutral-500 italic">Unknown</span>}
                  </div>
                </div>

                <div className="p-6 bg-white/[0.02] rounded-b-2xl flex-grow">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">All Semesters</h3>
                  <ul className="space-y-3">
                    {terms.map((termKey) => (
                      <li key={termKey} className="text-sm">
                        <div className="font-semibold text-white mb-1">{prof.history[termKey].termName}</div>
                        <div className="text-neutral-400 text-xs">
                          {prof.history[termKey].courses.map(c => c.courseCode).join(', ')}
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
