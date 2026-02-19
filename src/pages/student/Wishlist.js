import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Star, BookOpen, Clock, Users, ArrowRight, Trash2 } from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';
import CoursePrice from '../../components/common/CoursePrice';
import NoDataIllustration from '../../components/common/NoDataIllustration';

const Wishlist = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState(null);

  useEffect(() => {
    fetchWishlist();
  }, []);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const [wishlistRes, enrollmentRes] = await Promise.all([
        axios.get('/api/wishlist'),
        axios.get('/api/auth/me')
      ]);
      
      const wishlistCourses = wishlistRes.data.wishlist || [];
      const enrolledCourseIds = enrollmentRes.data.user?.enrolledCourses?.map(e => e.course?._id || e.course) || [];
      
      // Mark courses as enrolled
      const coursesWithEnrollment = wishlistCourses.map(course => ({
        ...course,
        isEnrolled: enrolledCourseIds.includes(course._id)
      }));
      
      setWishlist(coursesWithEnrollment);
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (courseId) => {
    try {
      setRemoving(courseId);
      await axios.delete(`/api/wishlist/${courseId}`);
      setWishlist(wishlist.filter(course => course._id !== courseId));
      toast.success('Removed from wishlist');
    } catch (error) {
      console.error('Error removing from wishlist:', error);
      toast.error('Failed to remove from wishlist');
    } finally {
      setRemoving(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Star className="w-8 h-8 text-yellow-600 dark:text-yellow-400 fill-current" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('myWishlist') || 'My Wishlist'}
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {wishlist.length} {t('savedForLater')}
          </p>
        </motion.div>

        {/* Wishlist Content */}
        {wishlist.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card"
          >
            <NoDataIllustration
              message={t('emptyWishlist') || 'Your wishlist is empty'}
              description={t('saveCoursesForLater') || 'Start adding courses you\'re interested in!'}
            />
            <div className="text-center mt-6">
              <Link to="/" className="btn-primary">
                {t('browseCourses') || 'Browse Courses'}
              </Link>
            </div>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlist.map((course, index) => (
              <motion.div
                key={course._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 relative"
              >
                {/* Remove Button */}
                <button
                  onClick={() => removeFromWishlist(course._id)}
                  disabled={removing === course._id}
                  className="absolute top-3 right-3 p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors z-10"
                  title="Remove from wishlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>

                {/* Course Image */}
                <Link to={`/student/course/${course._id}/enroll`}>
                  <div className="relative mb-4">
                    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center">
                      {course.image ? (
                        <img
                          src={course.image}
                          alt={course.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <BookOpen className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        {course.level}
                      </span>
                    </div>
                  </div>
                </Link>

                {/* Course Info */}
                <div className="space-y-3">
                  <Link to={`/student/course/${course._id}/enroll`}>
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                      {course.name}
                    </h3>
                  </Link>

                  <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
                    {course.description}
                  </p>

                  {course.instructor && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      by {course.instructor.name}
                    </p>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration} {t('weeks')}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{course.groups?.length || 0} groups</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <CoursePrice course={course} showTimer={true} />
                    {course.isEnrolled ? (
                      <Link
                        to={`/student/course/${course._id}/details`}
                        className="px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 text-sm"
                      >
                        <span>{t('continueCourse')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <Link
                        to={`/student/course/${course._id}/enroll`}
                        className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center space-x-2 text-sm"
                      >
                        <span>{t('registerForCourse')}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Wishlist;
