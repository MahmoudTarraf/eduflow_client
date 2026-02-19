import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { useAuth } from '../../contexts/AuthContext';
import { isInstructorRestricted } from '../../utils/restrictions';

const InstructorGrading = () => {
  const { user } = useAuth();
  const cannotGradeAssignments = isInstructorRestricted(user, 'gradeAssignments');
  const [pendingSubmissions, setPendingSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [grading, setGrading] = useState({});
  const [grades, setGrades] = useState({});
  const [downloadingSubmissionId, setDownloadingSubmissionId] = useState(null);
  const [showGradeConfirm, setShowGradeConfirm] = useState(false);
  const [submissionToGrade, setSubmissionToGrade] = useState(null);
  const [reuploadRequests, setReuploadRequests] = useState([]);
  const [loadingReuploads, setLoadingReuploads] = useState(true);
  const [processingReupload, setProcessingReupload] = useState({});

  useEffect(() => {
    fetchPendingSubmissions();
    fetchReuploadRequests();
  }, []);

  const fetchPendingSubmissions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await axios.get('/api/grading/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Filter out submissions with deleted content or missing student data
      const validSubmissions = (res.data.pendingGrades || []).filter(
        submission => submission.content && submission.content._id && submission.student && submission.student._id
      );
      
      setPendingSubmissions(validSubmissions);
      // Initialize grades state
      const initialGrades = {};
      validSubmissions.forEach(submission => {
        initialGrades[submission._id] = 50; // Default to 50%
      });
      setGrades(initialGrades);
    } catch (error) {
      console.error('Error fetching pending submissions:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch pending submissions');
    } finally {
      setLoading(false);
    }
  };

  const fetchReuploadRequests = async () => {
    try {
      setLoadingReuploads(true);
      const token = localStorage.getItem('token');

      const res = await axios.get('/api/grading/reuploads/pending', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReuploadRequests(res.data.data || []);
    } catch (error) {
      console.error('Error fetching reupload requests:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch reupload requests');
    } finally {
      setLoadingReuploads(false);
    }
  };

  const handleGradeChange = (submissionId, value) => {
    setGrades(prev => ({
      ...prev,
      [submissionId]: Math.min(100, Math.max(0, Number(value) || 0))
    }));
  };

  const handleGradeClick = (submissionId, submission) => {
    if (cannotGradeAssignments) {
      toast.error('Your instructor account is suspended. You cannot submit grades right now.');
      return;
    }

    setSubmissionToGrade({ id: submissionId, data: submission });
    setShowGradeConfirm(true);
  };

  const handleReuploadAction = async (request, action) => {
    if (cannotGradeAssignments) {
      toast.error('Your instructor account is suspended. You cannot approve or reject reupload requests right now.');
      return;
    }

    const requestId = request._id;

    try {
      setProcessingReupload(prev => ({ ...prev, [requestId]: true }));

      const token = localStorage.getItem('token');
      const url = `/api/contents/${request.content._id}/reupload/${action}`;

      let reasonText = '';
      const body = { studentId: request.student._id };

      if (action === 'reject') {
        // Simple prompt for optional rejection reason
        const input = window.prompt('Optional reason for rejection (shown to the student):');
        if (input && input.trim()) {
          reasonText = input.trim();
          body.reason = reasonText;
        }
      }

      await axios.post(url, body, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success(action === 'approve' ? 'Reupload request approved' : 'Reupload request rejected');
      setReuploadRequests(prev => prev.filter(r => r._id !== requestId));
    } catch (error) {
      console.error('Error processing reupload request:', error);
      toast.error(error.response?.data?.message || 'Failed to process reupload request');
    } finally {
      setProcessingReupload(prev => {
        const next = { ...prev };
        delete next[requestId];
        return next;
      });
    }
  };

  const submitGrade = async () => {
    if (!submissionToGrade) return;
    
    const submissionId = submissionToGrade.id;
    const submission = submissionToGrade.data;
    
    try {
      setGrading(prev => ({ ...prev, [submissionId]: true }));
      
      // Check if content and student still exist (not deleted)
      if (!submission.content || !submission.content._id) {
        toast.error('This assignment has been deleted. Removing from list...');
        setPendingSubmissions(prev => prev.filter(s => s._id !== submissionId));
        return;
      }
      
      if (!submission.student || !submission.student._id) {
        toast.error('Student information is missing. Removing from list...');
        setPendingSubmissions(prev => prev.filter(s => s._id !== submissionId));
        return;
      }
      
      const token = localStorage.getItem('token');
      const gradeValue = grades[submissionId];
      
      await axios.post(`/api/contents/${submission.content._id}/grade`, {
        studentId: submission.student._id,
        gradePercent: gradeValue,
        feedback: '' // In a real implementation, you might want to add feedback input
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Grade submitted successfully');
      // Remove the graded submission from the list
      setPendingSubmissions(prev => prev.filter(s => s._id !== submissionId));
      setShowGradeConfirm(false);
      setSubmissionToGrade(null);
    } catch (error) {
      console.error('Error submitting grade:', error);
      toast.error(error.response?.data?.message || 'Failed to submit grade');
    } finally {
      setGrading(prev => {
        const newState = { ...prev };
        delete newState[submissionId];
        return newState;
      });
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString();
  };

  // Group submissions by course and content type
  const groupedSubmissions = React.useMemo(() => {
    const grouped = {};
    
    pendingSubmissions.forEach(submission => {
      const courseId = submission.course?._id || 'unknown';
      const courseName = submission.course?.name || 'Unknown Course';
      const contentType = submission.content?.type || 'assignment'; // 'assignment' or 'project'
      
      if (!grouped[courseId]) {
        grouped[courseId] = {
          courseName,
          assignments: [],
          projects: []
        };
      }
      
      if (contentType === 'project') {
        grouped[courseId].projects.push(submission);
      } else {
        grouped[courseId].assignments.push(submission);
      }
    });
    
    return grouped;
  }, [pendingSubmissions]);

  const handleDownloadSubmission = async (submissionId, originalName) => {
    try {
      console.log('[InstructorDownload] Attempting to download submission:', submissionId);
      setDownloadingSubmissionId(submissionId);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`/api/grading/submissions/${submissionId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
        validateStatus: (status) => status < 500 // Accept all non-server-error statuses
      });
      
      console.log('[InstructorDownload] Response received:', {
        dataSize: response.data.size,
        dataType: response.data.type,
        status: response.status,
        headers: response.headers
      });
      
      // Status 204 means download was intercepted by external download manager (e.g., IDM)
      if (response.status === 204 || (response.status === 200 && response.data.size === 0)) {
        console.log('[InstructorDownload] Download intercepted by external download manager');
        toast.success('Download started (handled by download manager)');
        return;
      }
      
      // Check for actual error responses
      if (response.status >= 400) {
        throw new Error(`Server returned status ${response.status}`);
      }
      
      // Check if response is actually an error (JSON converted to blob)
      if (response.data.type && response.data.type.includes('json')) {
        // Convert blob back to JSON to get error message
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Download failed');
        } catch (e) {
          throw new Error('Invalid response from server');
        }
      }
      
      // Check if we actually got data
      if (!response.data || response.data.size === 0) {
        console.log('[InstructorDownload] Empty response - might be handled externally');
        toast.success('Download started');
        return;
      }
      
      // Get filename from Content-Disposition header or use provided name
      const contentDisposition = response.headers['content-disposition'];
      let filename = originalName || 'submission.rar';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/i);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/["']/g, '').trim();
        }
      }
      
      // Ensure filename has proper extension
      if (!filename.match(/\.(rar|zip)$/i)) {
        filename += '.rar';
      }
      
      console.log('[InstructorDownload] Creating download with filename:', filename);
      
      // Use response.data directly - it's already a Blob
      const url = window.URL.createObjectURL(response.data);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
      
      toast.success('Submission downloaded successfully');
    } catch (error) {
      console.error('[InstructorDownload] Error downloading submission:', error);
      toast.error(error.message || 'Failed to download submission');
    } finally {
      setTimeout(() => {
        setDownloadingSubmissionId((prev) => (prev === submissionId ? null : prev));
      }, 1200);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Assignment Grading
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Grade pending student submissions
          </p>
        </div>

        {cannotGradeAssignments && (
          <div className="mb-6 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 text-yellow-800 dark:text-yellow-100 px-4 py-3 rounded">
            Your instructor account is currently suspended from grading assignments. You can view pending submissions, but grading and reupload actions are disabled.
          </div>
        )}

        {/* Grade Confirmation Dialog */}
        <ConfirmDialog
          isOpen={showGradeConfirm}
          onClose={() => {
            setShowGradeConfirm(false);
            setSubmissionToGrade(null);
          }}
          onConfirm={submitGrade}
          title="Confirm Grade Submission"
          message={`Are you sure you want to submit a grade of ${submissionToGrade ? grades[submissionToGrade.id] : 0}% for ${submissionToGrade?.data?.student?.name || 'this student'}? This action cannot be easily undone.`}
          confirmText="Submit Grade"
          confirmButtonClass="bg-indigo-600 hover:bg-indigo-700 text-white"
          loading={submissionToGrade ? grading[submissionToGrade.id] : false}
          icon={
            <svg className="w-12 h-12 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
        />

        {/* Reupload Requests Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Reupload Requests</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Approve or reject one-time reupload requests from students.
              </p>
            </div>
          </div>

          {loadingReuploads ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              Loading reupload requests...
            </div>
          ) : reuploadRequests.length === 0 ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No pending reupload requests.
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {reuploadRequests.map((request) => (
                <div key={request._id} className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                  <div>
                    <h3 className="text-md font-medium text-gray-900 dark:text-white">
                      {request.student?.name || 'Unknown Student'}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {request.course?.name || 'Unknown Course'} • {request.content?.title || 'Unknown Item'} ({request.content?.type || 'assignment'})
                    </p>
                    {typeof request.gradePercent === 'number' && (
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                        Current grade: {Math.round((request.gradePercent || 0) * 100) / 100}%
                      </p>
                    )}
                    {request.reuploadReason && (
                      <p className="mt-2 text-xs text-gray-600 dark:text-gray-300">
                        Reason: {request.reuploadReason}
                      </p>
                    )}
                    {request.reuploadRequestedAt && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                        Requested at: {new Date(request.reuploadRequestedAt).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => handleReuploadAction(request, 'approve')}
                      disabled={processingReupload[request._id]}
                      className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingReupload[request._id] ? 'Approving...' : 'Approve'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReuploadAction(request, 'reject')}
                      disabled={processingReupload[request._id]}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {processingReupload[request._id] ? 'Rejecting...' : 'Reject'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <svg className="animate-spin mx-auto h-8 w-8 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading submissions...</p>
            </div>
          ) : pendingSubmissions.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
                No pending submissions
              </h3>
              <p className="mt-2 text-gray-500 dark:text-gray-400">
                All assignments have been graded.
              </p>
            </div>
          ) : (
            <div>
              {Object.entries(groupedSubmissions).map(([courseId, courseData]) => (
                <div key={courseId} className="mb-8">
                  {/* Course Header */}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 px-6 py-4">
                    <h2 className="text-xl font-bold text-white">
                      {courseData.courseName}
                    </h2>
                    <p className="text-sm text-indigo-100 mt-1">
                      {courseData.assignments.length} assignment{courseData.assignments.length !== 1 ? 's' : ''} • {courseData.projects.length} project{courseData.projects.length !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Assignments Section */}
                  {courseData.assignments.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <div className="bg-green-50 dark:bg-green-900/20 px-6 py-3">
                        <h3 className="text-md font-semibold text-green-800 dark:text-green-200">
                          📝 ASSIGNMENTS ({courseData.assignments.length})
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {courseData.assignments.map((submission) => (
                          <SubmissionRow
                            key={submission._id}
                            submission={submission}
                            grades={grades}
                            grading={grading}
                            handleGradeChange={handleGradeChange}
                            handleGradeClick={handleGradeClick}
                            handleDownloadSubmission={handleDownloadSubmission}
                            downloadingSubmissionId={downloadingSubmissionId}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Projects Section */}
                  {courseData.projects.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <div className="bg-purple-50 dark:bg-purple-900/20 px-6 py-3">
                        <h3 className="text-md font-semibold text-purple-800 dark:text-purple-200">
                          🎯 PROJECTS ({courseData.projects.length})
                        </h3>
                      </div>
                      <div className="divide-y divide-gray-200 dark:divide-gray-700">
                        {courseData.projects.map((submission) => (
                          <SubmissionRow
                            key={submission._id}
                            submission={submission}
                            grades={grades}
                            grading={grading}
                            handleGradeChange={handleGradeChange}
                            handleGradeClick={handleGradeClick}
                            handleDownloadSubmission={handleDownloadSubmission}
                            downloadingSubmissionId={downloadingSubmissionId}
                            formatDate={formatDate}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Submission Row Component
const SubmissionRow = ({ submission, grades, grading, handleGradeChange, handleGradeClick, handleDownloadSubmission, downloadingSubmissionId, formatDate }) => (
  <div className="p-6">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
          <span className="text-indigo-600 dark:text-indigo-400 font-medium">
            {submission.student?.name?.charAt(0)?.toUpperCase() || 'S'}
          </span>
        </div>
        <div className="ml-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            {submission.student?.name}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {submission.content?.title}
            {(submission.reuploadUsed || submission.initialGradePercent != null) && (
              <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200">
                Reupload
              </span>
            )}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Submitted on: {formatDate(submission.updatedAt)}
          </p>
          {submission.submissionFile && (
            <div className="mt-2">
              <button
                onClick={() => handleDownloadSubmission(submission._id, submission.submissionFile.originalName)}
                disabled={downloadingSubmissionId === submission._id}
                className={`inline-flex items-center text-xs text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 cursor-pointer ${
                  downloadingSubmissionId === submission._id ? 'opacity-60 cursor-not-allowed' : ''
                }`}
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {downloadingSubmissionId === submission._id ? 'Starting download...' : 'Download Submission'}
              </button>
            </div>
          )}
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Grade:
          </label>
          <input
            type="number"
            min="0"
            max="100"
            value={grades[submission._id] || 50}
            onChange={(e) => handleGradeChange(submission._id, e.target.value)}
            className="w-20 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <span className="text-sm text-gray-500 dark:text-gray-400">%</span>
        </div>
        <button
          onClick={() => handleGradeClick(submission._id, submission)}
          disabled={grading[submission._id]}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 focus:outline-none flex items-center"
        >
          {grading[submission._id] ? (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          ) : null}
          Submit Grade
        </button>
      </div>
    </div>
  </div>
);
export default InstructorGrading;
