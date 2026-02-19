import React from 'react';

const CourseCardSkeleton = () => {
  return (
    <div className="card h-full flex flex-col overflow-hidden animate-pulse">
      {/* Image Skeleton */}
      <div className="h-48 bg-neutral-200 dark:bg-gray-700" />
      
      {/* Content Skeleton */}
      <div className="p-6 flex-1 flex flex-col space-y-4">
        {/* Title */}
        <div className="h-6 bg-neutral-200 dark:bg-gray-700 rounded w-3/4" />
        
        {/* Description */}
        <div className="space-y-2 flex-grow">
          <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded" />
          <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-5/6" />
        </div>

        {/* Meta Info */}
        <div className="flex items-center justify-between">
          <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-20" />
          <div className="h-4 bg-neutral-200 dark:bg-gray-700 rounded w-20" />
        </div>

        {/* Price and Button */}
        <div className="flex items-center justify-between pt-4 border-t border-neutral-200 dark:border-gray-700">
          <div className="h-6 bg-neutral-200 dark:bg-gray-700 rounded w-24" />
          <div className="h-10 bg-neutral-200 dark:bg-gray-700 rounded w-28" />
        </div>
      </div>
    </div>
  );
};

export default CourseCardSkeleton;
