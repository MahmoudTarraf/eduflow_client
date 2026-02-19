import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, 
  Users, 
  FileText, 
  Plus,
  Edit,
  Trash2,
  Eye,
  TrendingUp,
  DollarSign,
  Download,
  AlertTriangle,
  Clock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import { isInstructorRestricted } from '../../utils/restrictions';
import { useSocket } from '../../contexts/SocketContext';
import useCelebration from '../../hooks/useCelebration';
import CelebrationModal from '../../components/common/CelebrationModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import TourGuide from '../../components/common/TourGuide';
import { instructorDashboardTour } from '../../config/tours';
import useFirstLogin from '../../hooks/useFirstLogin';
import AgreementNotification from '../../components/instructor/AgreementNotification';

const InstructorDashboard = () => {
  const { t } = useTranslation();
  const { user, weakPassword } = useAuth();
  const { socket } = useSocket() || {};
  const isFirstLogin = useFirstLogin();
  const { celebrationState, celebrate, closeCelebration } = useCelebration();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    description: '',
    category: '',
    level: 'beginner',
    duration: 8,
    cost: 0,
    image: '',
    hasCertificate: false,
    certificateMode: 'manual_instructor',
    instructorCertificateRelease: false,
    telegramGroupLink: '',
    allowPointsDiscount: false // Default to OFF as per requirements
  });
  const [categories, setCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [addingCategory, setAddingCategory] = useState(false);
  const [levels, setLevels] = useState([]);
  const [showAddLevel, setShowAddLevel] = useState(false);
  const [newLevelName, setNewLevelName] = useState('');
  const [addingLevel, setAddingLevel] = useState(false);

  const [pendingSummary, setPendingSummary] = useState({
    pendingCertificates: 0,
    pendingAssignments: 0,
    pendingReuploads: 0,
    canRequestPayout: false,
    availableAmountSYP: 0,
    minimumPayoutSYP: 0,
    discounts: []
  });

  const hasPending = Boolean(
    pendingSummary.pendingCertificates ||
    pendingSummary.pendingAssignments ||
    pendingSummary.pendingReuploads ||
    pendingSummary.canRequestPayout ||
    (pendingSummary.discounts && pendingSummary.discounts.length > 0)
  );

  const enablePendingAnimations = user?.preferences?.enablePendingActionsAnimations !== false;
  const shouldAnimatePendingStrip = enablePendingAnimations && hasPending;

  const cannotCreateCourses = isInstructorRestricted(user, 'createEditDeleteCourses');

  const formatTimeRemaining = (endsAt) => {
    if (!endsAt) return '';
    const end = new Date(endsAt).getTime();
    const now = Date.now();
    const diffMs = end - now;
    if (diffMs <= 0) return 'expired';
    const diffMinutes = Math.floor(diffMs / (60 * 1000));
    if (diffMinutes < 60) return `${diffMinutes} min`;
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ${diffMinutes % 60}m`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ${diffHours % 24}h`;
  };

  // fetchData wrapped in useCallback for useEffect dependencies
  const fetchData = useCallback(async () => {
    try {
      console.log('========== FRONTEND DEBUG ==========');
      console.log('Current user:', {
        id: user?.id,
        email: user?.email,
        role: user?.role,
        instructorStatus: user?.instructorStatus
      });
      console.log('Fetching instructor courses from /api/courses/my-courses and pending summary...');
      
      // Fetch courses and pending summary in parallel
      const [coursesResponse, pendingSummaryResponse] = await Promise.all([
        axios.get('/api/courses/my-courses'),
        axios.get('/api/instructor/pending-summary')
      ]);

      console.log('Courses response:', {
        success: coursesResponse.data.success,
        count: coursesResponse.data.count,
        coursesLength: coursesResponse.data.courses?.length || 0
      });
      
      if (coursesResponse.data.courses && coursesResponse.data.courses.length > 0) {
        console.log('First course sample:', {
          id: coursesResponse.data.courses[0]._id,
          name: coursesResponse.data.courses[0].name,
          instructor: coursesResponse.data.courses[0].instructor
        });
      }

      setCourses(coursesResponse.data.courses || []);
      console.log('✅ Successfully set courses:', coursesResponse.data.courses?.length || 0);

      const summaryData = pendingSummaryResponse.data?.data || {};
      setPendingSummary(prev => ({
        ...prev,
        ...summaryData
      }));

      // Students are managed per-group, not globally for instructors

      console.log('====================================');
    } catch (error) {
      console.error('========== ERROR FETCHING DATA ==========');
      console.error('Error details:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      if (error.response?.status === 403) {
        console.error('❌ Permission denied - user might not be an instructor');
        toast.error('Permission denied. Please ensure you are logged in as an instructor.');
      } else if (error.response?.status === 401) {
        console.error('❌ Not authenticated - token might be invalid');
        toast.error('Session expired. Please log in again.');
      } else {
        console.error('❌ Unknown error occurred');
        const message = error.response?.data?.message || 'Failed to load instructor dashboard data';
        toast.error(message);
      }
      console.error('=========================================');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
    fetchCategories();
    fetchLevels();
  }, [fetchData]);

  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      if (!data || typeof data !== 'object') return;
      setPendingSummary(prev => ({
        ...prev,
        ...data
      }));
    };

    socket.on('instructor.pending-updates', handler);

    return () => {
      socket.off('instructor.pending-updates', handler);
    };
  }, [socket]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get('/api/categories');
      const fetchedCategories = response.data.categories || [];
      console.log('Fetched categories:', fetchedCategories);
      setCategories(fetchedCategories);
      
      // Set default category if available
      if (fetchedCategories.length > 0 && !form.category) {
        setForm(prev => ({ ...prev, category: fetchedCategories[0].slug }));
      }
      
      // If no categories were returned, retry once after a short delay
      if (fetchedCategories.length === 0) {
        console.log('No categories found, retrying...');
        setTimeout(async () => {
          try {
            const retryResponse = await axios.get('/api/categories');
            const retryCategories = retryResponse.data.categories || [];
            console.log('Retry fetched categories:', retryCategories);
            setCategories(retryCategories);
            if (retryCategories.length > 0 && !form.category) {
              setForm(prev => ({ ...prev, category: retryCategories[0].slug }));
            }
          } catch (retryError) {
            console.error('Retry fetch categories error:', retryError);
          }
        }, 1000);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Please enter a category name');
      return;
    }

    try {
      setAddingCategory(true);
      const response = await axios.post('/api/categories', {
        name: newCategoryName,
        description: `${newCategoryName} courses`
      });
      
      await fetchCategories();
      setForm({ ...form, category: response.data.category.slug });
      setNewCategoryName('');
      setShowAddCategory(false);
      toast.success('Category added successfully!');
    } catch (error) {
      console.error('Error adding category:', error);
      toast.error(error.response?.data?.message || 'Failed to add category');
    } finally {
      setAddingCategory(false);
    }
  };

  const fetchLevels = async () => {
    try {
      const response = await axios.get('/api/levels');
      const fetchedLevels = response.data.levels || [];
      console.log('Fetched levels:', fetchedLevels);
      setLevels(fetchedLevels);
      
      // Set default level if available
      if (fetchedLevels.length > 0 && !form.level) {
        setForm(prev => ({ ...prev, level: fetchedLevels[0].slug }));
      }
    } catch (error) {
      console.error('Error fetching levels:', error);
    }
  };

  const handleAddLevel = async () => {
    if (!newLevelName.trim()) {
      toast.error('Please enter a level name');
      return;
    }

    try {
      setAddingLevel(true);
      const response = await axios.post('/api/levels', {
        name: newLevelName,
        description: `${newLevelName} level courses`,
        order: levels.length + 1
      });
      
      await fetchLevels();
      setForm({ ...form, level: response.data.level.slug });
      setNewLevelName('');
      setShowAddLevel(false);
      toast.success('Level added successfully!');
    } catch (error) {
      console.error('Error adding level:', error);
      toast.error(error.response?.data?.message || 'Failed to add level');
    } finally {
      setAddingLevel(false);
    }
  };

  const handleDeleteClick = (courseId, courseName) => {
    setCourseToDelete({ id: courseId, name: courseName });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!courseToDelete) return;
    
    try {
      setDeleting(true);
      await axios.delete(`/api/courses/${courseToDelete.id}`);
      setShowDeleteConfirm(false);
      setCourseToDelete(null);
      await fetchData();
    } catch (error) {
      console.error('Delete course failed:', error);
      toast.error(error.response?.data?.message || 'Failed to delete course');
    } finally {
      setDeleting(false);
    }
  };

  const onCreateCourse = async (e) => {
  e.preventDefault();
  try {
    setCreating(true);
    const token = localStorage.getItem('token');

    console.log('Checking token...');
    console.log('Token exists:', !!token);
    console.log('Token value:', token);
    console.log('--------------------');

    const response = await axios.post('/api/courses', form, {
      headers: { Authorization: `Bearer ${token}` }
    });

    // Trigger celebration based on course approval status
    const newCourse = response.data?.course;
    if (newCourse) {
      // Only celebrate if course is approved (trusted instructor) or admin
      if (newCourse.approvalStatus === 'approved' || newCourse.isPublished) {
        celebrate({
          eventType: 'courseCreated',
          userName: user?.name,
          courseName: newCourse.name || form.name,
          userRole: 'instructor',
          eventKey: `course_created_${user?.id}_${newCourse._id}`,
        });
      } else {
        // Show pending approval toast for non-trusted instructors
        toast.success(`Course "${newCourse.name}" created! Waiting for admin approval.`, {
          duration: 5000,
          icon: '⏳',
        });
      }
    }

    // Clear form
    setForm({
      name: '',
      description: '',
      category: categories.length > 0 ? categories[0].slug : '',
      level: 'beginner',
      duration: 8,
      cost: 0,
      image: '',
      hasCertificate: false,
      certificateMode: 'manual_instructor',
      instructorCertificateRelease: false,
      telegramGroupLink: '',
      allowPointsDiscount: false
    });
    setShowCreateModal(false);
    setShowAddCategory(false);
    setNewCategoryName('');
    await fetchData();
  } catch (error) {
    console.error('Create course failed:', error);

    // Check if the backend returned validation errors
    if (error.response?.data?.errors && error.response.data.errors.length > 0) {
      const messages = error.response.data.errors
        .map(err => `${err.path || err.field}: ${err.msg || err.message}`)
        .join('\n');
      toast.error(messages);
    } else {
      toast.error(error.response?.data?.message || 'Failed to create course');
    }
  } finally {
    setCreating(false);
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
        {user?.instructorStatus !== 'approved' && (
          <div className="mb-6 p-4 rounded-lg bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Your instructor account is pending admin approval. You can browse but cannot create or update courses yet.
          </div>
        )}

        {/* Agreement Notification */}
        {user?.instructorStatus === 'approved' && <AgreementNotification />}

        {/* Weak password banner (non-blocking) */}
        {weakPassword && (user?.role === 'admin' || user?.role === 'instructor') && (
          <div className="mb-4 px-4 py-2 rounded-md border border-yellow-100 dark:border-yellow-900/40 bg-yellow-50/60 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-200 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-base">⚠️</span>
              <span>
                Your password is considered weak. Please update it from your profile to better protect your instructor account and payouts.
              </span>
            </div>
            <Link
              to="/profile"
              className="ml-4 inline-flex items-center px-3 py-1.5 rounded-md bg-yellow-600 text-white text-xs font-medium hover:bg-yellow-700"
            >
              Update
            </Link>
          </div>
        )}

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
            Manage your courses, groups, and content
          </p>
        </motion.div>

        {/* Pending Actions Strip */}
        {hasPending ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              ...(shouldAnimatePendingStrip
                ? {
                    boxShadow: [
                      '0 0 0 0 rgba(250, 204, 21, 0)',
                      '0 0 0 10px rgba(250, 204, 21, 0.35)',
                      '0 0 0 0 rgba(250, 204, 21, 0)'
                    ]
                  }
                : {})
            }}
            transition={
              shouldAnimatePendingStrip
                ? {
                    opacity: { duration: 0.4, ease: 'easeOut' },
                    y: { duration: 0.4, ease: 'easeOut' },
                    boxShadow: {
                      duration: 2.2,
                      repeat: Infinity,
                      repeatType: 'mirror',
                      ease: 'easeInOut'
                    }
                  }
                : { duration: 0.4, ease: 'easeOut' }
            }
            className="sticky top-0 z-30 mb-6 rounded-md px-4 py-2 text-sm flex flex-wrap items-center gap-3 border bg-gradient-to-r from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-900/40 dark:via-yellow-900/40 dark:to-orange-900/40 text-amber-900 dark:text-amber-50 border-amber-300 dark:border-amber-500 shadow-lg"
          >
            <span className="font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-yellow-500" />
              <span>Pending actions:</span>
            </span>

            {pendingSummary.pendingCertificates > 0 && (
              <Link
                to="/instructor/certificates"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
              >
                <span className="font-semibold">{pendingSummary.pendingCertificates}</span>
                <span>certificate requests</span>
              </Link>
            )}

            {pendingSummary.pendingAssignments > 0 && (
              <Link
                to="/instructor/grading"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
              >
                <span className="font-semibold">{pendingSummary.pendingAssignments}</span>
                <span>assignments to grade</span>
              </Link>
            )}

            {pendingSummary.pendingReuploads > 0 && (
              <Link
                to="/instructor/grading"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
              >
                <span className="font-semibold">{pendingSummary.pendingReuploads}</span>
                <span>reupload requests</span>
              </Link>
            )}

            {pendingSummary.canRequestPayout && (
              <Link
                to="/instructor/earnings"
                className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
              >
                <span>Can request payout now</span>
              </Link>
            )}

            {pendingSummary.discounts && pendingSummary.discounts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                {pendingSummary.discounts.slice(0, 2).map((d) => (
                  <Link
                    key={d.courseId}
                    to={`/instructor/courses/${d.courseId}/edit`}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                  >
                    <Clock className="w-3 h-3" />
                    <span className="font-semibold truncate max-w-[120px]">{d.courseName}</span>
                    {d.endsAt && (
                      <span className="opacity-80">ends in {formatTimeRemaining(d.endsAt)}</span>
                    )}
                  </Link>
                ))}
                {pendingSummary.discounts.length > 2 && (
                  <span className="text-xs text-gray-600 dark:text-gray-300">
                    +{pendingSummary.discounts.length - 2} more
                  </span>
                )}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="sticky top-0 z-30 mb-6 rounded-md px-4 py-2 text-sm bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200"
          >
            No pending actions 🎉
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="dashboard-stats grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              title: 'My Courses',
              value: courses.length,
              icon: <BookOpen className="w-6 h-6" />,
              color: 'bg-blue-500'
            },
            {
              title: 'Total Groups',
              value: courses.reduce((sum, c) => sum + (c.groups?.length || 0), 0),
              icon: <Users className="w-6 h-6" />,
              color: 'bg-green-500'
            },
            {
              title: 'Active Courses',
              value: courses.filter(c => c.isActive).length,
              icon: <TrendingUp className="w-6 h-6" />,
              color: 'bg-purple-500'
            },
            {
              title: 'My Earnings',
              value: 'View',
              icon: <DollarSign className="w-6 h-6" />,
              color: 'bg-yellow-500',
              link: '/instructor/earnings'
            }
          ].map((stat, index) => {
            const CardContent = (
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
            );

            return stat.link ? (
              <Link key={index} to={stat.link} className="card hover:shadow-lg transition-shadow">
                {CardContent}
              </Link>
            ) : (
              <div key={index} className="card">
                {CardContent}
              </div>
            );
          })}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <button
              onClick={() => setShowCreateModal(true)}
              disabled={user?.instructorStatus !== 'approved' || cannotCreateCourses}
              className="create-course-btn card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-primary-100 dark:bg-primary-900 rounded-lg">
                  <Plus className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Create New Course
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Start a new course
                  </p>
                </div>
              </div>
            </button>

            <Link
              to="/instructor/earnings"
              className="earnings-link card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <DollarSign className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    My Earnings
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Track your income
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/instructor/certificates"
              className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Certificate Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage certificate requests
                  </p>
                </div>
              </div>
            </Link>
            <Link
              to="/instructor/grading"
              className="grading-link card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left"
            >
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Assignment Grading
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Grade student assignments
                  </p>
                </div>
              </div>
            </Link>

            {/* Removed Upload Content and Grade Assignments quick actions */}
          </div>
        </motion.div>

        {/* My Courses */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="my-courses-section"
        >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            My Courses
          </h2>

          {courses.length === 0 ? (
            <div className="card text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                No courses yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Create your first course to start teaching
              </p>
              <button onClick={() => setShowCreateModal(true)} className="btn-primary" disabled={user?.instructorStatus !== 'approved' || cannotCreateCourses}>
                Create Course
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course, index) => (
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
                        <Users className="w-4 h-4" />
                        <span>{course.groups?.length || 0} groups</span>
                      </div>
                    </div>

                    {/* Price Section with Padding */}
                    <div className="pt-4 pb-3 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
                          {course.discount?.status === 'approved' ? (
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-2">
                                <span className="text-2xl font-bold text-red-600 dark:text-red-400">
                                  {course.cost} {course.currency || 'SYP'}
                                </span>
                                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full font-semibold">
                                  -{course.discount.percentage}%
                                </span>
                              </div>
                              <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
                                {course.originalCost || course.discount.originalPrice} {course.currency || 'SYP'}
                              </span>
                            </div>
                          ) : (
                            <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                              {course.totalPrice ? `${course.totalPrice} SYP` : `${course.cost} ${course.currency || 'SYP'}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Action Buttons - Right Aligned */}
                    <div className="pt-3 space-y-2">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/instructor/courses/${course._id}/edit`}
                          className="btn-secondary inline-flex items-center gap-2 px-3 py-2"
                          title="Edit Course"
                        >
                          Edit Course
                        </Link>
                      </div>
                      {/* Manage Groups Button */}
                      <Link 
                        to={`/instructor/courses/${course._id}/groups`} 
                        className="btn-primary w-full text-center inline-flex items-center justify-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        Manage Groups
                      </Link>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Create Course Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl p-6 my-8 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4 sticky top-0 bg-white dark:bg-gray-800 pb-4 border-b border-gray-200 dark:border-gray-700 z-10">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create Course</h3>
                <button onClick={() => setShowCreateModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white">✕</button>
              </div>
              <form onSubmit={onCreateCourse} className="space-y-4 pt-4" type="submit">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Name</label>
                    <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                  </div>
                  <div>
                    <label className="label">Category *</label>
                    <div className="flex gap-2">
                      <select 
                        className="input-field flex-1" 
                        value={form.category} 
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        required
                      >
                        <option value="">Select Category</option>
                        {categories.map(cat => (
                          <option key={cat._id} value={cat.slug}>{cat.name}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => setShowAddCategory(!showAddCategory)}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        title="Add new category"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>
                    {showAddCategory && (
                      <div className="mt-2 p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-800">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            className="input-field flex-1"
                            placeholder="Enter new category name"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                          />
                          <button
                            type="button"
                            onClick={handleAddCategory}
                            disabled={addingCategory}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50"
                          >
                            {addingCategory ? 'Adding...' : 'Add'}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setShowAddCategory(false); setNewCategoryName(''); }}
                            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label">Level</label>
                    <div className="relative">
                      <select 
                        className="input-field" 
                        value={showAddLevel ? '__add_new__' : form.level} 
                        onChange={(e) => {
                          if (e.target.value === '__add_new__') {
                            setShowAddLevel(true);
                          } else {
                            setForm({ ...form, level: e.target.value });
                            setShowAddLevel(false);
                          }
                        }}
                      >
                        {levels.map(level => (
                          <option key={level._id} value={level.slug}>
                            {level.name}
                          </option>
                        ))}
                        <option value="__add_new__">+ Add New Level</option>
                      </select>
                    </div>
                    {showAddLevel && (
                      <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <input
                          type="text"
                          className="input-field mb-2"
                          placeholder="Enter new level name (e.g., Expert, Master)"
                          value={newLevelName}
                          onChange={(e) => setNewLevelName(e.target.value)}
                        />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={handleAddLevel}
                            disabled={addingLevel}
                            className="btn-primary text-sm"
                          >
                            {addingLevel ? 'Adding...' : 'Add Level'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddLevel(false);
                              setNewLevelName('');
                            }}
                            className="btn-secondary text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="label">Duration (weeks)</label>
                    <input type="number" min="1" className="input-field" value={form.duration} onChange={(e) => setForm({ ...form, duration: Number(e.target.value) })} required />
                  </div>
                </div>
                <div>
                  <label className="label">Description</label>
                  <textarea className="input-field" rows="4" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="label">Cost (SYR)</label>
                    <input type="number" min="0" step="0.01" className="input-field" value={form.cost} onChange={(e) => setForm({ ...form, cost: Number(e.target.value) })} required />
                  </div>
                  <div>
                    <label className="label">Image URL (optional)</label>
                    <input className="input-field" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} />
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      id="hasCertificate"
                      checked={form.hasCertificate}
                      onChange={(e) => {
                        const checked = e.target.checked;
                        setForm(prev => ({
                          ...prev,
                          hasCertificate: checked,
                          certificateMode: checked ? (prev.certificateMode || 'manual_instructor') : 'disabled',
                          instructorCertificateRelease: checked ? prev.instructorCertificateRelease : false
                        }));
                      }}
                      className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor="hasCertificate" className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        This course offers a certificate upon completion
                      </span>
                      <span className="block text-xs text-yellow-800 dark:text-yellow-200 mt-1">
                        ⚠️ <strong>Important:</strong> You must provide a certificate to students who complete all course requirements if you enable this option.
                      </span>
                    </label>
                  </div>

                  {form.hasCertificate && (
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="label">Certificate Mode</label>
                        <select
                          className="input-field w-full truncate"
                          value={form.certificateMode}
                          onChange={(e) => {
                            const mode = e.target.value;
                            setForm(prev => ({
                              ...prev,
                              certificateMode: mode,
                              instructorCertificateRelease:
                                mode === 'manual_instructor' ? prev.instructorCertificateRelease : false
                            }));
                          }}
                        >
                          <option value="manual_instructor">
                            Manual release by instructor (recommended)
                          </option>
                          <option value="automatic">
                            Automatic when student completes and meets passing grade
                          </option>
                        </select>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          In manual mode, you decide when to open certificate requests for each group. In
                          automatic mode, students can request a certificate as soon as they complete the
                          course and meet the passing grade.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Telegram Group Link */}
                <div>
                  <label className="label">Telegram Discussion Group Link (Optional)</label>
                  <input
                    type="url"
                    className="input-field"
                    value={form.telegramGroupLink}
                    onChange={(e) => setForm({ ...form, telegramGroupLink: e.target.value })}
                    placeholder="https://t.me/yourgroup"
                  />
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    💡 <strong>Tip:</strong> Name your Telegram group as "<em>{form.name || 'Course Name'} - Group Name</em>" for clarity.
                  </p>
                </div>

                {/* Points Discount Setting */}
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      id="allowPointsDiscount"
                      checked={form.allowPointsDiscount}
                      onChange={(e) => setForm({ ...form, allowPointsDiscount: e.target.checked })}
                      className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <label htmlFor="allowPointsDiscount" className="ml-3 flex-1">
                      <span className="block text-sm font-medium text-gray-900 dark:text-white">
                        Supports Points Discount
                      </span>
                      <span className="block text-xs text-green-800 dark:text-green-200 mt-1">
                        💰 If enabled, students can use their reward balance to reduce payment. For example, each 500 points = 10,000 SYP (based on admin settings). <strong>The discount will be covered by the platform — your earnings will not be reduced.</strong>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="btn-secondary">Cancel</button>
                  <button type="submit" className="btn-primary" disabled={creating}>{creating ? 'Creating...' : 'Create'}</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Celebration Modal */}
        <CelebrationModal
          isOpen={celebrationState.isOpen}
          onClose={closeCelebration}
          {...celebrationState}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showDeleteConfirm}
          onClose={() => {
            setShowDeleteConfirm(false);
            setCourseToDelete(null);
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Course"
          message={`Are you sure you want to delete "${courseToDelete?.name}"? This will also delete all groups, sections, and content associated with this course. This action cannot be undone.`}
          confirmText="Delete Course"
          confirmButtonClass="bg-red-600 hover:bg-red-700 text-white"
          loading={deleting}
        />

        {/* Tour Guide */}
        <TourGuide 
          steps={instructorDashboardTour} 
          tourKey="instructor_dashboard" 
          autoStart={isFirstLogin}
          showButton={true}
        />

      </div>
    </div>
  );
};

export default InstructorDashboard;
