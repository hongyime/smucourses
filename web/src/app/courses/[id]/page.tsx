import Link from "next/link";
import { ChevronLeft, Building2, GraduationCap, FileText, CheckCircle2 } from "lucide-react";
import rawCourses from "@/data/courses.json";
import { CourseData } from "@/components/CourseCard";

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
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link href="/courses" className="text-neutral-400 hover:text-white transition-colors flex items-center gap-1 inline-flex">
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
          
          <h1 className="text-3xl md:text-5xl font-bold mb-6 text-white leading-tight">
            {course.longName || course.name}
          </h1>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-400 mb-8 pb-8 border-b border-white/10">
            {course.school?.name && (
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                <Building2 size={16} className="text-indigo-400" />
                <span>{course.school.name}</span>
              </div>
            )}
            {course.level && (
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                <GraduationCap size={16} className="text-blue-400" />
                <span>{course.level}</span>
              </div>
            )}
            {course.gradeMode && (
              <div className="flex items-center gap-2 bg-black/20 px-3 py-1.5 rounded-lg border border-white/5">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>{course.gradeMode}</span>
              </div>
            )}
          </div>

          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4 text-white">Course Description</h2>
            <div className="prose prose-invert max-w-none text-neutral-300 leading-relaxed">
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
                <h3 className="text-lg font-semibold mb-3 text-white">Fulfills Areas</h3>
                <ul className="space-y-2">
                  {course.areas.map((area: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-neutral-300">
                      <span className="text-indigo-400 mt-1">•</span>
                      {area}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {course.tracks && course.tracks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white">Fulfills Tracks</h3>
                <ul className="space-y-2">
                  {course.tracks.map((track: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-neutral-300">
                      <span className="text-emerald-400 mt-1">•</span>
                      {track}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {course.syllabi && course.syllabi.length > 0 && (
            <div className="bg-white/5 p-6 rounded-2xl border border-white/10">
              <h2 className="text-xl font-semibold mb-4 text-white flex items-center gap-2">
                <FileText size={20} className="text-indigo-400" /> Historical Syllabi
              </h2>
              <div className="space-y-3">
                {course.syllabi.map((syllabus: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-black/40 border border-white/5 hover:border-indigo-500/30 transition-colors">
                    <div>
                      <span className="font-medium text-white block sm:inline">{syllabus.term}</span>
                      <span className="text-neutral-500 text-sm sm:ml-3 block sm:inline">Sections: {syllabus.sections.map((s: any) => s.section).join(', ')}</span>
                    </div>
                    {course.documents?.url ? (
                      <a 
                        href={`/pdfs/${course.id}.pdf`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 sm:mt-0 text-sm bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg transition-colors inline-flex items-center gap-2"
                      >
                        <FileText size={16} /> View PDF
                      </a>
                    ) : (
                      <span className="mt-3 sm:mt-0 text-sm text-neutral-500 italic">No PDF Available</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
