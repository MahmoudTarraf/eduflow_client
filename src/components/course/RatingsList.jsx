import React, { useState, useEffect } from 'react';
import { Star, ThumbsUp } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RatingsList = ({ courseId }) => {
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [distribution, setDistribution] = useState([]);

  useEffect(() => {
    fetchRatings();
  }, [courseId]);

  const fetchRatings = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/ratings/course/${courseId}`);
      setRatings(res.data.ratings || []);
      setDistribution(res.data.distribution || []);
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkHelpful = async (ratingId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`/api/ratings/${ratingId}/helpful`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Marked as helpful');
      fetchRatings();
    } catch (error) {
      console.error('Error marking helpful:', error);
      toast.error('Failed to mark as helpful');
    }
  };

  const RatingBar = ({ stars, count, total }) => {
    const percentage = total > 0 ? (count / total) * 100 : 0;
    return (
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm text-gray-600 dark:text-gray-400 w-8">{stars}★</span>
        <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-yellow-400 transition-all duration-300"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">{count}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const totalRatings = ratings.length;
  const distMap = {};
  distribution.forEach(d => {
    distMap[d._id] = d.count;
  });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        Student Ratings ({totalRatings})
      </h3>

      {/* Rating Distribution */}
      {totalRatings > 0 && (
        <div className="mb-8 pb-8 border-b border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-4">Rating Distribution</h4>
          {[5, 4, 3, 2, 1].map(star => (
            <RatingBar
              key={star}
              stars={star}
              count={distMap[star] || 0}
              total={totalRatings}
            />
          ))}
        </div>
      )}

      {/* Individual Ratings */}
      {ratings.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600 dark:text-gray-400">No ratings yet. Be the first to rate this course!</p>
        </div>
      ) : (
        <div className="space-y-6">
          {ratings.map((rating) => (
            <div key={rating._id} className="border-b border-gray-200 dark:border-gray-700 pb-6 last:border-0">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mr-3">
                    <span className="text-indigo-600 dark:text-indigo-400 font-medium">
                      {rating.student?.name?.charAt(0)?.toUpperCase() || 'S'}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {rating.student?.name || 'Anonymous'}
                    </p>
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= rating.rating
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-gray-300 dark:text-gray-600'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(rating.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category Ratings */}
              {(rating.contentQuality || rating.instructorSupport || rating.valueForMoney) && (
                <div className="grid grid-cols-3 gap-4 mb-3 text-xs">
                  {rating.contentQuality && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Content: </span>
                      <span className="font-medium text-gray-900 dark:text-white">{rating.contentQuality}★</span>
                    </div>
                  )}
                  {rating.instructorSupport && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Support: </span>
                      <span className="font-medium text-gray-900 dark:text-white">{rating.instructorSupport}★</span>
                    </div>
                  )}
                  {rating.valueForMoney && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Value: </span>
                      <span className="font-medium text-gray-900 dark:text-white">{rating.valueForMoney}★</span>
                    </div>
                  )}
                </div>
              )}

              {rating.review && (
                <p className="text-gray-600 dark:text-gray-400 mb-3">
                  {rating.review}
                </p>
              )}

              <button
                onClick={() => handleMarkHelpful(rating._id)}
                className="text-sm text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1 transition"
              >
                <ThumbsUp className="w-4 h-4" />
                Helpful ({rating.helpful || 0})
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RatingsList;
