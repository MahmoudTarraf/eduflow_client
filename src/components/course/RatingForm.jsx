import React, { useState } from 'react';
import { Star } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const RatingForm = ({ courseId, existingRating, onSuccess }) => {
  const [rating, setRating] = useState(existingRating?.rating || 0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState(existingRating?.review || '');
  const [contentQuality, setContentQuality] = useState(existingRating?.contentQuality || 0);
  const [instructorSupport, setInstructorSupport] = useState(existingRating?.instructorSupport || 0);
  const [valueForMoney, setValueForMoney] = useState(existingRating?.valueForMoney || 0);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      const data = {
        course: courseId,
        rating,
        review,
        contentQuality,
        instructorSupport,
        valueForMoney
      };

      if (existingRating) {
        await axios.put(`/api/ratings/${existingRating._id}`, data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Rating updated successfully');
      } else {
        await axios.post('/api/ratings', data, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success('Rating submitted successfully');
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      console.error('Rating submission error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const StarRating = ({ value, onChange, label }) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {label}
      </label>
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            onMouseEnter={() => label === 'Overall Rating' && setHoverRating(star)}
            onMouseLeave={() => label === 'Overall Rating' && setHoverRating(0)}
            className="focus:outline-none transition-transform hover:scale-110"
          >
            <Star
              className={`w-8 h-8 ${
                star <= (label === 'Overall Rating' ? (hoverRating || value) : value)
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-300 dark:text-gray-600'
              }`}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
        {existingRating ? 'Update Your Rating' : 'Rate This Course'}
      </h3>

      <StarRating value={rating} onChange={setRating} label="Overall Rating" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StarRating value={contentQuality} onChange={setContentQuality} label="Content Quality" />
        <StarRating value={instructorSupport} onChange={setInstructorSupport} label="Instructor Support" />
        <StarRating value={valueForMoney} onChange={setValueForMoney} label="Value for Money" />
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Your Review (Optional)
        </label>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          maxLength={1000}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          placeholder="Share your experience with this course..."
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {review.length}/1000 characters
        </p>
      </div>

      <button
        type="submit"
        disabled={submitting || rating === 0}
        className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
      >
        {submitting && (
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {existingRating ? 'Update Rating' : 'Submit Rating'}
      </button>
    </form>
  );
};

export default RatingForm;
