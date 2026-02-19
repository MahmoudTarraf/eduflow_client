import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  Tag, 
  Check, 
  X, 
  Clock, 
  Trash2,
  ArrowLeft,
  DollarSign,
  Calendar,
  TrendingDown,
  AlertCircle
} from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';

const DiscountManagement = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [discounts, setDiscounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected, expired, disabled
  const [processingIds, setProcessingIds] = useState([]);

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

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/courses/discounts/all');
      setDiscounts(response.data.discounts || response.data.courses || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (courseId) => {
    try {
      setProcessingIds(prev => [...prev, courseId]);
      await axios.put(`/api/courses/${courseId}/discount/approve`);
      await fetchDiscounts();
    } catch (error) {
      console.error('Error approving discount:', error);
      const message = getApiErrorMessage(error, 'Failed to approve discount');
      toast.error(message);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== courseId));
    }
  };

  const handleReject = async (courseId) => {
    const reason = prompt('Enter rejection reason (optional):');
    if (reason === null) return; // User cancelled
    
    try {
      setProcessingIds(prev => [...prev, courseId]);
      await axios.put(`/api/courses/${courseId}/discount/reject`, { reason });
      await fetchDiscounts();
    } catch (error) {
      console.error('Error rejecting discount:', error);
      const message = getApiErrorMessage(error, 'Failed to reject discount');
      toast.error(message);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== courseId));
    }
  };

  const handleDelete = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this discount? This will restore the original course price.')) {
      return;
    }
    
    try {
      setProcessingIds(prev => [...prev, courseId]);
      await axios.delete(`/api/courses/${courseId}/discount`);
      await fetchDiscounts();
    } catch (error) {
      console.error('Error deleting discount:', error);
      const message = getApiErrorMessage(error, 'Failed to delete discount');
      toast.error(message);
    } finally {
      setProcessingIds(prev => prev.filter(id => id !== courseId));
    }
  };

  const filteredDiscounts = discounts.filter(course => {
    if (filter === 'all') return true;
    return course.discount?.status === filter;
  });

  const getStatusBadge = (status) => {
    const badges = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200', icon: Clock, label: 'Pending' },
      approved: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200', icon: Check, label: 'Approved' },
      rejected: { color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200', icon: X, label: 'Rejected' },
      expired: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: Calendar, label: 'Expired' },
      disabled: { color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: AlertCircle, label: 'Disabled' }
    };

    const badge = badges[status] || badges.disabled;
    const Icon = badge.icon;

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        <Icon size={12} />
        {badge.label}
      </span>
    );
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getCountByStatus = (status) => {
    return discounts.filter(c => c.discount?.status === status).length;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4 sm:px-6 lg:px-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 mb-4"
          >
            <ArrowLeft size={20} />
            Back to Dashboard
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <Tag className="text-indigo-600 dark:text-indigo-400" size={32} />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Discount Management
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Manage all course discounts including pending requests, active discounts, and history
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Pending', count: getCountByStatus('pending'), color: 'yellow' },
            { label: 'Approved', count: getCountByStatus('approved'), color: 'green' },
            { label: 'Rejected', count: getCountByStatus('rejected'), color: 'red' },
            { label: 'Expired', count: getCountByStatus('expired'), color: 'gray' },
            { label: 'Disabled', count: getCountByStatus('disabled'), color: 'gray' }
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ scale: 1.02 }}
              className={`bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm border-l-4 border-${stat.color}-500`}
            >
              <div className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.count}</div>
            </motion.div>
          ))}
        </div>

        {/* Filter Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6 p-4">
          <div className="flex flex-wrap gap-2">
            {['all', 'pending', 'approved', 'rejected', 'expired', 'disabled'].map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  filter === status
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && ` (${getCountByStatus(status)})`}
                {status === 'all' && ` (${discounts.length})`}
              </button>
            ))}
          </div>
        </div>

        {/* Discounts Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
          {filteredDiscounts.length === 0 ? (
            <div className="p-8 text-center">
              <Tag className="mx-auto mb-4 text-gray-400" size={48} />
              <p className="text-gray-600 dark:text-gray-400">
                No discounts found for the selected filter.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Course
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Instructor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Original Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Discount Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Percentage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Dates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredDiscounts.map((course) => {
                    const isProcessing = processingIds.includes(course._id);
                    const discount = course.discount || {};
                    const originalPrice = course.originalCost || course.cost;
                    const discountPrice = discount.price;

                    return (
                      <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {course.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {course.instructor?.name || 'Unknown'}
                          </div>
                          <div className="text-xs text-gray-500">
                            {course.instructor?.email}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">
                            {originalPrice?.toLocaleString()} {course.currency}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-red-600 dark:text-red-400">
                            {discountPrice?.toLocaleString() || 'N/A'} {discountPrice ? course.currency : ''}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-bold text-green-600 dark:text-green-400">
                            {discount.percentage || 0}% OFF
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {discount.timerDays || 0} days
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(discount.status)}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            <div><strong>Requested:</strong> {formatDate(discount.requestedAt)}</div>
                            {discount.approvedAt && (
                              <div><strong>Approved:</strong> {formatDate(discount.approvedAt)}</div>
                            )}
                            {discount.startDate && (
                              <div><strong>Start:</strong> {formatDate(discount.startDate)}</div>
                            )}
                            {discount.endDate && (
                              <div><strong>End:</strong> {formatDate(discount.endDate)}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-2">
                            {discount.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleApprove(course._id)}
                                  disabled={isProcessing}
                                  className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900 rounded-lg transition-colors disabled:opacity-50"
                                  title="Approve"
                                >
                                  <Check size={18} />
                                </button>
                                <button
                                  onClick={() => handleReject(course._id)}
                                  disabled={isProcessing}
                                  className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors disabled:opacity-50"
                                  title="Reject"
                                >
                                  <X size={18} />
                                </button>
                              </>
                            )}
                            <button
                              onClick={() => handleDelete(course._id)}
                              disabled={isProcessing}
                              className="p-2 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
                              title="Delete Discount"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default DiscountManagement;
