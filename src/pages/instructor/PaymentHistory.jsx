import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Download, RefreshCw, Filter, Calendar, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const PAGE_SIZE = 10;

const StatusBadge = ({ status }) => {
  const map = {
    approved: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    cancelled: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs capitalize ${map[status] || 'bg-gray-100 text-gray-800'}`}>{status}</span>
  );
};

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState({ status: '', startDate: '', endDate: '' });
  const [refreshing, setRefreshing] = useState(false);

  const queryParams = useMemo(() => {
    const qp = new URLSearchParams();
    qp.set('page', page);
    qp.set('limit', PAGE_SIZE);
    if (filters.status) qp.set('status', filters.status);
    // Note: backend currently supports status; dates kept for future extension
    return qp.toString();
  }, [page, filters]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/payout-requests/my-requests?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data.data || []);
      setTotal(res.data.pagination?.total || 0);
      setPages(res.data.pagination?.pages || 1);
    } catch (error) {
      console.error('Fetch payout requests error:', error);
      toast.error(error.response?.data?.message || 'Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryParams]);

  const handleReRequest = async (id) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`/api/payout-requests/${id}/re-request`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Re-request submitted');
      fetchRequests();
    } catch (error) {
      console.error('Re-request error:', error);
      toast.error(error.response?.data?.message || 'Failed to re-request');
    }
  };

  const handleDownloadProof = async (proof) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(proof.url, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = proof.originalName || `payout_receipt_${Date.now()}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      toast.error('Failed to download receipt');
    }
  };

  const resetFilters = () => setFilters({ status: '', startDate: '', endDate: '' });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="text-indigo-600 dark:text-indigo-400 hover:underline flex items-center">
              <ArrowLeft className="w-5 h-5 mr-1" /> Back
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white ml-2">Payment History</h1>
          </div>
          <button
            onClick={() => { setRefreshing(true); fetchRequests().finally(() => setRefreshing(false)); }}
            className="btn-secondary flex items-center"
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
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
                <option value="">All</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="label flex items-center gap-2"><Calendar className="w-4 h-4" /> Start Date</label>
              <input type="date" className="input-field" value={filters.startDate} onChange={(e)=>setFilters({ ...filters, startDate: e.target.value })} />
            </div>
            <div>
              <label className="label flex items-center gap-2"><Calendar className="w-4 h-4" /> End Date</label>
              <input type="date" className="input-field" value={filters.endDate} onChange={(e)=>setFilters({ ...filters, endDate: e.target.value })} />
            </div>
            <div className="flex items-end gap-2">
              <button onClick={fetchRequests} className="btn-primary flex items-center gap-2"><Filter className="w-4 h-4" /> Apply</button>
              <button onClick={resetFilters} className="btn-secondary">Clear</button>
            </div>
          </div>
        </div>

        {/* List */}
        <div className="card overflow-x-auto">
          {loading ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">Loading...</div>
          ) : requests.length === 0 ? (
            <div className="py-12 text-center text-gray-500 dark:text-gray-400">No payout requests found</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Requested At</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Processed</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {requests.map((r) => (
                  <tr key={r._id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{new Date(r.requestedAt || r.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{(r.requestedAmount/100).toLocaleString()} {r.currency}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm"><StatusBadge status={r.status} /></td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">{r.processedAt ? new Date(r.processedAt).toLocaleString() : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-2">
                      {r.status === 'rejected' && (
                        <button onClick={() => handleReRequest(r._id)} className="px-3 py-1 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">Re-request</button>
                      )}
                      {r.status === 'approved' && r.payoutProof?.url && (
                        <button onClick={() => handleDownloadProof(r.payoutProof)} className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-1">
                          <Download className="w-4 h-4" /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center mt-6 items-center gap-2">
            <button className="btn-secondary" disabled={page===1} onClick={()=>setPage(p => Math.max(1, p-1))}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-700 dark:text-gray-300">Page {page} of {pages} ({total} total)</span>
            <button className="btn-secondary" disabled={page===pages} onClick={()=>setPage(p => Math.min(pages, p+1))}>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Link back to Earnings */}
        <div className="mt-8 text-center">
          <Link to="/instructor/earnings" className="text-indigo-600 dark:text-indigo-400 hover:underline">Go to My Earnings</Link>
        </div>
      </div>
    </div>
  );
};

export default PaymentHistory;
