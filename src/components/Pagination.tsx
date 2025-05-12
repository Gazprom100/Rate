import React from 'react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  darkMode?: boolean;
}

export function Pagination({ 
  currentPage, 
  totalPages, 
  onPageChange, 
  darkMode = false 
}: PaginationProps) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      // If we have fewer pages than our max display, show all
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);
      
      // Calculate start and end of the middle section
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      
      // Adjust if we're at the beginning or end
      if (currentPage <= 2) {
        end = Math.min(totalPages - 1, 4);
      }
      if (currentPage >= totalPages - 1) {
        start = Math.max(2, totalPages - 3);
      }
      
      // Add ellipsis if needed
      if (start > 2) {
        pages.push('ellipsis-start');
      }
      
      // Add middle pages
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
      
      // Add ellipsis if needed
      if (end < totalPages - 1) {
        pages.push('ellipsis-end');
      }
      
      // Always show last page
      pages.push(totalPages);
    }
    
    return pages;
  };

  return (
    <div className="flex justify-center items-center mt-6 space-x-2">
      <button
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        className={`px-3 py-1 rounded ${
          darkMode 
            ? `bg-gray-700 ${currentPage === 1 ? 'text-gray-500' : 'text-gray-300 hover:bg-gray-600'}` 
            : `bg-gray-100 ${currentPage === 1 ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`
        } transition-colors`}
      >
        &laquo;
      </button>
      
      {getPageNumbers().map((page, index) => (
        page === 'ellipsis-start' || page === 'ellipsis-end' ? (
          <span 
            key={`ellipsis-${index}`} 
            className={`px-3 py-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}
          >
            ...
          </span>
        ) : (
          <button
            key={`page-${page}`}
            onClick={() => onPageChange(page as number)}
            className={`px-3 py-1 rounded transition-colors ${
              currentPage === page 
                ? (darkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white')
                : (darkMode 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200')
            }`}
          >
            {page}
          </button>
        )
      ))}
      
      <button
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        className={`px-3 py-1 rounded ${
          darkMode 
            ? `bg-gray-700 ${currentPage === totalPages ? 'text-gray-500' : 'text-gray-300 hover:bg-gray-600'}` 
            : `bg-gray-100 ${currentPage === totalPages ? 'text-gray-400' : 'text-gray-700 hover:bg-gray-200'}`
        } transition-colors`}
      >
        &raquo;
      </button>
    </div>
  );
} 