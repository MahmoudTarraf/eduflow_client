import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import { FileText, Download, Check, X, AlertTriangle } from 'lucide-react';

const AgreementNotification = () => {
  const { theme } = useTheme();
  const [agreements, setAgreements] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/instructor-agreements/my-agreement', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgreements(res.data.data);
    } catch (error) {
      console.error('Error fetching agreements:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (agreementId) => {
    if (!window.confirm('Are you sure you want to approve this agreement? This will become your active earnings split.')) {
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/instructor-agreements/${agreementId}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agreement approved successfully!');
      fetchAgreements();
    } catch (error) {
      console.error('Error approving agreement:', error);
      toast.error(error.response?.data?.message || 'Failed to approve agreement');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      toast.error('Please provide a detailed reason (minimum 10 characters)');
      return;
    }
    
    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/instructor-agreements/${selectedAgreement._id}/reject`, {
        reason: rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Agreement rejected. Admin has been notified.');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedAgreement(null);
      fetchAgreements();
    } catch (error) {
      console.error('Error rejecting agreement:', error);
      toast.error(error.response?.data?.message || 'Failed to reject agreement');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return null;
  }

  const pendingAgreements = agreements?.recentAgreements?.filter(a => a.status === 'pending') || [];

  if (pendingAgreements.length === 0) {
    return null;
  }

  return (
    <>
      <AnimatePresence>
        {pendingAgreements.map((agreement) => (
          <motion.div
            key={agreement._id}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`mb-6 ${theme === 'dark' ? 'bg-gradient-to-r from-yellow-900/20 to-orange-900/20' : 'bg-gradient-to-r from-yellow-50 to-orange-50'} border-l-4 border-yellow-500 rounded-lg shadow-lg overflow-hidden`}
          >
            <div className="p-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className={`text-lg font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                      New Earnings Agreement Requires Your Action
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      agreement.agreementType === 'custom'
                        ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400'
                        : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400'
                    }`}>
                      {agreement.agreementType === 'custom' ? 'Custom Agreement' : 'Global Agreement'}
                    </span>
                  </div>
                  
                  <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    A new earnings agreement has been prepared for you. Please review the terms carefully before accepting or rejecting.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Your Share
                      </p>
                      <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                        {agreement.instructorPercentage}%
                      </p>
                    </div>
                    <div className={`p-4 rounded-lg ${theme === 'dark' ? 'bg-gray-800/50' : 'bg-white'} border ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-xs mb-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Platform Commission
                      </p>
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                        {agreement.platformPercentage}%
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    {agreement.pdfUrl && (
                      <a
                        href={agreement.pdfUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium shadow-md"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download Full Agreement PDF</span>
                      </a>
                    )}
                    <button
                      onClick={() => handleApprove(agreement._id)}
                      disabled={submitting}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium shadow-md disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>Approve Agreement</span>
                    </button>
                    <button
                      onClick={() => {
                        setSelectedAgreement(agreement);
                        setShowRejectModal(true);
                      }}
                      disabled={submitting}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium shadow-md disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Reject & Provide Feedback</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-lg p-6`}
          >
            <div className="flex items-center space-x-3 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
              <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Reject Agreement
              </h2>
            </div>

            <p className={`mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
              Please provide a detailed reason for rejecting this agreement. The admin will review your feedback and may create a custom agreement for you.
            </p>

            <textarea
              rows="6"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Example: I believe my share should be higher given my experience and course quality. I would like to negotiate for a 75-25 split..."
              className={`w-full px-4 py-2 rounded-lg border ${
                theme === 'dark'
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } mb-4`}
              required
            />

            <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
              Minimum 10 characters required. Be specific about your concerns or counter-proposal.
            </p>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedAgreement(null);
                }}
                disabled={submitting}
                className={`px-4 py-2 rounded-lg ${
                  theme === 'dark'
                    ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                } transition-colors disabled:opacity-50`}
              >
                Cancel
              </button>
              <button
                onClick={handleRejectSubmit}
                disabled={submitting || rejectionReason.trim().length < 10}
                className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <X className="w-4 h-4" />
                    <span>Submit Rejection</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
};

export default AgreementNotification;
