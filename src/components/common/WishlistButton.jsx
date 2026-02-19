import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

const WishlistButton = ({ courseId, className = '' }) => {
  const { user } = useAuth();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user && user.role === 'student') {
      checkWishlist();
    }
  }, [courseId, user]);

  const checkWishlist = async () => {
    try {
      const response = await axios.get(`/api/wishlist/check/${courseId}`);
      setIsInWishlist(response.data.isInWishlist);
    } catch (error) {
      console.error('Error checking wishlist:', error);
    }
  };

  const toggleWishlist = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please login to add courses to wishlist');
      return;
    }

    if (user.role !== 'student') {
      return; // Only students can use wishlist
    }

    setLoading(true);
    try {
      if (isInWishlist) {
        await axios.delete(`/api/wishlist/${courseId}`);
        setIsInWishlist(false);
        toast.success('Removed from wishlist');
      } else {
        await axios.post(`/api/wishlist/${courseId}`);
        setIsInWishlist(true);
        toast.success('Added to wishlist');
      }
    } catch (error) {
      console.error('Error toggling wishlist:', error);
      toast.error(error.response?.data?.message || 'Failed to update wishlist');
    } finally {
      setLoading(false);
    }
  };

  // Only show for students
  if (!user || user.role !== 'student') {
    return null;
  }

  return (
    <button
      onClick={toggleWishlist}
      disabled={loading}
      className={`p-2 rounded-full transition-all duration-200 ${
        isInWishlist
          ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
          : 'bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
      } ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-110'} ${className}`}
      title={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <Star
        className={`w-5 h-5 ${isInWishlist ? 'fill-current' : ''}`}
      />
    </button>
  );
};

export default WishlistButton;
