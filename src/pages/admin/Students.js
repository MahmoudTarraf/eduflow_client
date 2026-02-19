import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import {
  Users,
  Edit,
  Trash2,
  Search,
  Mail,
  BookOpen,
  ArrowLeft,
  X,
  Save,
  Phone,
  MapPin,
  School,
  Award,
  TrendingUp,
  Ban,
  CheckCircle,
  DollarSign,
  Info,
  PauseCircle,
  PlayCircle,
  RefreshCcw
} from 'lucide-react';
import axios from 'axios';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import UserDeletionDialog from '../../components/admin/UserDeletionDialog';
import toast from 'react-hot-toast';

const AdminStudents = () => {
  const { t } = useTranslation();
  const [students, setStudents] = useState([]);
  const [pendingRegistrations, setPendingRegistrations] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [filteredPending, setFilteredPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    email: ''
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [banConfirm, setBanConfirm] = useState(null);
  const [banReason, setBanReason] = useState('');
  const [banning, setBanning] = useState(false);
  const [suspendConfirm, setSuspendConfirm] = useState(null);
  const [suspensionReason, setSuspensionReason] = useState('');
  const [suspending, setSuspending] = useState(false);
  const [suspensionChecklist, setSuspensionChecklist] = useState({
    enrollNewCourses: false,
    continueCourses: false,
    accessCoursePages: false,
    requestCertificate: false,
    changeProfile: false,
    changeSettings: false,
    dashboardAccess: false
  });
  const [resettingLimitsUserId, setResettingLimitsUserId] = useState(null);

  useEffect(() => {
    fetchStudents();
    fetchPendingRegistrations();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filteredS = students.filter(student =>
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredStudents(filteredS);
      
      const filteredP = pendingRegistrations.filter(pending =>
        pending.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pending.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPending(filteredP);
    } else {
      setFilteredStudents(students);
      setFilteredPending(pendingRegistrations);
    }
  }, [searchTerm, students, pendingRegistrations]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/users/students');
      const studentsData = response.data.students || [];
      
      // Backend already returns enriched data with progress, grades, and payment info
      // No need to fetch enrollments separately
      setStudents(studentsData);
      setFilteredStudents(studentsData);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingRegistrations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/users/pending-registrations', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const registrations = response.data.registrations || [];
      // Filter only student registrations
      const studentRegistrations = registrations.filter(r => r.role === 'student');
      setPendingRegistrations(studentRegistrations);
      setFilteredPending(studentRegistrations);
    } catch (error) {
      console.error('Error fetching pending registrations:', error);
    }
  };

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

  const handleDeletePending = async (id) => {
    if (!window.confirm('Are you sure you want to delete this pending registration?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`/api/users/pending-registrations/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      await fetchPendingRegistrations();
    } catch (error) {
      console.error('Error deleting pending registration:', error);
      toast.error('Failed to delete pending registration');
    }
  };

  const openEditModal = (student) => {
    setSelectedStudent(student);
    setEditForm({
      name: student.name,
      email: student.email
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedStudent(null);
    setEditForm({ name: '', email: '' });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/users/${selectedStudent._id}`, editForm);
      await fetchStudents();
      closeEditModal();
    } catch (error) {
      console.error('Error updating student:', error);
      const message = getApiErrorMessage(error, 'Failed to update student');
      toast.error(message);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
  };

  const handleBan = async () => {
    if (!banConfirm || !banReason.trim()) {
      toast.error('Please provide a ban reason');
      return;
    }
    
    try {
      setBanning(true);
      await axios.put(`/api/users/${banConfirm.id}/ban`, { reason: banReason });
      await fetchStudents();
      setBanConfirm(null);
      setBanReason('');
      toast.success('Student banned successfully');
    } catch (error) {
      console.error('Ban failed:', error);
      const message = getApiErrorMessage(error, 'Failed to ban student');
      toast.error(message);
    } finally {
      setBanning(false);
    }
  };

  const handleUnban = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to unban ${studentName}?`)) return;
    
    try {
      await axios.put(`/api/users/${studentId}/unban`);
      await fetchStudents();
      toast.success('Student unbanned successfully');
    } catch (error) {
      console.error('Unban failed:', error);
      const message = getApiErrorMessage(error, 'Failed to unban student');
      toast.error(message);
    }
  };

  const handleSuspend = async () => {
    if (!suspendConfirm || !suspensionReason.trim()) {
      toast.error('Please provide a suspension reason');
      return;
    }
    
    // Check if at least one restriction is selected
    const hasRestrictions = Object.values(suspensionChecklist).some(checked => checked);
    if (!hasRestrictions) {
      toast.error('Please select at least one restriction to apply');
      return;
    }
    
    try {
      setSuspending(true);
      await axios.put(`/api/users/${suspendConfirm.id}/suspend`, { 
        reason: suspensionReason,
        restrictions: suspensionChecklist
      });
      await fetchStudents();
      setSuspendConfirm(null);
      setSuspensionReason('');
      setSuspensionChecklist({
        enrollNewCourses: false,
        continueCourses: false,
        accessCoursePages: false,
        requestCertificate: false,
        changeProfile: false,
        changeSettings: false,
        dashboardAccess: false
      });
      toast.success('Student suspended successfully');
    } catch (error) {
      console.error('Suspend failed:', error);
      const message = getApiErrorMessage(error, 'Failed to suspend student');
      toast.error(message);
    } finally {
      setSuspending(false);
    }
  };

  const handleUnsuspend = async (studentId, studentName) => {
    if (!window.confirm(`Are you sure you want to unsuspend ${studentName}?`)) return;
    
    try {
      await axios.put(`/api/users/${studentId}/unsuspend`);
      await fetchStudents();
      toast.success('Student unsuspended successfully');
    } catch (error) {
      console.error('Unsuspend failed:', error);
      const message = getApiErrorMessage(error, 'Failed to unsuspend student');
      toast.error(message);
    }
  };

  const handleResetChangeLimits = async (studentId, studentName) => {
    if (
      !window.confirm(
        t('resetChangeLimitsConfirm', { name: studentName }) ||
          `Reset email/phone change limits for ${studentName}? This will allow them to change email and phone again.`
      )
    ) {
      return;
    }

    try {
      setResettingLimitsUserId(studentId);
      await axios.put(`/api/users/${studentId}/reset-change-limits`);
      await fetchStudents();
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
                Student Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Manage all students and their enrollments
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pending Student Registrations */}
        {filteredPending.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.05 }}
            className="mb-6"
          >
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
              <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-1">
                Pending Email Verifications ({filteredPending.length})
              </h3>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                These students have registered but haven't verified their email yet
              </p>
            </div>
            <div className="space-y-3">
              {filteredPending.map((pending) => (
                <div key={pending._id} className="card border-2 border-yellow-200 dark:border-yellow-800">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                          <Mail className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900 dark:text-white">
                            {pending.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {pending.email}
                          </p>
                          {pending.phone && (
                            <p className="text-xs text-gray-500 dark:text-gray-500">
                              Phone: {pending.phone}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Registered: {new Date(pending.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeletePending(pending._id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                      title="Delete pending registration"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Students List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="space-y-4"
        >
          {filteredStudents.length === 0 && filteredPending.length === 0 ? (
            <div className="card text-center py-12">
              <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No students found' : 'No students yet'}
              </p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="card text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                {searchTerm ? 'No verified students found' : 'All students are pending verification'}
              </p>
            </div>
          ) : (
            filteredStudents.map((student) => (
              <div key={student._id} className="card">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Student Info Header */}
                    <div className="flex items-center space-x-3 mb-4">
                      <div className="w-12 h-12 rounded-full bg-primary-100 dark:bg-primary-900 flex items-center justify-center">
                        <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {student.name}
                          {student.isBanned && (
                            <span className="ml-2 text-xs px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                              Banned
                            </span>
                          )}
                        </h3>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400 mt-1">
                          <div className="flex items-center space-x-1">
                            <Mail className="w-4 h-4" />
                            <span>{student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center space-x-1">
                              <Phone className="w-4 h-4" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                          {student.city && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{student.city}, {student.country || ''}</span>
                            </div>
                          )}
                          {student.school && (
                            <div className="flex items-center space-x-1">
                              <School className="w-4 h-4" />
                              <span>{student.school}</span>
                            </div>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span>
                            {t('emailChangesRemaining') || 'Email changes remaining'}:{' '}
                            {Math.max(0, 1 - (student.emailChangeCount || 0))}
                          </span>
                          <span>
                            {t('phoneChangesRemaining') || 'Phone changes remaining'}:{' '}
                            {Math.max(0, 1 - (student.phoneChangeCount || 0))}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* About Me Section */}
                    {student.aboutMe && (
                      <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                          <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                            About Me
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300">
                          {student.aboutMe}
                        </p>
                      </div>
                    )}

                    {/* Certificates */}
                    {student.certificates && student.certificates.length > 0 && (
                      <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="flex items-center space-x-2 mb-2">
                          <Award className="w-4 h-4 text-green-600 dark:text-green-400" />
                          <span className="text-sm font-medium text-green-700 dark:text-green-300">
                            Certificates Earned ({student.certificates.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {student.certificates.map((cert, idx) => (
                            <span 
                              key={idx}
                              className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded"
                            >
                              {cert.course?.name || 'Certificate'}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Enrolled Courses */}
                    {student.enrolledCourses && student.enrolledCourses.length > 0 && (
                      <div className="mt-4">
                        <div className="flex items-center space-x-2 mb-3">
                          <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Enrolled Courses ({student.enrolledCourses.length})
                          </span>
                        </div>
                        <div className="space-y-2">
                          {student.enrolledCourses.map((enrollment) => (
                            <div
                              key={enrollment._id}
                              className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                                    {enrollment.course?.name || 'Unknown Course'}
                                  </p>
                                  <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                                    <span>Group: {enrollment.group?.name || 'N/A'}</span>
                                    <span>Level: {enrollment.course?.level || 'N/A'}</span>
                                    <span>Category: {enrollment.course?.category || 'N/A'}</span>
                                  </div>
                                  {/* Payment Information */}
                                  {enrollment.paymentStatus && (
                                    <div className="flex flex-wrap items-center gap-2 mt-2">
                                      <span className={`px-2 py-0.5 text-xs font-medium rounded ${
                                        enrollment.paymentStatus === 'verified'
                                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                          : enrollment.paymentStatus === 'pending'
                                          ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                      }`}>
                                        Payment: {enrollment.paymentStatus}
                                      </span>
                                      {enrollment.paymentMethod && enrollment.paymentMethod !== 'none' && (
                                        <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded">
                                          Method: {enrollment.paymentMethod.replace(/_/g, ' ')}
                                        </span>
                                      )}
                                      {enrollment.entryFeePaid && (
                                        <span className="px-2 py-0.5 text-xs bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded">
                                          Entry Fee Paid
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    enrollment.status === 'enrolled'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : enrollment.status === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
                                  }`}
                                >
                                  {enrollment.status}
                                </span>
                              </div>
                              {/* Progress Bar */}
                              {enrollment.overallGrade !== undefined && (
                                <div className="mt-2">
                                  <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-600 dark:text-gray-400 flex items-center">
                                      <TrendingUp className="w-3 h-3 mr-1" />
                                      Progress
                                    </span>
                                    <span className="font-medium text-gray-900 dark:text-white">
                                      {enrollment.overallGrade?.toFixed(0) || 0}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all"
                                      style={{ width: `${enrollment.overallGrade || 0}%` }}
                                    ></div>
                                  </div>
                                  {enrollment.completedLectures !== undefined && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                      {enrollment.completedLectures} lectures completed
                                    </p>
                                  )}
                                </div>
                              )}
                              
                              {/* Payment Information */}
                              {enrollment.paymentStatus && (
                                <div className="mt-2 flex items-center flex-wrap gap-2 text-xs">
                                  <span className="text-gray-600 dark:text-gray-400">Payment:</span>
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    enrollment.paymentStatus === 'verified' || enrollment.paymentStatus === 'paid'
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                      : enrollment.paymentStatus === 'partial'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                                      : enrollment.paymentStatus === 'pending'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  }`}>
                                    {enrollment.paymentStatus === 'verified' ? 'All Paid' : 
                                     enrollment.paymentStatus === 'partial' ? 'Partially Paid' : 
                                     enrollment.paymentStatus}
                                    {enrollment.paidSections !== undefined && enrollment.totalSections !== undefined && (
                                      <span className="ml-1">({enrollment.paidSections}/{enrollment.totalSections} sections)</span>
                                    )}
                                  </span>
                                  {enrollment.paymentMethod && enrollment.paymentMethod !== 'none' && (
                                    <span className="text-gray-500 dark:text-gray-400">
                                      via {enrollment.paymentMethod.replace(/_/g, ' ')}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => openEditModal(student)}
                      className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                      title="Edit Student"
                    >
                      <Edit className="w-5 h-5" />
                    </button>
                    {student.isBanned ? (
                      <button 
                        onClick={() => handleUnban(student._id, student.name)} 
                        className="p-2 text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20 rounded-lg transition-colors" 
                        title="Unban Student"
                      >
                        <CheckCircle className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setBanConfirm({ id: student._id, name: student.name })} 
                        className="p-2 text-orange-600 hover:bg-orange-50 dark:text-orange-400 dark:hover:bg-orange-900/20 rounded-lg transition-colors" 
                        title="Ban Student"
                      >
                        <Ban className="w-5 h-5" />
                      </button>
                    )}
                    {/* Suspend/Unsuspend Button */}
                    {student.isSuspended ? (
                      <button 
                        onClick={() => handleUnsuspend(student._id, student.name)} 
                        className="p-2 text-teal-600 hover:bg-teal-50 dark:text-teal-400 dark:hover:bg-teal-900/20 rounded-lg transition-colors" 
                        title="Unsuspend Student"
                      >
                        <PlayCircle className="w-5 h-5" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setSuspendConfirm({ id: student._id, name: student.name })} 
                        className="p-2 text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-colors" 
                        title="Suspend Student"
                      >
                        <PauseCircle className="w-5 h-5" />
                      </button>
                    )}
                    <button
                      onClick={() => handleResetChangeLimits(student._id, student.name)}
                      disabled={resettingLimitsUserId === student._id}
                      className="p-2 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-300 dark:hover:bg-indigo-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      title={t('resetChangeLimitsTooltip') || 'Reset email/phone change limits'}
                    >
                      <RefreshCcw className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => setDeleteConfirm(student)} 
                      className="btn-secondary p-2 text-red-600 hover:text-red-700" 
                      title="Delete Student"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </motion.div>
      </div>

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
                Edit Student
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
                Ban Student
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
                placeholder="Explain why this student is being banned..."
                required
              />
            </div>

            <div className="flex space-x-3">
              <button
                onClick={handleBan}
                disabled={banning || !banReason.trim()}
                className="flex-1 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {banning ? 'Banning...' : 'Ban Student'}
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
            className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-lg w-full p-6 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Suspend Student
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
              Suspending <strong>{suspendConfirm.name}</strong> will restrict their access based on the selected options below.
            </p>

            {/* Suspension Checklist */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                Select Restrictions to Apply:
              </label>
              <div className="space-y-3 bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                {[
                  { key: 'enrollNewCourses', label: 'Block enrollment in new courses' },
                  { key: 'continueCourses', label: 'Disable "Continue Course" button' },
                  { key: 'accessCoursePages', label: 'Prevent direct access to course pages' },
                  { key: 'requestCertificate', label: 'Block certificate requests' },
                  { key: 'changeProfile', label: 'Prevent profile information changes' },
                  { key: 'changeSettings', label: 'Block access to student settings' },
                  { key: 'dashboardAccess', label: 'Block access to student dashboard' }
                ].map(({ key, label }) => (
                  <label key={key} className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={suspensionChecklist[key]}
                      onChange={(e) => setSuspensionChecklist(prev => ({
                        ...prev,
                        [key]: e.target.checked
                      }))}
                      className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
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
                disabled={suspending || !suspensionReason.trim() || suspensionReason.length < 5 || !Object.values(suspensionChecklist).some(checked => checked)}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {suspending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Suspending...
                  </>
                ) : (
                  'Suspend Student'
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

      {/* Delete Confirmation Dialog */}
      <UserDeletionDialog
        user={deleteConfirm}
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onDeleted={fetchStudents}
      />
    </div>
  );
};

export default AdminStudents;
