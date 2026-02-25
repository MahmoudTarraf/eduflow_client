import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTheme } from '../../contexts/ThemeContext';
import { formatPrice } from '../../utils/currency';
import VideoPlayer from '../../components/common/VideoPlayer';
import CustomYouTubePlayer from '../../components/common/CustomYouTubePlayer';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
const sortByOrder = (a, b) => (a.order ?? 0) - (b.order ?? 0);

const SectionContent = () => {
  const { sectionId } = useParams();
  const navigate = useNavigate();

  const [minVideoDurationSeconds, setMinVideoDurationSeconds] = useState(60);
  const [uploadLimits, setUploadLimits] = useState({ maxVideoSizeMB: 500, maxFileSizeMB: 100 });
  const [section, setSection] = useState(null);
  const [content, setContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadType, setUploadType] = useState('lecture');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStage, setUploadStage] = useState('idle');
  const [storageConfig, setStorageConfig] = useState(null);
  const [uploadSessionId, setUploadSessionId] = useState(null);

  const uploadAbortControllerRef = useRef(null);
  const uploadPollIntervalRef = useRef(null);
  const uploadPollTimeoutRef = useRef(null);
  const uploadPollInFlightRef = useRef(false);
  const uploadPollBackoffMsRef = useRef(2000);
  const uploadStageRef = useRef('idle');
  const cancelRequestedRef = useRef(false);
  const uploadSessionIdRef = useRef(null);
  const [hostedUploadStatus, setHostedUploadStatus] = useState(null);
  const [hostedUploadError, setHostedUploadError] = useState(null);
  const [hostedUploadBytes, setHostedUploadBytes] = useState(null);
  const [hostedUploadTotalBytes, setHostedUploadTotalBytes] = useState(null);
  const [hostedUploadSpeedBps, setHostedUploadSpeedBps] = useState(null);
  const hostedUploadSpeedRef = useRef({ bytes: null, at: null });
  const [clientUploadBytes, setClientUploadBytes] = useState(null);
  const [clientUploadTotalBytes, setClientUploadTotalBytes] = useState(null);

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

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    order: 0,
    maxScore: 100,
    dueDate: ''
  });
  const [videoFile, setVideoFile] = useState(null);
  const [documentFile, setDocumentFile] = useState(null);
  const [solutionFile, setSolutionFile] = useState(null);
  const [showVideoPlayer, setShowVideoPlayer] = useState(false);
  const [selectedContent, setSelectedContent] = useState(null);
  const [youtubeWatchModal, setYoutubeWatchModal] = useState({
    open: false,
    youtubeVideoId: '',
    title: ''
  });
  const [deleteRequest, setDeleteRequest] = useState({ open: false, contentId: null, title: '', reason: '', submitting: false });
  const [pendingDeleteContentIds, setPendingDeleteContentIds] = useState([]);

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

  const groupedContent = useMemo(() => {
    const grouped = {
      lecture: [],
      assignment: [],
      project: []
    };

    content.forEach(item => {
      if (grouped[item.type]) {
        grouped[item.type].push(item);
      }
    });

    Object.keys(grouped).forEach(type => {
      grouped[type].sort(sortByOrder);
    });

    return grouped;
  }, [content]);

  const openDeleteRequest = (contentId, title) => {
    setDeleteRequest({ open: true, contentId, title, reason: '', submitting: false });
  };

  useEffect(() => {
    fetchSectionAndContent();
  }, [sectionId]);

  useEffect(() => {
    const loadStorageConfig = async () => {
      let didError = false;

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

  const fetchPublicUploadSettings = useCallback(async () => {
    try {
      const rawBase = process.env.REACT_APP_API_URL || 'https://eduflow-server-87rv.onrender.com';
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
      console.warn('[SectionContent] Failed to load public upload settings:', e);
    }
  }, []);

  useEffect(() => {
    fetchPublicUploadSettings();
  }, [fetchPublicUploadSettings]);

  useEffect(() => {
    if (!showUploadModal) return;
    fetchPublicUploadSettings();
  }, [fetchPublicUploadSettings, showUploadModal]);

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

    tick();
  }, [pollUploadJobOnce, stopUploadJobPolling]);

  const handleCancelUpload = useCallback(async () => {
    if (!isBlockingUpload) return;

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
    } catch (_) { }

    try {
      uploadAbortControllerRef.current?.abort?.();
    } catch (_) { }

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
    setHostedUploadSpeedBps(null);
    hostedUploadSpeedRef.current = { bytes: null, at: null };
    setClientUploadBytes(null);
    setClientUploadTotalBytes(null);
    toast.success('Upload canceled.');
  }, [isBlockingUpload, stopUploadJobPolling, uploadSessionId]);

  const fetchSectionAndContent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');

      const sectionRes = await axios.get(
        `/api/sections/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSection(sectionRes.data.data);

      const contentRes = await axios.get(
        `/api/content/section/${sectionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setContent(contentRes.data.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openUploadModal = (type) => {
    setUploadType(type);
    setShowUploadModal(true);
    setFormData({ title: '', description: '', order: 0, maxScore: 100, dueDate: '' });
    setVideoFile(null);
    setDocumentFile(null);
    setSolutionFile(null);
    setUploadProgress(0);
    setUploadStage('idle');
  };

  const closeUploadModal = (force = false) => {
    if (!force && (uploadStage === 'uploading' || uploadStage === 'server' || uploadStage === 'processing')) {
      return;
    }
    setShowUploadModal(false);
    setUploadType('lecture');
    setFormData({ title: '', description: '', order: 0, maxScore: 100, dueDate: '' });
    setVideoFile(null);
    setDocumentFile(null);
    setSolutionFile(null);
    setUploadProgress(0);
    setUploadStage('idle');
  };

  useEffect(() => {
    if (uploadStage !== 'uploading' && uploadStage !== 'server' && uploadStage !== 'processing') return;

    const message = 'Your video is still being processed. Leaving may interrupt the upload.';
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = message;
      return message;
    };

    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [uploadStage]);

  useEffect(() => {
    if (uploadStage !== 'uploading' && uploadStage !== 'server' && uploadStage !== 'processing') return;

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
  }, [uploadStage]);

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
      if (!videoFile) {
        toast.error('Please select a video file');
        return;
      }

      const maxVideoBytes = (uploadLimits.maxVideoSizeMB || 500) * 1024 * 1024;
      if (videoFile.size > maxVideoBytes) {
        toast.error(`Video exceeds maximum size of ${uploadLimits.maxVideoSizeMB}MB`);
        return;
      }

      const allowedVideoTypes = [
        'video/mp4',
        'video/webm',
        'video/ogg',
        'video/mpeg',
        'video/x-matroska',
        'video/quicktime',
        'video/x-msvideo',
        'application/octet-stream'
      ];
      const allowedVideoExtensions = /\.(mp4|webm|mkv|mov|avi|mpeg|mpg|ogg)$/i;
      const mimeOk = allowedVideoTypes.includes(videoFile.type);
      const extOk = allowedVideoExtensions.test(videoFile.name || '');
      if (!mimeOk && !extOk) {
        toast.error('Invalid video format. Supported formats: MP4, WEBM, MKV, MOV, AVI, MPEG');
        return;
      }
    }

    if (uploadType === 'assignment') {
      if (!documentFile) {
        toast.error('Please select a .rar or .zip assignment file');
        return;
      }

      const maxFileBytes = (uploadLimits.maxFileSizeMB || 100) * 1024 * 1024;
      if (documentFile.size > maxFileBytes) {
        toast.error(`File exceeds maximum size of ${uploadLimits.maxFileSizeMB}MB`);
        return;
      }

      const isArchive = /\.(rar|zip)$/i.test(documentFile.name || '');
      if (!isArchive) {
        toast.error('Assignments must be uploaded as .rar or .zip archives only');
        return;
      }
    }

    if ((uploadType === 'assignment' || uploadType === 'project') && solutionFile) {
      const maxFileBytes = (uploadLimits.maxFileSizeMB || 100) * 1024 * 1024;
      if (solutionFile.size > maxFileBytes) {
        toast.error(`Solution file exceeds maximum size of ${uploadLimits.maxFileSizeMB}MB`);
        return;
      }

      const isArchive = /\.(rar|zip)$/i.test(solutionFile.name || '');
      if (!isArchive) {
        toast.error('Solution files must be uploaded as .rar or .zip archives only');
        return;
      }
    }

    if (uploadType === 'project') {
      if (!videoFile || !documentFile) {
        toast.error('Please select both video and starter file');
        return;
      }

      const maxVideoBytes = (uploadLimits.maxVideoSizeMB || 500) * 1024 * 1024;
      if (videoFile.size > maxVideoBytes) {
        toast.error(`Video exceeds maximum size of ${uploadLimits.maxVideoSizeMB}MB`);
        return;
      }

      const maxFileBytes = (uploadLimits.maxFileSizeMB || 100) * 1024 * 1024;
      if (documentFile.size > maxFileBytes) {
        toast.error(`File exceeds maximum size of ${uploadLimits.maxFileSizeMB}MB`);
        return;
      }

      const isArchive = /\.(rar|zip)$/i.test(documentFile.name || '');
      if (!isArchive) {
        toast.error('Starter files must be uploaded as .rar or .zip archives only');
        return;
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
      const formDataToSend = new FormData();

      formDataToSend.append('title', formData.title);
      formDataToSend.append('description', formData.description);
      formDataToSend.append('sectionId', sectionId);
      formDataToSend.append('groupId', section.group);
      formDataToSend.append('courseId', section.course);
      formDataToSend.append('order', formData.order);

      if (uploadType === 'lecture') {
        formDataToSend.append('video', videoFile);
      } else if (uploadType === 'assignment') {
        formDataToSend.append('file', documentFile);
        formDataToSend.append('maxScore', formData.maxScore);
        if (formData.dueDate) formDataToSend.append('dueDate', formData.dueDate);
      } else if (uploadType === 'project') {
        formDataToSend.append('video', videoFile);
        formDataToSend.append('file', documentFile);
        formDataToSend.append('maxScore', formData.maxScore);
        if (formData.dueDate) formDataToSend.append('dueDate', formData.dueDate);
      }

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
        formDataToSend.append('uploadSessionId', id);
        startUploadJobPolling(id, token);
      }

      const uploadResponse = await axios.post(
        `/api/content/${uploadType}`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          signal: abortController?.signal,
          onUploadProgress: (progressEvent) => {
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
            if (percentCompleted >= 100) {
              if (shouldTrackHostedProgress) {
                setUploadProgress(0);
                setUploadStage((prev) => (prev === 'uploading' ? 'server' : prev));
                return;
              }
              setUploadProgress(100);
              return;
            }
            setUploadProgress(percentCompleted);
          }
        }
      );

      const createdContent = uploadResponse?.data?.data;
      const createdContentId = createdContent?._id;
      const isVideoUpload = uploadType === 'lecture' || uploadType === 'project';

      if ((uploadType === 'assignment' || uploadType === 'project') && solutionFile && createdContentId) {
        try {
          const solutionFormData = new FormData();
          solutionFormData.append('solution', solutionFile);

          await axios.post(`/api/content/${createdContentId}/uploadSolution`, solutionFormData, {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            },
            signal: abortController?.signal
          });
        } catch (solutionError) {
          console.error('Error uploading solution:', solutionError);
          toast.error(isVideoUpload
            ? 'Video uploaded successfully, but solution file could not be uploaded. You can try again.'
            : 'Content uploaded successfully, but solution file could not be uploaded. You can try again.');
        }
      }

      const videoStorageType = createdContent?.video?.storageType;
      const shouldWaitForProcessing = isVideoUpload && createdContentId && videoStorageType === 'local';

      if (shouldWaitForProcessing) {
        setUploadStage('processing');
        setUploadProgress(0);
        await waitForVideoProcessing(createdContentId, token);
        closeUploadModal(true);
        fetchSectionAndContent();
        toast.success('Video uploaded successfully.');
        return;
      }

      setUploadStage('idle');
      closeUploadModal(true);
      fetchSectionAndContent();
      toast.success(isVideoUpload ? 'Video uploaded successfully.' : 'Content uploaded successfully!');
    } catch (error) {
      console.error('Error uploading content:', error);
      didError = true;
      if (!cancelRequestedRef.current) {
        setUploadStage('error');
        const responseMessage = error?.response?.data?.message;
        const errMsg = typeof responseMessage === 'string' && responseMessage.trim().length > 0
          ? responseMessage
          : 'Upload failed. Please try again.';
        setHostedUploadError((prev) => prev || errMsg);
        toast.error(errMsg);
      }
    } finally {
      stopUploadJobPolling();
      setUploading(false);
      if (!didError && !cancelRequestedRef.current) {
        setUploadProgress(0);
        setUploadStage('idle');
        setUploadSessionId(null);
        uploadSessionIdRef.current = null;
        setHostedUploadStatus(null);
        setHostedUploadError(null);
        setHostedUploadBytes(null);
        setHostedUploadTotalBytes(null);
        setHostedUploadSpeedBps(null);
        hostedUploadSpeedRef.current = { bytes: null, at: null };
        setClientUploadBytes(null);
        setClientUploadTotalBytes(null);
        setSolutionFile(null);
      }
      uploadAbortControllerRef.current = null;
      cancelRequestedRef.current = false;
    }
  };

  const handleDeleteRequestSubmit = async (e) => {
    e?.preventDefault?.();
    if (!deleteRequest.contentId) return;

    const { contentId } = deleteRequest;
    const reason = (deleteRequest.reason || '').trim();
    if (reason.length < 20) {
      toast.error('Please provide a detailed reason for deletion (at least 20 characters).');
      return;
    }

    try {
      setDeleteRequest(prev => ({ ...prev, submitting: true }));
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `/api/content/${contentId}/request-delete`,
        { reason },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      toast.success(
        'Delete request submitted. Admin approval is required before the content is deleted.'
      );
      setPendingDeleteContentIds(prev =>
        prev.includes(contentId) ? prev : [...prev, contentId]
      );
      setDeleteRequest({ open: false, contentId: null, title: '', reason: '', submitting: false });
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
        setDeleteRequest({ open: false, contentId: null, title: '', reason: '', submitting: false });
        toast.error('A delete request for this item is already pending.');
      } else {
        setDeleteRequest(prev => ({ ...prev, submitting: false }));
        toast.error('Failed to submit delete request. Please try again.');
      }
    }
  };

  const makeReorderUpdates = (items) =>
    items.map((item, index) => ({ _id: item._id, order: index + 1 }));

  const handleDragEnd = async (result) => {
    const { source, destination, draggableId } = result;
    console.log('[Drag Start]', source, destination);

    if (!destination || source.droppableId !== destination.droppableId) {
      return;
    }

    const type = source.droppableId;
    const items = [...(groupedContent[type] || [])];
    const [moved] = items.splice(source.index, 1);
    items.splice(destination.index, 0, moved);

    const updates = makeReorderUpdates(items);
    console.log('[Reordered]', updates);

    setContent(prevContent =>
      prevContent.map(item => {
        const updated = updates.find(update => update._id === item._id);
        return updated ? { ...item, order: updated.order } : item;
      })
    );

    try {
      const token = localStorage.getItem('token');
      const response = await axios.patch(
        '/api/content/reorder',
        { updates },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      console.log('[Reorder Saved]', response.data);
      await fetchSectionAndContent();
    } catch (error) {
      console.error('Failed to reorder content', error);
      console.log('[Reorder Error]', error);
      await fetchSectionAndContent();
    }
  };

  const renderContentItem = (item, index) => {
    const typeIcons = {
      lecture: '🎥',
      assignment: '📝',
      project: '🚀'
    };

    const typeColors = {
      lecture: 'bg-blue-100 text-blue-800',
      assignment: 'bg-green-100 text-green-800',
      project: 'bg-purple-100 text-purple-800'
    };

    const youtubeVideoId = item?.video?.youtubeVideoId;
    const hasYouTubeVideo =
      !!youtubeVideoId &&
      (item?.video?.storageType === 'hosted' || item?.video?.storageType === 'youtube');
    const hasLocalStream =
      (item?.video?.storageType === 'local' && (!!item?.video?.path || !!item?.videoPath)) ||
      (!item?.video?.storageType && !!item?.videoPath);
    const streamUrl = hasLocalStream ? `/api/content/${item._id}/stream` : null;
    const canWatch = hasYouTubeVideo || !!streamUrl;

    return (
      <div
        className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition"
        onMouseEnter={() => {
          if (streamUrl) {
            console.log('[InstructorSectionContent] hover stream url', streamUrl);
          }
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${typeColors[item.type]}`}>
                {typeIcons[item.type]} {item.type.toUpperCase()}
              </span>
              <h4 className="text-lg font-semibold text-gray-900">{item.title}</h4>
            </div>
            {item.description && (
              <p className="mt-2 text-sm text-gray-600">{item.description}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3 text-sm text-gray-500">
              {item.videoFileName && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z" />
                  </svg>
                  Video: {item.videoFileName}
                </span>
              )}
              {item.fileName && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  File: {item.fileName}
                </span>
              )}
              {item.starterFileName && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  Starter: {item.starterFileName}
                </span>
              )}
              {item.dueDate && (
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  Due: {new Date(item.dueDate).toLocaleDateString()}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            {canWatch && (
              <button
                type="button"
                onClick={() => {
                  console.log('[InstructorSectionContent] open player', streamUrl);
                  if (hasYouTubeVideo) {
                    setYoutubeWatchModal({
                      open: true,
                      youtubeVideoId,
                      title: item.title || 'Watch video'
                    });
                    return;
                  }

                  if (streamUrl) {
                    setSelectedContent({ ...item });
                    setShowVideoPlayer(true);
                    return;
                  }

                  toast.error('Failed to start video playback. Please try again.');
                }}
                className="px-3 py-2 bg-blue-100 text-blue-700 text-sm rounded-md hover:bg-blue-200 border border-blue-200 transition"
              >
                ▶ Watch
              </button>
            )}
            {item.filePath && (
              <a
                href={`/uploads/files/${item.filePath}`}
                download
                className="px-3 py-2 bg-green-100 text-green-700 text-sm rounded-md hover:bg-green-200 border border-green-200 transition"
              >
                ⬇ Download
              </a>
            )}
            <button
              type="button"
              onClick={() => {
                if (!pendingDeleteContentIds.includes(item._id)) {
                  openDeleteRequest(item._id, item.title);
                }
              }}
              disabled={pendingDeleteContentIds.includes(item._id)}
              className="btn-request-delete"
            >
              {pendingDeleteContentIds.includes(item._id) ? 'Request Pending' : 'Request Delete'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading content...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => {
              if (uploadStage === 'uploading' || uploadStage === 'server' || uploadStage === 'processing') return;
              navigate(-1);
            }}
            disabled={uploadStage === 'uploading' || uploadStage === 'server' || uploadStage === 'processing'}
            className="mb-4 text-indigo-600 hover:text-indigo-800 flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Sections
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{section?.name}</h1>
              <p className="mt-2 text-gray-600">{section?.description || 'Manage content for this section'}</p>
              <div className="mt-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${section?.isFree ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                  {section?.isFree ? '✅ Free Section' : `💰 ${formatPrice(section?.priceCents || 0, section?.currency || 'SYR')}`}
                </span>
              </div>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => openUploadModal('lecture')}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 border border-blue-200 transition flex items-center"
              >
                🎥 Upload Lecture
              </button>
              <button
                onClick={() => openUploadModal('assignment')}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-md hover:bg-green-200 border border-green-200 transition flex items-center"
              >
                📝 Upload Assignment
              </button>
              <button
                onClick={() => openUploadModal('project')}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 border border-purple-200 transition flex items-center"
              >
                🚀 Upload Project
              </button>
              <button
                onClick={() => navigate(`/instructor/sections/${sectionId}/tests`)}
                className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 border border-indigo-200 transition flex items-center"
              >
                📝 Manage Active Tests
              </button>
            </div>
          </div>
        </div>

        {/* Content List */}
        <div className="space-y-4">
          {content.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-lg shadow">
              <p className="text-gray-500 text-lg">No content uploaded yet.</p>
              <p className="text-sm text-gray-400 mt-2">Click one of the upload buttons above to get started.</p>
            </div>
          ) : (
            <>
              {['lecture', 'assignment', 'project'].map(type => {
                const items = content.filter(c => c.type === type);
                if (items.length === 0) return null;

                const typeLabels = {
                  lecture: '📹 Lectures',
                  assignment: '📝 Assignments',
                  project: '🚀 Projects'
                };

                return (
                  <div key={type} className="bg-white rounded-lg shadow-md overflow-hidden">
                    <div className="px-6 py-4 bg-gray-100 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900">{typeLabels[type]}</h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId={type}>
                          {(provided) => (
                            <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-4">
                              {items.map((item, index) => (
                                <Draggable key={item._id} draggableId={item._id} index={index}>
                                  {(providedInner, snapshot) => (
                                    <div
                                      ref={providedInner.innerRef}
                                      {...providedInner.draggableProps}
                                      {...providedInner.dragHandleProps}
                                      className={`relative transition ${snapshot.isDragging ? 'shadow-xl opacity-80' : 'hover:shadow-md'
                                        }`}
                                    >
                                      {renderContentItem(item, index)}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    </div>
                  </div>
                );
              })}
            </>
          )}
        </div>

        {/* Video Player */}
        {showVideoPlayer && selectedContent && (
          <VideoPlayer
            videoUrl={`/api/content/${selectedContent._id}/stream`}
            onClose={() => {
              setShowVideoPlayer(false);
              setSelectedContent(null);
            }}
            title={selectedContent.title}
            autoPlay
          />
        )}

        {youtubeWatchModal.open && (
          <div
            className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
            onClick={() => setYoutubeWatchModal({ open: false, youtubeVideoId: '', title: '' })}
          >
            <div className="w-full max-w-5xl max-h-[90vh] bg-white rounded-lg overflow-hidden shadow-xl border border-gray-200 flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 shrink-0">
                <div className="text-sm font-semibold text-gray-900">
                  {youtubeWatchModal.title || 'Watch video'}
                </div>
                <button
                  type="button"
                  onClick={() => setYoutubeWatchModal({ open: false, youtubeVideoId: '', title: '' })}
                  className="p-2 rounded hover:bg-gray-100"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-4 overflow-y-auto flex-1 min-h-0">
                <CustomYouTubePlayer youtubeVideoId={youtubeWatchModal.youtubeVideoId} title={youtubeWatchModal.title} />
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 h-[90vh] max-h-[90vh] overflow-hidden flex flex-col">
              <form onSubmit={handleUploadContent} className="flex flex-col h-full min-h-0">
                <div className="px-6 pt-6 shrink-0">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      Upload {uploadType.charAt(0).toUpperCase() + uploadType.slice(1)}
                    </h2>
                    <div className="flex items-center gap-2">
                      {shouldShowCancelUpload && (
                        <button
                          type="button"
                          onClick={handleCancelUpload}
                          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                        >
                          Cancel Upload
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={closeUploadModal}
                        disabled={uploadStage === 'uploading' || uploadStage === 'server' || uploadStage === 'processing'}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                      >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Title *</label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleInputChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder={`e.g., ${uploadType === 'lecture' ? 'Introduction to Variables' : uploadType === 'assignment' ? 'Practice Exercise 1' : 'Final Project'}`}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleInputChange}
                        rows="3"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {(uploadType === 'lecture' || uploadType === 'project') && (
                      <div>
                        <div className="mb-3 space-y-2">
                          <p className="text-sm text-gray-700">
                            Videos must be at least {formatDuration(minVideoDurationSeconds)} long.
                          </p>
                          <p className="text-sm text-gray-700">
                            A brief intro animation (about 3–4 seconds) will be added to the beginning of the video automatically and cannot be removed.
                          </p>
                        </div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Video File * (MP4, WEBM, AVI, etc.) — Max {uploadLimits.maxVideoSizeMB}MB
                        </label>
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => setVideoFile(e.target.files[0])}
                          required
                          disabled={isBlockingUpload}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isBlockingUpload ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {videoFile && (
                          <p className="mt-2 text-sm text-gray-600">
                            Selected: {videoFile.name} ({(videoFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    )}

                    {(uploadType === 'assignment' || uploadType === 'project') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          {uploadType === 'project' ? 'Starter File *' : 'Assignment File *'} (.rar or .zip) — Max {uploadLimits.maxFileSizeMB}MB
                        </label>
                        <input
                          type="file"
                          accept=".rar,.zip"
                          onChange={(e) => setDocumentFile(e.target.files[0])}
                          required
                          disabled={isBlockingUpload}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isBlockingUpload ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {documentFile && (
                          <p className="mt-2 text-sm text-gray-600">
                            Selected: {documentFile.name} ({(documentFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    )}

                    {(uploadType === 'assignment' || uploadType === 'project') && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Solution File (optional) (.rar or .zip) — Max {uploadLimits.maxFileSizeMB}MB
                        </label>
                        <input
                          type="file"
                          accept=".rar,.zip"
                          onChange={(e) => setSolutionFile(e.target.files[0])}
                          disabled={isBlockingUpload}
                          className={`w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isBlockingUpload ? 'opacity-60 cursor-not-allowed' : ''}`}
                        />
                        {solutionFile && (
                          <p className="mt-2 text-sm text-gray-600">
                            Selected: {solutionFile.name} ({(solutionFile.size / (1024 * 1024)).toFixed(2)} MB)
                          </p>
                        )}
                      </div>
                    )}

                    {(uploadType === 'assignment' || uploadType === 'project') && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Max Score</label>
                          <input
                            type="number"
                            name="maxScore"
                            value={formData.maxScore}
                            onChange={handleInputChange}
                            min="0"
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Due Date</label>
                          <input
                            type="datetime-local"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Order</label>
                      <input
                        type="number"
                        name="order"
                        value={formData.order}
                        onChange={handleInputChange}
                        min="0"
                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <p className="mt-1 text-xs text-gray-500">Lower numbers appear first</p>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 px-6 pb-6">
                  {(uploadStage === 'uploading' || uploadStage === 'server' || uploadStage === 'processing' || uploadStage === 'error') && (
                    <div className="mt-4">
                      {uploadStage === 'uploading' ? (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 text-center">{uploadProgress <= 0 ? 'Preparing upload...' : `Uploading... ${uploadProgress}%`}</p>
                          {typeof clientUploadBytes === 'number' && typeof clientUploadTotalBytes === 'number' && clientUploadTotalBytes > 0 && (
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              {(clientUploadBytes / 1024 / 1024).toFixed(1)} / {(clientUploadTotalBytes / 1024 / 1024).toFixed(1)} MB
                            </p>
                          )}
                        </>
                      ) : uploadStage === 'server' ? (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600 mt-2 text-center">
                            {hostedUploadStatus === 'queued'
                              ? 'Preparing upload...'
                              : hostedUploadStatus === 'canceling'
                                ? 'Canceling upload...'
                                : hostedUploadStatus === 'failed'
                                  ? 'Upload failed'
                                  : hostedUploadStatus === 'processing' || hostedUploadStatus === 'completed'
                                    ? 'Finalizing...'
                                    : (uploadType === 'assignment'
                                      ? `Uploading assignment... ${uploadProgress}%`
                                      : uploadType === 'project'
                                        ? `Uploading project... ${uploadProgress}%`
                                        : `Uploading video... ${uploadProgress}%`)}
                          </p>
                          {typeof hostedUploadBytes === 'number' && typeof hostedUploadTotalBytes === 'number' && hostedUploadTotalBytes > 0 && (
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              {Math.min(100, Math.round((hostedUploadBytes * 100) / hostedUploadTotalBytes))}% • {(hostedUploadBytes / 1024 / 1024).toFixed(1)} / {(hostedUploadTotalBytes / 1024 / 1024).toFixed(1)} MB
                            </p>
                          )}
                          {typeof hostedUploadSpeedBps === 'number' && Number.isFinite(hostedUploadSpeedBps) && hostedUploadSpeedBps > 0 && typeof hostedUploadBytes === 'number' && typeof hostedUploadTotalBytes === 'number' && hostedUploadTotalBytes > 0 && (
                            <p className="text-xs text-gray-500 mt-1 text-center">
                              {(hostedUploadSpeedBps / 1024 / 1024).toFixed(2)} MB/s • {((hostedUploadTotalBytes - hostedUploadBytes) / 1024 / 1024).toFixed(1)} MB remaining
                            </p>
                          )}
                          <p className="text-xs text-gray-600 mt-1 text-center">Do not close this page until the upload completes.</p>
                          {hostedUploadStatus === 'failed' && hostedUploadError && (
                            <p className="text-xs text-red-600 mt-1 text-center">{hostedUploadError}</p>
                          )}
                        </>
                      ) : uploadStage === 'error' ? (
                        <>
                          <div className="w-full rounded-md border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm font-medium text-red-800">Upload failed</p>
                            <p className="text-xs text-red-700 mt-1">{hostedUploadError || 'Upload failed. Please try again.'}</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-indigo-600 h-2 w-full animate-pulse"></div>
                          </div>
                          <p className="text-sm text-gray-700 mt-3 text-center">Uploaded. Processing...</p>
                          <p className="text-xs text-gray-600 mt-1 text-center">Do not close this page until processing completes.</p>
                        </>
                      )}
                    </div>
                  )}

                  <div className="mt-6 flex justify-end space-x-3">
                    {shouldShowCancelUpload && (
                      <button
                        type="button"
                        onClick={handleCancelUpload}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition"
                      >
                        Cancel Upload
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={closeUploadModal}
                      disabled={uploadStage === 'uploading' || uploadStage === 'server' || uploadStage === 'processing'}
                      className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploadStage === 'uploading' || uploadStage === 'server' || uploadStage === 'processing'}
                      className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {uploadStage === 'uploading'
                        ? `Uploading... ${uploadProgress}%`
                        : uploadStage === 'server'
                          ? (uploadType === 'assignment'
                            ? 'Uploading assignment...'
                            : uploadType === 'project'
                              ? 'Uploading project...'
                              : 'Uploading video...')
                          : uploadStage === 'processing'
                            ? 'Processing...'
                            : 'Upload'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        )}

        {deleteRequest.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Request Delete</h2>
                  <button
                    onClick={() => setDeleteRequest({ open: false, contentId: null, title: '', reason: '', submitting: false })}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm text-gray-700 mb-2">
                  You are requesting admin approval to delete:
                </p>
                <p className="text-sm font-medium text-gray-900 mb-4">{deleteRequest.title}</p>
                <form onSubmit={handleDeleteRequestSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reason for deletion * (min 20 characters)
                    </label>
                    <textarea
                      rows="4"
                      value={deleteRequest.reason}
                      onChange={(e) => setDeleteRequest(prev => ({ ...prev, reason: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Explain why this content should be permanently deleted..."
                    />
                    <p className="mt-1 text-xs text-gray-500">{deleteRequest.reason.trim().length} / 20</p>
                  </div>
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      disabled={deleteRequest.submitting}
                      onClick={() => setDeleteRequest({ open: false, contentId: null, title: '', reason: '', submitting: false })}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={deleteRequest.submitting}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
                    >
                      {deleteRequest.submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SectionContent;
