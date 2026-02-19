import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Video, FileText, Rocket, Trash2, Download, Play, Edit, GripVertical, ClipboardCheck } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import toast from 'react-hot-toast';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import VideoPlayer from '../../components/common/VideoPlayer';
import SecureYouTubePlayer from '../../components/common/SecureYouTubePlayer';
import CustomYouTubePlayer from '../../components/common/CustomYouTubePlayer';
import { useAuth } from '../../contexts/AuthContext';

const SectionContentManagement = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { user } = useAuth();
  const [minVideoDurationSeconds, setMinVideoDurationSeconds] = useState(60);
  
  const [section, setSection] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('lecture'); // lecture, assignment, project
  const [editingContent, setEditingContent] = useState(null); // for editing
  const [storageConfig, setStorageConfig] = useState(null);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    maxScore: 100,
    dueDate: '',
    order: 0
  });
  const [videoFile, setVideoFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [solutionFile, setSolutionFile] = useState(null);
  const [uploadLimits, setUploadLimits] = useState({ maxVideoSizeMB: 500, maxFileSizeMB: 100 });
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('idle');
  const [uploadSessionId, setUploadSessionId] = useState(null);
  const [videoPlayerUrl, setVideoPlayerUrl] = useState(null);
  const [videoPlayerTitle, setVideoPlayerTitle] = useState('');
  const [secureVideoModal, setSecureVideoModal] = useState({
    open: false,
    contentId: null,
    title: '',
    secureUrl: '',
    loading: false
  });
  const [youtubeWatchModal, setYoutubeWatchModal] = useState({
    open: false,
    youtubeVideoId: '',
    title: ''
  });
  const [deleteRequestModal, setDeleteRequestModal] = useState({ open: false, contentId: null, title: '', reason: '', submitting: false });
  const [adminDeleteModal, setAdminDeleteModal] = useState({ open: false, contentId: null, title: '', deleting: false });
  const [assignUrlModal, setAssignUrlModal] = useState({ open: false, contentId: null, title: '', url: '', saving: false });
  const [pendingDeleteContentIds, setPendingDeleteContentIds] = useState([]);
  const [hostedUploadStatus, setHostedUploadStatus] = useState(null);
  const [hostedUploadError, setHostedUploadError] = useState(null);
  const [hostedUploadBytes, setHostedUploadBytes] = useState(null);
  const [hostedUploadTotalBytes, setHostedUploadTotalBytes] = useState(null);
  const [hostedUploadSpeedBps, setHostedUploadSpeedBps] = useState(null);
  const hostedUploadSpeedRef = useRef({ bytes: null, at: null });
  const [clientUploadBytes, setClientUploadBytes] = useState(null);
  const [clientUploadTotalBytes, setClientUploadTotalBytes] = useState(null);

  const uploadAbortControllerRef = useRef(null);
  const uploadPollIntervalRef = useRef(null);
  const uploadPollTimeoutRef = useRef(null);
  const uploadPollInFlightRef = useRef(false);
  const uploadPollBackoffMsRef = useRef(2000);
  const cancelRequestedRef = useRef(false);
  const uploadStageRef = useRef('idle');
  const uploadSessionIdRef = useRef(null);

  const isBlockingUpload =
    uploading ||
    uploadStage === 'uploading' ||
    uploadStage === 'server' ||
    uploadStage === 'processing';

  const shouldShowCancelUpload =
    uploading ||
    uploadStage === 'uploading' ||
    uploadStage === 'server' ||
    uploadStage === 'processing' ||
    uploadStage === 'error';

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    uploadStageRef.current = uploadStage;
  }, [uploadStage]);

  const formatDuration = useCallback((seconds) => {
    const total = Math.max(0, Math.round(Number(seconds) || 0));
    const pluralize = (n, unit) => `${n} ${unit}${n === 1 ? '' : 's'}`;
    if (total < 60) return pluralize(total, 'second');
    const mins = Math.floor(total / 60);
    const secs = total % 60;
    if (secs === 0) return pluralize(mins, 'minute');
    return `${pluralize(mins, 'minute')} and ${pluralize(secs, 'second')}`;
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const fetchSectionAndContent = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const sectionRes = await axios.get(`/api/sections/${sectionId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSection(sectionRes.data.data);
      
      const contentRes = await axios.get(`/api/sections/${sectionId}/content`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setContent(contentRes.data.data || []);

      // Fetch storage configuration so UI can adapt to the configured providers
      try {
        const storageRes = await axios.get('/api/storage/config', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setStorageConfig(storageRes.data?.data || null);
      } catch (err) {
        console.error('Error fetching storage config:', err);
        // Non-fatal: UI will fall back to local-mode assumptions
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [sectionId]);

  useEffect(() => {
    fetchSectionAndContent();
  }, [fetchSectionAndContent]);

  const stopUploadJobPolling = useCallback(() => {
    if (uploadPollIntervalRef.current) {
      clearInterval(uploadPollIntervalRef.current);
      uploadPollIntervalRef.current = null;
    }

    if (uploadPollTimeoutRef.current) {
      clearTimeout(uploadPollTimeoutRef.current);
      uploadPollTimeoutRef.current = null;
    }

    uploadPollInFlightRef.current = false;
    uploadPollBackoffMsRef.current = 2000;
  }, []);

  useEffect(() => {
    return () => {
      stopUploadJobPolling();
      try {
        uploadAbortControllerRef.current?.abort?.();
      } catch (_) {}
    };
  }, [stopUploadJobPolling]);

  const pollUploadJobOnce = useCallback(async (jobId, token) => {
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
      const bytesUploaded = typeof job?.bytesUploaded === 'number' ? job.bytesUploaded : null;
      const totalBytes = typeof job?.totalBytes === 'number' ? job.totalBytes : null;
      setHostedUploadStatus(status);
      setHostedUploadError(jobError);
      setHostedUploadBytes(bytesUploaded);
      setHostedUploadTotalBytes(totalBytes);

      if (typeof bytesUploaded === 'number') {
        const now = Date.now();
        const prev = hostedUploadSpeedRef.current;
        if (typeof prev.bytes === 'number' && typeof prev.at === 'number' && now > prev.at && bytesUploaded >= prev.bytes) {
          const deltaBytes = bytesUploaded - prev.bytes;
          const deltaSec = (now - prev.at) / 1000;
          const speed = deltaSec > 0 ? deltaBytes / deltaSec : null;
          setHostedUploadSpeedBps(Number.isFinite(speed) ? speed : null);
        }
        hostedUploadSpeedRef.current = { bytes: bytesUploaded, at: now };
      }

      if (status === 'completed' || status === 'failed' || status === 'canceled') {
        stopUploadJobPolling();
        return;
      }

      if (status === 'processing' && uploadStageRef.current === 'server') {
        setUploadStage('processing');
      }

      if (uploadStageRef.current === 'server' || uploadStageRef.current === 'processing') {
        setUploadProgress(percent);
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        setHostedUploadStatus('queued');
        setHostedUploadError(null);
        return;
      }

      // Backoff on rate-limit/network issues.
      if (status === 429) {
        uploadPollBackoffMsRef.current = Math.min(uploadPollBackoffMsRef.current * 2, 30000);
      }
    }
    finally {
      uploadPollInFlightRef.current = false;
    }
  }, []);

  const startUploadJobPolling = useCallback((jobId, token) => {
    stopUploadJobPolling();
    if (!jobId) return;

    uploadPollBackoffMsRef.current = 2000;

    const tick = async () => {
      if (cancelRequestedRef.current) return;
      await pollUploadJobOnce(jobId, token);
      if (cancelRequestedRef.current) return;
      if (uploadPollTimeoutRef.current) clearTimeout(uploadPollTimeoutRef.current);
      uploadPollTimeoutRef.current = setTimeout(tick, uploadPollBackoffMsRef.current);
    };

    if (uploadPollTimeoutRef.current) clearTimeout(uploadPollTimeoutRef.current);
    uploadPollTimeoutRef.current = setTimeout(tick, 1200);
  }, [pollUploadJobOnce, stopUploadJobPolling]);

  const handleCancelUpload = useCallback(async () => {
    if (!uploading && !isBlockingUpload) return;

    cancelRequestedRef.current = true;
    const token = localStorage.getItem('token');
    const jobId = uploadSessionIdRef.current || uploadSessionId;

    try {
      if (jobId) {
        await axios.post(
          `/api/video-upload-jobs/${encodeURIComponent(jobId)}/cancel`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }
    } catch (_) {
      // best-effort
    }

    try {
      if (uploadAbortControllerRef.current) {
        uploadAbortControllerRef.current.abort();
      }
    } catch (_) {}

    stopUploadJobPolling();
    uploadAbortControllerRef.current = null;

    setUploading(false);
    setUploadProgress(0);
    setUploadStage('idle');
    setUploadSessionId(null);
    uploadSessionIdRef.current = null;
    setVideoFile(null);
    setDocumentFile(null);
    setSolutionFile(null);
    setHostedUploadStatus(null);
    setHostedUploadError(null);
    setHostedUploadBytes(null);
    setHostedUploadTotalBytes(null);

    toast.success('Upload canceled.');
  }, [isBlockingUpload, stopUploadJobPolling, uploadSessionId, uploading]);

  useEffect(() => {
    if (!isBlockingUpload) return;

    const message = 'Your video is still being processed. Leaving may interrupt the upload.';
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isBlockingUpload]);

  useEffect(() => {
    if (!isBlockingUpload) return;

    const message = 'Your video is still being processed. Leaving may interrupt the upload.';
    const onPopState = () => {
      const shouldLeave = window.confirm(message);
      if (shouldLeave) {
        window.removeEventListener('popstate', onPopState);
        window.history.back();
        return;
      }

      window.history.pushState(null, '', window.location.href);
    };

    window.history.pushState(null, '', window.location.href);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [isBlockingUpload]);

  // Fetch public upload limits
  const fetchPublicUploadSettings = useCallback(async () => {
    try {
      const rawBase = process.env.REACT_APP_API_URL;
      const apiBase = rawBase
        ? `${String(rawBase).replace(/\/+$/, '')}${String(rawBase).replace(/\/+$/, '').endsWith('/api') ? '' : '/api'}`
        : '/api';
      const res = await axios.get(`${apiBase}/admin/settings/public`);
      if (res.data?.data) {
        const maxVideo = res.data.data.maxUploadVideoSizeMB ?? res.data.data.maxVideoSizeMB;
        const maxFile = res.data.data.maxUploadFileSizeMB ?? res.data.data.maxFileSizeMB;
        const minSeconds = res.data.data.minVideoDurationSeconds;

        setUploadLimits((prev) => ({
          maxVideoSizeMB: typeof maxVideo === 'number' && maxVideo > 0 ? maxVideo : prev.maxVideoSizeMB,
          maxFileSizeMB: typeof maxFile === 'number' && maxFile > 0 ? maxFile : prev.maxFileSizeMB
        }));

        if (typeof minSeconds === 'number' && minSeconds > 0) {
          setMinVideoDurationSeconds(minSeconds);
        }
      }
    } catch (e) {
      console.warn('[SectionContentManagement] Failed to load public upload settings:', e);
    }
  }, []);

  useEffect(() => {
    fetchPublicUploadSettings();
  }, [fetchPublicUploadSettings]);

  useEffect(() => {
    if (!showUploadModal) return;
    fetchPublicUploadSettings();
  }, [fetchPublicUploadSettings, showUploadModal]);

  const handleDragEnd = async (event, type) => {
    const { active, over } = event;

    console.log('[Drag End]', { type, activeId: active.id, overId: over.id });

    if (active.id !== over.id) {
      let items;
      if (type === 'lecture') {
        items = lectures;
      } else if (type === 'assignment') {
        items = assignments;
      } else {
        items = projects;
      }

      const oldIndex = items.findIndex((item) => item._id === active.id);
      const newIndex = items.findIndex((item) => item._id === over.id);

      if (oldIndex === -1 || newIndex === -1) {
        console.warn('Invalid drag operation: item not found in list');
        return;
      }

      const newOrder = arrayMove(items, oldIndex, newIndex);

      // Optimistic UI update
      setContent(prevContent => {
        return prevContent.map(item => {
          const updatedItem = newOrder.find(newItem => newItem._id === item._id);
          if (updatedItem) {
            return { ...item, order: newOrder.indexOf(updatedItem) + 1 };
          }
          return item;
        });
      });

      // Update order on server
      try {
        const token = localStorage.getItem('token');
        await axios.put(
          `/api/sections/${sectionId}/content/reorder`,
          {
            contentIds: newOrder.map((item) => item._id),
            type
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        toast.success('Order updated successfully');
        fetchSectionAndContent();
      } catch (error) {
        console.error('Error updating order:', error);
        toast.error('Failed to update order');
        fetchSectionAndContent(); // Revert on error
      }
    }
  };

  const handleWatchContent = async (item) => {
    if (!item) return;

    const youtubeVideoId = item?.video?.youtubeVideoId;
    const isHostedYouTube =
      !!youtubeVideoId &&
      (item?.video?.storageType === 'youtube' || item?.video?.storageType === 'hosted');

    if (isHostedYouTube) {
      setYoutubeWatchModal({
        open: true,
        youtubeVideoId,
        title: item.title || 'Watch video'
      });
      return;
    }

    setVideoPlayerTitle(item.title || 'Watch video');
    setVideoPlayerUrl(`/api/content/${item._id}/stream`);
  };

  const handleOpenAssignUrl = (item) => {
    setAssignUrlModal({
      open: true,
      contentId: item._id,
      title: item.title,
      url: item?.video?.youtubeUrl || '',
      saving: false
    });
  };

  const handleSubmitAssignUrl = async (e) => {
    e.preventDefault();
    if (!assignUrlModal.contentId) return;

    const url = (assignUrlModal.url || '').trim();
    if (!url) {
      toast.error('Please provide a URL or video ID.');
      return;
    }

    try {
      setAssignUrlModal((prev) => ({ ...prev, saving: true }));
      const token = localStorage.getItem('token');
      await axios.put(
        `/api/content/${assignUrlModal.contentId}/assign-hosted-url`,
        { youtubeUrl: url },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success('Hosted video URL updated.');
      setAssignUrlModal({ open: false, contentId: null, title: '', url: '', saving: false });
      fetchSectionAndContent();
    } catch (error) {
      console.error('Error assigning hosted URL:', error);
      const message = error.response?.data?.message || 'Failed to update hosted video URL.';
      toast.error(message);
      setAssignUrlModal((prev) => ({ ...prev, saving: false }));
    }
  };

  const getVideoDurationSeconds = (file) => {
    return new Promise((resolve, reject) => {
      try {
        const url = URL.createObjectURL(file);
        const video = document.createElement('video');
        video.preload = 'metadata';

        const cleanup = () => {
          URL.revokeObjectURL(url);
          video.src = '';
        };

        video.onloadedmetadata = () => {
          const duration = Number.isFinite(video.duration) ? video.duration : 0;
          cleanup();
          resolve(duration);
        };

        video.onerror = () => {
          cleanup();
          reject(new Error('Failed to read video metadata'));
        };

        video.src = url;
      } catch (err) {
        reject(err);
      }
    });
  };

  const waitForVideoProcessing = async (contentId, token) => {
    const POLL_INTERVAL_MS = 3000;
    const MAX_ATTEMPTS = 300;

    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const res = await axios.get(`/api/content/${contentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const item = res?.data?.data;
      const durationLegacy = typeof item?.videoDuration === 'number' ? item.videoDuration : 0;
      const durationMeta = typeof item?.video?.duration === 'number' ? item.video.duration : 0;

      if (durationLegacy > 0 || durationMeta > 0) {
        return;
      }

      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    }

    throw new Error('Processing timed out');
  };

  const handleUploadContent = async (e) => {
    e.preventDefault();

    if (uploadType === 'lecture') {
      if (!editingContent && !videoFile) {
        toast.error('Please select a video file');
        return;
      }
    }
    if (uploadType === 'assignment') {
      if (!editingContent && !documentFile) {
        toast.error('Please select a .rar or .zip assignment file');
        return;
      }
      if (documentFile) {
        const isArchive = /\.(rar|zip)$/i.test(documentFile.name);
        if (!isArchive) {
          toast.error('Assignments must be uploaded as .rar or .zip files only');
          return;
        }
      }
    }
    if (uploadType === 'project') {
      if (!editingContent && (!videoFile || !documentFile)) {
        toast.error('Please select both video and starter archive file');
        return;
      }
      if (documentFile) {
        const isArchive = /\.(rar|zip)$/i.test(documentFile.name);
        if (!isArchive) {
          toast.error('Starter file must be a .rar or .zip archive');
          return;
        }
      }
    }

    if ((uploadType === 'lecture' || uploadType === 'project') && videoFile) {
      try {
        const durationSeconds = await getVideoDurationSeconds(videoFile);
        if (!durationSeconds || durationSeconds < minVideoDurationSeconds) {
          toast.error(`Videos must be at least ${formatDuration(minVideoDurationSeconds)} long.`);
          return;
        }
      } catch (err) {
        toast.error('Unable to verify video length. Please try a different video file.');
        return;
      }
    }
    
    let didError = false;

    try {
      setUploading(true);
      setUploadStage('uploading');
      setUploadProgress(0);
      setUploadSessionId(null);
      cancelRequestedRef.current = false;
      setHostedUploadStatus(null);
      setHostedUploadError(null);
      setHostedUploadBytes(null);
      setHostedUploadTotalBytes(null);
      setHostedUploadSpeedBps(null);
      hostedUploadSpeedRef.current = { bytes: null, at: null };
      setClientUploadBytes(null);
      setClientUploadTotalBytes(null);

      const abortController = typeof AbortController !== 'undefined' ? new AbortController() : null;
      uploadAbortControllerRef.current = abortController;

      const token = localStorage.getItem('token');
      
      const formData = new FormData();
      formData.append('title', uploadForm.title);
      formData.append('description', uploadForm.description);
      formData.append('order', uploadForm.order);

      const shouldTrackHostedProgress =
        (
          uploadType === 'lecture' &&
          Boolean(videoFile) &&
          Boolean(storageConfig?.isYouTubeEnabled) &&
          storageConfig?.videoProvider === 'youtube'
        ) ||
        (
          uploadType === 'assignment' &&
          Boolean(documentFile) &&
          storageConfig?.fileProvider === 'telegram'
        ) ||
        (
          uploadType === 'project' &&
          (
            (
              Boolean(videoFile) &&
              Boolean(storageConfig?.isYouTubeEnabled) &&
              storageConfig?.videoProvider === 'youtube'
            ) ||
            (
              Boolean(documentFile) &&
              storageConfig?.fileProvider === 'telegram'
            )
          )
        );

      if (shouldTrackHostedProgress) {
        const id =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setUploadSessionId(id);
        uploadSessionIdRef.current = id;
        setHostedUploadStatus('uploading');
        setHostedUploadError(null);
        formData.append('uploadSessionId', id);
        startUploadJobPolling(id, token);
      }
      
      const hasFileUpload = Boolean(videoFile || documentFile);

      const requestConfig = {
        headers: {
          Authorization: `Bearer ${token}`
        },
        signal: abortController?.signal
      };

      if (hasFileUpload) {
        requestConfig.onUploadProgress = (progressEvent) => {
          const total = progressEvent.total;
          const progressFraction = typeof progressEvent.progress === 'number' ? progressEvent.progress : null;
          if (!total && progressFraction === null) return;

          if (typeof progressEvent.loaded === 'number') {
            setClientUploadBytes(progressEvent.loaded);
          }
          if (typeof total === 'number') {
            setClientUploadTotalBytes(total);
          }

          const percentCompleted = total
            ? Math.round((progressEvent.loaded * 100) / total)
            : Math.round(progressFraction * 100);

          if (percentCompleted >= 100 || (total && progressEvent.loaded >= total)) {
            // When a hosted upload is enabled, switch to server-side progress after the browser finishes.
            if (shouldTrackHostedProgress) {
              setUploadProgress(0);
              setUploadStage((prev) => (prev === 'uploading' ? 'server' : prev));
              return;
            }

            setUploadProgress(100);
            return;
          }

          setUploadProgress(percentCompleted);
        };
      }

      let contentResponse;
      
      if (uploadType === 'lecture') {
        if (videoFile) {
          formData.append('video', videoFile);
        }

        const url = editingContent 
          ? `/api/content/${editingContent._id}` 
          : `/api/sections/${sectionId}/content/uploadLecture`;
        const method = editingContent ? 'put' : 'post';

        contentResponse = await axios[method](url, formData, requestConfig);
      } else if (uploadType === 'assignment') {
        if (documentFile) formData.append('file', documentFile);
        formData.append('maxScore', 100); // Always 100 for assignments

        const url = editingContent 
          ? `/api/content/${editingContent._id}` 
          : `/api/sections/${sectionId}/content/uploadAssignment`;
        const method = editingContent ? 'put' : 'post';

        contentResponse = await axios[method](url, formData, requestConfig);
      } else if (uploadType === 'project') {
        if (videoFile) formData.append('video', videoFile);
        if (documentFile) formData.append('file', documentFile);
        formData.append('maxScore', 100); // Always 100 for projects

        const url = editingContent 
          ? `/api/content/${editingContent._id}` 
          : `/api/sections/${sectionId}/content/uploadProject`;
        const method = editingContent ? 'put' : 'post';

        contentResponse = await axios[method](url, formData, requestConfig);
      }

      const createdContent = contentResponse?.data?.data;
      const contentId = editingContent?._id || createdContent?._id;
      const isVideoUpload = uploadType === 'lecture' || uploadType === 'project';
      const videoStorageType = createdContent?.video?.storageType;
      const shouldWaitForProcessing = isVideoUpload && Boolean(videoFile) && Boolean(contentId) && videoStorageType === 'local';

      if (shouldWaitForProcessing) {
        setUploadStage('processing');
        setUploadProgress(0);
        await waitForVideoProcessing(contentId, token);
      }

      // Upload solution file separately if provided (for assignments/projects)
      if ((uploadType === 'assignment' || uploadType === 'project') && solutionFile) {
        if (contentId) {
          try {
            const solutionFormData = new FormData();
            solutionFormData.append('solution', solutionFile);
            
            await axios.post(
              `/api/content/${contentId}/uploadSolution`,
              solutionFormData,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  'Content-Type': 'multipart/form-data'
                }
              }
            );
            toast.success(isVideoUpload ? 'Video uploaded successfully.' : 'Content uploaded successfully.');
          } catch (solutionError) {
            console.error('Error uploading solution:', solutionError);
            toast.error(isVideoUpload
              ? 'Video uploaded successfully, but one or more files could not be uploaded. You can try again.'
              : 'Upload completed, but one or more files could not be uploaded. You can try again.');
          }
        }
      } else {
        toast.success(isVideoUpload ? 'Video uploaded successfully.' : (editingContent ? 'Content updated successfully!' : 'Content uploaded successfully!'));
      }
      
      setShowUploadModal(false);
      resetForm();
      fetchSectionAndContent();
    } catch (error) {
      console.error('Error uploading content:', error);

      if (cancelRequestedRef.current) {
        // Suppress failure toasts when user canceled.
      } else {
        didError = true;
        const apiMessage = error?.response?.data?.message;
        const fallbackMessage = 'Upload failed. Please try again.';
        setHostedUploadStatus('failed');
        setHostedUploadError(typeof apiMessage === 'string' && apiMessage.trim().length > 0 ? apiMessage : fallbackMessage);
        setUploadStage('error');
        toast.error(typeof apiMessage === 'string' && apiMessage.trim().length > 0 ? apiMessage : fallbackMessage);
      }
    } finally {
      stopUploadJobPolling();
      setUploading(false);
      uploadAbortControllerRef.current = null;
      cancelRequestedRef.current = false;

      if (!didError) {
        setUploadProgress(0);
        setUploadStage('idle');
        setUploadSessionId(null);
        uploadSessionIdRef.current = null;
        setHostedUploadStatus(null);
        setHostedUploadError(null);
      }
    }
  };

  const resetForm = () => {
    setUploadForm({
      title: '',
      description: '',
      maxScore: 100,
      dueDate: '',
      order: 0
    });
    setVideoFile(null);
    setDocumentFile(null);
    setSolutionFile(null);
    setEditingContent(null);
    setUploadStage('idle');
    setUploadProgress(0);
    setUploadSessionId(null);
    uploadSessionIdRef.current = null;
  };

  const handleOpenDeleteRequest = (contentId, title) => {
    setDeleteRequestModal({ open: true, contentId, title, reason: '', submitting: false });
  };

  const handleOpenAdminDelete = (contentId, title) => {
    setAdminDeleteModal({ open: true, contentId, title, deleting: false });
  };

  const handleConfirmAdminDelete = async () => {
    const contentId = adminDeleteModal.contentId;
    if (!contentId) return;
    try {
      setAdminDeleteModal((prev) => ({ ...prev, deleting: true }));
      const token = localStorage.getItem('token');
      await axios.delete(`/api/content/${contentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setContent((prev) => (Array.isArray(prev) ? prev.filter((c) => c._id !== contentId) : prev));
      setPendingDeleteContentIds((prev) => prev.filter((id) => id !== contentId));
      toast.success('Content deleted successfully.');
      setAdminDeleteModal({ open: false, contentId: null, title: '', deleting: false });
    } catch (error) {
      console.error('Error deleting content:', error);
      toast.error('Failed to delete content. Please try again.');
      setAdminDeleteModal((prev) => ({ ...prev, deleting: false }));
    }
  };

  const handleSubmitDeleteRequest = async (e) => {
    e?.preventDefault?.();
    if (!deleteRequestModal.contentId) return;

    const contentId = deleteRequestModal.contentId;
    const reason = (deleteRequestModal.reason || '').trim();
    if (reason.length < 20) {
      toast.error('Please provide a detailed reason (at least 20 characters).');
      return;
    }

    try {
      setDeleteRequestModal(prev => ({ ...prev, submitting: true }));
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/content/${contentId}/request-delete`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success('Delete request submitted. Admin approval is required before the content is deleted.');
      setPendingDeleteContentIds(prev =>
        prev.includes(contentId) ? prev : [...prev, contentId]
      );
      setDeleteRequestModal({ open: false, contentId: null, title: '', reason: '', submitting: false });
    } catch (error) {
      console.error('Error requesting content delete:', error);
      const message = error.response?.data?.message || 'Failed to submit delete request';

      if (
        error.response?.status === 400 &&
        typeof message === 'string' &&
        message.toLowerCase().includes('already a pending delete request')
      ) {
        setPendingDeleteContentIds(prev =>
          prev.includes(contentId) ? prev : [...prev, contentId]
        );
        setDeleteRequestModal({ open: false, contentId: null, title: '', reason: '', submitting: false });
        toast.error('A delete request for this item is already pending.');
      } else {
        setDeleteRequestModal(prev => ({ ...prev, submitting: false }));
        toast.error('Failed to submit delete request. Please try again.');
      }
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'lecture':
        return <Video className="w-5 h-5 text-blue-500" />;
      case 'assignment':
        return <FileText className="w-5 h-5 text-green-500" />;
      case 'project':
        return <Rocket className="w-5 h-5 text-purple-500" />;
      default:
        return null;
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type) {
      case 'lecture':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'assignment':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'project':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  // Sort content by type and order for display
  const sortByOrder = (a, b) => (a.order || 0) - (b.order || 0);
  const lectures = content.filter(c => c.type === 'lecture').sort(sortByOrder).map((item, index) => ({ ...item, number: index + 1 }));
  const assignments = content.filter(c => c.type === 'assignment').sort(sortByOrder).map((item, index) => ({ ...item, number: index + 1 }));
  const projects = content.filter(c => c.type === 'project').sort(sortByOrder).map((item, index) => ({ ...item, number: index + 1 }));

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'} py-8`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (isBlockingUpload) return;
              navigate(-1);
            }}
            disabled={isBlockingUpload}
            className={`mb-4 ${theme === 'dark' ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-800'} flex items-center`}
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back
          </button>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {section?.name} - Content Management
              </h1>
              <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Upload and manage lectures, assignments, and projects
              </p>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  resetForm();
                  setUploadType('lecture');
                  setShowUploadModal(true);
                }}
                disabled={isBlockingUpload}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Video className="w-4 h-4 mr-2" />
                Upload Lecture
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setUploadType('assignment');
                  setShowUploadModal(true);
                }}
                disabled={isBlockingUpload}
                className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <FileText className="w-4 h-4 mr-2" />
                Upload Assignment
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setUploadType('project');
                  setShowUploadModal(true);
                }}
                disabled={isBlockingUpload}
                className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Rocket className="w-4 h-4 mr-2" />
                Upload Project
              </button>
              <button
                onClick={() => navigate(`/instructor/sections/${sectionId}/tests`)}
                disabled={isBlockingUpload}
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Manage Active Tests
              </button>
            </div>
          </div>
        </div>

        {/* Content Lists */}
        <div className="space-y-8">
          {/* Lectures */}
          <div>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              📹 Lectures ({lectures.length})
            </h2>
            {lectures.length === 0 ? (
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 text-center`}>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No lectures uploaded yet</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, 'lecture')}
              >
                <SortableContext
                  items={lectures.map((item) => item._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {lectures.map((item) => (
                      <SortableContentCard 
                        key={item._id} 
                        id={item._id}
                        item={item} 
                        theme={theme} 
                        onRequestDelete={handleOpenDeleteRequest}
                        onAdminDelete={handleOpenAdminDelete}
                        onAssignUrl={handleOpenAssignUrl}
                        isAdmin={isAdmin}
                        onWatch={handleWatchContent}
                        onEdit={(content) => {
                          setEditingContent(content);
                          setUploadType(content.type);
                          setUploadForm({
                            title: content.title || '',
                            description: content.description || '',
                            maxScore: content.maxScore || 100,
                            dueDate: content.dueDate ? new Date(content.dueDate).toISOString().split('T')[0] : '',
                            order: content.order || 0
                          });
                          setVideoFile(null);
                          setDocumentFile(null);
                          setShowUploadModal(true);
                        }}
                        getTypeIcon={getTypeIcon} 
                        getTypeBadgeColor={getTypeBadgeColor} 
                        isDeletePending={pendingDeleteContentIds.includes(item._id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Assignments */}
          <div>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              📝 Assignments ({assignments.length})
            </h2>
            {assignments.length === 0 ? (
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 text-center`}>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No assignments uploaded yet</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, 'assignment')}
              >
                <SortableContext
                  items={assignments.map((item) => item._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {assignments.map((item) => (
                      <SortableContentCard 
                        key={item._id} 
                        id={item._id}
                        item={item} 
                        theme={theme} 
                        onRequestDelete={handleOpenDeleteRequest}
                        onAdminDelete={handleOpenAdminDelete}
                        isAdmin={isAdmin}
                        onWatch={handleWatchContent}
                        onEdit={(content) => {
                          setEditingContent(content);
                          setUploadType(content.type);
                          setUploadForm({
                            title: content.title || '',
                            description: content.description || '',
                            maxScore: content.maxScore || 100,
                            dueDate: content.dueDate ? new Date(content.dueDate).toISOString().split('T')[0] : '',
                            order: content.order || 0
                          });
                          setShowUploadModal(true);
                        }}
                        getTypeIcon={getTypeIcon} 
                        getTypeBadgeColor={getTypeBadgeColor} 
                        isDeletePending={pendingDeleteContentIds.includes(item._id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>

          {/* Projects */}
          <div>
            <h2 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'} mb-4`}>
              🚀 Projects ({projects.length})
            </h2>
            {projects.length === 0 ? (
              <div className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 text-center`}>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>No projects uploaded yet</p>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(event) => handleDragEnd(event, 'project')}
              >
                <SortableContext
                  items={projects.map((item) => item._id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-4">
                    {projects.map((item) => (
                      <SortableContentCard 
                        key={item._id} 
                        id={item._id}
                        item={item} 
                        theme={theme} 
                        onRequestDelete={handleOpenDeleteRequest}
                        onAdminDelete={handleOpenAdminDelete}
                        isAdmin={isAdmin}
                        onWatch={handleWatchContent}
                        onEdit={(content) => {
                          setEditingContent(content);
                          setUploadType(content.type);
                          setUploadForm({
                            title: content.title || '',
                            description: content.description || '',
                            maxScore: content.maxScore || 100,
                            dueDate: content.dueDate ? new Date(content.dueDate).toISOString().split('T')[0] : '',
                            order: content.order || 0
                          });
                          setShowUploadModal(true);
                        }}
                        getTypeIcon={getTypeIcon} 
                        getTypeBadgeColor={getTypeBadgeColor} 
                        isDeletePending={pendingDeleteContentIds.includes(item._id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}
          </div>
        </div>

        {/* Video Player Modal */}
        {videoPlayerUrl && (
          <VideoPlayer
            videoUrl={videoPlayerUrl}
            onClose={() => {
              setVideoPlayerUrl(null);
              setVideoPlayerTitle('');
            }}
            title={videoPlayerTitle}
          />
        )}

        {secureVideoModal.open && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/70 p-4"
            style={{ zIndex: 2000 }}
            onClick={() => setSecureVideoModal({ open: false, contentId: null, title: '', secureUrl: '', loading: false })}
          >
            <div className="w-full max-w-5xl" onClick={(e) => e.stopPropagation()}>
              {secureVideoModal.loading || !secureVideoModal.secureUrl ? (
                <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
              ) : (
                <SecureYouTubePlayer
                  secureUrl={secureVideoModal.secureUrl}
                  title={secureVideoModal.title}
                  autoPlay={false}
                  contentId={secureVideoModal.contentId}
                  onComplete={() => {
                    fetchSectionAndContent();
                  }}
                />
              )}
            </div>
          </div>
        )}

        {youtubeWatchModal.open && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
            style={{ zIndex: 2000 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-5xl overflow-hidden max-h-[90vh] flex flex-col`}
            >
              <div
                className={`flex items-center justify-between px-6 py-4 border-b ${
                  theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                }`}
              >
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                  {youtubeWatchModal.title}
                </h3>
                <button
                  type="button"
                  onClick={() => setYoutubeWatchModal({ open: false, youtubeVideoId: '', title: '' })}
                  className={`p-2 rounded-md transition ${
                    theme === 'dark'
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto p-4">
                <CustomYouTubePlayer youtubeVideoId={youtubeWatchModal.youtubeVideoId} title={youtubeWatchModal.title} />
              </div>
            </motion.div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div
            className="fixed inset-0 flex items-start justify-center bg-black/50 px-4 pb-4 pt-28 md:pt-6 overflow-y-auto"
            style={{ zIndex: 2000 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-2xl overflow-hidden h-[calc(100vh-8rem)] max-h-[calc(100vh-8rem)] md:h-[calc(100vh-3rem)] md:max-h-[calc(100vh-3rem)]`}
            >
              <form onSubmit={handleUploadContent} className="flex flex-col h-full min-h-0">
                <div
                  className={`flex items-center justify-between px-6 py-4 border-b ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                  }`}
                >
                  <h3 className={`text-xl font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {editingContent ? 'Edit' : 'Upload'} {uploadType.charAt(0).toUpperCase() + uploadType.slice(1)}
                  </h3>

                  <div className="flex items-center gap-2">
                    {shouldShowCancelUpload && (
                      <button
                        type="button"
                        onClick={handleCancelUpload}
                        className={`px-4 py-2 rounded-lg border text-sm ${
                          theme === 'dark'
                            ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        } transition`}
                      >
                        Cancel Upload
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        resetForm();
                      }}
                      disabled={isBlockingUpload}
                      className={`p-2 rounded-md transition ${
                        theme === 'dark'
                          ? 'text-gray-300 hover:bg-gray-700'
                          : 'text-gray-600 hover:bg-gray-100'
                      } disabled:opacity-50`}
                      aria-label="Close"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 py-4 space-y-4">
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={uploadForm.title}
                    onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                    className="input-field w-full"
                    placeholder={`e.g., ${uploadType === 'lecture' ? 'Introduction to Variables' : uploadType === 'assignment' ? 'Practice Exercise 1' : 'Final Project'}`}
                  />
                </div>

                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Description
                  </label>
                  <textarea
                    rows="2"
                    value={uploadForm.description}
                    onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                    className="input-field w-full"
                  />
                </div>

                {(uploadType === 'lecture' || uploadType === 'project') && (
                <div>
                  <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                    Video File * (MP4, WEBM, MKV, AVI, MOV) — Max {uploadLimits.maxVideoSizeMB}MB
                  </label>
                  <div className={`mb-3 space-y-1 text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    <p>Videos must be at least {formatDuration(minVideoDurationSeconds)} long.</p>
                    <p>A brief intro animation (about 3–4 seconds) will be added to the beginning of the video automatically and cannot be removed.</p>
                  </div>
                  <input
                      type="file"
                      accept="video/*,.mp4,.webm,.mkv,.avi,.mov"
                      required={!editingContent}
                      disabled={isBlockingUpload}
                      onChange={(e) => {
                        const f = e.target.files[0] || null;
                        if (!f) { setVideoFile(null); return; }
                        const maxBytes = (uploadLimits.maxVideoSizeMB || 500) * 1024 * 1024;
                        if (f.size > maxBytes) {
                          toast.error(`Video exceeds maximum size of ${uploadLimits.maxVideoSizeMB}MB`);
                          e.target.value = '';
                          setVideoFile(null);
                          return;
                        }
                        setVideoFile(f);
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } ${isBlockingUpload ? 'opacity-60 cursor-not-allowed' : ''}`}
                    />
                    {videoFile && (
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Selected: {videoFile.name} ({(videoFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    {editingContent && !videoFile && (
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        Current video will be kept unless you upload a new file.
                      </p>
                    )}
                  </div>
                )}

                {(uploadType === 'assignment' || uploadType === 'project') && (
                  <div>
                    <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                      {uploadType === 'assignment' ? 'Assignment File * (.rar or .zip)' : 'Starter File * (.rar or .zip)'} — Max {uploadLimits.maxFileSizeMB}MB
                    </label>
                    <input
                      type="file"
                      accept=".rar,.zip"
                      required={!editingContent}
                      disabled={isBlockingUpload}
                      onChange={(e) => {
                        const f = e.target.files[0] || null;
                        if (!f) { setDocumentFile(null); return; }
                        const maxBytes = (uploadLimits.maxFileSizeMB || 100) * 1024 * 1024;
                        if (f.size > maxBytes) {
                          toast.error(`File exceeds maximum size of ${uploadLimits.maxFileSizeMB}MB`);
                          e.target.value = '';
                          setDocumentFile(null);
                          return;
                        }
                        setDocumentFile(f);
                      }}
                      className={`w-full px-4 py-2 rounded-lg border ${
                        theme === 'dark' 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                    {documentFile && (
                      <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Selected: {documentFile.name} ({(documentFile.size / 1024 / 1024).toFixed(2)} MB)
                      </p>
                    )}
                    {editingContent && !documentFile && (
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        Existing file will remain available unless you upload a new archive.
                      </p>
                    )}
                  </div>
                )}

                {(uploadType === 'assignment' || uploadType === 'project') && (
                  <>
                    <div>
                      <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                        Solution File (.rar or .zip) - Optional
                      </label>
                      <input
                        type="file"
                        accept=".rar,.zip"
                        onChange={(e) => setSolutionFile(e.target.files[0] || null)}
                        disabled={isBlockingUpload}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          theme === 'dark' 
                            ? 'bg-gray-700 border-gray-600 text-white' 
                            : 'bg-white border-gray-300 text-gray-900'
                        } ${isBlockingUpload ? 'opacity-60 cursor-not-allowed' : ''}`}
                      />
                      {solutionFile && (
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                          Selected: {solutionFile.name} ({(solutionFile.size / 1024 / 1024).toFixed(2)} MB)
                        </p>
                      )}
                      {editingContent && editingContent.solution && !solutionFile && (
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-green-500' : 'text-green-600'}`}>
                          Current solution: {editingContent.solution.originalName}
                        </p>
                      )}
                      <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                        Students will only see the solution after their submission is graded.
                      </p>
                    </div>
                    <div>
                      <div>
                        <label className={`block text-sm font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'} mb-1`}>
                          Max Score
                        </label>
                        <input
                          type="number"
                          value={100}
                          readOnly
                          disabled
                          className="input-field w-full bg-gray-100 dark:bg-gray-700 cursor-not-allowed"
                          title="Max score is always 100 for assignments and projects"
                        />
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                          Max score is automatically set to 100
                        </p>
                      </div>
                    </div>
                  </>
                )}

                </div>

                <div
                  className={`px-6 py-4 border-t ${
                    theme === 'dark' ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
                  }`}
                >
                  {(uploading || uploadStage === 'server' || uploadStage === 'processing' || uploadStage === 'error') && (
                    <div className="mb-4">
                      {uploadStage === 'uploading' ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {uploadProgress <= 0 ? 'Preparing upload...' : 'Uploading...'}
                            </span>
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                              {uploadProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          {typeof clientUploadBytes === 'number' && typeof clientUploadTotalBytes === 'number' && clientUploadTotalBytes > 0 && (
                            <p className={`text-xs mt-2 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {(clientUploadBytes / 1024 / 1024).toFixed(1)} / {(clientUploadTotalBytes / 1024 / 1024).toFixed(1)} MB
                            </p>
                          )}
                        </>
                      ) : uploadStage === 'server' ? (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                              {hostedUploadStatus === 'queued'
                                ? 'Preparing upload...'
                                : hostedUploadStatus === 'canceling'
                                  ? 'Canceling upload...'
                                  : hostedUploadStatus === 'failed'
                                    ? 'Upload failed'
                                    : hostedUploadStatus === 'processing' || hostedUploadStatus === 'completed'
                                      ? 'Finalizing...'
                                      : (uploadType === 'assignment'
                                        ? 'Uploading assignment...'
                                        : uploadType === 'project'
                                          ? 'Uploading project...'
                                          : 'Uploading video...')}
                            </span>
                            <span className={`text-sm font-medium ${theme === 'dark' ? 'text-indigo-400' : 'text-indigo-600'}`}>
                              {uploadProgress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all"
                              style={{ width: `${uploadProgress}%` }}
                            />
                          </div>
                          {typeof hostedUploadBytes === 'number' && typeof hostedUploadTotalBytes === 'number' && hostedUploadTotalBytes > 0 && (
                            <p className={`text-xs mt-2 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {Math.min(100, Math.round((hostedUploadBytes * 100) / hostedUploadTotalBytes))}% • {(hostedUploadBytes / 1024 / 1024).toFixed(1)} / {(hostedUploadTotalBytes / 1024 / 1024).toFixed(1)} MB
                            </p>
                          )}
                          {typeof hostedUploadSpeedBps === 'number' && Number.isFinite(hostedUploadSpeedBps) && hostedUploadSpeedBps > 0 && typeof hostedUploadBytes === 'number' && typeof hostedUploadTotalBytes === 'number' && hostedUploadTotalBytes > 0 && (
                            <p className={`text-xs mt-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              {(hostedUploadSpeedBps / 1024 / 1024).toFixed(2)} MB/s • {((hostedUploadTotalBytes - hostedUploadBytes) / 1024 / 1024).toFixed(1)} MB remaining
                            </p>
                          )}
                          <p className={`text-xs mt-2 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Do not close this page until the upload completes.
                          </p>
                          {hostedUploadStatus === 'failed' && hostedUploadError && (
                            <p className={`text-xs mt-2 text-center ${theme === 'dark' ? 'text-red-300' : 'text-red-600'}`}>
                              {hostedUploadError}
                            </p>
                          )}
                        </>
                      ) : uploadStage === 'error' ? (
                        <>
                          <div className={`w-full rounded-lg border px-4 py-3 ${theme === 'dark' ? 'border-red-800 bg-red-950/40 text-red-200' : 'border-red-200 bg-red-50 text-red-800'}`}>
                            <p className="text-sm font-medium">Upload failed</p>
                            <p className="text-xs mt-1">{hostedUploadError || 'Upload failed. Please try again.'}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-600 h-2 w-full animate-pulse" />
                          </div>
                          <p className={`text-sm mt-3 text-center ${theme === 'dark' ? 'text-gray-200' : 'text-gray-800'}`}>
                            Uploaded. Processing…
                          </p>
                          <p className={`text-xs mt-1 text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Do not close this page until processing completes.
                          </p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="flex justify-end gap-3">
                    {shouldShowCancelUpload && (
                      <button
                        type="button"
                        onClick={handleCancelUpload}
                        className={`px-6 py-2 rounded-lg border ${
                          theme === 'dark'
                            ? 'border-gray-600 text-gray-200 hover:bg-gray-700'
                            : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                        } transition`}
                      >
                        Cancel Upload
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setShowUploadModal(false);
                        resetForm();
                      }}
                      disabled={isBlockingUpload}
                      className={`px-6 py-2 rounded-lg ${
                        theme === 'dark'
                          ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      } transition disabled:opacity-50`}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isBlockingUpload}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {uploadStage === 'uploading'
                        ? `${editingContent ? 'Updating' : 'Uploading'} ${uploadProgress}%...`
                        : uploadStage === 'server'
                          ? (uploadType === 'assignment'
                            ? 'Uploading assignment...'
                            : uploadType === 'project'
                              ? 'Uploading project...'
                              : 'Uploading video...')
                        : uploadStage === 'processing'
                          ? 'Processing...'
                          : (editingContent ? 'Update' : 'Upload')}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {deleteRequestModal.open && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
            style={{ zIndex: 2000 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-lg p-6`}
            >
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Request Delete
              </h3>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                You are requesting admin approval to permanently delete:
              </p>
              <p className={`text-sm font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                {deleteRequestModal.title}
              </p>
              <form onSubmit={handleSubmitDeleteRequest} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Reason for deletion * (min 20 characters)
                  </label>
                  <textarea
                    rows="4"
                    value={deleteRequestModal.reason}
                    onChange={(e) =>
                      setDeleteRequestModal(prev => ({ ...prev, reason: e.target.value }))
                    }
                    className="input-field w-full"
                    placeholder="Explain why this content should be permanently deleted..."
                  />
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {deleteRequestModal.reason.trim().length} / 20
                  </p>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() =>
                      setDeleteRequestModal({ open: false, contentId: null, title: '', reason: '', submitting: false })
                    }
                    className={`px-4 py-2 rounded-md border text-sm ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={deleteRequestModal.submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={deleteRequestModal.submitting}
                    className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
                  >
                    {deleteRequestModal.submitting ? 'Submitting...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}

        {adminDeleteModal.open && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
            style={{ zIndex: 2000 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-lg p-6`}
            >
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Delete Content
              </h3>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                This will permanently delete:
              </p>
              <p className={`text-sm font-medium mb-4 ${theme === 'dark' ? 'text-gray-100' : 'text-gray-900'}`}>
                {adminDeleteModal.title}
              </p>
              <p className={`text-xs mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                This action cannot be undone.
              </p>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAdminDeleteModal({ open: false, contentId: null, title: '', deleting: false })}
                  className={`px-4 py-2 rounded-md border text-sm ${
                    theme === 'dark'
                      ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                      : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                  disabled={adminDeleteModal.deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmAdminDelete}
                  disabled={adminDeleteModal.deleting}
                  className="px-4 py-2 rounded-md bg-red-600 text-white text-sm hover:bg-red-700 disabled:opacity-60"
                >
                  {adminDeleteModal.deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {assignUrlModal.open && (
          <div
            className="fixed inset-0 flex items-center justify-center bg-black/50 p-4"
            style={{ zIndex: 2000 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-xl w-full max-w-lg p-6`}
            >
              <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                Assign new URL
              </h3>
              <p className={`text-sm mb-4 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                {assignUrlModal.title}
              </p>
              <form onSubmit={handleSubmitAssignUrl} className="space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-1 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                    Hosted video URL or ID
                  </label>
                  <input
                    type="text"
                    value={assignUrlModal.url}
                    onChange={(e) => setAssignUrlModal((prev) => ({ ...prev, url: e.target.value }))}
                    className="input-field w-full"
                    placeholder="Paste a URL or video ID"
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setAssignUrlModal({ open: false, contentId: null, title: '', url: '', saving: false })}
                    className={`px-4 py-2 rounded-md border text-sm ${
                      theme === 'dark'
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-700'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                    disabled={assignUrlModal.saving}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignUrlModal.saving}
                    className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {assignUrlModal.saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

// Sortable Content Card Component
const SortableContentCard = ({ id, item, theme, onRequestDelete, onAdminDelete, onAssignUrl, isAdmin, onEdit, onWatch, getTypeIcon, getTypeBadgeColor, isDeletePending }) => {
  const [isDownloading, setIsDownloading] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={`${theme === 'dark' ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-4`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {/* Drag Handle */}
          <div {...attributes} {...listeners} className="cursor-move p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          
          {item.number && (
            <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'
            }`}>
              {item.number}
            </span>
          )}
          {getTypeIcon(item.type)}
          <h4 className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {item.title}
          </h4>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(item)}
            className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          {isAdmin && item.type === 'lecture' && (
            <button
              type="button"
              onClick={() => onAssignUrl && onAssignUrl(item)}
              className="btn-request-delete text-xs px-2 py-1"
              title="Assign new URL"
            >
              <span>Assign URL</span>
            </button>
          )}
          {isAdmin ? (
            <button
              type="button"
              onClick={() => onAdminDelete(item._id, item.title)}
              className="btn-request-delete text-xs px-2 py-1"
              title="Delete"
            >
              <Trash2 className="w-3 h-3" />
              <span>Delete</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                if (!isDeletePending) {
                  onRequestDelete(item._id, item.title);
                }
              }}
              disabled={isDeletePending}
              className="btn-request-delete text-xs px-2 py-1"
              title={isDeletePending ? 'Delete request already pending' : 'Request Delete'}
            >
              <Trash2 className="w-3 h-3" />
              <span>{isDeletePending ? 'Request Pending' : 'Request Delete'}</span>
            </button>
          )}
        </div>
      </div>

      {item.description && (
        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} mb-3`}>
          {item.description}
        </p>
      )}

      <div className="flex items-center gap-2 mb-3">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadgeColor(item.type)}`}>
          {item.type}
        </span>
        {item.dueDate && (
          <span className={`text-xs ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            Due: {new Date(item.dueDate).toLocaleDateString()}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {(item.video?.storageType === 'hosted' || item.video?.storageType === 'youtube' || item.videoPath || item.video?.path) && (
          <button
            onClick={() => onWatch(item)}
            className="flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition"
          >
            <Play className="w-3 h-3 mr-1" />
            Watch
          </button>
        )}
        {(item.filePath || item.file?.path || (item.file?.storageType === 'telegram' && item.file?.telegramFileId)) && (
          <button
            onClick={async (e) => {
              e.preventDefault();
              if (isDownloading) return;
              setIsDownloading(true);
              try {
                const downloadUrl = `/api/content/${item._id}/download${item.type === 'project' ? '?type=starter' : ''}`;
                const response = await fetch(downloadUrl, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem('token') || ''}`
                  }
                });

                if (!response.ok) {
                  toast.error('Failed to download file. Please try again later.');
                  return;
                }

                const disposition = response.headers.get('content-disposition');
                let filename =
                  item.file?.telegramFileName ||
                  item.file?.originalName ||
                  item.file?.storedName ||
                  item.file?.filename ||
                  (typeof item.filePath === 'string' ? item.filePath.split('/').pop() : '') ||
                  'download';
                if (disposition && disposition.includes('filename=')) {
                  const match = disposition.match(/filename="?([^";]+)"?/i);
                  if (match?.[1]) {
                    try {
                      filename = decodeURIComponent(match[1]);
                    } catch {
                      filename = match[1];
                    }
                  }
                }

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);
              } catch (error) {
                console.error('Download error:', error);
                toast.error('Failed to download file. Please try again later.');
              } finally {
                setTimeout(() => {
                  setIsDownloading(false);
                }, 1200);
              }
            }}
            disabled={isDownloading}
            className="flex items-center px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition"
          >
            <Download className="w-3 h-3 mr-1" />
            {isDownloading ? 'Starting download...' : 'Download'}
          </button>
        )}
        {/* Download Video for Projects - REMOVED per user request */}
      </div>
    </div>
  );
};

export default SectionContentManagement;
