import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Star, 
  BookOpen, 
  Users, 
  TrendingUp, 
  Award, 
  ArrowUpRight, 
  UserCheck, 
  Calendar, 
  X, 
  PlayCircle, 
  Eye, 
  FileText, 
  XCircle, 
  Filter, 
  Search,
  CreditCard,
  ArrowRight,
  Play
} from 'lucide-react';
import axios from 'axios';
import { toast } from 'react-toastify';

import { useAuth } from '../../contexts/AuthContext';
import { isStudentRestricted } from '../../utils/restrictions';
import TourGuide from '../../components/common/TourGuide';
import CoursePrice from '../../components/common/CoursePrice';
import NoDataIllustration from '../../components/common/NoDataIllustration';
import WishlistButton from '../../components/common/WishlistButton';
import StreakIndicator from '../../components/common/StreakIndicator';
import { getStudentDashboardTour } from '../../config/tours';
import useFirstLogin from '../../hooks/useFirstLogin';

const StudentDashboard = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const isFirstLogin = useFirstLogin();
  const [enrolledCourses, setEnrolledCourses] = useState([]);
  const [availableCourses, setAvailableCourses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [certificateRequests, setCertificateRequests] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [userStats, setUserStats] = useState(null);
  const [canRateCourses, setCanRateCourses] = useState({});
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [certificateEligibility, setCertificateEligibility] = useState({});

  useEffect(() => {
    if (isStudentRestricted(user, 'dashboardAccess')) {
      toast.error('Your account is suspended. You cannot access the student dashboard.');
      navigate('/');
    }
  }, [user, navigate]);

  const handleRequestCertificate = async (courseId, groupId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/certificates/request', {
        courseId,
        groupId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Certificate request submitted successfully!');
      
      // Refresh the data to update the UI
      fetchData();
      fetchCertificateRequests();
    } catch (error) {
      console.error('Error requesting certificate:', error);
      toast.error(error.response?.data?.message || 'Failed to request certificate');
    }
  };

  const fetchCertificateRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/certificates/my-requests', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCertificateRequests(response.data.requests || []);
    } catch (error) {
      console.error('Error fetching certificate requests:', error);
    }
  };

  const fetchCertificateEligibility = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/certificates/my-eligibility', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const map = {};
      (response.data.enrolledCourses || []).forEach((enrollment) => {
        if (enrollment && enrollment._id) {
          map[enrollment._id] = {
            status: enrollment.eligibilityStatus,
            details: enrollment.eligibilityDetails
          };
        }
      });

      setCertificateEligibility(map);
    } catch (error) {
      console.error('Error fetching certificate eligibility:', error);
    }
  };

  const hasCertificateRequest = (courseId) => {
    return certificateRequests.some(req => 
      req.course?._id === courseId && 
      (req.status === 'requested' || req.status === 'issued')
    );
  };

  useEffect(() => {
    fetchData();
    fetchCertificateRequests();
    fetchCategories();
    fetchLevels();
    fetchUserStats();
    fetchCertificateEligibility();
  }, []);

  useEffect(() => {
    // Check rating eligibility for all enrolled courses
    const checkRatingEligibility = async () => {
      if (enrolledCourses.length > 0) {
        const eligibilityMap = {};
        for (const enrollment of enrolledCourses) {
          try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`/api/ratings/can-rate/${enrollment.course._id}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            eligibilityMap[enrollment.course._id] = response.data.canRate;
          } catch (error) {
            console.error('Error checking rating eligibility:', error);
            eligibilityMap[enrollment.course._id] = false;
          }
        }
        setCanRateCourses(eligibilityMap);
      }
    };
    
    checkRatingEligibility();
  }, [enrolledCourses]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      setCategories(response.data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await axios.get('/api/levels');
      setLevels(response.data.levels || []);
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const fetchUserStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/gamification/my-stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserStats(response.data.stats);
    } catch (error) {
      console.error('Error fetching user stats:', error);
    }
  };

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('Please select a rating');
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      await axios.post('/api/ratings', {
        course: selectedCourse.course._id,
        rating,
        review: review.trim()
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Thank you for your rating!');
      setShowRatingModal(false);
      setRating(0);
      setReview('');
      
      // Update canRateCourses to remove this course
      setCanRateCourses(prev => ({
        ...prev,
        [selectedCourse.course._id]: false
      }));
      
      setSelectedCourse(null);
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    }
  };

  const fetchData = async () => {
    try {
      const [enrolledResponse, coursesResponse] = await Promise.all([
        axios.get('/api/courses/enrolled'),
        axios.get('/api/courses')
      ]);
      
      // The enrolled courses already have overallGrade from backend
      // Just use them directly
      const enrolledCourses = enrolledResponse.data.enrolledCourses || [];
      console.log('[Dashboard] Enrolled courses fetched:', enrolledCourses.length);
      enrolledCourses.forEach(e => {
        console.log('[Dashboard] Enrolled:', e.course?.name, 'ID:', String(e.course?._id), 'Status:', e.status);
      });
      
      setEnrolledCourses(enrolledCourses);
      setAvailableCourses(coursesResponse.data.courses || []);
    } catch (error) {
      console.error('[Dashboard] Error fetching data:', error.response?.data || error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setHasSearched(true);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setSelectedLevel('');
    setHasSearched(false);
  };

  const filteredAvailableCourses = availableCourses.filter(course => {
    // Check if this course is already enrolled - convert IDs to strings for comparison
    const isEnrolled = enrolledCourses.some(enrolled => {
      if (!enrolled.course || !course._id) return false;
      const enrolledCourseId = String(enrolled.course._id);
      const currentCourseId = String(course._id);
      return enrolledCourseId === currentCourseId;
    });
    
    // Only apply filters if search has been performed
    if (!hasSearched) {
      return !isEnrolled;
    }
    
    const matchesSearch = !searchTerm || 
                         course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !selectedCategory || course.category === selectedCategory;
    const matchesLevel = !selectedLevel || course.level === selectedLevel;
    
    return !isEnrolled && matchesSearch && matchesCategory && matchesLevel;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'enrolled':
      case 'approved': // Handle 'approved' same as 'enrolled'
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'enrolled':
      case 'approved': // Handle 'approved' same as 'enrolled'
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('welcomeTitle')}, {user?.name}!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t('continueYourLearningJourney')}
          </p>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              title: t('enrolledCoursesCard'),
              value: enrolledCourses.filter(c => c.status === 'enrolled').length,
              icon: <BookOpen className="w-6 h-6" />,
              color: 'bg-blue-500'
            },
            {
              title: t('completedCoursesCard'),
              value: enrolledCourses.filter(c => c.status === 'completed').length,
              icon: <CheckCircle className="w-6 h-6" />,
              color: 'bg-green-500'
            },
            {
              title: t('inProgress'),
              value: enrolledCourses.filter(c => c.status === 'enrolled' && (!c.overallGrade || c.overallGrade < 100)).length,
              icon: <TrendingUp className="w-6 h-6" />,
              color: 'bg-purple-500'
            },
            {
              title: t('totalProgress'),
              value: enrolledCourses.length > 0 
                ? Math.round(enrolledCourses.reduce((sum, c) => sum + (c.overallGrade || 0), 0) / enrolledCourses.length) + '%'
                : '0%',
              icon: <TrendingUp className="w-6 h-6" />,
              color: 'bg-purple-500'
            }
          ].map((stat, index) => (
            <div key={index} className="card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Payment History Link */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mb-8"
        >
          <Link 
            to="/student/payment-history"
            className="block bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 rounded-lg shadow-lg p-6 transition-all duration-300 hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-4 bg-white/20 rounded-lg backdrop-blur-sm">
                  <CreditCard className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    Payment History
                  </h3>
                  <p className="text-indigo-100">
                    View all your course payments and receipts
                  </p>
                </div>
              </div>
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </Link>
        </motion.div>

        {/* My Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('myCourses')}
          </h2>

          {enrolledCourses.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t('noCoursesYet')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Start your learning journey by enrolling in a course
              </p>
              <Link
                to="/#courses"
                className="btn-primary"
              >
                {t('startLearning')}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrolledCourses.map((enrollment, index) => (
                <motion.div
                  key={enrollment._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  {/* Course Image */}
                  <div className="relative mb-4">
                    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 rounded-lg flex items-center justify-center">
                      {enrollment.course.image ? (
                        <img
                          src={enrollment.course.image}
                          alt={enrollment.course.name}
                          className="w-full h-full object-cover rounded-lg"
                        />
                      ) : (
                        <BookOpen className="w-12 h-12 text-primary-600 dark:text-primary-400" />
                      )}
                    </div>
                    <div className="absolute top-3 left-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(enrollment.status)}`}>
                        {getStatusIcon(enrollment.status)}
                        <span className="capitalize">{enrollment.status}</span>
                      </span>
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                      {enrollment.course.name}
                    </h3>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Clock className="w-4 h-4" />
                        <span>{enrollment.course.duration} {t('weeks')}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Users className="w-4 h-4" />
                        <span>{enrollment.group?.name || 'No Group'}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      {/* Progress Bar */}
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-gray-600 dark:text-gray-400">{t('progress')}</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                          {Math.round(enrollment.overallGrade || 0)}%
                        </span>
                      </div>
                      <div className="relative bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${Math.round(enrollment.overallGrade || 0)}%` }}
                        ></div>
                      </div>
                      
                      {/* Grade Display */}
                      {enrollment.hasGrade && (
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-600 dark:text-gray-400">Overall Grade</span>
                          <span className={`font-medium ${enrollment.overallGrade >= 70 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {Math.round(enrollment.overallGrade)}%
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="pt-4 space-y-2">
                      {/* Course Access Button - Check suspension status */}
                      {isStudentRestricted(user, 'continueCourses') ? (
                        <button
                          disabled
                          className="btn-primary w-full flex items-center justify-center space-x-2 opacity-50 cursor-not-allowed"
                          title="Course access suspended"
                        >
                          <Play className="w-4 h-4" />
                          <span>Course Access Suspended</span>
                        </button>
                      ) : (
                        <Link
                          to={`/student/course/${enrollment.course._id}`}
                          className="btn-primary w-full flex items-center justify-center space-x-2"
                        >
                          <Play className="w-4 h-4" />
                          <span>{enrollment.status === 'completed' ? 'View Course' : t('continueCourse')}</span>
                        </Link>
                      )}
                      
                      {/* Certificate Request Button - respects certificateMode and instructor release */}
                      {(() => {
                        const course = enrollment.course;
                        if (!course) return false;

                        if (isStudentRestricted(user, 'requestCertificate')) return false;

                        // Do not show if already requested or issued
                        if (hasCertificateRequest(course._id)) return false;

                        const eligibility = certificateEligibility[enrollment._id];
                        if (!eligibility) return false;

                        const { status, details } = eligibility;
                        const mode = course.certificateMode || 'automatic';
                        const offersCertificate = course.offersCertificate !== false && mode !== 'disabled';

                        if (!offersCertificate) return false;

                        // Manual instructor mode: only show when CAN_REQUEST
                        if (mode === 'manual_instructor') {
                          return status === 'CAN_REQUEST';
                        }

                        // Automatic mode: treat student as eligible when fully completed and grade >= passing grade
                        if (mode === 'automatic') {
                          const passingGrade =
                            typeof details?.passingGrade === 'number' ? details.passingGrade : 60;
                          const overallGrade =
                            typeof details?.overallGrade === 'number' ? details.overallGrade : 0;
                          const completion =
                            typeof details?.completionPercentage === 'number'
                              ? details.completionPercentage
                              : 0;

                          const gradeOk = overallGrade >= passingGrade;
                          const completionOk = completion >= 100;

                          if (gradeOk && completionOk) return true;
                        }

                        // Fallback: original status-based check
                        if (status === 'AUTO_GRANT' || status === 'CAN_REQUEST') {
                          return true;
                        }

                        return false;
                      })() && (
                        <button
                          onClick={() => handleRequestCertificate(enrollment.course._id, enrollment.group?._id)}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                          <span>Request Certificate</span>
                        </button>
                      )}

                      {/* Certificate Mode & Status Hints */}
                      {(() => {
                        const course = enrollment.course;
                        if (!course) return null;

                        const eligibility = certificateEligibility[enrollment._id];
                        if (!eligibility) return null;

                        const { status, details } = eligibility;
                        const mode = course.certificateMode || 'automatic';
                        const offersCertificate = course.offersCertificate !== false && mode !== 'disabled';

                        if (!offersCertificate) {
                          return (
                            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                              {t('certificateStatusCertificatesDisabled')}
                            </p>
                          );
                        }

                        const waitingForInstructor =
                          status === 'GROUP_COMPLETED_AND_ELIGIBLE' &&
                          details?.certificateMode === 'manual_instructor' &&
                          details?.instructorCertificateRelease === false;

                        const modeKey =
                          mode === 'manual_instructor'
                            ? 'certificateModeManualInstructor'
                            : mode === 'automatic'
                              ? 'certificateModeAutomatic'
                              : 'certificateModeDisabled';

                        const isEligible = status === 'AUTO_GRANT' || status === 'CAN_REQUEST';

                        return (
                          <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 space-y-1">
                            <p>
                              {t('certificateModeLabel')}{': '} {t(modeKey)}
                            </p>
                            <p>
                              {t('certificateStatus')}{': '}
                              {isEligible
                                ? t('certificateStatusEligible')
                                : waitingForInstructor
                                  ? t('certificateStatusWaitingInstructor')
                                  : t('certificateStatusNotEligible')}
                            </p>
                          </div>
                        );
                      })()}

                      {/* Rate Course Button - Show if enrolled and not already rated */}
                      {canRateCourses[enrollment.course._id] && (
                        <button
                          onClick={() => {
                            setSelectedCourse(enrollment);
                            setShowRatingModal(true);
                          }}
                          className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          <span>{t('rateThisCourse')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Discover New Courses Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            {t('discoverNewCourses')}
          </h2>

          {/* Search and Filter */}
          <div className="card mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder={t('searchCoursesPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  className="input-field pl-10"
                />
              </div>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="input-field md:w-48"
              >
                <option value="">{t('category')}</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat.slug}>{cat.name}</option>
                ))}
              </select>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="input-field md:w-48"
              >
                <option value="">{t('level')}</option>
                {levels.map(level => (
                  <option key={level._id} value={level.slug}>
                    {level.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleSearch}
                className="btn-primary flex items-center space-x-2 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                <span>{t('search')}</span>
              </button>
              {hasSearched && (
                <button
                  onClick={handleClearSearch}
                  className="btn-secondary flex items-center space-x-2 whitespace-nowrap"
                >
                  <span>{t('clear')}</span>
                </button>
              )}
            </div>
          </div>

          {/* Available Courses */}
          {hasSearched && filteredAvailableCourses.length === 0 ? (
            <div className="card">
              <NoDataIllustration 
                message={t('noCoursesFound')} 
                description={t('tryDifferentFilters')}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredAvailableCourses.slice(0, 6).map((course, index) => (
                  <motion.div
                    key={course._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                    className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                  >
                    {/* Course Image */}
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
                      <div className="absolute top-3 right-3">
                        <WishlistButton courseId={course._id} />
                      </div>
                    </div>

                    {/* Course Info */}
                    <div className="space-y-3">
                      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {course.name}
                      </h3>

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

                      <div className="flex items-center justify-between pt-4">
                        <CoursePrice course={course} showTimer={true} />
                        {user?.status === 'suspended' && user?.restrictions?.enrollNewCourses ? (
                          <button
                            disabled
                            className="btn-primary flex items-center space-x-2 opacity-50 cursor-not-allowed"
                            title="Enrollment suspended"
                          >
                            <span>{t('registerForCourse')}</span>
                            <ArrowRight className="w-4 h-4" />
                          </button>
                        ) : (
                          <Link
                            to={`/student/course/${course._id}/enroll`}
                            className="btn-primary flex items-center space-x-2"
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

              {filteredAvailableCourses.length > 6 && (
                <div className="text-center mt-8">
                  <Link
                    to="/courses"
                    className="btn-outline text-lg px-8 py-3"
                  >
                    {t('allCourses')}
                  </Link>
                </div>
              )}
            </>
          )}
        </motion.div>
      </div>

      {/* Rating Modal */}
      {showRatingModal && selectedCourse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {t('rateCourse')}
              </h2>
              <button
                onClick={() => {
                  setShowRatingModal(false);
                  setRating(0);
                  setReview('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-gray-600 dark:text-gray-400 mb-2">
                {t('course')}: <span className="font-semibold text-gray-900 dark:text-white">{selectedCourse.course?.name}</span>
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500">
                {t('feedbackHelpsOthers')}
              </p>
            </div>

            <form onSubmit={handleSubmitRating} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('rating')} *
                </label>
                <div className="flex items-center space-x-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="focus:outline-none transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          star <= (hoverRating || rating)
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300 dark:text-gray-600'
                        }`}
                      />
                    </button>
                  ))}
                  {rating > 0 && (
                    <span className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                      {rating} {rating === 1 ? t('star') : t('stars')}
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('yourReview')}
                </label>
                <textarea
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  rows={4}
                  maxLength={1000}
                  placeholder={t('shareYourExperience')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {review.length}/1000 {t('characters')}
                </p>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowRatingModal(false);
                    setRating(0);
                    setReview('');
                  }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  {t('skipForNow')}
                </button>
                <button
                  type="submit"
                  disabled={rating === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  <Star className="w-4 h-4" />
                  <span>{t('submitRating')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      
      {/* Tour Guide */}
      <TourGuide 
        steps={getStudentDashboardTour(t)} 
        tourKey="student_dashboard" 
        autoStart={isFirstLogin}
        showButton={true}
      />
    </div>
  );
};

export default StudentDashboard;
