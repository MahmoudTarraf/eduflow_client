import React from 'react';
import { motion } from 'framer-motion';
import CourseCard from './CourseCard';
import CourseCardSkeleton from './CourseCardSkeleton';
import NoDataIllustration from '../common/NoDataIllustration';

const CoursesList = ({ 
  courses, 
  loading, 
  hasSearched, 
  enrolledCourseIds,
  user,
  showAllCourses, 
  onToggleShowAll,
  t 
}) => {
  if (loading) {
    return (
      <section id="courses" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {t('recentCourses')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('discoverMostPopularCourses')}
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[...Array(6)].map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (courses.length === 0) {
    return (
      <section id="courses" className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16" data-aos="fade-up">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {hasSearched ? 'Search Results' : t('recentCourses')}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400">
              {t('discoverMostPopularCourses')}
            </p>
          </div>
          <div className="card">
            <NoDataIllustration 
              message={hasSearched ? t('noCoursesFound') : t('noCoursesAvailable')} 
              description={hasSearched ? t('tryDifferentFilters') : ''}
            />
          </div>
        </div>
      </section>
    );
  }

  const displayedCourses = showAllCourses ? courses : courses.slice(0, 12);
  const hasMore = courses.length > 12;

  return (
    <section id="courses" className="py-20 bg-white dark:bg-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
            {hasSearched ? 'Search Results' : t('recentCourses')}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            {t('discoverMostPopularCourses')}
          </p>
        </div>
        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {displayedCourses.map((course, index) => {
            const isEnrolled = enrolledCourseIds.includes(String(course._id));
            
            return (
              <CourseCard
                key={course._id}
                course={course}
                isEnrolled={isEnrolled}
                user={user}
                index={index}
                t={t}
              />
            );
          })}
        </div>

        {/* Show More Button */}
        {!showAllCourses && hasMore && (
          <div className="text-center mt-12">
            <button
              onClick={onToggleShowAll}
              className="btn-outline text-lg px-8 py-3"
            >
              {t('showMore') || 'Show All'} ({courses.length} {t('courses')})
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default CoursesList;
