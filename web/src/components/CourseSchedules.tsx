"use client";

import { useState, useMemo } from "react";
import { FileText, Search, ArrowDownUp } from "lucide-react";

export default function CourseSchedules({ schedules }: { schedules: any[] }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<"termCode" | "professor" | "section">("termCode");
  const [sortDesc, setSortDesc] = useState(true);

  const filteredAndSorted = useMemo(() => {
    if (!schedules) return [];
    
    // Filter
    let result = schedules.filter(s => {
      const term = s.term?.toLowerCase() || "";
      const prof = s.professor?.toLowerCase() || "";
      const loc = s.location?.toLowerCase() || "";
      const sec = s.section?.toLowerCase() || "";
      const search = searchTerm.toLowerCase();
      
      return term.includes(search) || prof.includes(search) || loc.includes(search) || sec.includes(search);
    });

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortField] || "";
      let bVal = b[sortField] || "";
      
      if (aVal < bVal) return sortDesc ? 1 : -1;
      if (aVal > bVal) return sortDesc ? -1 : 1;
      return 0;
    });

    return result;
  }, [schedules, searchTerm, sortField, sortDesc]);

  const handleSort = (field: "termCode" | "professor" | "section") => {
    if (sortField === field) {
      setSortDesc(!sortDesc);
    } else {
      setSortField(field);
      setSortDesc(true);
    }
  };

  return (
    <div className="mt-8 pt-8 border-t border-black/10 dark:border-white/10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <h3 className="text-lg font-semibold text-black dark:text-white flex items-center gap-2">
          Class Schedules & Syllabi
        </h3>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" size={16} />
          <input
            type="text"
            placeholder="Filter schedules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full md:w-64 pl-9 pr-4 py-2 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)] text-neutral-800 dark:text-neutral-200"
          />
        </div>
      </div>
      
      {filteredAndSorted.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-black/10 dark:border-white/10 bg-black/5 dark:bg-white/5">
          <table className="w-full text-sm text-left text-neutral-700 dark:text-neutral-300">
            <thead className="text-xs uppercase bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-400 border-b border-black/10 dark:border-white/10">
              <tr>
                <th className="px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort("termCode")}>
                  <div className="flex items-center gap-2">Term <ArrowDownUp size={12} /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort("section")}>
                  <div className="flex items-center gap-2">Section <ArrowDownUp size={12} /></div>
                </th>
                <th className="px-4 py-3 cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors" onClick={() => handleSort("professor")}>
                  <div className="flex items-center gap-2">Professor <ArrowDownUp size={12} /></div>
                </th>
                <th className="px-4 py-3">Timing</th>
                <th className="px-4 py-3">Venue</th>
                <th className="px-4 py-3 text-right">Syllabus</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.map((schedule: any, idx: number) => (
                <tr key={idx} className="border-b border-black/5 dark:border-white/5 last:border-0 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap font-medium text-black dark:text-white">{schedule.term}</td>
                  <td className="px-4 py-3 font-semibold text-indigo-600 dark:text-indigo-400">{schedule.section}</td>
                  <td className="px-4 py-3">{schedule.professor}</td>
                  <td className="px-4 py-3 text-xs">{schedule.time}</td>
                  <td className="px-4 py-3 text-xs text-neutral-500">{schedule.location}</td>
                  <td className="px-4 py-3 text-right">
                    {schedule.pdfUrl ? (
                      <a 
                        href={schedule.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs bg-[var(--color-brand-primary)] hover:bg-[#c28e00] text-[#050a14] px-3 py-1.5 rounded-full transition-colors inline-flex items-center gap-1.5 font-semibold shadow-sm whitespace-nowrap"
                      >
                        <FileText size={12} /> View
                      </a>
                    ) : (
                      <span className="text-xs text-neutral-500 italic px-2 py-1 bg-black/5 dark:bg-white/5 rounded-full whitespace-nowrap">
                        Unavailable
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-lg p-8 text-center">
          <FileText className="mx-auto h-8 w-8 text-neutral-400 mb-3 opacity-50" />
          <p className="text-neutral-600 dark:text-neutral-400 font-medium">
            {schedules && schedules.length > 0 
              ? "No schedules match your search filter." 
              : "No historical schedules or syllabi available for this course yet."}
          </p>
        </div>
      )}
    </div>
  );
}
