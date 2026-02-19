import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const RemoveStudentDialog = ({ isOpen, onClose, onConfirm, studentName, courseName, loading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-full">
            <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Remove Student
          </h3>
        </div>

        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Are you sure you want to remove <strong>{studentName}</strong> from <strong>{courseName}</strong>?
          </p>

          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">
              ⚠️ This action will permanently delete:
            </p>
            <ul className="text-sm text-red-700 dark:text-red-400 space-y-1 list-disc list-inside">
              <li>All course progress and completion data</li>
              <li>All grades and test scores</li>
              <li>Any issued or pending certificates</li>
              <li>All payment records for this course</li>
              <li>Student's enrollment status in this course</li>
            </ul>
          </div>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-300">
              <strong>Note:</strong> This action cannot be undone. The student will need to re-enroll and start from scratch if they want to rejoin.
            </p>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              onClick={onClose}
              disabled={loading}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Removing...' : 'Yes, Remove Student'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RemoveStudentDialog;
