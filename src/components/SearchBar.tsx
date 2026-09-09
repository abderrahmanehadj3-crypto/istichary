import React from 'react';
import { Search, X, SlidersHorizontal, Check } from 'lucide-react';
import { Specialization, SpecializationId, Language } from '../types';
import { SpecializationIcon } from './SpecializationIcons';
import { translations } from '../i18n/translations';

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
  lang: Language;
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
  lang,
}) => {
  const t = translations[lang];

  return (
    <div id="search-section" className="px-5 space-y-4">
      {/* Search Input */}
      <div className="relative flex items-center">
        <div className="absolute left-4 pointer-events-none text-sky-600 dark:text-sky-400">
          <Search className="w-5 h-5" />
        </div>
        <input
          id="doctor-search-input"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="w-full pl-11 pr-10 py-3.5 bg-white dark:bg-slate-800 rounded-2xl border border-sky-100 dark:border-slate-700 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-sky-500 shadow-xs transition-all"
        />
        {searchQuery && (
          <button
            id="clear-search-btn"
            onClick={() => onSearchChange('')}
            className="absolute right-3.5 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Specialization Categories Scrollable Pills */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {t.specializations}
          </h3>
          <span className="text-[11px] font-medium text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-0.5 rounded-full border border-sky-100 dark:border-sky-900/50">
            {totalResults} {totalResults === 1 ? 'specialist' : 'specialists'}
          </span>
        </div>

        <div
          id="specialization-pills-list"
          className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none"
        >
          {specializations.map((spec) => {
            const isSelected = selectedSpecialization === spec.id;
            return (
              <button
                key={spec.id}
                id={`specialization-btn-${spec.id}`}
                onClick={() => onSelectSpecialization(spec.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 cursor-pointer ${
                  isSelected
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-sky-300'
                }`}
              >
                <div
                  className={`p-1 rounded-lg ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-sky-50 dark:bg-sky-950 text-sky-600 dark:text-sky-400'
                  }`}
                >
                  <SpecializationIcon iconName={spec.iconName} className="w-3.5 h-3.5" />
                </div>
                <span>{spec.name}</span>
                {spec.id !== 'all' && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                      isSelected ? 'bg-white/20 text-sky-100' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
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

        <button
          id="filter-available-today-btn"
          onClick={onToggleAvailableToday}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            availableTodayOnly
              ? 'bg-sky-100 dark:bg-sky-950 text-sky-800 dark:text-sky-300 border border-sky-300 dark:border-sky-800 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {availableTodayOnly && <Check className="w-3 h-3 text-sky-700 dark:text-sky-300" />}
          <span>{t.availableToday}</span>
        </button>

        <button
          id="filter-top-rated-btn"
          onClick={onToggleTopRated}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            topRatedOnly
              ? 'bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-300 border border-amber-300 dark:border-amber-800 shadow-xs'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {topRatedOnly && <Check className="w-3 h-3 text-amber-700 dark:text-amber-300" />}
          <span>{t.topRated}</span>
        </button>
      </div>
    </div>
  );
};
