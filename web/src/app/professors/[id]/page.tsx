import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, BookOpen, Calendar, User, ExternalLink, Mail, Phone, FileText, Globe, Building2, GraduationCap } from 'lucide-react';
import { ProfessorData } from '@/components/ProfessorCard';
import FloatingActions from '@/components/FloatingActions';
import BackButton from '@/components/BackButton';
import facultyPhotosData from '@/data/faculty_extra.json';

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

  // Safely get extra data
  const extraData = facultyPhotosData as Record<string, { 
    photoUrl?: string | null, 
    title?: string | null, 
    profileUrl?: string | null, 
    researchAreas?: string[],
    qualifications?: string[],
    coursesTaught?: string[],
    email?: string | null,
    phone?: string | null,
    cvUrl?: string | null,
    scholarUrl?: string | null,
    scopusUrl?: string | null
  } | null>;
  
  const profExtra = extraData[professor.id] || {};
  const { 
    photoUrl, title, profileUrl, 
    researchAreas = [], qualifications = [], coursesTaught = [], 
    email, phone, cvUrl, scholarUrl, scopusUrl 
  } = profExtra;

  // Filter out school names from research areas
  const knownSchoolsLong = [
    "School of Computing and Information Systems", 
    "Lee Kong Chian School of Business", 
    "Yong Pung How School of Law", 
    "School of Economics", 
    "School of Accountancy", 
    "School of Social Sciences", 
    "College of Integrative Studies"
  ];
  const cleanResearchAreas = researchAreas.filter(a => !knownSchoolsLong.includes(a));

  // Sort terms from newest to oldest
  const terms = Object.keys(professor.history).sort((a, b) => b.localeCompare(a));
  
  // Calculate total courses
  let totalCourses = 0;
  terms.forEach(term => {
    totalCourses += professor.history[term].courses.length;
  });

  return (
    <div className="min-h-screen py-12 relative overflow-hidden">
      <div className="container mx-auto px-4 max-w-6xl relative z-10">
        <div className="mb-8">
          <BackButton label="Back to Directory" />
        </div>
        
        <div className="glass-panel p-8 md:p-12 animate-fade-in relative overflow-hidden border-white/10">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--color-brand-primary)]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-6 relative z-10">
            <div className="flex items-center gap-6">
              {/* Photo */}
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden bg-white/5 border-2 border-white/10 flex items-center justify-center shadow-lg shrink-0">
                {photoUrl ? (
                  <img src={photoUrl} alt={professor.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={48} className="text-white/20" />
                )}
              </div>
              
              <div>
                {/* Name */}
                <h1 className="text-3xl md:text-5xl font-display font-bold text-white mb-2 leading-tight">
                  {professor.name}
                </h1>
                
                {title && (
                  <div className="space-y-1 mt-2">
                    {title.split(';').map((t, idx) => (
                      <p key={idx} className="text-[var(--color-brand-primary)] font-medium text-sm md:text-base">
                        {t.trim()}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="shrink-0 mt-4 md:mt-0">
              <FloatingActions id={professor.id} namespace="professors" />
            </div>
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-neutral-600 dark:text-neutral-400 mb-8 pb-8 border-b border-black/10 dark:border-white/10 relative z-10">
            {professor.schools?.map((school, idx) => (
              <div key={`school-${idx}`} className="flex items-center gap-2 bg-black/5 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                <Building2 size={16} className="text-blue-600 dark:text-indigo-400" />
                <span>{school}</span>
              </div>
            ))}
            {professor.levels?.map((level, idx) => (
              <div key={`level-${idx}`} className="flex items-center gap-2 bg-black/5 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
                <GraduationCap size={16} className="text-blue-500 dark:text-blue-400" />
                <span>{level}</span>
              </div>
            ))}
            <div className="flex items-center gap-2 bg-black/5 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
              <BookOpen size={16} className="text-[var(--color-brand-primary)]" />
              <span>{totalCourses} Classes Taught</span>
            </div>
            <div className="flex items-center gap-2 bg-black/5 dark:bg-black/20 px-3 py-1.5 rounded-lg border border-black/5 dark:border-white/5">
              <Calendar size={16} className="text-[var(--color-brand-primary)]" />
              <span>{terms.length} Semesters Active</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10 relative z-10">
            
            {/* Contact & Links */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-white">Contact & Profiles</h2>
              
              <div className="space-y-4">
                {email && (
                  <div className="flex items-center gap-3 text-sm text-neutral-300">
                    <Mail size={16} className="text-neutral-500 shrink-0" />
                    <a href={`mailto:${email}`} className="hover:text-white transition-colors break-all">{email}</a>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-3 text-sm text-neutral-300">
                    <Phone size={16} className="text-neutral-500 shrink-0" />
                    <a href={`tel:${phone.replace(/\s/g, '')}`} className="hover:text-white transition-colors">{phone}</a>
                  </div>
                )}
              </div>

              {(cvUrl || profileUrl || scholarUrl || scopusUrl) && (
                <div className="space-y-3">
                  {cvUrl && (
                    <a href={cvUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-neutral-300 hover:text-white transition-colors">
                      <FileText size={16} className="text-[var(--color-brand-primary)] shrink-0" />
                      <span className="font-medium">Curriculum Vitae (CV)</span>
                    </a>
                  )}
                  {profileUrl && (
                    <a href={profileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-neutral-300 hover:text-white transition-colors">
                      <Globe size={16} className="text-[var(--color-brand-primary)] shrink-0" />
                      <span className="font-medium">SMU Profile Page</span>
                    </a>
                  )}
                  {scholarUrl && (
                    <a href={scholarUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-neutral-300 hover:text-white transition-colors">
                      <BookOpen size={16} className="text-[var(--color-brand-primary)] shrink-0" />
                      <span className="font-medium">Google Scholar</span>
                    </a>
                  )}
                  {scopusUrl && (
                    <a href={scopusUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-neutral-300 hover:text-white transition-colors">
                      <ExternalLink size={16} className="text-[var(--color-brand-primary)] shrink-0" />
                      <span className="font-medium">Scopus Profile</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Qualifications */}
            {qualifications && qualifications.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Qualifications</h2>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300 text-sm">
                  {qualifications.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Research Interests */}
            {cleanResearchAreas && cleanResearchAreas.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Research Interests</h2>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300 text-sm">
                  {cleanResearchAreas.map((area, idx) => (
                    <li key={idx}>{area}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {/* Courses Taught Overview */}
            {coursesTaught && coursesTaught.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-white mb-4">Courses Taught</h2>
                <ul className="list-disc pl-5 space-y-2 text-neutral-300 text-sm">
                  {coursesTaught.map((course, idx) => (
                    <li key={idx}>{course}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 my-10 relative z-10"></div>

          {/* Historical Timeline */}
          {terms.length > 0 && (
            <div className="relative z-10">
              <h2 className="text-xl font-bold text-white mb-8 flex items-center gap-3">
                <Calendar className="text-[var(--color-brand-primary)]" />
                Teaching History
              </h2>
              
              <div className="relative border-l border-white/10 ml-3 space-y-12 pb-4">
                {terms.map((termKey) => {
                    const termData = professor.history[termKey];
                    return (
                      <div key={termKey} className="relative pl-8">
                        {/* Timeline Dot */}
                        <div className="absolute -left-[5px] top-1.5 w-[9px] h-[9px] rounded-full bg-[var(--color-brand-primary)] shadow-[0_0_10px_var(--color-brand-primary)]"></div>
                        
                        <h3 className="text-xl font-bold text-white mb-4">
                          {termData.termName}
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                          {termData.courses.map((course, idx) => (
                            <Link 
                              key={idx} 
                              href={`/courses/${course.courseCode}`}
                              className="bg-white/5 p-5 rounded-xl hover:bg-white/10 transition-colors group flex flex-col h-full border border-white/5 hover:border-white/10"
                            >
                              <div className="flex flex-col items-start gap-1 mb-2">
                                <span className="text-sm font-semibold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-2 py-0.5 rounded">
                                  {course.courseCode}
                                </span>
                                {course.sections && course.sections.length > 0 && (
                                  <span className="text-xs text-neutral-500 font-mono mt-0.5">
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
              )}

        </div>
      </div>
    </div>
  );
}
