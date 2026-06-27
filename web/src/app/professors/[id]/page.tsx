import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, BookOpen, Calendar, User, ExternalLink, Mail, Phone, FileText, Globe, Building2 } from 'lucide-react';
import { ProfessorData } from '@/components/ProfessorCard';
import FloatingActions from '@/components/FloatingActions';
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
        <div className="mb-8 flex justify-between items-center">
          <Link href="/browse?type=professors" className="text-white hover:text-[var(--color-brand-primary)] transition-colors flex items-center gap-1 inline-flex">
            <ChevronLeft size={20} /> Back to Directory
          </Link>
          <FloatingActions id={professor.id} namespace="professors" />
        </div>
        
        <div className="glass-panel p-8 md:p-12 animate-fade-in relative overflow-hidden border-white/10">
          {/* Background Glow */}
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-[var(--color-brand-primary)]/5 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 pointer-events-none"></div>

          <div className="flex flex-col lg:flex-row gap-12 items-start relative z-10">
            
            {/* LEFT SIDEBAR */}
            <div className="w-full lg:w-[320px] shrink-0 space-y-6 lg:sticky lg:top-24">
              
              {/* Photo */}
              <div className="w-full aspect-[4/3] sm:aspect-[3/4] rounded-xl overflow-hidden mb-6 bg-white/5 border border-white/10 flex items-center justify-center shadow-lg">
                {photoUrl ? (
                  <img src={photoUrl} alt={professor.name} className="w-full h-full object-cover" />
                ) : (
                  <User size={80} className="text-white/20" />
                )}
              </div>
              
              {/* Name & Title */}
              <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-2 leading-tight">
                {professor.name}
              </h1>
              {title && (
                <div className="mb-6 space-y-1">
                  {title.split(';').map((t, idx) => (
                    <p key={idx} className="text-[var(--color-brand-primary)] font-medium">
                      {t.trim()}
                    </p>
                  ))}
                </div>
              )}

              {/* Pills */}
              <div className="flex flex-wrap gap-3 mb-6">
                {professor.schools?.map((school, idx) => (
                  <div key={`school-${idx}`} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm font-medium">
                    <Building2 size={16} />
                    <span>{school}</span>
                  </div>
                ))}
                <span className="flex items-center px-3 py-1.5 bg-white/5 text-neutral-300 border border-white/10 rounded-lg text-sm font-medium">
                  Full-time Faculty
                </span>
              </div>

              <div className="border-t border-white/10 my-6"></div>

              {/* Contact Info */}
              <div className="space-y-4 mb-6">
                {email && (
                  <div className="flex items-center gap-3 text-sm text-neutral-300">
                    <Mail size={16} className="text-neutral-500 shrink-0" />
                    <a href={`mailto:${email}`} className="hover:text-white transition-colors break-all">{email}</a>
                  </div>
                )}
                {phone && (
                  <div className="flex items-center gap-3 text-sm text-neutral-300">
                    <Phone size={16} className="text-neutral-500 shrink-0" />
                    <span>{phone}</span>
                  </div>
                )}
              </div>

              {/* Links */}
              {(cvUrl || profileUrl) && (
                <>
                  <div className="border-t border-white/10 my-6"></div>
                  <div className="space-y-3 mb-6">
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
                  </div>
                </>
              )}

              {/* Social Icons */}
              {(scholarUrl || scopusUrl) && (
                <div className="flex gap-3 pt-2">
                  {scholarUrl && (
                    <a href={scholarUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition-colors text-neutral-400" title="Google Scholar">
                      <BookOpen size={18} />
                    </a>
                  )}
                  {scopusUrl && (
                    <a href={scopusUrl} target="_blank" rel="noopener noreferrer" className="p-2.5 bg-white/5 rounded-full border border-white/10 hover:bg-white/10 hover:text-white transition-colors text-neutral-400 font-bold text-xs flex items-center justify-center w-[40px] h-[40px]" title="Scopus">
                      SC
                    </a>
                  )}
                </div>
              )}

            </div>

            {/* RIGHT CONTENT */}
            <div className="flex-1 space-y-12 w-full">
              
              <div className="space-y-12">
                {qualifications && qualifications.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Qualifications</h2>
                    <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                      {qualifications.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {cleanResearchAreas && cleanResearchAreas.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Research Interests</h2>
                    <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                      {cleanResearchAreas.map((area, idx) => (
                        <li key={idx}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {coursesTaught && coursesTaught.length > 0 && (
                  <div>
                    <h2 className="text-xl font-bold text-white mb-4">Course(s) Taught In SMU</h2>
                    <ul className="list-disc pl-5 space-y-2 text-neutral-300">
                      {coursesTaught.map((course, idx) => (
                        <li key={idx}>{course}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Historical Timeline */}
              <div>
                <div className="flex flex-wrap gap-4 text-neutral-300 mb-8 pb-8 border-b border-white/10">
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    <BookOpen size={18} className="text-[var(--color-brand-primary)]" />
                    <span className="font-medium">{totalCourses} Classes Taught</span>
                  </div>
                  <div className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-lg border border-white/10">
                    <Calendar size={18} className="text-[var(--color-brand-primary)]" />
                    <span className="font-medium">{terms.length} Semesters Active</span>
                  </div>
                </div>

                <h2 className="text-2xl font-bold text-white mb-8 flex items-center gap-3">
                  Historical Teaching Schedule
                </h2>
                
                <div className="relative border-l border-white/10 ml-3 space-y-12 pb-4">
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
                              className="bg-white/5 p-5 rounded-xl hover:bg-white/10 transition-colors group flex flex-col h-full border border-white/5 hover:border-white/10"
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
        </div>
        
      </div>
    </div>
  );
}
