import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  Settings,
  TrendingUp,
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Clock,
  Tag,
  BarChart3,
  Database,
  Paperclip
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, weakPassword } = useAuth();
  const { connected, socket } = useSocket() || {};
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalInstructors: 0,
    totalCourses: 0,
    totalEnrollments: 0
  });
  const [pendingInstructors, setPendingInstructors] = useState([]);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [allDiscounts, setAllDiscounts] = useState([]);
  const [showDiscountManagement, setShowDiscountManagement] = useState(false);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState([]);
  const [pendingSummary, setPendingSummary] = useState({
    payouts: 0,
    studentPayments: 0,
    deleteRequests: 0,
    applications: 0,
    agreements: 0,
    pendingCourses: 0
  });

  const hasPending = Boolean(
    pendingSummary.payouts ||
    pendingSummary.studentPayments ||
    pendingSummary.deleteRequests ||
    pendingSummary.applications ||
    pendingSummary.agreements ||
    pendingSummary.pendingCourses
  );

  const getApiErrorMessage = (error, fallbackMessage) => {
    const data = error?.response?.data;

    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const fieldMessages = data.errors
        .map((err) => err.msg || err.message)
        .filter(Boolean);

      if (fieldMessages.length > 0) {
        return fieldMessages.join(' ');
      }
    }

    if (typeof data?.message === 'string' && data.message.trim().length > 0) {
      return data.message;
    }

    return fallbackMessage;
  };

  const enablePendingAnimations = user?.preferences?.enablePendingActionsAnimations !== false;
  const shouldAnimatePendingStrip = enablePendingAnimations && hasPending;

  useEffect(() => {
    fetchData();
  }, []);

  // Listen for real-time pending summary updates from Socket.IO
  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      if (!data || typeof data !== 'object') return;
      setPendingSummary(prev => ({
        ...prev,
        ...data
      }));
    };

    socket.on('admin.pending-updates', handler);

    return () => {
      socket.off('admin.pending-updates', handler);
    };
  }, [socket]);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [studentsResponse, instructorsResponse, coursesResponse, groupsResponse, pendingResponse, pendingCoursesResponse, allDiscountsResponse, pendingSummaryResponse] = await Promise.all([
        axios.get('/api/users/students'),
        axios.get('/api/users/instructors'),
        axios.get('/api/courses'),
        axios.get('/api/groups'),
        axios.get('/api/users/instructors/pending'),
        axios.get('/api/courses/pending'),
        axios.get('/api/courses/discounts/all'),
        axios.get('/api/admin/pending-summary')
      ]);
      
      const students = studentsResponse.data.students || [];
      const instructors = instructorsResponse.data.instructors || [];
      const courses = coursesResponse.data.courses || [];
      const groups = groupsResponse.data.groups || [];

      // Calculate pending enrollments
      const pendingEnrollments = groups.reduce((total, group) => {
        return total + group.students.filter(s => s.status === 'pending').length;
      }, 0);

      setStats({
        students: students.length,
        instructors: instructors.length,
        courses: courses.length,
        pendingEnrollments
      });

      setPendingInstructors(pendingResponse.data.instructors || []);
      setPendingCourses(pendingCoursesResponse.data.courses || []);
      setAllDiscounts(allDiscountsResponse.data.discounts || allDiscountsResponse.data.courses || []);

      const summaryData = pendingSummaryResponse.data?.data || {};
      setPendingSummary(prev => ({
        ...prev,
        ...summaryData
      }));

      // Mock recent activity
      setRecentActivity([
        { type: 'enrollment', message: 'New student enrolled in JavaScript Course', time: '2 hours ago', status: 'pending' },
        { type: 'course', message: 'New course "Python for Beginners" created', time: '4 hours ago', status: 'success' },
        { type: 'user', message: 'New instructor "John Doe" registered', time: '6 hours ago', status: 'success' },
        { type: 'enrollment', message: 'Student completed React Course', time: '8 hours ago', status: 'success' }
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const approve = async (id) => {
    try {
      setProcessingIds((ids) => [...ids, id]);
      await axios.put(`/api/users/instructors/${id}/approve`);
      setPendingInstructors((list) => list.filter((u) => u._id !== id));
    } catch (e) {
      console.error('Approve failed', e);
    } finally {
      setProcessingIds((ids) => ids.filter((x) => x !== id));
    }
  };

  const reject = async (id) => {
    try {
      setProcessingIds((ids) => [...ids, id]);
      await axios.put(`/api/users/instructors/${id}/reject`);
      await fetchData(); // Refresh data
    } catch (error) {
      console.error('Error rejecting instructor:', error);
      const message = getApiErrorMessage(error, 'Failed to reject instructor');
      toast.error(message);
    } finally {
      setProcessingIds((ids) => ids.filter((x) => x !== id));
    }
  };

  const approveCourse = async (id) => {
    try {
      setProcessingIds((ids) => [...ids, `course-${id}`]);
      await axios.put(`/api/courses/${id}/approve`);
      await fetchData(); // Refresh data
      toast.success('Course approved successfully!');
    } catch (error) {
      console.error('Error approving course:', error);
      const message = getApiErrorMessage(error, 'Failed to approve course');
      toast.error(message);
    } finally {
      setProcessingIds((ids) => ids.filter((x) => x !== `course-${id}`));
    }
  };

  const rejectCourse = async (id) => {
    const reason = prompt('Enter rejection reason (optional):');
    try {
      setProcessingIds((ids) => [...ids, `course-${id}`]);
      await axios.put(`/api/courses/${id}/reject`, { reason });
      await fetchData(); // Refresh data
      toast.success('Course rejected.');
    } catch (error) {
      console.error('Error rejecting course:', error);
      const message = getApiErrorMessage(error, 'Failed to reject course');
      toast.error(message);
    } finally {
      setProcessingIds((ids) => ids.filter((x) => x !== `course-${id}`));
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
        {/* Weak password banner (non-blocking) */}
        {weakPassword && (user?.role === 'admin' || user?.role === 'instructor') && (
          <div className="mb-4 px-4 py-2 rounded-md border border-yellow-100 dark:border-yellow-900/40 bg-yellow-50/60 dark:bg-yellow-950/40 text-yellow-900 dark:text-yellow-200 text-sm flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-base">⚠️</span>
              <span>
                Your password is considered weak. For stronger protection, please update it from your profile settings.
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
            Manage your academy and oversee all operations
          </p>
        </motion.div>

        {/* Pending Actions Strip (Admin only) */}
        {user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{
              opacity: 1,
              y: 0,
              ...(shouldAnimatePendingStrip
                ? {
                    boxShadow: [
                      '0 0 0 0 rgba(129, 140, 248, 0)',
                      '0 0 0 10px rgba(129, 140, 248, 0.35)',
                      '0 0 0 0 rgba(129, 140, 248, 0)'
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
            className={`sticky top-0 z-30 mb-6 rounded-md px-4 py-2 text-sm md:text-base flex flex-wrap items-center gap-3 border ${
              hasPending
                ? 'bg-gradient-to-r from-indigo-50 via-sky-50 to-purple-50 dark:from-indigo-900/40 dark:via-slate-900/60 dark:to-purple-900/40 text-indigo-950 dark:text-indigo-50 border-indigo-500 dark:border-indigo-400 shadow-lg'
                : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200'
            }`}
          >
            {hasPending ? (
              <>
                <span className="font-bold text-base md:text-lg flex items-center gap-2 tracking-wide">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Pending actions:</span>
                </span>

                <button
                  type="button"
                  onClick={() => navigate('/admin/instructor-payments')}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-yellow-100 dark:bg-yellow-900/40 text-yellow-800 dark:text-yellow-200 hover:bg-yellow-200 dark:hover:bg-yellow-800 transition-colors"
                >
                  <span className="font-extrabold text-red-200 md:text-red-300 text-lg leading-none">
                    {pendingSummary.payouts}
                  </span>
                  <span>instructor payouts</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/admin/payment-verification')}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
                >
                  <span className="font-extrabold text-red-200 md:text-red-300 text-lg leading-none">
                    {pendingSummary.studentPayments}
                  </span>
                  <span>student payments</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/admin/delete-requests')}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-200 hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                >
                  <span className="font-extrabold text-red-200 md:text-red-300 text-lg leading-none">
                    {pendingSummary.deleteRequests}
                  </span>
                  <span>delete requests</span>
                </button>

                {pendingSummary.pendingCourses > 0 && (
                  <button
                    type="button"
                    onClick={() => navigate('/admin/courses')}
                    className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-200 dark:hover:bg-emerald-800 transition-colors"
                  >
                    <span className="font-extrabold text-red-200 md:text-red-300 text-lg leading-none">
                      {pendingSummary.pendingCourses}
                    </span>
                    <span>pending course approvals</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => navigate('/admin/instructor-applications')}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors"
                >
                  <span className="font-extrabold text-red-200 md:text-red-300 text-lg leading-none">
                    {pendingSummary.applications}
                  </span>
                  <span>instructor applications</span>
                </button>

                <button
                  type="button"
                  onClick={() => navigate('/admin/instructor-agreements')}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-800 dark:text-indigo-200 hover:bg-indigo-200 dark:hover:bg-indigo-800 transition-colors"
                >
                  <span className="font-extrabold text-red-200 md:text-red-300 text-lg leading-none">
                    {pendingSummary.agreements}
                  </span>
                  <span>rejected agreements</span>
                </button>
              </>
            ) : (
              <span className="flex items-center gap-2">
                <span role="img" aria-label="no pending">
                  🎉
                </span>
                <span>No pending actions</span>
              </span>
            )}
          </motion.div>
        )}

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
        >
          {[
            {
              title: 'Total Students',
              value: stats.students,
              icon: <Users className="w-6 h-6" />,
              color: 'bg-blue-500',
              borderColor: 'border-blue-500/60 dark:border-blue-400/60',
              change: '+12%'
            },
            {
              title: 'Instructors',
              value: stats.instructors,
              icon: <UserCheck className="w-6 h-6" />,
              color: 'bg-green-500',
              borderColor: 'border-green-500/60 dark:border-green-400/60',
              change: '+5%'
            },
            {
              title: 'Active Courses',
              value: stats.courses,
              icon: <BookOpen className="w-6 h-6" />,
              color: 'bg-purple-500',
              borderColor: 'border-purple-500/60 dark:border-purple-400/60',
              change: '+8%'
            },
            {
              title: 'Pending Enrollments',
              value: stats.pendingEnrollments,
              icon: <Clock className="w-6 h-6" />,
              color: 'bg-yellow-500',
              borderColor: 'border-yellow-500/60 dark:border-yellow-400/60',
              change: '3 new'
            }
          ].map((stat, index) => (
            <div
              key={index}
              className={`card border-2 ${stat.borderColor || 'border-gray-200 dark:border-gray-700'}`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stat.value}
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {stat.change}
                  </p>
                </div>
                <div className={`p-3 rounded-lg ${stat.color} text-white`}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
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
            <Link to="/admin/students" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Manage Students
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View and manage student accounts
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/youtube-videos" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Hosted Video Library
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review and manage video lifecycle
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/youtube-configuration" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-red-200 dark:border-red-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-red-600 dark:text-red-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M23.498 6.186a2.99 2.99 0 0 0-2.104-2.116C19.516 3.5 12 3.5 12 3.5s-7.516 0-9.394.57A2.99 2.99 0 0 0 .502 6.186C0 8.072 0 12 0 12s0 3.928.502 5.814a2.99 2.99 0 0 0 2.104 2.116C4.484 20.5 12 20.5 12 20.5s7.516 0 9.394-.57a2.99 2.99 0 0 0 2.104-2.116C24 15.928 24 12 24 12s0-3.928-.502-5.814zM9.75 15.5v-7l6.5 3.5-6.5 3.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    YouTube Configuration
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Connect & monitor platform uploads
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/telegram-files" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-blue-200 dark:border-blue-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Paperclip className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Telegram Files
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Audit & manage Telegram file lifecycle
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/delete-requests" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left border-2 border-red-200 dark:border-red-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Delete Requests
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review course & group delete requests from instructors
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/instructors" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-green-200 dark:border-green-700">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-lg">
                  <UserCheck className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Manage Instructors
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Add and manage instructors
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/payment-verification" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-emerald-200 dark:border-emerald-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Students Payments
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Verify student payments
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/instructor-payments" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Instructor Payments
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage instructor payouts
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/payment-earnings" className="card hover:shadow-lg transition-shadow duration-300 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-2 border-green-200 dark:border-green-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-green-600 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    💰 Payment Earnings
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Platform revenue dashboard
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/instructor-agreements" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Instructors Agreement
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage instructor agreements and history
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/certificates" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Certificate Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage all certificates
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/admin/discounts" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-red-200 dark:border-red-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                  <Tag className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Discount Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage course discounts
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/admin/courses" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left border-2 border-purple-200 dark:border-purple-700">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <BookOpen className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Course Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    View, edit, and manage all courses
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/admin/categories" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left border-2 border-orange-200 dark:border-orange-700">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-lg">
                  <Tag className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Category Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Organize and manage course categories
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/admin/levels" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left border-2 border-purple-200 dark:border-purple-700">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-purple-100 dark:bg-purple-900 rounded-lg">
                  <BarChart3 className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Level Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Organize and manage course difficulty levels
                  </p>
                </div>
              </div>
            </Link>

            {/* Backup Management */}
            <Link to="/admin/backup" className="card hover:shadow-lg transition-shadow duration-300 border-2 border-indigo-200 dark:border-indigo-700">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <Database className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Backup Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Send full backups, restore from JSON, and run cleanup</p>
                </div>
              </div>
            </Link>

            <Link to="/admin/instructor-applications" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left border-2 border-pink-200 dark:border-pink-700">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-pink-100 dark:bg-pink-900 rounded-lg">
                  <UserCheck className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Instructor Applications
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Review and approve new instructors
                  </p>
                </div>
              </div>
            </Link>

            <Link to="/admin/global-settings" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-2 border-orange-200 dark:border-orange-700">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-orange-600 rounded-lg">
                  <Settings className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    ⚙️ Global Settings
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Configure platform settings
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/gamification" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-2 border-yellow-200 dark:border-yellow-700">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-yellow-500 rounded-lg">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21l4-4 4 4M12 17V3m0 0l4 4m-4-4L8 7" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    🏆 Gamification Management
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage points, badges, and titles
                  </p>
                </div>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Pending Course Approvals moved to /admin/courses page */}
      </div>
    </div>
  );
};

export default AdminDashboard;
