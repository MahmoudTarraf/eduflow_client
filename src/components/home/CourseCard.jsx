import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Clock, Users, ArrowRight, BookOpen } from 'lucide-react';
import CoursePrice from '../common/CoursePrice';
import RatingDisplay from '../common/RatingDisplay';
import WishlistButton from '../common/WishlistButton';

const CourseCard = ({ course, isEnrolled, user, index, t }) => {
  const getLevelColor = (level) => {
    switch (level) {
      case 'beginner':
      case 'A1':
      case 'A2':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'intermediate':
      case 'B1':
      case 'B2':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'advanced':
      case 'C1':
      case 'C2':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };
  return (
    <motion.div
      data-aos="fade-up"
      data-aos-delay={index * 100}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ duration: 0.3 }}
      className="card hover:shadow-2xl transition-all duration-300 group"
    >
      {/* Course Image */}
      <div className="relative mb-4 overflow-hidden rounded-lg">
        <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
          {course.image ? (
            <img
              src={course.image}
              alt={course.name}
              className="w-full h-full object-cover"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
                const placeholder = document.createElement('div');
                placeholder.innerHTML = '<svg class="w-16 h-16 text-primary-600 dark:text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>';
                e.target.parentElement.appendChild(placeholder.firstChild);
              }}
            />
          ) : (
            <BookOpen className="w-16 h-16 text-primary-600 dark:text-primary-400" />
          )}
        </div>
        <div className="absolute top-3 left-3">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getLevelColor(course.level)}`}>
            {course.level}
          </span>
        </div>
        {user?.role === 'student' && (
          <div className="absolute top-3 right-3">
            <WishlistButton courseId={course._id} size="md" />
          </div>
        )}
      </div>

      {/* Course Info */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">
            {course.category}
          </span>
          <RatingDisplay 
            rating={course.averageRating} 
            totalRatings={course.totalRatings}
            size="md"
            showCount={true}
            showLabel={true}
          />
        </div>

        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {course.name}
        </h3>

        {(course.instructor?.name || (course.isOrphaned && course.originalInstructor?.name)) && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {course.instructor?.name
              ? `By ${course.instructor.name}`
              : `Created by ${course.originalInstructor.name}`}
          </p>
        )}

        <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">
          {course.description}
        </p>

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

        <div className="pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
          <div className="mb-3">
            <CoursePrice course={course} showTimer={true} />
          </div>
          {user?.role === 'student' && isEnrolled ? (
            <Link
              to={`/student/course/${course._id}/details`}
              className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>{t('continueCourse')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : user?.role === 'student' ? (
            <Link
              to={`/student/course/${course._id}/enroll`}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>{t('registerForCourse')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          ) : (
            <Link
              to={`/courses/${course._id}`}
              className="w-full px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>{t('viewDetails')}</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CourseCard;
