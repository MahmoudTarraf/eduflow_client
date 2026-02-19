import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Shield
} from 'lucide-react';

const MyAgreements = () => {
  const [agreementData, setAgreementData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showRejectionModal, setShowRejectionModal] = useState(false);
  const [selectedAgreement, setSelectedAgreement] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchAgreements();
  }, []);

  const fetchAgreements = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await axios.get('/api/instructor-agreements/my-agreement', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAgreementData(response.data.data);
    } catch (error) {
      console.error('Error fetching agreements:', error);
      toast.error('Failed to load agreements');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedAgreement) return;

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`/api/instructor-agreements/${selectedAgreement._id}/approve`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Agreement approved successfully!');
      setShowApprovalModal(false);
      setSelectedAgreement(null);
      fetchAgreements();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve agreement');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedAgreement || !rejectionReason.trim() || rejectionReason.trim().length < 20) {
      toast.error('Please provide a detailed reason (minimum 20 characters)');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      
      await axios.put(`/api/instructor-agreements/${selectedAgreement._id}/reject`, {
        reason: rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Agreement rejected');
      setShowRejectionModal(false);
      setSelectedAgreement(null);
      setRejectionReason('');
      fetchAgreements();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject agreement');
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-800 dark:text-yellow-400', icon: Clock },
      approved: { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-800 dark:text-green-400', icon: CheckCircle },
      rejected: { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-800 dark:text-red-400', icon: XCircle },
      expired: { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-700 dark:text-gray-300', icon: AlertCircle }
    };
    return badges[status] || badges.pending;
  };

  const getAgreementTypeBadge = (type) => {
    const badges = {
      custom: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      global: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const { activeAgreement, recentAgreements, currentEarningsSplit } = agreementData || {};
  const pendingAgreements = recentAgreements?.filter(a => a.status === 'pending') || [];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            My Earnings Agreement
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            View and manage your earnings agreement with the platform
          </p>
        </div>

        {/* Current Active Agreement Card */}
        <div className="card mb-8 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-200 dark:border-green-700">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-500 rounded-full">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Current Active Agreement
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  This percentage applies to all your current earnings
                </p>
              </div>
            </div>
          </div>

          {currentEarningsSplit ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Your Share</p>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {currentEarningsSplit.instructorPercentage}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  You receive this percentage of student payments
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Platform Share</p>
                  <FileText className="w-5 h-5 text-purple-600" />
                </div>
                <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {currentEarningsSplit.platformPercentage}%
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                  Platform commission for services
                </p>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Agreement Type</p>
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${getAgreementTypeBadge(currentEarningsSplit.agreementType)}`}>
                    {currentEarningsSplit.agreementType}
                  </span>
                  {activeAgreement && (
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      v{activeAgreement.version}
                    </span>
                  )}
                </div>
                {activeAgreement && activeAgreement.pdfUrl && (
                  <a
                    href={activeAgreement.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 flex items-center"
                  >
                    <Download className="w-4 h-4 mr-1" />
                    Download PDF
                  </a>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-start">
                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mr-3 mt-0.5" />
                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                  <p className="font-semibold mb-1">No Active Agreement</p>
                  <p>You don't have an active earnings agreement yet. Please contact support or wait for an agreement to be sent to you.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Pending Agreements - Action Required */}
        {pendingAgreements.length > 0 && (
          <div className="card mb-8 bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-700">
            <div className="flex items-center mb-4">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400 mr-3" />
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                Pending Agreements - Action Required
              </h2>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Please review and respond to the following agreement{pendingAgreements.length > 1 ? 's' : ''}:
            </p>

            <div className="space-y-4">
              {pendingAgreements.map((agreement) => (
                <div key={agreement._id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          New Agreement v{agreement.version}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAgreementTypeBadge(agreement.agreementType)}`}>
                          {agreement.agreementType}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Sent {new Date(agreement.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Your New Share</p>
                          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {agreement.instructorPercentage}%
                          </p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3">
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Platform Share</p>
                          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                            {agreement.platformPercentage}%
                          </p>
                        </div>
                      </div>

                      {agreement.agreementType === 'custom' && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3 mb-3">
                          <p className="text-sm text-blue-800 dark:text-blue-200">
                            <strong>Custom Agreement:</strong> This is a special agreement created specifically for you with dedicated revenue sharing terms.
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col space-y-2 ml-4">
                      {agreement.pdfUrl && (
                        <a
                          href={agreement.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-sm flex items-center whitespace-nowrap"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          View PDF
                        </a>
                      )}
                      <button
                        onClick={() => {
                          setSelectedAgreement(agreement);
                          setShowApprovalModal(true);
                        }}
                        className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm flex items-center whitespace-nowrap"
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setSelectedAgreement(agreement);
                          setShowRejectionModal(true);
                        }}
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 text-sm flex items-center whitespace-nowrap"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Agreement History */}
        {recentAgreements && recentAgreements.length > 0 && (
          <div className="card">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Agreement History
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              View all past agreements and their status
            </p>

            <div className="space-y-3">
              {recentAgreements.map((agreement) => {
                const badge = getStatusBadge(agreement.status);
                const Icon = badge.icon;

                return (
                  <div
                    key={agreement._id}
                    className={`p-4 rounded-lg border ${
                      agreement.isActive && agreement.status === 'approved'
                        ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                        : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <span className="font-semibold text-gray-900 dark:text-white">
                            Version {agreement.version}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAgreementTypeBadge(agreement.agreementType)}`}>
                            {agreement.agreementType}
                          </span>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full flex items-center ${badge.bg} ${badge.text}`}>
                            <Icon className="w-3 h-3 mr-1" />
                            {agreement.status}
                          </span>
                          {agreement.isActive && agreement.status === 'approved' && (
                            <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500 text-white">
                              CURRENTLY ACTIVE
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-2">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Your Share</p>
                            <p className="text-lg font-bold text-green-600 dark:text-green-400">
                              {agreement.instructorPercentage}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Platform Share</p>
                            <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                              {agreement.platformPercentage}%
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {agreement.status === 'approved' ? 'Approved' : 'Created'}
                            </p>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {new Date(agreement.status === 'approved' ? agreement.approvedAt : agreement.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {agreement.status === 'rejected' && agreement.rejectionReason && (
                          <div className="mt-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded">
                            <p className="text-xs text-red-600 dark:text-red-400 mb-1">Rejection Reason:</p>
                            <p className="text-sm text-red-800 dark:text-red-200">{agreement.rejectionReason}</p>
                          </div>
                        )}
                      </div>

                      {agreement.pdfUrl && (
                        <a
                          href={agreement.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary text-sm flex items-center ml-4"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          PDF
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Approval Modal */}
      {showApprovalModal && selectedAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Approve Agreement
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              By approving this agreement, you confirm that:
            </p>
            <ul className="list-disc list-inside space-y-2 mb-6 text-gray-700 dark:text-gray-300 text-sm">
              <li>You accept the new revenue sharing terms ({selectedAgreement.instructorPercentage}% for you, {selectedAgreement.platformPercentage}% for platform)</li>
              <li>This agreement will apply to all future student payments</li>
              <li>Your previous agreement will be deactivated</li>
            </ul>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowApprovalModal(false);
                  setSelectedAgreement(null);
                }}
                className="btn-secondary flex-1"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex-1"
                disabled={processing}
              >
                {processing ? 'Processing...' : 'Confirm Approval'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectionModal && selectedAgreement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Reject Agreement
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please provide a detailed reason for rejecting this agreement:
            </p>

            <textarea
              className="input-field mb-4"
              rows="4"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Explain why you're rejecting this agreement (minimum 20 characters)..."
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
              {rejectionReason.length} / 20 characters minimum
            </p>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowRejectionModal(false);
                  setSelectedAgreement(null);
                  setRejectionReason('');
                }}
                className="btn-secondary flex-1"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex-1"
                disabled={processing || rejectionReason.length < 20}
              >
                {processing ? 'Processing...' : 'Submit Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyAgreements;
