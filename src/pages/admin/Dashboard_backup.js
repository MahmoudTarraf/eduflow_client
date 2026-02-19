// Backup created before fixing syntax error
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  BookOpen, 
  UserCheck, 
  Settings,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Clock,
  Tag,
  BarChart3,
  Database
} from 'lucide-react';
import axios from 'axios';

import { useAuth } from '../../contexts/AuthContext';
import RejectedAgreements from '../../components/admin/RejectedAgreements';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const { user, weakPassword } = useAuth();
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
  const [agreements, setAgreements] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const [studentsResponse, instructorsResponse, coursesResponse, groupsResponse, pendingResponse, pendingCoursesResponse, allDiscountsResponse, agreementsResponse] = await Promise.all([
        axios.get('/api/users/students'),
        axios.get('/api/users/instructors'),
        axios.get('/api/courses'),
        axios.get('/api/groups'),
        axios.get('/api/users/instructors/pending'),
        axios.get('/api/courses/pending'),
        axios.get('/api/courses/discounts/all'),
        axios.get('/api/instructor-agreements', { headers: { Authorization: `Bearer ${token}` } })
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
      setAgreements(agreementsResponse.data.data || []);

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
      alert('Failed to reject instructor');
    } finally {
      setProcessingIds((ids) => ids.filter((x) => x !== id));
    }
  };

  const approveCourse = async (id) => {
    try {
      setProcessingIds((ids) => [...ids, `course-${id}`]);
      await axios.put(`/api/courses/${id}/approve`);
      await fetchData(); // Refresh data
      alert('Course approved successfully!');
    } catch (error) {
      console.error('Error approving course:', error);
      alert('Failed to approve course');
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
      alert('Course rejected.');
    } catch (error) {
      console.error('Error rejecting course:', error);
      alert('Failed to reject course');
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
              change: '+12%'
            },
            {
              title: 'Instructors',
              value: stats.instructors,
              icon: <UserCheck className="w-6 h-6" />,
              color: 'bg-green-500',
              change: '+5%'
            },
            {
              title: 'Active Courses',
              value: stats.courses,
              icon: <BookOpen className="w-6 h-6" />,
              color: 'bg-purple-500',
              change: '+8%'
            },
            {
              title: 'Pending Enrollments',
              value: stats.pendingEnrollments,
              icon: <Clock className="w-6 h-6" />,
              color: 'bg-yellow-500',
              change: '3 new'
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

        {/* Rejected Agreements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.18 }}
          className="mb-8"
        >
          <RejectedAgreements 
            agreements={agreements} 
            onUpdate={fetchData} 
          />
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
            <Link to="/admin/students" className="card hover:shadow-lg transition-shadow duration-300">
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
            <Link to="/admin/delete-requests" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
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
            <Link to="/admin/instructors" className="card hover:shadow-lg transition-shadow duration-300">
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
            <Link to="/admin/payment-verification" className="card hover:shadow-lg transition-shadow duration-300">
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
            <Link to="/admin/instructor-payments" className="card hover:shadow-lg transition-shadow duration-300">
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
            <Link to="/admin/instructor-agreements" className="card hover:shadow-lg transition-shadow duration-300">
              <div className="flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg">
                  <svg className="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Instructor Agreements
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Manage earnings agreements
                  </p>
                </div>
              </div>
            </Link>
            <Link to="/admin/certificates" className="card hover:shadow-lg transition-shadow duration-300">
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

            <Link to="/admin/discounts" className="card hover:shadow-lg transition-shadow duration-300">
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

            <div className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
              <Link to="/admin/courses" className="flex items-center space-x-4 mb-3">
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
              </Link>

              {/* Inline Pending Course Approvals */}
              {pendingCourses.length > 0 && (
                <div className="mt-2 border-t border-gray-200 dark:border-gray-700 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      Pending Approvals ({pendingCourses.length})
                    </span>
                    <Link
                      to="/admin/courses/pending"
                      className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                    >
                      View all
                    </Link>
                  </div>
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {pendingCourses.map((course) => (
                      <div
                        key={course._id}
                        className="flex items-start justify-between p-2 rounded-md bg-gray-50 dark:bg-gray-800"
                      >
                        <div className="flex-1 mr-2">
                          <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-1">
                            {course.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-1">
                            {course.instructor?.name || 'Unknown instructor'} • {course.category} • {course.level}
                          </p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              approveCourse(course._id);
                            }}
                            disabled={processingIds.includes(`course-${course._id}`)}
                            className="inline-flex items-center justify-center px-2 py-1 text-xs rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {processingIds.includes(`course-${course._id}`) ? '...' : 'Approve'}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              rejectCourse(course._id);
                            }}
                            disabled={processingIds.includes(`course-${course._id}`)}
                            className="inline-flex items-center justify-center px-2 py-1 text-xs rounded-md bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 disabled:opacity-50"
                          >
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Link to="/admin/categories" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
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

            <Link to="/admin/levels" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
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
            <Link to="/admin/backup" className="card hover:shadow-lg transition-shadow duration-300">
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

            <Link to="/admin/instructor-applications" className="card hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 text-left">
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

        {/* Pending Course Approvals */}
        {pendingCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-8"
          >
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Pending Course Approvals
          </h2>
          <div className="card">
            <div className="space-y-4">
              {pendingCourses.map((course) => (
                <div key={course._id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white text-lg">{course.name}</p>
                    <div className="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
                      <span>Instructor: {course.instructor?.name}</span>
                      <span>Category: {course.category}</span>
                      <span>Level: {course.level}</span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{course.description}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => approveCourse(course._id)}
                      disabled={processingIds.includes(`course-${course._id}`)}
                      className="btn-primary flex items-center gap-2 px-4 py-2"
                    >
                      <CheckCircle className="w-4 h-4" />
                      {processingIds.includes(`course-${course._id}`) ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => rejectCourse(course._id)}
                      disabled={processingIds.includes(`course-${course._id}`)}
                      className="btn-secondary flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
                    >
                      <AlertCircle className="w-4 h-4" />
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
