import React, { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Users, CreditCard, CheckCircle, Clock, ChevronDown, ChevronUp, Filter, Download, FileText, Receipt } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatPrice } from '../../utils/currency';

const PaymentEarnings = () => {
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
    endDate: ''
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
      link.download = originalName || `student_payment_receipt_${Date.now()}.pdf`;
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

  const getAgreementTypeBadge = (type) => {
    const badges = {
      custom: { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-800 dark:text-purple-400', label: 'Custom/Specific' },
      global: { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-800 dark:text-blue-400', label: 'General/Global' },
      legacy: { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-800 dark:text-gray-300', label: 'Legacy' }
    };
    return badges[type] || badges.legacy;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Platform Earnings Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track student payments and platform revenue
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
          <div className="flex items-center mb-4">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filters</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Instructor</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Course</label>
              <select
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Start Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">End Date</label>
              <input
                type="date"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => setFilters({ instructorId: '', courseId: '', startDate: '', endDate: '' })}
                className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Payments</h3>
              <Users className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">{summary.totalPayments}</p>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Total Revenue</h3>
              <DollarSign className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">${(summary.totalRevenue / 100).toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Platform Share</h3>
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">${(summary.platformEarnings / 100).toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-medium opacity-90">Instructor Share</h3>
              <Users className="w-5 h-5 opacity-75" />
            </div>
            <p className="text-3xl font-bold">${(summary.instructorEarnings / 100).toFixed(2)}</p>
          </div>
        </div>

        {/* Export Button */}
        <div className="flex justify-end mb-4">
          <button
            onClick={handleExport}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center"
          >
            <Download className="w-4 h-4 mr-2" />
            Export to CSV
          </button>
        </div>

        {/* Detailed Payments Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Detailed Payment Earnings</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Complete breakdown of all payments with instructor and platform shares</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Instructor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Course Total
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Balance Used
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student Paid
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Payment Type
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Split %
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {earnings.length === 0 ? (
                  <tr>
                    <td colSpan="10" className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                      <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p>No earnings found</p>
                    </td>
                  </tr>
                ) : (
                  earnings.map((earning) => {
                    const agreementBadge = getAgreementTypeBadge(earning.agreementType);
                    return (
                      <React.Fragment key={earning._id}>
                        <tr className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {new Date(earning.accruedAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {earning.instructor?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {earning.instructor?.email || ''}
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {earning.student?.name || 'N/A'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              {earning.course?.name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {earning.section?.name || ''}
                            </div>
                          </td>
                          {/* Course Total */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                              ${((earning.baseAmountSYP || earning.studentPaidAmount + (earning.balanceUsed || 0)) / 100).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Original Price
                            </div>
                          </td>
                          {/* Balance Used */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            {earning.balanceUsed > 0 ? (
                              <div className="text-sm font-medium text-green-600 dark:text-green-400">
                                ${(earning.balanceUsed / 100).toFixed(2)}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500 dark:text-gray-400">No Balance</span>
                            )}
                          </td>
                          {/* Student Actually Paid */}
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-bold text-gray-900 dark:text-white">
                              ${(earning.studentPaidAmount / 100).toFixed(2)}
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              {earning.currency}
                            </div>
                          </td>
                          {/* Payment Type */}
                          <td className="px-4 py-3 whitespace-nowrap">
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
                                {earning.paymentMethod?.replace('_', ' ').toUpperCase() || 'Regular'}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm">
                            <div className="space-y-1">
                              <div className="flex items-center">
                                <span className="font-semibold text-green-600 dark:text-green-400 mr-1">
                                  {earning.instructorPercentage}%
                                </span>
                                <span className="text-xs text-gray-500">Instructor</span>
                              </div>
                              <div className="flex items-center">
                                <span className="font-semibold text-purple-600 dark:text-purple-400 mr-1">
                                  {earning.platformPercentage}%
                                </span>
                                <span className="text-xs text-gray-500">Platform</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-center">
                            <button
                              onClick={() => toggleRow(earning._id)}
                              className="text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 flex items-center mx-auto text-sm"
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
                            <td colSpan="10" className="px-6 py-4">
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
                                      <span className="font-bold text-green-600 dark:text-green-400">
                                        ${(earning.instructorEarningAmount / 100).toFixed(2)}
                                      </span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Platform Share:</span>
                                      <span className="font-bold text-purple-600 dark:text-purple-400">
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

                                {/* Balance Usage Information */}
                                {(earning.balanceUsed > 0) && (
                                  <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-700">
                                    <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                      <span className="w-4 h-4 mr-2 text-purple-600">💰</span>
                                      Balance Usage
                                    </h4>
                                    <div className="space-y-2 text-sm">
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Balance Discount:</span>
                                        <span className="font-bold text-purple-600 dark:text-purple-400">
                                          ${(earning.balanceUsed / 100).toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Student Paid:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          ${(earning.studentPaidAmount / 100).toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between">
                                        <span className="text-gray-600 dark:text-gray-400">Original Course Price:</span>
                                        <span className="font-medium text-gray-900 dark:text-white">
                                          ${((earning.baseAmountSYP || earning.studentPaidAmount + earning.balanceUsed) / 100).toFixed(2)}
                                        </span>
                                      </div>
                                      <div className="flex justify-between pt-2 border-t border-purple-200 dark:border-purple-600">
                                        <span className="text-gray-900 dark:text-white font-semibold">Discount %:</span>
                                        <span className="font-bold text-purple-600 dark:text-purple-400">
                                          {earning.balanceDiscountPercentage || 
                                            Math.round((earning.balanceUsed / (earning.baseAmountSYP || earning.studentPaidAmount + earning.balanceUsed)) * 100)}%
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                )}

                                {/* Agreement Information */}
                                <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <FileText className="w-4 h-4 mr-2 text-blue-600" />
                                    Agreement Used
                                  </h4>
                                  <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                      <span className="text-gray-600 dark:text-gray-400">Type:</span>
                                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${agreementBadge.bg} ${agreementBadge.text}`}>
                                        {agreementBadge.label}
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
                                      {earning.agreementType === 'custom' ? 
                                        'This is a specific custom agreement for this instructor with negotiated percentages.' :
                                        'This payment uses the general platform-wide agreement percentage.'}
                                    </div>
                                  </div>
                                </div>

                                {/* Payment Metadata */}
                                <div className="bg-white dark:bg-gray-700 rounded-lg p-4">
                                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
                                    <CreditCard className="w-4 h-4 mr-2 text-orange-600" />
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
                                    <div className="flex justify-between">
                                      <span className="text-gray-600 dark:text-gray-400">Status:</span>
                                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                                        {earning.status}
                                      </span>
                                    </div>
                                    {earning.sectionPayment?.receipt?.url && (
                                      <div className="pt-2 border-t border-gray-200 dark:border-gray-600">
                                        <button
                                          onClick={() => handleDownloadReceipt(earning.sectionPayment.receipt.url, earning.sectionPayment.receipt.originalName)}
                                          className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium flex items-center justify-center gap-2"
                                        >
                                          <Receipt className="w-4 h-4" />
                                          Download Student Receipt
                                        </button>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center mt-6 space-x-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="flex items-center px-4 text-gray-700 dark:text-gray-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentEarnings;
