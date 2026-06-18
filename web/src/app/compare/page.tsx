"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Scale, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import coursesData from "@/data/processed/courses.json";

export default function ComparePage() {
  const { compareIds, clearCompare, toggleCompare } = useCompare();
  const [courses, setCourses] = useState<any[]>([]);

  useEffect(() => {
    // Only filter courses that are in the compareIds list
    const selected = coursesData.filter(c => compareIds.includes(c.id));
    setCourses(selected);
  }, [compareIds]);

  return (
    <div className="container mx-auto px-4 py-12 max-w-7xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
        <div>
          <Link href="/courses" className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors mb-4">
            <ArrowLeft size={16} className="mr-2" />
            Back to Search
          </Link>
          <h1 className="text-4xl font-bold flex items-center gap-3">
            <Scale className="text-indigo-500" size={36} />
            Course Comparison
          </h1>
          <p className="text-neutral-400 mt-2 text-lg">
            Compare up to 3 courses side-by-side to make the perfect bidding decision.
          </p>
        </div>
        
        {courses.length > 0 && (
          <button 
            onClick={clearCompare}
            className="px-4 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg flex items-center gap-2 transition-all"
          >
            <Trash2 size={18} />
            Clear Comparison
          </button>
        )}
      </div>

      {courses.length === 0 ? (
        <div className="glass-panel p-16 text-center border-dashed border-2 border-white/10 rounded-2xl">
          <Scale size={64} className="mx-auto text-neutral-600 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">No courses selected</h2>
          <p className="text-neutral-400 mb-8 max-w-md mx-auto">
            Go back to the course search and click the scale icon on any course card to add it to your comparison tool.
          </p>
          <Link href="/courses" className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="overflow-x-auto pb-8">
          <div className="min-w-[800px] grid" style={{ gridTemplateColumns: `repeat(${courses.length}, minmax(300px, 1fr))` }}>
            
            {/* Header Row */}
            {courses.map(course => (
              <div key={course.id} className="p-6 glass-panel rounded-t-2xl border-b-0 m-1 relative group">
                <button 
                  onClick={() => toggleCompare(course.id)}
                  className="absolute top-4 right-4 p-2 bg-black/40 hover:bg-red-500/20 text-neutral-400 hover:text-red-400 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from comparison"
                >
                  <XCircle size={20} />
                </button>
                <div className="text-indigo-400 font-bold mb-2">{course.code}</div>
                <h2 className="text-2xl font-bold text-white mb-2 leading-tight">{course.longName || course.name}</h2>
                <div className="text-sm text-neutral-400">{course.school?.name} • {course.level}</div>
              </div>
            ))}

            {/* Metrics Rows */}
            <div className="col-span-full grid" style={{ gridTemplateColumns: `repeat(${courses.length}, 1fr)` }}>
              {courses.map(course => (
                <div key={`${course.id}-desc`} className="p-6 bg-white/5 border-t border-white/5 m-1 min-h-[150px]">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Description</h3>
                  <p className="text-sm text-neutral-300 leading-relaxed">{course.description || "N/A"}</p>
                </div>
              ))}
              
              {courses.map(course => (
                <div key={`${course.id}-credits`} className="p-6 bg-white/[0.02] border-t border-white/5 m-1">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Credits & Component</h3>
                  <div className="text-lg font-medium text-white">{course.credits?.units || 1} Units</div>
                  <div className="text-sm text-neutral-400 mt-1">{course.component?.type || "Seminar"}</div>
                </div>
              ))}

              {courses.map(course => (
                <div key={`${course.id}-exam`} className="p-6 bg-white/5 border-t border-white/5 m-1">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Final Exam</h3>
                  <div className="flex items-center gap-2 text-lg font-medium">
                    {course.component?.hasFinalExam ? (
                      <><CheckCircle2 className="text-red-400" /> <span className="text-red-100">Yes</span></>
                    ) : (
                      <><XCircle className="text-emerald-400" /> <span className="text-emerald-100">No</span></>
                    )}
                  </div>
                </div>
              ))}

              {courses.map(course => (
                <div key={`${course.id}-prereq`} className="p-6 bg-white/[0.02] border-t border-white/5 m-1">
                  <h3 className="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">Prerequisites</h3>
                  {course.requisites?.prerequisites?.length > 0 ? (
                    <ul className="list-disc pl-4 space-y-1">
                      {course.requisites.prerequisites.map((req: any, i: number) => (
                        <li key={i} className="text-sm text-amber-200/80">{req.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-sm text-neutral-500 italic">None</span>
                  )}
                </div>
              ))}

              {courses.map(course => (
                <div key={`${course.id}-areas`} className="p-6 bg-white/5 border-t border-white/5 rounded-b-2xl m-1">
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
              ))}
            </div>
            
          </div>
        </div>
      )}
    </div>
  );
}
