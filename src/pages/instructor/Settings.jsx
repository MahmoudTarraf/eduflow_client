import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { AlertTriangle, FileText, DollarSign, User, Download, Plus, Trash2, Edit2, Shield, Video } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const InstructorSettings = () => {
  const { t, i18n } = useTranslation();
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile'); // profile, introVideo, receivers, agreement
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [changeLimits, setChangeLimits] = useState({
    emailChangeCount: 0,
    phoneChangeCount: 0
  });
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [sendingCode, setSendingCode] = useState(false);
  const [emailCooldownSeconds, setEmailCooldownSeconds] = useState(0);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);
  const [newPhone, setNewPhone] = useState('');
  const [updatingPhone, setUpdatingPhone] = useState(false);
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const isRTL = i18n.dir() === 'rtl';
  
  // Payment receivers state
  const [paymentReceivers, setPaymentReceivers] = useState([]);
  const [paymentProviders, setPaymentProviders] = useState([]);
  
  // Agreements state
  const [agreementData, setAgreementData] = useState(null);
  const [editingReceiver, setEditingReceiver] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [receiverFormData, setReceiverFormData] = useState({
    paymentMethod: '',
    receiverName: '',
    receiverEmail: '',
    receiverPhone: '',
    receiverLocation: '',
    accountDetails: '',
    isActive: true
  });

  const providerOptions = Array.isArray(paymentProviders)
    ? paymentProviders.filter((p) => p && p.key && p.name && p.isActive !== false)
    : [];
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    aboutMe: '',
    avatar: '',
    expertise: [],
    socialLinks: {
      linkedin: '',
      github: '',
      twitter: '',
      website: ''
    }
  });
  const [newExpertise, setNewExpertise] = useState('');

  // Intro video state
  const [videoInfo, setVideoInfo] = useState(null);
  const [videoLimits, setVideoLimits] = useState({ maxVideoSizeMB: 500, introVideoMaxReuploads: 3 });
  const [introVideoFile, setIntroVideoFile] = useState(null);
  const [introUploading, setIntroUploading] = useState(false);
  const [introUploadProgress, setIntroUploadProgress] = useState(0);
  const [introVideoError, setIntroVideoError] = useState('');
  const [storageConfig, setStorageConfig] = useState(null);
  const [introUploadSessionId, setIntroUploadSessionId] = useState(null);
  const introUploadSessionIdRef = useRef(null);
  const introUploadPollTimeoutRef = useRef(null);
  const introUploadPollInFlightRef = useRef(false);
  const introUploadPollBackoffMsRef = useRef(2000);
  const [introHostedUploadStatus, setIntroHostedUploadStatus] = useState(null);
  const [introHostedUploadError, setIntroHostedUploadError] = useState(null);
  const [introHostedUploadBytes, setIntroHostedUploadBytes] = useState(null);
  const [introHostedUploadTotalBytes, setIntroHostedUploadTotalBytes] = useState(null);

  useEffect(() => {
    fetchProfile();
    if (activeTab === 'receivers') {
      fetchReceivers();
    }
    if (activeTab === 'agreement' || activeTab === 'introVideo') {
      fetchAgreements();
    }
    if (activeTab === 'introVideo') {
      fetchIntroVideoData();
    }
  }, [activeTab]);

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

  const stopIntroUploadPolling = useCallback(() => {
    if (introUploadPollTimeoutRef.current) {
      clearTimeout(introUploadPollTimeoutRef.current);
      introUploadPollTimeoutRef.current = null;
    }
    introUploadPollInFlightRef.current = false;
    introUploadPollBackoffMsRef.current = 2000;
  }, []);

  const pollIntroUploadJobOnce = useCallback(async (jobId, token) => {
    if (!jobId) return;
    if (introUploadPollInFlightRef.current) return;
    introUploadPollInFlightRef.current = true;
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

      setIntroHostedUploadStatus(status);
      setIntroHostedUploadError(jobError);
      setIntroHostedUploadBytes(bytesUploaded);
      setIntroHostedUploadTotalBytes(totalBytes);
      if (typeof percent === 'number') setIntroUploadProgress(percent);

      if (status === 'completed' || status === 'failed' || status === 'canceled') {
        stopIntroUploadPolling();
        return;
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 404) {
        // Job is created server-side after the file reaches the backend.
        // Keep current UI state so the user can still see browser upload progress.
        return;
      }

      if (status === 429) {
        introUploadPollBackoffMsRef.current = Math.min(introUploadPollBackoffMsRef.current * 2, 30000);
      }
    } finally {
      introUploadPollInFlightRef.current = false;
    }
  }, [stopIntroUploadPolling]);

  const startIntroUploadPolling = useCallback((jobId, token) => {
    stopIntroUploadPolling();
    if (!jobId) return;

    introUploadPollBackoffMsRef.current = 2000;
    const tick = async () => {
      await pollIntroUploadJobOnce(jobId, token);
      if (introUploadPollTimeoutRef.current) clearTimeout(introUploadPollTimeoutRef.current);
      introUploadPollTimeoutRef.current = setTimeout(tick, introUploadPollBackoffMsRef.current);
    };
    tick();
  }, [pollIntroUploadJobOnce, stopIntroUploadPolling]);
  
  const fetchAgreements = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/instructor-agreements/my-agreement', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAgreementData(response.data.data);
    } catch (error) {
      console.error('Error fetching agreements:', error);
      toast.error('Failed to load agreements');
    }
  };

  const fetchIntroVideoData = async () => {
    try {
      // Fetch public limits
      const limitsRes = await axios.get('/api/admin/settings/public');
      if (limitsRes.data?.data) {
        setVideoLimits({
          maxVideoSizeMB: limitsRes.data.data.maxVideoSizeMB ?? 500,
          introVideoMaxReuploads: limitsRes.data.data.introVideoMaxReuploads ?? 3
        });
      }

      // Fetch current video info for logged-in instructor
      if (user?._id) {
        try {
          const token = localStorage.getItem('token');
          const infoRes = await axios.get(`/api/instructor/${user._id}/video-info`, {
            headers: token ? { Authorization: `Bearer ${token}` } : {}
          });
          if (infoRes.data?.success) {
            setVideoInfo(infoRes.data.data);
          }
        } catch (infoError) {
          // 404 just means no video yet
          if (infoError.response?.status !== 404) {
            console.error('Error fetching intro video info:', infoError);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching intro video settings:', error);
    }
  };

  const handleIntroVideoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/webm'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid video format. Please upload MP4, MOV, AVI, or WEBM');
      return;
    }

    const maxBytes = (videoLimits.maxVideoSizeMB || 500) * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(`Video size cannot exceed ${videoLimits.maxVideoSizeMB}MB`);
      return;
    }

    setIntroVideoError('');
    setIntroVideoFile(file);
  };

  const handleIntroVideoUpload = async () => {
    if (!introVideoFile) {
      toast.error('Please select an introduction video first');
      return;
    }

    try {
      setIntroUploading(true);
      setIntroUploadProgress(0);
      setIntroVideoError('');

      const token = localStorage.getItem('token');
      const shouldTrackHostedProgress = Boolean(storageConfig?.isYouTubeEnabled) && storageConfig?.videoProvider === 'youtube';

      const formData = new FormData();
      formData.append('video', introVideoFile);

      if (shouldTrackHostedProgress) {
        const id =
          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        setIntroUploadSessionId(id);
        introUploadSessionIdRef.current = id;
        setIntroHostedUploadStatus('uploading');
        setIntroHostedUploadError(null);
        setIntroHostedUploadBytes(null);
        setIntroHostedUploadTotalBytes(null);
        formData.append('uploadSessionId', id);
        startIntroUploadPolling(id, token);
      } else {
        setIntroUploadSessionId(null);
        introUploadSessionIdRef.current = null;
        setIntroHostedUploadStatus(null);
        setIntroHostedUploadError(null);
        setIntroHostedUploadBytes(null);
        setIntroHostedUploadTotalBytes(null);
      }

      const res = await axios.put('/api/instructor/reupload-intro-video', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${token}`
        },
        onUploadProgress: (evt) => {
          const total = evt.total;
          const progressFraction = typeof evt.progress === 'number' ? evt.progress : null;
          if (!total && progressFraction === null) return;

          const percentCompleted = total
            ? Math.round((evt.loaded * 100) / total)
            : Math.round(progressFraction * 100);

          // When hosted progress is enabled, switch to server-side job progress
          // after the browser finishes uploading the file to our backend.
          if (shouldTrackHostedProgress) {
            if (percentCompleted >= 100 || (total && evt.loaded >= total)) {
              setIntroUploadProgress(0);
              return;
            }
            setIntroUploadProgress(percentCompleted);
            return;
          }

          setIntroUploadProgress(percentCompleted);
        }
      });

      toast.success(res.data?.message || 'Intro video uploaded successfully');
      setIntroVideoFile(null);
      // Refresh agreement and video info so navbar / instructor tab see the new video
      fetchAgreements();
      fetchIntroVideoData();
    } catch (error) {
      console.error('Intro video upload error:', error);
      const apiMessage = error.response?.data?.message;
      const status = error.response?.status;
      const shouldKeepMessage =
        status === 400 ||
        status === 403;
      const message =
        shouldKeepMessage && typeof apiMessage === 'string' && apiMessage.trim().length > 0
          ? apiMessage
          : 'Failed to upload video, please contact admin';
      setIntroVideoError(message);
      toast.error(message);
    } finally {
      stopIntroUploadPolling();
      setIntroUploading(false);
      if (!(storageConfig?.isYouTubeEnabled && storageConfig?.videoProvider === 'youtube')) {
        setIntroUploadProgress(0);
      }
      setIntroUploadSessionId(null);
      introUploadSessionIdRef.current = null;
    }
  };

  const hasActiveRevenueAgreement = !!(agreementData?.recentAgreements || []).some(a => a.status === 'approved' && a.isActive);
  const introVideoReuploadAttempts = agreementData?.signupAgreement?.reuploadAttempts || 0;

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const profile = res.data.user;
      setFormData({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
        bio: profile.bio || '',
        aboutMe: profile.aboutMe || '',
        avatar: profile.avatar || '',
        expertise: profile.expertise || [],
        socialLinks: profile.socialLinks || {
          linkedin: '',
          github: '',
          twitter: '',
          website: ''
        }
      });
      setAvatarPreview(profile.avatar || null);
      setChangeLimits({
        emailChangeCount: profile.emailChangeCount || 0,
        phoneChangeCount: profile.phoneChangeCount || 0
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [name]: value
      }
    }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSendEmailVerificationCode = async () => {
    if (!newEmail) {
      toast.error(t('enterNewEmail') || 'Please enter a new email');
      return;
    }

    const trimmedEmail = newEmail.trim();
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(trimmedEmail)) {
      toast.error(t('invalidEmailFormat') || 'Please enter a valid email address.');
      return;
    }

    try {
      setSendingCode(true);
      const token = localStorage.getItem('token');
      const res = await axios.post('/api/users/change-email/request', { newEmail: trimmedEmail }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEmailCodeSent(true);
      const serverCooldown = res?.data?.cooldownRemainingSeconds;
      const initialSeconds =
        typeof serverCooldown === 'number' && serverCooldown > 0 ? serverCooldown : 60;
      setEmailCooldownSeconds(initialSeconds);
      toast.success(t('verificationCodeSent') || 'Verification code sent to your new email');
    } catch (error) {
      const status = error?.response?.status;
      const data = error?.response?.data;
      if (status === 429 && typeof data?.cooldownRemainingSeconds === 'number') {
        const remaining = data.cooldownRemainingSeconds;
        setEmailCooldownSeconds(remaining);
        toast.error(
          t('youCanRequestNewCodeIn', { seconds: remaining }) ||
          data?.message ||
          'Please wait before requesting a new verification code.'
        );
      } else {
        const message = data?.message;
        if (message === 'You have already changed your email once') {
          toast.error(t('youHaveAlreadyChangedEmailOnce') || message);
        } else {
          toast.error(
            t('failedToSendVerificationCode') ||
            message ||
            'Failed to send verification code'
          );
        }
      }
    } finally {
      setSendingCode(false);
    }
  };

  useEffect(() => {
    if (emailCooldownSeconds <= 0) return;
    const timer = setInterval(() => {
      setEmailCooldownSeconds((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [emailCooldownSeconds]);

  const handleVerifyEmailChange = async () => {
    const trimmedEmail = (newEmail || '').trim();
    const trimmedCode = (verificationCode || '').trim();

    if (!trimmedEmail || !trimmedCode) {
      toast.error(t('enterVerificationCode') || 'Please enter your new email and verification code');
      return;
    }

    try {
      setVerifyingEmail(true);
      const token = localStorage.getItem('token');
      const res = await axios.post(
        '/api/users/change-email/verify',
        {
          newEmail: trimmedEmail,
          verificationCode: trimmedCode
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      const updatedUser = res?.data?.user;
      if (updatedUser) {
        if (setUser) {
          setUser(updatedUser);
        }
        setFormData((prev) => ({
          ...prev,
          email: updatedUser.email || prev.email
        }));
        setChangeLimits((prev) => ({
          ...prev,
          emailChangeCount:
            typeof updatedUser.emailChangeCount === 'number'
              ? updatedUser.emailChangeCount
              : (prev.emailChangeCount || 0) + 1
        }));
      }

      toast.success(t('emailChangedSuccessfully') || 'Email changed successfully');
      setShowEmailModal(false);
      setNewEmail('');
      setVerificationCode('');
      setEmailCodeSent(false);
    } catch (error) {
      const message = error?.response?.data?.message;
      if (message === 'You have already changed your email once') {
        toast.error(t('youHaveAlreadyChangedEmailOnce') || message);
      } else if (message === 'Invalid verification code') {
        toast.error(t('invalidVerificationCode') || message);
      } else if (message === 'Verification code has expired. Please request a new code.') {
        toast.error(t('verificationCodeExpired') || message);
      } else {
        toast.error(t('failedToVerifyEmail') || message || 'Failed to verify email change');
      }
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleUpdatePhoneNumber = async () => {
    const trimmedPhone = (newPhone || '').trim();
    if (!trimmedPhone) {
      toast.error(t('phone') || 'Phone number is required');
      return;
    }

    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(trimmedPhone)) {
      toast.error(t('phoneMustStartWith09') || 'Phone number must be 10 digits starting with 09');
      return;
    }

    try {
      setUpdatingPhone(true);
      const token = localStorage.getItem('token');
      const formDataToSend = new FormData();
      formDataToSend.append('phone', trimmedPhone);

      const res = await axios.put('/api/users/profile', formDataToSend, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      const updatedUser = res?.data?.user;
      if (updatedUser) {
        if (setUser) {
          setUser(updatedUser);
        }
        setFormData((prev) => ({
          ...prev,
          phone: updatedUser.phone || prev.phone
        }));
        setChangeLimits((prev) => ({
          ...prev,
          phoneChangeCount:
            typeof updatedUser.phoneChangeCount === 'number'
              ? updatedUser.phoneChangeCount
              : (prev.phoneChangeCount || 0) + 1
        }));
      }

      toast.success(t('phoneChangedSuccessfully') || 'Phone number updated successfully');
      setShowPhoneModal(false);
      setNewPhone('');
    } catch (error) {
      const message = error?.response?.data?.message;
      if (message === 'Phone number already exists') {
        toast.error(t('phoneNumberAlreadyExists') || message);
      } else if (message === 'You have already changed your phone number') {
        toast.error(t('youHaveAlreadyChangedPhoneNumber') || message);
      } else if (message === 'Phone number must be 10 digits starting with 09') {
        toast.error(t('phoneMustStartWith09') || message);
      } else {
        toast.error(t('failedToChangePhone') || message || 'Failed to change phone number');
      }
    } finally {
      setUpdatingPhone(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (['linkedin', 'github', 'twitter', 'website'].includes(name)) {
      handleSocialChange(e);
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleAboutMeChange = (value) => {
    setFormData(prev => ({ ...prev, aboutMe: value }));
  };

  const handleAddExpertise = () => {
    if (newExpertise.trim() && !formData.expertise.includes(newExpertise.trim())) {
      setFormData(prev => ({
        ...prev,
        expertise: [...prev.expertise, newExpertise.trim()]
      }));
      setNewExpertise('');
    }
  };

  const handleRemoveExpertise = (index) => {
    setFormData(prev => ({
      ...prev,
      expertise: prev.expertise.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const links = formData.socialLinks || {};
    const entries = [
      ['linkedin', 'LinkedIn'],
      ['github', 'GitHub'],
      ['twitter', 'Twitter'],
      ['website', 'Website']
    ];
    for (const [key, label] of entries) {
      const raw = links[key];
      if (!raw) {
        continue;
      }
      const value = raw.trim();
      if (!value) {
        continue;
      }
      let parsed;
      try {
        parsed = new URL(value);
      } catch (err) {
        toast.error(`${label} URL is invalid.`);
        return;
      }
      if (parsed.protocol !== 'https:') {
        toast.error(`${label} URL must start with https://`);
        return;
      }
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');
      
      const formDataToSend = new FormData();
      formDataToSend.append('name', formData.name);
      formDataToSend.append('email', formData.email);
      formDataToSend.append('phone', formData.phone);
      formDataToSend.append('bio', formData.bio);
      formDataToSend.append('aboutMe', formData.aboutMe);
      formDataToSend.append('expertise', JSON.stringify(formData.expertise));
      formDataToSend.append('socialLinks', JSON.stringify(formData.socialLinks));
      
      if (avatarFile) {
        formDataToSend.append('avatar', avatarFile);
      }
      
      const res = await axios.put('/api/users/profile', formDataToSend, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      // Update user in auth context
      if (setUser && res.data.user) {
        setUser(res.data.user);
      }
      
      toast.success('Profile updated successfully');
      setAvatarFile(null);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const fetchReceivers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('/api/instructor/payment-receivers', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentReceivers(res.data.data || []);

      try {
        const publicSettings = await axios.get('/api/admin/settings/public');
        const providers = Array.isArray(publicSettings?.data?.data?.paymentProviders)
          ? publicSettings.data.data.paymentProviders
          : [];
        setPaymentProviders(providers);
      } catch (_) {
        setPaymentProviders([]);
      }
    } catch (error) {
      console.error('Error fetching receivers:', error);
    }
  };

  const handleReceiverInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setReceiverFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleAddReceiver = () => {
    setShowAddForm(true);
    setEditingReceiver(null);
    setReceiverFormData({
      paymentMethod: '',
      receiverName: '',
      receiverEmail: '',
      receiverPhone: '',
      receiverLocation: '',
      accountDetails: '',
      isActive: true
    });
  };

  const handleEditReceiver = (receiver) => {
    setEditingReceiver(receiver);
    setShowAddForm(true);
    setReceiverFormData({
      paymentMethod: receiver.providerKey || receiver.paymentMethod,
      receiverName: receiver.receiverName,
      receiverEmail: receiver.receiverEmail || '',
      receiverPhone: receiver.receiverPhone,
      receiverLocation: receiver.receiverLocation || '',
      accountDetails: receiver.accountDetails || '',
      isActive: receiver.isActive !== false
    });
  };

  const handleDeleteReceiver = async (receiverId) => {
    if (!window.confirm('Are you sure you want to delete this payment receiver?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const updatedReceivers = paymentReceivers.filter(r => r._id !== receiverId);
      
      await axios.put('/api/instructor/payment-receivers',
        { paymentReceivers: updatedReceivers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPaymentReceivers(updatedReceivers);
      toast.success('Payment receiver deleted');
    } catch (error) {
      toast.error('Failed to delete receiver');
    }
  };

  const handleReceiverSubmit = async (e) => {
    e.preventDefault();
    
    if (!receiverFormData.paymentMethod || !receiverFormData.receiverName || !receiverFormData.receiverPhone) {
      toast.error('Please fill in all required fields');
      return;
    }
    
    // Validate phone number format (must start with 09 and be exactly 10 digits)
    const phoneRegex = /^09\d{8}$/;
    if (!phoneRegex.test(receiverFormData.receiverPhone)) {
      toast.error('Phone number must start with 09 and be exactly 10 digits (e.g., 0912345678)');
      return;
    }
    
    try {
      setSaving(true);
      const token = localStorage.getItem('token');

      const payload = {
        providerKey: receiverFormData.paymentMethod,
        paymentMethod: receiverFormData.paymentMethod,
        receiverName: receiverFormData.receiverName,
        receiverEmail: receiverFormData.receiverEmail || '',
        receiverPhone: receiverFormData.receiverPhone,
        receiverLocation: receiverFormData.receiverLocation || '',
        accountDetails: receiverFormData.accountDetails || '',
        isActive: receiverFormData.isActive
      };
      
      let updatedReceivers;
      if (editingReceiver) {
        updatedReceivers = paymentReceivers.map(r => 
          r._id === editingReceiver._id ? { ...payload, _id: r._id } : r
        );
      } else {
        updatedReceivers = [...paymentReceivers, { ...payload, _id: Date.now().toString() }];
      }
      
      await axios.put('/api/instructor/payment-receivers',
        { paymentReceivers: updatedReceivers },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setPaymentReceivers(updatedReceivers);
      setShowAddForm(false);
      setEditingReceiver(null);
      toast.success(editingReceiver ? 'Receiver updated' : 'Receiver added');
    } catch (error) {
      toast.error('Failed to save receiver');
    } finally {
      setSaving(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      [{ 'color': [] }, { 'background': [] }],
      ['link'],
      ['clean']
    ]
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Instructor Settings
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Manage your profile and preferences
          </p>
        </div>

        {/* Security Settings callout */}
        <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 rounded">
              <Shield className="w-5 h-5 text-indigo-700 dark:text-indigo-300" />
            </div>
            <div>
              <div className="font-semibold text-indigo-900 dark:text-indigo-200">Security Settings</div>
              <div className="text-sm text-indigo-800/80 dark:text-indigo-200/80">Manage Two-Factor Authentication (2FA) and trusted devices</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Link to="/security" className="px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Manage 2FA</Link>
            <Link to="/security/devices" className="px-3 py-2 border border-indigo-300 dark:border-indigo-700 text-indigo-800 dark:text-indigo-200 rounded-md hover:bg-indigo-100 dark:hover:bg-indigo-900/30">Trusted Devices</Link>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="settings-tabs mb-6">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex space-x-8">
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                className={`${
                  activeTab === 'profile'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                } flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <User className="w-5 h-5 mr-2" />
                Profile
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('receivers')}
                className={`${
                  activeTab === 'receivers'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                } flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Payment Receivers
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('introVideo')}
                className={`${
                  activeTab === 'introVideo'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                } flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <Video className="w-5 h-5 mr-2" />
                Introduction Video
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('agreement')}
                className={`${
                  activeTab === 'agreement'
                    ? 'border-indigo-500 text-indigo-600 dark:text-indigo-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'
                } flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors`}
              >
                <FileText className="w-5 h-5 mr-2" />
                Agreement
              </button>
            </nav>
          </div>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <>
          <form onSubmit={handleSubmit} className="space-y-6 profile-settings">
          {/* Basic Information */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              {t('profileInformation') || 'Basic Information'}
            </h2>
            
            {/* Avatar Upload */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Profile Picture
              </label>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  {avatarPreview ? (
                    <img
                      src={avatarPreview}
                      alt="Avatar preview"
                      className="w-24 h-24 rounded-full object-cover border-2 border-gray-300 dark:border-gray-600"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                      {formData.name?.charAt(0)?.toUpperCase() || 'I'}
                    </div>
                  )}
                </div>
                <div>
                  <input
                    type="file"
                    id="avatar-instructor"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="avatar-instructor"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
                  >
                    Choose Image
                  </label>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    JPG, PNG, GIF or WEBP. Max size: 5MB
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('name')}
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  required
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t('nameCanOnlyBeChanged') || 'Name can only be changed in Profile section'}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('email')}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                  required
                />
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {t('emailChangeableOnce') || 'Email (changeable once)'}
                  </span>
                  <span>
                    {t('emailChangesRemaining') || 'Email changes remaining'}: {Math.max(0, 1 - (changeLimits.emailChangeCount || 0))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailModal(true)}
                  disabled={changeLimits.emailChangeCount >= 1}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-indigo-500 text-indigo-600 dark:text-indigo-300 rounded-md text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('changeEmail') || 'Change Email'}
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('phone')}
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <div className="mt-1 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>
                    {t('phoneChangeableOnce') || 'Phone number (changeable once)'}
                  </span>
                  <span>
                    {t('phoneChangesRemaining') || 'Phone changes remaining'}: {Math.max(0, 1 - (changeLimits.phoneChangeCount || 0))}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(true)}
                  disabled={changeLimits.phoneChangeCount >= 1}
                  className="mt-2 inline-flex items-center px-3 py-1.5 border border-indigo-500 text-indigo-600 dark:text-indigo-300 rounded-md text-xs hover:bg-indigo-50 dark:hover:bg-indigo-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {t('changePhoneNumber') || 'Change Phone Number'}
                </button>
              </div>
            </div>

            <div className="mt-2 rounded-md bg-yellow-50 dark:bg-yellow-900/30 px-3 py-2 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 text-yellow-600 dark:text-yellow-400 mt-0.5" />
              <p className="text-xs text-yellow-800 dark:text-yellow-200">
                {t('instructorPublicInfoWarning') || 'Warning: Your email, username, and intro video are publicly visible to students. Please make sure the information you enter is accurate and appropriate.'}
              </p>
            </div>

            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Short Bio (max 2000 characters)
              </label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={3}
                maxLength={2000}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="A brief introduction about yourself..."
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {formData.bio.length}/2000 characters
              </p>
            </div>
          </div>

          {/* About Me (WYSIWYG) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              About Me
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Tell students about yourself, your experience, and teaching philosophy
            </p>
            
            <div className="bg-white dark:bg-gray-700 rounded-md quill-editor-dark">
              <ReactQuill
                theme="snow"
                value={formData.aboutMe}
                onChange={handleAboutMeChange}
                modules={quillModules}
                className="dark:text-white"
                style={{ minHeight: '200px' }}
              />
              <style>{`
                .quill-editor-dark .ql-toolbar {
                  background: white;
                  border-color: #d1d5db;
                }
                .dark .quill-editor-dark .ql-toolbar {
                  background: #374151;
                  border-color: #4b5563;
                }
                .dark .quill-editor-dark .ql-stroke {
                  stroke: #e5e7eb;
                }
                .dark .quill-editor-dark .ql-fill {
                  fill: #e5e7eb;
                }
                .dark .quill-editor-dark .ql-picker-label {
                  color: #e5e7eb;
                }
                .dark .quill-editor-dark .ql-picker-options {
                  background: #374151;
                  border-color: #4b5563;
                }
                .dark .quill-editor-dark .ql-picker-item {
                  color: #e5e7eb;
                }
                .dark .quill-editor-dark .ql-editor {
                  background: #1f2937;
                  color: #e5e7eb;
                }
              `}</style>
            </div>
          </div>

          {/* Expertise Tags */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Areas of Expertise
            </h2>
            
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newExpertise}
                onChange={(e) => setNewExpertise(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddExpertise())}
                placeholder="Add expertise (e.g., Web Development)"
                className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddExpertise}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition"
              >
                Add
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {formData.expertise.map((item, index) => (
                <span
                  key={index}
                  className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300"
                >
                  {item}
                  <button
                    type="button"
                    onClick={() => handleRemoveExpertise(index)}
                    className="ml-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-200"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Social Links */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Social Links
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  LinkedIn
                </label>
                <input
                  type="url"
                  name="linkedin"
                  value={formData.socialLinks.linkedin}
                  onChange={handleChange}
                  placeholder="https://linkedin.com/in/yourprofile"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  pattern="https://.*"
                  title="Please enter a valid HTTPS URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  GitHub
                </label>
                <input
                  type="url"
                  name="github"
                  value={formData.socialLinks.github}
                  onChange={handleChange}
                  placeholder="https://github.com/yourprofile"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  pattern="https://.*"
                  title="Please enter a valid HTTPS URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Twitter
                </label>
                <input
                  type="url"
                  name="twitter"
                  value={formData.socialLinks.twitter}
                  onChange={handleChange}
                  placeholder="https://twitter.com/yourprofile"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  pattern="https://.*"
                  title="Please enter a valid HTTPS URL"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Website
                </label>
                <input
                  type="url"
                  name="website"
                  value={formData.socialLinks.website}
                  onChange={handleChange}
                  placeholder="https://yourwebsite.com"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  pattern="https://.*"
                  title="Please enter a valid HTTPS URL"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center"
            >
              {saving && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              Save Settings
            </button>
          </div>
        </form>

        {showEmailModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 ${
                isRTL ? 'text-right' : ''
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('changeEmail') || 'Change Email'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowEmailModal(false);
                    setNewEmail('');
                    setVerificationCode('');
                    setEmailCodeSent(false);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('newEmail') || 'New Email'}
                  </label>
                  <input
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder={t('enterNewEmail') || 'Enter your new email'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div className="flex flex-col space-y-1">
                  <div className="flex items-center justify-between space-x-3">
                    <button
                      type="button"
                      onClick={handleSendEmailVerificationCode}
                      disabled={
                        sendingCode ||
                        changeLimits.emailChangeCount >= 1 ||
                        emailCooldownSeconds > 0
                      }
                      className="flex-1 px-3 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                    >
                      {sendingCode
                        ? (t('sendingCode') || 'Sending code...')
                        : (t('sendVerificationCode') || 'Send Verification Code')}
                    </button>
                  </div>
                  {emailCooldownSeconds > 0 && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {t('youCanRequestNewCodeIn', { seconds: emailCooldownSeconds }) ||
                        `You can request a new code in ${emailCooldownSeconds} seconds.`}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('verificationCode') || 'Verification Code'}
                  </label>
                  <input
                    type="text"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder={t('enterVerificationCode') || 'Enter the 6-digit code'}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  {emailCodeSent && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t('verificationCodeSentHint') || 'A verification code was sent to your new email and is valid for 10 minutes.'}
                    </p>
                  )}
                </div>

                <div className="flex justify-end space-x-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailModal(false);
                      setNewEmail('');
                      setVerificationCode('');
                      setEmailCodeSent(false);
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleVerifyEmailChange}
                    disabled={verifyingEmail}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {verifyingEmail
                      ? (t('verifying') || 'Verifying...')
                      : (t('verifyEmail') || 'Verify Email')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showPhoneModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div
              className={`bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6 ${
                isRTL ? 'text-right' : ''
              }`}
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <div className={`flex items-center justify-between mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {t('changePhoneNumber') || 'Change Phone Number'}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setShowPhoneModal(false);
                    setNewPhone('');
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('phone')}
                  </label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-md bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-sm">
                      +963
                    </span>
                    <input
                      type="tel"
                      value={newPhone}
                      onChange={(e) => {
                        const digitsOnly = e.target.value.replace(/\D/g, '');
                        const limited = digitsOnly.slice(0, 10);
                        setNewPhone(limited);
                      }}
                      placeholder={t('enterNewPhone') || 'Enter your new phone number (09xxxxxxxx)'}
                      className="flex-1 px-3 py-2 border border-l-0 border-gray-300 dark:border-gray-600 rounded-r-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {t('phoneMustStartWith09') || 'Phone number must be 10 digits starting with 09'}
                  </p>
                </div>

                <div className="flex justify-end space-x-3 mt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhoneModal(false);
                      setNewPhone('');
                    }}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleUpdatePhoneNumber}
                    disabled={updatingPhone}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                  >
                    {updatingPhone
                      ? (t('updating') || 'Updating...')
                      : (t('confirmPhoneChange') || 'Confirm Phone Change')}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Danger Zone (inside profile tab) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mt-6 border-2 border-red-200 dark:border-red-900">
          <div className="flex items-start space-x-3 mb-4">
            <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
            <div>
              <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
                Danger Zone
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Irreversible and destructive actions
              </p>
            </div>
          </div>

          <div className="border-t border-red-200 dark:border-red-900 pt-4">
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
                Delete Account
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <button
                onClick={() => setShowDeleteModal(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition flex items-center space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Delete My Account</span>
              </button>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Delete Account
                </h2>
              </div>

              <div className="mb-6">
                <p className="text-gray-700 dark:text-gray-300 mb-4">
                  This action is permanent and cannot be undone. All your data including:
                </p>
                <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
                  <li>Profile information</li>
                  <li>Your courses</li>
                  <li>Student enrollments</li>
                  <li>Course content</li>
                  <li>Messages and notifications</li>
                </ul>
                <p className="text-gray-700 dark:text-gray-300 font-semibold">
                  will be permanently deleted from our servers.
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Type <span className="font-bold text-red-600">"DELETE MY ACCOUNT"</span> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE MY ACCOUNT"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteConfirmText('');
                  }}
                  disabled={deleting}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    if (deleteConfirmText !== 'DELETE MY ACCOUNT') {
                      toast.error('Please type "DELETE MY ACCOUNT" to confirm');
                      return;
                    }

                    try {
                      setDeleting(true);
                      const token = localStorage.getItem('token');
                      await axios.delete('/api/users/account', {
                        headers: { Authorization: `Bearer ${token}` }
                      });

                      toast.success('Account deleted successfully');
                      // AuthContext.logout will redirect to /login
                      logout();
                    } catch (error) {
                      console.error('Error deleting account:', error);
                      toast.error(error.response?.data?.message || 'Failed to delete account');
                    } finally {
                      setDeleting(false);
                    }
                  }}
                  disabled={deleteConfirmText !== 'DELETE MY ACCOUNT' || deleting}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {deleting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 74 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4" />
                      <span>Delete Account</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
        </>
        )}

        {/* Introduction Video Tab */}
        {activeTab === 'introVideo' && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Introduction Video
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Upload or replace your instructor introduction video. This video appears on your public instructor profile.
                  </p>
                </div>
              </div>

              {/* Limits summary */}
              <div className="mb-4 text-xs text-gray-600 dark:text-gray-400">
                <p>Max video size: <span className="font-semibold">{videoLimits.maxVideoSizeMB} MB</span></p>
                {videoLimits.introVideoMaxReuploads >= 0 && (
                  <>
                    <p>
                      Max reupload attempts:{' '}
                      <span className="font-semibold">{videoLimits.introVideoMaxReuploads}</span>
                    </p>
                    <p>
                      Used attempts:{' '}
                      <span className="font-semibold">{introVideoReuploadAttempts}</span>
                      {videoLimits.introVideoMaxReuploads > 0 && (
                        <span>
                          {' '}(
                          {Math.max(
                            videoLimits.introVideoMaxReuploads - introVideoReuploadAttempts,
                            0
                          )}{' '}
                          remaining)
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>

              {/* Upload widget */}
              <div className="space-y-3">
                {!introVideoFile ? (
                  <label className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Video className="w-10 h-10 mb-3 text-gray-400" />
                      <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">Click to select</span> or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        MP4, MOV, AVI, or WEBM (Max {videoLimits.maxVideoSizeMB}MB)
                      </p>
                    </div>
                    <input
                      type="file"
                      className="hidden"
                      accept="video/mp4,video/quicktime,video/x-msvideo,video/webm"
                      onChange={handleIntroVideoChange}
                    />
                  </label>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 rounded-md bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
                      <div className="flex items-center space-x-3">
                        <Video className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{introVideoFile.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">{(introVideoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIntroVideoFile(null);
                        }}
                        className="text-red-600 hover:text-red-700 text-xs font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                )}

                {introVideoError && (
                  <p className="text-xs text-red-600 dark:text-red-400">{introVideoError}</p>
                )}

                {introUploading && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400">
                      <span>
                        {introHostedUploadStatus === 'processing'
                          ? 'Finalizing...'
                          : introHostedUploadStatus === 'queued'
                            ? 'Preparing upload...'
                            : introHostedUploadStatus === 'failed'
                              ? 'Upload failed'
                              : 'Uploading...'}
                      </span>
                      <span>{introUploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div
                        className="bg-indigo-600 h-2 rounded-full transition-all"
                        style={{ width: `${introUploadProgress}%` }}
                      />
                    </div>
                    {typeof introHostedUploadBytes === 'number' && typeof introHostedUploadTotalBytes === 'number' && introHostedUploadTotalBytes > 0 && (
                      <div className="text-[11px] text-center text-gray-500 dark:text-gray-400">
                        {Math.min(100, Math.round((introHostedUploadBytes * 100) / introHostedUploadTotalBytes))}% • {(introHostedUploadBytes / 1024 / 1024).toFixed(1)} / {(introHostedUploadTotalBytes / 1024 / 1024).toFixed(1)} MB
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleIntroVideoUpload}
                    disabled={introUploading || !introVideoFile}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                  >
                    {introUploading ? (
                      <>
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        <span>Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Video className="w-4 h-4" />
                        <span>Upload Intro Video</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Receivers Tab */}
        {activeTab === 'receivers' && (
          <div className="space-y-6 payment-receivers">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Payment Receivers
                </h2>
                <button
                  onClick={handleAddReceiver}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                >
                  <Plus className="w-4 h-4" />
                  Add Receiver
                </button>
              </div>

              {paymentReceivers.length === 0 ? (
                <div className="text-center py-12">
                  <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No payment receivers configured</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentReceivers.map((receiver) => (
                    <div
                      key={receiver._id}
                      className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold text-gray-900 dark:text-white">
                              {providerOptions.find(p => p.key === (receiver.providerKey || receiver.paymentMethod))?.name || (receiver.providerKey || receiver.paymentMethod)}
                            </h3>
                            {receiver.isActive !== false && (
                              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 rounded-full">
                                Active
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Name:</strong> {receiver.receiverName}
                          </p>
                          {receiver.receiverEmail && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Email:</strong> {receiver.receiverEmail}
                            </p>
                          )}
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            <strong>Phone:</strong> {receiver.receiverPhone}
                          </p>
                          {receiver.receiverLocation && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Location:</strong> {receiver.receiverLocation}
                            </p>
                          )}
                          {receiver.accountDetails && (
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <strong>Details:</strong> {receiver.accountDetails}
                            </p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditReceiver(receiver)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteReceiver(receiver._id)}
                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add/Edit Form */}
              {showAddForm && (
                <form onSubmit={handleReceiverSubmit} className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {editingReceiver ? 'Edit' : 'Add'} Payment Receiver
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Payment Method *
                      </label>
                      <select
                        name="paymentMethod"
                        value={receiverFormData.paymentMethod}
                        onChange={handleReceiverInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">Select method...</option>
                        {providerOptions.length > 0 ? (
                          providerOptions.map((p) => (
                            <option key={p.key} value={p.key}>{p.name}</option>
                          ))
                        ) : (
                          <option value="other">Other</option>
                        )}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Receiver Name *
                      </label>
                      <input
                        type="text"
                        name="receiverName"
                        value={receiverFormData.receiverName}
                        onChange={handleReceiverInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Email
                      </label>
                      <input
                        type="email"
                        name="receiverEmail"
                        value={receiverFormData.receiverEmail}
                        onChange={handleReceiverInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="text"
                        name="receiverPhone"
                        value={receiverFormData.receiverPhone}
                        onChange={handleReceiverInputChange}
                        placeholder="0912345678"
                        pattern="09\d{8}"
                        maxLength="10"
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        Must start with 09 and be exactly 10 digits
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Location
                      </label>
                      <input
                        type="text"
                        name="receiverLocation"
                        value={receiverFormData.receiverLocation}
                        onChange={handleReceiverInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Account Details
                      </label>
                      <textarea
                        name="accountDetails"
                        value={receiverFormData.accountDetails}
                        onChange={handleReceiverInputChange}
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      />
                    </div>
                    <div className="md:col-span-2 flex items-center">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={receiverFormData.isActive}
                        onChange={handleReceiverInputChange}
                        className="mr-2"
                      />
                      <label className="text-sm text-gray-700 dark:text-gray-300">
                        Active
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 mt-4">
                    <button
                      type="button"
                      onClick={() => setShowAddForm(false)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 save-settings-btn"
                    >
                      {saving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* Agreement Tab */}
        {activeTab === 'agreement' && (
          <div className="space-y-6">
            {/* Initial Signup Agreement */}
            {agreementData?.signupAgreement && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                  Initial Signup Agreement
                </h2>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Your original instructor application agreement
                </p>

                <div className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          Signup Agreement
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                          agreementData.signupAgreement.status === 'approved'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : agreementData.signupAgreement.status === 'pending'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {agreementData.signupAgreement.status}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${hasActiveRevenueAgreement ? 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400' : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'}`}>
                          {hasActiveRevenueAgreement ? 'INACTIVE' : 'ACTIVE'}
                        </span>
                      </div>

                      <div className="mb-3">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Agreement Date</p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {new Date(agreementData.signupAgreement.agreedAt).toLocaleDateString()}
                        </p>
                      </div>
                      
                      {agreementData.signupAgreement.introductionVideo && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            ✓ Introduction video submitted
                          </p>
                        </div>
                      )}
                      
                      {agreementData.signupAgreement.agreementPdfUrl && (
                        <button
                          onClick={async () => {
                            try {
                              const token = localStorage.getItem('token');
                              const response = await fetch(agreementData.signupAgreement.agreementPdfUrl, {
                                headers: {
                                  'Authorization': `Bearer ${token}`
                                }
                              });
                              
                              if (!response.ok) {
                                throw new Error('File not available on server');
                              }
                              
                              const blob = await response.blob();
                              const url = window.URL.createObjectURL(blob);
                              const link = document.createElement('a');
                              link.href = url;
                              const filename = agreementData.signupAgreement.agreementPdfUrl.split('/').pop() || 'agreement.pdf';
                              link.download = filename;
                              document.body.appendChild(link);
                              link.click();
                              document.body.removeChild(link);
                              window.URL.revokeObjectURL(url);
                              toast.success('Agreement downloaded successfully');
                            } catch (error) {
                              console.error('Download error:', error);
                              toast.error(error.message || 'Failed to download agreement');
                            }
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          Download Agreement PDF
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Revenue Split Agreements */}
            {agreementData?.recentAgreements && agreementData.recentAgreements.length > 0 ? (
              <>
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                    Revenue Split Agreements
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    View and download your current revenue sharing agreements
                  </p>

                  <div className="space-y-4">
                    {agreementData.recentAgreements.map((agreement) => (
                      <div
                        key={agreement._id}
                        className={`p-4 rounded-lg border ${
                          agreement.isActive && agreement.status === 'approved'
                            ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20'
                            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <span className="font-semibold text-gray-900 dark:text-white">
                                Version {agreement.version}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                agreement.agreementType === 'custom'
                                  ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
                                  : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
                              }`}>
                                {agreement.agreementType}
                              </span>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                agreement.status === 'approved'
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                                  : agreement.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
                                  : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                {agreement.status}
                              </span>
                              {agreement.isActive && agreement.status === 'approved' && (
                                <span className="px-2 py-1 text-xs font-bold rounded-full bg-green-500 text-white">
                                  ACTIVE
                                </span>
                              )}
                            </div>

                            <div className="grid grid-cols-3 gap-4 mb-2">
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Your Share</p>
                                <p className="text-lg font-bold text-green-600 dark:text-green-400">
                                  {agreement.instructorPercentage}%
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Platform Share</p>
                                <p className="text-lg font-bold text-purple-600 dark:text-purple-400">
                                  {agreement.platformPercentage}%
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Date</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                  {new Date(agreement.createdAt).toLocaleDateString()}
                                </p>
                              </div>
                            </div>
                          </div>

                          {agreement.pdfUrl && (
                            <a
                              href={agreement.pdfUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 ml-4"
                            >
                              <Download className="w-4 h-4" />
                              Download PDF
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            ) : !agreementData?.signupAgreement && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No Agreements Found
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Your instructor agreements will appear here once they're generated.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorSettings;
