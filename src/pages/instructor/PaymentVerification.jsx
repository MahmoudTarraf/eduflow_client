import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/currency';

const InstructorPaymentVerification = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    fetchPendingPayments();
  }, []);

  const fetchPendingPayments = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await axios.get('/api/enroll/payments', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setPayments(res.data.payments || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch payments');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessPayment = async (paymentId, action, rejectionReason = null) => {
    try {
      setProcessing(prev => ({ ...prev, [paymentId]: true }));
      
      const token = localStorage.getItem('token');
      const res = await axios.put(`/api/enroll/payments/${paymentId}`, {
        action,
        rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update local state
      setPayments(prev => prev.filter(payment => payment._id !== paymentId));
      
      toast.success(res.data.message);
      fetchPendingPayments(); // Refresh the list
    } catch (error) {
      console.error('Error processing payment:', error);
      toast.error(error.response?.data?.message || 'Failed to process payment');
    } finally {
      setProcessing(prev => {
        const newState = { ...prev };
        delete newState[paymentId];
        return newState;
      });
    }
  };

  const handleApprove = async (paymentId) => {
    await handleProcessPayment(paymentId, 'approve');
  };

  const handleReject = async (paymentId) => {
    const reason = prompt('Enter rejection reason:');
    if (reason !== null) {
      await handleProcessPayment(paymentId, 'reject', reason);
    }
  };

  const viewReceipt = (receiptUrl) => {
    // For local development, ensure proxy works by not adding origin
    // Proxy in package.json will forward to backend
    if (receiptUrl.startsWith('http')) {
      window.open(receiptUrl, '_blank');
    } else {
      // Use backend URL directly
      const backendUrl = `http://localhost:5000${receiptUrl}`;
      window.open(backendUrl, '_blank');
    }
  };

  const downloadReceipt = async (receiptUrl, studentName) => {
    try {
      // Use backend URL directly
      const fullUrl = receiptUrl.startsWith('http') ? receiptUrl : `http://localhost:5000${receiptUrl}`;
      const token = localStorage.getItem('token');
      const response = await fetch(fullUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const ext = blob.type.split('/')[1] || 'jpg';
      link.download = `receipt_${studentName.replace(/\s+/g, '_')}_${Date.now()}.${ext}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('Receipt downloaded successfully');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error(`Failed to download receipt: ${error.message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Payment Verification
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Verify student payments for your course sections
          </p>
        </div>

        {payments.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-8 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No pending payments
            </h3>
            <p className="mt-2 text-gray-500 dark:text-gray-400">
              All payments have been processed.
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.map((payment) => (
                <div key={payment._id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                            <svg className="h-6 w-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h2 className="text-lg font-medium text-gray-900 dark:text-white truncate">
                            {payment.student?.name}
                          </h2>
                          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                            {payment.section?.name} • {payment.course?.name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center space-x-6 text-sm">
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Amount</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {formatPrice(payment.amountCents, payment.currency)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Method</p>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {payment.paymentMethod.replace('_', ' ')}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400">Submitted</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {new Date(payment.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-500 dark:text-gray-400 mb-1">Receipt</p>
                          {payment.receipt?.url && (
                            <div className="flex items-center space-x-2">
                              <img 
                                src={payment.receipt.url.startsWith('http') ? payment.receipt.url : `http://localhost:5000${payment.receipt.url}`} 
                                alt="Receipt preview" 
                                className="h-16 w-16 object-cover rounded border border-gray-300 dark:border-gray-600 cursor-pointer hover:opacity-80 transition"
                                onClick={() => viewReceipt(payment.receipt.url)}
                                onError={(e) => {
                                  console.error('Failed to load receipt image:', payment.receipt.url);
                                  e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24"%3E%3Cpath fill="%23999" d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/%3E%3C/svg%3E';
                                  toast.error('Failed to load receipt image');
                                }}
                              />
                              <div className="flex flex-col space-y-1">
                                <button 
                                  onClick={() => viewReceipt(payment.receipt.url)}
                                  className="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                  </svg>
                                  View
                                </button>
                                <button 
                                  onClick={() => downloadReceipt(payment.receipt.url, payment.student?.name)}
                                  className="text-sm font-medium text-green-600 dark:text-green-400 hover:text-green-500 dark:hover:text-green-300 flex items-center"
                                >
                                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                  </svg>
                                  Download
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="ml-4 flex-shrink-0 flex space-x-2">
                      <button
                        onClick={() => handleReject(payment._id)}
                        disabled={processing[payment._id]}
                        className="px-4 py-2 border border-red-600 text-red-600 dark:text-red-400 dark:border-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 transition flex items-center"
                      >
                        {processing[payment._id] ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-red-600 dark:text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : null}
                        Reject
                      </button>
                      <button
                        onClick={() => handleApprove(payment._id)}
                        disabled={processing[payment._id]}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition flex items-center"
                      >
                        {processing[payment._id] ? (
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                        ) : null}
                        Approve
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorPaymentVerification;
