import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  BookOpen, 
  FileText, 
  ChevronDown, 
  ChevronUp,
  Download,
  Filter
} from 'lucide-react';

const PaymentEarningsDetailed = () => {
  const [earnings, setEarnings] = useState([]);
  const [summary, setSummary] = useState({
    totalPayments: 0,
    totalRevenue: 0,
    platformEarnings: 0,
    instructorEarnings: 0
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    instructorId: '',
    courseId: '',
    startDate: '',
    endDate: '',
    currency: ''
  });
  const [instructors, setInstructors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [expandedRows, setExpandedRows] = useState({});
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchInstructorsAndCourses();
  }, []);

  useEffect(() => {
    fetchEarnings();
  }, [filters, page]);

  const fetchInstructorsAndCourses = async () => {
    try {
      const token = localStorage.getItem('token');
      const [instructorsRes, coursesRes] = await Promise.all([
        axios.get('/api/users/instructors', { headers: { Authorization: `Bearer ${token}` } }),
        axios.get('/api/courses', { headers: { Authorization: `Bearer ${token}` } })
      ]);
      setInstructors(instructorsRes.data.instructors || []);
      setCourses(coursesRes.data.courses || []);
    } catch (error) {
      console.error('Error fetching instructors/courses:', error);
    }
  };

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const params = {
        ...filters,
        page,
        limit: 50
      };

      const response = await axios.post('/api/instructor-earnings/admin/detailed-list', params, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setEarnings(response.data.data || []);
      setSummary(response.data.summary || summary);
      setTotalPages(response.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Error fetching earnings:', error);
      toast.error('Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const toggleRow = (earningId) => {
    setExpandedRows(prev => ({
      ...prev,
      [earningId]: !prev[earningId]
    }));
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/instructor-earnings/admin/export-detailed', filters, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-earnings-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Export successful');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      accrued: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      requested: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return badges[status] || 'bg-gray-100 text-gray-800';
  };

  const getAgreementTypeBadge = (type) => {
    const badges = {
      custom: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      global: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      legacy: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
    };
    return badges[type] || 'bg-gray-100 text-gray-800';
  };

  if (loading && earnings.length === 0) {
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
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Payment Earnings - Detailed View
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Complete breakdown of all instructor and platform earnings
            </p>
          </div>
          <button
            onClick={handleExport}
            className="btn-secondary flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Payments</h3>
              <Users className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{summary.totalPayments}</p>
          </div>

          <div className="card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
              <DollarSign className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">${(summary.totalRevenue / 100).toFixed(2)}</p>
          </div>

          <div className="card bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Platform Share</h3>
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">${(summary.platformEarnings / 100).toFixed(2)}</p>
          </div>

          <div className="card bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Instructor Share</h3>
              <Users className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">${(summary.instructorEarnings / 100).toFixed(2)}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="card mb-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="label">Instructor</label>
              <select
                className="input-field"
                value={filters.instructorId}
                onChange={(e) => setFilters({ ...filters, instructorId: e.target.value })}
              >
                <option value="">All Instructors</option>
                {instructors.map((instructor) => (
                  <option key={instructor._id} value={instructor._id}>
                    {instructor.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="label">Course</label>
              <select
                className="input-field"
                value={filters.courseId}
                onChange={(e) => setFilters({ ...filters, courseId: e.target.value })}
              >
                <option value="">All Courses</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.name}
                  </option>
                ))}
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
                onClick={() => setFilters({ instructorId: '', courseId: '', startDate: '', endDate: '', currency: '' })}
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
                  Instructor
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Course
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student Paid
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Split %
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {earnings.map((earning) => (
                <React.Fragment key={earning._id}>
                  <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                      {new Date(earning.accruedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {earning.instructor?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {earning.instructor?.email || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {earning.student?.name || 'N/A'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {earning.course?.name || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {earning.section?.name || ''}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                      ${(earning.studentPaidAmount / 100).toFixed(2)}
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {earning.currency}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="text-green-600 dark:text-green-400 font-medium">
                        {earning.instructorPercentage}% Instructor
                      </div>
                      <div className="text-purple-600 dark:text-purple-400 text-xs">
                        {earning.platformPercentage}% Platform
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(earning.status)}`}>
                        {earning.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => toggleRow(earning._id)}
                        className="text-primary-600 hover:text-primary-700 flex items-center"
                      >
                        {expandedRows[earning._id] ? (
                          <>
                            <ChevronUp className="w-4 h-4 mr-1" /> Hide
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-4 h-4 mr-1" /> Show
                          </>
                        )}
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedRows[earning._id] && (
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <td colSpan="8" className="px-6 py-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Earnings Breakdown */}
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                              <DollarSign className="w-4 h-4 mr-2 text-green-600" />
                              Earnings Breakdown
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Instructor Share:</span>
                                <span className="font-medium text-green-600 dark:text-green-400">
                                  ${(earning.instructorEarningAmount / 100).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Platform Share:</span>
                                <span className="font-medium text-purple-600 dark:text-purple-400">
                                  ${(earning.adminCommissionAmount / 100).toFixed(2)}
                                </span>
                              </div>
                              <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-600">
                                <span className="text-gray-900 dark:text-white font-semibold">Total Paid:</span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                  ${(earning.studentPaidAmount / 100).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Agreement Information */}
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                              <FileText className="w-4 h-4 mr-2 text-blue-600" />
                              Agreement Used
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center">
                                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getAgreementTypeBadge(earning.agreementType)}`}>
                                  {earning.agreementType || 'legacy'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Version:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  v{earning.agreementVersion || 1}
                                </span>
                              </div>
                              {earning.agreementId && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Agreement ID:</span>
                                  <span className="font-mono text-xs text-gray-600 dark:text-gray-400">
                                    {earning.agreementId.toString().substring(0, 8)}...
                                  </span>
                                </div>
                              )}
                              <div className="text-xs text-gray-500 dark:text-gray-500 pt-2 border-t border-gray-200 dark:border-gray-600">
                                This agreement was active when payment was processed
                              </div>
                            </div>
                          </div>

                          {/* Payment Metadata */}
                          <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                            <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                              <BookOpen className="w-4 h-4 mr-2 text-orange-600" />
                              Payment Details
                            </h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Method:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {earning.paymentMethod?.replace('_', ' ').toUpperCase() || 'N/A'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-600 dark:text-gray-400">Currency:</span>
                                <span className="font-medium text-gray-900 dark:text-white">
                                  {earning.currency}
                                </span>
                              </div>
                              {earning.requestedAt && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Requested:</span>
                                  <span className="text-gray-900 dark:text-white">
                                    {new Date(earning.requestedAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                              {earning.paidAt && (
                                <div className="flex justify-between">
                                  <span className="text-gray-600 dark:text-gray-400">Paid:</span>
                                  <span className="text-gray-900 dark:text-white">
                                    {new Date(earning.paidAt).toLocaleDateString()}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
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
    </div>
  );
};

export default PaymentEarningsDetailed;
