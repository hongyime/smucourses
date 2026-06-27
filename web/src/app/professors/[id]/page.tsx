import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, BookOpen, Calendar } from 'lucide-react';
import { ProfessorData } from '@/components/ProfessorCard';

// Pre-render all professor pages
export async function generateStaticParams() {
  const filePath = path.join(process.cwd(), 'src/data/professors.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const professors: ProfessorData[] = JSON.parse(fileContents);
  
  return professors.map((prof) => ({
    id: prof.id,
  }));
}

export default async function ProfessorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const filePath = path.join(process.cwd(), 'src/data/professors.json');
  const fileContents = fs.readFileSync(filePath, 'utf8');
  const professors: ProfessorData[] = JSON.parse(fileContents);
  
  const professor = professors.find((p) => p.id === id);
  
  if (!professor) {
    notFound();
  }

  // Sort terms from newest to oldest
  const terms = Object.keys(professor.history).sort((a, b) => b.localeCompare(a));
  
  // Calculate total courses
  let totalCourses = 0;
  terms.forEach(term => {
    totalCourses += professor.history[term].courses.length;
  });

  return (
    <div className="min-h-screen py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <Link href="/courses?type=professors" className="text-white hover:text-[var(--color-brand-primary)] transition-colors flex items-center gap-1 inline-flex">
            <ChevronLeft size={20} /> Back to Directory
          </Link>
        </div>
        
        {/* Header Section */}
        <div className="glass-panel p-8 md:p-12 mb-10 border-white/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-brand-primary)]/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
          
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mb-4 relative z-10">
            {professor.name}
          </h1>
          
          <div className="flex flex-wrap gap-4 text-neutral-300 relative z-10">
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
              <BookOpen size={18} className="text-[var(--color-brand-primary)]" />
              <span className="font-medium">{totalCourses} Classes Taught</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
              <Calendar size={18} className="text-[var(--color-brand-primary)]" />
              <span className="font-medium">{terms.length} Semesters Active</span>
            </div>
          </div>
        </div>

        {/* Timeline Section */}
        <div className="space-y-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
            Teaching History
          </h2>
          
          <div className="relative border-l border-white/10 ml-3 space-y-12 pb-8">
            {terms.map((termKey) => {
              const termData = professor.history[termKey];
              return (
                <div key={termKey} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full bg-[var(--color-brand-primary)] shadow-[0_0_10px_var(--color-brand-primary)]"></div>
                  
                  <h3 className="text-xl font-bold text-white mb-4 inline-block px-4 py-1.5 rounded-md bg-white/5 border border-white/10">
                    {termData.termName}
                  </h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {termData.courses.map((course, idx) => (
                      <Link 
                        key={idx} 
                        href={`/courses/${course.courseCode}`}
                        className="glass-panel p-5 hover:bg-white/10 transition-colors group flex flex-col h-full border-white/5"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-sm font-semibold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-2 py-0.5 rounded">
                            {course.courseCode}
                          </span>
                          {course.sections && course.sections.length > 0 && (
                            <span className="text-xs text-neutral-500 font-mono">
                              Sec: {course.sections.join(', ')}
                            </span>
                          )}
                        </div>
                        <h4 className="text-lg font-semibold text-neutral-200 group-hover:text-white transition-colors leading-snug">
                          {course.courseName}
                        </h4>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        
      </div>
    </div>
  );
}
