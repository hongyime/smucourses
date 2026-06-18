import { Search, SlidersHorizontal, X } from "lucide-react";
import { useState } from "react";

export interface FilterState {
  query: string;
  school: string;
  level: string;
  area: string;
  track: string;
}

interface SearchFilterProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  availableSchools: string[];
  availableLevels: string[];
  availableAreas: string[];
  availableTracks: string[];
}

export default function SearchFilter({
  filters,
  onFilterChange,
  availableSchools,
  availableLevels,
  availableAreas,
  availableTracks,
}: SearchFilterProps) {
  const [showFilters, setShowFilters] = useState(false);

  const handleChange = (key: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    onFilterChange({
      query: "",
      school: "",
      level: "",
      area: "",
      track: "",
    });
  };

  const activeFilterCount = [filters.school, filters.level, filters.area, filters.track].filter(Boolean).length;

  return (
    <div className="w-full mb-8">
      {/* Search Input */}
      <div className="relative mb-4 max-w-[600px] mx-auto">
        <div className="absolute top-1/2 -translate-y-1/2 left-5 text-neutral-500 z-10 pointer-events-none">
          <Search size={20} />
        </div>
        <input
          type="text"
          className="w-full bg-white dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white rounded-full h-16 pl-14 pr-32 text-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-primary)]/50 transition-all placeholder:text-neutral-500 shadow-lg backdrop-blur-sm"
          placeholder="Search by course code, name, or keywords..."
          value={filters.query}
          onChange={(e) => handleChange("query", e.target.value)}
        />
        <div className="absolute top-2 right-2 bottom-2 flex items-center gap-2">
          {filters.query && (
            <button
              onClick={() => handleChange("query", "")}
              className="p-2 text-neutral-400 hover:text-black dark:hover:text-white transition-colors"
              title="Clear search"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 h-full rounded-full transition-colors font-medium border border-black/5 dark:border-white/5 ${
              showFilters || activeFilterCount > 0
                ? "bg-[var(--color-brand-primary)]/20 text-[var(--color-brand-primary)] border-[var(--color-brand-primary)]/30"
                : "bg-black/5 dark:bg-white/5 text-neutral-600 dark:text-neutral-300 hover:bg-black/10 dark:hover:bg-white/10"
            }`}
          >
            <SlidersHorizontal size={18} />
            <span className="hidden sm:inline">Filters {activeFilterCount > 0 && `(${activeFilterCount})`}</span>
          </button>
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <div className="glass-panel p-6 animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Refine Search</h3>
            {activeFilterCount > 0 && (
              <button
                onClick={clearFilters}
                className="text-sm text-neutral-400 hover:text-white transition-colors flex items-center gap-1"
              >
                <X size={14} /> Clear all
              </button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* School */}
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5 ml-1">School</label>
              <select
                value={filters.school}
                onChange={(e) => handleChange("school", e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Schools</option>
                {availableSchools.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            {/* Level */}
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5 ml-1">Level</label>
              <select
                value={filters.level}
                onChange={(e) => handleChange("level", e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Levels</option>
                {availableLevels.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            {/* Area */}
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5 ml-1">Area</label>
              <select
                value={filters.area}
                onChange={(e) => handleChange("area", e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Areas</option>
                {availableAreas.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </select>
            </div>

            {/* Track */}
            <div>
              <label className="block text-sm text-neutral-400 mb-1.5 ml-1">Track</label>
              <select
                value={filters.track}
                onChange={(e) => handleChange("track", e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white appearance-none focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">All Tracks</option>
                {availableTracks.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
