import React from 'react';
import { Search } from 'lucide-react';

const SearchFilters = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  selectedLevel,
  setSelectedLevel,
  hasSearched,
  categories,
  levels = [],
  searching,
  onSearch,
  onClearSearch,
  t
}) => {
  return (
    <section className="py-12 bg-gray-50 dark:bg-gray-900" data-aos="fade-up">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={t('searchCoursesPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input-field pl-10"
              aria-label="Search courses"
            />
          </div>
          
          {/* Category Select */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="input-field md:w-48"
            aria-label="Filter by category"
          >
            <option value="">{t('category')}</option>
            {categories.map(cat => (
              <option key={cat._id} value={cat.slug}>{cat.name}</option>
            ))}
          </select>
          
          {/* Level Select */}
          <select
            value={selectedLevel}
            onChange={(e) => setSelectedLevel(e.target.value)}
            className="input-field md:w-48"
            aria-label="Filter by level"
          >
            <option value="">{t('level')}</option>
            {levels.map(level => (
              <option key={level._id} value={level.slug}>
                {level.name}
              </option>
            ))}
          </select>
          
          {/* Search Button */}
          <button 
            onClick={onSearch} 
            className="btn-primary whitespace-nowrap px-6"
            disabled={searching}
          >
            {searching ? t('loading') || 'Searching...' : t('search')}
          </button>
          
          {/* Clear Button */}
          {hasSearched && (
            <button 
              onClick={onClearSearch} 
              className="btn-secondary whitespace-nowrap px-6"
            >
              {t('allCourses')}
            </button>
          )}
        </div>
      </div>
    </section>
  );
};

export default SearchFilters;
