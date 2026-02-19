import React, { useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { AlertCircle, CheckCircle, Clock, Trash2, X, ArrowLeft } from 'lucide-react';

const AdminDeleteRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [processingId, setProcessingId] = useState(null);
  const [actionModal, setActionModal] = useState({
    open: false,
    request: null,
    action: null,
    adminNote: ''
  });

  useEffect(() => {
    fetchRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const params = statusFilter ? { status: statusFilter } : {};
      const res = await axios.get('/api/delete-requests', {
        params,
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequests(res.data.data || []);
    } catch (error) {
      console.error('Error fetching delete requests:', error);
      toast.error(error.response?.data?.message || 'Failed to load delete requests');
    } finally {
      setLoading(false);
    }
  };

  const getTargetTypeLabel = (req) => {
    if (!req) return '-';
    switch (req.targetType) {
      case 'course':
        return 'Course';
      case 'group':
        return 'Group';
      case 'section':
        return 'Section';
      case 'content':
        return 'Content';
      default:
        return req.targetType || 'Unknown';
    }
  };

  const getTargetName = (req) => {
    if (!req) return '-';
    if (req.targetType === 'course') {
      return req.course?.name || '-';
    }
    if (req.targetType === 'group') {
      return req.group?.name || '-';
    }
    if (req.targetType === 'section') {
      return req.section?.name || '-';
    }
    if (req.targetType === 'content') {
      if (!req.content) return '-';
      const title = req.content.title || 'Untitled content';
      return req.content.type ? `${title} (${req.content.type})` : title;
    }
    return '-';
  };

  const getTargetContext = (req) => {
    if (!req) return '-';

    const courseName =
      req.course?.name ||
      req.group?.course?.name ||
      req.section?.course?.name ||
      req.content?.course?.name;

    const groupName =
      req.group?.name ||
      req.section?.group?.name ||
      req.content?.group?.name;

    const sectionName =
      req.section?.name ||
      req.content?.section?.name;

    const parts = [];
    if (courseName) parts.push(`Course: ${courseName}`);
    if (groupName) parts.push(`Group: ${groupName}`);
    if (sectionName) parts.push(`Section: ${sectionName}`);

    return parts.length ? parts.join(' • ') : '-';
  };

  const getTargetId = (req) => {
    if (!req) return '-';

    if (req.targetType === 'course') {
      return req.course?._id || req.course || '-';
    }

    if (req.targetType === 'group') {
      return req.group?._id || req.group || '-';
    }

    if (req.targetType === 'section') {
      return req.section?._id || req.section || '-';
    }

    if (req.targetType === 'content') {
      return req.content?._id || req.content || '-';
    }

    return '-';
  };

  const getEnrollmentInfoText = (req) => {
    if (!req || !req.analytics) return '';

    const count =
      typeof req.analytics.enrollmentCount === 'number'
        ? req.analytics.enrollmentCount
        : null;

    if (count === null) return '';

    const plural = count === 1 ? 'student' : 'students';

    if (req.targetType === 'course') {
      if (count > 0) {
        return `Course currently has ${count} ${plural} linked. Deletion may be blocked by safety rules.`;
      }
      return 'No active enrollments detected for this course.';
    }

    if (req.targetType === 'group') {
      if (count > 0) {
        return `Group currently has ${count} ${plural} linked. Deletion may be blocked unless enrollments are handled first.`;
      }
      return 'No active enrollments detected for this group.';
    }

    return '';
  };

  const openActionModal = (request, action) => {
    if (!request || !action) return;
    setActionModal({ open: true, request, action, adminNote: '' });
  };

  const closeActionModal = () => {
    setActionModal({ open: false, request: null, action: null, adminNote: '' });
  };

  const handleActionConfirm = async () => {
    const { request, action, adminNote } = actionModal;
    if (!request || !action) return;

    if (action === 'reject') {
      const trimmed = (adminNote || '').trim();
      if (trimmed.length < 20) {
        toast.error('Admin rejection note must be at least 20 characters.');
        return;
      }
    }

    try {
      setProcessingId(request._id);
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/delete-requests/${request._id}`,
        { action, adminNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchRequests();
      closeActionModal();
    } catch (error) {
      console.error('Error updating delete request:', error);
      toast.error(error.response?.data?.message || 'Failed to update delete request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAction = async (requestId, action) => {
    const actionLabel = action === 'approve' ? 'approve this delete request' : 'reject this delete request';
    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel}? This will be recorded in the audit log.`
    );
    if (!confirmed) return;

    const adminNote = window.prompt('Add an admin note explaining your decision (minimum 20 characters).') || '';
    const trimmedNote = adminNote.trim();
    if (action === 'reject' && trimmedNote.length < 20) {
      toast.error('Admin rejection note must be at least 20 characters.');
      return;
    }

    try {
      setProcessingId(requestId);
      const token = localStorage.getItem('token');
      await axios.patch(
        `/api/delete-requests/${requestId}`,
        { action, adminNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchRequests();
    } catch (error) {
      console.error('Error updating delete request:', error);
      toast.error(error.response?.data?.message || 'Failed to update delete request');
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (value) => {
    if (!value) return '-';
    return new Date(value).toLocaleString();
  };

  const getStatusBadgeClasses = (status) => {
    if (status === 'approved') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
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
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Delete Requests</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Review instructor requests to permanently delete courses, groups, sections, and content. Approving a request will attempt to delete the requested item immediately, subject to safety rules (for example, courses with enrolled students cannot be deleted).
            </p>
          </div>
          <Link
            to="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-200 dark:border-indigo-700 dark:hover:bg-indigo-900/50 text-sm font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
        </div>

        <div className="mb-6 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              statusFilter === 'pending'
                ? 'bg-yellow-600 text-white border-yellow-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'
            }`}
          >
            <Clock className="w-4 h-4 inline mr-1" /> Pending
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              statusFilter === 'approved'
                ? 'bg-green-600 text-white border-green-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'
            }`}
          >
            <CheckCircle className="w-4 h-4 inline mr-1" /> Approved
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-full text-sm border ${
              statusFilter === 'rejected'
                ? 'bg-red-600 text-white border-red-600'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border-gray-300 dark:border-gray-700'
            }`}
          >
            <AlertCircle className="w-4 h-4 inline mr-1" /> Rejected
          </button>
        </div>

        {requests.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-lg">No delete requests found for this filter.</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
            <div className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <div className="grid grid-cols-7 px-6 py-3 bg-gray-50 dark:bg-gray-900 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                <div>Type</div>
                <div>Target</div>
                <div>Requested By</div>
                <div>Reason</div>
                <div>Requested At</div>
                <div>Status</div>
                <div className="text-right">Actions</div>
              </div>
              {requests.map((req) => (
                <div
                  key={req._id}
                  className="grid grid-cols-7 px-6 py-4 text-sm items-center gap-3 border-t border-gray-100 dark:border-gray-700"
                >
                  <div className="font-medium text-gray-900 dark:text-gray-100">
                    {getTargetTypeLabel(req)}
                  </div>
                  <div className="text-gray-800 dark:text-gray-200">
                    <div>{getTargetName(req)}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {getTargetContext(req)}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-500 mt-0.5 break-all">
                      ID: {getTargetId(req)}
                    </div>
                    {getEnrollmentInfoText(req) && (
                      <div className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                        {getEnrollmentInfoText(req)}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-700 dark:text-gray-300">
                    <div>{req.requestedBy?.name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{req.requestedBy?.email}</div>
                  </div>
                  <div className="text-gray-600 dark:text-gray-300 whitespace-pre-line break-words">
                    {req.reason || '-'}
                    {req.status === 'rejected' && (req.rejectionReason || req.adminNote) && (
                      <div className="mt-1 text-xs text-red-700 dark:text-red-300">
                        <span className="font-semibold">Admin reason:</span>{' '}
                        {req.rejectionReason || req.adminNote}
                      </div>
                    )}
                  </div>
                  <div className="text-gray-600 dark:text-gray-300">
                    {formatDate(req.createdAt)}
                  </div>
                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClasses(
                        req.status
                      )}`}
                    >
                      {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2">
                    {req.status === 'pending' ? (
                      <>
                        <button
                          type="button"
                          onClick={() => openActionModal(req, 'approve')}
                          disabled={processingId === req._id}
                          className="px-3 py-1.5 rounded-md bg-green-600 text-white text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          {processingId === req._id ? 'Working...' : 'Approve'}
                        </button>
                        <button
                          type="button"
                          onClick={() => openActionModal(req, 'reject')}
                          disabled={processingId === req._id}
                          className="px-3 py-1.5 rounded-md bg-red-100 text-red-700 text-xs hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800 disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Resolved {formatDate(req.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {actionModal.open && actionModal.request && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {actionModal.action === 'approve' ? 'Approve Delete Request' : 'Reject Delete Request'}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {actionModal.action === 'approve'
                      ? 'Approving will attempt to permanently delete the target item immediately, respecting safety rules.'
                      : 'Provide a clear explanation for rejecting this delete request. This will be stored in the audit log.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeActionModal}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="px-6 py-4 space-y-4">
                <div className="text-sm text-gray-700 dark:text-gray-300">
                  <p className="mb-1">
                    <span className="font-medium">Type:</span> {getTargetTypeLabel(actionModal.request)}
                  </p>
                  <p className="mb-1">
                    <span className="font-medium">Target:</span> {getTargetName(actionModal.request)}
                  </p>
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400">
                    {getTargetContext(actionModal.request)}
                  </p>
                  <p className="mb-1 text-xs text-gray-500 dark:text-gray-400 break-all">
                    <span className="font-medium">Target ID:</span> {getTargetId(actionModal.request)}
                  </p>
                  {getEnrollmentInfoText(actionModal.request) && (
                    <p className="mb-1 text-xs text-yellow-700 dark:text-yellow-300">
                      {getEnrollmentInfoText(actionModal.request)}
                    </p>
                  )}
                  <p className="mb-1">
                    <span className="font-medium">Requested by:</span>{' '}
                    {actionModal.request.requestedBy?.name || 'Unknown'} ({
                      actionModal.request.requestedBy?.email || 'no email'
                    })
                  </p>
                  <p className="mb-1">
                    <span className="font-medium">Reason:</span>{' '}
                    <span className="whitespace-pre-line break-words">{actionModal.request.reason || '-'}</span>
                  </p>
                </div>

                {actionModal.action === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Admin note (minimum 20 characters)
                    </label>
                    <textarea
                      rows={4}
                      value={actionModal.adminNote}
                      onChange={(e) =>
                        setActionModal((prev) => ({ ...prev, adminNote: e.target.value }))
                      }
                      className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Explain why this request is being rejected..."
                    />
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {(actionModal.adminNote || '').trim().length} / 20
                    </p>
                  </div>
                )}

                {actionModal.action === 'approve' && (
                  <div className="text-xs text-yellow-700 bg-yellow-50 dark:text-yellow-200 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-md px-3 py-2">
                    Approving will delete the item where allowed. Courses with enrolled students and some
                    other items may still be protected by safety rules.
                  </div>
                )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeActionModal}
                  disabled={processingId === actionModal.request._id}
                  className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleActionConfirm}
                  disabled={processingId === actionModal.request._id}
                  className={`px-4 py-2 rounded-md text-sm font-medium text-white disabled:opacity-60 ${
                    actionModal.action === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {processingId === actionModal.request._id
                    ? 'Working...'
                    : actionModal.action === 'approve'
                      ? 'Approve & Delete'
                      : 'Reject Request'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDeleteRequests;
