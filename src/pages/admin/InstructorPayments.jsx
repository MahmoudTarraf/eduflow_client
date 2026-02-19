import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DollarSign, CheckCircle, XCircle, Upload, Eye, ChevronDown, ChevronUp, User, History, TrendingUp, Clock, Download } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const InstructorPayments = () => {
  const { user, weakPassword } = useAuth();
  const [payoutRequests, setPayoutRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [expandedRequest, setExpandedRequest] = useState(null);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [proofFile, setProofFile] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [historyStats, setHistoryStats] = useState(null);
  const [showWeakPasswordModal, setShowWeakPasswordModal] = useState(false);

  useEffect(() => {
    fetchPayoutRequests();
  }, [filter]);

  useEffect(() => {
    if (
      weakPassword &&
      (user?.role === 'admin' || user?.role === 'instructor') &&
      typeof window !== 'undefined' &&
      !window.sessionStorage.getItem('weakPasswordModalDismissed')
    ) {
      setShowWeakPasswordModal(true);
    }
  }, [weakPassword, user]);

  const fetchPayoutRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/payout-requests/admin/all?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayoutRequests(res.data.data);
    } catch (error) {
      console.error('Error fetching payout requests:', error);
      toast.error('Failed to fetch payout requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistoryStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const [pendingRes, approvedRes, rejectedRes] = await Promise.all([
        axios.get('/api/payout-requests/admin/all?status=pending&limit=1000', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/payout-requests/admin/all?status=approved&limit=1000', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/payout-requests/admin/all?status=rejected&limit=1000', { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const pending = pendingRes.data.data || [];
      const approved = approvedRes.data.data || [];
      const rejected = rejectedRes.data.data || [];

      const stats = {
        totalRequests: pending.length + approved.length + rejected.length,
        pending: {
          count: pending.length,
          amount: pending.reduce((sum, r) => sum + (r.requestedAmount || 0), 0)
        },
        approved: {
          count: approved.length,
          amount: approved.reduce((sum, r) => sum + (r.requestedAmount || 0), 0)
        },
        rejected: {
          count: rejected.length,
          amount: rejected.reduce((sum, r) => sum + (r.requestedAmount || 0), 0)
        },
        allRequests: [...pending, ...approved, ...rejected].sort((a, b) => 
          new Date(b.requestedAt || b.createdAt) - new Date(a.requestedAt || a.createdAt)
        )
      };

      setHistoryStats(stats);
    } catch (error) {
      console.error('Error fetching history stats:', error);
      toast.error('Failed to fetch payout history');
    }
  };

  const handleApprove = async () => {
    if (!proofFile) {
      toast.error('Please upload proof of payment');
      return;
    }

    try {
      setProcessing(true);
      const formData = new FormData();
      formData.append('proof', proofFile);

      const token = localStorage.getItem('token');
      await axios.put(`/api/payout-requests/admin/${selectedRequest._id}/approve`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        }
      });

      toast.success('Payout approved successfully');
      setShowApproveModal(false);
      setProofFile(null);
      setSelectedRequest(null);
      fetchPayoutRequests();
    } catch (error) {
      console.error('Approve error:', error);
      toast.error(error.response?.data?.message || 'Failed to approve payout');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason || rejectionReason.trim().length < 20) {
      toast.error('Please provide a detailed reason (minimum 20 characters)');
      return;
    }

    try {
      setProcessing(true);
      const token = localStorage.getItem('token');
      await axios.put(`/api/payout-requests/admin/${selectedRequest._id}/reject`, 
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Payout rejected');
      setShowRejectModal(false);
      setRejectionReason('');
      setSelectedRequest(null);
      fetchPayoutRequests();
    } catch (error) {
      console.error('Reject error:', error);
      toast.error(error.response?.data?.message || 'Failed to reject payout');
    } finally {
      setProcessing(false);
    }
  };

  const handleDownloadReceipt = async (receiptUrl, originalName) => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(receiptUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download receipt');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = originalName || `payout_receipt_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Download receipt error:', error);
      toast.error('Failed to download receipt');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Instructor Payments</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Manage instructor payout requests
          </p>
        </div>

        {/* Filter Tabs and History Button */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-2">
            {['pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => {
                  setFilter(status);
                  setShowHistory(false);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  filter === status && !showHistory
                    ? 'bg-primary-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory && !historyStats) {
                fetchHistoryStats();
              }
            }}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition ${
              showHistory
                ? 'bg-indigo-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Payout History</span>
          </button>
        </div>

        {/* History Section */}
        {showHistory && historyStats && (
          <div className="mb-8">
            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Requests</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{historyStats.totalRequests}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-gray-400" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pending</p>
                    <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{historyStats.pending.count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {((historyStats.pending.amount || 0) / 100).toLocaleString()} SYP
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-yellow-400" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Approved</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">{historyStats.approved.count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {((historyStats.approved.amount || 0) / 100).toLocaleString()} SYP
                    </p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-400" />
                </div>
              </div>
              
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Rejected</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">{historyStats.rejected.count}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {((historyStats.rejected.amount || 0) / 100).toLocaleString()} SYP
                    </p>
                  </div>
                  <XCircle className="w-8 h-8 text-red-400" />
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">All Payout Requests</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Instructor
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date Requested
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Processed Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {historyStats.allRequests.map((request) => (
                      <tr key={request._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {request.instructor?.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {request.instructor?.email}
                              </div>
                            </div>
                            {(request.instructor?.isDeleted || request.instructor?.status === 'deleted') && (
                              <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                                Deleted Instructor
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900 dark:text-white">
                            {((request.requestedAmount || 0) / 100).toLocaleString()} {request.currency || 'SYP'}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            request.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                            request.status === 'approved' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                          }`}>
                            {request.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {new Date(request.requestedAt || request.createdAt).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {request.processedAt ? new Date(request.processedAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {request.status === 'approved' && request.payoutProof?.url && (
                            <button
                              onClick={() => handleDownloadReceipt(request.payoutProof.url, request.payoutProof.originalName)}
                              className="px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center gap-1 text-xs"
                            >
                              <Download className="w-3 h-3" />
                              Receipt
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Payout Requests List */}
        {!showHistory && (
          <div className="space-y-4">
            {payoutRequests.map((request) => (
            <div key={request._id} className="card">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setExpandedRequest(expandedRequest === request._id ? null : request._id)}
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
                    <User className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {request.instructor?.name}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(request.status)}`}>
                        {request.status}
                      </span>
                      {(request.instructor?.isDeleted || request.instructor?.status === 'deleted') && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          Deleted Instructor
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {request.instructor?.email} • {request.totalStudents} students
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                      Requested: {new Date(request.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                      {((request.requestedAmount || 0) / 100).toLocaleString()} {request.currency || 'SYP'}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 font-medium">
                      Payout Amount
                    </p>
                    {request.totalInstructorEarning && request.totalInstructorEarning !== request.requestedAmount && (
                      <p className="text-xs text-gray-400 dark:text-gray-600 mt-1">
                        From earnings: {((request.totalInstructorEarning || 0) / 100).toLocaleString()}
                      </p>
                    )}
                  </div>
                  {expandedRequest === request._id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Details */}
              {expandedRequest === request._id && (
                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                  {/* Receiver Details */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Payment Details
                    </h4>
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Payment Method</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.paymentMethod.replace('_', ' ').toUpperCase()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receiver Name</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.receiverDetails?.receiverName}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Receiver Phone</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.receiverDetails?.receiverPhone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Location</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {request.receiverDetails?.receiverLocation || 'N/A'}
                        </p>
                      </div>
                      {request.receiverDetails?.accountDetails && (
                        <div className="col-span-2">
                          <p className="text-sm text-gray-600 dark:text-gray-400">Account Details</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {request.receiverDetails.accountDetails}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Payout Summary */}
                  <div className="mb-6">
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                      Payout Summary
                    </h4>
                    <div className="bg-indigo-50 dark:bg-indigo-900/20 border-2 border-indigo-200 dark:border-indigo-700 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Requested Payout Amount</span>
                        <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                          {((request.requestedAmount || 0) / 100).toLocaleString()} {request.currency || 'SYP'}
                        </span>
                      </div>
                      <div className="pt-3 border-t border-indigo-200 dark:border-indigo-700">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          ✅ This is the exact amount the instructor will receive
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Course Information (student count only) */}
                  {request.courseInfo && request.courseInfo.length > 0 && (
                    <div className="mb-6">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
                        Courses Included
                      </h4>
                      <div className="space-y-2">
                        {request.courseInfo.map((course, idx) => (
                          <div key={idx} className="flex items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 dark:text-white">{course.courseName}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {course.studentCount} student{course.studentCount !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  {request.status === 'pending' && (
                    <div className="flex space-x-4">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request);
                          setShowApproveModal(true);
                        }}
                        className="btn-primary flex items-center flex-1"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Upload Proof
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        className="btn-secondary flex items-center flex-1 text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </button>
                    </div>
                  )}

                  {/* Proof Display (for approved) */}
                  {request.status === 'approved' && request.payoutProof && (
                    <div className="mt-4">
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                        Proof of Payment
                      </h4>
                      <a
                        href={request.payoutProof.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-primary-600 hover:text-primary-700"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Proof ({request.payoutProof.originalName})
                      </a>
                    </div>
                  )}

                  {/* Rejection Reason Display */}
                  {request.status === 'rejected' && request.rejectionReason && (
                    <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                      <h4 className="font-semibold text-red-900 dark:text-red-100 mb-2">
                        Rejection Reason
                      </h4>
                      <p className="text-red-800 dark:text-red-200">{request.rejectionReason}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {payoutRequests.length === 0 && (
            <div className="card text-center py-12">
              <DollarSign className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No {filter} payout requests</p>
            </div>
          )}
          </div>
        )}
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Approve Payout Request
            </h3>
            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-700 rounded-lg p-4 mb-4">
              <p className="text-gray-700 dark:text-gray-300 mb-2">
                Instructor: <strong className="text-gray-900 dark:text-white">{selectedRequest?.instructor?.name}</strong>
              </p>
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {((selectedRequest?.requestedAmount || 0) / 100).toLocaleString()} {selectedRequest?.currency || 'SYP'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                ⚠️ This is the exact amount the instructor will receive
              </p>
            </div>

            <div className="mb-4">
              <label className="label">Upload Proof of Payment (Required)</label>
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf,.rar"
                onChange={(e) => setProofFile(e.target.files[0])}
                className="w-full text-sm text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-700 focus:outline-none"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                JPG, PNG, PDF, or RAR (Max 10MB)
              </p>
              {proofFile && (
                <p className="text-sm text-green-600 dark:text-green-400 mt-2">
                  Selected: {proofFile.name}
                </p>
              )}
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowApproveModal(false);
                  setProofFile(null);
                  setSelectedRequest(null);
                }}
                className="btn-secondary flex-1"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleApprove}
                className="btn-primary flex-1 flex items-center justify-center"
                disabled={!proofFile || processing}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Approve & Send'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Reject Payout Request
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Rejecting payout for <strong>{selectedRequest?.instructor?.name}</strong>
            </p>

            <div className="mb-4">
              <label className="label">Rejection Reason (Required, min 20 characters)</label>
              <textarea
                className="input-field"
                rows="4"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a detailed reason for rejection..."
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {rejectionReason.length} / 20 characters minimum
              </p>
            </div>

            <div className="flex space-x-4">
              <button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                className="btn-secondary flex-1"
                disabled={processing}
              >
                Cancel
              </button>
              <button
                onClick={handleReject}
                className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 flex-1 flex items-center justify-center disabled:opacity-50"
                disabled={rejectionReason.length < 20 || processing}
              >
                {processing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </>
                ) : 'Reject Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showWeakPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Please update your password
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              For your security, admin and instructor accounts must use a strong password (at least 12 characters, including
              uppercase, lowercase, number and symbol).
            </p>
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.sessionStorage.setItem('weakPasswordModalDismissed', 'true');
                  }
                  setShowWeakPasswordModal(false);
                }}
                className="btn-secondary"
              >
                Remind me later
              </button>
              <Link
                to="/profile"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    window.sessionStorage.setItem('weakPasswordModalDismissed', 'true');
                  }
                  setShowWeakPasswordModal(false);
                }}
                className="btn-primary"
              >
                Update Password
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorPayments;
