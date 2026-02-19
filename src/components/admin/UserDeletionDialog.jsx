import React, { useState, useEffect } from 'react';
import { X, AlertTriangle, Trash2, Users, BookOpen, FileText, Award, MessageSquare, Star } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const UserDeletionDialog = ({ user, isOpen, onClose, onDeleted }) => {
  const [loading, setLoading] = useState(false);
  const [deletionPreview, setDeletionPreview] = useState(null);
  const [deleteCourses, setDeleteCourses] = useState(false); // For instructor: delete courses or keep them
  const [studentDeleteEverything, setStudentDeleteEverything] = useState(false); // For student: anonymize vs delete everything
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      fetchDeletionPreview();
    }
  }, [isOpen, user]);

  const fetchDeletionPreview = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `/api/user-deletion/${user._id}/deletion-preview`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setDeletionPreview(response.data.data);
    } catch (error) {
      console.error('Error fetching deletion preview:', error);
      toast.error('Failed to load deletion preview');
    }
  };

  const handleDelete = async () => {
    if (confirmText !== 'DELETE') {
      toast.error('Please type DELETE to confirm');
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const endpoint = user.role === 'student'
        ? `/api/user-deletion/student/${user._id}`
        : `/api/user-deletion/instructor/${user._id}`;

      const payload = user.role === 'instructor'
        ? { deleteCourses }
        : user.role === 'student'
          ? { mode: studentDeleteEverything ? 'hard_delete' : 'anonymize' }
          : {};

      const response = await axios.delete(endpoint, {
        headers: { Authorization: `Bearer ${token}` },
        data: payload
      });

      toast.success(response.data.message);
      onDeleted();
      onClose();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Failed to delete user');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen || !user || !deletionPreview) return null;

  const isStudent = user.role === 'student';
  const isInstructor = user.role === 'instructor';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Delete {isStudent ? 'Student' : 'Instructor'} Account
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                This action cannot be undone
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* User Info */}
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">User Information</h3>
            <div className="space-y-1 text-sm">
              <p className="text-gray-600 dark:text-gray-300"><strong>Name:</strong> {deletionPreview.user.name}</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Email:</strong> {deletionPreview.user.email}</p>
              <p className="text-gray-600 dark:text-gray-300"><strong>Role:</strong> {deletionPreview.user.role}</p>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-red-900 dark:text-red-300">Warning: Permanent Deletion</h4>
                <p className="text-sm text-red-800 dark:text-red-400 mt-1">
                  The following data will be permanently deleted and cannot be recovered:
                </p>
              </div>
            </div>
          </div>

          {/* Student Deletion Preview */}
          {isStudent && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <StatCard
                  icon={BookOpen}
                  label="Enrollments"
                  value={deletionPreview.willDelete.enrollments}
                  color="blue"
                />
                <StatCard
                  icon={FileText}
                  label="Progress Records"
                  value={deletionPreview.willDelete.progress}
                  color="green"
                />
                <StatCard
                  icon={Award}
                  label="Certificate Requests"
                  value={deletionPreview.willDelete.certificateRequests}
                  color="purple"
                />
                <StatCard
                  icon={FileText}
                  label="Submissions"
                  value={deletionPreview.willDelete.submissions}
                  color="indigo"
                />
                <StatCard
                  icon={Star}
                  label="Ratings"
                  value={deletionPreview.willDelete.ratings}
                  color="yellow"
                />
                <StatCard
                  icon={MessageSquare}
                  label="Comments"
                  value={deletionPreview.willDelete.comments}
                  color="red"
                />
              </div>

              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Deletion Mode</h4>

                <label
                  className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  style={{ borderColor: !studentDeleteEverything ? '#4F46E5' : '#E5E7EB' }}
                >
                  <input
                    type="radio"
                    name="studentDeletionMode"
                    checked={!studentDeleteEverything}
                    onChange={() => setStudentDeleteEverything(false)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Anonymize & Preserve History (Recommended)
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Replace the student with an anonymized placeholder in enrollments, certificates, progress, grades, and payments, while removing their login access.
                    </p>
                  </div>
                </label>

                <label
                  className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  style={{ borderColor: studentDeleteEverything ? '#EF4444' : '#E5E7EB' }}
                >
                  <input
                    type="radio"
                    name="studentDeletionMode"
                    checked={studentDeleteEverything}
                    onChange={() => setStudentDeleteEverything(true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-red-600 dark:text-red-400">
                      Delete Everything
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Permanently delete the student account and all related data, including enrollments, progress, grades, certificates, comments, ratings, payments, achievements, and notifications.
                    </p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* Instructor Deletion Preview */}
          {isInstructor && (
            <>
              {/* Courses List */}
              {deletionPreview.courses && deletionPreview.courses.length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900 dark:text-white">
                    Courses ({deletionPreview.courses.length})
                  </h4>
                  <div className="max-h-48 overflow-y-auto space-y-2 border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                    {deletionPreview.courses.map((course) => (
                      <div
                        key={course.id}
                        className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700"
                      >
                        <p className="font-medium text-gray-900 dark:text-white">{course.title}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {course.enrollments} student{course.enrollments !== 1 ? 's' : ''} enrolled
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Deletion Mode Choice */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-900 dark:text-white">Deletion Mode</h4>
                
                <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  style={{ borderColor: !deleteCourses ? '#4F46E5' : '#E5E7EB' }}>
                  <input
                    type="radio"
                    name="deletionMode"
                    checked={!deleteCourses}
                    onChange={() => setDeleteCourses(false)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-gray-900 dark:text-white">
                      Keep Courses (Recommended)
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Delete instructor but reassign their courses to admin. Students can continue accessing the courses.
                    </p>
                  </div>
                </label>

                <label className="flex items-start space-x-3 p-4 border-2 rounded-lg cursor-pointer transition hover:bg-gray-50 dark:hover:bg-gray-700/50"
                  style={{ borderColor: deleteCourses ? '#EF4444' : '#E5E7EB' }}>
                  <input
                    type="radio"
                    name="deletionMode"
                    checked={deleteCourses}
                    onChange={() => setDeleteCourses(true)}
                    className="mt-1"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-red-600 dark:text-red-400">
                      Delete Everything
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Delete instructor AND all their courses. This will affect {deletionPreview.willDelete.enrollments} student enrollments.
                    </p>
                  </div>
                </label>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-4">
                <StatCard
                  icon={BookOpen}
                  label={deleteCourses ? "Courses to Delete" : "Courses to Reassign"}
                  value={deletionPreview.willDelete.courses}
                  color={deleteCourses ? "red" : "blue"}
                />
                <StatCard
                  icon={Users}
                  label={deleteCourses ? "Enrollments to Delete" : "Student Enrollments"}
                  value={deletionPreview.willDelete.enrollments}
                  color={deleteCourses ? "red" : "green"}
                />
                <StatCard
                  icon={FileText}
                  label="Sections"
                  value={deletionPreview.willDelete.sections}
                  color="purple"
                />
              </div>

              {deleteCourses && (
                <div className="grid grid-cols-2 gap-4">
                  <StatCard
                    icon={Star}
                    label="Ratings"
                    value={deletionPreview.willDelete.ratings}
                    color="yellow"
                  />
                  <StatCard
                    icon={FileText}
                    label="Cloud Assets"
                    value={deletionPreview.willDelete.cloudinaryAssets + deletionPreview.willDelete.youtubeVideos}
                    color="indigo"
                  />
                </div>
              )}

              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-800 dark:text-blue-400">
                  <strong>Note:</strong> PDF agreements ({deletionPreview.willDelete.agreements}) will be deleted regardless of the mode chosen.
                </p>
              </div>
            </>
          )}

          {/* Confirmation Input */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm:
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white"
              placeholder="Type DELETE"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={handleDelete}
            disabled={loading || confirmText !== 'DELETE'}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>{loading ? 'Deleting...' : 'Delete Account'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400',
    green: 'bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-100 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400',
    indigo: 'bg-indigo-100 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400',
    red: 'bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400'
  };

  return (
    <div className={`${colorClasses[color]} rounded-lg p-4`}>
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5" />
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-sm opacity-80">{label}</p>
        </div>
      </div>
    </div>
  );
};

export default UserDeletionDialog;
