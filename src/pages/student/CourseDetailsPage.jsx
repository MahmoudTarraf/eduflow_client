import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { formatPrice } from '../../utils/currency';
import { renderContentDescription } from '../../utils/textFormatting';
import { fireGamificationEvents } from '../../utils/gamificationUtils';
import { Lock, ChevronDown, ChevronRight, Play, FileText, CheckCircle, Download, ArrowLeft, Award, ClipboardCheck, Clock, XCircle } from 'lucide-react';
import EmbeddedVideoPlayer from '../../components/common/EmbeddedVideoPlayer';
import CustomYouTubePlayer from '../../components/common/CustomYouTubePlayer';
import Comments from '../../components/common/Comments';
import TourGuide from '../../components/common/TourGuide';
import { getCourseDetailsTour } from '../../config/tours';

const CourseDetailsPage = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedSections, setExpandedSections] = useState({});
  const [sectionContents, setSectionContents] = useState({});
  const [sectionTests, setSectionTests] = useState({});
  const [testAttempts, setTestAttempts] = useState({});
  const [selectedContent, setSelectedContent] = useState(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [downloadingContentId, setDownloadingContentId] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [reuploadReason, setReuploadReason] = useState('');
  const [requestingReupload, setRequestingReupload] = useState(false);
  const [certificateEligibility, setCertificateEligibility] = useState(null);
  const [storageConfig, setStorageConfig] = useState(null);
  const [submissionUploadProgress, setSubmissionUploadProgress] = useState(0);
  const [submissionUploadStage, setSubmissionUploadStage] = useState('idle');
  const [submissionUploadSessionId, setSubmissionUploadSessionId] = useState(null);
  const [hostedUploadStatus, setHostedUploadStatus] = useState(null);
  const [hostedUploadError, setHostedUploadError] = useState(null);

  const uploadPollIntervalRef = useRef(null);
  const uploadPollTimeoutRef = useRef(null);
  const uploadPollInFlightRef = useRef(false);
  const submissionUploadStageRef = useRef('idle');

  const fetchCertificateEligibilityForGroup = useCallback(async (groupId) => {
    if (!groupId) return;
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/certificates/my-eligibility', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const enrollments = res.data.enrolledCourses || [];
      const match = enrollments.find((enrollment) => {
        const enrollmentGroupId = enrollment.group?._id || enrollment.group?.id;
        return enrollmentGroupId && String(enrollmentGroupId) === String(groupId);
      });

      if (match) {
        setCertificateEligibility({
          status: match.eligibilityStatus,
          details: match.eligibilityDetails || {}
        });
      } else {
        setCertificateEligibility(null);
      }
    } catch (error) {
      console.error('Error fetching certificate eligibility for course details:', error);
    }
  }, []);

  const fetchCourseDetails = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const res = await axios.get(`/api/enroll/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const gradeRes = await axios.get(`/api/students/${user._id || user.id}/courses/${id}/grade`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const courseData = {
        ...res.data.course,
        grade: gradeRes.data.data.courseGrade,
        sectionGrades: gradeRes.data.data.sectionGrades,
        gradeStats: gradeRes.data.data.stats || {}
      };

      setCourse(courseData);

      if (courseData?.groupId) {
        fetchCertificateEligibilityForGroup(courseData.groupId);
      }
      
      if (courseData?.sections?.length > 0) {
        const firstFreeSection = courseData.sections.find(s => s.isFree || s.hasAccess);
        if (firstFreeSection) {
          handleSectionToggle(firstFreeSection._id, firstFreeSection.hasAccess || firstFreeSection.isFree);
        }
      }
    } catch (error) {
      console.error('Error fetching course details:', error);
      toast.error(error.response?.data?.message || 'Failed to fetch course details');
    } finally {
      setLoading(false);
    }
  }, [id, user, fetchCertificateEligibilityForGroup]);

  const fetchPaymentStatus = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/section-payments/course/${id}/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentStatus(res.data.data || {});
    } catch (error) {
      console.error('Error fetching payment status:', error);
      // Don't show error toast, just continue without payment status
    }
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;

    if (
      user.role === 'student' &&
      user.status === 'suspended' &&
      user.restrictions?.accessCoursePages
    ) {
      toast.error('Your account is suspended. You cannot access course pages.');
      navigate('/student');
      return;
    }

    fetchCourseDetails();
    fetchPaymentStatus();
  }, [id, user, fetchCourseDetails, fetchPaymentStatus, navigate]);

  useEffect(() => {
    const loadStorageConfig = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('/api/storage/config', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStorageConfig(res.data?.data || null);
      } catch (_) {
        setStorageConfig(null);
      }
    };

    loadStorageConfig();
  }, []);

  useEffect(() => {
    submissionUploadStageRef.current = submissionUploadStage;
  }, [submissionUploadStage]);

  const stopSubmissionUploadJobPolling = useCallback(() => {
    if (uploadPollIntervalRef.current) {
      clearInterval(uploadPollIntervalRef.current);
      uploadPollIntervalRef.current = null;
    }
    if (uploadPollTimeoutRef.current) {
      clearTimeout(uploadPollTimeoutRef.current);
      uploadPollTimeoutRef.current = null;
    }
    uploadPollInFlightRef.current = false;
  }, []);

  const pollSubmissionUploadJobOnce = useCallback(async (jobId, token) => {
    if (!jobId) return;
    if (uploadPollInFlightRef.current) return;
    uploadPollInFlightRef.current = true;
    try {
      const res = await axios.get(`/api/video-upload-jobs/${encodeURIComponent(jobId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const job = res?.data?.data;
      const percent = typeof job?.percent === 'number' ? job.percent : 0;
      const status = typeof job?.status === 'string' ? job.status : null;
      const jobError = typeof job?.error === 'string' ? job.error : null;

      setHostedUploadStatus(status);
      setHostedUploadError(jobError);

      if (submissionUploadStageRef.current === 'server' || submissionUploadStageRef.current === 'processing') {
        setSubmissionUploadProgress(percent);
      }

      if (status === 'completed' || status === 'failed' || status === 'canceled') {
        stopSubmissionUploadJobPolling();
      }
      if (status === 'processing' && submissionUploadStageRef.current === 'server') {
        setSubmissionUploadStage('processing');
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setHostedUploadStatus('queued');
        setHostedUploadError(null);
        return;
      }
    } finally {
      uploadPollInFlightRef.current = false;
    }
  }, [stopSubmissionUploadJobPolling]);

  const startSubmissionUploadJobPolling = useCallback((jobId, token) => {
    stopSubmissionUploadJobPolling();

    if (!jobId) return;

    uploadPollTimeoutRef.current = setTimeout(() => {
      pollSubmissionUploadJobOnce(jobId, token);
      uploadPollIntervalRef.current = setInterval(() => {
        pollSubmissionUploadJobOnce(jobId, token);
      }, 2000);
    }, 1200);
  }, [pollSubmissionUploadJobOnce, stopSubmissionUploadJobPolling]);

  const handleRequestReupload = async () => {
    if (!selectedContent || (selectedContent.type !== 'assignment' && selectedContent.type !== 'project')) {
      return;
    }

    const reuploadMeta = selectedContent.progress?.reupload;
    if (!reuploadMeta || !reuploadMeta.canRequest) {
      toast.error('You cannot request a reupload for this item.');
      return;
    }

    try {
      setRequestingReupload(true);
      const token = localStorage.getItem('token');
      await axios.post(
        `/api/contents/${selectedContent._id}/reupload/request`,
        { reason: reuploadReason },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Reupload request submitted and pending instructor approval.');

      // Clear cached section content so fresh reupload metadata is loaded
      const sectionId = selectedContent.section;
      setSectionContents((prev) => {
        const next = { ...prev };
        delete next[sectionId];
        return next;
      });

      const [_, newContents] = await Promise.all([
        fetchCourseDetails(),
        fetchSectionContent(sectionId, true)
      ]);

      if (Array.isArray(newContents)) {
        const updated = newContents.find((c) => c._id === selectedContent._id);
        if (updated) {
          setSelectedContent(updated);
        }
      }
    } catch (error) {
      console.error('Error requesting reupload:', error);
      toast.error(error.response?.data?.message || 'Failed to request reupload');
    } finally {
      setRequestingReupload(false);
    }
  };

  const handleSectionToggle = async (sectionId, hasAccess) => {
    if (!hasAccess) return;
    
    const isExpanded = expandedSections[sectionId];
    
    if (!isExpanded) {
      await fetchSectionContent(sectionId);
      await fetchSectionTests(sectionId);
    }
    
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const fetchSectionContent = async (sectionId, forceRefresh = false) => {
    // Skip only if we have actual content data (not null/undefined) and refresh is not forced
    if (!forceRefresh && sectionContents[sectionId] && Array.isArray(sectionContents[sectionId])) return sectionContents[sectionId];
    
    try {
      setLoadingContent(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/content/section/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = res.data.data || [];
      setSectionContents(prev => ({
        ...prev,
        [sectionId]: data
      }));
      return data;
    } catch (error) {
      console.error('Error fetching section content:', error);
      toast.error('Failed to load section content');
      return [];
    } finally {
      setLoadingContent(false);
    }
  };

  const fetchSectionTests = async (sectionId) => {
    // Skip if already fetched
    if (sectionTests[sectionId]) return;
    
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/active-tests/section/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const tests = res.data.tests || [];
      setSectionTests(prev => ({
        ...prev,
        [sectionId]: tests
      }));
      
      // Fetch attempts for each test
      for (const test of tests) {
        fetchTestAttempts(test._id);
      }
    } catch (error) {
      console.error('Error fetching section tests:', error);
      // Don't show error toast, just set empty array
      setSectionTests(prev => ({
        ...prev,
        [sectionId]: []
      }));
    }
  };

  const fetchTestAttempts = async (testId) => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`/api/active-tests/${testId}/attempts`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Store the attempts for this test
      const attempts = res.data.attempts || [];
      setTestAttempts(prev => ({
        ...prev,
        [testId]: attempts
      }));
    } catch (error) {
      console.error('Error fetching test attempts:', error);
      setTestAttempts(prev => ({
        ...prev,
        [testId]: []
      }));
    }
  };

  const handleSelectContent = (content) => {
    setSelectedContent(content);
    setReuploadReason('');
  };

  const handlePaySection = (sectionId) => {
    if (user?.status === 'suspended' && user?.restrictions?.continueCourses) {
      toast.error('Your account is suspended. You cannot make new payments or continue courses.');
      return;
    }

    navigate(`/student/section/${sectionId}/payment`);
  };

  const handlePayAllSections = () => {
    // Exclude sections with pending or approved payments
    const unpaidSections = course?.sections?.filter(s => {
      if (s.hasAccess || s.isFree) return false;
      const status = paymentStatus[s._id];
      // Exclude if payment is pending or approved
      if (status && (status.status === 'pending' || status.status === 'approved')) return false;
      return true;
    }) || [];
    if (unpaidSections.length === 0) {
      toast.error('No unpaid sections available');
      return;
    }
    if (user?.status === 'suspended' && user?.restrictions?.continueCourses) {
      toast.error('Your account is suspended. You cannot make new payments or continue courses.');
      return;
    }
    // Navigate to a special "pay all" page with all section IDs
    const sectionIds = unpaidSections.map(s => s._id).join(',');
    navigate(`/student/course/${course._id}/pay-all?sections=${sectionIds}`);
  };

  const calculateTotalUnpaidCost = () => {
    if (!course?.sections) return { total: 0, currency: 'SYP', count: 0 };
    // Exclude sections with pending or approved payments
    const unpaidSections = course.sections.filter(s => {
      if (s.hasAccess || s.isFree) return false;
      const status = paymentStatus[s._id];
      // Exclude if payment is pending or approved
      if (status && (status.status === 'pending' || status.status === 'approved')) return false;
      return true;
    });
    const total = unpaidSections.reduce((sum, s) => sum + (s.priceCents || 0), 0);
    const currency = unpaidSections[0]?.currency || 'SYP';
    return { total, currency, count: unpaidSections.length };
  };

  const refreshAfterVideoComplete = async () => {
    // Refresh data when video is completed
    if (selectedContent) {
      const sectionId = selectedContent.section;
      
      // Force refetch by directly calling the API and updating state
      try {
        const token = localStorage.getItem('token');
        const [courseResponse, contentResponse] = await Promise.all([
          axios.get(`/api/enroll/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`/api/content/section/${sectionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);
        
        const gradeRes = await axios.get(`/api/students/${user._id || user.id}/courses/${id}/grade`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const courseData = {
          ...courseResponse.data.course,
          grade: gradeRes.data.data.courseGrade,
          sectionGrades: gradeRes.data.data.sectionGrades
        };
        
        setCourse(courseData);
        
        // Update section contents without deleting
        setSectionContents(prev => ({
          ...prev,
          [sectionId]: contentResponse.data.data || []
        }));
      } catch (error) {
        console.error('Error refreshing after video complete:', error);
        toast.error('Failed to refresh content');
      }
    }
  };

  const getContentStatus = (content) => {
    if (!content.progress) {
      if (content.type === 'lecture' || content.type === 'project') return { label: t('notWatched'), grade: 0, color: 'text-gray-500' };
      if (content.type === 'assignment') return { label: t('notSubmitted'), grade: 0, color: 'text-gray-500' };
    }

    const status = content.progress?.status;
    const gradePercent = content.progress?.gradePercent || 0;
    const completed = content.progress?.completed;

    // Handle lectures (video only)
    if (content.type === 'lecture') {
      if (status === 'watched' || completed) {
        return { label: t('watched'), grade: 100, color: 'text-green-600' };
      }
      return { label: t('notWatched'), grade: 0, color: 'text-gray-500' };
    }

    // Handle assignments and projects (submissions with deadlines)
    if (content.type === 'assignment' || content.type === 'project') {
      // Check if deadline has passed
      const deadlinePassed = content.endDate && new Date() > new Date(content.endDate);
      
      if (status === 'graded') {
        return { label: `${t('reviewed')}: ${gradePercent}%`, grade: gradePercent, color: 'text-green-600' };
      } else if (status === 'submitted_ungraded') {
        return { label: t('pendingReview'), grade: 50, color: 'text-yellow-600' };
      } else {
        // Not submitted
        if (deadlinePassed) {
          return { label: t('gradeFailed'), grade: 0, color: 'text-red-600' };
        }
        return { label: t('notSubmitted'), grade: 0, color: 'text-gray-500' };
      }
    }

    return { label: t('loading'), grade: 0, color: 'text-gray-500' };
  };

  const handleSubmitAssignment = async (e) => {
    const file = e.target.files[0];
    if (!file || !selectedContent) return;

    const contentType = selectedContent.type || 'assignment';
    const contentTypeName = contentType === 'project' ? 'Project' : 'Assignment';

    const isReuploadFlow = selectedContent.progress?.reupload?.status === 'approved' && !selectedContent.progress?.reupload?.used;

    // Check if deadline has passed
    if (selectedContent.endDate && !isReuploadFlow) {
      const deadline = new Date(selectedContent.endDate);
      const now = new Date();
      if (now > deadline) {
        toast.error(`${contentTypeName} deadline has passed. You can no longer submit this ${contentType}.`);
        e.target.value = null; // Reset file input
        
        // Prevent submission when deadline has passed
        return;
      }
    }

    if (!file.name.endsWith('.rar') && !file.name.endsWith('.zip')) {
      toast.error('Please upload a .rar or .zip file');
      e.target.value = null; // Reset file input
      return;
    }

    try {
      setUploadingFile(true);
      setSubmissionUploadProgress(0);
      setSubmissionUploadStage('uploading');
      setSubmissionUploadSessionId(null);
      setHostedUploadStatus(null);
      setHostedUploadError(null);
      stopSubmissionUploadJobPolling();
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('assignment', file);

      const shouldTrackHostedProgress = storageConfig?.fileProvider === 'telegram';
      if (shouldTrackHostedProgress) {
        const id =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setSubmissionUploadSessionId(id);
        setHostedUploadStatus('uploading');
        setHostedUploadError(null);
        formData.append('uploadSessionId', id);
        startSubmissionUploadJobPolling(id, token);
      }
      
      const res = await axios.post(
        `/api/contents/${selectedContent._id}/submission`,
        formData,
        { 
          headers: { 
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}` 
          },
          onUploadProgress: (progressEvent) => {
            const total = progressEvent.total;
            const progressFraction = typeof progressEvent.progress === 'number' ? progressEvent.progress : null;
            if (!total && progressFraction === null) return;
            const percentCompleted = total
              ? Math.round((progressEvent.loaded * 100) / total)
              : Math.round(progressFraction * 100);
            if (percentCompleted >= 100) {
              if (shouldTrackHostedProgress) {
                setSubmissionUploadProgress(0);
                setSubmissionUploadStage((prev) => (prev === 'uploading' ? 'server' : prev));
                return;
              }
              setSubmissionUploadProgress(100);
              return;
            }
            setSubmissionUploadProgress(percentCompleted);
          }
        }
      );
      
      // Fire gamification events using centralized utility
      console.log('📝 CourseDetailsPage: Assignment submission response:', res?.data);
      try {
        if (res?.data?.gamification) {
          console.log('📝 CourseDetailsPage: Firing gamification events for assignment submission');
          fireGamificationEvents(res.data.gamification);
        } else {
          console.log('📝 CourseDetailsPage: No gamification data in response');
        }
      } catch (error) {
        console.error('📝 CourseDetailsPage: Error firing gamification events:', error);
      }

      toast.success(
        isReuploadFlow
          ? `${contentTypeName} reupload submitted successfully. It will be regraded by the instructor.`
          : `${contentTypeName} submitted successfully. Grade: 50% (Pending Review)`
      );
      
      // Clear the section content cache and refetch
      const sectionId = selectedContent.section;
      setSectionContents(prev => {
        const newState = { ...prev };
        delete newState[sectionId]; // Remove from cache completely
        return newState;
      });
      
      // Refetch both course details and section content, then refresh selectedContent
      const [, freshContents] = await Promise.all([
        fetchCourseDetails(),
        fetchSectionContent(sectionId, true)
      ]);

      if (Array.isArray(freshContents)) {
        const updated = freshContents.find(c => c._id === selectedContent._id);
        if (updated) {
          setSelectedContent(updated);
        }
      }
    } catch (error) {
      console.error('Error submitting assignment:', error);
      const responseMessage = error?.response?.data?.message;
      const message = typeof responseMessage === 'string' && responseMessage.trim().length > 0
        ? responseMessage
        : 'Upload failed. Please try again.';
      toast.error(message);
    } finally {
      setUploadingFile(false);
      setSubmissionUploadProgress(0);
      setSubmissionUploadStage('idle');
      setSubmissionUploadSessionId(null);
      setHostedUploadStatus(null);
      setHostedUploadError(null);
      stopSubmissionUploadJobPolling();
    }
  };

  const handleDownloadFile = async (contentId, contentTitle) => {
    try {
      if (downloadingContentId === contentId) return;
      setDownloadingContentId(contentId);
      console.log('[Download] Attempting to download file for content:', contentId);
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`/api/content/${contentId}/download`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
        validateStatus: (status) => status < 500 // Accept all non-server-error statuses
      });
      
      console.log('[Download] Response received:', {
        dataSize: response.data.size,
        dataType: response.data.type,
        status: response.status,
        headers: response.headers
      });
      
      // Status 204 means download was intercepted by external download manager (e.g., IDM)
      if (response.status === 204 || (response.status === 200 && response.data.size === 0)) {
        console.log('[Download] Download intercepted by external download manager');
        toast.success('Download started (handled by download manager)');
        return;
      }
      
      // Check for actual error responses
      if (response.status >= 400) {
        throw new Error('Download failed');
      }
      
      // Check if response is actually an error (JSON converted to blob)
      if (response.data.type && response.data.type.includes('json')) {
        // Convert blob back to JSON to get error message
        const text = await response.data.text();
        try {
          const errorData = JSON.parse(text);
          throw new Error(errorData.message || 'Download failed');
        } catch (e) {
          throw new Error('Download failed');
        }
      }
      
      // Check if we actually got data
      if (!response.data || response.data.size === 0) {
        console.log('[Download] Empty response - might be handled externally');
        toast.success('Download started');
        return;
      }
      
      // Get filename from Content-Disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = `${contentTitle}.rar`;
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
      
      console.log('[Download] Creating download with filename:', filename);
      
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
      
      toast.success('File downloaded successfully');
    } catch (error) {
      console.error('[Download] Error downloading file:', error);
      toast.error('Failed to download file. Please try again later.');
    } finally {
      setTimeout(() => {
        setDownloadingContentId((prev) => (prev === contentId ? null : prev));
      }, 1200);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-medium text-gray-900 dark:text-white">{t('courseNotFound')}</h2>
          <button onClick={() => navigate('/student/dashboard')} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">
            {t('backToDashboard')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header with Grades */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button onClick={() => navigate('/student')} className="flex items-center text-indigo-600 hover:text-indigo-800 mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('backToDashboard')}
          </button>
          
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{course.name}</h1>
              {(course.instructor?.name || course.originalInstructor?.name) && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                  {course.instructor?.name
                    ? `By ${course.instructor.name}`
                    : `Created by ${course.originalInstructor.name}`}
                </p>
              )}
              <div className="flex items-center space-x-3 text-sm text-gray-600 dark:text-gray-400">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full font-medium">{course.level}</span>
                <span>{t('group')}: {course.groupName}</span>
              </div>
              {course.description && <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-3xl">{course.description}</p>}
            </div>
            
            {/* Telegram Discussion Group */}
            {course.telegramGroupLink && (
              <div className="flex-shrink-0">
                <a
                  href={course.telegramGroupLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                  title={t('joinDiscussionGroup') || 'Join Discussion Group'}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.008-1.252-.241-1.865-.44-.751-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.141.122.098.155.23.171.332.016.102.036.334.02.515z"/>
                  </svg>
                  <span>{t('joinDiscussionGroup') || 'Join Discussion Group'}</span>
                </a>
              </div>
            )}
          </div>

          {/* Grade Summary Cards */}
          {course.grade !== undefined && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              {/* Overall grade */}
              <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/30 dark:to-indigo-800/30 p-6 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-indigo-600 dark:text-indigo-400">{t('overallGrade')}</span>
                  <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <p className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{Math.round(course.grade)}%</p>
              </div>

              {/* Lectures summary (only if there are any lectures in course) */}
              {(course.gradeStats?.lecturesTotal ?? 0) > 0 && (
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/30 dark:to-blue-800/30 p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-600 dark:text-blue-400">{t('lectures')}</span>
                    <Play className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round((course.gradeStats.lecturesGrade || 0))}%
                  </p>
                </div>
              )}

              {/* Assignments summary (only if there are any assignments in course) */}
              {(course.gradeStats?.assignmentsTotal ?? 0) > 0 && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/30 dark:to-green-800/30 p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">{t('assignments')}</span>
                    <FileText className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {Math.round((course.gradeStats.assignmentsGrade || 0))}%
                  </p>
                </div>
              )}

              {/* Projects summary (only if there are any projects in course) */}
              {(course.gradeStats?.projectsTotal ?? 0) > 0 && (
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/30 dark:to-purple-800/30 p-6 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-600 dark:text-purple-400">{t('projects')}</span>
                    <FileText className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                    {Math.round((course.gradeStats.projectsGrade || 0))}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Certificate eligibility banner (subtle, non-intrusive) */}
          {certificateEligibility && certificateEligibility.status && (
            <div className="mb-4">
              <div className="rounded-lg border border-dashed border-indigo-200 bg-indigo-50/80 dark:border-indigo-700/60 dark:bg-indigo-900/20 px-4 py-3 flex items-start gap-3 text-sm">
                <Award className="w-5 h-5 text-indigo-600 dark:text-indigo-300 mt-0.5" />
                <div>
                  <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                    {t('certificateModeLabel')}{': '}
                    {t(
                      course?.certificateMode === 'manual_instructor'
                        ? 'certificateModeManualInstructor'
                        : course?.certificateMode === 'automatic'
                          ? 'certificateModeAutomatic'
                          : 'certificateModeDisabled'
                    )}
                  </p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {t('certificateStatus')}{': '}
                    {(certificateEligibility.status === 'AUTO_GRANT' ||
                      certificateEligibility.status === 'CAN_REQUEST') &&
                      t('certificateStatusEligible')}
                    {certificateEligibility.status === 'GROUP_NOT_COMPLETED' &&
                      t('certificateStatusNotEligible')}
                    {certificateEligibility.status === 'GROUP_COMPLETED_BUT_GRADE_TOO_LOW' &&
                      t('certificateStatusNotEligible')}
                    {certificateEligibility.status === 'GROUP_COMPLETED_AND_ELIGIBLE' &&
                      t('certificateStatusWaitingInstructor')}
                    {certificateEligibility.status === 'CERTIFICATES_DISABLED' &&
                      t('certificateStatusCertificatesDisabled')}
                  </p>
                    {certificateEligibility.status === 'GROUP_NOT_COMPLETED' && (
                      <p className="mt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                        {t('certificateReasonGroupNotCompleted')}
                      </p>
                    )}
                    {certificateEligibility.status === 'GROUP_COMPLETED_BUT_GRADE_TOO_LOW' &&
                      typeof certificateEligibility.details?.passingGrade === 'number' && (
                        <p className="mt-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
                          {t('certificateReasonGradeTooLow', {
                            passingGrade: Math.round(certificateEligibility.details.passingGrade),
                          })}
                        </p>
                      )}
                    {typeof certificateEligibility.details?.totalItems === 'number' &&
                      typeof certificateEligibility.details?.completedItems === 'number' &&
                      typeof certificateEligibility.details?.completionPercentage === 'number' && (
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                          {t('certificateProgressLabel')}{': '}
                          {t('certificateProgressValue', {
                            completed: certificateEligibility.details.completedItems,
                            total: certificateEligibility.details.totalItems,
                            percentage: certificateEligibility.details.completionPercentage,
                          })}
                        </p>
                      )}
                  </div>
                </div>
              </div>
            )}

          {/* Pay All Sections Button */}
          {(() => {
            const unpaidCost = calculateTotalUnpaidCost();
            return unpaidCost.count > 0 && (
              <div className="mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 dark:from-indigo-700 dark:to-purple-800 rounded-xl p-6 text-white shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">{t('unlockAllSections')}</h3>
                    <p className="text-sm text-indigo-100">{t('payForAllLockedSections')} {unpaidCost.count} {unpaidCost.count > 1 ? t('lockedSections') : t('lockedSection')} {t('atOnce')}</p>
                  </div>
                  <button
                    onClick={handlePayAllSections}
                    className="bg-white text-indigo-600 hover:bg-indigo-50 px-6 py-3 rounded-lg font-semibold shadow-md transition-all transform hover:scale-105"
                  >
                    {t('pay')} {formatPrice(unpaidCost.total, unpaidCost.currency)}
                  </button>
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {/* Main Content - Coursera Style */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Sections */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden sticky top-4">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t('courseSections')}</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[calc(100vh-200px)] overflow-y-auto">
                {course.sections?.map((section) => {
                  const sectionGrade = course.sectionGrades?.find(s => s.sectionId === section._id);
                  const isExpanded = expandedSections[section._id];
                  const contents = sectionContents[section._id] || [];
                  const payStatus = paymentStatus[section._id];
                  
                  return (
                    <div key={section._id}>
                      <div className="p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700" onClick={() => handleSectionToggle(section._id, section.hasAccess || section.isFree)}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 flex-wrap">
                              <h3 className="font-medium text-gray-900 dark:text-white text-sm">{section.name}</h3>
                              {!section.hasAccess && !section.isFree && !payStatus && <Lock className="w-4 h-4 text-yellow-600" />}
                              {payStatus?.status === 'pending' && (
                                <span className="flex items-center text-xs px-2 py-1 rounded-full font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Pending
                                </span>
                              )}
                              {payStatus?.status === 'rejected' && (
                                <span className="flex items-center text-xs px-2 py-1 rounded-full font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200">
                                  <XCircle className="w-3 h-3 mr-1" />
                                  Rejected
                                </span>
                              )}
                              {sectionGrade && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                  sectionGrade.grade >= 70 ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                                  sectionGrade.grade >= 50 ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                                  'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                }`}>
                                  {Math.round(sectionGrade.grade * 100) / 100}%
                                </span>
                              )}
                            </div>
                            {section.hasAccess || section.isFree ? (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                {section.contentCounts?.lectures || 0} lectures • {section.contentCounts?.assignments || 0} assignments
                              </p>
                            ) : payStatus?.status === 'pending' ? (
                              <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                                Payment under review
                              </p>
                            ) : payStatus?.status === 'rejected' ? (
                              <div className="mt-2">
                                {payStatus.rejectionReason && (
                                  <p className="text-xs text-red-600 dark:text-red-400 mb-1">
                                    Reason: {payStatus.rejectionReason}
                                  </p>
                                )}
                                <button onClick={(e) => { e.stopPropagation(); handlePaySection(section._id); }} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">
                                  {t('pay')} {formatPrice(section.priceCents || 0, section.currency || 'SYP')}
                                </button>
                              </div>
                            ) : (
                              <button onClick={(e) => { e.stopPropagation(); handlePaySection(section._id); }} className="mt-2 text-xs bg-indigo-600 text-white px-3 py-1 rounded hover:bg-indigo-700">
                                {t('pay')} {formatPrice(section.priceCents || 0, section.currency || 'SYP')}
                              </button>
                            )}
                          </div>
                          {(section.hasAccess || section.isFree) && (
                            <button onClick={(e) => { e.stopPropagation(); handleSectionToggle(section._id, section.hasAccess || section.isFree); }}>
                              {isExpanded ? <ChevronDown className="w-5 h-5 text-gray-500" /> : <ChevronRight className="w-5 h-5 text-gray-500" />}
                            </button>
                          )}
                        </div>
                      </div>

                      {isExpanded && (section.hasAccess || section.isFree) && (
                        <div className="bg-gray-50 dark:bg-gray-900">
                          {loadingContent && contents.length === 0 ? (
                            <div className="p-4 text-center">
                              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mx-auto"></div>
                            </div>
                          ) : contents.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500 dark:text-gray-400">{t('noContentAvailable')}</div>
                          ) : (
                            <>
                              {/* Lectures Group */}
                              {contents.filter(c => c.type === 'lecture').length > 0 && (
                                <div className="border-b border-gray-200 dark:border-gray-700">
                                  <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20">
                                    <span className="text-xs font-semibold text-blue-800 dark:text-blue-200">{t('lecturesUppercase')}</span>
                                  </div>
                                  {contents.filter(c => c.type === 'lecture').sort((a, b) => (a.order || 0) - (b.order || 0)).map((content) => {
                                    const status = getContentStatus(content);
                                    return (
                                      <div key={content._id} className={`p-3 pl-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedContent?._id === content._id ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''}`} onClick={() => handleSelectContent(content)}>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2 flex-1">
                                            <Play className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm text-gray-900 dark:text-white">{content.title}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{status.grade}%</span>
                                            {content.progress?.completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Assignments Group */}
                              {contents.filter(c => c.type === 'assignment').length > 0 && (
                                <div className="border-b border-gray-200 dark:border-gray-700">
                                  <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20">
                                    <span className="text-xs font-semibold text-green-800 dark:text-green-200">{t('assignmentsUppercase')}</span>
                                  </div>
                                  {contents.filter(c => c.type === 'assignment').sort((a, b) => (a.order || 0) - (b.order || 0)).map((content) => {
                                    const status = getContentStatus(content);
                                    return (
                                      <div key={content._id} className={`p-3 pl-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedContent?._id === content._id ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''}`} onClick={() => handleSelectContent(content)}>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2 flex-1">
                                            <FileText className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-gray-900 dark:text-white">{content.title}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{status.grade}%</span>
                                            {content.progress?.completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Projects Group */}
                              {contents.filter(c => c.type === 'project').length > 0 && (
                                <div>
                                  <div className="px-4 py-2 bg-purple-50 dark:bg-purple-900/20">
                                    <span className="text-xs font-semibold text-purple-800 dark:text-purple-200">{t('projectsUppercase')}</span>
                                  </div>
                                  {contents.filter(c => c.type === 'project').sort((a, b) => (a.order || 0) - (b.order || 0)).map((content) => {
                                    const status = getContentStatus(content);
                                    return (
                                      <div key={content._id} className={`p-3 pl-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${selectedContent?._id === content._id ? 'bg-indigo-100 dark:bg-indigo-900/30' : ''}`} onClick={() => handleSelectContent(content)}>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2 flex-1">
                                            <FileText className="w-4 h-4 text-purple-600" />
                                            <span className="text-sm text-gray-900 dark:text-white">{content.title}</span>
                                          </div>
                                          <div className="flex items-center space-x-2">
                                            <span className={`text-xs font-medium ${status.color}`}>{status.label}</span>
                                            <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{status.grade}%</span>
                                            {content.progress?.completed && <CheckCircle className="w-4 h-4 text-green-600" />}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                              
                              {/* Active Tests Group */}
                              {sectionTests[section._id] && sectionTests[section._id].length > 0 && (
                                <div className="border-t border-gray-200 dark:border-gray-700">
                                  <div className="px-4 py-2 bg-orange-50 dark:bg-orange-900/20">
                                    <span className="text-xs font-semibold text-orange-800 dark:text-orange-200">ACTIVE TESTS ({sectionTests[section._id].length})</span>
                                  </div>
                                  {sectionTests[section._id].map((test) => {
                                    const attempts = testAttempts[test._id] || [];
                                    const gradedAttempts = attempts.filter(a => a.status === 'graded');
                                    const bestAttempt = gradedAttempts.length > 0 
                                      ? gradedAttempts.reduce((best, current) => 
                                          (current.score || 0) > (best.score || 0) ? current : best
                                        , gradedAttempts[0])
                                      : null;
                                    
                                    return (
                                      <div 
                                        key={test._id} 
                                        className="p-3 pl-8 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800" 
                                        onClick={() => {
                                          // If they have a best attempt, go to results, otherwise go to test
                                          if (bestAttempt) {
                                            navigate(`/student/test-results/${bestAttempt._id}`);
                                          } else {
                                            navigate(`/student/test/${String(test._id)}`);
                                          }
                                        }}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center space-x-2 flex-1">
                                            <ClipboardCheck className="w-4 h-4 text-orange-600" />
                                            <span className="text-sm text-gray-900 dark:text-white">{test.title}</span>
                                          </div>
                                          <div className="flex items-center space-x-3">
                                            <span className="text-xs text-gray-500 dark:text-gray-400">
                                              {test.questions?.length || 0} questions
                                            </span>
                                            {test.timeLimitMinutes && (
                                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                                • {test.timeLimitMinutes} min
                                              </span>
                                            )}
                                            {bestAttempt ? (
                                              <div className="flex items-center space-x-2">
                                                <CheckCircle className={`w-4 h-4 ${bestAttempt.passed ? 'text-green-600' : 'text-red-600'}`} />
                                                <span className={`text-xs font-semibold ${bestAttempt.passed ? 'text-green-600' : 'text-red-600'}`}>
                                                  {bestAttempt.score}%
                                                </span>
                                              </div>
                                            ) : (
                                              <span className="text-xs text-gray-400 dark:text-gray-500">
                                                Not Complete - 0%
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-2">
            {selectedContent ? (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md">
                <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedContent.title}</h2>
                  {selectedContent.description && (
                    <div className="mt-3">
                      {renderContentDescription(selectedContent.description, selectedContent.type)}
                    </div>
                  )}
                  <div className="mt-3 flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      selectedContent.type === 'lecture' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200' :
                      selectedContent.type === 'assignment' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                      'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    }`}>{selectedContent.type.toUpperCase()}</span>
                    {selectedContent.progress?.completed && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <CheckCircle className="w-3 h-3 mr-1" /> {t('completed')}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-6">
                  {selectedContent.type === 'lecture' && (
                    <div className="space-y-4">
                      {/* Detect storage type and render appropriate player */}
                      {selectedContent.video?.storageType === 'youtube' ? (
                        <CustomYouTubePlayer
                          youtubeVideoId={selectedContent.video?.youtubeVideoId}
                          title={selectedContent.title}
                          autoPlay={false}
                          contentId={selectedContent._id}
                          onComplete={refreshAfterVideoComplete}
                        />
                      ) : selectedContent.video?.storageType === 'cloudinary' ? (
                        // Cloudinary Video Player
                        <div className="bg-black rounded-lg overflow-hidden">
                          <video
                            src={selectedContent.video.cloudinaryUrl}
                            className="w-full h-full"
                            controls
                            controlsList="nodownload"
                            onEnded={async () => {
                              try {
                                const token = localStorage.getItem('token');
                                const res = await axios.post(
                                  `/api/content/${selectedContent._id}/complete`,
                                  {},
                                  { headers: { Authorization: `Bearer ${token}` } }
                                );

                                try {
                                  if (res?.data?.gamification) {
                                    fireGamificationEvents(res.data.gamification);
                                  }
                                } catch (gamError) {
                                  console.error('🎬 CourseDetailsPage: Error firing gamification events for Cloudinary lecture:', gamError);
                                }

                                await refreshAfterVideoComplete();
                              } catch (error) {
                                console.error('Error marking complete:', error);
                              }
                            }}
                          >
                            Your browser does not support the video tag.
                          </video>
                          {selectedContent.title && (
                            <div className="bg-gray-900 p-4">
                              <h3 className="text-white font-semibold">{selectedContent.title}</h3>
                            </div>
                          )}
                        </div>
                      ) : (
                        // Local Video Player (Default/Legacy)
                        (selectedContent.videoPath ||
                          selectedContent.video?.storageType === 'local' ||
                          selectedContent.video?.path ||
                          selectedContent.video?.localPath ||
                          selectedContent.video?.storedName) && (
                          <EmbeddedVideoPlayer
                            videoUrl={`/api/content/${selectedContent._id}/stream`}
                            title={selectedContent.title}
                            autoPlay={false}
                            contentId={selectedContent._id}
                            onComplete={refreshAfterVideoComplete}
                          />
                        )
                      )}
                      
                      {/* Video Description Below */}
                      {selectedContent.description && (
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <h4 className="font-semibold text-gray-900 dark:text-white mb-2">About this video</h4>
                          <p className="text-gray-600 dark:text-gray-300">{selectedContent.description}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {selectedContent.type === 'assignment' && (
                    <div className="space-y-6">
                      {(selectedContent.filePath || selectedContent.file?.path || (selectedContent.file?.storageType === 'telegram' && selectedContent.file?.telegramFileId)) && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('assignmentFile')}</h3>
                          <button 
                            onClick={() => handleDownloadFile(selectedContent._id, selectedContent.title)}
                            disabled={downloadingContentId === selectedContent._id}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          >
                            <Download className="w-5 h-5 mr-2" />
                            {downloadingContentId === selectedContent._id ? 'Starting download...' : t('downloadAssignment')}
                          </button>
                        </div>
                      )}

                      {selectedContent.progress?.status === 'graded' ? (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-4">Reviewed</h3>
                          <p className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">Grade: {selectedContent.progress.gradePercent}%</p>
                          {selectedContent.progress?.reupload?.initialGradePercent != null && selectedContent.progress?.reupload?.regradeUsed && (
                            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                              Original grade: {selectedContent.progress.reupload.initialGradePercent}% • Final grade after reupload: {selectedContent.progress.gradePercent}%
                            </p>
                          )}
                          {selectedContent.progress.instructorFeedback && (
                            <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Instructor Feedback:</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedContent.progress.instructorFeedback}</p>
                            </div>
                          )}
                          {selectedContent.solution && (
                            <div className="mt-4">
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    const response = await axios.get(`/api/content/${selectedContent._id}/downloadSolution`, {
                                      headers: { Authorization: `Bearer ${token}` },
                                      responseType: 'blob'
                                    });
                                    const url = window.URL.createObjectURL(response.data);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', selectedContent.solution.originalName || 'solution.rar');
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                    toast.success('Solution downloaded successfully');
                                  } catch (error) {
                                    console.error('Error downloading solution:', error);
                                    toast.error('Failed to download solution. Please try again later.');
                                  }
                                }}
                                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                              >
                                <Download className="w-5 h-5 mr-2" />
                                Download Solution
                              </button>
                            </div>
                          )}

                          {selectedContent.progress?.reupload && (
                            <div className="mt-6 border-t border-green-100 dark:border-green-800 pt-4">
                              {(() => {
                                const r = selectedContent.progress.reupload;

                                if (r.status === 'pending') {
                                  return (
                                    <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                      You have requested a reupload for this assignment. Waiting for instructor approval.
                                      {r.reason && (
                                        <p className="mt-1 text-xs text-yellow-700 dark:text-yellow-300">Reason: {r.reason}</p>
                                      )}
                                    </div>
                                  );
                                }

                                if (r.status === 'rejected') {
                                  return (
                                    <div className="text-sm text-red-800 dark:text-red-200">
                                      Your reupload request was rejected.
                                      {r.reason && (
                                        <p className="mt-1 text-xs text-red-700 dark:text-red-300">Reason: {r.reason}</p>
                                      )}
                                    </div>
                                  );
                                }

                                if (r.status === 'approved' && !r.used) {
                                  return (
                                    <div className="space-y-3">
                                      <p className="text-sm text-green-800 dark:text-green-200">
                                        Your reupload request was approved. You can upload one new file for regrading.
                                      </p>
                                      <label className="block text-sm text-gray-700 dark:text-gray-300">Upload updated assignment (.rar or .zip):</label>
                                      <input
                                        type="file"
                                        accept=".rar,.zip"
                                        onChange={handleSubmitAssignment}
                                        disabled={uploadingFile}
                                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                      />
                                      {uploadingFile && (
                                        <div className="mt-4 space-y-2">
                                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                              className="bg-indigo-600 h-2 rounded-full transition-all"
                                              style={{ width: `${Math.max(0, Math.min(100, submissionUploadProgress))}%` }}
                                            />
                                          </div>
                                          <div className="text-sm text-indigo-600">
                                            {submissionUploadStage === 'processing' || submissionUploadStage === 'server'
                                              ? 'Finalizing upload...'
                                              : t('uploadingAssignment')}
                                            {submissionUploadProgress > 0 ? ` (${submissionUploadProgress}%)` : ''}
                                          </div>
                                        </div>
                                      )}
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        You will not be able to reupload again after this.
                                      </p>
                                    </div>
                                  );
                                }

                                if (r.canRequest && (r.status === 'none' || !r.status)) {
                                  return (
                                    <div className="space-y-3">
                                      <p className="text-sm text-gray-800 dark:text-gray-200">
                                        If you believe your grade is unfair due to a mistake or technical issue, you may request one reupload for this assignment.
                                      </p>
                                      <textarea
                                        rows="3"
                                        value={reuploadReason}
                                        onChange={(e) => setReuploadReason(e.target.value)}
                                        placeholder="Explain why you are requesting a reupload (optional)"
                                        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                      />
                                      <button
                                        type="button"
                                        onClick={handleRequestReupload}
                                        disabled={requestingReupload}
                                        className="inline-flex items-center px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                                      >
                                        {requestingReupload ? 'Submitting request...' : 'Request Reupload'}
                                      </button>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        You can request a reupload only once per assignment. The instructor must approve it before you can upload again.
                                      </p>
                                    </div>
                                  );
                                }

                                if (r.status === 'completed' || r.used || r.regradeUsed) {
                                  return (
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      Reupload and regrade have been used for this assignment.
                                    </p>
                                  );
                                }

                                return null;
                              })()}
                            </div>
                          )}
                        </div>
                      ) : selectedContent.progress?.status === 'submitted_ungraded' ? (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-4">{t('pendingGrading')}</h3>
                          {selectedContent.progress?.reupload?.used ? (
                            <>
                              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">Your reupload has been submitted and is waiting for regrading by the instructor.</p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">Temporary grade: 50% (pending regrade).</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">{t('assignmentSubmittedSuccessfully')}</p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">{t('currentGrade50Pending')}</p>
                            </>
                          )}
                        </div>
                      ) : (
                        (() => {
                          const deadlinePassed = selectedContent.endDate && new Date() > new Date(selectedContent.endDate);
                          return deadlinePassed ? (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4">{t('deadlinePassed')}</h3>
                              <p className="text-sm text-red-800 dark:text-red-200 mb-2">{t('assignmentDeadlinePassed')}</p>
                              <p className="text-lg font-bold text-red-700 dark:text-red-300">{t('gradeFailed')}</p>
                              {selectedContent.endDate && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                  {t('deadlineWas')}: {new Date(selectedContent.endDate).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('submitYourWork')}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('uploadCompletedAssignmentRar')}</p>
                              {selectedContent.endDate && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                                  ⏰ {t('deadline')} {new Date(selectedContent.endDate).toLocaleString()}
                                </p>
                              )}
                              <label className="block">
                                <input type="file" accept=".rar,.zip" onChange={handleSubmitAssignment} disabled={uploadingFile}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </label>
                              {uploadingFile && (
                                <div className="mt-4 space-y-2">
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-indigo-600 h-2 rounded-full transition-all"
                                      style={{ width: `${Math.max(0, Math.min(100, submissionUploadProgress))}%` }}
                                    />
                                  </div>
                                  <div className="text-sm text-indigo-600">
                                    {submissionUploadStage === 'processing' || submissionUploadStage === 'server'
                                      ? 'Finalizing upload...'
                                      : t('uploadingAssignment')}
                                    {submissionUploadProgress > 0 ? ` (${submissionUploadProgress}%)` : ''}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}

                  {selectedContent.type === 'project' && (
                    <div className="space-y-6">
                      {(selectedContent.video?.storageType === 'youtube' ||
                        selectedContent.video?.storageType === 'cloudinary' ||
                        selectedContent.videoPath ||
                        selectedContent.video?.storageType === 'local' ||
                        selectedContent.video?.path ||
                        selectedContent.video?.localPath ||
                        selectedContent.video?.storedName) && (
                        <div className="space-y-4">
                          {selectedContent.video?.storageType === 'youtube' ? (
                            <CustomYouTubePlayer
                              youtubeVideoId={selectedContent.video?.youtubeVideoId}
                              title={selectedContent.title}
                              autoPlay={false}
                              contentId={selectedContent._id}
                              onComplete={refreshAfterVideoComplete}
                            />
                          ) : selectedContent.video?.storageType === 'cloudinary' ? (
                            <div className="bg-black rounded-lg overflow-hidden">
                              <video
                                src={selectedContent.video.cloudinaryUrl}
                                className="w-full h-full"
                                controls
                                controlsList="nodownload"
                                onEnded={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    const res = await axios.post(
                                      `/api/content/${selectedContent._id}/complete`,
                                      {},
                                      { headers: { Authorization: `Bearer ${token}` } }
                                    );

                                    try {
                                      if (res?.data?.gamification) {
                                        fireGamificationEvents(res.data.gamification);
                                      }
                                    } catch (gamError) {
                                      console.error('🎬 CourseDetailsPage: Error firing gamification events for Cloudinary project:', gamError);
                                    }

                                    await refreshAfterVideoComplete();
                                  } catch (error) {
                                    console.error('Error marking complete:', error);
                                  }
                                }}
                              >
                                Your browser does not support the video tag.
                              </video>
                              {selectedContent.title && (
                                <div className="bg-gray-900 p-4">
                                  <h3 className="text-white font-semibold">{selectedContent.title}</h3>
                                </div>
                              )}
                            </div>
                          ) : (
                            (selectedContent.videoPath ||
                              selectedContent.video?.storageType === 'local' ||
                              selectedContent.video?.path ||
                              selectedContent.video?.localPath ||
                              selectedContent.video?.storedName) && (
                              <EmbeddedVideoPlayer
                                videoUrl={`/api/content/${selectedContent._id}/stream`}
                                title={selectedContent.title}
                                autoPlay={false}
                                contentId={selectedContent._id}
                                onComplete={refreshAfterVideoComplete}
                              />
                            )
                          )}
                        </div>
                      )}

                      {(selectedContent.starterFilePath || selectedContent.file?.path || (selectedContent.file?.storageType === 'telegram' && selectedContent.file?.telegramFileId)) && (
                        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('starterFiles')}</h3>
                          <button 
                            onClick={() => handleDownloadFile(selectedContent._id, selectedContent.title)}
                            disabled={downloadingContentId === selectedContent._id}
                            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                          >
                            <Download className="w-5 h-5 mr-2" />
                            {downloadingContentId === selectedContent._id ? 'Starting download...' : t('downloadStarterFiles')}
                          </button>
                        </div>
                      )}

                      {selectedContent.progress?.status === 'graded' ? (
                        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-green-900 dark:text-green-200 mb-4">{t('reviewed')}</h3>
                          <p className="text-lg font-bold text-green-800 dark:text-green-200 mb-2">{t('gradeColon')} {selectedContent.progress.gradePercent}%</p>
                          {selectedContent.progress?.reupload?.initialGradePercent != null && selectedContent.progress?.reupload?.regradeUsed && (
                            <p className="text-sm text-green-800 dark:text-green-200 mb-2">
                              Original grade: {selectedContent.progress.reupload.initialGradePercent}% • Final grade after reupload: {selectedContent.progress.gradePercent}%
                            </p>
                          )}
                          {selectedContent.progress.instructorFeedback && (
                            <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded">
                              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{t('instructorFeedback')}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{selectedContent.progress.instructorFeedback}</p>
                            </div>
                          )}
                          {selectedContent.solution && (
                            <div className="mt-4">
                              <button
                                onClick={async () => {
                                  try {
                                    const token = localStorage.getItem('token');
                                    const response = await axios.get(`/api/content/${selectedContent._id}/downloadSolution`, {
                                      headers: { Authorization: `Bearer ${token}` },
                                      responseType: 'blob'
                                    });
                                    const url = window.URL.createObjectURL(response.data);
                                    const link = document.createElement('a');
                                    link.href = url;
                                    link.setAttribute('download', selectedContent.solution.originalName || 'solution.rar');
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    window.URL.revokeObjectURL(url);
                                    toast.success('Solution downloaded successfully');
                                  } catch (error) {
                                    console.error('Error downloading solution:', error);
                                    toast.error(error.response?.data?.message || 'Failed to download solution');
                                  }
                                }}
                                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700"
                              >
                                <Download className="w-5 h-5 mr-2" />
                                Download Solution
                              </button>
                            </div>
                          )}
                        </div>
                      ) : selectedContent.progress?.status === 'submitted_ungraded' ? (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-6">
                          <h3 className="text-lg font-semibold text-yellow-900 dark:text-yellow-200 mb-4">{t('pendingGrading')}</h3>
                          {selectedContent.progress?.reupload?.used ? (
                            <>
                              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">Your reupload has been submitted and is waiting for regrading by the instructor.</p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">Temporary grade: 50% (pending regrade).</p>
                            </>
                          ) : (
                            <>
                              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">{t('projectSubmittedSuccessfully')}</p>
                              <p className="text-sm text-yellow-700 dark:text-yellow-300">{t('currentGrade50Pending')}</p>
                            </>
                          )}
                        </div>
                      ) : (
                        (() => {
                          const deadlinePassed = selectedContent.endDate && new Date() > new Date(selectedContent.endDate);
                          return deadlinePassed ? (
                            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-red-900 dark:text-red-200 mb-4">{t('deadlinePassed')}</h3>
                              <p className="text-sm text-red-800 dark:text-red-200 mb-2">{t('projectDeadlinePassed')}</p>
                              <p className="text-lg font-bold text-red-700 dark:text-red-300">{t('gradeFailed')}</p>
                              {selectedContent.endDate && (
                                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                                  {t('deadlineWas')}: {new Date(selectedContent.endDate).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ) : (
                            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6">
                              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{t('submitYourProject')}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{t('uploadCompletedProjectRar')}</p>
                              {selectedContent.endDate && (
                                <p className="text-xs text-orange-600 dark:text-orange-400 mb-3">
                                  ⏰ {t('deadline')} {new Date(selectedContent.endDate).toLocaleString()}
                                </p>
                              )}
                              <label className="block">
                                <input type="file" accept=".rar,.zip" onChange={handleSubmitAssignment} disabled={uploadingFile}
                                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                              </label>
                              {uploadingFile && (
                                <div className="mt-4 space-y-2">
                                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                    <div
                                      className="bg-indigo-600 h-2 rounded-full transition-all"
                                      style={{ width: `${Math.max(0, Math.min(100, submissionUploadProgress))}%` }}
                                    />
                                  </div>
                                  <div className="text-sm text-indigo-600">
                                    {submissionUploadStage === 'processing' || submissionUploadStage === 'server'
                                      ? 'Finalizing upload...'
                                      : t('uploadingProject')}
                                    {submissionUploadProgress > 0 ? ` (${submissionUploadProgress}%)` : ''}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md h-96 flex items-center justify-center">
                <div className="text-center text-gray-500 dark:text-gray-400">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>{t('selectContentFromLeft')}</p>
                </div>
              </div>
            )}
            
            {/* Comments Section - Show for all content types */}
            {selectedContent && (
              <div className="comments-section">
                <Comments contentId={selectedContent._id} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tour Guide */}
      <TourGuide 
        steps={getCourseDetailsTour(t)} 
        tourKey="course_details" 
        showButton={true}
      />
    </div>
  );
};

export default CourseDetailsPage;
