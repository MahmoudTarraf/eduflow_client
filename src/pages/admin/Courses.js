import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { 
  BookOpen, 
  Trash2, 
  Users, 
  X,
  ArrowLeft,
  Search,
  Eye,
  Edit,
  FolderOpen,
  FileText,
  CheckCircle,
  AlertCircle,
  User
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';

const AdminCourses = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [pendingCourses, setPendingCourses] = useState([]);
  const [processingIds, setProcessingIds] = useState([]);
  const [reassignModal, setReassignModal] = useState(null); // { course, newInstructorId }
  const [instructors, setInstructors] = useState([]);
  const [loadingInstructors, setLoadingInstructors] = useState(false);
  const [reassigning, setReassigning] = useState(false);

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

  useEffect(() => {
    fetchCourses();
    fetchPendingCourses();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = courses.filter(course =>
        course.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCourses(filtered);
    } else {
      setFilteredCourses(courses);
    }
  }, [searchTerm, courses]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/courses/all', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const coursesData = response.data.courses || [];

      // Fetch groups for each course with rate limiting
      const coursesWithGroups = [];
      for (const course of coursesData) {
        try {
          const groupsRes = await axios.get(`/api/groups?course=${course._id}`);
          coursesWithGroups.push({
            ...course,
            groupsList: groupsRes.data.groups || []
          });
          // Add small delay to avoid rate limiting (50ms between requests)
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Error fetching groups for course ${course._id}:`, error);
          coursesWithGroups.push({
            ...course,
            groupsList: []
          });
        }
      }

      setCourses(coursesWithGroups);
      setFilteredCourses(coursesWithGroups);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCourses = async () => {
    try {
      const res = await axios.get('/api/courses/pending');
      setPendingCourses(res.data.courses || []);
    } catch (error) {
      console.error('Error fetching pending courses:', error);
    }
  };

  const approveCourse = async (id) => {
    try {
      setProcessingIds((ids) => [...ids, `course-${id}`]);
      await axios.put(`/api/courses/${id}/approve`);
      await Promise.all([fetchPendingCourses(), fetchCourses()]);
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
      await Promise.all([fetchPendingCourses(), fetchCourses()]);
      toast.success('Course rejected.');
    } catch (error) {
      console.error('Error rejecting course:', error);
      const message = getApiErrorMessage(error, 'Failed to reject course');
      toast.error(message);
    } finally {
      setProcessingIds((ids) => ids.filter((x) => x !== `course-${id}`));
    }
  };

  const handleDelete = async (courseId) => {
    try {
      await axios.delete(`/api/courses/${courseId}`);
      await fetchCourses();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting course:', error);
      const message = getApiErrorMessage(error, 'Failed to delete course');
      toast.error(message);
    }
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleManageGroups = (courseId) => {
    navigate(`/app/courses/${courseId}/groups`);
  };

  const handleEditCourse = (courseId) => {
    navigate(`/admin/courses/${courseId}/edit`);
  };

  const handleManageSections = (courseId) => {
    navigate(`/admin/courses/${courseId}/sections`);
  };

  const handleManageContent = (courseId) => {
    navigate(`/admin/courses/${courseId}/content`);
  };

  const fetchInstructorsForReassign = async () => {
    try {
      setLoadingInstructors(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/instructors', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setInstructors(response.data.instructors || []);
    } catch (error) {
      console.error('Error fetching instructors:', error);
      toast.error('Failed to load instructors');
    } finally {
      setLoadingInstructors(false);
    }
  };

  const handleOpenReassignModal = async (course) => {
    setReassignModal({ course, newInstructorId: '' });
    if (!instructors || instructors.length === 0) {
      await fetchInstructorsForReassign();
    }
  };

  const handleReassignOwner = async () => {
    if (!reassignModal?.newInstructorId) {
      toast.error('Please select a new instructor');
      return;
    }

    try {
      setReassigning(true);
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/courses/${reassignModal.course._id}/reassign-instructor`,
        { newInstructorId: reassignModal.newInstructorId },
        token ? { headers: { Authorization: `Bearer ${token}` } } : {}
      );
      toast.success('Course owner changed successfully');
      await fetchCourses();
      setReassignModal(null);
    } catch (error) {
      console.error('Error changing course owner:', error);
      const message = getApiErrorMessage(error, 'Failed to change course owner');
      toast.error(message);
    } finally {
      setReassigning(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
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
          <Link
            to="/admin"
            className="inline-flex items-center space-x-2 text-primary-600 hover:text-primary-700 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                Course Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage all courses and their groups
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search courses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pending Course Approvals */}
        {pendingCourses.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Pending Course Approvals
            </h2>
            <div className="card">
              <div className="space-y-4">
                {pendingCourses.map((course) => (
                  <div
                    key={course._id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                  >
                    <div className="flex-1 mr-4">
                      <p className="font-medium text-gray-900 dark:text-white text-lg">{course.name}</p>
                      <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
                        <span>Instructor: {course.instructor?.name}</span>
                        <span>Category: {course.category}</span>
                        <span>Level: {course.level}</span>
                      </div>
                      {course.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">{course.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
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

        {/* Courses Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {filteredCourses.length === 0 ? (
            <div className="col-span-full card text-center py-12">
              <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No courses found' : 'No courses yet'}
              </p>
            </div>
          ) : (
            filteredCourses.map((course) => (
              <div key={course._id} className="card hover:shadow-xl transition-shadow">
                {/* Course Image */}
                <div className="h-48 bg-gradient-to-br from-primary-500 to-primary-700 rounded-t-xl flex items-center justify-center">
                  {course.image ? (
                    <img
                      src={course.image}
                      alt={course.name}
                      className="w-full h-full object-cover rounded-t-xl"
                    />
                  ) : (
                    <BookOpen className="w-16 h-16 text-white" />
                  )}
                </div>

                <div className="p-6">
                  {/* Course Info */}
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {course.name}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {course.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-1 text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-200 rounded-full">
                        {course.category}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-full">
                        {course.level}
                      </span>
                    </div>
                    {course.isArchived && (
                      <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                        Archived
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  {course.totalPrice > 0 && (
                    <div className="mb-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total Price: <span className="font-bold text-gray-900 dark:text-white">{course.totalPrice.toLocaleString()} {course.currency || 'SYP'}</span>
                      </p>
                    </div>
                  )}

                  {/* Groups */}
                  <div className="flex items-center space-x-2 mb-4">
                    <Users className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {course.groupsList?.length || 0} groups
                    </span>
                  </div>

                  {/* Instructor / Ownership */}
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    <div>
                      <span className="font-semibold">Instructor:</span>{' '}
                      {course.isOrphaned || !course.instructor ? (
                        <span className="font-medium">Unassigned (orphaned)</span>
                      ) : (
                        <span className="font-medium inline-flex items-center space-x-2">
                          <span>{course.instructor.name}</span>
                          {(course.instructor.isDeleted || course.instructor.status === 'deleted') && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                              Deleted Instructor
                            </span>
                          )}
                        </span>
                      )}
                    </div>
                    {course.isOrphaned && course.originalInstructor && (
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Original instructor: {course.originalInstructor.name}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="space-y-2">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewCourse(course._id)}
                        className="flex-1 btn-secondary flex items-center justify-center space-x-1 text-sm"
                        title="View Course"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View</span>
                      </button>
                      <button
                        onClick={() => handleEditCourse(course._id)}
                        className="flex-1 btn-secondary flex items-center justify-center space-x-1 text-sm"
                        title="Edit Course"
                      >
                        <Edit className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(course._id)}
                        className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                        title="Delete Course"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleOpenReassignModal(course)}
                      className="btn-secondary w-full flex items-center justify-center space-x-2 text-sm"
                      title="Change Course Owner"
                    >
                      <User className="w-4 h-4" />
                      <span>Change Course Owner</span>
                    </button>
                    <button
                      onClick={() => handleManageGroups(course._id)}
                      className="btn-primary w-full flex items-center justify-center space-x-2"
                      title="Manage Groups"
                    >
                      <Users className="w-4 h-4" />
                      <span>Group Management</span>
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Confirm Delete
              </h2>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this course? This action cannot be undone and will remove all associated groups and enrollments.
            </p>

            <div className="flex space-x-3">
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 btn-secondary"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reassign Course Owner Modal */}
      {reassignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Change Course Owner
              </h2>
              <button
                onClick={() => setReassignModal(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                You are about to change the owner of this course:
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {reassignModal.course.name}
              </p>
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                The new instructor will immediately gain full access to manage this course and its groups.
                The previous instructor (even if still active) will lose the ability to edit, delete, or manage
                this course. All students, progress, payments, earnings, and agreements remain unchanged.
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select New Instructor
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={reassignModal.newInstructorId}
                onChange={(e) =>
                  setReassignModal((prev) => ({ ...prev, newInstructorId: e.target.value }))
                }
              >
                <option value="">Choose an instructor...</option>
                {instructors
                  .filter((inst) => !inst.isDeleted && inst.status !== 'deleted')
                  .map((inst) => (
                    <option key={inst._id} value={inst._id}>
                      {inst.name} ({inst.email})
                    </option>
                  ))}
              </select>
              {loadingInstructors && (
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Loading instructors...</p>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setReassignModal(null)}
                className="flex-1 btn-secondary"
                disabled={reassigning}
              >
                Cancel
              </button>
              <button
                onClick={handleReassignOwner}
                className="flex-1 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={reassigning || !reassignModal.newInstructorId}
              >
                {reassigning ? 'Changing Owner...' : 'Change Owner'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminCourses;
