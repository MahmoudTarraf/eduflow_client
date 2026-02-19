import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  UserCheck,
  Edit,
  Trash2,
  Search,
  Mail,
  BookOpen,
  ArrowLeft,
  X,
  Save,
  CheckCircle,
  XCircle,
  Ban,
  PauseCircle,
  PlayCircle,
  RefreshCcw,
  Eye
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AdminInstructors = () => {
  const { t } = useTranslation();
  const [instructors, setInstructors] = useState([]);
  const [filteredInstructors, setFilteredInstructors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedInstructor, setSelectedInstructor] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [viewInstructor, setViewInstructor] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [banConfirm, setBanConfirm] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banning, setBanning] = useState(false);
  const [suspendConfirm, setSuspendConfirm] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspending, setSuspending] = useState(false);
  const [instructorSuspensionChecklist, setInstructorSuspensionChecklist] = useState({
    createEditDeleteLectures: false,
    createEditDeleteAssignments: false,
    manageActiveTests: false,
    manageGroupsSections: false,
    createEditDeleteCourses: false,
    createDisableDiscounts: false,
    removeStudents: false,
    gradeAssignments: false,
    issueCertificates: false,
    requestPayout: false
  });
  const [resettingLimitsUserId, setResettingLimitsUserId] = useState(null);

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
    fetchInstructors();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = instructors.filter(instructor =>
        instructor.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        instructor.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredInstructors(filtered);
    } else {
      setFilteredInstructors(instructors);
    }
  }, [searchTerm, instructors]);

  const fetchInstructors = async () => {
    try {
      setLoading(true);
      // Admin list should include deleted instructors for recordkeeping
      const response = await axios.get('/api/users/instructors?includeDeleted=true');
      const instructorsData = response.data.instructors || [];

      // Fetch courses for each instructor
      const instructorsWithCourses = await Promise.all(
        instructorsData.map(async (instructor) => {
          try {
            const coursesRes = await axios.get(`/api/courses?instructor=${instructor._id}`);
            return {
              ...instructor,
              courses: coursesRes.data.courses || []
            };
          } catch (error) {
            return {
              ...instructor,
              courses: []
            };
          }
        })
      );

      setInstructors(instructorsWithCourses);
      setFilteredInstructors(instructorsWithCourses);
    } catch (error) {
      console.error('Error fetching instructors:', error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (instructor) => {
    setSelectedInstructor(instructor);
    setEditForm({
      name: instructor.name,
      email: instructor.email
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedInstructor(null);
    setEditForm({ name: '', email: '' });
  };

  const openViewModal = (instructor) => {
    setViewInstructor(instructor);
  };

  const closeViewModal = () => {
    setViewInstructor(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/users/${selectedInstructor._id}`, editForm);
      await fetchInstructors();
      closeEditModal();
    } catch (error) {
      console.error('Error updating instructor:', error);
      const message = getApiErrorMessage(error, 'Failed to update instructor');
      toast.error(message);
    }
  };

  const handleResetChangeLimits = async (instructorId, instructorName) => {
    if (
      !window.confirm(
        t('resetChangeLimitsConfirm', { name: instructorName }) ||
          `Reset email/phone change limits for ${instructorName}? This will allow them to change email and phone again.`
      )
    ) {
      return;
    }

    try {
      setResettingLimitsUserId(instructorId);
      await axios.put(`/api/users/${instructorId}/reset-change-limits`);
      await fetchInstructors();
      toast.success(t('resetChangeLimitsSuccess') || 'Email/phone change limits have been reset.');
    } catch (error) {
      console.error('Reset change limits failed:', error);
      const message = getApiErrorMessage(
        error,
        t('resetChangeLimitsFailed') || 'Failed to reset email/phone change limits'
      );
      toast.error(message);
    } finally {
      setResettingLimitsUserId(null);
    }
  };

  const handleDelete = async (instructorId) => {
    try {
      await axios.delete(`/api/users/${instructorId}`);
      await fetchInstructors();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting instructor:', error);
      const message = getApiErrorMessage(error, 'Failed to delete instructor');
      toast.error(message);
    }
  };

  const handleBan = async () => {
    if (!banConfirm || !banReason.trim()) {
      toast.error('Please provide a ban reason');
      return;
    }
    
    try {
      setBanning(true);
      await axios.put(`/api/users/${banConfirm.id}/ban`, { reason: banReason });
      await fetchInstructors();
      setBanConfirm(null);
      setBanReason('');
      toast.success('Instructor banned successfully');
    } catch (error) {
      console.error('Ban failed:', error);
      const message = getApiErrorMessage(error, 'Failed to ban instructor');
      toast.error(message);
    } finally {
      setBanning(false);
    }
  };

  const handleUnban = async (instructorId, instructorName) => {
    if (!window.confirm(`Are you sure you want to unban ${instructorName}?`)) return;
    
    try {
      await axios.put(`/api/users/${instructorId}/unban`);
      await fetchInstructors();
      toast.success('Instructor unbanned successfully');
    } catch (error) {
      console.error('Unban failed:', error);
      const message = getApiErrorMessage(error, 'Failed to unban instructor');
      toast.error(message);
    }
  };

  const handleResetIntroVideo = async (instructorId, instructorName) => {
    if (!window.confirm(`Reset intro video upload attempts for ${instructorName}? Instructor will be able to reupload again (limit resets to 0).`)) return;
    try {
      await axios.put(`/api/instructor/admin/${instructorId}/reset-intro-video`);
      toast.success('Intro video reupload attempts reset successfully.');
    } catch (error) {
      console.error('Reset intro video failed:', error);
      const message = getApiErrorMessage(error, 'Failed to reset intro video status');
      toast.error(message);
    }
  };

  const handleToggleTrust = async (instructorId, trustStatus) => {
    const action = trustStatus ? 'trust' : 'untrust';
    const instructor = instructors.find(i => i._id === instructorId);
    
    if (!window.confirm(
      `Are you sure you want to ${action} ${instructor?.name}?\n\n` +
      (trustStatus 
        ? '✅ Trusted instructors can create and publish courses without admin approval.' 
        : '⚠️ This instructor will need admin approval for all new courses.')
    )) return;
    
    try {
      await axios.put(`/api/users/instructor/${instructorId}/trust`, { trusted: trustStatus });
      await fetchInstructors();
      toast.success(`Instructor ${trustStatus ? 'trusted' : 'untrusted'} successfully`);
    } catch (error) {
      console.error('Toggle trust failed:', error);
      const message = getApiErrorMessage(error, 'Failed to update instructor trust status');
      toast.error(message);
    }
  };

  const handleSuspend = async () => {
    if (!suspendConfirm || !suspensionReason.trim()) {
      toast.error('Please provide a suspension reason');
      return;
    }
    
    // Check if at least one restriction is selected
    const hasRestrictions = Object.values(instructorSuspensionChecklist).some(checked => checked);
    if (!hasRestrictions) {
      toast.error('Please select at least one restriction to apply');
      return;
    }
    
    try {
      setSuspending(true);
      await axios.put(`/api/users/${suspendConfirm.id}/suspend`, { 
        reason: suspensionReason,
        restrictions: instructorSuspensionChecklist
      });
      await fetchInstructors();
      setSuspendConfirm(null);
      setSuspensionReason('');
      setInstructorSuspensionChecklist({
        createEditDeleteLectures: false,
        createEditDeleteAssignments: false,
        manageActiveTests: false,
        manageGroupsSections: false,
        createEditDeleteCourses: false,
        createDisableDiscounts: false,
        removeStudents: false,
        gradeAssignments: false,
        issueCertificates: false,
        requestPayout: false
      });
      toast.success('Instructor suspended successfully');
    } catch (error) {
      console.error('Suspend failed:', error);
      const message = getApiErrorMessage(error, 'Failed to suspend instructor');
      toast.error(message);
    } finally {
      setSuspending(false);
    }
  };

  const handleUnsuspend = async (instructorId, instructorName) => {
    if (!window.confirm(`Are you sure you want to unsuspend ${instructorName}?`)) return;
    
    try {
      await axios.put(`/api/users/${instructorId}/unsuspend`);
      await fetchInstructors();
      toast.success('Instructor unsuspended successfully');
    } catch (error) {
      console.error('Unsuspend failed:', error);
      const message = getApiErrorMessage(error, 'Failed to unsuspend instructor');
      toast.error(message);
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
                Instructor Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage all instructors and their courses
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search instructors..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Instructors List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4"
        >
          {filteredInstructors.length === 0 ? (
            <div className="card text-center py-12">
              <UserCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No instructors found' : 'No instructors yet'}
              </p>
            </div>
          ) : (
            filteredInstructors.map((instructor) => {
              const isDeletedInstructor = instructor.isDeleted || instructor.status === 'deleted';

              return (
                <div key={instructor._id} className="card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                          <UserCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {instructor.name}
                            </h3>
                            {instructor.approved ? (
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            {instructor.trustedInstructor && (
                              <span className="px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 text-xs font-medium rounded-full flex items-center">
                                <UserCheck className="w-3 h-3 mr-1 fill-current" />
                                Trusted
                              </span>
                            )}
                            {isDeletedInstructor && (
                              <span className="px-2 py-1 bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 text-xs font-semibold rounded-full">
                                Deleted Instructor
                              </span>
                            )}
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                            <Mail className="w-4 h-4" />
                            <span>{instructor.email}</span>
                          </div>
                          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                            <span>
                              {t('emailChangesRemaining') || 'Email changes remaining'}:{' '}
                              {Math.max(0, 1 - (instructor.emailChangeCount || 0))}
                            </span>
                            <span>
                              {t('phoneChangesRemaining') || 'Phone changes remaining'}:{' '}
                              {Math.max(0, 1 - (instructor.phoneChangeCount || 0))}
                            </span>
                          </div>
                        </div>
                      </div>

                    {/* Created Courses */}
                    {instructor.courses && instructor.courses.length > 0 && (
                      <div className="mt-4 ml-13">
                        <div className="flex items-center space-x-2 mb-2">
                          <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Created Courses ({instructor.courses.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {instructor.courses.map((course) => (
                            <div
                              key={course._id}
                              className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {course.name}
                                </p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">
                                  {course.category} • {course.level}
                                </p>
                              </div>
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {course.groups?.length || 0} groups
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    {/* Trust/Untrust Button */}
                    <button
                      onClick={() => handleToggleTrust(instructor._id, !instructor.trustedInstructor)}
                      disabled={isDeletedInstructor}
                      className={`p-2 rounded-lg transition-colors ${
                        instructor.trustedInstructor
                          ? 'text-yellow-600 hover:bg-yellow-50 dark:text-yellow-400 dark:hover:bg-yellow-900/20'
                          : 'text-gray-600 hover:bg-gray-50 dark:text-gray-400 dark:hover:bg-gray-700'
                      }`}
                      title={instructor.trustedInstructor ? 'Untrust Instructor (Require Approval)' : 'Trust Instructor (Auto-Approve Courses)'}
                    >
                      <UserCheck className={`w-5 h-5 ${instructor.trustedInstructor ? 'fill-current' : ''}`} />
                    </button>
                    <button
                      onClick={() => openViewModal(instructor)}
                      className="p-2 text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="View Profile"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => openEditModal(instructor)}
                      disabled={isDeletedInstructor}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit Instructor"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    {instructor.isBanned ? (
                      <button 
                        onClick={() => handleUnban(instructor._id, instructor.name)} 
                        disabled={isDeletedInstructor}
                        className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors" 
                        title="Unban Instructor"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setBanConfirm({ id: instructor._id, name: instructor.name })} 
                        disabled={isDeletedInstructor}
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 rounded-lg transition-colors" 
                        title="Ban Instructor"
                      >
                        <Ban className="w-5 h-5" />
                      </button>
                    )}
                    {/* Suspend/Unsuspend Button */}
                    {instructor.isSuspended ? (
                      <button 
                        onClick={() => handleUnsuspend(instructor._id, instructor.name)} 
                        disabled={isDeletedInstructor}
                        className="p-2 text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20 rounded-lg transition-colors" 
                        title="Unsuspend Instructor"
                      >
                        <PlayCircle className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSuspendConfirm({ id: instructor._id, name: instructor.name })} 
                        disabled={isDeletedInstructor}
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-colors" 
                        title="Suspend Instructor"
                      >
                        <PauseCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleResetChangeLimits(instructor._id, instructor.name)}
                      disabled={isDeletedInstructor || resettingLimitsUserId === instructor._id}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t('resetChangeLimitsTooltip') || 'Reset email/phone change limits'}
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(instructor._id)}
                      disabled={isDeletedInstructor}
                      className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete Instructor"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleResetIntroVideo(instructor._id, instructor.name)}
                      disabled={isDeletedInstructor}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                      title="Reset intro video uploads (allow reupload)"
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
              );
            })
          )}
        </motion.div>
      </div>

      {viewInstructor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Instructor Profile
              </h2>
              <button
                onClick={closeViewModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Name</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {viewInstructor.name}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Email</p>
                <p className="text-base text-gray-900 dark:text-white break-all">
                  {viewInstructor.email}
                </p>
                {viewInstructor.deletedEmail && (
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Original email: {viewInstructor.deletedEmail}
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2">
                {viewInstructor.approved ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-600" />
                )}
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {viewInstructor.approved ? 'Approved instructor' : 'Not approved'}
                </span>
                {(viewInstructor.isDeleted || viewInstructor.status === 'deleted') && (
                  <span className="ml-2 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                    Deleted Instructor
                  </span>
                )}
              </div>

              {Array.isArray(viewInstructor.courses) && viewInstructor.courses.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white mb-2">
                    Courses ({viewInstructor.courses.length})
                  </p>
                  <div className="space-y-2">
                    {viewInstructor.courses.map((course) => (
                      <div
                        key={course._id}
                        className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {course.name}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">
                            {course.category} • {course.level}
                          </p>
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">
                          {course.groups?.length || 0} groups
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Edit Instructor
              </h2>
              <button
                onClick={closeEditModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 btn-primary flex items-center justify-center space-x-2"
                >
                  <Save className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="flex-1 btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Ban Confirmation Dialog */}
      {banConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Ban Instructor
              </h2>
              <button
                onClick={() => {
                  setBanConfirm(null);
                  setBanReason('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to ban <strong>{banConfirm.name}</strong>? They will not be able to log in until unbanned.
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Ban Reason (required)
              </label>
              <textarea
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500"
                rows={3}
                placeholder="Explain why this instructor is being banned..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleBan}
                disabled={banning || !banReason.trim()}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {banning ? 'Banning...' : 'Ban Instructor'}
              </button>
              <button
                onClick={() => {
                  setBanConfirm(null);
                  setBanReason('');
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Suspend Confirmation Dialog */}
      {suspendConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Suspend Instructor
              </h2>
              <button
                onClick={() => {
                  setSuspendConfirm(null);
                  setSuspensionReason('');
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Suspending <strong>{suspendConfirm.name}</strong> will restrict their access based on the selected permissions below.
            </p>

            {/* Instructor Suspension Checklist */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Permissions to Restrict:
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {[
                  { key: 'createEditDeleteLectures', label: 'Create / Edit / Delete lectures and videos' },
                  { key: 'createEditDeleteAssignments', label: 'Create / Edit / Delete assignments and projects' },
                  { key: 'manageActiveTests', label: 'Manage active tests' },
                  { key: 'manageGroupsSections', label: 'Create / Edit / Delete groups and sections' },
                  { key: 'createEditDeleteCourses', label: 'Create / Edit / Delete courses' },
                  { key: 'createDisableDiscounts', label: 'Create / Disable discounts' },
                  { key: 'removeStudents', label: 'Remove students from group or course' },
                  { key: 'gradeAssignments', label: 'Grade assignments and projects' },
                  { key: 'issueCertificates', label: 'Issue certificates' },
                  { key: 'requestPayout', label: 'Request payout' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={instructorSuspensionChecklist[key]}
                      onChange={(e) => setInstructorSuspensionChecklist(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500 mt-0.5"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300 leading-tight">{label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Suspension Reason *
              </label>
              <textarea
                value={suspensionReason}
                onChange={(e) => setSuspensionReason(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 dark:bg-gray-700 dark:text-white resize-none"
                rows="3"
                placeholder="Enter the reason for suspension (minimum 5 characters)..."
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleSuspend}
                disabled={suspending || !suspensionReason.trim() || suspensionReason.length < 5 || !Object.values(instructorSuspensionChecklist).some(checked => checked)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {suspending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Suspending...
                  </>
                ) : (
                  'Suspend Instructor'
                )}
              </button>
              <button
                onClick={() => {
                  setSuspendConfirm(null);
                  setSuspensionReason('');
                }}
                className="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto"
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

            <div className="text-gray-600 dark:text-gray-400 mb-6 text-sm space-y-4">
              <p>
                Deleting an instructor will <span className="font-semibold">soft-delete their account</span> while
                keeping all teaching history, courses, and financial records intact.
              </p>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">What WILL be deleted</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Instructor’s login access (account is marked as deleted and cannot log in).</li>
                  <li>Instructor’s personal profile fields (email, phone, country, city, school, bio, social links).</li>
                  <li>Instructor application form (InstructorApplication).</li>
                  <li>Instructor payout settings and payment receivers.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">What will NOT be deleted</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Courses created by this instructor (they remain published/visible).</li>
                  <li>Students enrolled in those courses, their enrollments, progress, grades, and attempts.</li>
                  <li>All course content: sections, lessons, quizzes, assignments, files, and videos.</li>
                  <li>Messages and conversation history between the instructor and students.</li>
                  <li>Notifications sent by this instructor.</li>
                  <li>Certificates issued by the course.</li>
                  <li>All payments, transactions, and earnings history.</li>
                  <li>All PDF agreements and signed revenue split documents.</li>
                  <li>InstructorAgreement records and signup agreement documents (they remain viewable & downloadable).</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">What will happen to the courses</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Courses keep all their content and enrolled students.</li>
                  <li>Courses are marked as <span className="font-semibold">orphaned</span> (no active owner).</li>
                  <li>The <code>instructor</code> field is set to <code>null</code>, and <code>originalInstructor</code> is locked to this instructor.</li>
                  <li>You can later assign a new owner from <span className="font-semibold">Admin → Course Management → Change Course Owner</span>.</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-gray-100 mb-1">Messages and admin views</p>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Messages between the instructor and students remain intact with the original name snapshot.</li>
                  <li>No messages are deleted.</li>
                  <li>In admin financial and agreement views, this instructor will be labeled as
                    <span className="ml-1 font-semibold">“Deleted Instructor”.</span>
                  </li>
                </ul>
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                After deletion, the instructor’s email and phone become available for reuse, but all legal and financial
                records remain permanently stored for audit and tax purposes.
              </p>
            </div>

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
    </div>
  );
};

export default AdminInstructors;
