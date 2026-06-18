"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Scale, Trash2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useCompare } from "@/hooks/useCompare";
import coursesData from "@/data/courses.json";

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
          <Link href="/courses" className="inline-flex items-center text-white hover:text-[var(--color-brand-primary)] transition-colors">
            <ArrowLeft size={16} className="mr-2" />
            Back to Search
          </Link>
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
          <Link href="/courses" className="inline-flex items-center justify-center px-6 py-3 bg-[var(--color-brand-primary)] hover:bg-[#c28e00] text-[#050a14] font-semibold rounded-lg transition-colors">
            Browse Courses
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-8">
          {courses.map(course => (
            <div key={course.id} className="glass-panel flex flex-col relative group">
              <button 
                onClick={() => toggleCompare(course.id)}
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
                    {course.requisites.prerequisites.map((req: any, i: number) => (
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
      )}
    </div>
  );
}
