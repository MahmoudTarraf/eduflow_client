import React from 'react';
import { Star } from 'lucide-react';

/**
 * Reusable component to display course ratings
 * @param {number} rating - Average rating (0-5)
 * @param {number} totalRatings - Total number of ratings
 * @param {string} size - Size variant: 'sm', 'md', 'lg'
 * @param {boolean} showCount - Whether to show rating count
 * @param {boolean} showLabel - Whether to show "No ratings" label
 * @param {string} className - Additional CSS classes
 */
const RatingDisplay = ({ 
  rating = 0, 
  totalRatings = 0, 
  size = 'md',
  showCount = true,
  showLabel = true,
  className = ''
}) => {
  const sizes = {
    sm: {
      star: 'w-3 h-3',
      text: 'text-xs',
      rating: 'text-sm'
    },
    md: {
      star: 'w-4 h-4',
      text: 'text-sm',
      rating: 'text-sm'
    },
    lg: {
      star: 'w-5 h-5',
      text: 'text-base',
      rating: 'text-lg'
    },
    xl: {
      star: 'w-6 h-6',
      text: 'text-lg',
      rating: 'text-xl'
    }
  };

  const sizeConfig = sizes[size] || sizes.md;
  const hasRatings = rating > 0 && totalRatings > 0;
  const displayRating = hasRatings ? Number(rating).toFixed(1) : '0.0';

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {hasRatings ? (
        <>
          <Star className={`${sizeConfig.star} text-yellow-400 fill-current flex-shrink-0`} />
          <span className={`${sizeConfig.rating} font-semibold text-gray-700 dark:text-gray-300`}>
            {displayRating}
          </span>
          {showCount && totalRatings > 0 && (
            <span className={`${sizeConfig.text} text-gray-500 dark:text-gray-400`}>
              ({totalRatings.toLocaleString()})
            </span>
          )}
        </>
      ) : (
        <>
          <Star className={`${sizeConfig.star} text-gray-300 dark:text-gray-600 flex-shrink-0`} />
          {showLabel && (
            <span className={`${sizeConfig.text} text-gray-400 dark:text-gray-500`}>
              No ratings yet
            </span>
          )}
        </>
      )}
    </div>
  );
};

/**
 * Component to display full star rating visualization
 */
export const StarRating = ({ rating = 0, size = 'md', showValue = true, className = '' }) => {
  const sizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6'
  };

  const starSize = sizes[size] || sizes.md;
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      <div className="flex gap-0.5">
        {stars.map((star) => (
          <Star
            key={star}
            className={`${starSize} ${
              star <= Math.round(rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
      </div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300 ml-1">
          {Number(rating).toFixed(1)}
        </span>
      )}
    </div>
  );
};

/**
 * Component to display rating breakdown with bars
 */
export const RatingBreakdown = ({ distribution = [] }) => {
  const totalRatings = distribution.reduce((sum, item) => sum + (item.count || 0), 0);
  
  // Create array for all ratings 1-5, even if they have 0 count
  const fullDistribution = [5, 4, 3, 2, 1].map(rating => {
    const found = distribution.find(d => d._id === rating);
    return {
      rating,
      count: found ? found.count : 0,
      percentage: totalRatings > 0 ? ((found?.count || 0) / totalRatings) * 100 : 0
    };
  });

  return (
    <div className="space-y-2">
      {fullDistribution.map(({ rating, count, percentage }) => (
        <div key={rating} className="flex items-center gap-2">
          <div className="flex items-center gap-1 w-12">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{rating}</span>
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
          </div>
          <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-yellow-400 transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
          <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
            {count}
          </span>
        </div>
      ))}
    </div>
  );
};

export default RatingDisplay;
