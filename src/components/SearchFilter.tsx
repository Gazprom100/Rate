import React from 'react';

interface SearchFilterProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  darkMode?: boolean;
}

export function SearchFilter({ 
  searchTerm, 
  onSearchChange, 
  darkMode = false 
}: SearchFilterProps) {
  return (
    <div className={`mb-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      <div className="relative">
        <input
          type="text"
          placeholder="Поиск токена по имени или символу..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full px-4 py-2 pl-10 rounded-lg border ${
            darkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
              : 'bg-white border-gray-300 text-gray-700 placeholder-gray-500'
          } focus:outline-none focus:ring-2 ${
            darkMode ? 'focus:ring-blue-500' : 'focus:ring-blue-400'
          } focus:border-transparent`}
        />
        <div className="absolute left-3 top-2.5 text-gray-400">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
} 