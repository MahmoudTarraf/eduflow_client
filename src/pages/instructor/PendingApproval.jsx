import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Clock, CheckCircle, Video, FileText } from 'lucide-react';

const PendingApproval = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        <div className="card text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-100 dark:bg-yellow-900/30 p-6 rounded-full">
              <Clock className="w-16 h-16 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Your Application is Under Review
          </h1>

          {/* Description */}
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Thank you for submitting your instructor application. An admin will review your profile within <span className="font-semibold text-primary-600 dark:text-primary-400">2 business days</span>.
          </p>

          {/* Status Checklist */}
          <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-left">
              Submission Status
            </h2>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Agreement accepted</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Introduction video submitted</span>
              </div>
              <div className="flex items-center space-x-3">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                <span className="text-gray-700 dark:text-gray-300">Admin review pending</span>
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mb-8 text-left">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-3 flex items-center">
              <Video className="w-5 h-5 mr-2" />
              What Happens Next?
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>An admin will review your introduction video and agreement</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>You will receive an email notification with the decision</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>If approved, you can immediately start creating courses</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>If rejected, you'll receive feedback and can resubmit</span>
              </li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/')}
              className="btn-secondary"
            >
              <FileText className="w-4 h-4 mr-2" />
              Browse Courses
            </button>
            <button
              onClick={() => {
                logout();
              }}
              className="btn-primary"
            >
              Logout
            </button>
          </div>

          {/* Support Section */}
          <div className="mt-8 pt-8 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Have questions? Contact us at{' '}
              <a href="mailto:support@eduflow.com" className="text-primary-600 hover:text-primary-700 dark:text-primary-400">
                support@eduflow.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;
