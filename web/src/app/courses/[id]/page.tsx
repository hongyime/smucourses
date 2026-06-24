import Link from "next/link";
import { ChevronLeft, Building2, GraduationCap, FileText, CheckCircle2 } from "lucide-react";
import rawCourses from "@/data/courses.json";
import { CourseData } from "@/components/CourseCard";
import CourseActions from "@/components/CourseActions";

// Help next.js pre-render (SSG) these paths
export async function generateStaticParams() {
  const courses = rawCourses as CourseData[];
  return courses.map((course) => ({
    id: course.id,
  }));
}

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courses = rawCourses as CourseData[];
  // Using loosely typed 'any' because courses.json has more fields than the minimal CourseData interface
  const course: any = courses.find((c) => c.id === id);

  if (!course) {
    return (
      <div className="min-h-screen py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Course Not Found</h1>
        <Link href="/courses" className="text-indigo-400 hover:underline">Return to Course Catalog</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <Link href="/courses" className="text-white hover:text-[var(--color-brand-primary)] transition-colors flex items-center gap-1 inline-flex">
            <ChevronLeft size={20} /> Back to Search
          </Link>
        </div>

        <div className="glass-panel p-8 md:p-12 animate-fade-in relative overflow-hidden">
          {/* Subtle glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-indigo-500/20 text-indigo-300 font-semibold rounded border border-indigo-500/30">
              {course.code}
            </span>
            {course.credits?.units && (
              <span className="px-3 py-1 bg-white/5 text-neutral-300 font-medium rounded border border-white/10">
                {course.credits.units} CU
              </span>
            )}
          </div>
          
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6">
            <h1 className="text-3xl md:text-5xl font-bold text-black dark:text-white leading-tight">
              {course.longName || course.name}
            </h1>
            <div className="shrink-0">
              <CourseActions courseId={course.id} />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-8 pb-8 border-b border-black/10 dark:border-white/10">
            {course.school?.name && (
              <div className="flex items-center gap-2 bg-black/5 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                <Building2 size={16} className="text-blue-600 dark:text-indigo-400" />
                <span>{course.school.name}</span>
              </div>
            )}
            {course.level && (
              <div className="flex items-center gap-2 bg-black/5 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                <GraduationCap size={16} className="text-blue-500 dark:text-blue-400" />
                <span>{course.level}</span>
              </div>
            )}
            {course.gradeMode && (
              <div className="flex items-center gap-2 bg-black/5 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                <span>{course.gradeMode}</span>
              </div>
            )}
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-black dark:text-white">Course Description</h2>
            <div className="prose prose-neutral dark:prose-invert max-w-none text-neutral-700 dark:text-neutral-300 leading-relaxed">
              {course.description ? (
                <p>{course.description}</p>
              ) : (
                <p className="italic text-neutral-500">No description available.</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            {course.areas && course.areas.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-black dark:text-white">Fulfills Areas</h3>
                <ul className="space-y-2">
                  {course.areas.map((area: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                      <span className="text-blue-600 dark:text-indigo-400 mt-1">•</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {course.tracks && course.tracks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-black dark:text-white">Fulfills Tracks</h3>
                <ul className="space-y-2">
                  {course.tracks.map((track: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-neutral-700 dark:text-neutral-300">
                      <span className="text-emerald-600 dark:text-emerald-400 mt-1">•</span>
                      {track}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="md:col-span-2 mt-4 pt-8 border-t border-black/10 dark:border-white/10">
              <h3 className="text-lg font-semibold mb-4 text-black dark:text-white flex items-center gap-2">
                Historical Syllabi
              </h3>
              
              {course.syllabi && course.syllabi.length > 0 ? (
                <ul className="space-y-6">
                  {course.syllabi.map((syllabus: { term: string; sections: any[] }, idx: number) => {
                    return (
                      <li key={idx} className="border border-black/5 dark:border-white/5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
                        <div className="bg-black/5 dark:bg-white/5 px-4 py-3 border-b border-black/5 dark:border-white/5 flex items-center gap-2">
                          <span className="font-semibold text-black dark:text-white">{syllabus.term}</span>
                        </div>
                        <ul className="divide-y divide-black/5 dark:divide-white/5">
                          {syllabus.sections.map((sec: any, sIdx: number) => (
                            <li key={sIdx} className="px-4 py-3 flex items-center justify-between hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors">
                              <span className="font-medium text-indigo-600 dark:text-indigo-400">Section {sec.section}</span>
                              {sec.pdfUrl ? (
                                <a 
                                  href={sec.pdfUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-sm bg-[var(--color-brand-primary)] hover:bg-[#c28e00] text-[#050a14] px-4 py-1.5 rounded-full transition-colors inline-flex items-center gap-2 font-semibold"
                                >
                                  <FileText size={14} /> View Syllabus
                                </a>
                              ) : (
                                <span className="text-sm text-neutral-500 italic bg-black/5 dark:bg-white/5 px-3 py-1 rounded-full">
                                  No Syllabus Available
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-6 text-center">
                  <FileText className="mx-auto h-8 w-8 text-neutral-400 mb-2 opacity-50" />
                  <p className="text-neutral-600 dark:text-neutral-400">
                    No historical syllabi available for this course yet.
                  </p>
                </div>
              )}
            </div>

            <div className="md:col-span-2 mt-4 pt-8 border-t border-black/10 dark:border-white/10">
              <h3 className="text-lg font-semibold mb-4 text-black dark:text-white flex items-center gap-2">
                Class Schedules
              </h3>
              
              {course.schedules && course.schedules.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left text-neutral-700 dark:text-neutral-300">
                    <thead className="text-xs uppercase bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400">
                      <tr>
                        <th className="px-4 py-3 rounded-tl-lg">Term</th>
                        <th className="px-4 py-3">Section</th>
                        <th className="px-4 py-3">Professor</th>
                        <th className="px-4 py-3">Timing</th>
                        <th className="px-4 py-3 rounded-tr-lg">Venue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {course.schedules.map((schedule: any, idx: number) => (
                        <tr key={idx} className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                          <td className="px-4 py-3 whitespace-nowrap">{schedule.term}</td>
                          <td className="px-4 py-3 font-medium text-indigo-600 dark:text-indigo-400">{schedule.section}</td>
                          <td className="px-4 py-3">{schedule.professor || "TBA"}</td>
                          <td className="px-4 py-3">{schedule.time || "TBA"}</td>
                          <td className="px-4 py-3">{schedule.location || "TBA"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-6 text-center mb-8">
                  <p className="text-neutral-600 dark:text-neutral-400">
                    No active class schedules found for the current or upcoming term.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
