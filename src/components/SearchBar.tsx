import React from 'react';
import { Search, X, SlidersHorizontal, Check } from 'lucide-react';
import { Specialization, SpecializationId } from '../types';
import { SpecializationIcon } from './SpecializationIcons';

interface SearchBarProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  specializations: Specialization[];
  selectedSpecialization: SpecializationId;
  onSelectSpecialization: (id: SpecializationId) => void;
  availableTodayOnly: boolean;
  onToggleAvailableToday: () => void;
  topRatedOnly: boolean;
  onToggleTopRated: () => void;
  totalResults: number;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  searchQuery,
  onSearchChange,
  specializations,
  selectedSpecialization,
  onSelectSpecialization,
  availableTodayOnly,
  onToggleAvailableToday,
  topRatedOnly,
  onToggleTopRated,
  totalResults,
}) => {
  return (
    <div id="search-section" className="px-5 space-y-4">
      {/* Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-sky-600">
          <Search className="w-5 h-5" />
        </div>
        <input
          id="doctor-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by doctor, specialty, hospital..."
          className="w-full pl-11 pr-10 py-3.5 bg-white rounded-2xl border border-sky-100 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-400/40 focus:border-sky-400 shadow-xs transition-all"
        />
        {searchQuery && (
          <button
            id="clear-search-btn"
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Specialization Categories Scrollable Pills / Cards */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Specializations
          </h3>
          <span className="text-[11px] font-medium text-sky-700 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
            {totalResults} {totalResults === 1 ? 'doctor' : 'doctors'} found
          </span>
        </div>

        <div
          id="specialization-pills-list"
          className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth"
        >
          {specializations.map((spec) => {
            const isSelected = selectedSpecialization === spec.id;
            return (
              <button
                key={spec.id}
                id={`specialization-btn-${spec.id}`}
                onClick={() => onSelectSpecialization(spec.id)}
                className={`flex items-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all flex-shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-sm ring-2 ring-sky-600/30'
                    : 'bg-white text-slate-700 border border-slate-200/80 hover:border-sky-200 hover:bg-sky-50/50 shadow-xs'
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-sky-50 text-sky-600'
                  }`}
                >
                  <SpecializationIcon iconName={spec.iconName} className="w-3.5 h-3.5" />
                </div>
                <span>{spec.name}</span>
                {spec.id !== 'all' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-sky-100' : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {spec.doctorCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Quick Filter Chips */}
      <div className="flex items-center gap-2 pt-0.5">
        <div className="text-slate-400 pl-0.5">
          <SlidersHorizontal className="w-3.5 h-3.5" />
        </div>

        {/* Available Today toggle */}
        <button
          id="filter-available-today-btn"
          onClick={onToggleAvailableToday}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            availableTodayOnly
              ? 'bg-sky-100/90 text-sky-800 border border-sky-300 shadow-xs'
              : 'bg-slate-100/80 text-slate-600 border border-transparent hover:bg-slate-100'
          }`}
        >
          {availableTodayOnly && <Check className="w-3 h-3 text-sky-700" />}
          <span>Available Today</span>
        </button>

        {/* Top-Rated toggle */}
        <button
          id="filter-top-rated-btn"
          onClick={onToggleTopRated}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            topRatedOnly
              ? 'bg-amber-100/80 text-amber-900 border border-amber-300 shadow-xs'
              : 'bg-slate-100/80 text-slate-600 border border-transparent hover:bg-slate-100'
          }`}
        >
          {topRatedOnly && <Check className="w-3 h-3 text-amber-700" />}
          <span>⭐ 4.9+ Rated</span>
        </button>
      </div>
    </div>
  );
};
