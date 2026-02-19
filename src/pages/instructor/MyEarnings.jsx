import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DollarSign, TrendingUp, Clock, XCircle, Download, FileText, ChevronDown, ChevronUp, Receipt } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { isInstructorRestricted } from '../../utils/restrictions';

const MyEarnings = () => {
  const { user } = useAuth();
  const [summary, setSummary] = useState({
    accrued: { amount: 0, count: 0 },
    requested: { amount: 0, count: 0 },
    paid: { amount: 0, count: 0 },
    rejected: { amount: 0, count: 0 }
  });
  const [earnings, setEarnings] = useState([]);
  const [courseBreakdown, setCourseBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    courseId: '',
    startDate: '',
    endDate: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [payoutSettings, setPayoutSettings] = useState(null);
  const [adminSettings, setAdminSettings] = useState(null);
  const [requestForm, setRequestForm] = useState({
    paymentMethod: '',
    receiverDetailsId: ''
  });
  const [requesting, setRequesting] = useState(false);
  const [expandedCourses, setExpandedCourses] = useState({});
  const [miniRequests, setMiniRequests] = useState([]);
  const [isReqOpen, setIsReqOpen] = useState(false);
  const reqRef = useRef(null);
  const cannotRequestPayoutByRestriction = isInstructorRestricted(user, 'requestPayout');

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters]);

  // Fetch last 2 payout requests for dropdown
  useEffect(() => {
    const fetchMini = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/payout-requests/my-requests?limit=2', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMiniRequests(res.data.data || []);
      } catch (e) {}
    };
    fetchMini();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const onDocClick = (e) => {
      if (reqRef.current && !reqRef.current.contains(e.target)) setIsReqOpen(false);
    };
    if (isReqOpen) document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [isReqOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [summaryRes, earningsRes, breakdownRes, settingsRes, adminSettingsRes] = await Promise.all([
        axios.get('/api/instructor-earnings/summary', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.post('/api/instructor-earnings/list', {
          ...filters,
          page,
          limit: 50
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/instructor-earnings/by-course', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get('/api/instructor/settings', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { data: null } })),
        axios.get('/api/admin/settings/public').catch(() => ({ data: { data: null } }))
      ]);

      setSummary(summaryRes.data.data);
      setEarnings(earningsRes.data.data);
      setTotalPages(earningsRes.data.pagination.pages);
      setCourseBreakdown(breakdownRes.data.data);
      
      // Set admin settings
      if (adminSettingsRes.data.data) {
        setAdminSettings(adminSettingsRes.data.data);
      }
      
      // Set payout settings
      if (settingsRes.data.data) {
        setPayoutSettings(settingsRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleReRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/payout-requests/${requestId}/re-request`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Payout re-requested');
      fetchData();
    } catch (error) {
      console.error('Re-request error:', error);
      toast.error(error.response?.data?.message || 'Failed to re-request payout');
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/instructor-earnings/export', filters, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `earnings_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Earnings exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export earnings');
    }
  };

  const handleDownloadReceipt = async (receiptUrl, originalName) => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch the file as a blob
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

  const toggleCourseExpansion = (courseId) => {
    setExpandedCourses(prev => ({
      ...prev,
      [courseId]: !prev[courseId]
    }));
  };

  const handleRequestPayout = async () => {
    if (cannotRequestPayoutByRestriction) {
      toast.error('Your instructor account is suspended. You cannot request payouts right now.');
      return;
    }

    try {
      if (!requestForm.receiverDetailsId) {
        toast.error('Please select receiver details');
        return;
      }

      if (!requestForm.requestedAmount) {
        toast.error('Please enter a valid payout amount');
        return;
      }

      setRequesting(true);
      const token = localStorage.getItem('token');
      
      console.log('Submitting payout request with data:', requestForm);
      
      await axios.post('/api/payout-requests/create', requestForm, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Payout request submitted successfully! Admin will review it shortly.');
      setShowRequestModal(false);
      setRequestForm({ paymentMethod: '', receiverDetailsId: '' }); // Reset form
      fetchData(); // Refresh data
    } catch (error) {
      console.error('Request payout error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit payout request');
    } finally {
      setRequesting(false);
    }
  };

  const availableAmount = summary.available?.amount || 0;
  const minimumPayoutSYP = adminSettings?.minimumPayoutAmountSYP || 10000;
  const minimumPayoutCents = minimumPayoutSYP * 100;
  const canRequestPayoutByBalance = availableAmount >= minimumPayoutCents;
  const canRequestPayout = canRequestPayoutByBalance && !cannotRequestPayoutByRestriction;

  const getStatusBadge = (status) => {
    const badges = {
      accrued: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Earnings</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Track your income from student payments
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/instructor/payment-history" className="btn-primary flex items-center">
              <Receipt className="w-4 h-4 mr-2" />
              Payment History
            </Link>
            <button onClick={handleExport} className="btn-secondary flex items-center">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </button>
          </div>
        </div>

        {/* Multi-Currency Earnings Breakdown */}
        {summary.available?.byCurrency && Object.keys(summary.available.byCurrency).length > 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-green-600" />
              Available Balance by Currency
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {Object.entries(summary.available.byCurrency).map(([currency, data]) => (
                <div key={currency} className="border-2 border-green-200 dark:border-green-700 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">{currency}</span>
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(data.amount / 100).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{data.count} earnings</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Available Balance</h3>
              <DollarSign className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{(availableAmount / 100).toLocaleString()} SYP</p>
            <p className="text-sm opacity-75 mt-1">
              {cannotRequestPayoutByRestriction
                ? 'Your instructor account is temporarily restricted from requesting payouts. Please contact support if you believe this is a mistake.'
                : canRequestPayoutByBalance
                  ? 'Ready to request payout'
                  : `Not enough to request. Minimum payout is ${minimumPayoutSYP.toLocaleString()} SYP.`}
            </p>
            {canRequestPayout && (
              <button
                onClick={() => setShowRequestModal(true)}
                className="mt-4 w-full bg-white text-green-600 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition"
              >
                Request Payout
              </button>
            )}
          </div>

          <div className="card bg-gradient-to-br from-yellow-500 to-yellow-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Pending Requests</h3>
              <Clock className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{((summary.pending?.amount || 0) / 100).toLocaleString()} SYP</p>
            <p className="text-sm opacity-75 mt-1">{summary.pending?.count || 0} requests</p>
          </div>

          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Paid Out</h3>
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{((summary.paid?.amount || 0) / 100).toLocaleString()} SYP</p>
            <p className="text-sm opacity-75 mt-1">Lifetime earnings</p>
          </div>

          <div className="card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Rejected Requests</h3>
              <XCircle className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{((summary.rejected?.amount || 0) / 100).toLocaleString()} SYP</p>
            <p className="text-sm opacity-75 mt-1">{summary.rejected?.count || 0} requests</p>
          </div>
        </div>

        {/* ===== MY REQUESTS SECTION ===== */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-6" ref={reqRef}>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
              <DollarSign className="w-6 h-6 mr-2 text-indigo-600" />
              My Payout Requests
            </h2>
            <div className="relative">
              <button onClick={() => setIsReqOpen(!isReqOpen)} className="btn-secondary flex items-center">
                <DollarSign className="w-4 h-4 mr-2" />
                My Requests
              </button>
              {isReqOpen && (
                <div className="absolute right-0 mt-2 w-64 card shadow-lg z-10">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                      <DollarSign className="w-4 h-4 text-green-600" />
                      <span className="font-medium">Recent</span>
                    </div>
                    <Link to="/instructor/payment-history" className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline" onClick={() => setIsReqOpen(false)}>View all</Link>
                  </div>
                  {miniRequests.length === 0 ? (
                    <div className="text-xs text-gray-500 dark:text-gray-400">No requests yet</div>
                  ) : (
                    <div className="space-y-2">
                      {miniRequests.map(r => (
                        <div key={r._id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700 dark:text-gray-300">{(r.requestedAmount/100).toLocaleString()} {r.currency}</span>
                          <span className={`px-2 py-0.5 rounded-full text-xs capitalize ${
                            r.status === 'approved' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' :
                            r.status === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300' :
                            r.status === 'rejected' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}>{r.status}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Pending Requests */}
          {summary.pending?.requests && summary.pending.requests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-yellow-600 dark:text-yellow-400 mb-3">
                ⏳ Pending ({summary.pending.count})
              </h3>
              <div className="space-y-3">
                {summary.pending.requests.map((request) => (
                  <div key={request._id} className="border-2 border-yellow-200 dark:border-yellow-700 rounded-lg p-4 bg-yellow-50 dark:bg-yellow-900/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {((request.requestedAmount || 0) / 100).toLocaleString()} SYP
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-yellow-200 dark:bg-yellow-700 text-yellow-800 dark:text-yellow-100">
                          Pending
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Rejected Requests */}
          {summary.rejected?.requests && summary.rejected.requests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-3">
                ❌ Rejected ({summary.rejected.count})
              </h3>
              <div className="space-y-3">
                {summary.rejected.requests.map((request) => (
                  <div key={request._id} className="border-2 border-red-200 dark:border-red-700 rounded-lg p-4 bg-red-50 dark:bg-red-900/20">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {((request.requestedAmount || 0) / 100).toLocaleString()} SYP
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Requested: {new Date(request.createdAt).toLocaleDateString()}
                        </p>
                        {request.rejectionReason && (
                          <p className="text-sm text-red-600 dark:text-red-400 mt-1">
                            Reason: {request.rejectionReason}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-red-200 dark:bg-red-700 text-red-800 dark:text-red-100">
                          Rejected
                        </span>
                        <button
                          onClick={() => handleReRequest(request._id)}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium"
                        >
                          Request Again
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Paid Requests */}
          {summary.paid?.requests && summary.paid.requests.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-green-600 dark:text-green-400 mb-3">
                ✅ Paid ({summary.paid.requests.length})
              </h3>
              <div className="space-y-3">
                {summary.paid.requests.map((request) => (
                  <div key={request._id} className="border-2 border-green-200 dark:border-green-700 rounded-lg p-4 bg-green-50 dark:bg-green-900/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-bold text-gray-900 dark:text-white">
                          {((request.requestedAmount || 0) / 100).toLocaleString()} SYP
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Paid: {new Date(request.processedAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-200 dark:bg-green-700 text-green-800 dark:text-green-100">
                          Paid
                        </span>
                        {request.payoutProof?.url && (
                          <button
                            onClick={() => handleDownloadReceipt(request.payoutProof.url, request.payoutProof.originalName)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No Requests Message */}
          {(!summary.pending?.requests || summary.pending.requests.length === 0) &&
           (!summary.rejected?.requests || summary.rejected.requests.length === 0) &&
           (!summary.paid?.requests || summary.paid.requests.length === 0) && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>No payout requests yet</p>
              <p className="text-sm mt-2">Click "Request Payout" above when you have sufficient balance</p>
            </div>
          )}
        </div>

        {/* ===== STUDENT PAYMENTS SECTION ===== */}
        {/* Course Breakdown */}
        {courseBreakdown.length > 0 && (
          <div className="card mb-8">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Earnings by Course
            </h2>
            <div className="space-y-3">
              {courseBreakdown.map((course) => (
                <div key={course._id} className="border border-gray-200 dark:border-gray-700 rounded-lg">
                  <button
                    onClick={() => toggleCourseExpansion(course._id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <div className="flex-1 text-left">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {course.courseName}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {course.studentCount} students • ${(course.totalEarnings / 100).toFixed(2)} total
                      </p>
                    </div>
                    {expandedCourses[course._id] ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  
                  {expandedCourses[course._id] && (
                    <div className="p-4 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Your Total Earnings</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${(course.totalEarnings / 100).toFixed(2)}
                          </p>
                        </div>
                        <div>
                          <p className="text-gray-600 dark:text-gray-400">Total Student Payments</p>
                          <p className="font-semibold text-gray-900 dark:text-white">
                            ${(course.totalStudentPayments / 100).toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-3">
                        💡 Track your payout status in the "My Payout Requests" section above
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Student Payments Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-blue-600" />
            Student Payments
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            All payments received from students with your share breakdown
          </p>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="label">Status</label>
              <select
                className="input-field"
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="">All Statuses</option>
                <option value="accrued">Accrued</option>
                <option value="requested">Requested</option>
                <option value="paid">Paid</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
            <div>
              <label className="label">Start Date</label>
              <input
                type="date"
                className="input-field"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>
            <div>
              <label className="label">End Date</label>
              <input
                type="date"
                className="input-field"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({ status: '', courseId: '', startDate: '', endDate: '' })}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Earnings Table */}
        <div className="card overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course / Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course Total
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Balance Used
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Payment Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Split %
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {earnings.map((earning) => {
                const originalAmountCents = earning.baseAmountSYP || (earning.studentPaidAmount + (earning.balanceUsed || 0));
                const platformPercentage = earning.platformPercentage != null
                  ? earning.platformPercentage
                  : (100 - earning.instructorPercentage);

                return (
                  <tr key={earning._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(earning.accruedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {earning.student?.name}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {earning.student?.email}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{earning.course?.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{earning.section?.name}</div>
                    </td>
                    {/* Course Total (original cost) */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {((originalAmountCents || 0) / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Original Price
                      </div>
                    </td>
                    {/* Balance Used */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {earning.balanceUsed > 0 ? (
                        <div className="text-sm font-medium text-green-600 dark:text-green-400">
                          {(earning.balanceUsed / 100).toFixed(2)}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-500 dark:text-gray-400">No Balance</span>
                      )}
                    </td>
                    {/* Student Paid */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900 dark:text-white">
                        {(earning.studentPaidAmount / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {earning.currency}
                      </div>
                    </td>
                    {/* Payment Type */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      {earning.balanceUsed > 0 && earning.studentPaidAmount === 0 ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                          Wallet Only
                        </span>
                      ) : earning.balanceUsed > 0 ? (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                          Mixed Payment
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          {earning.paymentMethod?.replace('_', ' ').toUpperCase() || 'REGULAR'}
                        </span>
                      )}
                    </td>
                    {/* Split % */}
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <span className="font-semibold text-green-600 dark:text-green-400 mr-1">
                            {earning.instructorPercentage}%
                          </span>
                          <span className="text-xs text-gray-500">Your share</span>
                        </div>
                        <div className="flex items-center">
                          <span className="font-semibold text-purple-600 dark:text-purple-400 mr-1">
                            {platformPercentage}%
                          </span>
                          <span className="text-xs text-gray-500">Platform</span>
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {earnings.length === 0 && (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No earnings found</p>
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Request Payout Modal */}
      {showRequestModal && (
        <RequestPayoutModal
          summary={summary}
          payoutSettings={payoutSettings}
          adminSettings={adminSettings}
          requestForm={requestForm}
          setRequestForm={setRequestForm}
          requesting={requesting}
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleRequestPayout}
        />
      )}
    </div>
  );
};
const RequestPayoutModal = ({ summary, payoutSettings, adminSettings, requestForm, setRequestForm, requesting, onClose, onSubmit }) => {
  // Use the available amount (accrued + rejected earnings)
  const totalAvailable = summary.available?.amount || 0;
  const minimumPayout = (adminSettings?.minimumPayoutAmountSYP || 10000) * 100;

  const providerOptions = Array.isArray(adminSettings?.paymentProviders)
    ? adminSettings.paymentProviders.filter((p) => p && p.key && p.name && p.isActive !== false)
    : [];

  const [amountError, setAmountError] = React.useState('');
  const [amountInput, setAmountInput] = React.useState('');
  
  // Initialize requestedAmount when modal opens
  React.useEffect(() => {
    if (amountInput) return;
    if (!totalAvailable) return;
    // Set the initial requested amount to the full available balance
    setRequestForm(prev => ({ ...prev, requestedAmount: totalAvailable }));
    setAmountInput((totalAvailable / 100).toFixed(2));
  }, [amountInput, totalAvailable, setRequestForm]);
  
  // Get receiver details for selected payment method
  const receiverDetailsForMethod = React.useMemo(() => {
    if (!payoutSettings?.receiverDetails) return [];
    return payoutSettings.receiverDetails.filter(r => 
      (r.providerKey || r.paymentMethod) === requestForm.paymentMethod
    );
  }, [payoutSettings, requestForm.paymentMethod]);

  React.useEffect(() => {
    if (requestForm.paymentMethod) return;
    const nextMethod = providerOptions[0]?.key || 'other';
    setRequestForm(prev => ({ ...prev, paymentMethod: nextMethod }));
  }, [providerOptions, requestForm.paymentMethod, setRequestForm]);
  
  // Auto-select first receiver when payment method changes
  React.useEffect(() => {
    if (receiverDetailsForMethod.length > 0) {
      setRequestForm(prev => ({ ...prev, receiverDetailsId: receiverDetailsForMethod[0]._id }));
    } else {
      setRequestForm(prev => ({ ...prev, receiverDetailsId: '' }));
    }
  }, [requestForm.paymentMethod, receiverDetailsForMethod, setRequestForm]);
  
  // Handle amount input change with strict validation
  const handleAmountChange = (e) => {
    let value = e.target.value;
    
    // Only allow digits and one decimal point
    const hasInvalidChars = /[^0-9.]/.test(value);
    if (hasInvalidChars) {
      setAmountError('Only numbers are allowed. No letters or special characters.');
      return;
    }
    
    // Prevent multiple decimal points
    const decimalCount = (value.match(/\./g) || []).length;
    if (decimalCount > 1) {
      return;
    }
    
    setAmountInput(value);
    
    // Validate the amount
    if (!value || value === '.') {
      setAmountError('Please enter a valid amount');
      setRequestForm(prev => ({ ...prev, requestedAmount: null }));
      return;
    }
    
    const numericValue = parseFloat(value);
    
    if (isNaN(numericValue)) {
      setAmountError('Please enter a valid number');
      setRequestForm(prev => ({ ...prev, requestedAmount: null }));
      return;
    }
    
    if (numericValue <= 0) {
      setAmountError('Amount must be greater than 0');
      setRequestForm(prev => ({ ...prev, requestedAmount: null }));
      return;
    }
    
    const amountInCents = Math.round(numericValue * 100);
    
    if (amountInCents < minimumPayout) {
      setAmountError(`Minimum payout is ${(minimumPayout / 100).toLocaleString()} SYP`);
      setRequestForm(prev => ({ ...prev, requestedAmount: null }));
      return;
    }
    
    if (amountInCents > totalAvailable) {
      setAmountError(`Amount cannot exceed available balance of ${(totalAvailable / 100).toLocaleString()} SYP`);
      setRequestForm(prev => ({ ...prev, requestedAmount: null }));
      return;
    }
    
    // Valid amount
    setAmountError('');
    setRequestForm(prev => ({ ...prev, requestedAmount: amountInCents }));
    console.log('Amount updated to:', amountInCents, 'SYP (in smallest units)');
  };
  
  const selectedReceiver = receiverDetailsForMethod.find(r => r._id === requestForm.receiverDetailsId);
  const canRequest = totalAvailable >= minimumPayout && !amountError && amountInput && requestForm.receiverDetailsId;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        {/* Sticky Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Request Payout</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-300 text-2xl">
            ✕
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Available Balance</p>
            <p className="text-2xl font-bold text-green-600 dark:text-green-400">
              {(totalAvailable / 100).toLocaleString()} SYP
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Minimum payout: {(minimumPayout / 100).toLocaleString()} SYP
            </p>
          </div>
          
          {totalAvailable < minimumPayout && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3 mb-4">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                ⚠️ Your balance is below the minimum payout amount. You need {((minimumPayout - totalAvailable) / 100).toLocaleString()} SYP more.
              </p>
            </div>
          )}

          {/* Amount Field */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Amount to Withdraw (SYP) *
            </label>
            <input
              type="text"
              className={`w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white ${
                amountError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
              }`}
              value={amountInput}
              onChange={handleAmountChange}
              placeholder={(totalAvailable / 100).toFixed(2)}
            />
            {amountError && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                ⚠️ {amountError}
              </p>
            )}
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Enter amount between {(minimumPayout / 100).toLocaleString()} and {(totalAvailable / 100).toLocaleString()} SYP
            </p>
          </div>

          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method *
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-indigo-500"
              value={requestForm.paymentMethod}
              onChange={(e) => setRequestForm({ ...requestForm, paymentMethod: e.target.value })}
            >
              {providerOptions.length > 0 ? (
                providerOptions.map((p) => (
                  <option key={p.key} value={p.key}>{p.name}</option>
                ))
              ) : (
                <option value="other">Other</option>
              )}
            </select>
          </div>

          {/* Receiver Details */}
          {receiverDetailsForMethod.length === 0 ? (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">
                ❌ No receiver details for {requestForm.paymentMethod}
              </p>
              <p className="text-xs text-red-600 dark:text-red-400">
                Please go to Settings → Payout Settings to add receiver details for this payment method.
              </p>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Receiver Details for {requestForm.paymentMethod} *
              </label>
              {receiverDetailsForMethod.length === 1 ? (
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 border-2 border-indigo-200 dark:border-indigo-700">
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Name:</strong> {selectedReceiver?.receiverName}
                    </p>
                    <p className="text-gray-700 dark:text-gray-300">
                      <strong>Phone:</strong> {selectedReceiver?.receiverPhone}
                    </p>
                    {selectedReceiver?.receiverLocation && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Location:</strong> {selectedReceiver.receiverLocation}
                      </p>
                    )}
                    {selectedReceiver?.accountDetails && (
                      <p className="text-gray-700 dark:text-gray-300">
                        <strong>Account:</strong> {selectedReceiver.accountDetails}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  <select
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white focus:ring-indigo-500 mb-3"
                    value={requestForm.receiverDetailsId}
                    onChange={(e) => setRequestForm({ ...requestForm, receiverDetailsId: e.target.value })}
                  >
                    {receiverDetailsForMethod.map((receiver) => (
                      <option key={receiver._id} value={receiver._id}>
                        {receiver.receiverName} - {receiver.receiverPhone}
                      </option>
                    ))}
                  </select>
                  {selectedReceiver && (
                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Name:</strong> {selectedReceiver.receiverName}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Phone:</strong> {selectedReceiver.receiverPhone}
                        </p>
                        {selectedReceiver.receiverLocation && (
                          <p className="text-gray-700 dark:text-gray-300">
                            <strong>Location:</strong> {selectedReceiver.receiverLocation}
                          </p>
                        )}
                        {selectedReceiver.accountDetails && (
                          <p className="text-gray-700 dark:text-gray-300">
                            <strong>Account:</strong> {selectedReceiver.accountDetails}
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <button 
            onClick={onClose} 
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50" 
            disabled={requesting}
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={requesting || !canRequest || !requestForm.receiverDetailsId}
          >
            {requesting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Submitting...
              </span>
            ) : 'Submit Request'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MyEarnings;
