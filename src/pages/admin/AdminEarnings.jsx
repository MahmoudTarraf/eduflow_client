import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DollarSign, TrendingUp, Download, FileText, ChevronDown, ChevronUp } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const AdminEarnings = () => {
  const { user, weakPassword } = useAuth();
  const [summary, setSummary] = useState({ totalEarnings: 0, transactionCount: 0 });
  const [earnings, setEarnings] = useState([]);
  const [courseBreakdown, setCourseBreakdown] = useState([]);
  const [instructorBreakdown, setInstructorBreakdown] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions');
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    courseId: '',
    instructorId: ''
  });
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [expandedItems, setExpandedItems] = useState({});
  const [showWeakPasswordModal, setShowWeakPasswordModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, [page, filters]);

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

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const [summaryRes, earningsRes, courseRes, instructorRes] = await Promise.all([
        axios.get(`/api/admin/earnings/summary?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.post('/api/admin/earnings/list', {
          ...filters,
          page,
          limit: 50
        }, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/admin/earnings/by-course?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`/api/admin/earnings/by-instructor?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setSummary(summaryRes.data.data);
      setEarnings(earningsRes.data.data);
      setTotalPages(earningsRes.data.pagination.pages);
      setCourseBreakdown(courseRes.data.data);
      setInstructorBreakdown(instructorRes.data.data);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to fetch earnings data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/admin/earnings/export', filters, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admin_earnings_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Earnings exported successfully');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export earnings');
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
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
              Platform commission from all transactions
            </p>
          </div>
          <button onClick={handleExport} className="btn-secondary flex items-center">
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-primary-500 to-primary-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Earnings</h3>
              <DollarSign className="w-6 h-6 opacity-75" />
            </div>
            <p className="text-4xl font-bold">${(summary.totalEarnings / 100).toFixed(2)}</p>
            <p className="text-sm opacity-75 mt-1">Platform commission (all-time)</p>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Transactions</h3>
              <TrendingUp className="w-6 h-6 opacity-75" />
            </div>
            <p className="text-4xl font-bold">{summary.transactionCount}</p>
            <p className="text-sm opacity-75 mt-1">Completed payments</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                onClick={() => setFilters({ startDate: '', endDate: '', courseId: '', instructorId: '' })}
                className="btn-secondary w-full"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex space-x-2 mb-6">
          {[
            { id: 'transactions', label: 'All Transactions' },
            { id: 'courses', label: 'By Course' },
            { id: 'instructors', label: 'By Instructor' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Transactions Tab */}
        {activeTab === 'transactions' && (
          <div className="card overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Instructor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Your Share</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {earnings.map((earning) => (
                  <tr key={earning._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(earning.transactionDate).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {earning.student?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      {earning.course?.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 dark:text-white">
                      <div className="flex items-center space-x-2">
                        <span>{earning.instructor?.name}</span>
                        {(earning.instructor?.isDeleted || earning.instructor?.status === 'deleted') && (
                          <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                            Deleted Instructor
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      ${(earning.totalAmount / 100).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        ${(earning.adminEarningAmount / 100).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {earning.adminCommissionPercentage}%
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {earnings.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
              </div>
            )}
          </div>
        )}

        {/* By Course Tab */}
        {activeTab === 'courses' && (
          <div className="space-y-3">
            {courseBreakdown.map((course) => (
              <div key={course._id} className="card">
                <button
                  onClick={() => toggleExpand(course._id)}
                  className="w-full flex items-center justify-between"
                >
                  <div className="flex-1 text-left">
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {course.courseName}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {course.transactionCount} transactions
                    </p>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                        ${(course.totalEarnings / 100).toFixed(2)}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Revenue: ${(course.totalRevenue / 100).toFixed(2)}
                      </p>
                    </div>
                    {expandedItems[course._id] ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>
              </div>
            ))}

            {courseBreakdown.length === 0 && (
              <div className="card text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No course data found</p>
              </div>
            )}
          </div>
        )}

        {/* By Instructor Tab */}
        {activeTab === 'instructors' && (
          <div className="space-y-3">
            {instructorBreakdown.map((instructor) => (
              <div key={instructor._id} className="card">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {instructor.instructorName}
                      </h3>
                      {(instructor.isDeleted || instructor.instructorStatus === 'deleted') && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
                          Deleted Instructor
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {instructor.instructorEmail} • {instructor.transactionCount} transactions
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-bold text-primary-600 dark:text-primary-400">
                      ${(instructor.totalAdminEarnings / 100).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Total Revenue: ${(instructor.totalRevenue / 100).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      Instructor earned: ${(instructor.totalInstructorEarnings / 100).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {instructorBreakdown.length === 0 && (
              <div className="card text-center py-12">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 dark:text-gray-400">No instructor data found</p>
              </div>
            )}
          </div>
        )}

        {/* Pagination */}
        {activeTab === 'transactions' && totalPages > 1 && (
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
    </div>
  );
};

export default AdminEarnings;
