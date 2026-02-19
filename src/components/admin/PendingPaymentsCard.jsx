import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { CheckCircle, XCircle, Clock, Eye, CreditCard } from 'lucide-react';
import { formatPrice } from '../../utils/currency';

const PendingPaymentsCard = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/admin/student-payments?status=pending&limit=10', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPayments(response.data.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error('Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (paymentId) => {
    if (!window.confirm('Are you sure you want to approve this payment? This will calculate and assign earnings to the instructor.')) {
      return;
    }

    try {
      setProcessing(paymentId);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/admin/student-payments/${paymentId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const approvedPayment = response.data.data;
      
      toast.success(
        <div>
          <p className="font-bold">Payment Approved!</p>
          <p className="text-sm">Platform: {formatPrice(approvedPayment.platformEarnings)}</p>
          <p className="text-sm">Instructor: {formatPrice(approvedPayment.instructorEarnings)}</p>
        </div>,
        { duration: 5000 }
      );
      
      fetchPayments(); // Refresh list
    } catch (error) {
      console.error('Error approving payment:', error);
      toast.error(error.response?.data?.message || 'Failed to approve payment');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (paymentId) => {
    if (!rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }

    try {
      setProcessing(paymentId);
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/admin/student-payments/${paymentId}/reject`,
        { reason: rejectionReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Payment rejected');
      setShowRejectModal(null);
      setRejectionReason('');
      fetchPayments(); // Refresh list
    } catch (error) {
      console.error('Error rejecting payment:', error);
      toast.error(error.response?.data?.message || 'Failed to reject payment');
    } finally {
      setProcessing(null);
    }
  };

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Pending Payments
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Requires approval
                </p>
              </div>
            </div>
            <div className="px-4 py-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <span className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {payments.length}
              </span>
            </div>
          </div>
        </div>

        <div className="p-6">
          {payments.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">All caught up! No pending payments.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <div
                  key={payment._id}
                  className="border dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      {/* Student Info */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="flex-shrink-0 w-10 h-10 bg-indigo-100 dark:bg-indigo-900/20 rounded-full flex items-center justify-center">
                          <span className="text-indigo-600 dark:text-indigo-400 font-semibold">
                            {payment.student?.name?.charAt(0) || 'S'}
                          </span>
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {payment.student?.name || 'Unknown Student'}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {payment.student?.email || 'No email'}
                          </p>
                        </div>
                      </div>

                      {/* Course & Section */}
                      <div className="mb-3">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                          📚 {payment.course?.name || 'Unknown Course'}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          📖 {payment.section?.title || 'Unknown Section'}
                        </p>
                      </div>

                      {/* Payment Details */}
                      <div className="flex items-center space-x-4 mb-3">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Amount</p>
                          <p className="text-xl font-bold text-indigo-600 dark:text-indigo-400">
                            {formatPrice(payment.amountCents, payment.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Method</p>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {payment.paymentMethod?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Submitted</p>
                          <p className="text-sm text-gray-900 dark:text-white">
                            {new Date(payment.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      {/* Receipt Link */}
                      {payment.receipt?.url && (
                        <a
                          href={payment.receipt.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View Receipt
                        </a>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col space-y-2 ml-4">
                      <button
                        onClick={() => handleApprove(payment._id)}
                        disabled={processing === payment._id}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>{processing === payment._id ? 'Processing...' : 'Approve'}</span>
                      </button>
                      <button
                        onClick={() => setShowRejectModal(payment._id)}
                        disabled={processing === payment._id}
                        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 transition"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {payments.length > 0 && (
          <div className="p-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={fetchPayments}
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Refresh List
            </button>
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Reject Payment
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Please provide a reason for rejecting this payment. The student will see this message.
            </p>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="e.g., Invalid receipt, unclear payment proof, etc."
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-red-500 dark:bg-gray-700 dark:text-white mb-4"
              rows="4"
            />
            <div className="flex items-center justify-end space-x-3">
              <button
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleReject(showRejectModal)}
                disabled={!rejectionReason.trim() || processing}
                className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {processing ? 'Rejecting...' : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PendingPaymentsCard;
