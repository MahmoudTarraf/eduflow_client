import React from 'react';
import CountdownTimer from './CountdownTimer';

/**
 * Component to display course pricing with discount support
 * @param {Object} course - Course object with cost and discount fields
 * @param {boolean} showTimer - Whether to show countdown timer for active discounts
 * @param {string} className - Additional CSS classes
 */
const CoursePrice = ({ course, showTimer = true, className = '' }) => {
  const hasActiveDiscount = 
    course?.discount?.status === 'approved' && 
    course?.discount?.endDate && 
    new Date(course.discount.endDate) > new Date();

  if (hasActiveDiscount) {
    // When discount is active: originalCost has the real original price, cost has the discounted price
    const originalPrice = course.originalCost || course.cost;
    const discountedPrice = course.cost;
    
    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2">
          {/* Original Price (crossed out) */}
          <span className="text-lg text-gray-500 dark:text-gray-400 line-through">
            {originalPrice?.toLocaleString()} SYP
          </span>
          
          {/* Discount Badge */}
          <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">
            SAVE {course.discount.percentage}%
          </span>
        </div>
        
        {/* Discounted Price */}
        <div className="text-2xl font-bold text-red-600 dark:text-red-500">
          {discountedPrice?.toLocaleString()} SYP
        </div>
        
        {/* Countdown Timer */}
        {showTimer && (
          <CountdownTimer 
            endDate={course.discount.endDate} 
            className="text-sm"
          />
        )}
      </div>
    );
  }

  // Normal price display
  return (
    <div className={`text-xl font-semibold ${className}`}>
      {course.cost?.toLocaleString()} SYP
    </div>
  );
};

export default CoursePrice;
