import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, ExternalLink, DollarSign, Calendar, User } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';

const PendingPayments = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const resp = await axios.get('/api/groups/pending-payments');
      setPayments(resp.data.pendingPayments || []);
      console.log('Pending payments:', resp.data.pendingPayments);
    } catch (e) {
      console.error('Fetch pending payments error:', e);
      toast.error(e.response?.data?.message || 'Failed to load pending payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPendingPayments(); }, []);

  const handleAction = async (payment, action) => {
    const key = `${payment.groupId}-${payment.student?._id}-${payment.type}-${payment.month || payment.sectionId || 'initial'}`;
    try {
      setProcessing(prev => ({ ...prev, [key]: true }));
      const payload = {
        studentId: payment.student?._id,
        action,
        type: payment.type
      };
      
      if (payment.month) payload.month = payment.month;
      if (payment.sectionId) payload.sectionId = payment.sectionId;
      
      await axios.post(`/api/groups/${payment.groupId}/confirmPayment`, payload);
      await fetchPendingPayments();
    } catch (e) {
      console.error('Process payment error:', e);
      toast.error(e.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessing(prev => ({ ...prev, [key]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pending Payments</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and verify student payment receipts</p>
        </motion.div>

        {payments.length === 0 ? (
          <div className="card text-center py-12">
            <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No pending payments</h3>
            <p className="text-gray-600 dark:text-gray-400">All payments have been processed</p>
          </div>
        ) : (
          <div className="space-y-4">
            {payments.map((payment, idx) => {
              const key = `${payment.groupId}-${payment.student?._id}-${payment.type}-${payment.month || payment.sectionId || 'initial'}`;
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="card"
                >
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900 rounded-lg">
                          <User className="w-5 h-5 text-primary-600 dark:text-primary-400" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {payment.student?.name}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{payment.student?.email}</p>
                          <div className="mt-2 space-y-1">
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Course:</span>
                              <span className="text-gray-600 dark:text-gray-400">{payment.courseName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Group:</span>
                              <span className="text-gray-600 dark:text-gray-400">{payment.groupName}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Type:</span>
                              <span className="px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                {payment.type === 'entry_fee' ? 'Entry Fee' :
                                 payment.type === 'enrollment' ? 'Initial Enrollment' :
                                 payment.type === 'section' ? `Section - ${payment.sectionTitle || payment.sectionId}` :
                                 payment.type === 'monthly' ? `Monthly - ${payment.month}` :
                                 'Unknown'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <DollarSign className="w-4 h-4 text-gray-500" />
                              <span className="font-medium text-gray-900 dark:text-white">${payment.amount}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="font-medium text-gray-700 dark:text-gray-300">Method:</span>
                              <span className="text-gray-600 dark:text-gray-400 capitalize">
                                {payment.paymentMethod?.replace('_', ' ') || 'N/A'}
                              </span>
                            </div>
                            {payment.enrollmentDate && (
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <Calendar className="w-4 h-4" />
                                <span>Enrolled: {new Date(payment.enrollmentDate).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {payment.receiptUrl && (
                        <a
                          href={payment.receiptUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-secondary inline-flex items-center justify-center gap-2"
                        >
                          <ExternalLink className="w-4 h-4" />
                          View Receipt
                        </a>
                      )}
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAction(payment, 'verify')}
                          disabled={!!processing[key]}
                          className="btn-primary inline-flex items-center gap-2 bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="w-4 h-4" />
                          {processing[key] ? 'Processing...' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleAction(payment, 'reject')}
                          disabled={!!processing[key]}
                          className="btn-secondary text-red-600 hover:text-red-700 inline-flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default PendingPayments;
